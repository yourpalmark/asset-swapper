import { Editor, MarkdownView, Notice, Plugin, TFile, TFolder } from 'obsidian';
import { swapUrlsInContent, normalizeTitleForComparison } from './utils';

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
    const normalizedNoteName = normalizeTitleForComparison(noteName);

    // Search the vault for a folder whose normalized name matches the note name.
    // Normalization strips chars that Asset Clipper removes from folder names
    // (e.g. / : # |) and collapses whitespace, so titles like "My Page / Title"
    // match a folder named "My Page Title".
    const matchedFolder = this.app.vault
      .getAllLoadedFiles()
      .find((f): f is TFolder => f instanceof TFolder && normalizeTitleForComparison(f.name) === normalizedNoteName);

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
    const { newContent, swapCount } = swapUrlsInContent(content, localFiles);

    if (swapCount === 0) {
      new Notice('Asset Swapper: no matching assets found to swap.');
      return;
    }

    editor.setValue(newContent);
    new Notice(`Asset Swapper: swapped ${swapCount} asset${swapCount !== 1 ? 's' : ''}.`);
  }
}
