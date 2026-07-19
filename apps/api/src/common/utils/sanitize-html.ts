import sanitize from 'sanitize-html';

/**
 * Allowlist of HTML tags considered safe inside product descriptions.
 * Strip everything else by default (script, iframe, event handlers, etc.).
 */
export const ALLOWED_TAGS = [
  'p',
  'br',
  'strong',
  'em',
  'u',
  'ul',
  'ol',
  'li',
  'a',
  'h2',
  'h3',
  'h4',
  'blockquote',
  'code',
  'pre',
] as const;

/**
 * Anchor URLs must use one of these schemes. `sanitize-html` drops
 * `javascript:`, `data:`, `vbscript:` when `href` is constrained to this list.
 */
const ALLOWED_SCHEMES = ['http', 'https', 'mailto'];

/**
 * Pure synchronous HTML sanitizer used on the write path for product
 * descriptions. Anything outside the allowlist is stripped, including
 * `<script>`, inline event handlers (`on*`), inline styles, and
 * non-allowlisted tags (`iframe`, `object`, `embed`, `style`, `link`).
 *
 * `null` and `undefined` are passed through unchanged so callers can
 * forward optional fields without an extra check.
 */
export function sanitizeHtml(
  input: string | null | undefined,
): string | null | undefined {
  if (input == null) return input;
  return sanitize(input, {
    allowedTags: [...ALLOWED_TAGS],
    allowedAttributes: {
      a: ['href'],
    },
    allowedSchemes: ALLOWED_SCHEMES,
    allowedSchemesByTag: { a: ALLOWED_SCHEMES },
    allowedSchemesAppliedToAttributes: ['href'],
    allowProtocolRelative: false,
    disallowedTagsMode: 'discard',
  });
}
