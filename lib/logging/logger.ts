/**
 * The response logger. I treat it like a payments system (BUILD_PROMPT
 * section 0.2), because the response log IS the research dataset.
 *
 * enqueue() persists to localStorage, returns straight away so the UI can be
 * optimistic, then flushes in the background with exponential backoff. A
 * failed write surfaces through onError (the UI shows a toast) and the event
 * goes BACK in the queue. Nothing is ever dropped. Anything unflushed
 * survives a refresh via localStorage and flushes on the next start() or
 * online event.
 *
 * One exception to "retry until it lands": an error the server will never
 * accept however often it's retried (the rules rejecting the row, say).
 * The queue is strictly ordered, so before the September audit a single
 * such event sat at the head forever and silently blocked every answer
 * behind it. Now the transport can mark an error as permanent; that event
 * moves to a separate dead-letter store, persisted like the queue, so it is
 * still never dropped, and the queue carries on. Dead letters get one more
 * try, at the back of the queue, each time the logger starts, in case the
 * "permanent" error was a misclassified transient one.
 *
 * No Firebase in here. The transport is injected, so the unit tests drive
 * the queue with a fake sender and the app injects a Firestore addDoc one.
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
  ts: number; // epoch ms at the moment of answering (the transport adds a server timestamp too)
}

export type SendFn = (event: ResponseEvent) => Promise<void>;

interface LoggerOptions {
  send: SendFn;
  storageKey?: string;
  /** The backoff base in ms. It doubles on each consecutive failure, up to the cap. */
  backoffBaseMs?: number;
  backoffCapMs?: number;
  onError?: (error: unknown, queuedCount: number) => void;
  onFlushed?: (remaining: number) => void;
  /** True for an error retrying cannot fix. Defaults to "none are". */
  isPermanent?: (error: unknown) => boolean;
  /** Called when an event is moved to the dead-letter store. */
  onDeadLetter?: (event: ResponseEvent, error: unknown) => void;
}

interface QueuedEvent {
  id: string;
  event: ResponseEvent;
}

export class ResponseLogger {
  private queue: QueuedEvent[] = [];
  private dead: QueuedEvent[] = [];
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

  /** How many events haven't been confirmed as written yet. */
  get pending(): number {
    return this.queue.length;
  }

  /** How many events the server refused outright and are parked, not lost. */
  get deadLettered(): number {
    return this.dead.length;
  }

  /** Append an event. Returns immediately, so the UI can carry on. */
  enqueue(event: ResponseEvent): void {
    this.queue.push({ id: `${event.ts}-${Math.random().toString(36).slice(2, 8)}`, event });
    this.persist();
    void this.flush();
  }

  /** Flush the queue in order. If a flush is already running, callers wait on that one. */
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
        if (this.opts.isPermanent?.(err)) {
          // Retrying can't help, and holding it at the head would block
          // everything behind it. Park it and keep going.
          this.queue.shift();
          this.dead.push(head);
          this.persist();
          this.opts.onDeadLetter?.(head.event, err);
          continue;
        }
        this.failures++;
        this.opts.onError?.(err, this.queue.length);
        this.scheduleRetry();
        return; // the head stays in the queue. Never drop it.
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
      localStorage.setItem(`${this.opts.storageKey}.dead`, JSON.stringify(this.dead));
    } catch {
      // Storage is full or unavailable. The in-memory queue still keeps order.
    }
  }

  private restore(): void {
    try {
      if (typeof localStorage === "undefined") return;
      const raw = localStorage.getItem(this.opts.storageKey);
      if (raw) this.queue = JSON.parse(raw) as QueuedEvent[];
      const dead = localStorage.getItem(`${this.opts.storageKey}.dead`);
      if (dead) this.dead = JSON.parse(dead) as QueuedEvent[];
    } catch {
      this.queue = [];
    }
  }

  /** Call this once when the app starts. It resumes any persisted queue and retries on reconnect. */
  start(): void {
    // One more try for anything parked last time, behind the live queue.
    if (this.dead.length) {
      this.queue.push(...this.dead);
      this.dead = [];
      this.persist();
    }
    if (typeof window !== "undefined") {
      window.addEventListener("online", () => void this.flush());
    }
    void this.flush();
  }
}
