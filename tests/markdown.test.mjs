import assert from 'node:assert/strict';
import test from 'node:test';
import { renderMarkdown } from '../src/lib/markdown.ts';

test('renders a heading and paragraph', () => {
  const html = renderMarkdown('# Session title\n\nSome details here.');
  assert.match(html, /<h1[^>]*>Session title<\/h1>/);
  assert.match(html, /<p>Some details here\.<\/p>/);
});

test('renders emphasis and lists', () => {
  const html = renderMarkdown('**Bold** and *italic*.\n\n- one\n- two');
  assert.match(html, /<strong>Bold<\/strong>/);
  assert.match(html, /<em>italic<\/em>/);
  assert.match(html, /<li>one<\/li>/);
  assert.match(html, /<li>two<\/li>/);
});

test('sanitizes dangerous html', () => {
  const html = renderMarkdown('<script>alert(1)</script><p>safe</p>');
  assert.doesNotMatch(html, /<script/i);
  assert.match(html, /<p>safe<\/p>/);
});
