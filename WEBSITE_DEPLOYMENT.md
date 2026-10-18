# Static academic website

The website lives in `docs/`. Open `docs/index.html` directly or serve that folder with a local static HTTP server. It uses plain HTML, CSS, JavaScript, local images, and editable SVG artwork; no install or build is required.

The previous Jekyll source, assets, and repository history are retained. GitHub Pages should publish only `docs/`, so the old template does not participate in the new site.

## Release after approval

1. Confirm the reviewed content and repository `leeweekiat/leeweekiat.github.io` with the user before committing or pushing.
2. Fetch and compare the remote `master` branch before a normal push. The inspected starting commit was `6c8fcae39aee36c397d330c2f13a525d9ce52d01`; reconcile any later changes without force-pushing.
3. Commit only `docs/`, `WEBSITE_CONTENT_SOURCES.md`, and this deployment guide after checking the exact diff. Local review screenshots and test fixtures are outside this checkout.
4. Inspect Settings → Pages, then select **Deploy from a branch**, **master**, **/docs**, and save. This setting change is part of the release requiring approval.
5. Verify the Pages deployment and `https://leeweekiat.github.io/`, `/cv/`, `/publications/`, `/games/dispatch-dash/`, and the publication/profile links. Start a game and verify pickup/delivery scoring. The public URL does not include `/docs`.

The CV is HTML and includes a browser Print / save PDF button. The `/publications/` route redirects to the new homepage publication list. Source verification is recorded in `WEBSITE_CONTENT_SOURCES.md`.

The user approved the cat-courier website for release on 17 October 2026. Future releases should follow the review and approval procedure above.

On 18 October 2026 the user approved Dispatch Dash: Beat the Clock! and its homepage Interactive Lab card for publication. The game is six static files under `docs/games/dispatch-dash/`, with no build step or external dependencies. The release includes the 1.8 arrival interval multiplier, three-second deadline extension, and rounded bicycle-courier torso. The earlier three-round staffing simulator remains archived locally and is excluded from this repository. Pre-release validation passed 37 static, 30 engine and 14 UI checks.

## Cloudflare Web Analytics revision

The user-requested analytics revision adds their exact external module script once before `</body>` in each of the four public HTML pages. It is independent of the local website and game code. The user explicitly approved this revision for commit, push and live verification on 18 October 2026. All 41 static and 14 game UI checks passed, with browser navigation and game pickup/delivery smoke tests.

Local verification confirms script loading and a request from the official beacon, but localhost collection returns status 0 (network/CORS failure). Cloudflare validates the registered hostname. After approval and deployment, verify the live pages load the script, the official beacon can post to `https://cloudflareinsights.com/cdn-cgi/rum`, and page views appear in the user's Cloudflare dashboard. Keep the publications redirect immediate; its destination homepage provides the dependable measurement point. Do not alter the hostname or weaken browser security to force local collection.
