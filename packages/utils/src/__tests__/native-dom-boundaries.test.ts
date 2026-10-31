import { afterEach, describe, expect, it } from 'vitest';
import { triggerFocus } from '../dom/focus';
import { getElement } from '../dom/get-element';
import { isDOM, isDocument, isHTMLElement } from '../is';

afterEach(() => {
  document.body.innerHTML = '';
});

function foreignDocument(): Document {
  const frame = document.createElement('iframe');
  document.body.append(frame);
  const doc = frame.contentDocument;
  if (!doc) throw new Error('Same-origin iframe must have its actual document');
  return doc;
}

describe('native DOM input boundaries', () => {
  it('recognizes real foreign and adopted HTML/SVG elements through the existing DOM predicates', () => {
    const doc = foreignDocument();
    const html = doc.createElement('div');
    const svg = doc.createElementNS('http://www.w3.org/2000/svg', 'rect');
    doc.body.append(html, svg);
    expect(isDocument(doc)).toBe(true);
    expect(html instanceof HTMLElement).toBe(false);
    expect(isHTMLElement(html)).toBe(true);
    expect(isDOM(html)).toBe(true);
    expect(isDOM(svg)).toBe(true);
    expect(isHTMLElement(svg)).toBe(false);
    expect(getElement(html)).toBe(html);
    expect(getElement(svg)).toBe(svg);
    document.body.append(document.adoptNode(html));
    expect(isHTMLElement(html)).toBe(true);
    expect(getElement(html)).toBe(html);
    expect(isDOM(doc.createTextNode('Text'))).toBe(false);
    expect(isDOM({ nodeType: 1 })).toBe(false);
  });

  it('places the actual foreign input cursor after focusing in its own document', () => {
    const doc = foreignDocument();
    const input = doc.createElement('input');
    input.value = 'retained draft';
    doc.body.append(input);
    input.setSelectionRange(0, 0);
    triggerFocus(input, { cursor: 'end', preventScroll: true });
    expect(doc.activeElement).toBe(input);
    expect(input.selectionStart).toBe(input.value.length);
    expect(input.selectionEnd).toBe(input.value.length);
  });

  it('focuses an input whose native type has no selection range without inventing a cursor operation', () => {
    const input = document.createElement('input');
    input.type = 'number';
    document.body.append(input);
    expect(() => triggerFocus(input, { cursor: 'all' })).not.toThrow();
    expect(document.activeElement).toBe(input);
  });
});
