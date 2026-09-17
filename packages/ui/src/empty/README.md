# empty

> **层**：L3（`packages/ui`）｜ **优先级**：P0 ｜ **复杂度**：S ｜ **antd 版本**：6.6.4
>
> 契约来源：antd `es/empty/index.js` + `es/empty/empty.js` + `es/empty/simple.js` + `es/empty/style/index.js`。
> 上游是**兼容性规格**，不是代码来源。

---

## 1. 职责

空状态占位。两幅插画（默认 184×152 / 简洁 64×41）、可选的描述文案、可选的页脚。

它是 `config-provider` 的 `defaultRenderEmpty` 的依赖，所以必须先于 `config-provider` 完成。

## 2. 文件布局与「为什么是 .ts」

```
empty/
├── Empty.vue                       # 主组件
├── interface.ts                    # 全部类型（EmptyProps / EmptyConfig / 语义类型）
├── index.ts                        # 公共导出 + PRESENTED_IMAGE_* 常量
├── style/index.ts                  # (prefixCls) => CSS 文本（G4）
├── components/
│   ├── artwork.ts                  # ★ 自动生成（registry/tools/gen-empty-artwork.mjs）
│   ├── Images.ts                   # 两个插画组件（.ts，非 .vue）
│   └── NodeRenderer.ts             # 「任意可渲染值」的渲染器（.ts，非 .vue）
├── demo/                           # 6 个 demo，与 antd 一一对应
├── __tests__/                      # L1 / L3 / L4 / L5 + theme
└── index.zh-CN.md / index.en-US.md
```

### 2.1 为什么 `components/` 下是 `.ts` 而不是 `.vue`

`COMPONENT-RULES.md` §2 规定 `.vue` 是默认形态，并允许 `.tsx`/`.ts` 用于
**「纯渲染函数型内部件」**。这里两个文件都落在这个例外里，各有独立理由：

| 文件 | 理由 |
|---|---|
| `artwork.ts` | **必须由脚本生成**。插画是矢量画，手写等于重画一遍，必然与上游产生像素差异；而「像素级一致」是 L6 的验收标准。生成物只有标签、几何、路径，没有一行逻辑。用 `.vue` 写就没法保证「生成物 == antd 的渲染产物」 |
| `NodeRenderer.ts` | 它渲染的是**运行时才知道形态**的值（字符串 / VNode / 组件）。`.vue` 模板没有「渲染一个 VNode 变量」的语法：`{{ value }}` 会把 VNode JSON 化，`<component :is>` 只接受组件或标签名。这不是风格选择，是模板的能力边界 |

两个文件都**没有状态、没有事件、没有插槽**，符合例外条件。

### 2.2 `config-provider/context.ts` 是叶子模块，不是组件

`registry/components.json` 把 `config-provider/context` 记在 `leafModules` 而不是
`components` —— 含义是：Empty 需要的是**那个叶子模块**，不是 ConfigProvider 组件本身。

ConfigProvider 组件（theme / locale / size / disabled 的统一入口）走它自己的 G0→G14。
当前叶子模块只落了 Empty 真正用到的三件事：`getPrefixCls` / `direction` / `useComponentConfig`。
其余（`theme` / `locale` / `renderEmpty` / `getPopupContainer`）**没有消费者，所以没写**
—— 提前写就是凭想象实现。

### 2.3 它**不**依赖组件目录

`import` 全部指向叶子模块：`../config-provider/context`、`../_internal/use-merge-semantic`、
`../_internal/with-install`。没有任何 `import ... from '../button'` 这类边。

---

## 3. 公共 API

与 antd 的 `EmptyProps` 逐字段对齐。完整表格见 [`index.zh-CN.md`](./index.zh-CN.md)。

```ts
interface EmptyProps {
  prefixCls?: string;
  className?: string;
  rootClassName?: string;
  style?: CSSProperties;
  /** @deprecated 用 styles.image 代替 */
  imageStyle?: CSSProperties;
  image?: VNodeChild | Component;   // 见 D23
  description?: VNodeChild;         // false 表示不渲染
  classNames?: EmptySemanticClassNames | ((info: { props: EmptyProps }) => EmptySemanticClassNames);
  styles?: EmptySemanticStyles | ((info: { props: EmptyProps }) => EmptySemanticStyles);
}
```

静态属性：`Empty.PRESENTED_IMAGE_DEFAULT` / `Empty.PRESENTED_IMAGE_SIMPLE`
（同时提供**具名导出** `PRESENTED_IMAGE_DEFAULT` / `PRESENTED_IMAGE_SIMPLE`）。

