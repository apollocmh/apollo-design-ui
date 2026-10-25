/** F11: source inventory, not automatic runtime acceptance or API migration. */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import ts from 'typescript';
import { parse } from 'vue/compiler-sfc';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../..');
const compare = (a, b) => (a < b ? -1 : a > b ? 1 : 0);
const VERIFIED = {
  'mentions:MentionsProps:notFoundContent':
    'docs/audit/2026-10-25-mentions-empty-content-remediation.md',
  'tooltip:TooltipProps:title': 'docs/audit/2026-10-25-overlay-content-slots-remediation.md',
  'popover:PopoverProps:title': 'docs/audit/2026-10-25-overlay-content-slots-remediation.md',
  'popover:PopoverProps:content': 'docs/audit/2026-10-25-overlay-content-slots-remediation.md',
  'popconfirm:PopconfirmProps:title': 'docs/audit/2026-10-25-overlay-content-slots-remediation.md',
  'popconfirm:PopconfirmProps:description':
    'docs/audit/2026-10-25-overlay-content-slots-remediation.md',
  'popconfirm:PopconfirmProps:icon': 'docs/audit/2026-10-25-popconfirm-icon-slot-remediation.md',
  'list:ListItemProps:extra': 'docs/audit/2026-10-24-list-item-slots-remediation.md',
  'list:ListItemProps:actions': 'docs/audit/2026-10-24-list-item-slots-remediation.md',
  'list:ListItemMetaProps:avatar': 'docs/audit/2026-10-24-list-item-slots-remediation.md',
  'list:ListItemMetaProps:title': 'docs/audit/2026-10-24-list-item-slots-remediation.md',
  'list:ListItemMetaProps:description': 'docs/audit/2026-10-24-list-item-slots-remediation.md',
  'list:ListProps:header': 'docs/audit/2026-10-24-list-slots-remediation.md',
  'list:ListProps:footer': 'docs/audit/2026-10-24-list-slots-remediation.md',
  'list:ListProps:loadMore': 'docs/audit/2026-10-24-list-slots-remediation.md',
  'badge:BadgeProps:count': 'docs/audit/2026-10-24-badge-slots-remediation.md',
  'badge:BadgeProps:text': 'docs/audit/2026-10-24-badge-slots-remediation.md',
  'input-number:InputNumberProps:prefix': 'docs/audit/2026-10-23-vue-reactivity-remediation.md',
  'input-number:InputNumberProps:suffix': 'docs/audit/2026-10-23-vue-reactivity-remediation.md',
};

function filesUnder(dir) {
  return fs
    .readdirSync(dir, { withFileTypes: true })
    .sort((a, b) => compare(a.name, b.name))
    .flatMap((entry) =>
      entry.isDirectory() ? filesUnder(path.join(dir, entry.name)) : [path.join(dir, entry.name)],
    );
}

