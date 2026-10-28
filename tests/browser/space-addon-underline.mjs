/** Source-only SpaceAddon border/state/Compact matrix; no package build or dist reads. */
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import fs from 'node:fs';
import { createRequire } from 'node:module';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { launchBrowser } from '../visual/stabilize.mjs';

const repo = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const output =
  process.env.SPACE_ADDON_EVIDENCE_DIR ??
  fs.mkdtempSync(path.join(tmpdir(), 'apollo-addon-underline-'));
fs.mkdirSync(output, { recursive: true });
const phase = 'source';
const require = createRequire(path.join(repo, 'package.json'));
const { createServer } = await import(pathToFileURL(require.resolve('vite')).href);
const { default: vue } = await import(pathToFileURL(require.resolve('@vitejs/plugin-vue')).href);
const fixture = path.join(output, 'source-fixture');
fs.mkdirSync(fixture, { recursive: true });
if (!fs.existsSync(path.join(fixture, 'node_modules')))
  fs.symlinkSync(path.join(repo, 'node_modules'), path.join(fixture, 'node_modules'), 'dir');
const source = (rel) => path.join(repo, rel);
const styleFile = source('packages/ui/src/space/style/index.ts');
const sha = (value) => createHash('sha256').update(value).digest('hex');
const styleHash = sha(fs.readFileSync(styleFile));
const sourceFiles = [
  'packages/ui/src/space/style/index.ts',
  'packages/ui/src/space/Addon.vue',
  'packages/ui/src/space/Compact.vue',
  'packages/ui/src/space/Compact.ts',
];
const sourceHashes = Object.fromEntries(
  sourceFiles.map((file) => [file, sha(fs.readFileSync(source(file)))]),
);
fs.writeFileSync(
  path.join(fixture, 'index.html'),
  '<!doctype html><html lang="en"><head><meta charset="UTF-8"><link rel="icon" href="data:,"><title>SpaceAddon source matrix</title></head><body><div id="app"></div><script type="module" src="/entry.js"></script></body></html>',
);
fs.writeFileSync(
  path.join(fixture, 'entry.js'),
  `
import {createApp,defineComponent,h,nextTick,reactive} from 'vue';
import Addon from ${JSON.stringify(source('packages/ui/src/space/Addon.vue'))};
import Compact from ${JSON.stringify(source('packages/ui/src/space/Compact.vue'))};
import ConfigProvider from ${JSON.stringify(source('packages/ui/src/config-provider/ConfigProvider.ts'))};
import {defaultAlgorithm,darkAlgorithm,compactAlgorithm,getCSSVarDeclarations,getDesignToken,transformToken,useTheme} from '@apollo-design/theme';
import {genSpaceStyle} from ${JSON.stringify(styleFile)};
const style=document.createElement('style');style.dataset.addonSourceStyles='';style.textContent=getCSSVarDeclarations(getDesignToken())+'\\n'+genSpaceStyle('apollo')+'\\nbody{margin:0;}section{margin:8px 0;}';document.head.append(style);
const state=reactive({theme:'default',size:'middle',orientation:'horizontal',direction:'ltr'});
const algorithms={default:defaultAlgorithm,dark:darkAlgorithm,compact:compactAlgorithm,both:[darkAlgorithm,compactAlgorithm]};
const Frame=defineComponent({setup(){const theme=useTheme();return()=>h('main',{id:'matrix',style:{...transformToken(theme.token.value).vars,padding:'16px',background:'var(--apollo-color-bg-container)',color:'var(--apollo-color-text)'}},[
 h('h1',{style:{fontSize:'20px'}},'SpaceAddon '+JSON.stringify(state)),
 ...['outlined','filled','borderless','underlined'].flatMap(variant=>['','error','warning'].flatMap(status=>[false,true].flatMap(disabled=>['single','chain'].map(group=>{
  const key=[variant,status||'normal',String(disabled),group].join('-');
  return h('section',{key,'data-group':key},[
   h('p',{style:{margin:'0 0 4px'}},key),
   h(Compact,{size:state.size,orientation:state.orientation},()=>Array.from({length:group==='single'?1:3},(_,index)=>h(Addon,{key:index,variant,status,disabled,'data-addon-cell':'','data-variant':variant,'data-status':status,'data-disabled':String(disabled),'data-group-kind':group,'data-index':String(index),style:{paddingBlock:'6px'}},()=>variant+' '+(status||'normal')+' '+index)))
  ]);
 }))))
]);}});
createApp({render:()=>h(ConfigProvider,{direction:state.direction,componentSize:state.size,theme:{algorithm:algorithms[state.theme]}},()=>h(Frame))}).mount('#app');
window.addonUnderlineAudit={async setBatch(patch){Object.assign(state,patch);await nextTick();await new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve)));},snapshot:()=>({...state})};
`,
);
const aliases = fs
  .readdirSync(path.join(repo, 'packages'), { withFileTypes: true })
  .filter(
    (item) => item.isDirectory() && fs.existsSync(source(`packages/${item.name}/src/index.ts`)),
  )
  .map((item) => ({
    find: new RegExp(`^@apollo-design/${item.name}$`),
    replacement: source(`packages/${item.name}/src/index.ts`),
  }));
