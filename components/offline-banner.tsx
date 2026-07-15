"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";

/** Amber banner while offline — answers keep queueing, nothing is lost. */
export function OfflineBanner() {
  const [offline, setOffline] = useState(false);

  useEffect(() => {
    setOffline(!navigator.onLine);
    const on = () => setOffline(false);
    const off = () => setOffline(true);
    window.addEventListener("online", on);
    window.addEventListener("offline", off);
    return () => {
      window.removeEventListener("online", on);
      window.removeEventListener("offline", off);
    };
  }, []);

  return (
    <AnimatePresence>
      {offline && (
        <motion.div
          role="status"
          initial={{ y: -40 }}
          animate={{ y: 0 }}
          exit={{ y: -40 }}
          transition={{ duration: 0.25 }}
          className="fixed inset-x-0 top-0 z-[60] bg-warning/15 px-4 py-2 text-center text-sm text-warning backdrop-blur-sm"
        >
          You&apos;re offline — keep going, your answers are queued and will sync on reconnect.
        </motion.div>
      )}
    </AnimatePresence>
  );
}