---

## 4. 三条最容易写错的判据（都已被 compat 用例钉住）

### 4.1 `des` 与 `alt` 的判据不同

| 量 | 判据 |
|---|---|
| `des` 的**取值** | `description !== undefined ? description : locale.description` —— 传 `''` 或 `0` 就用传入值 |
| 描述块**是否渲染** | `isRenderable(des)` —— `''` / `false` / `null` 不渲染 |
| `alt` | `typeof des === 'string' ? des : 'empty'` —— 用的是 **`des` 不是 `description`** |

于是：不传 `description` 时 `alt` 是 locale 文案（`'No data'`），不是 `'empty'`；
传 `''` 时 `alt` 是空串且描述块不渲染。三条组合都有独立用例。

### 4.2 `-normal` 类名靠**引用相等**

判据是 `mergedImage === PRESENTED_IMAGE_SIMPLE`，不是「宽高是不是 64×41」。
`index.test.ts` 里有一条专门的用例：形状相同的另一个组件**不会**触发 `-normal`。

### 4.3 `style` 覆盖 `styles.root`

合并顺序是 `[contextStyles, {root: contextStyle}, styles, {root: style}]` —— `style` 在最后。
这条最反直觉，也最容易被「顺手改成更合理的顺序」。

---

## 5. 样式

`style/index.ts` 导出 `(prefixCls) => CSS 文本`。构建钩子
（`packages/ui/build.config.ts`）把它落成：

```
dist/empty/style.css     ← 按需引入（含 apollo / ant 两套前缀）
dist/index.css           ← 全部组件汇总
```

三条架构性质，各由一条测试钉住：

1. **零字面视觉值**：颜色/尺寸全部走 `var(--apollo-*)`，`theme.test.ts` 断言 CSS 里
   不出现 `#hex` / `rgb()` / `NNpx`。
2. **变量真的存在**：`tests/build/run.mjs` 的 B7 校验每个 `var(--apollo-*)` 都能在
   `packages/theme/dist/tokens.css` 里找到声明。这条检查是「零运行时 + 静态 CSS」
   的必要配套 —— 写错变量名不会报错，只会静默失效。
3. **两套前缀**：`STATIC_PREFIX_CLS = ['apollo', 'ant']`。只生成 `apollo` 的话，
   把 `prefixCls` 改成 `ant` 会得到一堆没有样式的类名 —— 裁决承诺的「可覆盖为 ant」就是空的。

### 5.1 Component Token：一个都没有

antd 的 `mergeToken` 造了 4 个**内部** token（`emptyImgCls` / `emptyImgHeight` /
`emptyImgHeightMD` / `emptyImgHeightSM`），它们不在 antd 的 `ComponentToken` 里，
用户无法通过 `theme.components.Empty` 覆盖。我们也不暴露，改成
`calc(var(--apollo-control-height-lg) * 2.5)` 这类变量表达式 ——
compact 或自定义 `controlHeightLG` 时高度仍会跟着变。

`registry/components.json` 的 `tokenStatus` 因此记 `n/a`（依据写在 `layerNotes`）。
「登记 0 个 token 并声称完成」与「确认它确实没有 token」是两件事。

---

## 6. 测试

| 层 | 文件 | 状态 |
|---|---|---|
| L1 单元 | `__tests__/index.test.ts`（36 用例） | ✅ |
| L2 交互 | —— | **n/a** |
| L3 类型 | `__tests__/type.test-d.ts`（含负例） | ✅ |
| L4 DOM 契约 | `__tests__/semantic.test.ts`（32 用例，与 antd 实测产物逐节点比对） | ✅ |
| L5 无障碍 | `__tests__/a11y.test.ts`（含全部 demo 的 axe 扫描） | ✅ |
| L6 视觉回归 | —— | **blocked** |
| 主题矩阵 | `__tests__/theme.test.ts`（四态） | ✅ |
| demo 冒烟 | `__tests__/demo.test.ts`（6 个） | ✅ |

### 6.1 L2 为什么是 n/a

Empty 是纯展示组件：无事件、无状态、无受控/非受控语义、无键盘交互。
`TESTING.md` 的 L2 要求覆盖「鼠标 / 键盘 / 焦点 / 受控 / 禁用」六类，这里**一类都不适用**。
写几个 `expect(exists()).toBe(true)` 把格子填上属于反模式 A1（用形式上的用例掩盖未覆盖）。

### 6.2 L6 为什么是 blocked

