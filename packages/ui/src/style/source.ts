/** Explicit source composition: complete manual CSS and independently importable structure. */
export interface SharedStylePart {
  name: string;
  resource: string;
  css: string;
}

interface RequiredStyle {
  css: string;
  parts: readonly SharedStylePart[];
}

export interface StyleSource {
  css: string;
  structure: string;
  shared: readonly SharedStylePart[];
  embedded: readonly string[];
  required: readonly RequiredStyle[];
}

type StyleInput = string | SharedStylePart | StyleSource;

export function joinStyleSources(inputs: readonly StyleInput[], separator: string): StyleSource {
  const css: string[] = [];
  const structure: string[] = [];
  const shared = new Map<string, SharedStylePart>();
  const embedded = new Set<string>();
  const required: RequiredStyle[] = [];
  for (const input of inputs) {
    if (typeof input === 'string') {
      css.push(input);
      structure.push(input);
    } else if ('structure' in input) {
      css.push(input.css);
      structure.push(input.structure);
      for (const part of input.shared) shared.set(part.name, part);
      for (const name of input.embedded) embedded.add(name);
      required.push(...input.required);
    } else {
      css.push(input.css);
      structure.push('');
      shared.set(input.name, input);
      embedded.add(input.name);
    }
  }
  return {
    css: css.join(separator),
    structure: structure.join(separator),
    shared: [...shared.values()],
    embedded: [...embedded],
    required,
  };
}

export function styleSource(strings: TemplateStringsArray, ...values: StyleInput[]): StyleSource {
  const inputs: StyleInput[] = [];
  for (const [index, text] of strings.entries()) {
    inputs.push(text);
    const value = values[index];
    if (value !== undefined) inputs.push(value);
  }
  return joinStyleSources(inputs, '');
}

export function mapStyleSource(source: StyleSource, map: (css: string) => string): StyleSource {
  return { ...source, css: map(source.css), structure: map(source.structure) };
}

/** These exact historical copies are already supplied by the existing neutral BASE_CSS. */
export function baseStylePart(css: string): StyleSource {
  return { css, structure: '', shared: [], embedded: [], required: [] };
}

/** A source consumer needs these rules, but its manual generator does not embed them. */
export function requireStyleSource(source: StyleSource): StyleSource {
  return {
    css: '',
    structure: '',
    shared: source.shared,
    embedded: [],
    required: [{ css: source.css, parts: source.shared }],
  };
}
