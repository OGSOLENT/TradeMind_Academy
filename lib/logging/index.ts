"use client";

import { addDoc, collection, serverTimestamp } from "firebase/firestore";
import { getFirebase } from "@/lib/firebase/client";
import { toast } from "@/components/ui/toast";
import { firebaseCode } from "@/lib/firebase/errors";
import { ResponseLogger, type ResponseEvent } from "./logger";

async function firestoreSend(event: ResponseEvent): Promise<void> {
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
      isPermanent: (err) => ["permission-denied", "invalid-argument"].includes(firebaseCode(err)),
      onDeadLetter: (event, err) => {
        console.error("[logger] response refused by the server, parked", event.itemId, err);
        toast({
          title: "One answer couldn't be saved",
          description: "It's kept on this device and will be retried next time. Your other answers are saved.",
          variant: "warning",
        });
      },
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