export function buildSlotInventory({
  repoRoot = ROOT,
  uiRoot = path.join(repoRoot, 'packages/ui/src'),
} = {}) {
  const files = filesUnder(uiRoot);
  const interfaces = files.filter((file) => path.basename(file) === 'interface.ts');
  const config = ts.readConfigFile(path.join(repoRoot, 'tsconfig.json'), ts.sys.readFile);
  const options = ts.convertCompilerOptionsFromJson(
    config.config?.compilerOptions ?? {},
    repoRoot,
  ).options;
  const program = ts.createProgram(interfaces, options);
  const checker = program.getTypeChecker();
  const relative = (file) => path.relative(repoRoot, file).split(path.sep).join('/');

  // Follow type aliases and imported aliases, including inherited fields. Do not expand data
  // interfaces into their callers: items[].label must not make items a top-level content prop.
  function contentKind(node, seen = new Set()) {
    if (!node) return null;
    if (ts.isFunctionTypeNode(node)) return contentKind(node.type, seen) ? 'renderer' : null;
    if (ts.isTypeReferenceNode(node)) {
      let symbol = checker.getSymbolAtLocation(node.typeName);
      if (symbol?.flags & ts.SymbolFlags.Alias) symbol = checker.getAliasedSymbol(symbol);
      if (['VNodeChild', 'VNode'].includes(symbol?.name ?? node.typeName.getText())) return 'node';
      if (symbol && !seen.has(symbol)) {
        const next = new Set(seen).add(symbol);
        for (const declaration of symbol.declarations ?? []) {
          if (ts.isTypeAliasDeclaration(declaration)) {
            const kind = contentKind(declaration.type, next);
            if (kind) return kind;
          }
        }
      }
      for (const argument of node.typeArguments ?? []) {
        const kind = contentKind(argument, seen);
        if (kind) return kind;
      }
      return null;
    }
    let kind = null;
    ts.forEachChild(node, (child) => {
      const nested = contentKind(child, seen);
      if (nested === 'renderer' || !kind) kind = nested ?? kind;
    });
    return kind;
  }

  function hasInlineConfiguration(node) {
    if (!node || ts.isFunctionTypeNode(node)) return false;
    if (ts.isTypeLiteralNode(node)) return true;
    let found = false;
    ts.forEachChild(node, (child) => {
      if (hasInlineConfiguration(child)) found = true;
    });
    return found;
  }

  const hints = new Map();
  for (const file of files.filter(
    (file) => /\.(vue|tsx?)$/.test(file) && !file.endsWith('.test-d.ts'),
  )) {
    const component = path.relative(uiRoot, file).split(path.sep)[0];
    const source = fs.readFileSync(file, 'utf8');
    const isDemo = file.includes(`${path.sep}demo${path.sep}`);
    const isTest = file.includes(`${path.sep}__tests__${path.sep}`);
    const block = file.endsWith('.vue') ? parse(source).descriptor : null;
    const script = block
      ? [block.script?.content, block.scriptSetup?.content].filter(Boolean).join('\n')
      : source;
    const ast = ts.createSourceFile(file, script, ts.ScriptTarget.Latest, true);
    const record = (name, channel) => {
      const key = `${component}:${name}`;
      const value = hints.get(key) ?? {
        runtime: new Set(),
        type: new Set(),
        demo: new Set(),
        test: new Set(),
      };
      value[channel].add(relative(file));
      hints.set(key, value);
    };
    const visit = (node) => {
      if (
        ts.isPropertyAccessExpression(node) &&
        ts.isIdentifier(node.expression) &&
        ['slots', '$slots'].includes(node.expression.text)
      ) {
        record(node.name.text, isTest ? 'test' : isDemo ? 'demo' : 'runtime');
      }
      if (ts.isPropertyAssignment(node) && isTest && node.name && ts.isIdentifier(node.name))
        record(node.name.text, 'test');
      if (ts.isInterfaceDeclaration(node) && /Slots$/.test(node.name.text)) {
        for (const member of node.members)
          if (member.name && ts.isIdentifier(member.name)) record(member.name.text, 'type');
      }
      ts.forEachChild(node, visit);
    };
    visit(ast);
    // Template hints only; a matching name does not prove the target component consumes it.
    for (const match of block?.template?.content.matchAll(
      /(?:#([\w-]+)|<slot\b[^>]*\bname=["']([\w-]+)["'])/g,
    ) ?? []) {
      record(match[1] ?? match[2], isDemo ? 'demo' : isTest ? 'test' : 'runtime');
    }
  }

  const rows = [];
  for (const file of interfaces) {
    const ast = program.getSourceFile(file);
    if (!ast) continue;
    const component = path.relative(uiRoot, file).split(path.sep)[0];
    for (const owner of ast.statements.filter(ts.isInterfaceDeclaration)) {
      const ownerName = owner.name.text;
      for (const property of checker.getPropertiesOfType(checker.getTypeAtLocation(owner))) {
        const declaration = property.declarations?.find(ts.isPropertySignature);
        const kind = contentKind(declaration?.type);
        if (!kind || !declaration) continue;
        const prop = property.name;
        const sourceFile = declaration.getSourceFile();
        const source = `${relative(sourceFile.fileName)}:${sourceFile.getLineAndCharacterOfPosition(declaration.getStart()).line + 1}`;
        const internal =
          /(?:^|\/)(?:_internal|engine|components)\//.test(relative(file)) ||
          /^(?:Internal|ScrollNumber)/.test(ownerName) ||
          /Slots$/.test(ownerName);
        const deprecated = !!ts.getJSDocDeprecatedTag(declaration);
        const category = deprecated
          ? 'deprecated'
          : internal
            ? 'internal'
            : !/Props$/.test(ownerName)
              ? 'data'
              : hasInlineConfiguration(declaration.type)
                ? 'configuration'
                : kind === 'renderer'
                  ? 'render-function-candidate'
                  : 'component-content-candidate';
        const data = category === 'data' || category === 'configuration';
        const evidence = VERIFIED[`${component}:${ownerName}:${prop}`];
        const hint = hints.get(`${component}:${prop}`);
        const channel = (name) => ({
          status: hint?.[name].size ? 'source-reference' : 'not-found',
          files: [...(hint?.[name] ?? [])].sort(),
        });
        rows.push({
          component,
          owner: ownerName,
          prop,
          category,
          source,
          slotRuntime: {
            ...channel('runtime'),
            status: evidence ? 'verified' : hint?.runtime.size ? 'source-reference' : 'not-run',
            ...(evidence ? { report: evidence } : {}),
          },
          slotType: channel('type'),
          slotDemo: channel('demo'),
          slotTest: channel('test'),
          decision: evidence
            ? 'implemented-verified'
            : deprecated || internal
              ? 'skip'
              : data
                ? 'keep-data'
                : 'review',
          reason: evidence
            ? '本轮运行证据仅覆盖该具体字段，见报告。'
            : deprecated
              ? '@deprecated 字段不新增内容通道。'
              : internal
                ? '内部/插槽协议，不作为公共内容 prop 缺口。'
                : data
                  ? '数据或配置字段，不能机械补同名组件插槽；必要时逐项评估 scoped slot。'
                  : 'Props 命名仅为候选；须核对公开组件、实际消费、别名和契约。静态命中不代表运行通过，未命中也不直接判定缺少插槽。',
        });
      }
    }
  }
  rows.sort((a, b) =>
    compare(
      `${a.component}:${a.owner}:${a.prop}:${a.source}`,
      `${b.component}:${b.owner}:${b.prop}:${b.source}`,
    ),
  );
  const byCategory = {};
  const byDecision = {};
  for (const row of rows) {
    byCategory[row.category] = (byCategory[row.category] ?? 0) + 1;
    byDecision[row.decision] = (byDecision[row.decision] ?? 0) + 1;
  }
  return {
    schemaVersion: 1,
    scope:
      '**/interface.ts 中含 VNodeChild/VNode 的接口属性（跟踪别名和继承；每个 owner/field 一行，继承字段可在多个 owner 出现）；不展开数据接口，不覆盖单独 SFC/TS 内联 props。',
    limitations: [
      'source-reference 仅为线索，须核对实际目标与运行证据；slot 别名/动态键可能未命中。',
      'Props 名称不是公开组件证明，candidate 必须人工核实；data 分类不否定数据项 renderer 的专项评估。',
      '没有把全部候选当成必须新增的 slot，也不以本清单关闭 F11 或宣称全仓已验证。',
    ],
    summary: { interfaceFiles: interfaces.length, rows: rows.length, byCategory, byDecision },
    rows,
  };
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const args = process.argv.slice(2);
  const index = args.indexOf('--output');
  const output = path.resolve(
    index >= 0
      ? args[index + 1]
      : path.join(ROOT, 'docs/audit/evidence/content-slot-inventory.json'),
  );
  const result = buildSlotInventory();
  const text = `${JSON.stringify(result, null, 2)}\n`;
  if (args.includes('--check')) {
    if (!fs.existsSync(output) || fs.readFileSync(output, 'utf8') !== text) {
      console.error('Content slot inventory drift; regenerate and review the source evidence.');
      process.exitCode = 1;
    }
  } else {
    fs.mkdirSync(path.dirname(output), { recursive: true });
    fs.writeFileSync(output, text);
  }
  console.log(JSON.stringify(result.summary));
}
