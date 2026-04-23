#!/usr/bin/env node

/**
 * Parses the "### Official examples" section of README.md and generates examples.json.
 *
 * Usage:
 *   node scripts/update-examples-json.mjs
 *   node scripts/update-examples-json.mjs --check   # exits 1 if out of sync
 */

import { readFileSync, writeFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, "..");
const README_PATH = resolve(ROOT, "README.md");
const EXAMPLES_JSON_PATH = resolve(ROOT, "examples.json");

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function toKebab(title) {
  return title
    .toLowerCase()
    .replace(/[()]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

/**
 * Normalize a field key for case-insensitive, whitespace-tolerant lookup.
 * "Last Updated At" → "lastupdatedat"
 * "Meteor  Version" → "meteorversion"
 */
function normalizeKey(key) {
  return key.toLowerCase().replace(/[\s_-]+/g, "");
}

/**
 * Look up a field value by normalized key.
 */
function getField(fields, key) {
  return fields[normalizeKey(key)] ?? null;
}

/**
 * Extract the GitHub owner/repo from a repository URL.
 * Handles tree paths like /tree/3.4-rspack and internal ./paths.
 */
function parseRepository(repoUrl, linkText) {
  if (repoUrl.startsWith("./")) {
    return {
      repository: "meteor/examples",
      repositoryUrl: `https://github.com/meteor/examples/tree/main/${repoUrl.slice(2)}`,
      isInternal: true,
      internalPath: repoUrl.slice(2),
    };
  }

  const match = repoUrl.match(/github\.com\/([^/]+\/[^/]+)/);
  const ownerRepo = match ? match[1] : linkText;

  return {
    repository: ownerRepo,
    repositoryUrl: repoUrl,
    isInternal: false,
    internalPath: null,
  };
}

/**
 * Parse the demo value — returns the URL or null when "N/A".
 * Handles: [text](url), bare URLs, and "N/A" (case-insensitive).
 */
function parseDemoValue(raw) {
  if (!raw || /^\s*n\/?a\s*$/i.test(raw)) return null;

  const urlMatch = raw.match(/\((https?:\/\/[^)]+)\)/);
  if (urlMatch) return urlMatch[1].replace(/\/+$/, "");

  const plainUrl = raw.match(/(https?:\/\/\S+)/);
  if (plainUrl) return plainUrl[1].replace(/\/+$/, "");

  return null;
}

/**
 * Extract repository info from a field value.
 * Supports:
 *   - Markdown link:  [owner/repo](https://github.com/owner/repo)
 *   - Bare URL:       https://github.com/owner/repo
 *   - Internal path:  [meteor/examples/foo](./foo)
 */
function parseRepositoryField(value) {
  const fallback = {
    repository: null,
    repositoryUrl: null,
    isInternal: false,
    internalPath: null,
  };

  if (!value) return fallback;

  // Try markdown link first
  const linkMatch = value.match(/\[([^\]]+)\]\(([^)]+)\)/);
  if (linkMatch) {
    return parseRepository(linkMatch[2], linkMatch[1]);
  }

  // Try bare URL
  const urlMatch = value.match(/(https?:\/\/\S+)/);
  if (urlMatch) {
    return parseRepository(urlMatch[1], value);
  }

  // Try bare relative path (e.g. ./tic-tac-toe)
  const relMatch = value.match(/(\.\/\S+)/);
  if (relMatch) {
    return parseRepository(relMatch[1], value);
  }

  return fallback;
}

// ---------------------------------------------------------------------------
// Parser
// ---------------------------------------------------------------------------

/**
 * Checks whether a group of bullet lines looks like an example entry —
 * i.e. has at least a Repository and Stack field.
 */
function looksLikeExample(bulletLines) {
  let hasRepo = false;
  let hasStack = false;
  for (const line of bulletLines) {
    const m = line.match(/^-\s+([\w][\w\s]*?):\s*/);
    if (m) {
      const key = normalizeKey(m[1]);
      if (key === "repository") hasRepo = true;
      if (key === "stack") hasStack = true;
    }
  }
  return hasRepo && hasStack;
}

/**
 * Scan lines and extract { title, bodyLines } blocks.
 * A block starts at any markdown heading (# through ######) and its body
 * is every following line until the next heading of equal or lesser depth.
 */
