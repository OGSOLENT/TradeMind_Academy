# Google sign-in

## The short version

Google is enabled on the live project (verified 11 Sept 2026, OAuth client `975617023857-qktm…`). To use it:

```bash
cd ~/Documents/DIssertation/TradeMind_Academy
npm run dev:live
```

Open **http://localhost:3001**. Both _Continue with Google_ (sign-in) and _Sign up with Google_ (sign-up) open the real Google account chooser.

To check the provider at any time:

```bash
npx tsx scripts/check-google.ts
```

## Why it looked broken

`npm run dev` runs against the **Firebase Emulator Suite**, a local offline copy of Firebase. Its fake Google page (`localhost:9099/emulator/auth/handler`, "No Google.com accounts exist in the Auth Emulator") is the emulator doing its job. It lets you test the _flow_ without a real account. It never shows real Google, no matter what's enabled in the console.

Real Google sign-in only appears when the app points at the live project, `trademind-academy`.

## The three modes

| Command            | Port | Firebase                 | Google popup       | Data goes to                   |
| ------------------ | ---- | ------------------------ | ------------------ | ------------------------------ |
| `npm run dev`      | 3000 | Local emulator           | Fake emulator page | Your machine, wiped on restart |
| `npm run dev:live` | 3001 | Live `trademind-academy` | Real Google        | The cloud, permanent           |
| `npm run live`     | 3001 | Live `trademind-academy` | Real Google        | The cloud, permanent           |

`dev:live` gives you hot reload against the live project. `live` is a production build, which is what participants would get. Both show a small amber badge at the bottom of every page, **"Live project: trademind-academy. Real data."**, so you can't mistake which database you're writing to. The badge never renders in a production build and never renders on the emulator.

`dev` and `dev:live` can run side by side. They build into separate folders (`.next` and `.next-live`) so they don't corrupt each other.

## What happens on a Google sign-up

The 18+ gate is a Firestore rule, not just a checkbox, so a Google sign-up has to go through it too:

1. On the sign-up page the checkbox must be ticked before _Sign up with Google_ does anything. If it isn't, you get the same error the email form gives.
2. After Google returns, the app creates the profile with `isAdult: true` and sends you to the consent screen.
3. If you already had an account, it skips profile creation and sends you to the dashboard, or to consent if you never gave it.

A first-time Google user who arrives via the _sign-in_ page instead gets asked to confirm 18+ on the consent screen, which creates the profile there. Either way nobody gets a profile without attesting.

## If a Google popup fails

The app now says why, rather than calling everything a cancellation:

| Message                                                        | Cause                   | Fix                                                         |
| -------------------------------------------------------------- | ----------------------- | ----------------------------------------------------------- |
| Google sign-in was cancelled                                   | You closed the popup    | Try again                                                   |
| Your browser blocked the Google popup                          | Popup blocker           | Allow popups for localhost                                  |
| Google sign-in isn't switched on for this Firebase project yet | Provider disabled       | Console → Authentication → Sign-in method → Google → Enable |
| This domain isn't authorised                                   | Hosting on a new domain | Console → Authentication → Settings → Authorised domains    |

## Enabling the provider (already done, kept for reference)

This can't be scripted. The Admin API refuses to enable Google without an OAuth client ID, and only the console creates one for you.

1. https://console.firebase.google.com/project/trademind-academy/authentication/providers
2. Click **Google**, toggle **Enable**
3. Public-facing name `TradeMind Academy`, pick your support email
4. **Save**, then run `npx tsx scripts/check-google.ts`

## Putting it on the internet

For participants on their own devices, `npx firebase-tools deploy` after adding a hosting block to `firebase.json`. The `.web.app` and `.firebaseapp.com` domains are already authorised. A custom domain has to be added under Authorised domains or the popup is blocked.

## Other providers

Apple needs a paid Apple Developer membership. GitHub, Facebook and X each need an app registered on their own developer site. Email plus Google is what the ethics documentation describes, and adding providers widens the data-sharing surface for no research benefit.

## Keep development and research data separate

Development and testing run on the emulator. The live project is reserved for real participant sessions. This is enforced by configuration: `.env.development.local` points at the emulator and plain `npm run dev` cannot reach the cloud. `dev:live` is the one sanctioned exception and it announces itself in the terminal and on screen. An earlier session leaked seven test users into the live project before this split existed; they were deleted and the split added (see `docs/DECISIONS.md`, 2026-07-16).
