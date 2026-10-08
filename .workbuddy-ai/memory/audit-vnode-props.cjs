#!/usr/bin/env node
/**
 * 全站审计：VNodeChild 类型的 props vs 组件实际支持的 slots。
 * 输出三列：组件 | prop 名 | 组件源码是否读 slots（含该名）。
 * 判据（React 语义 → Vue 惯例）：ReactNode prop 在 Vue 侧应支持插槽
 * （slot 优先、prop 兜底）；渲染函数 prop（=> VNodeChild）不算。
 */
const fs = require('fs');
const nodePath = require('path');

const SRC = '/Users/nanren/Code/apollo-design-ui/packages/ui/src';

function listComponents() {
  return fs
    .readdirSync(SRC, { withFileTypes: true })
    .filter((e) => e.isDirectory())
    .map((e) => e.name)
    .filter((n) => !n.startsWith('_') && fs.existsSync(nodePath.join(SRC, n, 'index.ts')));
}

/** 从 interface.ts 抓「xxx?: VNodeChild」形式的字段（排除函数类型与 @deprecated） */
function vnodePropsOf(ifacePath) {
  if (!fs.existsSync(ifacePath)) return [];
  const src = fs.readFileSync(ifacePath, 'utf8');
  const out = [];
  const lines = src.split('\n');
  for (let i = 0; i < lines.length; i++) {
    const m = /^\s{2}(\w+)(\?)?:\s*(.*)$/.exec(lines[i]);
    if (!m) continue;
    const [, name, , type] = m;
    if (!/VNodeChild/.test(type)) continue;
    if (/=>|Function|Render/.test(type)) continue; // 渲染函数不是静态节点
    // 向上找同字段 3 行内的 @deprecated 注记
    const ctx = lines.slice(Math.max(0, i - 3), i).join('\n');
    if (/@deprecated/.test(ctx)) continue;
    out.push(name);
  }
  return out;
}

/** 组件主实现里读 slots 的名字 */
function slotsOf(componentDir) {
  const slots = new Set();
  const walk = (dir, depth) => {
    if (depth > 2) return;
    for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
      if (e.name === '__tests__' || e.name === 'demo' || e.name === 'style') continue;
      const p = nodePath.join(dir, e.name);
      if (e.isDirectory()) walk(p, depth + 1);
      else if (/\.(ts|vue)$/.test(e.name)) {
        const src = fs.readFileSync(p, 'utf8');
        // slots.xxx / slots?.xxx / slots['xxx'] / #xxx（模板） / slot name="xxx"
        for (const m of src.matchAll(/slots\??\.(\w+)/g)) slots.add(m[1]);
        for (const m of src.matchAll(/slots\?\?\.\(\)/g)) void m;
        for (const m of src.matchAll(/slots\[\s*['"](\w+)['"]\s*\]/g)) slots.add(m[1]);
        for (const m of src.matchAll(/readSlot\(\s*['"](\w+)['"]\s*\)/g)) slots.add(m[1]);
        for (const m of src.matchAll(/<template #(\w+)/g)) slots.add(m[1]);
      }
    }
  };
  walk(componentDir, 0);
  return slots;
}

const rows = [];
for (const comp of listComponents()) {
  const dir = nodePath.join(SRC, comp);
  const iface = nodePath.join(dir, 'interface.ts');
  const props = vnodePropsOf(iface);
  if (!props.length) continue;
  const slots = slotsOf(dir);
  for (const p of props) {
    rows.push({ comp, prop: p, hasSlot: slots.has(p) });
  }
}

const missing = rows.filter((r) => !r.hasSlot);
console.log('=== VNodeChild props 总数:', rows.length, '其中组件支持同名 slot:', rows.length - missing.length, '缺失:', missing.length);
console.log('\n=== 缺失 slot 的（应补插槽支持）===');
for (const r of missing) console.log(`${r.comp}  .${r.prop}`);
console.log('\n=== 已支持（无需改）===');
for (const r of rows.filter((r) => r.hasSlot)) console.log(`${r.comp}  .${r.prop}`);
