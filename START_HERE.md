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

The live database is Cloud Firestore inside the Firebase project **trademind-academy**. It belongs to the Google account **ekeneadama2003@gmail.com**, so the browser has to be signed into that account or the console says you don't have access. Run these from the `TradeMind_Academy` folder (from anywhere else npm says "missing script"):

```bash
npm run db        # Firestore, in the Firebase console
npm run users     # the sign-ups (Authentication tab)
```

Or paste the address straight into a browser: https://console.firebase.google.com/project/trademind-academy/firestore

Quicker, and no browser: a read-only view in the terminal, with every learner, their sessions and response counts:

```bash
npm run db:peek          # production
npm run db:peek:local    # the emulator copy, while `npm run emulators` is running
```

The emulator's own console (a throwaway copy, wiped on restart) is at http://localhost:4000/firestore, or `npm run db:local`.

## Accessibility settings

Everything lives on the Settings page (avatar menu, top right, then Accessibility). Colour-blind candles, high contrast, font scale, the readable typeface, comfortable reading, reduce motion, calm mode (no background field or 3D), and the keyboard shortcuts list (press `?` anywhere). Choices save to the account and to the browser, so they apply before the page paints and on the sign-in page too. "Stay signed in on this device" is under Account.

## Add or change a lesson

Edit the markdown in `content/lessons/`, then push it everywhere:

```bash
npx tsx scripts/generate-content.ts && npm run seed:live && npm run deploy
```

Added a recording? See **The lesson videos** below: drop it in `Lessons`, add its `Video:` line, then `npm run videos:compress`, regenerate, seed and deploy.

## Deploy the live site

The public copy is at **https://tmacademyuk.vercel.app**. After you change something and want it live:

```bash
npm run deploy
```

Takes about two minutes. Details and first-time setup are in docs/DEPLOY.md.

## The lesson videos

Two folders, and only one of them is deployed:

- `public/videos` points at your `Lessons` folder. Those are the originals, 1.23 GB. Untouched, never uploaded.
- `public/videos-web` is the same 36 lessons squeezed to 286 MB. That's what the site serves.

If you add or replace a recording, drop the .mp4 in `Lessons`, add the `Video:` line to the lesson, then:

```bash
npm run videos:compress   # only encodes what's new, about 15s per video
npx tsx scripts/generate-content.ts
npm run seed:live
npm run deploy
```

They used to be hosted on Vercel Blob. That store went over its free 1 GB and Vercel suspended it, which is why every video broke on 22 September. They're part of the app now, so there's no separate service left to run out.

## Check everything still works

```bash
npm run test
```

## When the study runs

**Read `docs/RUN_THE_PILOT.md` first.** It has the script to read to participants, the session plan and the write-up checklist.

Participants sign up on the live site, do placement, work through the course, then from **Profile** take the post-test and rate the course. To pull the numbers out:

```bash
npm run analyse:live
```

That writes `docs/report/PILOT_RESULTS.md` (normalised gain, time on task, mastered modules, SUS, how the model's mastery calls held up on the post-test, and the per-component learning curves). It only reads. Needs `serviceAccountKey.json` in the project folder.

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