`tests/visual/` 只有 README：没有 runner，没有基线。视觉基线入库策略**已裁决**
（`openDecisions[visual-baseline-in-git]` = A），但基建本身未落地。
所以 `visualStatus` 记 `blocked` 而不是 `done`，组件整体状态也因此不是 `completed`。

---

## 7. 有意差异

全部登记在 `COMPATIBILITY.md` §9.2。本组件相关的：

| # | 一句话 |
|---|---|
| D5 | 我们**没有** CSS-in-JS 注入的 hash 类名（`dom-contract.ts` 做对称剔除，`tests/compat/README.md` §4 的标准步骤） |
| D6 | 默认前缀是 `apollo`（antd 是 `ant`），所以 `plain:no-props` 那条用例的差异是**有意的** |
| D19 | 插画颜色输出 `var(--apollo-*)` 而不是合成实色 hex |
| D20 | 字符串 `image` 时 React 19 会多渲染一个 `<link rel="preload">` |
| D21 | **Boolean prop 转换**：`VNodeChild` 类型的未传 prop 会被 Vue 转成 `false`（见 §8） |
| D22 | `EmptyRef.nativeElement` 声明为可空 |
| D23 | `image` 接受**组件**（Vue 没有「元素」概念）；`PRESENTED_IMAGE_*` 是组件对象 |
| D24 | locale 变更不触发重渲染（`useLocale` 是 setup 期快照）—— **待修的缺口** |

---

## 8. ⚠️ 给后续 71 个组件的话

### 8.1 `VNodeChild` 类型的 prop 必须显式声明 `undefined` 默认值（D21）

```ts
const props = withDefaults(defineProps<EmptyProps>(), {
  image: undefined,        // ← 不是冗余！
  description: undefined,  // ← 删掉会让未传时变成 `false`
});
```

Vue 的 Boolean prop 转换：只要 prop 的**运行时类型**含 `Boolean`，且调用方没传、
也没有 `default`，Vue 就把它赋成 `false`。而 `VNodeChild` 经 SFC 编译器解析后是
`[Object, String, Number, Boolean, null, Array]`。

这个坑的症状非常隐蔽：组件「能渲染」，只是**少了一块**（描述整块消失 / 插画变成注释节点）。
它不会报错、不会警告、类型检查也过。Empty 是被 L4 的逐节点比对抓出来的。

**判据**：任何 `React.ReactNode` 映射过来的 prop（`VNodeChild`）都要照做。
`title` / `content` / `label` / `extra` / `children` / `footer` 全部适用。

### 8.2 antd 的 `!(deprecatedName in props)` 判据在 Vue 下失效（D21）

Vue 的 props 对象**恒**包含全部声明过的键（未传时值为 `undefined`），
`'imageStyle' in props` 恒为 `true`。改成 `props.imageStyle !== undefined`。

### 8.3 组件之间的「常量身份」要用 `markRaw`

`-normal` 类名靠 `===` 判定，而 Vue 的 props 在部分挂载路径下会被 `reactive()` 深代理
（实测 `@vue/test-utils` 的 `mount(Comp, { props })` 会触发），代理后 `!==` 原对象。
两个插画组件用 `markRaw` 钉住 —— 这是 Vue 官方对「组件对象被放进响应式容器」的建议做法。

### 8.4 用 `.vue` 写组件时，构建链有两个坑

`packages/ui/build.config.ts` 顶部注释里有完整说明，这里只列结论：

1. unbuild 的 rollup 管线不认识 `.vue` —— 要往 `rollup:options` 钩子里塞
   `@vitejs/plugin-vue`。
2. **unbuild 的 `declaration: true` 对 `.vue` 会静默产出错误的 `.d.ts`**
   （`rollup-plugin-dts` 把编译后的 JS 当声明写出去），而 `tests/build/run.mjs` 的 B2
   只校验路径存在 —— 所以必须 `declaration: false` + 用 `vue-tsc` 出真声明，
   并在构建钩子末尾**断言产物里含 `declare` / `export type`**。

---

## 9. 已知缺口

1. **D24：locale 变更不触发重渲染。** 今天不可观测（没有 ConfigProvider），
   但落点在 `@apollo-design/locale`：需要新增一个返回 `ComputedRef` 的变体。
   **不能改 `useLocale` 的签名** —— 它会破坏 locale 包已完成的契约与测试。
2. **L6 视觉回归基建未落地**（见 §6.2）。
3. **插画的视觉一致性只由「生成器与 antd 产物一致」间接保证**。
   真正的像素级验证要等 L6；在那之前，「生成器没跑偏」是唯一的机械保证
   （`node registry/tools/gen-empty-artwork.mjs --check`）。
