# Static release verification - 2026-11-02

Status: PASS for the static application. Real-camera publication is pending authorization.

- Collection: 0 records; 0 authorization placeholders; zero published real feeds.
- Chrome: 8 verification groups passed. See results.json and desktop.png/mobile.png.
- A relocated copy outside the parent project was served under /nested-site/; all normal requests stayed within that copied site. No original-project file or API was needed.
- Desktop 1440x1000 and mobile 390x844 passed; no horizontal document overflow. Demo mobile player text wrapping also checked.
- Demo: search, country, region, scene and feed-type filters, clear and both pages passed. Empty release: zero-card empty state passed; all four controls and search remain available. Shared player code exercised in both.
- Generated snapshot decoded to nonzero natural dimensions. Generated HLS and MP4 decoded video frames and advanced beyond 0.4 seconds. These tests intercepted the JSON response in memory; the saved release JSON remained unchanged.
- Simulated HLS HTTP 403 showed a meaningful error. Unsafe javascript: media URLs were rejected. No page JavaScript exceptions occurred.
- Real sources: zero direct-browser tests, zero real sources claimed playable or blocked. The 24 placeholders are authorization-pending, not provider failures. No inference was made from old gateway tests.
- Private scan: zero exact matches for any of the 100 original URLs or original private IDs in any output file, including bundled scripts, screenshots and binary sample media. No workbooks, databases, archives, credential files, symlinks, or private catalog were copied.
- Original 100-camera catalog remains byte-for-byte unchanged, all rights unverified. No original application, launcher, test, documentation or private file was edited.
- GitHub/Render deployment was not performed. Hosting instructions were checked against official GitHub Pages and Render Static Site documentation.

## Reproduce optional development tests

Run `python verification/check_static.py` from this copied folder after installing Playwright and Chrome and providing ffmpeg. These tools are only for development checks, never required by the website. The script generates synthetic QA media in verification/media, serves a temporary relocated copy and saves screenshots/results here. The samples are test patterns, not cameras; the HLS playlist is finite recorded media, not live.

## Files and copying

Copy the entire folder, retaining index.html, css/, js/, json/, assets/ and README.md. verification/ contains optional evidence, the test harness and generated synthetic media; the main application does not reference it. It can be omitted when publishing if test evidence and samples are not desired. No installation or build is required to deploy the static files.
