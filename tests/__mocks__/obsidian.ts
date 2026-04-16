// Minimal Obsidian API mock for unit tests.
// Only the classes/functions used by main.ts need to be stubbed.

export class Plugin {}
export class Notice {
  constructor(public message: string) {}
}
export class TFile {
  name: string;
  basename: string;
  extension: string;
  constructor(name: string) {
    this.name = name;
    const dot = name.lastIndexOf('.');
    this.basename = dot >= 0 ? name.slice(0, dot) : name;
    this.extension = dot >= 0 ? name.slice(dot + 1) : '';
  }
}
export class TFolder {
  name: string;
  children: (TFile | TFolder)[];
  constructor(name: string, children: (TFile | TFolder)[] = []) {
    this.name = name;
    this.children = children;
  }
}
export class Editor {}
export class MarkdownView {}