const resolvedSources = new Set();
const forbidden = [];
const guard = {
  name: 'addon-source-only-guard',
  enforce: 'pre',
  load(id) {
    if (id.startsWith(path.join(repo, 'packages') + path.sep)) {
      resolvedSources.add(id);
      if (/\/dist\//.test(id)) {
        forbidden.push(id);
        throw new Error(`Published artifact forbidden during source preflight: ${id}`);
      }
    }
    return null;
  },
};
let server, browser;
const results = [],
  errors = [],
  requests = [];
try {
  server = await createServer({
    root: fixture,
    configFile: false,
    publicDir: false,
    cacheDir: path.join(output, 'vite-cache'),
    logLevel: 'error',
    plugins: [guard, vue()],
    resolve: { alias: aliases },
    optimizeDeps: { noDiscovery: true, include: ['vue'] },
    server: { host: '127.0.0.1', port: 0, hmr: false, fs: { allow: [repo, fixture] } },
  });
  await server.listen();
  ({ browser } = await launchBrowser());
  const page = await browser.newPage({ viewport: { width: 1200, height: 900 } });
  page.setDefaultTimeout(15000);
  page.on('pageerror', (error) => errors.push(error.stack ?? error.message));
  page.on('console', (message) => {
    if (message.type() === 'error' || message.text().includes('[Vue warn]'))
      errors.push(message.text());
  });
  page.on('request', (request) => requests.push(request.url()));
  await page.goto(server.resolvedUrls.local[0], { waitUntil: 'networkidle' });
  await page.waitForFunction(() => Boolean(window.addonUnderlineAudit));
  for (const theme of ['default', 'dark', 'compact', 'both'])
    for (const size of ['small', 'middle', 'large'])
      for (const orientation of ['horizontal', 'vertical'])
        for (const direction of ['ltr', 'rtl']) {
          const batch = { theme, size, orientation, direction };
          await page.evaluate(async (batch) => window.addonUnderlineAudit.setBatch(batch), batch);
          const cells = await page.locator('[data-addon-cell]').evaluateAll((nodes) => {
            const cache = new Map();
            const probe = document.createElement('span');
            document.body.append(probe);
            const color = (value) => {
              if (!cache.has(value)) {
                probe.style.color = value;
                cache.set(value, getComputedStyle(probe).color);
              }
              return cache.get(value);
            };
            const rows = nodes.map((node) => {
              const s = getComputedStyle(node),
                r = node.getBoundingClientRect();
              const value = (name) => s.getPropertyValue('--apollo-' + name).trim();
              const meta = {
                variant: node.dataset.variant,
                status: node.dataset.status,
                disabled: node.dataset.disabled === 'true',
                group: node.dataset.groupKind,
                index: Number(node.dataset.index),
              };
              const tokens = {
                lineWidth: value('line-width'),
                lineType: value('line-type'),
                border: color(value('color-border')),
                error: color(value('color-error')),
                warning: color(value('color-warning')),
                text: color(value('color-text')),
                errorText: color(
                  'color-mix(in srgb,' +
                    value('color-error-text') +
                    ' 50%,' +
                    value('color-text') +
                    ')',
                ),
                warningText: color(
                  'color-mix(in srgb,' +
                    value('color-warning-text') +
                    ' 50%,' +
                    value('color-text') +
                    ')',
                ),
                disabledText: color(value('color-text-disabled')),
                background: color(value('color-bg-container-disabled')),
                errorBackground: color(value('color-error-bg')),
                warningBackground: color(value('color-warning-bg')),
                transparent: color('transparent'),
                font: value('font-size'),
                fontSM: value('font-size-sm'),
                fontLG: value('font-size-lg'),
                radius: value('border-radius'),
                radiusSM: value('border-radius-sm'),
                radiusLG: value('border-radius-lg'),
                padding: value('padding-sm'),
                paddingSM: value('padding-xs'),
              };
              return {
                meta,
                className: node.className,
                tokens,
                actual: {
                  sides: ['Top', 'Right', 'Bottom', 'Left'].map((side) => ({
                    style: s['border' + side + 'Style'],
                    width: s['border' + side + 'Width'],
                    color: s['border' + side + 'Color'],
                  })),
                  background: s.backgroundColor,
                  color: s.color,
                  fontSize: s.fontSize,
                  paddingInlineStart: s.paddingInlineStart,
                  radii: [
                    s.borderStartStartRadius,
                    s.borderStartEndRadius,
                    s.borderEndStartRadius,
                    s.borderEndEndRadius,
                  ],
                  marginInlineEnd: s.marginInlineEnd,
                  marginBottom: s.marginBottom,
                  rect: {
                    left: r.left,
                    right: r.right,
                    top: r.top,
                    bottom: r.bottom,
                    width: r.width,
                    height: r.height,
                  },
                },
              };
            });
            probe.remove();
            return rows;
          });
          assert.equal(cells.length, 96);
          let failed = 0;
          for (const cell of cells) {
            const { meta, tokens, actual } = cell,
              issues = [];
            const same = (label, got, want) => {
              if (JSON.stringify(got) !== JSON.stringify(want))
                issues.push({ label, actual: got, expected: want });
            };
            const visibleBorderColor =
              meta.status === 'error'
                ? tokens.error
                : meta.status === 'warning'
                  ? tokens.warning
                  : tokens.border;
            const filled = meta.variant === 'filled',
              underlined = meta.variant === 'underlined',
              borderless = meta.variant === 'borderless';
            for (const [index, side] of actual.sides.entries()) {
              const hasBorder = !borderless && (!underlined || index === 2);
              same(
                `border-${['top', 'right', 'bottom', 'left'][index]}-style`,
                side.style,
                hasBorder ? tokens.lineType : 'none',
              );
              same(
                `border-${['top', 'right', 'bottom', 'left'][index]}-width`,
                side.width,
                hasBorder ? tokens.lineWidth : '0px',
              );
              if (hasBorder)
                same(
                  `border-${['top', 'right', 'bottom', 'left'][index]}-color`,
                  side.color,
                  filled
                    ? meta.disabled
                      ? tokens.border
                      : tokens.transparent
                    : visibleBorderColor,
                );
            }
            same(
              'background',
              actual.background,
              underlined || borderless
                ? tokens.transparent
                : filled && !meta.disabled && meta.status === 'error'
                  ? tokens.errorBackground
                  : filled && !meta.disabled && meta.status === 'warning'
                    ? tokens.warningBackground
                    : tokens.background,
            );
            same(
              'text',
              actual.color,
              meta.disabled
                ? tokens.disabledText
                : meta.status === 'error'
                  ? tokens.errorText
                  : meta.status === 'warning'
                    ? tokens.warningText
                    : tokens.text,
            );
            same(
              'font-size',
              actual.fontSize,
              size === 'small' ? tokens.fontSM : size === 'large' ? tokens.fontLG : tokens.font,
            );
            same(
              'padding-inline',
              actual.paddingInlineStart,
              size === 'small' ? tokens.paddingSM : tokens.padding,
            );
            const radius =
              size === 'small'
                ? tokens.radiusSM
                : size === 'large'
                  ? tokens.radiusLG
                  : tokens.radius;
            const z = '0px';
            let radii =
              meta.group === 'single'
                ? [radius, radius, radius, radius]
                : meta.index === 1
                  ? [z, z, z, z]
                  : orientation === 'vertical'
                    ? meta.index === 0
                      ? [radius, radius, z, z]
                      : [z, z, radius, radius]
                    : meta.index === 0
                      ? [radius, z, radius, z]
                      : [z, radius, z, radius];
            if (underlined) radii = [z, z, z, z];
            same('radii', actual.radii, radii);
            if (!cell.className.includes(`apollo-space-addon-${size}`))
              issues.push({
                label: 'size context not consumed',
                className: cell.className,
                expected: size,
              });
            if (
              !cell.className.includes(
                orientation === 'vertical'
                  ? 'apollo-space-addon-compact-vertical-item'
                  : 'apollo-space-addon-compact-item',
              )
            )
              issues.push({
                label: 'orientation context not consumed',
                className: cell.className,
                expected: orientation,
              });
            if (direction === 'rtl' && !cell.className.includes('item-rtl'))
              issues.push({ label: 'RTL context not consumed', className: cell.className });
            const compactPrefix =
              'apollo-space-addon-compact' + (orientation === 'vertical' ? '-vertical' : '');
            const classNames = new Set(cell.className.split(/\s+/));
            same(
              'first boundary',
              classNames.has(compactPrefix + '-first-item'),
              meta.group === 'single' || meta.index === 0,
            );
            same(
              'last boundary',
              classNames.has(compactPrefix + '-last-item'),
              meta.group === 'single' || meta.index === 2,
            );
            same('disabled class', classNames.has('apollo-space-addon-disabled'), meta.disabled);
            same(
              'current RTL class',
              classNames.has(compactPrefix + '-item-rtl'),
              direction === 'rtl',
            );
            if (meta.group === 'chain' && meta.index > 0) {
              const previous = cells.find(
                (item) =>
                  item.meta.variant === meta.variant &&
                  item.meta.status === meta.status &&
                  item.meta.disabled === meta.disabled &&
                  item.meta.group === meta.group &&
                  item.meta.index === meta.index - 1,
              );
              assert.ok(previous);
              const delta =
                orientation === 'vertical'
                  ? actual.rect.top - previous.actual.rect.bottom
                  : direction === 'rtl'
                    ? previous.actual.rect.left - actual.rect.right
                    : actual.rect.left - previous.actual.rect.right;
              if (Math.abs(delta + Number.parseFloat(tokens.lineWidth)) > 0.1)
                issues.push({
                  label: 'Compact adjoining geometry',
                  actual: delta,
                  expected: -Number.parseFloat(tokens.lineWidth),
                });
            }
            if (issues.length) failed++;
            results.push({ batch, ...cell, passed: issues.length === 0, issues });
          }
          console.log(
            JSON.stringify({ batch, checked: cells.length, passed: cells.length - failed, failed }),
          );
          if (orientation === 'horizontal' && direction === 'ltr')
            await page.screenshot({
              path: path.join(output, `${phase}-${theme}-${size}.png`),
              fullPage: true,
              animations: 'allow',
            });
        }
} finally {
  await browser?.close();
  await server?.close();
}
assert.equal(
  sha(fs.readFileSync(styleFile)),
  styleHash,
  'Source CSS changed during matrix capture',
);
const forbiddenRequests = requests.filter(
  (url) => url.includes('/packages/') && url.includes('/dist/'),
);
const byVariant = Object.fromEntries(
  ['outlined', 'filled', 'borderless', 'underlined'].map((variant) => {
    const rows = results.filter((item) => item.meta.variant === variant);
    return [
      variant,
      {
        total: rows.length,
        passed: rows.filter((item) => item.passed).length,
        failed: rows.filter((item) => !item.passed).length,
      },
    ];
  }),
);
const summary = {
  phase,
  sourceCommit: execFileSync('git', ['rev-parse', 'HEAD'], { cwd: repo, encoding: 'utf8' }).trim(),
  sourceHashes,
  fixture,
  mode: 'Vue source components and source-only static Space CSS',
  packageBuilds: false,
  distReads: forbidden.length + forbiddenRequests.length,
  distWrites: false,
  testWritesSource: false,
  expectedGroups: 2304,
  expectedCells: 4608,
  total: results.length,
  passed: results.filter((item) => item.passed).length,
  failed: results.filter((item) => !item.passed).length,
  byVariant,
  pageErrors: errors,
  forbiddenResolvedModules: forbidden,
  forbiddenRequests,
  resolvedSourceModuleCount: resolvedSources.size,
};
const report = { ...summary, results };
fs.writeFileSync(path.join(output, `${phase}-matrix.json`), JSON.stringify(report, null, 2) + '\n');
fs.writeFileSync(
  path.join(output, `${phase}-summary.json`),
  JSON.stringify(summary, null, 2) + '\n',
);
console.log(JSON.stringify(summary, null, 2));
assert.equal(results.length, 4608);
assert.deepEqual(errors, []);
assert.deepEqual(forbidden, []);
assert.deepEqual(forbiddenRequests, []);
assert.equal(
  summary.failed,
  0,
  'SpaceAddon variant matrix must satisfy the accepted underline contract',
);
