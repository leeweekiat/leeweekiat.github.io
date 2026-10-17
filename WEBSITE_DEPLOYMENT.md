# Static academic website

The website lives in `docs/`. Open `docs/index.html` directly or serve that folder with a local static HTTP server. It uses plain HTML, CSS, JavaScript, local images, and editable SVG artwork; no install or build is required.

The previous Jekyll source, assets, and repository history are retained. GitHub Pages should publish only `docs/`, so the old template does not participate in the new site.

## Release after approval

1. Confirm the reviewed content and repository `leeweekiat/leeweekiat.github.io` with the user before committing or pushing.
2. Fetch and compare the remote `master` branch before a normal push. The inspected starting commit was `6c8fcae39aee36c397d330c2f13a525d9ce52d01`; reconcile any later changes without force-pushing.
3. Commit only `docs/`, `WEBSITE_CONTENT_SOURCES.md`, and this deployment guide after checking the exact diff. Local review screenshots and test fixtures are outside this checkout.
4. Inspect Settings → Pages, then select **Deploy from a branch**, **master**, **/docs**, and save. This setting change is part of the release requiring approval.
5. Verify the Pages deployment and `https://leeweekiat.github.io/`, `/cv/`, `/publications/`, and the publication/profile links. The public URL does not include `/docs`.

The CV is HTML and includes a browser Print / save PDF button. The `/publications/` route redirects to the new homepage publication list. Source verification is recorded in `WEBSITE_CONTENT_SOURCES.md`.

The user approved the cat-courier website for release on 17 October 2026. Future releases should follow the review and approval procedure above.
