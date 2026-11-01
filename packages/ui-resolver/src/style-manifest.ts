import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);
const isStyles = (value: unknown): value is string[] =>
  Array.isArray(value) && value.every((entry) => typeof entry === 'string');

/** Only the versioned public JSON contract is loaded, never a UI JavaScript module. */
export function componentStyles(family: string): string[] {
  const manifest: unknown = require('@apollo-design/ui/style-manifest.json');
  if (!isRecord(manifest) || manifest.schemaVersion !== 1 || !isRecord(manifest.components)) {
    throw new Error('[ApolloResolver] Unsupported UI style manifest; schemaVersion 1 is required.');
  }
  const component = manifest.components[family];
  if (!isRecord(component) || !isStyles(component.styles)) {
    throw new Error(
      `[ApolloResolver] Missing structural styles for UI component family "${family}".`,
    );
  }
  return [...component.styles];
}
