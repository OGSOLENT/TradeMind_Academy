# Start here

The only page you need day to day. Every block is meant to be pasted straight into Terminal.

Open Terminal and go to the project first. Every other command assumes you're here:

```bash
cd ~/Documents/DIssertation/TradeMind_Academy
```

## Run the app

Real Google sign-in, real database. This is the app.

```bash
npm run stop && npm run dev
```

Then open **http://localhost:3000**

## Kill everything

```bash
npm run stop
```

That stops every copy of the app. If you also want the local test database gone:

```bash
npm run stop:all
```

## Open the database

The database, in the Firebase console:

```bash
npm run db
```

The sign-ups (the Authentication tab):

```bash
npm run users
```

## Accessibility settings

Everything lives on the Settings page (avatar menu, top right, then Accessibility). Colour-blind candles, high contrast, font scale, the readable typeface, comfortable reading, reduce motion, calm mode (no background field or 3D), and the keyboard shortcuts list (press `?` anywhere). Choices save to the account and to the browser, so they apply before the page paints and on the sign-in page too. "Stay signed in on this device" is under Account.

## Add or change a lesson

Edit the markdown in `content/lessons/`, then push it everywhere:

```bash
npx tsx scripts/generate-content.ts && npm run seed:live && npm run deploy
```

Added a recording? Put the file in `~/Documents/DIssertation/Lessons`, add its `Video:` line, and run `node scripts/upload-videos.mjs` first.

## Deploy the live site

The public copy is at **https://tmacademyuk.vercel.app**. After you change something and want it live:

```bash
npm run deploy
```

Takes about two minutes. Details and first-time setup are in docs/DEPLOY.md.

## Check everything still works

```bash
npm run test
```

## Practice mode (optional)

A throwaway copy on a fake local database, for testing without touching anyone's real data. Google sign-in shows a plain white "Sign-in with Google.com" page there. That's the fake, and it's correct. Needs two Terminal windows.

Window 1, and leave it running:

```bash
cd ~/Documents/DIssertation/TradeMind_Academy && npm run emulators
```

Window 2, once window 1 says "All emulators ready":

```bash
cd ~/Documents/DIssertation/TradeMind_Academy && npm run seed && npm run dev:emulator
```

Then open **http://localhost:3100**. Its database is at `npm run db:local`, and it's wiped every time the emulators stop.

## When something looks wrong

Do these in order and stop when it's fixed.

1. Refresh the browser (Cmd + R).
2. `npm run stop` then `npm run dev` again.
3. `npm run stop:all`, then start again from scratch.
4. Still broken: copy the exact error text and ask.

## Three rules

- **3000 is the app. 3100 is practice.** Any other port means two copies are running. `npm run stop` and start again.
- The app refuses to start if its port is taken, instead of quietly moving to another one. That's deliberate.
- Never run `npm run build` while the app is running. It corrupts the running one.
