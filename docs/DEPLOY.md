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

The recordings are ordinary static files inside the app, at
`public/videos-web`, served by Vercel's CDN like any other asset and cached
for a year (`next.config.mjs`). There is no separate media service.

They did live in a public Vercel Blob store (`tmacademy-lessons`). On 22
September 2026 that store suspended itself: the 36 originals came to
1.15 GB, the Hobby plan's free Blob storage allowance is 1 GB, and once
over it every public read returns `403 store_suspended`. Every recording
on the live site went dead at once, and writes were blocked too, so it
couldn't be fixed by deleting a few files. Hosting them in the app removes
that whole class of failure: Hobby's 100 GB of bandwidth a month is the
only limit, and it isn't a quota that can switch the videos off.

Two layers now:

- `public/videos` is a symlink to `~/Documents/DIssertation/Lessons`, the
  untouched originals (1.23 GB). Never deployed, `.vercelignore` blocks it.
- `public/videos-web` is the same 36 lessons re-encoded to 286 MB by
  `scripts/compress-videos.mjs` (x264 CRF 28, 64 kbps mono AAC,
  `+faststart`). 4.4x smaller with no visible difference, checked frame by
  frame at 2x zoom on the smallest chart text. Deployed; gitignored, so a
  clone stays small.

So adding a recording is:

```bash
# drop File.mp4 into ~/Documents/DIssertation/Lessons, add the Video: line
npm run videos:compress      # encodes only what's missing
npx tsx scripts/generate-content.ts
npm run seed:live            # or npm run seed for the emulator
npm run deploy
```

`content/video-urls.json` is still honoured if present: if the recordings
ever move to a CDN, write that file and the generator will use it instead
of the local path, with no code change. The old blob map is parked at
`content/video-urls.json.blob-suspended-2026-09-22`.


It needs `BLOB_READ_WRITE_TOKEN` in `.env.local`, which `vercel blob
create-store` (or `vercel env pull`) writes. The store is public so the
`<video>` element can stream the files directly from Vercel's CDN.

If the recordings ever have to come down (`NEXT_PUBLIC_VIDEOS_AVAILABLE=false`
on Vercel), the lesson page drops the recording block and the walkthrough
becomes the hero, so nothing shows a dead player.

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
