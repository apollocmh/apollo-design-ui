# `locale` 契约文档

> G1/G2 的分析产物。**步骤 3 的产物必须先于步骤 5 存在**（`AGENTS.md` §2）。
> 事实来源：**antd 6.6.4 的 ESM 产物**（`/tmp/antd-src/package/es/`）+
> `@rc-component/pagination@1.4.0` 与 `@rc-component/picker@1.12.2` 的 locale。

---

## 1. 这个包解决什么

73 个语言包 + `Locale` 类型 + 取 locale 的组合式。`risk: low`、`pocRequired: false`、
`dependsOn: []`（**没有任何依赖**，纯数据 + 一小段合并逻辑）。

| 部分 | 上游位置 |
|---|---|
| 73 个语言包 | `components/locale/<lang>.ts` |
| 日期相关的三片 | `components/{calendar,date-picker,time-picker}/locale/<lang>.ts` |
| `Locale` 类型 | `components/locale/index.tsx` |
| `useLocale` 的合并 | `components/locale/useLocale.ts` |
| context + `LocaleProvider`（已废弃） | `components/locale/context.ts` / `index.tsx` |
| Modal confirm 的模块级 locale | `components/modal/locale.ts` |

---

## 2. 事实来源

**为什么基于 antd 的 `es/` 产物而不是 TS 源码**：

- 产物是**干净 ESM**，只有 4 条 `import`（`es/locale/zh_CN.js` 的第 1-4 行）；
- 源码是 TS，写一个 TS 解析器只为提取对象字面量，收益为零且极易漂移；
- `es/` 是 antd 官方发布的形态，与我们「照抄可观察行为」的立场一致。

三个来源：

| 来源 | 路径 | 用途 |
|---|---|---|
| antd 语言包 | `/tmp/antd-src/package/es/locale/<lang>.js`（73 个） | 主数据 |
| antd 日期分片 | `es/{calendar,date-picker,time-picker}/locale/<lang>.js` | 被语言包 import |
| rc 数据 | `@rc-component/{pagination@1.4.0,picker@1.12.2}/es/locale/<lang>.js` | 被语言包 import |

⚠️ **antd 不 vendor 这两份 rc 数据**：`es/locale/zh_CN.js:1` 就是
`import Pagination from '@rc-component/pagination/locale/zh_CN'`。
语言包引用了 **136 个**不同的 rc locale 说明符（68 个语言 × 2 个包）。
⇒ 生成器必须能拿到它们，见 §5。

---

## 3. antd 的契约（逐条）

### 3.1 语言包的形状（`es/locale/zh_CN.js`）

```js
import Pagination from '@rc-component/pagination/locale/zh_CN';
import Calendar from '../calendar/locale/zh_CN';
import DatePicker from '../date-picker/locale/zh_CN';
import TimePicker from '../time-picker/locale/zh_CN';

const typeTemplate = '${label}不是一个有效的${type}';

const localeValues = {
  locale: 'zh-cn',
  Pagination, DatePicker, TimePicker, Calendar,
  global: { placeholder, close, sortable, show, hide },
  Table: { /* 18 个字段 */ },
  Modal: { okText, cancelText, justOkText },
  Tour: { Next, Previous, Finish },
  Popconfirm: { cancelText, okText },
  Transfer: { titles, searchPlaceholder, itemUnit, itemsUnit, remove, selectCurrent,
              removeCurrent, selectAll, deselectAll, removeAll, selectInvert },
  Upload: { uploading, removeFile, uploadError, previewFile, downloadFile },
  Empty: { description },
  Icon: { icon },
  Text: { edit, copy, copied, expand, collapse },
  Carousel: { prevSlide, nextSlide },
  Form: { optional, defaultValidateMessages: { /* 见 §3.2 */ } },
  QRCode: { expired, refresh, scanned },
  ColorPicker: { presetEmpty, transparent, singleColor, gradientColor },
};
export default localeValues;
```

**只有 4 个分片是 import 来的**（`Pagination` / `DatePicker` / `TimePicker` / `Calendar`），
其余 13 个分片**内联在每个语言包里**。这是生成器的主要工作量：73 × 13 个分片。

⚠️ `locale` 字段是**连字符小写**（`'zh-cn'`），而文件名与 rc 的目录名是**下划线**（`zh_CN`）。
两者不能互推，必须逐包读。

### 3.2 `typeTemplate` 是一个包级局部量

