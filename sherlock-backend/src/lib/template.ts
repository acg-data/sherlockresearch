// Tiny template engine: {{token}} substitution + <!-- NARRATIVE:section --> splicing.
// No conditionals, no loops — those belong in computeDerived().

export function renderTokens(template: string, tokens: Map<string, string>): string {
  return template.replace(/\{\{\s*([a-z0-9_]+)\s*\}\}/gi, (_, key: string) => {
    const v = tokens.get(key);
    if (v === undefined) return `[[missing:${key}]]`;
    return v;
  });
}

export function spliceNarrative(template: string, sectionKey: string, html: string): string {
  const marker = new RegExp(`<!--\\s*NARRATIVE:${sectionKey}\\s*-->`, 'g');
  return template.replace(marker, html);
}

export function dropUnfilledNarratives(template: string): string {
  return template.replace(/<!--\s*NARRATIVE:[a-z0-9_]+\s*-->/gi, '');
}