function extractHeadingBlocks(lines) {
  const blocks = [];
  let current = null;

  for (const line of lines) {
    const headingMatch = line.match(/^(#{1,6})\s+(.+)/);
    if (headingMatch) {
      if (current) blocks.push(current);
      current = { title: headingMatch[2].trim(), bodyLines: [] };
    } else if (current) {
      current.bodyLines.push(line);
    }
  }
  if (current) blocks.push(current);

  return blocks;
}

function parseReadySection(markdown) {
  const lines = markdown.split("\n");

  // Strategy 1: find a "### Official examples" heading and scope to that section
  let readyStart = -1;
  let readySectionDepth = 0;
  for (let i = 0; i < lines.length; i++) {
    const m = lines[i].trim().match(/^(#{1,6})\s+official\s+examples\b/i);
    if (m) {
      readyStart = i + 1;
      readySectionDepth = m[1].length; // e.g. 3 for ###
      break;
    }
  }

  let scopedLines;
  if (readyStart !== -1) {
    // Collect lines until the next heading at the same or shallower depth
    scopedLines = [];
    for (let i = readyStart; i < lines.length; i++) {
      const headingMatch = lines[i].trim().match(/^(#{1,6})\s+[^#]/);
      if (headingMatch && headingMatch[1].length <= readySectionDepth) {
        break;
      }
      scopedLines.push(lines[i]);
    }
  } else {
    console.warn(
      'No "Official examples" section found — falling back to pattern detection across the entire README.'
    );
    scopedLines = lines;
  }

  // Extract all heading blocks and keep only those that look like examples
  const allBlocks = extractHeadingBlocks(scopedLines);
  const filteredBlocks = allBlocks.filter((b) =>
    looksLikeExample(b.bodyLines)
  );

  return filteredBlocks.map(({ title, bodyLines }) => {
    // Parse fields — case-insensitive keys, supports multi-line continuation
    const fields = {};
    let lastKey = null;
    for (const line of bodyLines) {
      const m = line.match(/^-\s+([\w][\w\s]*?):\s*(.+)/);
      if (m) {
        lastKey = normalizeKey(m[1]);
        fields[lastKey] = m[2].trim();
      } else if (lastKey && /^\s+\S/.test(line)) {
        // Continuation line (indented, no new bullet) — append to previous field
        fields[lastKey] += " " + line.trim();
      }
    }

    const repoInfo = parseRepositoryField(getField(fields, "Repository"));

    // Stack — split by comma
    const stackRaw = getField(fields, "Stack");
    const stack = stackRaw
      ? stackRaw.split(",").map((s) => s.trim()).filter(Boolean)
      : [];

    const whyRaw = getField(fields, "Why");
    const why = whyRaw
      ? whyRaw.replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
      : null;

    const tutorialRaw = getField(fields, "Tutorial");
    const tutorialUrl = tutorialRaw
      ? (tutorialRaw.match(/\((https?:\/\/[^)]+)\)/)?.[1] ??
         tutorialRaw.match(/(https?:\/\/\S+)/)?.[1] ??
         null)
      : null;

    return {
      title,
      slug: toKebab(title),
      demo: parseDemoValue(getField(fields, "Demo")),
      tutorial: tutorialUrl,
      repository: repoInfo.repository,
      repositoryUrl: repoInfo.repositoryUrl,
      isInternal: repoInfo.isInternal,
      internalPath: repoInfo.internalPath,
      why,
      stack,
      lastUpdatedAt: getField(fields, "Last Updated At"),
      meteorVersion: getField(fields, "Meteor Version"),
    };
  });
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

const readme = readFileSync(README_PATH, "utf-8");
const examples = parseReadySection(readme);

if (examples.length === 0) {
  console.error(
    'WARNING: No examples found in the "### Official examples" section. Check README.md formatting.'
  );
  process.exit(1);
}

const json = JSON.stringify(examples, null, 2) + "\n";

const isCheck = process.argv.includes("--check");

if (isCheck) {
  let existing;
  try {
    existing = readFileSync(EXAMPLES_JSON_PATH, "utf-8");
  } catch {
    console.error("examples.json does not exist. Run without --check to generate it.");
    process.exit(1);
  }

  if (existing !== json) {
    console.error(
      "examples.json is out of sync with README.md. Run:\n\n  node scripts/update-examples-json.mjs\n"
    );
    process.exit(1);
  }

  console.log("examples.json is up to date.");
  process.exit(0);
}

writeFileSync(EXAMPLES_JSON_PATH, json);
console.log(`Wrote ${examples.length} examples to examples.json`);