```js
const typeTemplate = '${label}不是一个有效的${type}';
// 然后 Form.defaultValidateMessages.types 的 13 个键**全部指向它**
types: { string: typeTemplate, method: typeTemplate, array: typeTemplate, object: typeTemplate,
         number: typeTemplate, date: typeTemplate, boolean: typeTemplate, integer: typeTemplate,
         float: typeTemplate, regexp: typeTemplate, email: typeTemplate, url: typeTemplate,
         hex: typeTemplate }
```

⇒ 序列化时**不能**把共享引用展开成 13 份字面量（那会让产物与上游对不上，
也让「改一处」变成改十三处）。生成器要识别同一个对象引用并抽成局部常量。

### 3.3 依赖链

```
locale/<lang>              →  rc/pagination/locale/<lang>
                              + calendar/locale/<lang>
                              + date-picker/locale/<lang>
                              + time-picker/locale/<lang>
calendar/locale/<lang>     →  date-picker/locale/<lang>        （原样再导出）
date-picker/locale/<lang>  →  rc/picker/locale/<lang>
                              + time-picker/locale/<lang>
time-picker/locale/<lang>  →  （纯内联，无外部依赖）
```

`date-picker` 那层有一处**顺序敏感**的写法：

```js
lang: {
  placeholder: '请选择日期', yearPlaceholder: …, …,
  ...CalendarLocale,          // ← rc 的 picker locale 在后
},
locale.lang.ok = '确定';       // ← 再补一个 ok
```

⚠️ 上游注释写的是「should add whitespace between char in Button」——
所以 `ok` 是在展开**之后**单独赋值的，不是写在字面量里。生成器要保留这个求值顺序。

### 3.4 `Locale` 类型（`es/locale/index.d.ts`）

```ts
export interface Locale {
  locale: string;
  Pagination?: PaginationLocale;
  DatePicker?: DatePickerLocale;
  TimePicker?: Record<string, any>;
  Calendar?: Record<string, any>;
  Table?: TableLocale;
  Modal?: ModalLocale;
  Tour?: TourLocale;
  Popconfirm?: PopconfirmLocale;
  Transfer?: TransferLocale;
  Select?: Record<string, any>;
  Upload?: UploadLocale;
  Empty?: TransferLocaleForEmpty;
  global?: { placeholder?; close?; sortable?; show?; hide? };
  Icon?: Record<string, any>;
  Text?: { edit?; copy?; copied?; expand?; collapse? };
  Form?: { optional?: string; defaultValidateMessages: ValidateMessages };
  QRCode?: { expired?; refresh?; scanned? };
  Carousel?: { prevSlide: string; nextSlide: string };
  ColorPicker?: { presetEmpty: string; transparent: string; singleColor: string; gradientColor: string };
}
```

**17 个键**，其中 `locale` 是**必填**、其余全部可选。

⚠️ `Select` 在类型里存在，但**73 个语言包一个都没有 `Select` 分片** ——
它是给 `ConfigProvider` 的消费方留的口子。生成器不得「因为没人用就删掉」。

⚠️ `Carousel` / `ColorPicker` 的子字段是**必填**（不是可选），与其它分片不同。照抄。

### 3.5 `useLocale` 的合并（`useLocale.ts`）

```js
const useLocale = (componentName, defaultLocale) => {
  const fullLocale = useContext(LocaleContext);
  const getLocale = useMemo(() => {
    const locale = defaultLocale || defaultLocaleData[componentName];   // defaultLocaleData = en_US
    const localeFromContext = fullLocale?.[componentName] ?? {};
    return { ...(isFunction(locale) ? locale() : locale), ...(localeFromContext || {}) };
  }, [componentName, defaultLocale, fullLocale]);
  const getLocaleCode = useMemo(() => {
    const localeCode = fullLocale?.locale;
    if (fullLocale?.exist && !localeCode) return defaultLocaleData.locale;   // 'en'
    return localeCode;
  }, [fullLocale]);
  return [getLocale, getLocaleCode];
};
```

四条必须照抄的判据：

1. **`defaultLocale` 可以是函数**（`isFunction(locale) ? locale() : locale`）——
   惰性求值，避免每个组件都构造一份对象。
2. **合并是「分片级」的浅合并，且 context 侧赢**（`{...default, ...context}`）。
   两条后果要分清：
   - context 只给了一个**兄弟字段**（如 `Modal.okText`）⇒ 其余兄弟字段**保留默认值**；
   - 分片里的**嵌套对象只能整体给出**：想改 `Form.defaultValidateMessages.required`
     就必须把整份 `defaultValidateMessages` 都写出来，否则默认的那 10 个键**不会**补进来。
   **这是上游的真实行为，别「顺手修」成深合并。**
