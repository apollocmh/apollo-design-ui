/** Actual Node SSR for stable style factories and inline roots; no package builds. */
import assert from 'node:assert/strict';
import { mkdtempSync, rmSync, symlinkSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import vue from '@vitejs/plugin-vue';
import { createServer } from 'vite';

const repo = path.resolve(
    process.env.THEME_WRITERS_REPO ??
      path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..'),
  ),
  published = process.env.THEME_WRITERS_MODE === 'published',
  temp = mkdtempSync(path.join(tmpdir(), 'apollo-writer-node-ssr-'));
assert.equal(typeof window, 'undefined');
assert.equal(typeof document, 'undefined');
const files = [
  ['useAvatarTheme', 'avatar/use-avatar-theme.ts', 'useAvatarTheme(prefix)'],
  ['useBadgeTheme', 'badge/use-badge-theme.ts', 'useBadgeTheme(prefix)'],
  ['useBreadcrumbTheme', 'breadcrumb/use-breadcrumb-theme.ts', 'useBreadcrumbTheme(prefix)'],
  ['useButtonTheme', 'button/use-button-theme.ts', 'useButtonTheme(prefix)'],
  [
    'useDescriptionsTheme',
    'descriptions/use-descriptions-theme.ts',
    'useDescriptionsTheme(prefix)',
  ],
  ['useImageTheme', 'image/hooks/useImageTheme.ts', 'useImageTheme().styles'],
  ['useListTheme', 'list/use-list-theme.ts', 'useListTheme(prefix,()=>false).styles'],
  ['useQRCodeTheme', 'qr-code/use-qrcode-theme.ts', 'useQRCodeTheme(prefix).styles'],
  ['useSkeletonTheme', 'skeleton/use-skeleton-theme.ts', 'useSkeletonTheme(prefix).styles'],
  ['useSpinTheme', 'spin/use-spin-theme.ts', 'useSpinTheme(prefix).styles'],
  ['useStatisticTheme', 'statistic/use-statistic-theme.ts', 'useStatisticTheme(prefix).styles'],
  ['useTableTheme', 'table/use-table-theme.ts', 'useTableTheme(prefix)'],
  ['useTagTheme', 'tag/hooks/use-theme.ts', 'useTagTheme(prefix)'],
  ['useTimelineTheme', 'timeline/use-theme.ts', 'useTimelineTheme(prefix)'],
  ['useTypographyTheme', 'typography/use-typography-theme.ts', 'useTypographyTheme(prefix)'],
];
let server;
try {
  symlinkSync(path.join(repo, 'node_modules'), path.join(temp, 'node_modules'), 'dir');
  const entry = path.join(temp, 'entry.mjs');
  const uiFile = (file) =>
    path.join(
      repo,
      'packages/ui',
      published ? 'dist' : 'src',
      published ? file.replace(/\.ts$/, '.mjs') : file,
    );
  writeFileSync(
    entry,
    `import {computed,createSSRApp,defineComponent,h,provide,shallowRef} from 'vue';import {renderToString} from 'vue/server-renderer';import {createThemeContext,getDesignToken,ThemeContextKey,useTheme} from '@apollo-design/theme';${files.map(([name, file]) => `import {${name}} from ${JSON.stringify(uiFile(file))};`).join('')}import {Flex} from ${JSON.stringify(uiFile('flex/index.ts'))};import {Result} from ${JSON.stringify(uiFile('result/index.ts'))};import {Space,SpaceAddon,SpaceCompact} from ${JSON.stringify(uiFile('space/index.ts'))};
export async function verify(){if(typeof window!=='undefined'||typeof document!=='undefined')throw Error('Expected actual Node environment');const results=[],warnings=[],prefix=()=> 'apollo-source';const factories=[${files.map(([name, , expression]) => `[${JSON.stringify(name)},()=>${expression}]`).join(',')}];
for(const [name,make] of [...factories.map(([name,fn])=>[name,()=>{const style=fn();return()=>h('span',{style:style.value},'Server source');}]),...[["Flex",Flex],["Result",Result],["Space",Space],["Addon",SpaceAddon],["Compact",SpaceCompact]].map(([name,C])=>[name,()=>()=>h(C,{},()=>h('span','Server source'))])])for(const active of [true,false]){const config=shallowRef({}),source={config,token:computed(()=>getDesignToken(config.value)),sourceActive:computed(()=>active)};const Child=defineComponent({setup:make});const app=createSSRApp(defineComponent({setup(){provide(ThemeContextKey,source);return()=>h(Child);}}));app.config.warnHandler=m=>warnings.push(m);const html=await renderToString(app),key=name.startsWith('use')?'--apollo-font-family:':'--apollo-padding-xs:';results.push({name,active,emitted:html.includes(key),containsContent:html.includes('Server source'),passed:html.includes(key)===active&&html.includes('Server source')});}
// A writable fallback belongs to one Vue app, including its sibling readers.
for (const enabled of [true, false]) {
  const seen = [];
  let owner, previous;
  const Reader = defineComponent({setup(){seen.push(useTheme());return()=>h(Flex,{},()=>h('span','Fallback server'));}});
  const app = createSSRApp(defineComponent({setup(){owner=useTheme();previous=owner.config.value;owner.config.value=enabled?{token:{paddingXS:17}}:{};return()=>h('section',[h(Reader),h(Reader)]);}}));
  app.config.warnHandler=m=>warnings.push(m);
  try {
    const html=await renderToString(app);
    results.push({name:'Flex same-app fallback activation/reset',active:enabled,passed:html.includes('--apollo-padding-xs:17px')===enabled&&seen.length===2&&seen.every(ctx=>ctx===owner)&&html.includes('Fallback server')});
  } finally { if(owner) owner.config.value=previous; }
}
let first, second, original;
try {
  await renderToString(createSSRApp(defineComponent({setup(){first=useTheme();original=first.config.value;first.config.value={token:{paddingXS:17}};return()=>h(Flex,{},()=>h('span','First request'));}})));
  const html=await renderToString(createSSRApp(defineComponent({setup(){second=useTheme();return()=>h(Flex,{},()=>h('span','Second request'));}})));
  results.push({name:'Separate SSR apps receive distinct fallback contexts',passed:first!==second});
  results.push({name:'A new SSR request starts with the inactive default source',passed:second.token.value.paddingXS===8&&second.sourceActive.value===false&&!html.includes('--apollo-padding-xs:')&&html.includes('Second request')});
  second.config.value={token:{paddingXS:27}};
  results.push({name:'Writing a second app does not mutate the first app',passed:first.token.value.paddingXS===17&&second.token.value.paddingXS===27});
} finally {if(first) first.config.value=original;if(second&&second!==first) second.config.value={};}
let release;
const barrier=new Promise(resolve=>{release=resolve;}),requests=[];
const request=(padding)=>renderToString(createSSRApp(defineComponent({setup(){
  const ctx=useTheme();requests.push(ctx);ctx.config.value={token:{paddingXS:padding}};
  const Deferred=defineComponent({async setup(){await barrier;return()=>h(Flex,{},()=>h('span','Concurrent request'));}});
  return()=>h(Deferred);
}})));
try {
  const left=request(17),right=request(27);release();
  const [a,b]=await Promise.all([left,right]);
  results.push({name:'Concurrent SSR requests have distinct contexts',passed:requests.length===2&&requests[0]!==requests[1]});
  results.push({name:'Concurrent SSR renders retain their own token values',passed:a.includes('--apollo-padding-xs:17px')&&b.includes('--apollo-padding-xs:27px')&&a.includes('Concurrent request')&&b.includes('Concurrent request')});
} finally {for(const ctx of requests)ctx.config.value={};}
const shared=createThemeContext({token:{paddingXS:23}}),seen=[];
const SharedReader=defineComponent({setup(){seen.push(useTheme());return()=>h(Flex,{},()=>h('span','Explicit shared context'));}});
const explicitlyShared=()=>renderToString(createSSRApp(defineComponent({setup(){provide(ThemeContextKey,shared);return()=>h(SharedReader);}})));
const sharedHTML=await Promise.all([explicitlyShared(),explicitlyShared()]);
results.push({name:'Apps can intentionally share an explicitly provided context',passed:seen.length===2&&seen.every(ctx=>ctx===shared)&&sharedHTML.every(html=>html.includes('--apollo-padding-xs:23px'))});
return{results,warnings,browserGlobals:false};}
`,
  );
  const alias = [
    'ui',
    'theme',
    'utils',
    'icons',
    'motion',
    'portal',
    'position',
    'overlay',
    'a11y',
    'virtual-list',
    'form-core',
    'picker',
    'locale',
  ].map((name) => ({
    find: new RegExp(`^@apollo-design/${name}$`),
    replacement: path.join(
      repo,
      `packages/${name}/${published ? 'dist/index.mjs' : 'src/index.ts'}`,
    ),
  }));
  server = await createServer({
    root: temp,
    configFile: false,
    cacheDir: path.join(temp, 'cache'),
    logLevel: 'warn',
    plugins: [vue()],
    resolve: { alias },
    ssr: { external: ['vue', 'vue/server-renderer'] },
    server: { middlewareMode: true },
    appType: 'custom',
  });
  const module = await server.ssrLoadModule(entry),
    report = await module.verify();
  writeFileSync(
    process.env.THEME_WRITERS_SSR_EVIDENCE ?? '/tmp/apollo-ui-theme-writers-node-ssr.json',
    `${JSON.stringify(
      {
        ...report,
        sourceOnly: !published,
        published,
        packageBuilds: false,
        distRead: published,
        distWritten: false,
      },
      null,
      2,
    )}\n`,
  );
  assert.equal(report.results.length, 48);
  assert.deepEqual(report.warnings, []);
  assert.ok(report.results.every((r) => r.passed));
  console.log(
    'PASS actual Node SSR 48/48 source writer cases, zero browser globals, zero warnings',
  );
} finally {
  await server?.close();
  rmSync(temp, { recursive: true, force: true });
  console.log('All Node SSR readers exited');
}
