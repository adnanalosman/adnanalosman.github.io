# Adnan Alosman — Personal Portfolio

A restrained, bilingual portfolio presenting Adnan's professional work in data operations and reporting alongside his ongoing, self-taught C++ learning journey.

**Live website:** https://adnanalosman.github.io/  
**Local content editor** (run `npm run dev` first): http://127.0.0.1:3000/admin/  
**Languages:** English (default) and Arabic with native RTL layout.

## Design and implementation

- Static, pre-rendered HTML with modern CSS and small, framework-free JavaScript.
- Independent English and Arabic URLs, translated metadata, canonical URLs, hreflang, sitemap and ProfilePage structured data.
- Light and dark modes; system preference on first visit, with an optional local preference remembered in the browser.
- Responsive navigation, keyboard focus states, skip link, semantic headings, reduced-motion support and native expandable project details.
- Self-hosted Noto fonts; no external font or analytics requests.
- No trackers or backend. No credentials or private contact information are committed. The public portfolio has no contact form.
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

Open the [content editor](http://127.0.0.1:3000/admin/) to edit profile text and projects without writing JSON. The Arabic interface includes independent English/Arabic content fields, project ordering, local drafts, JSON import/export, and desktop/mobile previews in both themes. Editing is local until **Review and publish** is selected.

Publishing requires a fine-grained GitHub personal access token belonging to `adnanalosman`, limited to **this repository only**, with **Contents: Read and write**. Choose an expiration date. The editor explains setup in its publish dialog; [ADMIN.md](ADMIN.md) has the Arabic walkthrough. Signing into github.com does not authorize this independent static page.

The token is used only for the current publish attempt, is cleared from the input immediately, and is never written to local/session storage, exported JSON or repository files. Requests go only to `https://api.github.com`. The editor code and public profile data are publicly readable; GitHub permissions protect writes. `noindex` is not access control. Do not put confidential data in drafts, exports or this public repository.

One commit updates both JSON files, the generated English/Arabic pages together. The renderer is shared with the local build, so Pages publishes the result without an Actions build token. A changed remote branch stops publication instead of overwriting newer work. If that happens, export the draft, reload current content, and reapply the intended changes.

For manual changes:

| File | Purpose |
| --- | --- |
| `data/profile.json` | Professional profile, expertise, experience, learning journey, URLs and both translations |
| `data/projects.json` | Project descriptions, status, features, learning notes, limitations and source links |
| `src/style.css` | Layout, theme colors, responsive behavior, typography and RTL |
| `src/app.js` | Theme toggle, mobile navigation and profile-link copy button |
| `src/theme-init.js` | Early theme selection, avoiding a theme flash |
| `src/content-renderer.js` | Shared pure renderer for local builds and browser publication |
| `src/content-model.js` | Content schema, validation and fixed repository/site configuration |
| `admin/` | Content editor UI and GitHub API client |
| `scripts/build.mjs` | Generates both language pages and metadata |
| `docs/` | Generated, ready-to-publish static files; do not edit directly |
| `CONTENT-SOURCES.md` | Basis for claims and repository-review boundaries |

After editing either JSON file, run `npm run build` and `npm test`, then commit both the source changes and generated `docs/` files. GitHub Pages can publish directly from `main` → `/docs`; there are no build dependencies to maintain.

Each project entry has a stable `id`, repository URL, exact source URL, tags and parallel `en` / `ar` content. To add a project, use the editor or copy an existing entry and supply verified content in both languages. The renderer automatically creates its card; new IDs use a neutral code visual. Customize `projectVisual()` only if a new illustration is wanted. `experienceYears` and `experienceOrg` control the shared experience statistic and organization label.

Do not label projects complete merely because a repository exists. Recheck the implementation when changing claims. Keep future learning goals distinct from present skills. Employer data, private documents and client records must not be added to this public repository.

### Contact information

`contactEmail` is intentionally `null`. The site links only to the owner's public GitHub profile. The editor requires a separate confirmation before publishing a new email address. For manual changes, add an email only after the owner explicitly approves publication, then rebuild. No contact form is displayed because no message-delivery service has been configured.

## GitHub Pages deployment

This project is published from the dedicated public repository [adnanalosman/adnanalosman.github.io](https://github.com/adnanalosman/adnanalosman.github.io). English is at the root address, and Arabic is at [adnanalosman.github.io/ar/](https://adnanalosman.github.io/ar/).

Pages is configured for **Deploy from a branch → main → /docs**, with HTTPS enforced. To reproduce the configuration in a separate new repository:

1. Open the new repository's **Settings → Pages**.
2. Under **Build and deployment**, choose **Deploy from a branch**.
3. Select **main** and **/docs**, then **Save**.
4. Wait for the Pages deployment to finish and open the URL shown by GitHub.

This editor is intentionally tied to `adnanalosman/adnanalosman.github.io`. To reuse the project elsewhere, update `REPOSITORY` and `SITE_URL` in `src/content-model.js`, the owner check in `admin/github-client.js`, `siteUrl` in the profile, and the fixed repository links before rebuilding. Assets use relative local paths.

GitHub's official guide: https://docs.github.com/en/pages/getting-started-with-github-pages/configuring-a-publishing-source-for-your-github-pages-site

## Verification

`npm test` checks generated local links and assets, fragment targets, unique IDs, language and RTL metadata, structured data, project count, source URLs, contact privacy and core text contrast. Editor tests also cover schema validation, text escaping, Unicode data, synchronized output, credential destinations, mocked atomic commits, conflicts, permission errors and uncertain network responses. Browser checks cover responsive layout, editing, preview, draft recovery and JSON backup round trips.

These tests do not establish a Lighthouse score or comprehensive accessibility certification. Public deployment and browser checks are recorded separately in `QA.md`.

## Attribution

The learning path and course material belong to Dr. Mohammed Abu-Hadhoud and Programming Advices. This independent portfolio does not imply endorsement. Project descriptions were checked against the owner's public repository contents on **17 November 2026**.

The Noto fonts are distributed under the SIL Open Font License; the bundled license is in `assets/FONT-LICENSE.txt` and is included in the published assets. Brand marks and profile content remain the owner's. This portfolio was developed with AI assistance; the frontend implementation should not be treated as evidence that the owner independently authored a professional frontend application.
