# Archive

Kept for the record, not used by the running system.

- `upload-videos.mjs` pushed the lesson recordings to a Vercel Blob store.
  That store went over the Hobby plan's free allowance on 22 September 2026
  and suspended itself, which took every recording on the live site down.
  The recordings are now static files served by the app itself
  (`public/videos-web`, built by `scripts/compress-videos.mjs`); see
  `docs/DEPLOY.md`. This script is the path back to a CDN if bandwidth ever
  becomes the binding constraint: the `content/video-urls.json` it writes
  overrides the local paths with no code change.
- `video-urls.blob-suspended-2026-09-22.json` is the URL map for that dead
  store, kept so the incident in `docs/DECISIONS.md` can be checked.

`scripts/blob-empty.mjs` is still live: it empties the old store, once.
