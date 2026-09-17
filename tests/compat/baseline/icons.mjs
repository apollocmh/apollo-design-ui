#!/usr/bin/env node
/**
 * tests/compat/baseline/icons.mjs — 生成 @ant-design/icons 的 DOM 基线（机械 oracle）
 *
 * 为什么是「机械」的：这里直接调用 React 的 renderToStaticMarkup 渲染 antd 的图标组件，
 * 把输出**原样**落盘，中间不经过任何「理解」步骤。如果我们自己读源码再手写基线，
 * 基线里的每一条断言就都变成了「我读懂了什么」，而不是「antd 真的输出了什么」——
 * 差分通过只能说明两边都想通了，连 antd 的缺陷都会被一起写进去。
 *
 * 因此本文件**只做三件事**：构造用例、调用 React、写文件。
 * 归一化与比对在消费侧（packages/icons/src/__tests__/semantic.test.ts）完成，
 * 且必须**对称**（两侧走同一个归一化器）。
 *
 * 运行：
 *   node tests/compat/baseline/icons.mjs
 *   node tests/compat/baseline/icons.mjs --out /tmp/icons.dom.json
 *
 * React 与 @ant-design/icons 只允许出现在本目录（tests/compat）下，
 * 见 tests/compat/README.md §7 与 TESTING.md 反模式 A9。
 */

import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import * as Icons from '@ant-design/icons';
import IconsPkg from '@ant-design/icons/package.json' with { type: 'json' };
import { createElement as h } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(__dirname, '../../..');

/**
 * `iconStyles` 与 `svgBaseProps` 不在包的公开入口上（`@ant-design/icons` 的 index 只导出
 * 图标组件与 5 个 API），只能深导入。走 `lib/*`（CJS）而不是 `es/*`：
 * 后者的相对 import 不带扩展名，Node 原生 ESM 解析不了（上一轮实测踩过）。
 * `./lib/*` 是包 `exports` 里显式允许的子路径，不是靠猜。
 */
const require = createRequire(import.meta.url);
const { iconStyles, svgBaseProps } = require('@ant-design/icons/lib/renderUtils');

// ---------------------------------------------------------------------------
// 取出图标组件
// ---------------------------------------------------------------------------

const {
  default: Icon,
  getTwoToneColor,
  setTwoToneColor,
  createFromIconfontCN: _createFromIconfontCN,
  IconProvider,
  ...rest
} = Icons;

/**
 * ⚠️ 必须显式排除 `__esModule`：CJS→ESM 互操作会把它作为一个值为 `true` 的具名导出
 * 暴露出来。不排除的话，全量渲染循环会走到 `h(true)` 并抛
 * 「Element type is invalid ... but got: boolean」，让 oracle 直接崩掉。
 * 这一条是上一轮 /tmp 版本实际踩到的坑，所以在这里写成断言而不是靠运气。
 */
const iconComponents = Object.fromEntries(
  Object.entries(rest).filter(
    ([name, value]) =>
      name !== '__esModule' && (typeof value === 'function' || typeof value === 'object'),
  ),
);

if (iconComponents.__esModule !== undefined) {
  throw new Error('oracle: __esModule 泄漏进图标清单，过滤规则失效');
}

const names = Object.keys(iconComponents).sort();
const render = (node) => renderToStaticMarkup(node);
const suffixCount = (suffix) => names.filter((n) => n.endsWith(suffix)).length;

// ---------------------------------------------------------------------------
// 用例
// ---------------------------------------------------------------------------

const cases = [];
const push = (id, node) => cases.push({ id, html: render(node) });

// 1. 默认渲染：三种主题各一个 + loading（名字本身触发 spin）
for (const n of [
  'AccountBookOutlined',
  'AccountBookFilled',
  'AccountBookTwoTone',
  'LoadingOutlined',
  'HomeOutlined',
]) {
  push(`plain:${n}`, h(iconComponents[n]));
}

// 2. className 作用于外层 span
push('props:className', h(iconComponents.HomeOutlined, { className: 'my-cls' }));

// 3. spin 显式开启
push('props:spin', h(iconComponents.HomeOutlined, { spin: true }));

// 4. rotate
push('props:rotate:90', h(iconComponents.HomeOutlined, { rotate: 90 }));
push('props:rotate:180', h(iconComponents.HomeOutlined, { rotate: 180 }));
// rotate:0 —— antd 用的是**真值**判断，0 不产生 style 属性。
// 这条必须钉住：写成 `rotate !== undefined` 会多出 transform:rotate(0deg)，视觉无差异但 DOM 契约不同。
push('props:rotate:0', h(iconComponents.HomeOutlined, { rotate: 0 }));

// 5. onClick 未给 tabIndex 时兜底为 -1
push('props:onClick', h(iconComponents.HomeOutlined, { onClick: () => {} }));

// 6. tabIndex 显式
push('props:tabIndex:0', h(iconComponents.HomeOutlined, { tabIndex: 0 }));

