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

## Limits and publication state

- Tests used Chromium and responsive iframe viewports, not physical devices or multiple browser engines.
- No Lighthouse score or comprehensive accessibility certification is claimed.
- Original C++ repositories were inspected read-only. Their code was not modified or executed as part of this portfolio task.
- The dedicated public repository `adnanalosman/adnanalosman.github.io` was created on 17 November 2026. Publication and public-address verification are pending at this checkpoint.
- The intended canonical URL in the files is a deployment target, not evidence of an already-live website.

## Remaining deployment steps

Upload the prepared source and `docs/` to the new repository; enable Pages for `main` → `/docs`; verify the resulting public address.
