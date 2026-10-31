/** Actual Trigger positioning, owner-window resize and composed scroll integration. */
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import vue from '@vitejs/plugin-vue';
import { createServer } from 'vite';
import { launchBrowser } from '../../../../../tests/visual/stabilize.mjs';

const repo = process.cwd();
const resultPath = '/tmp/apollo-position-trigger-browser-result.json';
const logPath =
  process.env.APOLLO_POSITION_TRIGGER_LOG ?? '/tmp/apollo-position-trigger-browser.log';
const directory = await mkdtemp(path.join(tmpdir(), 'apollo-trigger-position-'));
const sourceFiles = [
  'packages/ui/src/_internal/trigger.ts',
  'packages/position/src/measure.ts',
  'packages/ui/src/_internal/__tests__/trigger-position-browser.mjs',
];
const hashes = async () =>
  Object.fromEntries(
    await Promise.all(
      sourceFiles.map(async (name) => [
        name,
        createHash('sha256')
          .update(await readFile(path.join(repo, name)))
          .digest('hex'),
      ]),
    ),
  );
const sourceBefore = await hashes();
const aliases = Object.fromEntries(
  [
    'ui',
    'utils',
    'theme',
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
  ].map((name) => [`@apollo-design/${name}`, path.join(repo, 'packages', name, 'src')]),
);
aliases.vue = path.join(repo, 'node_modules/vue/dist/vue.esm-bundler.js');
const diagnostics = [],
  metrics = { modes: [] };