// 7. style / id / data-* 透传到外层 span
push(
  'props:passthrough',
  h(iconComponents.HomeOutlined, { style: { color: 'red' }, 'data-testid': 'x', id: 'my-icon' }),
);

// 8. rotate + className 组合
push('props:rotate+class', h(iconComponents.HomeOutlined, { rotate: 45, className: 'a b' }));

// 9. TwoTone 默认色（模块初始化时 setTwoToneColor(blue.primary)）
push('twotone:default', h(iconComponents.AccountBookTwoTone));

// 10. TwoTone 单色（prop 覆盖模块级调色板）
push('twotone:single', h(iconComponents.AccountBookTwoTone, { twoToneColor: '#f5222d' }));

// 11. TwoTone 双色
push(
  'twotone:pair',
  h(iconComponents.AccountBookTwoTone, { twoToneColor: ['#f5222d', '#52c41a'] }),
);

// 12. Outlined 传 twoToneColor：走 AntdIconLight，应被完全忽略
push('twotone:ignored-on-outlined', h(iconComponents.HomeOutlined, { twoToneColor: '#f5222d' }));

// 13. LoadingOutlined 名字即 spin
push('loading:implicit-spin', h(iconComponents.LoadingOutlined));

// 14. 非法 icon：AntdIcon 的 warning 分支，返回 null
push('invalid:icon-null', h(Icon, { icon: null }));
push('invalid:icon-string', h(Icon, { icon: 'nope' }));

// 15. IconProvider 改变 prefixCls —— 类名必须整体替换
push(
  'provider:prefix-cls',
  h(IconProvider, { value: { prefixCls: 'my' } }, h(iconComponents.HomeOutlined)),
);
push(
  'provider:root-class',
  h(
    IconProvider,
    { value: { prefixCls: 'anticon', rootClassName: 'root-x' } },
    h(iconComponents.HomeOutlined),
  ),
);
push(
  'provider:twotone-prefix',
  h(IconProvider, { value: { prefixCls: 'zz' } }, h(iconComponents.AccountBookTwoTone)),
);

// 16. 基础 Icon（children 形态，iconfont 路径）
push('icon:children', h(Icon, { viewBox: '0 0 1024 1024' }, h('path', { d: 'M0 0h1024v1024H0z' })));
push('icon:children-no-viewbox', h(Icon, null, h('use', { xlinkHref: '#foo' })));
// spin 在基础 Icon 上的落点与 AntdIcon 不同：span 只在有 component 时才加 -spin，
// svg 一律加。这条差异必须被钉住，否则迁移时会静默改变行为。
push(
  'icon:children-spin',
  h(Icon, { viewBox: '0 0 1024 1024', spin: true }, h('path', { d: 'M0 0h1v1H0z' })),
);
push(
  'icon:children-rotate+class',
  h(
    Icon,
    { viewBox: '0 0 1024 1024', rotate: 30, className: 'k' },
    h('path', { d: 'M0 0h1v1H0z' }),
  ),
);

// 17. 用户传入的 aria-label 覆盖内置的 icon.name（restProps 在后，后者胜出）
push('props:aria-label-override', h(iconComponents.HomeOutlined, { 'aria-label': 'My home' }));
push('props:role-override', h(iconComponents.HomeOutlined, { role: 'presentation' }));
push('props:aria-hidden-false', h(iconComponents.HomeOutlined, { 'aria-hidden': false }));

// 17b. 基础 Icon 的 `ariaLabel` prop。
// antd 的 `IconComponentProps` 声明了它，但 `Icon.js` **没有解构它** ——
// 于是它落进 restProps，被 React 当成未知属性渲染成 `arialabel="…"`，
// 而 `arialabel` 不是合法的 ARIA 属性，屏幕阅读器会忽略它（可访问名丢失）。
// 这条用例的作用是把这个缺陷**测量出来**，使「我们修了它」成为可证伪的断言（D17）。
push('props:ariaLabel-prop', h(Icon, { ariaLabel: 'My home' }));

// 17c. 基础 Icon 的 `component` 路径：自定义 svg 组件收到的 props 就是 innerSvgProps。
// 这条钉住 innerSvgProps 的**键集合与顺序**（width/height/fill/aria-hidden/focusable/color/class/style/viewBox）。
const CustomSvg = (props) =>
  h('svg', { ...props, 'data-custom': 'yes' }, h('path', { d: 'M0 0h1v1H0z' }));
push('icon:component', h(Icon, { component: CustomSvg, viewBox: '0 0 8 8', color: 'red' }));
push('icon:component-no-viewbox', h(Icon, { component: CustomSvg }));

