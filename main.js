var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// main.ts
var main_exports = {};
__export(main_exports, {
  default: () => AssetSwapperPlugin
});
module.exports = __toCommonJS(main_exports);
var import_obsidian = require("obsidian");

// utils.ts
function swapUrlsInContent(content, localFiles) {
  let swapCount = 0;
  const newContent = content.replace(
    /!?\[[^\]]*\]\(([^)]+)\)/g,
    (match, url) => {
      const filename = decodeFilenameFromUrl(url.trim());
      if (!filename || !localFiles.has(filename))
        return match;
      swapCount++;
      return `![[${filename}]]`;
    }
  );
  return { newContent, swapCount };
}
function decodeFilenameFromUrl(url) {
  let pathname;
  try {
    pathname = new URL(url).pathname;
  } catch (e) {
    pathname = url.replace(/[?#].*$/, "");
  }
  const pathParts = pathname.split("/");
  let raw = pathParts[pathParts.length - 1];
  if (!raw)
    return null;
  try {
    raw = decodeURIComponent(raw);
  } catch (e) {
  }
  raw = raw.replace(/[?#].*$/, "");
  if (!raw || raw.length < 2)
    return null;
  return sanitiseFilename(raw);
}
function sanitiseFilename(filename) {
  return filename.replace(/[/\\:*?"<>|]/g, "-").replace(/\s+/g, " ").trim();
}
function normalizeTitleForComparison(title) {
  return title.replace(/[#|^[\]/:\x00-\x1F]/g, " ").replace(/\s+/g, " ").trim();
}

// main.ts
var AssetSwapperPlugin = class extends import_obsidian.Plugin {
  async onload() {
    this.addCommand({
      id: "swap-assets",
      name: "Swap assets for current file",
      editorCallback: (editor, view) => {
        this.swapAssets(editor, view);
      }
    });
  }
  async swapAssets(editor, view) {
    const file = view.file;
    if (!file) {
      new import_obsidian.Notice("Asset Swapper: no file is currently open.");
      return;
    }
    const noteName = file.basename;
    const normalizedNoteName = normalizeTitleForComparison(noteName);
    const matchedFolder = this.app.vault.getAllLoadedFiles().find((f) => f instanceof import_obsidian.TFolder && normalizeTitleForComparison(f.name) === normalizedNoteName);
    if (!matchedFolder) {
      new import_obsidian.Notice(`Asset Swapper: no folder found matching "${noteName}".`);
      return;
    }
    const localFiles = /* @__PURE__ */ new Map();
    for (const child of matchedFolder.children) {
      if (child instanceof import_obsidian.TFile) {
        localFiles.set(child.name, child);
      }
    }
    if (localFiles.size === 0) {
      new import_obsidian.Notice(`Asset Swapper: folder "${noteName}" contains no files.`);
      return;
    }
    const content = editor.getValue();
    const { newContent, swapCount } = swapUrlsInContent(content, localFiles);
    if (swapCount === 0) {
      new import_obsidian.Notice("Asset Swapper: no matching assets found to swap.");
      return;
    }
    editor.setValue(newContent);
    new import_obsidian.Notice(`Asset Swapper: swapped ${swapCount} asset${swapCount !== 1 ? "s" : ""}.`);
  }
};
