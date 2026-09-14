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

   It prints the production URL. The project's is
   **https://tmacademyuk.vercel.app**.

4. Allow that domain in Firebase Auth, or Google sign-in will refuse with
   `auth/unauthorized-domain`. Firebase console → Authentication → Settings
   → Authorised domains → Add domain. Add the `*.vercel.app` production
   domain (and any custom domain you attach later). `scripts/authorize-domain.ts`
   does the same thing from the terminal with the admin key:

   ```bash
   npx tsx scripts/authorize-domain.ts tmacademyuk.vercel.app
   ```

5. Set `NEXT_PUBLIC_SITE_URL` to the production URL so the open-graph tags
   carry absolute links:

   ```bash
   printf 'https://tmacademyuk.vercel.app' | npx vercel@latest env add NEXT_PUBLIC_SITE_URL production --force
   npm run deploy
   ```

## Every deploy after that

```bash
cd ~/Documents/DIssertation/TradeMind_Academy && npm run deploy
```

`npm run deploy:preview` builds a preview URL instead, for checking a change
before it goes to participants.

Both go through `scripts/deploy.mjs`, which copies the source into a
temporary folder without `.git` and deploys that. Plain `vercel --prod` sat
BLOCKED forever on 13 Sept: a Hobby account refuses to build a deployment
whose commit author email isn't the account's own, and my commits are
signed as ogeadama@icloud.com while the Vercel login is the gmail address.
With no git metadata attached there's nothing to check. (Connecting the
GitHub repo in the Vercel dashboard is the other fix, and gives automatic
deploys on push.)

## The lesson videos

`public/videos` is a symlink to `~/Documents/DIssertation/Lessons`, 1.1 GB
of recordings. They are NOT deployed: Vercel caps a file at 100 MB and
charges for bandwidth, so `.vercelignore` leaves them out. On the live site
those lessons show the poster with the "Video coming soon" frame until the
recordings are hosted somewhere built for video (Firebase Storage in the
same project is the obvious choice, and the lesson component only needs a
base URL to prefix). Locally, `npm run dev` still serves them through the
symlink.

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
