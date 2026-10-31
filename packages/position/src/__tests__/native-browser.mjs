/** Actual layout checks for Position's synchronous DOM measurement boundary. */
import assert from 'node:assert/strict';
import { mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { createServer } from 'vite';
import { launchBrowser } from '../../../../tests/visual/stabilize.mjs';

const repo = process.cwd();
const directory = await mkdtemp(path.join(tmpdir(), 'apollo-position-native-'));
const aliases = Object.fromEntries(
  [
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
let server, browser, page, failure, metrics;
const diagnostics = [];
const started = performance.now();
let behaviorPassed = false;
try {
  await writeFile(
    path.join(directory, 'index.html'),
    `<!doctype html><html lang="en"><head><title>Position native layout</title><link rel="icon" href="data:,"></head><body style="margin:0"><script type="module">import * as position from '/@fs${repo}/packages/position/src/index.ts';window.position=position;</script></body></html>`,
  );
  server = await createServer({
    root: directory,
    configFile: false,
    logLevel: 'warn',
    resolve: { alias: aliases },
    server: { host: '127.0.0.1', port: 0, fs: { allow: [repo, directory] } },
  });
  await server.listen();
  browser = (await launchBrowser()).browser;
  page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
  page.on('console', (message) => {
    if (['warning', 'error'].includes(message.type()))
      diagnostics.push({ type: message.type(), text: message.text() });
  });
  page.on('pageerror', (error) => diagnostics.push({ type: 'pageerror', text: error.message }));
  await page.goto(server.resolvedUrls.local[0]);
  await page.waitForFunction(() => !!window.position);
  metrics = await page.evaluate(async () => {
    const p = window.position;
    const make = (doc, style, parent = doc.body, tag = 'div') => {
      const node = doc.createElement(tag);
      node.style.cssText = style;
      parent.append(node);
      return node;
    };
    const rect = (node) => {
      const r = node.getBoundingClientRect();
      return { x: r.x, y: r.y, width: r.width, height: r.height };
    };
    const gap = (popup, target) => {
      const a = popup.getBoundingClientRect(),
        b = target.getBoundingClientRect();
      return { x: a.left - b.left, y: a.top - b.bottom };
    };
    const actualClientArea = (node) => {
      const r = node.getBoundingClientRect();
      const sx = r.width / node.offsetWidth,
        sy = r.height / node.offsetHeight;
      return {
        left: r.x + node.clientLeft * sx,
        top: r.y + node.clientTop * sy,
        right: r.x + (node.clientLeft + node.clientWidth) * sx,
        bottom: r.y + (node.clientTop + node.clientHeight) * sy,
      };
    };
    const align = (popup, target, useRightBottom = false) => {
      const style = popup.getAttribute('style');
      const m = p.measureAlign({ popupEle: popup, target });
      if (!m) throw new Error('Expected measurable popup');
      const restored = popup.getAttribute('style') === style;
      const outcome = p.alignPopup(
        {
          target: m.target,
          popup: m.popup,
          visible: m.visible,
          scroll: m.check,
          scaleX: m.scaleX,
          scaleY: m.scaleY,
        },
        { points: ['tl', 'bl'], offset: [0, 6] },
      );
      if (useRightBottom) {
        popup.style.left = 'auto';
        popup.style.top = 'auto';
        popup.style.right = `${p.mirrorOffsetR(m.mirror, m.popup, outcome.offsetX * m.scaleX) / m.scaleX}px`;
        popup.style.bottom = `${p.mirrorOffsetB(m.mirror, m.popup, outcome.offsetY * m.scaleY) / m.scaleY}px`;
      } else {
        popup.style.right = 'auto';
        popup.style.bottom = 'auto';
        popup.style.left = `${outcome.offsetX}px`;
        popup.style.top = `${outcome.offsetY}px`;
      }
      return { restored, scaleX: m.scaleX, scaleY: m.scaleY, gap: gap(popup, target) };
    };
    const host = make(
      document,
      'position:absolute;left:60px;top:40px;width:360px;height:250px;border:6px solid;padding:11px;overflow:auto;transform:scale(1.25,.75);transform-origin:0 0',
    );
    const content = make(document, 'position:relative;width:760px;height:580px', host);
    const target = make(
      document,
      'position:absolute;left:180px;top:140px;width:40px;height:20px',
      content,
      'button',
    );
    target.textContent = 'Target';
    const popup = make(
      document,
      'position:absolute;left:41px;top:9px;width:100px;height:60px;padding:10px;border:3px solid;box-sizing:content-box',
      host,
    );
    host.scrollLeft = 23;
    host.scrollTop = 37;
    const leftTop = align(popup, target);
    const rightBottom = align(popup, target, true);
    const visible = p.getVisibleArea(p.getViewportArea(document), [host]);
    const expectedVisible = actualClientArea(host);
    host.scrollLeft += 19;
    host.scrollTop += 21;
    const afterScroll = align(popup, target);

    const axis = make(
      document,
      'position:absolute;left:620px;top:100px;width:160px;height:60px;overflow-x:clip;overflow-y:visible',
    );
    const painted = make(document, 'width:100px;height:180px;background:rgb(17,80,170)', axis);
    const axisRect = rect(axis);
    const axisArea = p.getVisibleArea(p.getViewportArea(document), [axis]);
    const visibleYAxis = document.elementFromPoint(axisRect.x + 30, axisRect.y + 120) === painted;
    axis.style.overflowX = 'visible';
    const unclipped = p.getVisibleArea(p.getViewportArea(document), [axis]);

    const iframe = make(
      document,
      'position:absolute;left:10px;top:420px;width:640px;height:350px;border:0',
      document.body,
      'iframe',
    );
    const doc = iframe.contentDocument;
    doc.open();
    doc.write('<!doctype html><html><head></head><body style="margin:0"></body></html>');
    doc.close();
    const foreignHost = make(
      doc,
      'position:relative;width:280px;height:220px;overflow:hidden;border:5px solid',
    );
    const root = foreignHost.attachShadow({ mode: 'closed' });
    const foreignTarget = make(
      doc,
      'position:absolute;left:100px;top:90px;width:30px;height:20px',
      root,
      'button',
    );
    const foreignPopup = make(
      doc,
      'position:absolute;left:10px;top:10px;width:80px;height:40px;box-sizing:border-box',
      root,
    );
    const foreign = align(foreignPopup, foreignTarget);
    const foreignScroller = p.collectScroller(foreignPopup).includes(foreignHost);
    const foreignWindow = p.getWin(doc) === doc.defaultView;
    doc.body.style.overflow = 'hidden';
    doc.documentElement.style.overflow = 'hidden';
    const shell = p.getVisibleArea(p.getViewportArea(doc), [doc.body, doc.documentElement]);
    const foreignClip = p.getVisibleArea(p.getViewportArea(doc), p.collectScroller(foreignPopup));
    const foreignExpectedClip = actualClientArea(foreignHost);
    const svg = doc.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('width', '40');
    svg.setAttribute('height', '30');
    svg.style.cssText = 'position:absolute;left:130px;top:130px';
    root.append(svg);
    const svgMeasurement = p.measureAlign({ popupEle: foreignPopup, target: svg });

    popup.style.cssText +=
      ';left:13px!important;top:17px;overflow-x:scroll!important;overflow-y:auto;right:3px!important;--native-marker:yes';
    const originalStyle = popup.getAttribute('style');
    const count = host.childElementCount;
    p.measureAlign({ popupEle: popup, target });
    const transaction = {
      restored: popup.getAttribute('style') === originalStyle,
      priority: popup.style.getPropertyPriority('left'),
      childrenRestored: host.childElementCount === count,
    };
    const cssOnly = document.createElement('div');
    host.append(cssOnly);
    const style = make(document, '', document.head, 'style');
    cssOnly.className = 'css-only-popup';
    style.textContent = '.css-only-popup{position:absolute;width:30px;height:20px}';
    const cssOnlyBefore = cssOnly.getAttribute('style');
    p.measureAlign({ popupEle: cssOnly, target });
    const noInlineAttribute = !cssOnly.hasAttribute('style');
    const cssOnlyAfter = cssOnly.getAttribute('style');

    const probe = make(
      document,
      'position:absolute;left:850px;top:100px;width:100px;height:70px;padding:12px;border:7px solid;overflow:clip;overflow-clip-margin:content-box 9px',
    );
    const probeChild = make(
      document,
      'position:absolute;inset:-50px;background:rgb(80,170,30)',
      probe,
    );
    const clipMarginProbe = [];
    for (const value of ['content-box 9px', 'padding-box 9px', 'border-box 9px', '9px']) {
      probe.style.overflowClipMargin = value;
      const style = getComputedStyle(probe);
      const r = probe.getBoundingClientRect();
      const leftInset = value.startsWith('content-box')
        ? 10
        : value.startsWith('border-box')
          ? -9
          : -2;
      const expected = {
        left: r.left + leftInset,
        top: r.top + leftInset,
        right: r.right - leftInset,
        bottom: r.bottom - leftInset,
      };
      clipMarginProbe.push({
        computed: style.overflowClipMargin,
        area: p.getVisibleArea(p.getViewportArea(document), [probe]),
        expected,
        paintedInside:
          document.elementFromPoint(expected.left + 1, r.top + r.height / 2) === probeChild,
        paintedOutside:
          document.elementFromPoint(expected.left - 1, r.top + r.height / 2) === probeChild,
      });
    }
    const rtl = make(
      document,
      'position:absolute;left:850px;top:400px;width:150px;height:90px;border:5px solid;overflow:scroll;direction:rtl',
    );
    make(document, 'width:400px;height:300px', rtl);
    const rtlProbe = {
      area: p.getVisibleArea(p.getViewportArea(document), [rtl]),
      client: actualClientArea(rtl),
      clientLeft: rtl.clientLeft,
      border: getComputedStyle(rtl).borderLeftWidth,
    };
    const docless = document.implementation.createHTMLDocument('detached');
    const orphan = docless.createElement('div');
    const noDocumentWindow =
      p.measureAlign({ popupEle: orphan, target: [0, 0] }) === null &&
      orphan.getAttribute('style') === null;
    return {
      leftTop,
      rightBottom,
      afterScroll,
      visible,
      expectedVisible,
      axisArea,
      axisRect,
      visibleYAxis,
      unclipped,
      viewport: p.getViewportArea(document),
      foreign,
      foreignWindow,
      foreignScroller,
      shell,
      foreignViewport: p.getViewportArea(doc),
      foreignClip,
      foreignExpectedClip,
      svg: svgMeasurement?.target,
      svgRect: rect(svg),
      transaction,
      noInlineAttribute,
      cssOnlyBefore,
      cssOnlyAfter,
      noDocumentWindow,
      clipMarginProbe,
      rtlProbe,
    };
  });
  const close = (actual, expected, context) =>
    assert.ok(Math.abs(actual - expected) <= 1, `${context}: ${actual} vs ${expected}`);
  for (const [name, result] of Object.entries({
    leftTop: metrics.leftTop,
    rightBottom: metrics.rightBottom,
    afterScroll: metrics.afterScroll,
    foreign: metrics.foreign,
  })) {
    assert.equal(result.restored, true, `${name} restores style`);
    close(result.gap.x, 0, `${name} X alignment`);
    close(result.gap.y, 6, `${name} Y gap`);
  }
  assert.equal(metrics.leftTop.scaleX, 1.25);
  assert.equal(metrics.leftTop.scaleY, 0.75);
  for (const edge of ['left', 'top', 'right', 'bottom']) {
    close(metrics.visible[edge], metrics.expectedVisible[edge], `scaled scroller ${edge}`);
    close(
      metrics.foreignClip[edge],
      metrics.foreignExpectedClip[edge],
      `foreign ShadowRoot ${edge}`,
    );
  }
  assert.equal(metrics.foreignWindow, true);
  assert.equal(metrics.foreignScroller, true);
  assert.deepEqual(metrics.shell, metrics.foreignViewport);
  assert.deepEqual(metrics.svg, metrics.svgRect);
  assert.equal(metrics.axisArea.top, 0);
  assert.equal(metrics.axisArea.bottom, metrics.viewport.bottom);
  close(metrics.axisArea.left, metrics.axisRect.x, 'clip X left');
  close(metrics.axisArea.right, metrics.axisRect.x + metrics.axisRect.width, 'clip X right');
  assert.equal(metrics.visibleYAxis, true);
  assert.deepEqual(metrics.unclipped, metrics.viewport);
  assert.deepEqual(metrics.transaction, {
    restored: true,
    priority: 'important',
    childrenRestored: true,
  });
  assert.equal(metrics.noInlineAttribute, true);
  assert.equal(metrics.cssOnlyBefore, null);
  assert.equal(metrics.noDocumentWindow, true);
  for (const margin of metrics.clipMarginProbe) {
    for (const edge of ['left', 'top', 'right', 'bottom'])
      close(margin.area[edge], margin.expected[edge], `${margin.computed} ${edge}`);
    assert.equal(margin.paintedInside, true, `${margin.computed} paints inside its clip edge`);
    assert.equal(margin.paintedOutside, false, `${margin.computed} clips outside its edge`);
  }

  behaviorPassed = true;
} catch (error) {
  failure = error;
} finally {
  await page?.close();
  await browser?.close();
  await server?.close();
  await rm(directory, { recursive: true, force: true });
  const result = {
    behaviorPassed,
    exitCode: failure || diagnostics.length ? 1 : 0,
    durationMs: Math.round(performance.now() - started),
    diagnostics,
    metrics,
  };
  await writeFile(
    '/tmp/apollo-position-browser-result.json',
    `${JSON.stringify(result, null, 2)}\n`,
  );
  console.log(JSON.stringify(result, null, 2));
  if (failure) console.error(failure);
  process.exitCode = result.exitCode;
}
