# Adnan Alosman — Personal Portfolio

A restrained, bilingual portfolio presenting Adnan's professional work in data operations and reporting alongside his ongoing, self-taught C++ learning journey.

**Live website:** https://adnanalosman.github.io/  
**Languages:** English (default) and Arabic with native RTL layout.

## Design and implementation

- Static, pre-rendered HTML with modern CSS and small, framework-free JavaScript.
- Independent English and Arabic URLs, translated metadata, canonical URLs, hreflang, sitemap and ProfilePage structured data.
- Light and dark modes; system preference on first visit, with an optional local preference remembered in the browser.
- Responsive navigation, keyboard focus states, skip link, semantic headings, reduced-motion support and native expandable project details.
- Self-hosted Noto fonts; no external font or analytics requests.
- No trackers, forms, backend, API keys or private contact information.
- Project cards link to the actual repositories and reviewed source files. Console projects are not presented as live web demos.

## Run locally

Requires **Node.js 20 or later**. No package installation is needed.

```sh
npm run build
npm test
npm run dev
```

The preview server uses port `3000` by default. Use `PORT` to change it. The generated site is in `docs/`.

## Update the content

| File | Purpose |
| --- | --- |
| `data/profile.json` | Professional profile, expertise, experience, learning journey, URLs and both translations |
| `data/projects.json` | Project descriptions, status, features, learning notes, limitations and source links |
| `src/style.css` | Layout, theme colors, responsive behavior, typography and RTL |
| `src/app.js` | Theme toggle, mobile navigation and profile-link copy button |
| `src/theme-init.js` | Early theme selection, avoiding a theme flash |
| `scripts/build.mjs` | Generates both language pages and metadata |
| `docs/` | Generated, ready-to-publish static files; do not edit directly |
| `CONTENT-SOURCES.md` | Basis for claims and repository-review boundaries |

After editing either JSON file, run `npm run build` and `npm test`, then commit both the source changes and generated `docs/` files. GitHub Pages can publish directly from `main` → `/docs`; there are no build dependencies to maintain.

Each project entry has a stable `id`, repository URL, exact source URL, tags and parallel `en` / `ar` content. To add a project, copy an existing entry and supply verified content in both languages. The renderer automatically creates its card; new IDs use the generic algorithms-style visual. Customize `projectVisual()` only if a new illustration is wanted.

Do not label projects complete merely because a repository exists. Recheck the implementation when changing claims. Keep future learning goals distinct from present skills. Employer data, private documents and client records must not be added to this public repository.

### Contact information

`contactEmail` is intentionally `null`. The site links only to the owner's public GitHub profile. Add an email only after the owner explicitly approves publishing that address, then rebuild. No form is displayed because no message-delivery service has been configured.

## GitHub Pages deployment

This project is published from the dedicated public repository [adnanalosman/adnanalosman.github.io](https://github.com/adnanalosman/adnanalosman.github.io). English is at the root address, and Arabic is at [adnanalosman.github.io/ar/](https://adnanalosman.github.io/ar/).

Pages is configured for **Deploy from a branch → main → /docs**, with HTTPS enforced. To reproduce the configuration in a separate new repository:

1. Open the new repository's **Settings → Pages**.
2. Under **Build and deployment**, choose **Deploy from a branch**.
3. Select **main** and **/docs**, then **Save**.
4. Wait for the Pages deployment to finish and open the URL shown by GitHub.

If using a different repository name, change `siteUrl` in `data/profile.json` to the complete project Pages URL, including the repository path, before rebuilding. The pages use relative local assets, so deployment in a subdirectory is supported.

GitHub's official guide: https://docs.github.com/en/pages/getting-started-with-github-pages/configuring-a-publishing-source-for-your-github-pages-site

## Verification

`npm test` checks generated local links and assets, fragment targets, unique IDs, language and RTL metadata, structured data, project count, source URLs, contact privacy and core text contrast. Browser checks should cover mobile, tablet and desktop layouts; both themes and languages; navigation; all project disclosures; keyboard operation; and clipboard feedback.

These tests do not establish a Lighthouse score or comprehensive accessibility certification. Public deployment and browser checks are recorded separately in `QA.md`.

## Attribution

The learning path and course material belong to Dr. Mohammed Abu-Hadhoud and Programming Advices. This independent portfolio does not imply endorsement. Project descriptions were checked against the owner's public repository contents on **17 November 2026**.

The Noto fonts are distributed under the SIL Open Font License; the bundled license is in `assets/FONT-LICENSE.txt` and is included in the published assets. Brand marks and profile content remain the owner's. This portfolio was developed with AI assistance; the frontend implementation should not be treated as evidence that the owner independently authored a professional frontend application.
