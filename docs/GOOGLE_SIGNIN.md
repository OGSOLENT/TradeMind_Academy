# Enabling real Google sign-in

## Why the popup looks fake right now

`npm run dev` runs against the **Firebase Emulator Suite** — a local, offline copy of Firebase. Its fake Google page (`localhost:9099/emulator/auth/handler`) is working exactly as designed: it lets you test the sign-in *flow* without touching a real account.

Real Google sign-in only appears when the app runs against the **live** Firebase project, `trademind-academy`.

Two things are needed:

1. Turn the Google provider on in the Firebase console — **a manual step, ~2 minutes**
2. Run the app in production mode

---

## Step 1 — Enable Google (you must do this; it cannot be scripted)

The Admin API refuses to enable Google without an OAuth `client_id`, and the console creates that for you automatically. So it has to be done in the browser.

1. Open **https://console.firebase.google.com/project/trademind-academy/authentication/providers**
2. In the **Sign-in providers** list, click **Google**
3. Toggle **Enable** on
4. **Public-facing name**: `TradeMind Academy`
5. **Project support email**: pick your address from the dropdown *(required — it will not save without one)*
6. Click **Save**

That's it. The console provisions the OAuth client behind the scenes.

### Verify it worked

```bash
cd ~/Documents/DIssertation/TradeMind_Academy && npx tsx scripts/check-google.ts
```

It prints `google.com: ENABLED` when the step succeeded.

---

## Step 2 — Run against the live project

Development mode is hard-wired to the emulator, so use a production build:

```bash
cd ~/Documents/DIssertation/TradeMind_Academy
npm run build
PORT=3001 npm run start
```

Open **http://localhost:3001** and click *Continue with Google* on the sign-in page. You'll get the real Google account chooser.

> `localhost` is already in the project's authorised domains, so no extra configuration is needed for local testing.

### Which mode am I in?

| | Development | Production |
|---|---|---|
| Command | `npm run dev` | `npm run build && npm run start` |
| Firebase | Local emulator | Live `trademind-academy` |
| Google popup | Plain white "Auth Emulator" page | Real Google account chooser |
| Data goes to | Your machine, wiped on restart | The cloud, permanent |

---

## Step 3 (later) — Putting it on the internet

For participants to use it from their own devices:

```bash
npx firebase-tools deploy
```

This needs a `firebase.json` hosting block and Next.js configured for it — ask when you're ready and it's a short job. Your `.web.app` and `.firebaseapp.com` domains are already authorised. If you use a custom domain, add it under **Authentication → Settings → Authorised domains** or the popup will be blocked.

---

## What about Apple, GitHub, Facebook?

Each is enabled the same way (same console page), but:

- **Apple** requires a paid **Apple Developer Program** membership (£79/year). Enabling the toggle alone does nothing without it.
- **GitHub / Facebook / X** each need an app registered on their own developer site to obtain a client ID and secret, which you then paste into Firebase.

For a dissertation artefact, **email/password plus Google is enough** and is what the ethics documentation describes. Adding more providers widens the data-sharing surface you'd have to justify in the ethics section, for no research benefit.

---

## Keep development and research data separate

The split is deliberate and worth stating in the write-up:

- **Development and testing** always run on the emulator, so no test account can ever pollute the research dataset.
- **The live project** is reserved for real participant sessions.

This is enforced by configuration, not discipline: `.env.development.local` points at the emulator and `npm run dev` cannot reach the cloud. (An earlier session leaked seven test users into the live project before this split existed; they were deleted and the split added — see `docs/DECISIONS.md`, 2026-07-16.)
