/**
 * Refuse to start a dev server on a port that's already taken.
 *
 * Next's default is to hop to the next free port, and that's how I ended up
 * with two dev servers writing into the same .next folder and corrupting
 * each other's chunks. So both dev scripts call this first. If the port is
 * busy the app is almost certainly already running, and the message says
 * exactly what to do about it.
 */
import net from "node:net";

export function portInUse(port) {
  return new Promise((resolve) => {
    const socket = net.createConnection({ port, host: "127.0.0.1" });
    socket.once("connect", () => {
      socket.end();
      resolve(true);
    });
    socket.once("error", () => resolve(false));
  });
}

export async function guard(port, script) {
  if (await portInUse(port)) {
    console.error(
      `\n  ✖ Port ${port} is already in use, so I won't start a second server.\n` +
        `    The app is probably already running at http://localhost:${port}\n` +
        `    To restart it:  npm run stop   then   npm run ${script}\n`,
    );
    process.exit(1);
  }
}
