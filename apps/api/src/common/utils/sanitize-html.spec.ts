import { sanitizeHtml } from './sanitize-html';

describe('sanitizeHtml', () => {
  it('returns undefined and null unchanged', () => {
    expect(sanitizeHtml(undefined)).toBeUndefined();
    expect(sanitizeHtml(null)).toBeNull();
    expect(sanitizeHtml('')).toBe('');
  });

  it('returns plain text unchanged', () => {
    expect(sanitizeHtml('Hello world')).toBe('Hello world');
  });

  it('keeps allowed formatting tags', () => {
    const input = '<p>Hello <strong>world</strong></p>';
    const result = sanitizeHtml(input);
    expect(result).toContain('<p>');
    expect(result).toContain('<strong>');
  });

  it('strips script tags and script content', () => {
    const result = sanitizeHtml('<p>safe<script>alert(1)</script></p>');
    expect(result).not.toContain('<script');
    expect(result).not.toContain('alert(1)');
    expect(result).toContain('<p>safe</p>');
  });

  it('strips inline event handlers', () => {
    const result = sanitizeHtml(
      '<img src="x" onerror="alert(1)"><a href="https://example.com" onclick="evil()">link</a>',
    );
    expect(result).not.toMatch(/onerror/i);
    expect(result).not.toMatch(/onclick/i);
    expect(result).not.toMatch(/alert\(1\)/);
    expect(result).not.toMatch(/evil\(\)/);
  });

  it('strips inline style attributes', () => {
    const result = sanitizeHtml('<p style="color:red">x</p>');
    expect(result).not.toMatch(/style=/i);
    expect(result).toContain('<p>x</p>');
  });

  it('strips iframe, object, embed, style, and link tags', () => {
    const html =
      '<iframe src="evil"></iframe><object data="x"></object><embed src="x"><style>body{}</style><link rel="stylesheet" href="x">';
    const result = sanitizeHtml(html);
    expect(result).not.toContain('<iframe');
    expect(result).not.toContain('<object');
    expect(result).not.toContain('<embed');
    expect(result).not.toContain('<style');
    expect(result).not.toContain('<link');
  });

  it('keeps anchor tags with safe https href', () => {
    const result = sanitizeHtml('<a href="https://example.com">link</a>');
    expect(result).toContain('href="https://example.com"');
  });

  it('keeps anchor tags with http href', () => {
    const result = sanitizeHtml('<a href="http://example.com">link</a>');
    expect(result).toContain('href="http://example.com"');
  });

  it('keeps anchor tags with mailto href', () => {
    const result = sanitizeHtml('<a href="mailto:a@b.com">mail</a>');
    expect(result).toContain('href="mailto:a@b.com"');
  });

  it('strips anchor href with javascript scheme', () => {
    const result = sanitizeHtml('<a href="javascript:alert(1)">x</a>');
    expect(result).not.toMatch(/javascript:/i);
    expect(result).not.toMatch(/alert\(1\)/);
    expect(result).toContain('<a>x</a>');
  });

  it('strips anchor href with data scheme', () => {
    const result = sanitizeHtml('<a href="data:text/plain,hello">x</a>');
    expect(result).not.toMatch(/data:/i);
    expect(result).toContain('<a>x</a>');
  });

  it('keeps list and heading tags', () => {
    const input = '<h2>Title</h2><ul><li>one</li><li>two</li></ul><ol><li>three</li></ol>';
    const result = sanitizeHtml(input);
    expect(result).toContain('<h2>Title</h2>');
    expect(result).toContain('<ul>');
    expect(result).toContain('<ol>');
    expect(result).toContain('<li>three</li>');
  });

  it('keeps code, pre, em, u, blockquote, and br tags', () => {
    const result = sanitizeHtml(
      '<pre><code>const x = 1;</code></pre><em>e</em><u>u</u><br><blockquote>b</blockquote>',
    );
    expect(result).toContain('<pre>');
    expect(result).toContain('<code>');
    expect(result).toContain('<em>');
    expect(result).toContain('<u>');
    expect(result).toContain('<br');
    expect(result).toContain('<blockquote>');
  });
});