3. **`exist` 标志**：`LocaleProvider` 会把 `exist: true` 混进 context 值。
   它的唯一用途是「用了 Provider 但没给 `locale` 字段」时回退到 `'en'`。
   直接消费 `useLocale` 而不经 Provider 时 `fullLocale` 是 `undefined`，`exist` 不存在。
4. 返回的是 `[getLocale, getLocaleCode]`，名字里的 `get` 是**误导性的** ——
   两个值都已经求好了，不是函数。

### 3.6 `LocaleProvider` 已废弃（`index.js:9-14`）

```js
warning(_ANT_MARK__ === ANT_MARK, 'deprecated',
  '`LocaleProvider` is deprecated. Please use `locale` with `ConfigProvider` instead: …');
export const ANT_MARK = 'internalMark';
```

- `_ANT_MARK__` 必须等于 `'internalMark'` 才**不**告警 —— 即调用方只能从
  `antd/locale` 里拿默认导出的那个组件来用。
- 它在 `useEffect` 里调 `changeConfirmLocale(locale?.Modal)` 并在卸载时清理。

### 3.7 `changeConfirmLocale` 的模块级可变状态（`modal/locale.ts`）

```js
let runtimeLocale = { ...defaultLocale.Modal };
let localeList = [];
const generateLocale = () => localeList.reduce((m, l) => ({ ...m, ...l }), defaultLocale.Modal);

export function changeConfirmLocale(newLocale) {
  if (newLocale) {
    const cloneLocale = { ...newLocale };
    localeList.push(cloneLocale);
    runtimeLocale = generateLocale();
    return () => { localeList = localeList.filter(l => l !== cloneLocale); runtimeLocale = generateLocale(); };
  }
  runtimeLocale = { ...defaultLocale.Modal };
}
export function getConfirmLocale() { return runtimeLocale; }
```

⭐ 这是一个**栈式**（不是覆盖式）的模块级状态：多个 Provider 同时存在时，
后注册的在上面；**卸载时按注册顺序逐个弹出**，每次都从头 `reduce` 重建。

⚠️ 它属于 Modal 的运行时（`Modal.confirm` 读 `getConfirmLocale()`），
但数据源是本包的 `en_US.Modal`。**本包只提供数据与这个栈**，不实现 Modal。

---

## 4. 边界

| 做 | 不做（`notDo`） |
|---|---|
| 73 个语言包的数据 | ❌ **不做运行时语言切换**（那是 `ConfigProvider` 的 `locale` prop 的职责） |
| `Locale` 类型 | ❌ 不含任何组件实现 |
| `useLocale` 的合并语义 + context | ❌ 不手工编辑生成产物 —— 改源头或改生成脚本 |
| `changeConfirmLocale` 的栈 | ❌ 不实现 Modal / ConfigProvider 本身 |

依赖：**无**（`dependsOn: []`）。纯数据 + 一段不依赖 Vue 的合并逻辑 + 一个 context。

⚠️ 这是本仓库**唯一一个零依赖的 foundation 包**。`useLocale` 需要 context，
所以它确实需要 `vue`（peer），但不需要 `@apollo-design/utils`。

---

## 5. ⭐ 生成管线设计

### 5.1 为什么需要一个「迷你模块求值器」

语言包不是纯 JSON：它 import 了 4 个分片，其中 2 个来自 rc 包。
朴素做法是写正则去抠对象字面量 —— 会被模板字符串（`'${label}不是一个有效的${type}'`）、
嵌套对象、共享引用（`typeTemplate`）同时击穿。

**本包的做法**：把三个来源的 ESM 文件按原样读进来，
把 `import` 说明符重写成指向本地文件的相对路径，写进一个临时目录，
然后 `await import()` 求值，拿到**真实的 JS 对象**再序列化成我们的 TS。

好处：求值语义与浏览器一致（展开顺序、共享引用、计算属性全都自然正确），
不用实现任何 JS 解析器。代价是要维护一个小的「说明符 → 本地路径」映射。

### 5.2 rc 数据的来源：**固化 + 溯源**，不在生成时联网

`@rc-component/pagination` 与 `@rc-component/picker` **不在本仓库的依赖图里**
（本包 `dependsOn: []`），而 `pnpm install` 在本沙箱会挂起（`PITFALLS.md` 第 7 条）。

