#!/usr/bin/env node
/** 生成 antd 6.6.4 Image 的 DOM 基线（机械 oracle）。node … [--check] */

import fs from 'node:fs';
import { createRequire } from 'node:module';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createElement as h } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUT_FILE = path.join(__dirname, '../baselines/image.dom.json');
const check = process.argv.includes('--check');

const require = createRequire(import.meta.url);
const antdPkg = require('antd/package.json');
const antd = require('antd');
const { Image } = antd;

const BP = { prefixCls: 'apollo-image' };
const wrap = (node) =>
  h(antd.ConfigProvider, { prefixCls: 'apollo', iconPrefixCls: 'apollo-icon' }, node);

const PX =
  'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==';

const cases = [];
const push = (id, node) => {
  cases.push({ id, html: renderToStaticMarkup(node) });
};

push('image:basic', wrap(h(Image, { ...BP, src: PX, alt: 'a', width: 200, height: 100 })));
push('image:no-preview', wrap(h(Image, { ...BP, src: PX, alt: 'b', width: 96, preview: false })));
push(
  'image:cover-placement',
  wrap(
    h(Image, {
      ...BP,
      src: PX,
      width: 96,
      preview: { cover: { placement: 'top', coverNode: 'top' } },
    }),
  ),
);
push('image:cover-false', wrap(h(Image, { ...BP, src: PX, width: 96, preview: { cover: false } })));
push('image:placeholder-true', wrap(h(Image, { ...BP, src: PX, width: 96, placeholder: true })));
push(
  'image:progress',
  wrap(h(Image, { ...BP, width: 200, height: 200, placeholder: { progress: { percent: 50 } } })),
);
push('image:progress-busy', wrap(h(Image, { ...BP, width: 100, placeholder: { progress: true } })));
push('image:preview-src', wrap(h(Image, { ...BP, src: PX, width: 96, preview: { src: PX } })));
push(
  'image:preview-mask',
  wrap(h(Image, { ...BP, src: PX, width: 96, preview: { mask: { blur: true } } })),
);

const result = {
  $schema: '../schema.json',
  component: 'image',
  antdVersion: antdPkg.version,
  generatedAt: new Date().toISOString(),
  cases,
};

if (check) {
  const existing = JSON.parse(fs.readFileSync(OUT_FILE, 'utf8'));
  if (JSON.stringify(existing.cases) !== JSON.stringify(cases)) {
    console.error('[baseline] image.dom.json 与当前 antd 产物不一致');
    process.exit(1);
  }
  console.log('[baseline] image: check ok,', cases.length, 'cases');
} else {
  fs.writeFileSync(OUT_FILE, `${JSON.stringify(result, null, 2)}\n`);
  console.log('[baseline] image: wrote', cases.length, 'cases →', OUT_FILE);
}
