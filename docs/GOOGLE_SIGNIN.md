# Google sign-in

## The short version

Google is enabled on the live project (verified 11 Sept 2026, OAuth client `975617023857-qktm…`). To use it:

```bash
cd ~/Documents/DIssertation/TradeMind_Academy
npm run dev
```

Open **http://localhost:3000**. Both _Continue with Google_ (sign-in) and _Sign up with Google_ (sign-up) open the real Google account chooser.

To check the provider at any time:

```bash
npx tsx scripts/check-google.ts
```

## Why it looked broken

Until 11 September, `npm run dev` ran against the **Firebase Emulator Suite**, a local offline copy of Firebase, and real Google lived on a second command and a second port. The emulator's fake Google page (`localhost:9099/emulator/auth/handler`, "No Google.com accounts exist in the Auth Emulator") is the emulator doing its job, but seeing it on the port you thought was the real app read as "Google is broken", three times. So the roles were swapped: `npm run dev` is the real app now, and the emulator has its own command and port.

## The three modes

| Command                | Port | Firebase                 | Google popup       | Data goes to                   |
| ---------------------- | ---- | ------------------------ | ------------------ | ------------------------------ |
| `npm run dev`          | 3000 | Live `trademind-academy` | Real Google        | The cloud, permanent           |
| `npm run dev:emulator` | 3100 | Local emulator           | Fake emulator page | Your machine, wiped on restart |
| `npm run live`         | 3000 | Live `trademind-academy` | Real Google        | The cloud, permanent           |

`dev` gives you hot reload against the live project and prints a warning when it starts, so read it. `live` is a production build, which is what participants would get. `npm run dev:live` still works as an alias of `dev`.

`dev` and `dev:emulator` can run side by side. They build into separate folders (`.next` and `.next-emulator`) so they don't corrupt each other, and each refuses to start if its port is already taken.

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

Automated testing runs on the emulator: the e2e suite starts its own server on 3100 with `.env.development.local` and never reaches the cloud. The live project is what `npm run dev` and `npm run live` talk to, and `dev` announces that in the terminal when it starts. An earlier session leaked seven test users into the live project before the emulator existed; they were deleted (see `docs/DECISIONS.md`, 2026-07-16). If you want a throwaway account, use `npm run dev:emulator` on 3100.