⇒ 分两条命令：

| 命令 | 作用 | 何时跑 |
|---|---|---|
| `node registry/tools/gen-locale.mjs --sync-rc` | 从 npm 拉取**锁定版本**的 rc locale，固化到 `registry/source/locale-rc/`，并写 `provenance.json`（包名 + 版本 + 每个文件的 sha256） | 升级 rc 版本时手工跑一次 |
| `node registry/tools/gen-locale.mjs` | **只读固化副本**，生成 `packages/locale/src/` | 日常 / 门禁 |
| `node registry/tools/gen-locale.mjs --check` | 只比对不写入 | 门禁 |

⭐ 这样生成是**离线确定**的：`--check` 不需要网络，产物可复现，
且「这份数据来自哪个版本的哪个包」有据可查（`provenance.json`）。
这与 `gen-icons.mjs` 从 `node_modules` 解析 `@ant-design/icons-svg` 是同一思路，
只是本包没有那个依赖，所以改成固化。

### 5.3 产物

```
packages/locale/src/
  types.ts              # Locale 与各分片的类型（手写，与 antd 的 .d.ts 对齐）
  context.ts            # LocaleContext（手写）
  use-locale.ts         # useLocale 的合并（手写）
  confirm-locale.ts     # changeConfirmLocale 的栈（手写）
  locale-provider.ts    # LocaleProvider（手写，含 deprecated 告警）
  locales/<lang>.ts     # 73 个语言包（**生成**）
  locales/index.ts      # 汇总再导出（**生成**）
  index.ts              # 包的公开入口（手写）
```

生成物统一带文件头：

```ts
// 本文件由 registry/tools/gen-locale.mjs 生成，请勿手工修改。
// 源：antd 6.6.4 的 es/locale/zh_CN.js
// 重新生成：node registry/tools/gen-locale.mjs
```

### 5.4 序列化时要保住的三件事

