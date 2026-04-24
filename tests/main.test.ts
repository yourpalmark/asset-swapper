import { decodeFilenameFromUrl, normalizeTitleForComparison, sanitiseFilename, swapUrlsInContent } from '../utils';

// ---------------------------------------------------------------------------
// decodeFilenameFromUrl
// ---------------------------------------------------------------------------

describe('decodeFilenameFromUrl', () => {
  test('returns filename from a plain URL', () => {
    expect(decodeFilenameFromUrl('https://example.com/images/photo.png'))
      .toBe('photo.png');
  });

  test('URL-decodes percent-encoded spaces', () => {
    expect(decodeFilenameFromUrl('https://example.com/files/my%20file.pdf'))
      .toBe('my file.pdf');
  });

  test('strips query string from filename', () => {
    expect(decodeFilenameFromUrl('https://example.com/file.pdf?token=abc&v=2'))
      .toBe('file.pdf');
  });

  test('decodes a Confluence attachment URL', () => {
    const url =
      'https://confluence.example.com/download/attachments/123/' +
      'Screenshot%202026-03-19%20at%2012.15.14%E2%80%AFPM.png' +
      '?version=1&modificationDate=1773902761577&api=v2';
    expect(decodeFilenameFromUrl(url)).toBe('Screenshot 2026-03-19 at 12.15.14 PM.png');
  });

  test('returns null for a URL with no filename', () => {
    expect(decodeFilenameFromUrl('https://example.com/')).toBeNull();
  });

  test('returns null for a single-character last segment', () => {
    expect(decodeFilenameFromUrl('https://example.com/a')).toBeNull();
  });

  test('returns null for a path ending in a slash (no filename)', () => {
    expect(decodeFilenameFromUrl('https://example.com/path/')).toBeNull();
  });

  test('handles a root-relative Confluence attachment URL', () => {
    const url = '/download/attachments/3290412694/Screenshot%202026-03-26%20at%202.21.18%E2%80%AFPM.png?version=1&modificationDate=1774515108947&api=v2';
    expect(decodeFilenameFromUrl(url)).toBe('Screenshot 2026-03-26 at 2.21.18 PM.png');
  });

  test('handles a relative path without query string', () => {
    expect(decodeFilenameFromUrl('/images/photo.png')).toBe('photo.png');
  });

  test('returns null for an empty string', () => {
    expect(decodeFilenameFromUrl('')).toBeNull();
  });

  test('sanitises illegal filename chars', () => {
    expect(decodeFilenameFromUrl('https://en.wikipedia.org/wiki/File:Question_book-new.svg'))
      .toBe('File-Question_book-new.svg');
  });
});

// ---------------------------------------------------------------------------
// sanitiseFilename
// ---------------------------------------------------------------------------

describe('sanitiseFilename', () => {
  test('replaces colon with hyphen', () => {
    expect(sanitiseFilename('File:image.png')).toBe('File-image.png');
  });

  test('replaces all illegal chars: / \\ : * ? " < > |', () => {
    expect(sanitiseFilename('a/b\\c:d*e?f"g<h>i|j.png')).toBe('a-b-c-d-e-f-g-h-i-j.png');
  });

  test('collapses multiple spaces', () => {
    expect(sanitiseFilename('my  file.png')).toBe('my file.png');
  });

  test('trims leading and trailing whitespace', () => {
    expect(sanitiseFilename('  file.png  ')).toBe('file.png');
  });

  test('leaves normal filenames unchanged', () => {
    expect(sanitiseFilename('diagram-v2.png')).toBe('diagram-v2.png');
  });
});

// ---------------------------------------------------------------------------
// normalizeTitleForComparison
// ---------------------------------------------------------------------------

describe('normalizeTitleForComparison', () => {
  test('strips forward slash and collapses surrounding spaces', () => {
    expect(normalizeTitleForComparison('My Page / Title')).toBe('My Page Title');
  });

  test('strips colon', () => {
    expect(normalizeTitleForComparison('Title: Subtitle')).toBe('Title Subtitle');
  });

  test('strips Obsidian chars: # | ^ [ ]', () => {
    expect(normalizeTitleForComparison('Title #1 | [tag] ^up')).toBe('Title 1 tag up');
  });

  test('note name with slash matches folder name without slash', () => {
    const noteName = 'My Page / Title';
    const folderName = 'My Page Title';
    expect(normalizeTitleForComparison(noteName)).toBe(normalizeTitleForComparison(folderName));
  });

  test('leaves a normal title unchanged', () => {
    expect(normalizeTitleForComparison('My Project Overview')).toBe('My Project Overview');
  });

  test('trims leading and trailing whitespace', () => {
    expect(normalizeTitleForComparison('  padded  ')).toBe('padded');
  });
});

