# Probant website

This repository holds the source of the website of Probant: https://probant-reporting.github.io.

Probant is a free web tool to collect key performance indicators (KPIs) and to support audits. The tool itself, its
releases and its documentation are in another repository: https://github.com/Probant-Reporting/probant.

Each commit of this repository is one published version of the website. The work is done elsewhere, so there is no
work history here. To report a problem with the website or with the tool, open an issue in the repository of the tool.

## Build the website

The website is static: plain pages made by [Astro](https://astro.build), with almost no JavaScript. You need
Node.js 22.

```bash
npm ci
npm run dev
```

`npm run dev` shows the website at `http://localhost:4321` and reloads it when a file changes. To make the final
pages (folder `dist/`) and to check them:

```bash
npm run build
npm run check
```

`npm run check` reads `dist/`: broken links, missing images, images without a text alternative, pages without a title
or a description, wording that the website must not use, and the two languages (same pages, links to the other
language, no English text left in a French page).

Each push to `main` publishes the website on GitHub Pages (`.github/workflows/deploy.yml`).

## Where things are

| Folder or file | Content |
|---|---|
| `site.config.mjs` | Name of the product, public addresses, licence of the tool, legal notice |
| `src/content/en/`, `src/content/fr/` | All the texts: one file per topic, one folder per language (English at `/`, French at `/fr/`) |
| `src/components/`, `src/layouts/`, `src/pages/` | Page blocks and pages |
| `src/styles/`, `src/scripts/`, `src/lib/` | Styles, behaviours, colours, made-up data of the trial, icons |
| `public/` | Fonts, images of the guided tour, sharing image |
| `qa/` | Checks: `check.mjs`, and browser checks that need Playwright (`a11y.mjs`, `keyboard.mjs`, `sections.mjs`) |

The pages of `src/content/<language>/docs/`, `_library.json` and the English `_changelog.json` are copied from the
repository of the tool; the French `_changelog.json` is its translation.
The command that copies them (`npm run sync` in some comments) and the script that takes the screenshots of the guided
tour (`qa/tour-shots.mjs`) are not published here.

## Licences

Copyright (C) 2026 Florent Liaigre.

- **Texts and images of the website.** All rights reserved: no open licence is given for them. You can read this
  source and build the website to see how it works.
- **Documentation, library and release notes copied from the tool** (`src/content/en/docs/`, `_library.json`,
  `_changelog.json`, and the role guides in `src/content/en/guides/`): GNU Affero General Public License, version 3 or later (AGPL-3.0-or-later), as in the repository of the tool.
- **Fonts.** Source Sans 3 and Source Serif 4, SIL Open Font License 1.1. The licence texts are next to the font
  files: [`public/fonts/OFL-source-sans-3.txt`](public/fonts/OFL-source-sans-3.txt) and
  [`public/fonts/OFL-source-serif-4.txt`](public/fonts/OFL-source-serif-4.txt).
- **Icons.** Lucide, ISC licence (some icons come from Feather, MIT licence):
  [`src/lib/LICENSE-lucide.txt`](src/lib/LICENSE-lucide.txt).
- **Build tools.** Astro and the other packages of `package.json` keep their own licences.

The screens shown on the website are copies or screenshots of the tool with made-up data. The names of organisations and
people are invented.