1. **共享引用**：`typeTemplate` 抽成局部常量，13 个 `types.*` 指向它（§3.2）。
2. **键顺序**：按源对象的插入顺序输出 —— 否则每次重新生成的 diff 都会很大。
3. **字符串转义**：模板串里有 `${label}` 与单引号，必须原样保留（用单引号包裹、
   只转义 `'` 与 `\`），**不能**当成模板字符串处理。

---

## 6. API 设计

| 导出 | 出处 | 说明 |
|---|---|---|
| `Locale` / `LocaleComponentName` | `index.d.ts` | 类型；`LocaleComponentName = Exclude<keyof Locale, 'locale'>` |
| `useLocale(name, defaultLocale?)` | `useLocale.ts` | 返回 `[locale, localeCode]`（都是**值**，不是函数） |
| `LocaleContext` | `context.ts` | Vue 的 `InjectionKey`，默认 `undefined` |
| `LocaleProvider` | `index.tsx` | 组件；已废弃，`_ANT_MARK__` 必须等于 `ANT_MARK` |
| `ANT_MARK` | `index.tsx` | `'internalMark'` |
| `changeConfirmLocale` / `getConfirmLocale` | `modal/locale.ts` | 栈式模块级状态 |
| `defaultLocale` | `en_US` | 兜底数据（`useLocale` 的 `defaultLocaleData`） |
| 73 个语言包 | `locales/<lang>.ts` | 每个都从 `index.ts` 具名导出（`zhCN` / `enUS` …） |

### 6.1 语言包的导出名规则

antd 的 `es/locale/index.js` 用的是 `zh_CN` 这种**下划线**名：
`export { default as zh_CN } from './zh_CN'`。

⚠️ 下划线在 JS 里合法，但**不符合本仓库其它包的命名习惯**（icons 用 `PascalCase`）。
这里**保留 `zh_CN` 原名**，理由：消费方从 `antd/locale/zh_CN` 迁移过来时是
`import zhCN from 'antd/locale/zh_CN'`，保留原名能把迁移成本降到「只改包名」。
在契约文档里登记为有意选择，而不是随手起的名字。

---

## 7. 测试策略

| 层 | 内容 | 状态 |
|---|---|---|
| L1 | **73 个语言包逐字段与 antd 源比对**（oracle 是求值快照）；`useLocale` 的合并与 `localeCode` 的四条分支；`changeConfirmLocale` 的栈语义（含「同键时后注册的赢」） | ✅ done |
| L2 | jsdom：`LocaleProvider` 的注入与卸载清理、`_ANT_MARK__` 的告警方向与去重、渲染的是 children | ✅ done |
| L3 | `locale.test-d.ts`（含 12 条负例） | ✅ done |
| L4 | n/a —— 本包不产出 DOM（`LocaleProvider` 只提供 context，渲染的是 children） | n/a |
| L5 | n/a —— 无 a11y 语义 | n/a |
| L6 | n/a —— 零视觉产物 | n/a |
| L7 | `tests/build/run.mjs --package locale` | ✅ done |
| **生成器** | provenance 完整性与 sha256 对账、`--check` 幂等、**改坏产物后 `--check` 能发现** | ✅ done |

实测：**132** unit + **58** 类型断言；覆盖率 **98.11 / 91.66 / 100 / 100**（门槛 95/90/95）。

### 7.1 测试侧的坑

1. **73 个语言包不能靠人眼核对**。必须有「与 antd 源逐字段比对」的自动化：
   生成器输出一份**求值快照**（`tests/compat/baselines/locale.json`，744 KB），
   测试把它与生成产物的运行时值做 `toEqual` 深比较。
2. **`changeConfirmLocale` 是模块级状态，而且无参调用清不干净**（§10.3 的 U 项）
   ⇒ 测试之间必须用 `resetConfirmLocale()`，**不能**用 `changeConfirmLocale()`。
   第一版就是用了后者，导致 5 个用例串台。
3. ⭐ **`inject` 只沿父链解析** —— 组件拿不到自己在同一个 `setup` 里 `provide` 的东西。
   测试 helper 必须「父组件 provide + 子组件 inject」。第一版把两者写在同一个 setup 里，
   于是 5 个用例全绿不了。
4. **`useLocale` 内部 `inject`** ⇒ 在组件外调用会告警。类型测试里要包进 `neverCalled`。
5. ⭐ **调用生成器的测试要显式给 `timeout`** —— 建临时树 + 求值 73 个模块 + 序列化
   要好几秒，远超 vitest 默认的 5s。
6. ⭐ **`--check` 不能有任何写操作**（连基线也不写）—— 第一版把写快照放在了 check 分支之前，
   「检查」会改仓库。

### 7.2 变异验证（确认断言不是「永远绿」）

本轮实际跑了 **10 处**变异，全部被抓：

| 变异 | 结果 |
|---|---|
| `useLocale` 的合并方向反过来（context 输给默认） | ✅ 失败 |
| `useLocale` 去掉 `exist` 的 `'en'` 回退 | ✅ 失败 |
| `useLocale` 的 `exist` 判断去掉 `!localeCode` | ✅ 失败 |
| `changeConfirmLocale` 用 `unshift`（栈序反了） | ✅ 失败 |
| `changeConfirmLocale` 入栈不 clone | ✅ 失败 |
| `generateLocale` 的初值不是 `defaultLocale.Modal` | ✅ 失败 |
| `changeConfirmLocale` 无参分支不重置 `runtimeLocale` | ✅ 失败 |
| `LocaleProvider` 的告警条件写反 | ✅ 失败 |
| `LocaleProvider` 不注入 `exist` | ✅ 失败 |
| `LocaleProvider` 卸载时不清理 confirm locale | ✅ 失败 |

⚠️ 写脚本时踩过一次：**两处变异改同一行**会导致第二处 `from` 匹配不上（静默跳过）。
跑完必须看脚本输出的 `SKIPPED` 列表，不能只看「全绿」。

---

## 8. 待裁决

### P1 · `Select` 分片要不要补

`Locale` 类型里有 `Select`，但 **73 个语言包一个都没有**。
本包照抄（不补），因为补了就是与上游漂移。若将来 Select 组件真的需要，
应在 `ConfigProvider` 侧给出默认值，而不是改这 73 个包。

### P2 · `LocaleProvider` 要不要在 Vue 侧也标 deprecated

上游会打 dev 告警。Vue 侧保留同样的告警是忠实的；但它会让「照抄 antd 写法」的
使用者每次启动都被刷屏。倾向**保留**（与上游一致），并在文档里写明替代方案。

---

## 9. 这个包**没有**证明什么

1. **没有证明 73 个语言包的译文本身正确** —— 我们只保证「与 antd 6.6.4 逐字段一致」。
   译文对不对是上游的事。
2. **没有证明生成器能处理上游未来的形状变化** —— 它假设语言包只有 §3.1 那 4 个 import。
   上游若引入第 5 个分片，生成器会**报错**（而不是静默漏掉），但需要人回来改映射。
3. **没有证明 `useLocale` 的浅合并是「对」的** —— 它只是**与上游一致**。
   §3.5 第 2 条那个「只给一个字段会丢掉其余字段」的行为看起来像 bug，
   但它是可观察行为，本包不复刻就与上游分叉。
4. **没有证明 rc 数据的固化副本与「装 rc 包」等价** —— 我们从 npm 拉的是
   `es/locale/*.js` 的**原样文件**并记录了 sha256，但没有跑过 rc 包自己的测试。
5. **没有证明 `changeConfirmLocale` 的多 Provider 嵌套顺序** ——
   栈的语义是从源码读出来的，没有真实的多 Provider 场景验证（要等 Modal 落地）。
6. **没有证明 `Select` 分片的缺失是无害的** —— §8 P1。
7. ⚠️ **没有证明单文件产物下的 tree-shaking 真的能摇掉未用的语言包** ——
   `build-output-contract` 裁决 A 是单文件 `dist/index.mjs`，73 个语言包都在同一个模块里。
   声明了 `sideEffects: false`、且每个语言包都是无副作用的顶层常量，理论上能摇，
   但**没有实测打包产物体积**。**这是接手时最该先确认的一条**。
8. **没有证明生成器在「上游新增第 5 个分片」时给出的是有用的错误** ——
   它会对未知的 import 说明符抛错（§9 第 2 条），但没有真实演练过。

---

## 10. 与上游的有意差异（要登记 `COMPATIBILITY.md`）

### 10.1 语言包数量是 73，不是 75

早期 registry 的 `purpose` 写的是「75 个语言包」。**实测 antd 6.6.4 的源码与产物都是 73**
（`components/locale/*.ts` 去掉 `index` / `context` / `useLocale` 之后）。
已改正模板，产物 73 个。

### 10.2 两处「类型诚实化」

上游的 `.d.ts` 有两处声明与运行时不符，本包按真实情况声明：

| 位置 | 上游声明 | 实际 | 本包 |
|---|---|---|---|
| `useLocale` 的 `localeCode` | `string` | 没挂 Provider 时是 `undefined` | `string \| undefined` |
| `PickerLangLocale` 的多数字段 | 必填（`RcPickerLocale`） | **逐语言不同**（如 `weekSelect` 只有 33/73 有） | 按实测标为可选 |

第二条是**必需**的：照抄 `.d.ts` 会让 73 个语言包里的绝大多数类型报错。
字段的出现次数是从固化数据里逐包统计出来的（见 §3.4 的注释）。

### 10.3 ⚠️ 跟随的上游缺陷（U 项）：`changeConfirmLocale()` 无参不清栈

上游 `modal/locale.ts` 的无参分支只重置 `runtimeLocale`，**不动 `localeList`**。
后果是「重置」并不彻底：之后再注册任何一层，`generateLocale()` 会把之前留在栈里的
那些**重新叠加回来**；而且栈会随挂载/卸载单调增长。

我们**照抄**（否则与上游分叉），只额外导出一个测试专用的 `resetConfirmLocale()`。
登记到 `COMPATIBILITY.md` §9.2.1 的 U 项。

### 10.4 没有子路径入口

antd 的用法是 `import zhCN from 'antd/locale/zh_CN'`。本仓库
`build-output-contract` 裁决 A 是**单文件产物**，没有子路径入口 ⇒ 只能具名导入：
`import { zh_CN } from '@apollo-design/locale'`。

导出名**保留 `zh_CN` 这种下划线原名**（不用 PascalCase），把迁移成本压到「只改包名」。
⚠️ 但这条与 §9 第 7 条相关：单文件产物下未用的语言包能否被摇掉，**尚未实测**。

### 10.5 不引 `@apollo-design/utils` 的告警

本包是仓库里**唯一一个 `dependsOn` 为空的 foundation 包**（纯数据 + 一小段不依赖 utils 的逻辑）。
`LocaleProvider` 的废弃告警因此用了一个 10 行的本地实现：
格式与 utils 的 `devUseWarning` 对齐（`Warning: [apollo: LocaleProvider] ...`）、
生产环境不打、同一句话只打一次（模块级 `Set` 去重）。

代价是**没有 `ConfigProvider` 的 `WarningContext` 支持**（那是 utils 的能力）。
这是刻意的取舍：用一致性换零依赖。若将来发现需要统一告警通道，再引 utils。
