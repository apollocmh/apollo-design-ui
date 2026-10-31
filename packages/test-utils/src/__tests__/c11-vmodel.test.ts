/**
 * C11 source guard for public runtime props, not a substitute for model behavior/types.
 * Index value exports select the constructors; private presentation components are excluded.
 * The local AST reads object/array props and emits (including local aliases/spreads), without
 * executing UI imports or building a TypeScript program. Type-only SFC declarations and
 * imported/factory-generated schemas remain the owning component's type/behavior responsibility.
 */
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import ts from 'typescript';
import { describe, expect, it } from 'vitest';

const UI_SRC = resolve(dirname(fileURLToPath(import.meta.url)), '../../../ui/src');
const VALUE_PROPS = ['value', 'checked', 'activeKey', 'current', 'fileList'] as const;
const EXEMPTED = new Map([
  ['checkbox/Checkbox.ts:value', 'Native option/form value; checked owns the model.'],
  ['radio/Radio.ts:value', 'Native option/form value; checked or the Group owns selection.'],
  [
    'radio/RadioButton.ts:value',
    'Option/form value forwarded to Radio; checked or the Group owns selection.',
  ],
  ['menu/Menu.ts:activeKey', 'Presentation focus input; selectedKeys/openKeys own public models.'],
  ['qr-code/QrCode.ts:value', 'Content to encode, not an editable model.'],
  [
    'statistic/Timer.ts:value',
    'Fixed target timestamp; change reports duration, not a new target (statistic/index.zh-CN.md).',
  ],
  [
    'statistic/Countdown.ts:value',
    'Fixed countdown target with the same documented non-model contract as Timer.',
  ],
]);

function parse(code: string): ts.SourceFile {
  const scripts = [...code.matchAll(/<script\b[^>]*>([\s\S]*?)<\/script>/g)];
  return ts.createSourceFile(
    'component.ts',
    scripts.length ? scripts.map((match) => match[1]).join('\n') : code,
    ts.ScriptTarget.Latest,
    true,
    ts.ScriptKind.TS,
  );
}

function localValues(source: ts.SourceFile): Map<string, ts.Expression> {
  const values = new Map<string, ts.Expression>();
  for (const statement of source.statements) {
    if (!ts.isVariableStatement(statement)) continue;
    for (const declaration of statement.declarationList.declarations) {
      if (ts.isIdentifier(declaration.name) && declaration.initializer) {
        values.set(declaration.name.text, declaration.initializer);
      }
    }
  }
  return values;
}

/** Resolve only value bindings reachable from this index's exports and static children. */
function publicImports(code: string): Map<string, Set<string>> {
  const source = parse(code);
  const values = localValues(source);
  const imports = new Map<string, { module: string; name: string }>();
  const result = new Map<string, Set<string>>();
  const used = new Set<string>();
  const add = (module: string, name: string) => {
    if (!module.startsWith('./')) return;
    const names = result.get(module) ?? new Set<string>();
    names.add(name);
    result.set(module, names);
  };
  for (const statement of source.statements) {
    if (!ts.isImportDeclaration(statement) || !ts.isStringLiteral(statement.moduleSpecifier))
      continue;
    const clause = statement.importClause;
    if (!clause || clause.isTypeOnly) continue;
    const module = statement.moduleSpecifier.text;
    if (clause.name) imports.set(clause.name.text, { module, name: 'default' });
    if (clause.namedBindings && ts.isNamedImports(clause.namedBindings)) {
      for (const item of clause.namedBindings.elements) {
        if (!item.isTypeOnly)
          imports.set(item.name.text, { module, name: (item.propertyName ?? item.name).text });
      }
    }
  }
  const references = (node: ts.Node): void => {
    if (ts.isIdentifier(node)) {
      if (used.has(node.text)) return;
      used.add(node.text);
      const imported = imports.get(node.text);
      if (imported) add(imported.module, imported.name);
      const value = values.get(node.text);
      if (value) references(value);
    } else ts.forEachChild(node, references);
  };
  for (const statement of source.statements) {
    if (ts.isExportAssignment(statement)) references(statement.expression);
    if (
      ts.isVariableStatement(statement) &&
      ts.getModifiers(statement)?.some((modifier) => modifier.kind === ts.SyntaxKind.ExportKeyword)
    ) {
      for (const declaration of statement.declarationList.declarations)
        references(declaration.name);
    }
    if (!ts.isExportDeclaration(statement) || statement.isTypeOnly) continue;
    const module = statement.moduleSpecifier;
    if (module && ts.isStringLiteral(module)) {
      if (!statement.exportClause) add(module.text, '*');
      else if (ts.isNamedExports(statement.exportClause)) {
        for (const item of statement.exportClause.elements) {
          if (!item.isTypeOnly) add(module.text, (item.propertyName ?? item.name).text);
        }
      }
    } else if (statement.exportClause && ts.isNamedExports(statement.exportClause)) {
      for (const item of statement.exportClause.elements)
        if (!item.isTypeOnly) references(item.propertyName ?? item.name);
    }
  }
  for (const statement of source.statements) {
    if (!ts.isExpressionStatement(statement) || !ts.isCallExpression(statement.expression))
      continue;
    const call = statement.expression;
    const target = call.arguments[0];
    if (
      call.expression.getText(source) === 'Object.assign' &&
      target &&
      ts.isIdentifier(target) &&
      used.has(target.text)
    ) {
      for (const argument of call.arguments.slice(1)) references(argument);
    }
  }
  return result;
}

