/** Build-only resource compiler. The resolver consumes its JSON output, not this module. */
import {
  BASE_CSS,
  COMPONENT_STYLES,
  type ComponentStyleEntry,
  componentStyleEntries,
  STATIC_PREFIX_CLS,
} from './index';
import { joinStyleSources, type SharedStylePart } from './source';

export interface StyleManifestComponent {
  structure: string;
  dependencies: string[];
  shared: string[];
  styles: string[];
}

export interface StyleManifest {
  schemaVersion: 1;
  base: string;
  order: string[];
  components: Record<string, StyleManifestComponent>;
  shared: Record<string, { style: string; dependencies: string[] }>;
}

export interface StyleAssets {
  files: Record<string, string>;
  manifest: StyleManifest;
}

const specifier = (file: string) => `@apollo-design/ui/${file}`;

/** One dependency graph and explicit source pieces supply every resource and closure. */
export function genStyleAssets(
  definitions: readonly ComponentStyleEntry[] = COMPONENT_STYLES,
  prefixes: readonly string[] = STATIC_PREFIX_CLS,
): StyleAssets {
  const entries = definitions.map((entry) => ({
    entry,
    sources: prefixes.map(
      (prefix) => entry.source?.(prefix) ?? joinStyleSources([entry.gen(prefix)], ''),
    ),
  }));
  const sharedParts = new Map<string, SharedStylePart>();
  const resources = new Map<string, SharedStylePart[]>();
  const files: Record<string, string> = { 'base.css': BASE_CSS };
  for (const { entry, sources } of entries) {
    for (const source of sources) {
      for (const part of source.shared) {
        const previous = sharedParts.get(part.name);
        if (previous) {
          if (previous.resource !== part.resource || previous.css !== part.css) {
            throw new Error(`[apollo: style] Conflicting shared style part: ${part.name}`);
          }
          continue;
        }
        sharedParts.set(part.name, part);
        const group = resources.get(part.resource) ?? [];
        group.push(part);
        resources.set(part.resource, group);
      }
    }
    files[`${entry.name}/structure.css`] = sources.map((source) => source.structure).join('\n');
  }
  const shared: StyleManifest['shared'] = {};
  for (const [name, parts] of resources) {
    const file = `shared/${name}.css`;
    files[file] = parts.map((part) => part.css).join('\n');
    shared[name] = { style: specifier(file), dependencies: [] };
  }
  const order = [
    specifier('base.css'),
    ...Object.values(shared).map((part) => part.style),
    ...definitions.map((entry) => specifier(`${entry.name}/structure.css`)),
  ];
  const components: StyleManifest['components'] = {};
  for (const { entry, sources } of entries) {
    const closure = new Set(componentStyleEntries(entry.name, definitions));
    const included = new Set([specifier('base.css')]);
    const ownShared = new Set<string>();
    for (const source of sources) {
      for (const part of source.shared) ownShared.add(specifier(`shared/${part.resource}.css`));
    }
    for (const { entry: dependency, sources: dependencySources } of entries) {
      if (!closure.has(dependency)) continue;
      included.add(specifier(`${dependency.name}/structure.css`));
      for (const source of dependencySources) {
        for (const part of source.shared) included.add(specifier(`shared/${part.resource}.css`));
      }
    }
    components[entry.name] = {
      structure: specifier(`${entry.name}/structure.css`),
      dependencies: [...(entry.dependencies ?? [])],
      shared: order.filter((resource) => ownShared.has(resource)),
      styles: order.filter((resource) => included.has(resource)),
    };
  }
  return {
    files,
    manifest: { schemaVersion: 1, base: specifier('base.css'), order, components, shared },
  };
}
