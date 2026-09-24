#!/usr/bin/env node
/**
 * tests/compat/baseline/upload.mjs — 生成 antd 6.6.4 Upload 家族的 DOM 基线
 * （机械 oracle）。
 *
 * 关键判据（G1 分析，docs/analysis/upload.md）：
 * - 裸 select：`.{p}-wrapper > .{p}.{p}-select > span[{p}] > input[type=file]`
 *   （children slot 渲染在引擎根内）。
 * - 列表：`.{p}-list.{p}-list-{listType}` > `-list-item-container` >
 *   `-list-item -list-item-{status}`；文件名 span[role=button]（无 url）/
 *   `<a>`（有 url）；操作按钮（Button text small）在 `-list-item-actions`。
 * - picture 族：缩略图 `-list-item-thumbnail`（有 url 的图片 ⇒ `<img>`）；
 *   picture-card/circle 的上传按钮作为 appendAction 挂列表后（跟随 children）。
 * - drag：`.{p}-drag`（内含 `-btn` + `-drag-container`）。
 * - error 项：外层 title 提示（本仓 P2 替代 Tooltip —— 基线取 antd 原样，
 *   差异在 L4 用 allow 项登记）。
 *
 * 运行：node tests/compat/baseline/upload.mjs [--check]
 */

import fs from 'node:fs';
import { createRequire } from 'node:module';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createElement as h } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUT_FILE = path.join(__dirname, '../baselines/upload.dom.json');
const check = process.argv.includes('--check');

const require = createRequire(import.meta.url);
const antdPkg = require('antd/package.json');
const antd = require('antd');
const { Upload } = antd;

const doneFile = { uid: '1', name: 'a.txt', status: 'done' };
const urlFile = { uid: '2', name: 'b.png', status: 'done', url: 'http://x/b.png' };
const errFile = { uid: '3', name: 'c.txt', status: 'error' };
const upFile = { uid: '4', name: 'd.txt', status: 'uploading', percent: 50 };

const cases = [];
const push = (id, node) => {
  // React 19 会把缩略图 <link rel=preload> 提升到 body 顶（平台产物，非组件 DOM）——剥掉
  const html = renderToStaticMarkup(node).replace(/^<link rel=\"preload\"[^>]*>/, '');
  cases.push({ id, html });
};

const BP = { prefixCls: 'apollo-upload' };
const wrap = (node) =>
  h(antd.ConfigProvider, { prefixCls: 'apollo', iconPrefixCls: 'apollo-icon' }, node);

// ---- 触发区 ----

push('upload:basic', wrap(h(Upload, { ...BP, action: '/u' }, 'upload')));
push('upload:no-children', wrap(h(Upload, { ...BP, action: '/u' })));
push('upload:accept', wrap(h(Upload, { ...BP, action: '/u', accept: '.jpg,image/*' }, 'x')));
push('upload:directory', wrap(h(Upload, { ...BP, action: '/u', directory: true }, 'x')));
push('upload:multiple', wrap(h(Upload, { ...BP, action: '/u', multiple: true }, 'x')));
push('upload:capture', wrap(h(Upload, { ...BP, action: '/u', capture: 'user' }, 'x')));
push('upload:disabled', wrap(h(Upload, { ...BP, action: '/u', disabled: true }, 'x')));

// ---- 列表（text）----

push('upload:list-text', wrap(h(Upload, { ...BP, action: '/u', defaultFileList: [doneFile] }, 'x')));
push(
  'upload:list-text-mixed',
  wrap(h(Upload, { ...BP, action: '/u', defaultFileList: [doneFile, urlFile, errFile, upFile] }, 'x')),
);
push(
  'upload:list-show-false',
  wrap(h(Upload, { ...BP, action: '/u', showUploadList: false, defaultFileList: [doneFile] }, 'x')),
);
push(
  'upload:list-err-removed-icon',
  wrap(
    h(Upload, {
      ...BP,
      action: '/u',
      defaultFileList: [doneFile],
      showUploadList: { showRemoveIcon: false, showPreviewIcon: false },
    }, 'x'),
  ),
);
push(
  'upload:list-download-icon',
  wrap(
    h(Upload, {
      ...BP,
      action: '/u',
      defaultFileList: [doneFile],
      showUploadList: { showDownloadIcon: true },
    }, 'x'),
  ),
);

// ---- picture 族 ----

push('upload:list-picture', wrap(h(Upload, { ...BP, action: '/u', listType: 'picture', defaultFileList: [urlFile] }, 'x')));
push(
  'upload:picture-card',
  wrap(h(Upload, { ...BP, action: '/u', listType: 'picture-card', defaultFileList: [urlFile] }, 'card')),
);
push(
  'upload:picture-circle',
  wrap(h(Upload, { ...BP, action: '/u', listType: 'picture-circle', defaultFileList: [urlFile] }, 'cir')),
);
push(
  'upload:picture-card-empty',
  wrap(h(Upload, { ...BP, action: '/u', listType: 'picture-card' }, 'card')),
);

// ---- drag ----

push('upload:drag', wrap(h(Upload, { ...BP, action: '/u', type: 'drag' }, 'drag here')));
push('upload:drag-disabled', wrap(h(Upload, { ...BP, action: '/u', type: 'drag', disabled: true }, 'drag')));

// ---- 语义化 ----

push(
  'upload:semantic',
  wrap(
    h(Upload, {
      ...BP,
      action: '/u',
      classNames: { root: 'cls-root', list: 'cls-list', trigger: 'cls-trigger' },
      styles: { root: { width: 200 } },
      defaultFileList: [doneFile],
    }, 'x'),
  ),
);

// ---- rtl ----

push(
  'upload:rtl',
  h(
    antd.ConfigProvider,
    { prefixCls: 'apollo', iconPrefixCls: 'apollo-icon', direction: 'rtl' },
    h(Upload, { ...BP, action: '/u', defaultFileList: [doneFile] }, 'x'),
  ),
);

const result = {
  $schema: '../schema.json',
  component: 'upload',
  antdVersion: antdPkg.version,
  generatedAt: new Date().toISOString(),
  cases,
};

if (check) {
  const existing = JSON.parse(fs.readFileSync(OUT_FILE, 'utf8'));
  const same = JSON.stringify(existing.cases) === JSON.stringify(cases);
  if (!same) {
    console.error('[baseline] upload.dom.json 与当前 antd 产物不一致');
    process.exit(1);
  }
  console.log('[baseline] upload: check ok,', cases.length, 'cases');
} else {
  fs.writeFileSync(OUT_FILE, `${JSON.stringify(result, null, 2)}\n`);
  console.log('[baseline] upload: wrote', cases.length, 'cases →', OUT_FILE);
}
