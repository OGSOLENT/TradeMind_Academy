# Running TradeMind Academy

Quick reference. Everything runs from the project folder:

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
| App won't load at all | `lsof -ti:3000 \| xargs kill` then re-run the Terminal 2 command above |
| "Port already in use" for emulators | `lsof -ti:8080,9099,4000 \| xargs kill` then re-run the Terminal 1 command |
| Weird data / want a clean slate | Stop the emulators (Ctrl+C in Terminal 1), start them again, then `npm run seed` |

## Common commands

```bash
npm run dev            # start the app (local, uses emulators)
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

- **`npm run dev`** always uses the local fake login (safe, offline, no real data touched) — that's why "Continue with Google" shows a plain white "Auth Emulator" box instead of the real Google screen. This is correct, not a bug.
- The **real** Google/Firebase project (`trademind-academy`) is only used in a production build — ask before testing that, since it writes to the live database.

## If something won't start

1. Copy the exact error text.
2. Confirm you're in the right folder: `pwd` should print `.../TradeMind_Academy`.
3. Ask — paste the error and what command you ran.
