# Deploying to Vercel

The app is a Next.js 14 site talking to the live Firebase project from the
browser. There's no server-side secret: the six `NEXT_PUBLIC_FIREBASE_*`
values are public client identifiers, and the data is protected by
`firestore.rules`. So a deployment is: build on Vercel, give it those six
values, and tell Firebase Auth that the new domain is allowed to sign
people in.

## One-time setup

1. Log in (opens a browser or sends an email link, so it has to be you):

   ```bash
   cd ~/Documents/DIssertation/TradeMind_Academy && npx vercel@latest login
   ```

2. Link the folder to a Vercel project and push the environment variables.
   The values are the ones in `.env.production.local`:

   ```bash
   npx vercel@latest link --yes
   for k in NEXT_PUBLIC_FIREBASE_API_KEY NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN NEXT_PUBLIC_FIREBASE_PROJECT_ID NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID NEXT_PUBLIC_FIREBASE_APP_ID; do
     v=$(grep "^$k=" .env.production.local | cut -d= -f2-)
     printf '%s' "$v" | npx vercel@latest env add "$k" production --force
     printf '%s' "$v" | npx vercel@latest env add "$k" preview --force
   done
   printf 'false' | npx vercel@latest env add NEXT_PUBLIC_USE_FIREBASE_EMULATORS production --force
   printf 'false' | npx vercel@latest env add NEXT_PUBLIC_USE_FIREBASE_EMULATORS preview --force
   ```

3. Deploy:

   ```bash
   npm run deploy
   ```

   It prints the production URL (something like `https://trademind-academy.vercel.app`).

4. Allow that domain in Firebase Auth, or Google sign-in will refuse with
   `auth/unauthorized-domain`. Firebase console → Authentication → Settings
   → Authorised domains → Add domain. Add the `*.vercel.app` production
   domain (and any custom domain you attach later). `scripts/authorize-domain.ts`
   does the same thing from the terminal with the admin key:

   ```bash
   npx tsx scripts/authorize-domain.ts trademind-academy.vercel.app
   ```

5. Set `NEXT_PUBLIC_SITE_URL` to the production URL so the open-graph tags
   carry absolute links:

   ```bash
   printf 'https://trademind-academy.vercel.app' | npx vercel@latest env add NEXT_PUBLIC_SITE_URL production --force
   npm run deploy
   ```

## Every deploy after that

```bash
cd ~/Documents/DIssertation/TradeMind_Academy && npm run deploy
```

`npm run deploy:preview` builds a preview URL instead, for checking a change
before it goes to participants.

## What the build needs to know

- `NEXT_PUBLIC_USE_FIREBASE_EMULATORS` must be `false` (or unset). If it's
  `true` the deployed site tries to reach `localhost:9099` and nothing works.
- The `prepare` script runs husky on install. Vercel has no `.git` folder
  when deploying from the CLI, and husky 9 just prints a note and exits 0,
  so that's fine.
- Security headers and `poweredByHeader: false` live in `next.config.mjs`.
- `metadataBase` comes from `NEXT_PUBLIC_SITE_URL`, then `VERCEL_URL`, then
  localhost.

## Checks after a deploy

- Open the URL, sign in with Google, reach the dashboard.
- `npx tsx scripts/audit.ts` can be pointed at the URL for Lighthouse.
- The Firestore rules are deployed separately (`npx firebase deploy --only
  firestore:rules`) and are already live; a Vercel deploy doesn't touch them.
