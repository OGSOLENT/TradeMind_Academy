# Start here

The only page you need day to day. Every block is meant to be pasted straight into Terminal.

Open Terminal and go to the project first. Every other command assumes you're here:

```bash
cd ~/Documents/DIssertation/TradeMind_Academy
```

## Kill everything

```bash
npm run stop
```

That stops every copy of the app (ports 3000 to 3003) and leaves the local database alone. If you want the local database gone too:

```bash
npm run stop:all
```

## Run the real app

Real Google sign-in, real database, real people's data. This is the one to show.

```bash
npm run stop && npm run dev:live
```

Then open **http://localhost:3001**

## Run the practice app

Fake login, throwaway data, nothing real is touched. Needs two Terminal windows.

Window 1, and leave it running:

```bash
cd ~/Documents/DIssertation/TradeMind_Academy && npm run emulators
```

Window 2, once window 1 says "All emulators ready":

```bash
cd ~/Documents/DIssertation/TradeMind_Academy && npm run seed && npm run dev
```

Then open **http://localhost:3000**

The local database is wiped every time the emulators stop. So after a restart you'll need `npm run seed` again and a new sign-up. That's normal.

## Open the database

Real database (opens the Firebase console in your browser):

```bash
npm run db
```

Real sign-ups (the Authentication tab in the console):

```bash
npm run users
```

Local practice database (only works while the emulators are running):

```bash
npm run db:local
```

## Check everything still works

```bash
npm run test
```

## When something looks wrong

Do these in order and stop when it's fixed.

1. Refresh the browser (Cmd + R).
2. `npm run stop` then start again from "Run the real app" or "Run the practice app".
3. `npm run stop:all`, then start again from scratch.
4. Still broken: copy the exact error text and ask.

## Three rules

- **3001 is real. 3000 is practice.** If you see any other port in the address bar, two copies are running. `npm run stop` and start again.
- The app will now refuse to start if its port is taken, instead of quietly moving to another one. That's deliberate.
- Never run `npm run build` while the app is running. It corrupts the running one.