function runtimeContracts(
  code: string,
  exported: ReadonlySet<string>,
  loadSchema?: (module: string) => string | undefined,
) {
  const source = parse(code);
  const values = localValues(source);
  const imports = new Map<string, { module: string; name: string }>();
  for (const statement of source.statements) {
    if (!ts.isImportDeclaration(statement) || !ts.isStringLiteral(statement.moduleSpecifier))
      continue;
    const clause = statement.importClause;
    if (clause?.isTypeOnly || !clause?.namedBindings || !ts.isNamedImports(clause.namedBindings))
      continue;
    for (const item of clause.namedBindings.elements) {
      if (!item.isTypeOnly)
        imports.set(item.name.text, {
          module: statement.moduleSpecifier.text,
          name: (item.propertyName ?? item.name).text,
        });
    }
  }
  const dereference = (expression: ts.Expression, visited = new Set<string>()): ts.Expression => {
    if (
      ts.isAsExpression(expression) ||
      ts.isSatisfiesExpression(expression) ||
      ts.isParenthesizedExpression(expression)
    )
      return dereference(expression.expression, visited);
    if (ts.isIdentifier(expression) && !visited.has(expression.text)) {
      const value = values.get(expression.text);
      if (value) {
        visited.add(expression.text);
        return dereference(value, visited);
      }
    }
    return expression;
  };
  const schema = (expression: ts.Expression): ts.Expression => {
    const value = dereference(expression);
    if (!ts.isIdentifier(value)) return value;
    const imported = imports.get(value.text);
    if (!imported?.module.startsWith('.')) return value;
    const code = loadSchema?.(imported.module);
    const declaration =
      code === undefined ? undefined : localValues(parse(code)).get(imported.name);
    // The actual shared input/select schemas are direct objects. Do not resolve a module graph.
    return declaration &&
      (ts.isObjectLiteralExpression(declaration) || ts.isArrayLiteralExpression(declaration))
      ? declaration
      : value;
  };
  const members = (expression: ts.Expression): Map<string, ts.Expression> => {
    const object = schema(expression);
    const entries = new Map<string, ts.Expression>();
    if (!ts.isObjectLiteralExpression(object)) return entries;
    for (const property of object.properties) {
      if (ts.isSpreadAssignment(property)) {
        for (const [name, value] of members(property.expression)) entries.set(name, value);
      } else if (
        ts.isPropertyAssignment(property) &&
        (ts.isIdentifier(property.name) || ts.isStringLiteral(property.name))
      )
        entries.set(property.name.text, property.initializer);
      else if (ts.isShorthandPropertyAssignment(property))
        entries.set(property.name.text, property.name);
    }
    return entries;
  };
  const keys = (expression: ts.Expression | undefined): Set<string> => {
    if (!expression) return new Set();
    const value = schema(expression);
    if (ts.isArrayLiteralExpression(value))
      return new Set(value.elements.filter(ts.isStringLiteral).map((item) => item.text));
    return new Set(members(value).keys());
  };
  const contracts: { props: Set<string>; emits: Set<string> }[] = [];
  const optionsOf = (expression: ts.Expression): void => {
    const value = dereference(expression);
    if (ts.isCallExpression(value)) {
      const callee = value.expression.getText(source);
      if (callee === 'defineComponent' || callee === 'withInstall' || callee === 'Object.assign') {
        for (const argument of callee === 'Object.assign'
          ? value.arguments
          : value.arguments.slice(0, 1))
          optionsOf(argument);
      }
    } else if (ts.isObjectLiteralExpression(value)) {
      const options = members(value);
      if (options.has('props'))
        contracts.push({ props: keys(options.get('props')), emits: keys(options.get('emits')) });
    }
  };
  for (const statement of source.statements) {
    if (ts.isExportAssignment(statement) && (exported.has('default') || exported.has('*')))
      optionsOf(statement.expression);
    if (ts.isVariableStatement(statement)) {
      for (const declaration of statement.declarationList.declarations) {
        if (
          ts.isIdentifier(declaration.name) &&
          declaration.initializer &&
          (exported.has(declaration.name.text) ||
            (exported.has('*') &&
              ts
                .getModifiers(statement)
                ?.some((modifier) => modifier.kind === ts.SyntaxKind.ExportKeyword)))
        )
          optionsOf(declaration.initializer);
      }
    }
    if (
      ts.isExportDeclaration(statement) &&
      !statement.moduleSpecifier &&
      statement.exportClause &&
      ts.isNamedExports(statement.exportClause)
    ) {
      for (const item of statement.exportClause.elements) {
        if (!item.isTypeOnly && (exported.has(item.name.text) || exported.has('*'))) {
          const value = values.get((item.propertyName ?? item.name).text);
          if (value) optionsOf(value);
        }
      }
    }
  }
  return contracts;
}

