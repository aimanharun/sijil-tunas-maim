/**
 * Keep short names on one line. Split overflowing names into two centered lines,
 * preferring a slightly longer first line without reducing the selected font size.
 */
export function layoutNameLines(
  rawName: string,
  maxWidth: number,
  measure: (text: string) => number
): string[] {
  const name = rawName.replace(/\s+/g, ' ').trim();
  if (!name || measure(name) <= maxWidth) return [name];

  const words = name.split(' ');
  const candidates: Array<[string, string]> = [];
  for (let i = 1; i < words.length; i++) {
    candidates.push([words.slice(0, i).join(' '), words.slice(i).join(' ')]);
  }

  // A single uninterrupted word still needs a useful two-line fallback.
  if (candidates.length === 0) {
    for (let i = 1; i < name.length; i++) {
      candidates.push([name.slice(0, i), name.slice(i)]);
    }
  }

  const score = ([top, bottom]: [string, string]) => {
    const topWidth = measure(top);
    const bottomWidth = measure(bottom);
    const overflow = Math.max(0, topWidth - maxWidth) + Math.max(0, bottomWidth - maxWidth);
    const topShorter = topWidth <= bottomWidth ? 1 : 0;
    return overflow * 10000 + topShorter * 1000 + Math.abs(topWidth - bottomWidth);
  };
  candidates.sort((a, b) => score(a) - score(b));
  return candidates[0] ?? [name];
}
