const MAX_TITLE_LENGTH = 200;

export const cleanTitle = (title) => title.trim().slice(0, MAX_TITLE_LENGTH);

// Turns pasted text into card titles: one per line, list markers removed.
export const splitTitles = (text) =>
  text
    .split(/\r?\n/)
    .map((line) => cleanTitle(line.replace(/^\s*(?:[-*•]|\d+[.)]|\[[ x]\])\s+/i, '')))
    .filter(Boolean);