function sourcePath(base: string): string | undefined {
  return ['', '.ts', '.tsx', '.vue']
    .map((ext) => base + ext)
    .find((path) => /\.(ts|tsx|vue)$/.test(path) && existsSync(path));
}

function publicRuntimeState(): { declared: Set<string>; missing: Set<string> } {
  const declared = new Set<string>();
  const missing = new Set<string>();
  for (const entry of readdirSync(UI_SRC, { withFileTypes: true })) {
    if (!entry.isDirectory()) continue;
    const index = join(UI_SRC, entry.name, 'index.ts');
    if (!existsSync(index)) continue;
    for (const [module, names] of publicImports(readFileSync(index, 'utf8'))) {
      const base = join(dirname(index), module);
      const file = sourcePath(base);
      if (!file) continue;
      const keyPrefix = `${entry.name}/${file.slice(dirname(index).length + 1)}`;
      for (const contract of runtimeContracts(readFileSync(file, 'utf8'), names, (module) => {
        const path = sourcePath(resolve(dirname(file), module));
        return path ? readFileSync(path, 'utf8') : undefined;
      })) {
        for (const prop of VALUE_PROPS) {
          if (!contract.props.has(prop)) continue;
          const key = `${keyPrefix}:${prop}`;
          declared.add(key);
          // Keep the guard's eventful-component scope; data-only props do not imply models.
          if (contract.emits.size > 0 && !contract.emits.has(`update:${prop}`)) missing.add(key);
        }
      }
    }
  }
  return { declared, missing };
}

const state = publicRuntimeState();
describe('护栏 · C11 public runtime v-model 通道', () => {
  it('公共候选排除私有输入，AST 排除参数/类型/注释对象', () => {
    const imports = publicImports(`
      import Public from './Public'; import Private from './Private';
      import Child from './Child'; import type { Shape } from './Types';
      export const Main = withInstall(Public); const hidden = Private;
      Object.assign(Main, { Child }); export type { Shape };
    `);
    expect([...imports]).toEqual([
      ['./Public', new Set(['default'])],
      ['./Child', new Set(['default'])],
    ]);
    const contracts = runtimeContracts(
      `
      const props = { fileList: Array };
      const emits = { 'update:fileList': (_files: File[]) => true };
      const Private = defineComponent({ props: { checked: Boolean }, emits: { change: () => true } });
      export default defineComponent({ props: { ...props }, emits, setup() {
        const onBatchStart = (current: { file: File }[]) => {};
      } });
    `,
      new Set(['default']),
    );
    expect(contracts).toEqual([
      { props: new Set(['fileList']), emits: new Set(['update:fileList']) },
    ]);
    expect(
      runtimeContracts(
        `
      import { sharedEmits } from './emits';
      export default defineComponent({ props: { value: String }, emits: { ...sharedEmits, change: () => true } });
    `,
        new Set(['default']),
        (module) =>
          module === './emits'
            ? `export const sharedEmits = { 'update:value': (_value: string) => true };`
            : undefined,
      ),
    ).toEqual([{ props: new Set(['value']), emits: new Set(['update:value', 'change']) }]);
    expect(
      runtimeContracts(
        `export default defineComponent({ props: { current: Number }, emits: ['change'] });`,
        new Set(['default']),
      ),
    ).toEqual([{ props: new Set(['current']), emits: new Set(['change']) }]);
  });

  it('公共 runtime state prop 必须有对应 update 通道（精确非 model 输入除外）', () => {
    expect(state.declared.size).toBeGreaterThan(0);
    expect(
      [...state.missing].filter((key) => !EXEMPTED.has(key)).sort(),
      '公共受控 prop 缺少模型通道；源码扫描仅定位线索，修复仍需实际行为和类型证据。',
    ).toEqual([]);
  });

  it('公共非 model 豁免必须仍适用，理由不能为空', () => {
    for (const [key, reason] of EXEMPTED) {
      expect(reason.trim()).not.toBe('');
      expect(state.declared.has(key), `豁免 ${key} 不再对应公开 runtime prop`).toBe(true);
      expect(state.missing.has(key), `豁免 ${key} 已不再需要`).toBe(true);
    }
  });
});
