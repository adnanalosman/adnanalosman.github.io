# Verification record

Date: **17 November 2026**

## Passed

- Reproducible static generation with Node.js; no dependency installation needed.
- JavaScript syntax checks for the generator and client scripts.
- Five automated test groups: English page, Arabic page, project schema/source links, core text contrast, and output size/assets.
- Local asset and navigation-fragment resolution, unique IDs, one H1 per page, canonical/hreflang metadata and structured-data parsing.
- Browser layout measurements at frame widths of **320, 375, 390, 768, 1024 and 1440 pixels**, in English and Arabic, across light and dark modes. No horizontal document overflow was observed. Browser scrollbars reduce the available content area by 15 pixels in this environment.
- Visual inspection of desktop English/light, desktop Arabic/dark, mobile English/dark, mobile Arabic/light, tablet English/light and desktop project cards.
- Mobile menu open/close, Escape dismissal, work-section navigation, all four project disclosures, language switching with the current section retained, and theme persistence across language navigation/reload.
- Profile-link copy action with a successful Arabic live-status message.
- Self-hosted fonts loaded. C++ and other Latin technical terms are directionally isolated in Arabic text.
- Browser error inspection found no application-origin errors; browser-extension metadata errors were unrelated to the site.

## Public deployment

- Created the dedicated public repository [adnanalosman/adnanalosman.github.io](https://github.com/adnanalosman/adnanalosman.github.io); existing repositories were not modified.
- Published using **main → /docs**, with HTTPS enforced.
- GitHub Pages deployment [44069467532](https://github.com/adnanalosman/adnanalosman.github.io/actions/runs/44069467532) completed successfully for the initial portfolio commit `90e1b00e328bd3d8019b604be5fc8f98f621abd5`.
- Opened the public [English page](https://adnanalosman.github.io/) and [Arabic page](https://adnanalosman.github.io/ar/). Verified stylesheet and local fonts loaded, desktop layout without horizontal overflow, dark-mode switching, section navigation, language switching with the section and theme retained, and opening Arabic project details.
- Repository About links to the public Pages website.

## Limits

- Tests used Chromium and responsive iframe viewports, not physical devices or multiple browser engines.
- No Lighthouse score or comprehensive accessibility certification is claimed.
- Original C++ repositories were inspected read-only. Their code was not modified or executed as part of this portfolio task.

## Content editor — 18 November 2026

- Built `/admin/` with profile/project forms, independent language fields, local drafts, JSON backups, preview and a GitHub publication client.
- All **14 automated test groups** pass after the renderer was shared between Node and the browser. The nine editor groups cover validation, HTML escaping, Arabic/Unicode handling, five-file publication, credentials, concurrent changes, rejected permissions and uncertain network results. GitHub writes in these tests use a mock API.
- Browser loaded the actual repository's public data. Editing Arabic did not change the English text; edited content appeared in the preview. English, dark-mode and mobile preview settings applied correctly.
- Added an incomplete project, saved the local draft, reloaded and restored it. Publication review correctly refused incomplete fields. Removed the test project, reordered a project and checked the review summary.
- Downloaded a complete JSON backup and imported that downloaded file through the file chooser; the editor requested confirmation and reported successful import. Reset the draft afterward. No test content was published.
- Measured admin layouts at 320px and 768px iframe widths and a 1348px desktop content width. No document overflow was observed. Profile and project forms also fit the narrow frames; the publication dialog fit the 320px frame. The mobile section-navigation strip intentionally scrolls horizontally.
- Inspected the desktop preview and mobile/tablet dashboard visually. No application-origin browser errors were observed.
- The editor never stores a token in drafts or exports. It uses a fixed GitHub API origin, clears the input on submission/close, and has no third-party script or analytics dependency.
- A publish attempt using a real personal access token has **not** been performed. The owner must supply a repository-scoped token for the first real editor publication. Public deployment of the editor is checked separately from the mocked write pipeline.
- GitHub Pages deployment [44345066550](https://github.com/adnanalosman/adnanalosman.github.io/actions/runs/44345066550) succeeded for editor commit `76ed971a36be072061bc8b1a9581f965e569bb93`. Opened the live `/admin/`, loaded all four repository projects, switched content language, and rendered the dark mobile preview without application-origin errors.
- The live check exposed the no-JavaScript navigation fallback inside the script-free preview. The preview now applies the initialized layout class so the mobile navigation starts closed, matching the public site.
