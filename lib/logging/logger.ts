/**
 * The response logger — treat like a payments system (BUILD_PROMPT §0.2).
 *
 * enqueue() → localStorage persist → optimistic return → background flush
 * with exponential backoff. A failed write surfaces onError (the UI shows a
 * toast) and the event is RE-QUEUED, never dropped. Unflushed events survive
 * refresh via localStorage and flush on the next start()/online event.
 *
 * Pure of Firebase: the transport is injected, so unit tests drive the queue
 * with a fake sender and the app injects a Firestore addDoc sender.
 */

export interface ResponseEvent {
  uid: string;
  sessionId: string;
  itemId: string;
  kcId: string;
  questionType: string;
  correct: boolean;
  selected: unknown;
  latencyMs: number;
  pLBefore: number;
  pLAfter: number;
  ts: number; // epoch ms at answer time (server timestamp added by transport)
}

export type SendFn = (event: ResponseEvent) => Promise<void>;

interface LoggerOptions {
  send: SendFn;
  storageKey?: string;
  /** Backoff base in ms (doubles per consecutive failure, capped). */
  backoffBaseMs?: number;
  backoffCapMs?: number;
  onError?: (error: unknown, queuedCount: number) => void;
  onFlushed?: (remaining: number) => void;
}

interface QueuedEvent {
  id: string;
  event: ResponseEvent;
}

export class ResponseLogger {
  private queue: QueuedEvent[] = [];
  private inFlight: Promise<void> | null = null;
  private failures = 0;
  private timer: ReturnType<typeof setTimeout> | null = null;
  private readonly opts: Required<Pick<LoggerOptions, "storageKey" | "backoffBaseMs" | "backoffCapMs">> &
    LoggerOptions;

  constructor(options: LoggerOptions) {
    this.opts = {
      storageKey: "tm-response-queue",
      backoffBaseMs: 1_000,
      backoffCapMs: 30_000,
      ...options,
    };
    this.restore();
  }

  /** Number of events not yet confirmed written. */
  get pending(): number {
    return this.queue.length;
  }

  /** Append an event. Returns immediately (optimistic UI). */
  enqueue(event: ResponseEvent): void {
    this.queue.push({ id: `${event.ts}-${Math.random().toString(36).slice(2, 8)}`, event });
    this.persist();
    void this.flush();
  }

  /** Flush the queue in order. Concurrent calls await the same in-flight run. */
  flush(): Promise<void> {
    if (!this.inFlight) {
      this.inFlight = this.drain().finally(() => {
        this.inFlight = null;
      });
    }
    return this.inFlight;
  }

  private async drain(): Promise<void> {
    while (this.queue.length > 0) {
      const head = this.queue[0]!;
      try {
        await this.opts.send(head.event);
        this.queue.shift();
        this.failures = 0;
        this.persist();
        this.opts.onFlushed?.(this.queue.length);
      } catch (err) {
        this.failures++;
        this.opts.onError?.(err, this.queue.length);
        this.scheduleRetry();
        return; // keep head queued — never drop
      }
    }
  }

  private scheduleRetry(): void {
    if (this.timer) clearTimeout(this.timer);
    const delay = Math.min(
      this.opts.backoffCapMs,
      this.opts.backoffBaseMs * 2 ** Math.max(0, this.failures - 1),
    );
    this.timer = setTimeout(() => {
      this.timer = null;
      void this.flush();
    }, delay);
  }

  private persist(): void {
    try {
      if (typeof localStorage === "undefined") return;
      localStorage.setItem(this.opts.storageKey, JSON.stringify(this.queue));
    } catch {
      // storage full/unavailable — the in-memory queue still guarantees order
    }
  }

  private restore(): void {
    try {
      if (typeof localStorage === "undefined") return;
      const raw = localStorage.getItem(this.opts.storageKey);
      if (raw) this.queue = JSON.parse(raw) as QueuedEvent[];
    } catch {
      this.queue = [];
    }
  }

  /** Call once on app start: resumes any persisted queue + retries on reconnect. */
  start(): void {
    if (typeof window !== "undefined") {
      window.addEventListener("online", () => void this.flush());
    }
    void this.flush();
  }
}
