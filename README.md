# Worldview - Empty static starter

A camera-free public Worldview starter. json/cameras.json contains exactly zero records.

This folder is the entire application. No Python, Flask, Docker, login, private catalog, environment variables, build step, or backend API is required. There are no CDN dependencies. It makes direct browser media requests only after a visitor presses Play. All published playback addresses are public and copyable.

## Files

- `index.html`: accessible Worldview shell, branding, search, filters, pagination and empty state.
- `css/style.css`: responsive desktop/mobile styling.
- `js/app.js`: local JSON validation, search, country/region/scene/feed-type filters, 12-card pagination, safe text rendering.
- `js/players.js`: direct snapshots, native/Hls.js HLS, and looping recorded clips with controls and failure messages.
- `json/cameras.json`: the only camera collection; no API needed.
- `assets/vendor/`: bundled Hls.js and its MIT license. Preserve the license when copying.
- `.nojekyll`: tells GitHub Pages to serve the files directly.
- `verification/`: saved test/authorization report; not required at runtime.

## Run the app locally

There is no install or build step. You only need a local static HTTP server because browsers block the app's JavaScript module and JSON request when `index.html` is opened directly with `file://`.

1. Open a terminal in this project folder.
2. Start a server with one of these options:

   **Python 3**

   ```powershell
   python -m http.server 8090 --bind 127.0.0.1
   ```

   **Node.js** (downloads `http-server` the first time)

   ```powershell
   npx.cmd --yes http-server . -a 127.0.0.1 -p 8090 -c-1
   ```

   **Visual Studio Code**

   Install Microsoft's **Live Preview** extension, open `index.html`, and select **Show Preview**.

3. For the Python or Node.js option, open `http://127.0.0.1:8090` in a browser.
4. Stop the server by pressing `Ctrl+C` in the terminal.

Copying the app to another computer works as long as the entire folder and its internal structure are preserved. A generic static file server is sufficient; the app has no backend, environment variables, or runtime dependencies. No reference to the original CCTV project is used.

## GitHub Pages - separate repository

1. Create a new empty GitHub repository for this folder alone. Do not initialize or publish the parent CCTV project.
2. Copy/upload the **contents** of this folder to the repository root: `index.html` must be at the root, not nested inside another Worldview folder.
3. Commit those files to `main`.
4. Repository Settings - Pages - Build and deployment - Deploy from a branch - `main` - `/(root)` - Save.
5. Open the Pages URL and check JSON loading, search, filters and media in Chrome. Relative paths support repository subpaths.

Official instructions: https://docs.github.com/en/pages/getting-started-with-github-pages/configuring-a-publishing-source-for-your-github-pages-site

## Render - Static Site, separate repository

1. Push only this folder's contents to its own repository, as above.
2. Render dashboard - New - **Static Site** - connect that repository and select `main`.
3. Root Directory: leave blank (repository root). Build Command: `echo Static site ready`. Publish Directory: `.`.
4. No start command, Python runtime, secrets, Dockerfile or web service is needed. Create Static Site when you are ready; this task did not deploy it.
5. Verify the HTTPS site and `json/cameras.json`. No SPA catch-all rewrite is required.

Static sites consume the workspace's included outbound bandwidth and pipeline minutes; check current limits and usage in Render Dashboard. Direct provider media uses provider bandwidth, subject to its policies; bundled files use hosting bandwidth. Static hosting does not solve provider CORS, authentication, availability or media licensing.

Official instructions: https://render.com/docs/static-sites

## Add, replace or update a record

Edit `json/cameras.json` as a JSON array. Each record requires these fields (all strings):

```json
{
  "id": "public-camera-001",
  "name": "My permitted camera",
  "country": "CA",
  "region": "British Columbia",
  "city": "Example location",
  "category": "Coast",
  "type": "SNAPSHOT",
  "status": "placeholder",
  "playback_url": "",
  "attribution": ""
}
```

Use your own new public ID, never an internal review ID. Types: `SNAPSHOT`, `HLS`, `VIDEO_LOOP`. A placeholder must have an empty URL and makes no provider request. After establishing permission for the exact image/stream and public direct embedding, set `status` to `published`, set `playback_url` to the permitted HTTPS media URL (or a same-origin relative asset), and provide any required public attribution. `published` is a display setting, **not proof of a license**. Keep license evidence privately. Never put keys, tokens, credentials, private notes, or signed confidential URLs here.

The initial array is empty. Add only the cameras you intend to publish. The viewer generates filter options from the collection; unsupported types, duplicate IDs, unsafe URL schemes and invalid JSON show a collection error instead of partially publishing records. JSON content is rendered as text, not HTML.

## Direct playback limitations and checks

A successful download or HTTP 200 is not evidence of decoded/advancing video. In Chrome press Play: snapshots must have nonzero natural dimensions; videos must decode frames and advance time. HLS playlists, variants, keys and segments must all permit cross-origin browser requests and use browser-supported codecs. Browser image/video elements sometimes work without CORS where Hls.js cannot; browser errors may not reveal the exact cause.

Record provider 401/403/429 separately from CORS errors, unavailable endpoints and codec/decode failures. Check DevTools Network/Console. Do not proxy, forge headers, disclose authentication, or bypass restrictions. Autoplay is not assumed; playback starts on a click. Snapshot refresh is manual to avoid automatic polling abuse. Recorded clips always show **Recorded clip** / **not live**. HLS is labeled HLS video because a playlist alone does not establish live freshness. Changing filters/pages stops existing players.

No real feed has been claimed to work directly in these releases. Generated-media QA tests are documented separately from real-feed authorization.

## Saved verification

See [verification/REPORT.md](verification/REPORT.md), results.json and the desktop/mobile screenshots. verification/media contains only generated QA test patterns, not camera feeds, and is not referenced by the viewer. The optional verification script requires developer tools; the static website does not.
