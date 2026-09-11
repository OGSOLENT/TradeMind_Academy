"use client";

import { addDoc, collection, serverTimestamp } from "firebase/firestore";
import { getFirebase } from "@/lib/firebase/client";
import { toast } from "@/components/ui/toast";
import { ResponseLogger, type ResponseEvent } from "./logger";

/**
 * The app-wide logger singleton: the Firestore transport plus toast
 * surfacing. Responses land in users/{uid}/sessions/{sid}/responses, which
 * the security rules make create-only. That's the append-only research log.
 */

async function firestoreSend(event: ResponseEvent): Promise<void> {
  // Fail fast when offline so that MY queue is the only thing retrying. If I
  // let the SDK's internal queue hold the write as well, it would deliver
  // twice on reconnect and fill the research dataset with duplicates.
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
