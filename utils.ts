/**
 * Pure utility functions with no Obsidian dependency.
 * Imported by main.ts and tested directly in tests/.
 */

/**
 * Replaces markdown image/link URLs with Obsidian wikilinks for any URL
 * whose decoded filename exists in localFiles. Unmatched links are unchanged.
 *
 * Two passes:
 *  1. Markdown syntax:  ![alt](url)  or  [text](url)
 *  2. HTML img tags:    <img src="url">  (any attribute order; preserves width)
 */
export function swapUrlsInContent(
  content: string,
  localFiles: Map<string, unknown>
): { newContent: string; swapCount: number } {
  let swapCount = 0;

  // Pass 1: markdown image/link syntax
  let result = content.replace(
    /!?\[[^\]]*\]\(([^)]+)\)/g,
    (match, url: string) => {
      const filename = decodeFilenameFromUrl(url.trim());
      if (!filename || !localFiles.has(filename)) return match;
      swapCount++;
      return `![[${filename}]]`;
    }
  );

  // Pass 2: HTML <img> tags — attribute order agnostic, single or double quotes
  result = result.replace(
    /<img\b[^>]*?\bsrc=["']([^"']+)["'][^>]*?\/?>/gi,
    (match, url: string) => {
      const filename = decodeFilenameFromUrl(url.trim());
      if (!filename || !localFiles.has(filename)) return match;
      swapCount++;
      // Preserve explicit pixel width if present (e.g. width="393" → ![[file.png|393]])
      const widthMatch = match.match(/\bwidth=["'](\d+)["']/i);
      const suffix = widthMatch ? `|${widthMatch[1]}` : '';
      return `![[${filename}${suffix}]]`;
    }
  );

  return { newContent: result, swapCount };
}

/**
 * Extracts and URL-decodes the filename from the last path segment of a URL.
 * Handles both absolute URLs (https://...) and relative paths (/path/to/file).
 * Returns null if no usable filename can be extracted.
 * Mirrors the logic in Asset Clipper's lib/utils.js.
 */
export function decodeFilenameFromUrl(url: string): string | null {
  let pathname: string;

  try {
    pathname = new URL(url).pathname;
  } catch {
    // Relative URL — strip query string and fragment manually
    pathname = url.replace(/[?#].*$/, '');
  }

  const pathParts = pathname.split('/');
  let raw = pathParts[pathParts.length - 1];
  if (!raw) return null;

  try {
    raw = decodeURIComponent(raw);
  } catch {
    // malformed percent-encoding — use as-is
  }
  raw = raw.replace(/[?#].*$/, '');

  if (!raw || raw.length < 2) return null;

  return sanitiseFilename(raw);
}

export function sanitiseFilename(filename: string): string {
  return filename
    .replace(/[/\\:*?"<>|]/g, '-')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Normalizes a title for folder-matching purposes.
 * Strips the same characters that Asset Clipper's sanitiseTitle removes when
 * creating a folder name (/ : # | ^ [ ] and control characters), then
 * collapses whitespace. This lets a note title like "My Page / Title" match
 * a folder named "My Page Title".
 */
export function normalizeTitleForComparison(title: string): string {
  return title
    .replace(/[#|^[\]/:\x00-\x1F]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}
