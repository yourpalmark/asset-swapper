import { Editor, MarkdownView, Notice, Plugin, TFile, TFolder } from 'obsidian';
import { swapUrlsInContent } from './utils';

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
    const { newContent, swapCount } = swapUrlsInContent(content, localFiles);

    if (swapCount === 0) {
      new Notice('Asset Swapper: no matching assets found to swap.');
      return;
    }

    editor.setValue(newContent);
    new Notice(`Asset Swapper: swapped ${swapCount} asset${swapCount !== 1 ? 's' : ''}.`);
  }
}
