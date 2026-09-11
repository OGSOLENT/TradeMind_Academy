# Running TradeMind Academy

The longer reference. For the day-to-day basics see [START_HERE.md](START_HERE.md).
Everything runs from the project folder:

```bash
cd ~/Documents/DIssertation/TradeMind_Academy
```

## The real app

```bash
cd ~/Documents/DIssertation/TradeMind_Academy && npm run dev
```

Open **http://localhost:3000**. Real Google, real database. That's it.

## The practice copy (emulator)

Two terminal windows. Nothing here touches the cloud.

**Terminal 1** — local database + auth (leave running):
```bash
cd ~/Documents/DIssertation/TradeMind_Academy && npm run emulators
```
Wait for "All emulators ready".

**Terminal 2** — load the curriculum, then start the practice copy:
```bash
cd ~/Documents/DIssertation/TradeMind_Academy && npm run seed && npm run dev:emulator
```

Open **http://localhost:3100**.

> The emulator's data resets every time you stop it. After a fresh start you'll need `npm run seed` again and a new sign-up (old test accounts are gone — that's expected).

## Restart / refresh

| Problem | Fix |
| --- | --- |
| Page looks broken or stuck | Just refresh the browser (⌘R) first |
| App won't load at all | `npm run stop` then `npm run dev` again |
| "Port already in use" for emulators | `npm run stop:all` then re-run the Terminal 1 command. It kills twice with a pause, because Firestore runs as a Java child that can outlive the first kill and keep 8080. |
| Weird data / want a clean slate | Stop the emulators (Ctrl+C in Terminal 1), start them again, then `npm run seed` |

## Common commands

```bash
npm run dev            # the app on 3000 (live project, real Google). Refuses to start if 3000 is busy.
npm run dev:emulator   # the practice copy on 3100 (local emulators, fake login)
npm run stop           # kill every app server
npm run stop:all       # kill app servers and emulators
npm run emulators      # start local Firebase (auth + database)
npm run seed           # load the curriculum into the emulator

npm run test           # unit tests (BKT engine, routing, logger)
npm run test:rules     # security-rules tests
npm run test:e2e       # full browser journeys (needs emulators + seed; starts the 3100 server itself)

npm run lint           # code style check
npm run typecheck      # TypeScript check
npm run build           # production build
```

## Local vs. real Google account

Two servers, two ports. Which one you're on decides what "Continue with Google" does.

| URL | Command | Google button | Where data goes |
| --- | --- | --- | --- |
| **http://localhost:3000** | `npm run dev` | the real Google account chooser | the live `trademind-academy` project, permanently |
| **http://localhost:3100** | `npm run dev:emulator` | the plain white "Auth Emulator" box | the local emulator, wiped on restart |

- On **3100** the emulator box is correct, not a bug. It's there so test accounts can never reach the research dataset.
- `npm run dev:live` is kept as an alias of `npm run dev` for old habits. Same server, same port.
- `npm run live` is the production build on 3000, which is what participants would get.

## If something won't start

1. Copy the exact error text.
2. Confirm you're in the right folder: `pwd` should print `.../TradeMind_Academy`.
3. Ask — paste the error and what command you ran.
