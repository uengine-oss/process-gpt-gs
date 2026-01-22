import JSON5 from 'json5';
import partialParse from 'partial-json-parser';

export function hasUnclosedTripleBackticks(inputString) {
  const regex = /`{3}/g;
  let match;
  let isOpen = false;

  while ((match = regex.exec(inputString)) !== null) {
    isOpen = !isOpen;
  }

  return isOpen;
}

/**
 * Extract JSON (or JSON-ish) snippet from an LLM response.
 * - If the entire string is valid JSON5, return it as-is.
 * - Otherwise, prefer fenced ```json blocks, fallback to first {...} block.
 */
export function extractJSONFromText(inputString, checkFunction) {
  try {
    JSON5.parse(inputString);
    return inputString;
  } catch (e) {}

  if (hasUnclosedTripleBackticks(inputString)) {
    inputString = inputString + '\n```';
  }

  let regex = /```(?:json)?\s*([\s\S]*?)\s*```/;
  let match = inputString.match(regex);

  if (match) {
    if (checkFunction) {
      // Note: kept for backward-compat even though this pattern is odd.
      match.forEach((shouldBeJson) => {
        const lastIndex = shouldBeJson.lastIndexOf('}');
        const result = shouldBeJson.slice(0, lastIndex + 1);
        if (checkFunction(result)) return result;
      });
    } else {
      return match[1];
    }
  } else {
    regex = /\{[\s\S]*\}/;
    match = inputString.match(regex);
    return match && match[0] ? match[0] : null;
  }

  return null;
}

/**
 * Replace Python literals (None/True/False) only when they appear OUTSIDE of string quotes.
 * This helps parse "almost JSON" outputs coming from LLMs (e.g., None).
 */
export function normalizePythonLiterals(jsonLikeText) {
  if (typeof jsonLikeText !== 'string') return jsonLikeText;
  const s = jsonLikeText;
  let out = '';
  let i = 0;
  let inString = false;
  let quoteChar = null;
  let escape = false;

  const isIdentChar = (ch) => /[A-Za-z0-9_]/.test(ch);

  while (i < s.length) {
    const ch = s[i];

    if (inString) {
      out += ch;
      if (escape) {
        escape = false;
      } else if (ch === '\\') {
        escape = true;
      } else if (ch === quoteChar) {
        inString = false;
        quoteChar = null;
      }
      i += 1;
      continue;
    }

    if (ch === '"' || ch === "'") {
      inString = true;
      quoteChar = ch;
      out += ch;
      i += 1;
      continue;
    }

    if (s.startsWith('None', i)) {
      const prev = i > 0 ? s[i - 1] : '';
      const next = i + 4 < s.length ? s[i + 4] : '';
      if (!isIdentChar(prev) && !isIdentChar(next)) {
        out += 'null';
        i += 4;
        continue;
      }
    }
    if (s.startsWith('True', i)) {
      const prev = i > 0 ? s[i - 1] : '';
      const next = i + 4 < s.length ? s[i + 4] : '';
      if (!isIdentChar(prev) && !isIdentChar(next)) {
        out += 'true';
        i += 4;
        continue;
      }
    }
    if (s.startsWith('False', i)) {
      const prev = i > 0 ? s[i - 1] : '';
      const next = i + 5 < s.length ? s[i + 5] : '';
      if (!isIdentChar(prev) && !isIdentChar(next)) {
        out += 'false';
        i += 5;
        continue;
      }
    }

    out += ch;
    i += 1;
  }

  return out;
}

/**
 * Best-effort parse for JSON-ish strings:
 * - JSON.parse
 * - JSON5.parse
 * - partialParse
 * - normalize Python literals then retry above
 */
export function parseJsonLike(text) {
  if (typeof text !== 'string') return text;
  const normalized = normalizePythonLiterals(text);
  const attempts = normalized !== text ? [text, normalized] : [text];

  for (const candidate of attempts) {
    try {
      return JSON.parse(candidate);
    } catch (e) {}
    try {
      return JSON5.parse(candidate);
    } catch (e) {}
    try {
      return partialParse(candidate);
    } catch (e) {}
  }

  return null;
}