const started = performance.now();
let server, browser, page, failure;
let behaviorPassed = false;
await writeFile(
  resultPath,
  `${JSON.stringify({ kind: 'browser', status: 'running', exitCode: null, log: logPath })}\n`,
);
try {
  await writeFile(
    path.join(directory, 'fixture.mjs'),
    `
import {createApp,h,nextTick,shallowRef} from 'vue';
import {Trigger} from '/@fs${repo}/packages/ui/src/_internal/trigger.ts';
let app, cleanup=[], container, clipper, scroller, shadow, mode, baseline;
let counters={aligns:0};
const closeTo=(a,b)=>Math.abs(a-b)<.8;
const settle=async()=>{await nextTick();await new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve)));};
const node=(tag,style,parent=document.body)=>{const el=document.createElement(tag);el.style.cssText=style;parent.append(el);return el;};
const resources=()=>({listeners:window.positionListeners.filter(item=>!baseline.some(base=>base.target===item.target&&base.type===item.type&&base.callback===item.callback&&base.capture===item.capture)).length,observers:window.positionObservers.reduce((n,observer)=>n+observer.targets.size,0),frames:window.positionFrames.size,errors:[...window.positionErrors]});
const elements=()=>({target:(shadow??document).querySelector('#position-target'),popup:document.querySelector('.position-popup')??shadow?.querySelector('.position-popup')});
const snapshot=()=>{const {target,popup}=elements();if(!target||!popup)return null;const t=target.getBoundingClientRect(),p=popup.getBoundingClientRect();return {target:{left:t.left,top:t.top,bottom:t.bottom,width:t.width,height:t.height},popup:{left:p.left,top:p.top,width:p.width,height:p.height},aligns:counters.aligns,clientWidth:document.documentElement.clientWidth,clientHeight:document.documentElement.clientHeight,scrollWidth:document.documentElement.scrollWidth,scrollHeight:document.documentElement.scrollHeight,owner:popup.ownerDocument===target.ownerDocument};};
window.triggerHarness={
 async mount(kind,value='visible'){
  if(app)throw new Error('Previous Trigger must be unmounted first');
  document.body.style.minWidth=kind==='mode'?'2400px':'';document.body.style.minHeight=kind==='mode'?'2400px':'';
  mode=value;shadow=undefined;clipper=undefined;scroller=undefined;counters={aligns:0};container=shallowRef(document.body);
  let attachment=document.querySelector('#app');
  let targetStyle=kind==='mode'?{position:'absolute',left:(document.documentElement.clientWidth-40)+'px',top:'500px',width:'10px',height:'20px'}:{position:'absolute',right:'140px',top:'60px',width:'20px',height:'20px'};
  if(kind==='shadow'){
   const host=node('div','position:relative;margin:80px;width:360px;height:280px');cleanup.push(host);shadow=host.attachShadow({mode:'open'});
   scroller=node('section','position:relative;width:300px;height:180px;overflow:auto',shadow);scroller.id='position-scroll-target';
   const content=node('div','position:relative;width:600px;height:700px',scroller);attachment=node('div','',content);
   clipper=node('section','position:absolute;left:0;top:0;width:360px;height:280px;overflow:auto',shadow);clipper.id='position-scroll-popup';
   node('div','width:600px;height:600px',clipper);
   targetStyle={position:'absolute',left:'100px',top:'130px',width:'20px',height:'20px'};
  }
  const placement={points:['tl','bl'],overflow:kind==='mode'?{adjustY:true,shiftX:true}:{}};
  const getContainer=()=>container.value;
  baseline=[...window.positionListeners];
  app=createApp({render:()=>h(Trigger,{prefixCls:'position-popup',open:true,action:[],placement:'bottom',builtinPlacements:{bottom:placement},popupAlign:{htmlRegion:mode},getPopupContainer:getContainer,motion:{supportMotion:false},popupStyle:{position:'absolute',width:'100px',height:kind==='mode'?'150px':'60px',padding:0,border:0,margin:0},popup:()=>h('input',{id:'position-draft','aria-label':'Popup draft',value:'original'}),onPopupAlign:()=>{counters.aligns++;}},{default:()=>h('button',{id:'position-target','aria-label':'Position target',style:{...targetStyle,padding:0,border:0,margin:0,boxSizing:'border-box'}},'Target')})});
  app.mount(attachment);await settle();return snapshot();
 },
 snapshot,resources,
 ready(){const s=snapshot();return !!s&&s.owner&&s.popup.width===100&&s.popup.left>-1000;},
 async unmount(){app.unmount();app=undefined;await settle();const result=resources();for(const el of cleanup.splice(0))el.remove();return result;},
 scrollTarget(value){scroller.scrollTop=value;},
 movePopup(){container.value=clipper;},
 scrollPopup(value){clipper.scrollTop=value;},
 popupMoved(){return elements().popup?.parentNode===clipper;},
 captureDraft(){const input=elements().popup.querySelector('input');input.value='same draft';input.focus();input.setSelectionRange(2,6);window.positionDraft=input;},
 draft(){const input=elements().popup?.querySelector('input');return {same:input===window.positionDraft,value:input?.value,focused:(input?.getRootNode().activeElement??document.activeElement)===input,selection:[input?.selectionStart,input?.selectionEnd]};},
 scrollListeners(id){return window.positionListeners.filter(item=>item.target.id===id&&item.type==='scroll').length;},
 aligned(){const s=snapshot();return !!s&&closeTo(s.popup.left,s.target.left)&&closeTo(s.popup.top,s.target.bottom);}
};
`,
  );
  await writeFile(
    path.join(directory, 'index.html'),
    '<!doctype html><html lang="en"><head><title>Trigger Position integration</title><link rel="icon" href="data:,"><style>html,body{margin:0}</style></head><body><main id="app"></main><script type="module" src="/fixture.mjs"></script></body></html>',
  );
  server = await createServer({
    root: directory,
    configFile: false,
    logLevel: 'warn',
    plugins: [vue()],
    resolve: { alias: aliases },
    server: { host: '127.0.0.1', port: 0, fs: { allow: [repo, directory] } },
  });
  await server.listen();
  browser = (await launchBrowser()).browser;
  page = await browser.newPage({ viewport: { width: 800, height: 600 } });
  page.setDefaultTimeout(5000);
  await page.addInitScript(() => {
    window.positionListeners = [];
    window.positionObservers = [];
    window.positionFrames = new Set();
    window.positionErrors = [];
    window.positionWindowScrolls = 0;
    window.positionWindowResizes = 0;
    const add = EventTarget.prototype.addEventListener,
      remove = EventTarget.prototype.removeEventListener;
    const tracked = (target, type) =>
      ['scroll', 'resize'].includes(type) &&
      (target === window || target === document || target.id?.startsWith('position-scroll-'));
    EventTarget.prototype.addEventListener = function (type, callback, options) {
      if (tracked(this, type))
        window.positionListeners.push({
          target: this,
          type,
          callback,
          capture: typeof options === 'boolean' ? options : !!options?.capture,
        });
      return add.call(this, type, callback, options);
    };
    EventTarget.prototype.removeEventListener = function (type, callback, options) {
      const capture = typeof options === 'boolean' ? options : !!options?.capture;
      window.positionListeners = window.positionListeners.filter(
        (item) =>
          !(
            item.target === this &&
            item.type === type &&
            item.callback === callback &&
            item.capture === capture
          ),
      );
      return remove.call(this, type, callback, options);
    };
    const Resize = window.ResizeObserver;
    window.ResizeObserver = class extends Resize {
      targets = new Set();
      constructor(callback) {
        super(callback);
        window.positionObservers.push(this);
      }
      observe(target, options) {
        this.targets.add(target);
        super.observe(target, options);
      }
      unobserve(target) {
        this.targets.delete(target);
        super.unobserve(target);
      }
      disconnect() {
        this.targets.clear();
        super.disconnect();
      }
    };
    const frame = window.requestAnimationFrame.bind(window),
      cancel = window.cancelAnimationFrame.bind(window);
    window.requestAnimationFrame = (callback) => {
      const id = frame((time) => {
        window.positionFrames.delete(id);
        callback(time);
      });
      window.positionFrames.add(id);
      return id;
    };
    window.cancelAnimationFrame = (id) => {
      window.positionFrames.delete(id);
      return cancel(id);
    };
    window.addEventListener('error', (event) => window.positionErrors.push(event.message));
    window.addEventListener('scroll', () => window.positionWindowScrolls++, true);
    window.addEventListener('resize', () => window.positionWindowResizes++);
  });
  page.on('console', (message) => {
    if (['warning', 'error'].includes(message.type()))
      diagnostics.push({
        type: message.type(),
        text: message.text(),
        location: message.location().url,
      });
  });
  page.on('pageerror', (error) => diagnostics.push({ type: 'pageerror', text: error.message }));
  const url = server.resolvedUrls.local[0];
  await page.goto(url);
  await page.waitForFunction(() => !!window.triggerHarness);
  const clean = async (context) =>
    assert.deepEqual(await context.evaluate(() => window.triggerHarness.unmount()), {
      listeners: 0,
      observers: 0,
      frames: 0,
      errors: [],
    });
  const near = (value, expected, label) =>
    assert.ok(Math.abs(value - expected) < 0.8, `${label}: ${value} vs ${expected}`);
  for (const [mode, top] of [
    ['visible', 350],
    ['scroll', 520],
    ['visibleFirst', 350],
  ]) {
    await page.evaluate((mode) => window.triggerHarness.mount('mode', mode), mode);
    await page.waitForFunction(
      ({ top }) => {
        const s = window.triggerHarness.snapshot();
        return (
          s &&
          Math.abs(s.popup.left - (s.clientWidth - 100)) < 0.8 &&
          Math.abs(s.popup.top - top) < 0.8
        );
      },
      { top },
    );
    const snapshot = await page.evaluate(() => window.triggerHarness.snapshot());
    near(snapshot.popup.left, snapshot.clientWidth - 100, `${mode} viewport shift`);
    near(snapshot.popup.top, top, `${mode} flip region`);
    assert.ok(snapshot.scrollWidth >= 2400 && snapshot.scrollHeight >= 2400);
    metrics.modes.push({ mode, ...snapshot });
    await clean(page);
  }

  await page.evaluate((url) => {
    const iframe = document.createElement('iframe');
    iframe.id = 'position-owner-frame';
    iframe.style.cssText = 'position:fixed;left:10px;top:10px;width:400px;height:320px;border:0';
    iframe.src = url;
    document.body.append(iframe);
  }, url);
  await page.waitForFunction(
    () => !!document.querySelector('#position-owner-frame').contentWindow.triggerHarness,
  );
  const frame = page
    .frames()
    .find((candidate) => candidate !== page.mainFrame() && candidate.url() === url);
  assert.ok(frame, 'Expected the same-origin frame context');
  await frame.evaluate(() => window.triggerHarness.mount('iframe'));
  await frame.waitForFunction(() => window.triggerHarness.aligned());
  const beforeResize = await frame.evaluate(() => ({
    ...window.triggerHarness.snapshot(),
    resizes: window.positionWindowResizes,
  }));
  await page.locator('#position-owner-frame').evaluate((node) => {
    node.style.width = '540px';
  });
  await frame.waitForFunction((before) => {
    const s = window.triggerHarness.snapshot();
    return (
      window.positionWindowResizes > before.resizes &&
      s.aligns > before.aligns &&
      s.target.left > before.target.left + 100 &&
      Math.abs(s.popup.left - s.target.left) < 0.8
    );
  }, beforeResize);
  const afterResize = await frame.evaluate(() => window.triggerHarness.snapshot());
  assert.equal(afterResize.owner, true);
  near(
    afterResize.popup.left - beforeResize.popup.left,
    afterResize.target.left - beforeResize.target.left,
    'owner-window resize follows target',
  );
  metrics.iframe = { before: beforeResize, after: afterResize };
  await clean(frame);
  await page.locator('#position-owner-frame').evaluate((node) => node.remove());

  await page.evaluate(() => window.triggerHarness.mount('shadow'));
  await page.waitForFunction(() => window.triggerHarness.aligned());
  assert.ok(
    (await page.evaluate(() => window.triggerHarness.scrollListeners('position-scroll-target'))) >
      0,
  );
  const beforeScroll = await page.evaluate(() => ({
    ...window.triggerHarness.snapshot(),
    windowScrolls: window.positionWindowScrolls,
  }));
  await page.evaluate(() => window.triggerHarness.scrollTarget(40));
  await page.waitForFunction((before) => {
    const s = window.triggerHarness.snapshot();
    return (
      s.target.top < before.target.top - 35 &&
      s.aligns > before.aligns &&
      Math.abs(s.popup.top - s.target.bottom) < 0.8
    );
  }, beforeScroll);
  const afterScroll = await page.evaluate(() => window.triggerHarness.snapshot());
  near(afterScroll.popup.top - beforeScroll.popup.top, -40, 'ShadowRoot target scroll follows');
  assert.equal(
    await page.evaluate(() => window.positionWindowScrolls),
    beforeScroll.windowScrolls,
    'noncomposed shadow scroll does not rely on window capture',
  );
  metrics.shadow = { before: beforeScroll, after: afterScroll };
  await page.evaluate(() => window.triggerHarness.captureDraft());
  await page.evaluate(() => window.triggerHarness.movePopup());
  await page.waitForFunction(
    () => window.triggerHarness.popupMoved() && window.triggerHarness.aligned(),
  );
  assert.deepEqual(await page.evaluate(() => window.triggerHarness.draft()), {
    same: true,
    value: 'same draft',
    focused: true,
    selection: [2, 6],
  });
  assert.ok(
    (await page.evaluate(() => window.triggerHarness.scrollListeners('position-scroll-popup'))) > 0,
    'Moved popup uses its actual scroll chain',
  );
  const beforePopupScroll = await page.evaluate(() => window.triggerHarness.snapshot());
  await page.evaluate(() => window.triggerHarness.scrollPopup(25));
  await page.waitForFunction(
    (before) =>
      window.triggerHarness.snapshot().aligns > before.aligns && window.triggerHarness.aligned(),
    beforePopupScroll,
  );
  const afterPopupScroll = await page.evaluate(() => window.triggerHarness.snapshot());
  near(
    afterPopupScroll.popup.top,
    beforePopupScroll.popup.top,
    'moved popup realigns after its own container scroll',
  );
  metrics.shadow = { before: beforeScroll, after: afterScroll, moved: afterPopupScroll };
  await clean(page);
  behaviorPassed = true;
} catch (error) {
  failure = error;
  if (page && !page.isClosed())
    metrics.failureState = await page
      .evaluate(() => ({
        snapshot: window.triggerHarness?.snapshot(),
        resources: window.triggerHarness?.resources(),
        moved: window.triggerHarness?.popupMoved(),
      }))
      .catch((snapshotError) => ({ error: String(snapshotError) }));
} finally {
  await page?.close();
  await browser?.close();
  await server?.close();
  await rm(directory, { recursive: true, force: true });
  const sourceAfter = await hashes();
  const sameSource = JSON.stringify(sourceBefore) === JSON.stringify(sourceAfter);
  const result = {
    kind: 'browser',
    scope: ['packages/ui/src/_internal/__tests__/trigger-position-browser.mjs'],
    command: `${process.execPath} ${process.argv[1]}`,
    exitCode: failure || diagnostics.length || !sameSource ? 1 : 0,
    signal: null,
    durationMs: Math.round(performance.now() - started),
    log: logPath,
    behaviorPassed,
    diagnostics,
    sourceBefore,
    sourceAfter,
    sameSource,
    metrics,
    ...(failure ? { failure: String(failure) } : {}),
  };
  await writeFile(resultPath, `${JSON.stringify(result, null, 2)}\n`);
  console.log(JSON.stringify(result, null, 2));
  if (failure) console.error(failure);
  process.exitCode = result.exitCode;
}