// 17d. `component` **与** children 同时存在。
// antd 是 `createElement(Component, innerSvgProps, children)` —— 有 children 才传第三个参数。
// Vue 侧对应「传不传默认插槽」，写成恒传会让空内容的自定义组件收到一个空插槽，
// 所以这两条必须分开测：只有 `icon:component` 会漏掉「传插槽」这一支。
//
// ⚠️ 必须用一个**会渲染 children** 的自定义组件。上面那个 `CustomSvg` 无条件渲染自己的
//    `<path>`，无论插槽传没传产物都一模一样 —— 那样的用例永远不可能失败，等于没测。
//    `CustomSvgEcho` 把收到的 children 渲染出来，于是「内容是否送达自定义组件」在 DOM 上可见。
//
//    试过但**否决**的做法：给 echo 组件加一个 `data-children="single|array:0|none"` 标记，
//    把「children 是单个节点 / 空数组 / 未传」也写进 DOM。否决原因是它**不可移植** ——
//    React 通过 `props.children` 传内容，Vue 通过 `slots` 传，Vue 组件上根本没有
//    `props.children`。把这个标记留在基线里，只会让 Vue 侧无论怎么写都对不上，
//    造出一个假差异。可比的只有「渲染出来的内容」。
const CustomSvgEcho = (props) =>
  h('svg', { ...props, 'data-custom': 'echo' }, props.children ?? null);
push(
  'icon:component-with-children',
  h(Icon, { component: CustomSvgEcho, viewBox: '0 0 8 8' }, h('circle', { cx: 4, cy: 4, r: 3 })),
);
// 空 children：两侧的**产物**都是空 `<svg>`（React 的 `props.children` 会是 `[]`，
// 但它渲染不出东西）。这条用例钉的是「空 children 不产生多余节点」—— 若哪天我们把插槽
// 恒传出去、而自定义组件因此多渲染一层包裹，它会红。它证明不了别的。
push(
  'icon:component-empty-children',
  h(Icon, { component: CustomSvgEcho, viewBox: '0 0 8 8' }, []),
);

// 18. 全量：所有图标的默认渲染（用于逐字比对与统计）
const all = {};
for (const n of names) {
  all[n] = render(h(iconComponents[n]));
}

// 19. 模块级 TwoTone 调色板的读写行为
const twoToneProbe = { initial: getTwoToneColor() };
setTwoToneColor('#eb2f96');
twoToneProbe.afterSetSingle = getTwoToneColor();
twoToneProbe.renderAfterSetSingle = render(h(iconComponents.AccountBookTwoTone));
setTwoToneColor(['#eb2f96', '#fff1f0']);
twoToneProbe.afterSetPair = getTwoToneColor();
twoToneProbe.renderAfterSetPair = render(h(iconComponents.AccountBookTwoTone));
// 还原默认值，避免影响后续用例
setTwoToneColor('#1677ff');

// ---------------------------------------------------------------------------
// 落盘
// ---------------------------------------------------------------------------

const outIdx = process.argv.indexOf('--out');
const outPath =
  outIdx > -1 ? process.argv[outIdx + 1] : path.join(__dirname, '../baselines/icons.dom.json');

const payload = {
  $comment:
    'DOM 基线：由 tests/compat/baseline/icons.mjs 从 @ant-design/icons 真实渲染生成。机械 oracle，禁止手改。重新生成：node tests/compat/baseline/icons.mjs',
  iconsVersion: IconsPkg.version,
  renderer: 'react-dom/server.renderToStaticMarkup',
  iconCount: names.length,
  themed: {
    filled: suffixCount('Filled'),
    outlined: suffixCount('Outlined'),
    twoTone: suffixCount('TwoTone'),
    other: names.filter((n) => !/(Filled|Outlined|TwoTone)$/.test(n)).length,
  },
  cases,
  twoToneProbe,
  all,
  // 样式契约：`@ant-design/icons` 在运行时注入的 CSS 原文（`.anticon` 前缀）。
  // 我们不走运行时注入，改为构建期静态 CSS，但**文本必须一致** —— 否则图标观感会漂移。
  style: {
    defaultIconPrefixCls: 'anticon',
    iconStyles,
    svgBaseProps,
  },
};

const serialized = `${JSON.stringify(payload, null, 2)}\n`;

// `--check`：只校验基线是否最新，**不写盘**。
//
// 为什么必须有：`tests/compat/runner/index.mjs` 在「校验模式」下会以 `--check` 调用
// 每个生成器。如果生成器不支持这个开关，它就会**默默把基线重写一遍** ——
// 于是「校验」变成了「覆盖」，基线漂移再也发现不了。
if (process.argv.includes('--check')) {
  const current = existsSync(outPath) ? readFileSync(outPath, 'utf8') : '';
  if (current !== serialized) {
    console.error('[compat:icons] ❌ 基线不是最新的');
    console.error('  运行: node tests/compat/baseline/icons.mjs');
    process.exit(1);
  }
  console.log(`[compat:icons] ✅ 基线最新（${names.length} 个图标 / ${cases.length} 个用例）`);
  process.exit(0);
}

writeFileSync(outPath, serialized);

console.log(`图标总数 ${names.length}`, payload.themed);
console.log(`用例 ${cases.length} 个`);
console.log(`写出 ${path.relative(REPO_ROOT, outPath)}`);
