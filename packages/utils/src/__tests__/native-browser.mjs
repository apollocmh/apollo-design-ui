import assert from 'node:assert/strict';
import { mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import vue from '@vitejs/plugin-vue';
import { createServer } from 'vite';
import { launchBrowser } from '../../../../tests/visual/stabilize.mjs';

const repo = process.cwd();
const directory = await mkdtemp(path.join(tmpdir(), 'apollo-utils-native-'));
const started = performance.now();
const diagnostics = [];
const checks = [];
let observerEvidence;
let server;
let browser;
let failure;
try {
  await writeFile(
    path.join(directory, 'index.html'),
    `<!doctype html><html lang="en"><head><title>Native Utils</title><link rel="icon" href="data:,"></head><body><main id="app"></main><script type="module">
import{createApp,effectScope,h,ref,shallowRef}from'vue';
import{Color,getElement,getNodeRef,isDOM,isHTMLElement,triggerFocus,observeResize,observeMutation,raf,useDelayState,updateCSS,removeCSS}from'@apollo-design/utils';
import Fixture from '/@fs${repo}/packages/utils/src/__tests__/fixtures/NativeUtils.vue';
const ownedObserverCall=callback=>{const previous=window.utilsObserverOwner;window.utilsObserverOwner='utils';try{return callback()}finally{window.utilsObserverOwner=previous}};
const NativeRO=window.ResizeObserver;window.utilsResizeObservers=new Set();window.ResizeObserver=class extends NativeRO{targets=new Set();attempts=[];constructor(callback){super(callback);this.owner=window.utilsObserverOwner??null;this.creator=new Error().stack;window.utilsResizeObservers.add(this)}observe(target,options){this.attempts.push(target);super.observe(target,options);this.targets.add(target)}unobserve(target){super.unobserve(target);this.targets.delete(target)}disconnect(){super.disconnect();this.targets.clear()}};
const NativeMO=window.MutationObserver;window.utilsMutationObservers=new Set();window.MutationObserver=class extends NativeMO{targets=new Set();attempts=[];constructor(callback){super(callback);this.owner=window.utilsObserverOwner??null;this.creator=new Error().stack;this.callback=String(callback);window.utilsMutationObservers.add(this)}observe(target,options){this.attempts.push(target);super.observe(target,options);this.targets.add(target)}disconnect(){super.disconnect();this.targets.clear()}};
const fixture=shallowRef(null);let vnode;const app=createApp({setup:()=>()=>{vnode=h(Fixture,{ref:fixture});return vnode}});app.mount('#app');
window.utilsState={replace:()=>fixture.value.replace(),element:()=>fixture.value.element(),identity:()=>fixture.value.identityValid(),calls:()=>fixture.value.calls(),publicRef:()=>getNodeRef(vnode)===fixture.value,unmount:()=>{const calls=fixture.value.calls,element=fixture.value.element;app.unmount();return{calls:calls(),element:element()}}};
const frame=document.createElement('iframe');frame.title='Utility owner document';document.body.append(frame);const doc=frame.contentDocument;const target=doc.createElement('div');target.style.cssText='width:20px;height:30px';doc.body.append(target);const editor=doc.createElement('input');editor.value='Foreign draft';doc.body.append(editor);
window.utilsCases={frame,doc,target,editor,resize:[],mutation:[],recovered:[],rafCount:0};
window.utilsState.foreign=()=>{editor.setSelectionRange(0,0);triggerFocus(editor,{cursor:'end'});return{foreign:!(editor instanceof HTMLElement),html:isHTMLElement(editor),dom:isDOM(editor),same:getElement({value:editor})===editor,focused:doc.activeElement===editor,start:editor.selectionStart,end:editor.selectionEnd,length:editor.value.length}};
window.utilsState.adopt=()=>{const svg=doc.createElementNS('http://www.w3.org/2000/svg','svg');const element=doc.createElement('div');document.body.append(document.adoptNode(element));return{adopted:isHTMLElement(element)&&getElement(element)===element,svg:isDOM(svg)&&!isHTMLElement(svg)}};
window.utilsState.startResize=()=>ownedObserverCall(()=>{const callback=size=>window.utilsCases.resize.push(size.offsetWidth);window.utilsCases.resizeStopA=observeResize(target,callback);window.utilsCases.resizeStopB=observeResize(target,callback)});
window.utilsState.stopResizeA=()=>{window.utilsCases.resizeStopA();window.utilsCases.resizeStopA();target.style.width='35px'};
window.utilsState.stopResizeB=()=>{window.utilsCases.resizeStopB();target.style.width='45px'};
window.utilsState.startMutation=()=>ownedObserverCall(()=>{const callback=()=>window.utilsCases.mutation.push(target.getAttribute('data-test'));window.utilsCases.mutationStopA=observeMutation(target,callback,{attributes:true});window.utilsCases.mutationStopB=observeMutation(target,callback,{attributes:true});target.setAttribute('data-test','one')});
window.utilsState.stopMutationA=()=>{window.utilsCases.mutationStopA();window.utilsCases.mutationStopA();target.setAttribute('data-test','two')};
window.utilsState.stopMutationB=()=>{window.utilsCases.mutationStopB();target.setAttribute('data-test','three')};
window.utilsState.retryMutation=()=>ownedObserverCall(()=>{let rejected=false;try{observeMutation(target,()=>{}, {})}catch(error){rejected=error.name==='TypeError'}const stop=observeMutation(target,()=>{window.utilsCases.recovered.push(true)},{attributes:true});window.utilsCases.recoveredStop=stop;target.setAttribute('data-recovered','yes');return rejected});
window.utilsState.css=()=>{const local=document.createElement('div');document.body.append(local);const first=updateCSS('body{overflow:hidden}','utils-owner',local);const next=updateCSS('body{overflow:auto}','utils-owner',doc.head);const result=first===next&&next.parentNode===doc.head&&next.ownerDocument===doc&&!local.querySelector('style');removeCSS('utils-owner');local.remove();return result&&!doc.querySelector('[data-apollo-css-key="utils-owner"]')};
window.utilsState.colors=()=>{const inputs=['rgb(-10, 20, 300)','hsl(-120, 100%, 50%)','rgb(1.5, 12.49, 254.6)'];const results=inputs.map(input=>{const source=document.createElement('span'),encoded=document.createElement('span');source.style.color=input;const hex=new Color(input).toHexString();encoded.style.color=hex;document.body.append(source,encoded);const equal=CSS.supports('color',input)&&CSS.supports('color',hex)&&getComputedStyle(source).color===getComputedStyle(encoded).color;source.remove();encoded.remove();return equal});for(const input of ['#12345','#1234567']){let rejected=false;try{new Color(input)}catch{rejected=true}results.push(!CSS.supports('color',input)&&rejected)}return results};
window.utilsState.schedule=()=>{raf(()=>{window.utilsCases.rafCount++},2);const cancelled=raf(()=>{window.utilsCases.rafCount+=100});raf.cancel(cancelled);const scope=effectScope();const state=scope.run(()=>useDelayState(0));state[1](1);scope.stop();state[1](2);state[1](3,{ms:20});window.utilsCases.delayed=state[0];};
window.utilsState.resources=()=>({resize:[...window.utilsResizeObservers].filter(observer=>observer.owner==='utils').every(observer=>observer.targets.size===0),mutation:[...window.utilsMutationObservers].filter(observer=>observer.owner==='utils').every(observer=>observer.targets.size===0),frames:raf.ids?.().size??0,delayed:window.utilsCases.delayed.value});
window.utilsState.observerEvidence=()=>{const describe=target=>({node:target.nodeName,id:target.id??null,document:target.ownerDocument?.URL??target.URL,scenario:target===window.utilsCases.target});return [...window.utilsResizeObservers,...window.utilsMutationObservers].map(observer=>({kind:window.utilsResizeObservers.has(observer)?'resize':'mutation',owner:observer.owner,creator:observer.creator,callback:observer.callback,targets:[...observer.targets].map(describe),attempts:observer.attempts.map(describe)}))};
</script></body></html>`,
  );
  server = await createServer({
    root: directory,
    configFile: false,
    logLevel: 'warn',
    plugins: [vue()],
    resolve: {
      alias: {
        '@apollo-design/utils': path.join(repo, 'packages/utils/src/index.ts'),
        vue: path.join(repo, 'node_modules/vue/dist/vue.esm-bundler.js'),
      },
    },
    server: { host: '127.0.0.1', port: 0, fs: { allow: [repo, directory] } },
  });
  await server.listen();
  browser = (await launchBrowser()).browser;
  const page = await browser.newPage({ viewport: { width: 1000, height: 800 } });
  page.setDefaultTimeout(15000);
  page.on('pageerror', (error) => diagnostics.push(error.message));
  page.on('console', (message) => {
    if (['error', 'warning'].includes(message.type())) diagnostics.push(message.text());
  });
  await page.goto(server.resolvedUrls.local[0]);
  await page.waitForFunction(() => window.utilsState?.identity());
  assert.equal(await page.evaluate(() => window.utilsState.publicRef()), true);
  const input = page.getByRole('textbox', { name: 'Native utils draft' });
  await input.fill('Retained draft');
  await input.evaluate((element) => {
    window.utilsEditor = element;
    element.setSelectionRange(2, 8);
  });
  await page.evaluate(() => window.utilsState.replace());
  assert.deepEqual(
    await input.evaluate((element) => ({
      same: element === window.utilsEditor,
      focused: element === document.activeElement,
      value: element.value,
      start: element.selectionStart,
      end: element.selectionEnd,
    })),
    { same: true, focused: true, value: 'Retained draft', start: 2, end: 8 },
  );
  assert.deepEqual(await page.evaluate(() => window.utilsState.calls()), [
    'original:set',
    'replacement:set',
  ]);
  assert.equal(await page.evaluate(() => window.utilsState.identity()), true);
  checks.push(
    'actual SFC collection refs and public expose preserve editor identity, draft, focus, selection and nested Ref payloads',
  );

  const foreign = await page.evaluate(() => window.utilsState.foreign());
  assert.deepEqual(foreign, {
    foreign: true,
    html: true,
    dom: true,
    same: true,
    focused: true,
    start: foreign.length,
    end: foreign.length,
    length: foreign.length,
  });
  assert.deepEqual(await page.evaluate(() => window.utilsState.adopt()), {
    adopted: true,
    svg: true,
  });
  checks.push(
    'actual same-origin iframe and adopted HTML/SVG resolve without the current realm constructor and retain the foreign cursor',
  );

  await page.evaluate(() => window.utilsState.startResize());
  await page.waitForFunction(() => window.utilsCases.resize.length === 1);
  assert.deepEqual(await page.evaluate(() => window.utilsCases.resize), [20]);
  await page.evaluate(() => window.utilsState.stopResizeA());
  await page.waitForFunction(() => window.utilsCases.resize.length === 2);
  assert.deepEqual(await page.evaluate(() => window.utilsCases.resize), [20, 35]);
  await page.evaluate(() => window.utilsState.stopResizeB());
  await page.evaluate(
    () => new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve))),
  );
  assert.deepEqual(await page.evaluate(() => window.utilsCases.resize), [20, 35]);
  checks.push(
    'one actual parent-window ResizeObserver observes a foreign target and each duplicate subscription releases only itself',
  );

  await page.evaluate(() => window.utilsState.startMutation());
  await page.waitForFunction(() => window.utilsCases.mutation.length === 1);
  await page.evaluate(() => window.utilsState.stopMutationA());
  await page.waitForFunction(() => window.utilsCases.mutation.length === 2);
  await page.evaluate(() => window.utilsState.stopMutationB());
  await page.evaluate(() => new Promise((resolve) => setTimeout(resolve, 0)));
  assert.deepEqual(await page.evaluate(() => window.utilsCases.mutation), ['one', 'two']);
  assert.equal(await page.evaluate(() => window.utilsState.retryMutation()), true);
  await page.waitForFunction(() => window.utilsCases.recovered.length === 1);
  await page.evaluate(() => window.utilsCases.recoveredStop());
  checks.push(
    'actual MutationObserver duplicate ownership, native invalid-options rejection, released failed instance and valid retry on the same foreign target',
  );

  assert.equal(await page.evaluate(() => window.utilsState.css()), true);
  checks.push(
    'the same keyed temporary style follows its explicit current document/container and removes cleanly',
  );
  assert.deepEqual(await page.evaluate(() => window.utilsState.colors()), [
    true,
    true,
    true,
    true,
    true,
  ]);
  checks.push(
    'signed and fractional supported colors match actual Chrome CSS while unsupported hex widths are rejected',
  );

  await page.evaluate(() => window.utilsState.schedule());
  await page.waitForFunction(() => window.utilsCases.rafCount === 1);
  await page.evaluate(() => new Promise((resolve) => setTimeout(resolve, 30)));
  const unmounted = await page.evaluate(() => window.utilsState.unmount());
  assert.deepEqual(unmounted, {
    calls: ['original:set', 'replacement:set', 'replacement:clear'],
    element: null,
  });
  observerEvidence = await page.evaluate(() => window.utilsState.observerEvidence());
  const ownedObservers = observerEvidence.filter((observer) => observer.owner === 'utils');
  assert.equal(ownedObservers.filter((observer) => observer.kind === 'resize').length, 1);
  assert.equal(ownedObservers.filter((observer) => observer.kind === 'mutation').length, 3);
  assert.equal(
    ownedObservers.every((observer) => observer.targets.length === 0),
    true,
  );
  // Audit every remaining creator, including Document/body observers, instead of filtering by target.
  const foreignObservers = observerEvidence.filter((observer) => observer.owner !== 'utils');
  assert.equal(foreignObservers.length, 1);
  assert.match(
    foreignObservers[0].creator,
    /InjectedScript\._setupGlobalListenersRemovalDetection/,
  );
  assert.equal(foreignObservers[0].kind, 'mutation');
  assert.deepEqual(
    foreignObservers[0].targets.map((target) => ({ node: target.node, scenario: target.scenario })),
    [{ node: '#document', scenario: false }],
  );
  assert.deepEqual(await page.evaluate(() => window.utilsState.resources()), {
    resize: true,
    mutation: true,
    frames: 0,
    delayed: 0,
  });
  assert.deepEqual(diagnostics, []);
  checks.push(
    'native frame completion/cancel and stopped delayed scope retain no observed targets or pending utility frames, with zero browser/Vue diagnostics',
  );
} catch (error) {
  failure = error;
} finally {
  await browser?.close();
  await server?.close();
  await rm(directory, { recursive: true, force: true });
}
const report = {
  passed: !failure,
  elapsedMs: Math.round(performance.now() - started),
  checks,
  diagnostics,
  observerEvidence,
  ...(failure ? { error: String(failure) } : {}),
};
await writeFile('/tmp/apollo-utils-native-browser.json', `${JSON.stringify(report, null, 2)}\n`);
console.log(JSON.stringify(report, null, 2));
if (failure) throw failure;
