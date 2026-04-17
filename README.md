# Asset Swapper

An [Obsidian](https://obsidian.md) plugin that replaces remote asset URLs in the current note with local Obsidian wikilinks — without downloading anything itself.

It is designed to be used alongside the [Asset Clipper](https://github.com/yourpalmark/asset-clipper) Chrome extension, which handles the actual downloading.

---

## The problem

Obsidian's Web Clipper saves pages as markdown, but embedded assets (images, PDFs, videos, etc.) are stored as remote URLs. On authenticated sites like Confluence, those URLs only work while you have an active browser session. Obsidian's internal browser has no access to your Chrome cookies, so assets show as broken links.

## The solution

**Asset Clipper** (Chrome extension) downloads the assets through your active Chrome session and saves them to your vault. **Asset Swapper** (this plugin) then rewrites the remote URLs in the clipped note to point to the local files.

This is similar in concept to Obsidian's built-in "Download attachments for current file" command — but instead of downloading anything, Asset Swapper swaps URLs that already have a matching local file downloaded by Asset Clipper.

---

## Workflow

1. Open a page in Chrome (e.g. a Confluence page you're logged into)
2. Clip the page with **Obsidian Web Clipper** → note saved, e.g. `My Page.md`
3. Click the **Asset Clipper** toolbar button → assets downloaded to a folder named `My Page/` inside your configured asset location
4. In Obsidian, open `My Page.md` and run **Asset Swapper: Swap assets for current file**
5. Remote URLs with a matching local file are rewritten as `![[filename.ext]]` wikilinks

Any URL that does not have a matching local file is left unchanged.

---

## How matching works

Asset Swapper searches the vault for a folder whose normalized name matches the current note's filename (without the `.md` extension). Normalization strips characters that are illegal in folder names (e.g. `/`, `:`, `#`, `|`) and collapses whitespace, so a note titled `"My Page / Title"` correctly matches a folder named `"My Page Title"`. It then compares the decoded filename from each URL in the note against the files in that folder. Matches are replaced; everything else is left as-is.

---

## Installation

This plugin is not yet published to the Obsidian Community Plugins directory. To install it manually, choose one of the two options below.

### Option A — Clone into your vault (recommended, easy to update)

```bash
cd /path/to/your/vault/.obsidian/plugins
git clone https://github.com/yourpalmark/asset-swapper
cd asset-swapper
npm install
npm run build
```

To update later:

```bash
cd /path/to/your/vault/.obsidian/plugins/asset-swapper
git pull
npm install
npm run build
```

Then in Obsidian: **Settings → Community plugins → disable and re-enable Asset Swapper**.

### Option B — Copy the built files into your vault

1. Clone or download this repository anywhere on your machine
2. Run `npm install` then `npm run build` inside the repo folder
3. Copy the `asset-swapper` folder into your vault's `.obsidian/plugins/` directory
4. In Obsidian: **Settings → Community plugins → reload plugins**

To update, repeat steps 1–4 with the latest code.

### Final step (both options)

Enable **Asset Swapper** in **Settings → Community plugins**.

---

## Usage

With a clipped note open, open the command palette (**Cmd/Ctrl + P**) and run:

> **Asset Swapper: Swap assets for current file**

A notice will confirm how many assets were swapped, or explain why nothing was changed (no matching folder found, no matching files, etc.).

---

## Development

```bash
npm install       # install dependencies
npm run build     # compile main.ts → main.js
npm test          # run unit tests
npm run dev       # watch mode (rebuilds on file change)
```

Built with TypeScript and [esbuild](https://esbuild.github.io/).
