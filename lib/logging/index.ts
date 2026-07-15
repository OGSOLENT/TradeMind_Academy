"use client";

import { addDoc, collection, serverTimestamp } from "firebase/firestore";
import { getFirebase } from "@/lib/firebase/client";
import { toast } from "@/components/ui/toast";
import { ResponseLogger, type ResponseEvent } from "./logger";

/**
 * App-wide logger singleton: Firestore transport + toast surfacing.
 * Responses land in users/{uid}/sessions/{sid}/responses (create-only by
 * security rules — the append-only research log).
 */

async function firestoreSend(event: ResponseEvent): Promise<void> {
  // Fail fast when offline so OUR queue is the single retry authority —
  // letting the SDK's internal queue hold the write too would double-deliver
  // on reconnect and contaminate the research dataset with duplicates.
  if (typeof navigator !== "undefined" && !navigator.onLine) {
    throw new Error("offline — event stays in the local queue");
  }
  const { db } = getFirebase();
  const { uid, sessionId, ...payload } = event;
  await addDoc(collection(db, "users", uid, "sessions", sessionId, "responses"), {
    ...payload,
    ts: event.ts,
    serverTs: serverTimestamp(),
  });
}

let singleton: ResponseLogger | null = null;
let erroredOnce = false;

export function getLogger(): ResponseLogger {
  if (!singleton) {
    singleton = new ResponseLogger({
      send: firestoreSend,
      onError: (_err, queued) => {
        if (!erroredOnce) {
          erroredOnce = true;
          toast({
            title: "Answers queued",
            description: `${queued} response${queued === 1 ? "" : "s"} waiting to sync — nothing is lost.`,
            variant: "warning",
          });
        }
      },
      onFlushed: (remaining) => {
        if (erroredOnce && remaining === 0) {
          erroredOnce = false;
          toast({ title: "All answers synced", variant: "success" });
        }
      },
    });
    singleton.start();
  }
  return singleton;
}