// ---------------------------------------------------------------------------
// swapUrlsInContent
// ---------------------------------------------------------------------------

describe('swapUrlsInContent', () => {
  function makeLocalFiles(...names: string[]): Map<string, unknown> {
    return new Map(names.map((n) => [n, {}]));
  }

  test('replaces a matched image URL with a wikilink', () => {
    const content = '![alt](https://example.com/photo.png)';
    const localFiles = makeLocalFiles('photo.png');
    const { newContent, swapCount } = swapUrlsInContent(content, localFiles);
    expect(newContent).toBe('![[photo.png]]');
    expect(swapCount).toBe(1);
  });

  test('replaces a matched plain link URL with a wikilink', () => {
    const content = '[Download](https://example.com/report.pdf)';
    const localFiles = makeLocalFiles('report.pdf');
    const { newContent, swapCount } = swapUrlsInContent(content, localFiles);
    expect(newContent).toBe('![[report.pdf]]');
    expect(swapCount).toBe(1);
  });

  test('leaves unmatched URLs unchanged', () => {
    const content = '![alt](https://example.com/remote.png)';
    const localFiles = makeLocalFiles('other.png');
    const { newContent, swapCount } = swapUrlsInContent(content, localFiles);
    expect(newContent).toBe(content);
    expect(swapCount).toBe(0);
  });

  test('replaces only matched URLs when mixed with unmatched', () => {
    const content = [
      '![a](https://example.com/local.png)',
      '![b](https://example.com/remote.png)',
    ].join('\n');
    const localFiles = makeLocalFiles('local.png');
    const { newContent, swapCount } = swapUrlsInContent(content, localFiles);
    expect(newContent).toContain('![[local.png]]');
    expect(newContent).toContain('![b](https://example.com/remote.png)');
    expect(swapCount).toBe(1);
  });

  test('replaces multiple matched URLs', () => {
    const content = [
      '![a](https://example.com/a.png)',
      '![b](https://example.com/b.png)',
    ].join('\n');
    const localFiles = makeLocalFiles('a.png', 'b.png');
    const { newContent, swapCount } = swapUrlsInContent(content, localFiles);
    expect(newContent).toBe('![[a.png]]\n![[b.png]]');
    expect(swapCount).toBe(2);
  });

  test('returns swapCount 0 and original content when no matches', () => {
    const content = 'No links here.';
    const { newContent, swapCount } = swapUrlsInContent(content, makeLocalFiles('a.png'));
    expect(newContent).toBe(content);
    expect(swapCount).toBe(0);
  });

  test('handles URL-encoded filenames in Confluence URLs', () => {
    const url =
      'https://confluence.example.com/download/attachments/123/' +
      'Architecture%20Diagram.png?version=1&api=v2';
    const content = `![diagram](${url})`;
    const localFiles = makeLocalFiles('Architecture Diagram.png');
    const { newContent, swapCount } = swapUrlsInContent(content, localFiles);
    expect(newContent).toBe('![[Architecture Diagram.png]]');
    expect(swapCount).toBe(1);
  });

  test('handles mixed asset types: image, pdf, video', () => {
    const content = [
      '![screenshot](https://example.com/screenshot.png)',
      '[spec](https://example.com/spec.pdf)',
      '![demo](https://example.com/demo.mp4)',
    ].join('\n');
    const localFiles = makeLocalFiles('screenshot.png', 'spec.pdf', 'demo.mp4');
    const { newContent, swapCount } = swapUrlsInContent(content, localFiles);
    expect(newContent).toBe('![[screenshot.png]]\n![[spec.pdf]]\n![[demo.mp4]]');
    expect(swapCount).toBe(3);
  });

  test('deduplicates: replaces all occurrences of the same URL', () => {
    const content = [
      '![a](https://example.com/photo.png)',
      '![a again](https://example.com/photo.png)',
    ].join('\n');
    const localFiles = makeLocalFiles('photo.png');
    const { newContent, swapCount } = swapUrlsInContent(content, localFiles);
    expect(newContent).toBe('![[photo.png]]\n![[photo.png]]');
    expect(swapCount).toBe(2);
  });

  test('ignores data: URIs', () => {
    const content = '![inline](data:image/png;base64,abc123)';
    const { newContent, swapCount } = swapUrlsInContent(content, makeLocalFiles());
    expect(newContent).toBe(content);
    expect(swapCount).toBe(0);
  });
});
