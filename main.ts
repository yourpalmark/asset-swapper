import { Editor, MarkdownView, Notice, Plugin, TFile, TFolder } from 'obsidian';

export default class AssetSwapperPlugin extends Plugin {
  async onload() {
    this.addCommand({
      id: 'swap-assets',
      name: 'Swap assets for current file',
      editorCallback: (editor: Editor, view: MarkdownView) => {
        this.swapAssets(editor, view);
      },
    });
  }

  async swapAssets(editor: Editor, view: MarkdownView) {
    const file = view.file;
    if (!file) {
      new Notice('Asset Swapper: no file is currently open.');
      return;
    }

    const noteName = file.basename;

    // Search the vault for a folder whose name exactly matches the note name
    const matchedFolder = this.app.vault
      .getAllLoadedFiles()
      .find((f): f is TFolder => f instanceof TFolder && f.name === noteName);

    if (!matchedFolder) {
      new Notice(`Asset Swapper: no folder found matching "${noteName}".`);
      return;
    }

    // Build a map of filename → TFile for all files in that folder
    const localFiles = new Map<string, TFile>();
    for (const child of matchedFolder.children) {
      if (child instanceof TFile) {
        localFiles.set(child.name, child);
      }
    }

    if (localFiles.size === 0) {
      new Notice(`Asset Swapper: folder "${noteName}" contains no files.`);
      return;
    }

    const content = editor.getValue();
    let swapCount = 0;

    // Match markdown image and link syntax: ![alt](url) and [text](url)
    const newContent = content.replace(
      /!?\[[^\]]*\]\(([^)]+)\)/g,
      (match, url: string) => {
        const filename = decodeFilenameFromUrl(url.trim());
        if (!filename || !localFiles.has(filename)) return match;
        swapCount++;
        return `![[${filename}]]`;
      }
    );

    if (swapCount === 0) {
      new Notice('Asset Swapper: no matching assets found to swap.');
      return;
    }

    editor.setValue(newContent);
    new Notice(`Asset Swapper: swapped ${swapCount} asset${swapCount !== 1 ? 's' : ''}.`);
  }
}

/**
 * Extracts and URL-decodes the filename from the last path segment of a URL.
 * Returns null if the URL is not parseable or has no usable filename.
 * Mirrors the logic in Asset Clipper's lib/utils.js.
 */
function decodeFilenameFromUrl(url: string): string | null {
  try {
    const parsed = new URL(url);
    const pathParts = parsed.pathname.split('/');
    let raw = pathParts[pathParts.length - 1];
    if (!raw) return null;

    raw = decodeURIComponent(raw);
    raw = raw.replace(/[?#].*$/, '');

    if (!raw || raw.length < 2) return null;

    return sanitiseFilename(raw);
  } catch {
    return null;
  }
}

function sanitiseFilename(filename: string): string {
  return filename
    .replace(/[/\\:*?"<>|]/g, '-')
    .replace(/\s+/g, ' ')
    .trim();
}
