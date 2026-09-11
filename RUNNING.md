# Running TradeMind Academy

The longer reference. For the day-to-day basics see [START_HERE.md](START_HERE.md).
Everything runs from the project folder:

```bash
cd ~/Documents/DIssertation/TradeMind_Academy
```

## Check if it's already running

Before starting anything, open **http://localhost:3000**. If it loads, you're done — skip everything below.

## Start from scratch (after a reboot)

Two terminal windows.

**Terminal 1** — local database + auth (leave running):
```bash
cd ~/Documents/DIssertation/TradeMind_Academy && npm run emulators
```
Wait for "All emulators ready".

**Terminal 2** — load the curriculum, then start the app:
```bash
cd ~/Documents/DIssertation/TradeMind_Academy && npm run seed && npm run dev
```

Open **http://localhost:3000**.

> The emulator's data resets every time you stop it. After a fresh start you'll need `npm run seed` again and a new sign-up (old test accounts are gone — that's expected).

## Restart / refresh

| Problem | Fix |
| --- | --- |
| Page looks broken or stuck | Just refresh the browser (⌘R) first |
| App won't load at all | `npm run stop` then re-run the Terminal 2 command above |
| "Port already in use" for emulators | `npm run stop:all` then re-run the Terminal 1 command. It kills twice with a pause, because Firestore runs as a Java child that can outlive the first kill and keep 8080. |
| Weird data / want a clean slate | Stop the emulators (Ctrl+C in Terminal 1), start them again, then `npm run seed` |

## Common commands

```bash
npm run dev            # start the app (local, uses emulators). Refuses to start if 3000 is busy.
npm run dev:live       # the real app on 3001 (real Google, real database)
npm run stop           # kill every app server
npm run stop:all       # kill app servers and emulators
npm run emulators      # start local Firebase (auth + database)
npm run seed           # load the 8 topics / 64 questions into the emulator

npm run test           # unit tests (BKT engine, routing, logger)
npm run test:rules     # security-rules tests
npm run test:e2e       # full browser journeys (needs emulators + seed running)

npm run lint           # code style check
npm run typecheck      # TypeScript check
npm run build           # production build
```

## Local vs. real Google account

Two servers, two ports. Which one you're on decides what "Continue with Google" does.

| URL | Command | Google button | Where data goes |
| --- | --- | --- | --- |
| **http://localhost:3000** | `npm run dev` | the plain white "Auth Emulator" box | the local emulator, wiped on restart |
| **http://localhost:3001** | `npm run dev:live` | the real Google account chooser | the live `trademind-academy` project, permanently |

- On **3000** the emulator box is correct, not a bug. It's there so test accounts can never reach the research dataset.
- For real Google, open **3001**. If nothing's there, run `npm run dev:live` in a spare terminal. It prints a warning on start because everything you do there is real.
- `npm run live` is the production build on 3001, which is what participants would get.

## If something won't start

1. Copy the exact error text.
2. Confirm you're in the right folder: `pwd` should print `.../TradeMind_Academy`.
3. Ask — paste the error and what command you ran.
