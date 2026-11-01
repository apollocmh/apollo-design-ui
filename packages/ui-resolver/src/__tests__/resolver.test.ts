import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { dirname, resolve } from 'node:path';
import ts from 'typescript';
import { describe, expect, it } from 'vitest';
import { componentImports } from '../component-imports';
import { ApolloResolver } from '../index';

const require = createRequire(import.meta.url);
const uiDirectory = dirname(require.resolve('@apollo-design/ui/package.json'));
const manifest: { exports: Record<string, string | { types: string; import: string }> } =
  JSON.parse(readFileSync(resolve(uiDirectory, 'package.json'), 'utf8'));
const readStyleManifest = (): {
  base: string;
  components: Record<string, { styles: string[] }>;
} => require('@apollo-design/ui/style-manifest.json');

describe('ApolloResolver', () => {
  it.each([
    ['AButton', 'Button', 'button'],
    ['AInputSearch', 'InputSearch', 'input'],
    ['AInputOtp', 'InputOTP', 'input'],
    ['ATextarea', 'TextArea', 'input'],
    ['AAutoComplete', 'AutoComplete', 'auto-complete'],
    ['AAutoCompleteOption', 'AutoCompleteOption', 'auto-complete'],
    ['ATimePicker', 'TimePicker', 'time-picker'],
    ['ATimeRangePicker', 'TimeRangePicker', 'time-picker'],
    ['ADatePickerRangePicker', 'RangePicker', 'date-picker'],
    ['ATypographyText', 'Text', 'typography'],
    ['ALayoutSider', 'LayoutSider', 'layout'],
    ['ASpaceCompact', 'SpaceCompact', 'space'],
    ['AFormItem', 'FormItem', 'form'],
    ['ASelectOption', 'SelectOption', 'select'],
    ['ADropdownButton', 'DropdownButton', 'dropdown'],
    ['ATableSummaryRow', 'TableSummaryRow', 'table'],
    ['ATableSummaryCell', 'TableSummaryCell', 'table'],
  ])('resolves the public %s import', async (tag, name, path) => {
    expect(await ApolloResolver({ importStyle: false }).resolve(tag)).toMatchObject({
      name,
      from: `@apollo-design/ui/${path}`,
    });
  });

  it.each([
    'Button',
    'a-button',
    'AUnknown',
    'AButtonGroup',
    'AMessage',
    'ANotification',
    'AFormField',
    'constructor',
    '__proto__',
  ])('does not take over %s', async (name) =>
    expect(await ApolloResolver().resolve(name)).toBeUndefined(),
  );

  it('maps special styles without inventing component CSS exports or importing themes', async () => {
    const styleManifest = readStyleManifest();
    expect(await ApolloResolver().resolve('AAutoComplete')).toMatchObject({
      sideEffects: styleManifest.components.select?.styles,
    });
    expect(await ApolloResolver().resolve('ATimePicker')).toMatchObject({
      sideEffects: styleManifest.components['date-picker']?.styles,
    });
    expect(await ApolloResolver().resolve('ALayoutSider')).toMatchObject({
      sideEffects: styleManifest.components['layout-sider']?.styles,
    });
  });

  it('can disable all automatic styles without changing JavaScript imports', async () => {
    const resolver = ApolloResolver({ importStyle: false });
    for (const [name, component] of componentImports) {
      expect(await resolver.resolve(name)).toEqual({
        name: component.name,
        from: `@apollo-design/ui/${component.path}`,
        sideEffects: undefined,
      });
    }
  });

  it('has no order-dependent CSS state across files or build sessions', async () => {
    const first = ApolloResolver();
    const initial = await first.resolve('AInput');
    await first.resolve('AButton');
    await first.resolve('AUnknown');
    expect(await first.resolve('AInput')).toEqual(initial);
    expect(await ApolloResolver().resolve('AInput')).toEqual(initial);
  });

  it('only maps published JavaScript and structural CSS package paths', async () => {
    const styleManifest = readStyleManifest();
    const exportsByPath = new Map<string, Set<string>>();
    const exportNames = (path: string): Set<string> => {
      const previous = exportsByPath.get(path);
      if (previous) return previous;
      const entry = manifest.exports[`./${path}`];
      if (!entry || typeof entry === 'string')
        throw new Error(`Missing public declaration entry: ${path}`);
      const file = resolve(uiDirectory, entry.types);
      const source = ts.createSourceFile(
        file,
        readFileSync(file, 'utf8'),
        ts.ScriptTarget.Latest,
        true,
      );
      const names = new Set<string>();
      for (const statement of source.statements) {
        if (
          ts.isExportDeclaration(statement) &&
          !statement.isTypeOnly &&
          statement.exportClause &&
          ts.isNamedExports(statement.exportClause)
        ) {
          for (const entry of statement.exportClause.elements)
            if (!entry.isTypeOnly) names.add(entry.name.text);
        } else if (ts.isExportAssignment(statement) && !statement.isExportEquals)
          names.add('default');
        else if (
          ts.canHaveModifiers(statement) &&
          ts
            .getModifiers(statement)
            ?.some((modifier) => modifier.kind === ts.SyntaxKind.ExportKeyword)
        ) {
          if (ts.isVariableStatement(statement)) {
            for (const declaration of statement.declarationList.declarations) {
              if (ts.isIdentifier(declaration.name)) names.add(declaration.name.text);
            }
          } else if (
            (ts.isFunctionDeclaration(statement) || ts.isClassDeclaration(statement)) &&
            statement.name
          ) {
            names.add(statement.name.text);
          }
        }
      }
      exportsByPath.set(path, names);
      return names;
    };
    for (const [tag, component] of componentImports) {
      expect(manifest.exports[`./${component.path}`], tag).toBeDefined();
      expect(
        exportNames(component.path).has(component.name),
        `${tag}: ${component.path}#${component.name}`,
      ).toBe(true);
      const result = await ApolloResolver().resolve(tag);
      assert.ok(result && typeof result === 'object', `${tag}: component import metadata`);
      if (!component.style) {
        expect(result.sideEffects, tag).toBeUndefined();
        continue;
      }
      const styles = styleManifest.components[component.style]?.styles;
      assert.ok(styles, `${tag}: manifest family ${component.style}`);
      expect(result.sideEffects, tag).toEqual(styles);
      expect(styles[0], tag).toBe(styleManifest.base);
      expect(new Set(styles).size, tag).toBe(styles.length);
      for (const style of styles) {
        expect(style, tag).toMatch(
          /^@apollo-design\/ui\/(?:base\.css|[\w-]+\/structure\.css|shared\/[\w-]+\.css)$/,
        );
        expect(manifest.exports[style.replace('@apollo-design/ui/', './')], tag).toBeDefined();
      }
    }
  });
});
