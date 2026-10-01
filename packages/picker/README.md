# @apollo-design/picker

> **层**：L2 ｜ **风险**：high ｜ **Phase 2 实施顺序**：13
>
> 本文档声明本包的**职责边界**。边界之外的事情不做 —— 如果发现需要做，说明架构需要调整，
> 应当先修改 `ARCHITECTURE.md` 并记录 ADR。

---

## 职责

日期/时间面板引擎。替代 @rc-component/picker。

## 替代的 Ant Design 依赖

- `@rc-component/picker`

## 公开 API

- Picker 基础组件（面板渲染 + 选择状态机）
- 面板：DatePanel / WeekPanel / MonthPanel / QuarterPanel / YearPanel / TimePanel
- RangePicker 状态机
- locale 适配层（与 @apollo-design/ui/locale 对接）

## 明确不做（边界）

- ❌ 不实现输入框（那是 ui 的 DatePicker 与 Input）
- ❌ 不重新实现日期数学（复用 dayjs）

## 必须遵守的契约

- 面板切换（日/周/月/季/年）的交互与 antd 一致
- 区间选择的边界行为（起止互换、hover 预览、二次点击）与 antd 一致
- 键盘导航（方向键 / PageUp / PageDown / Home / End）与 antd 一致
- disabledDate / disabledTime / showTime 的语义与 antd 一致

## 依赖

### 运行时依赖

| `@apollo-design/utils` | `workspace:*` |

### peer 依赖

| `vue` | `catalog:` |
| `dayjs` | `catalog:` |

### 构建期 / 测试依赖（devDependencies，**不会**进入用户的依赖树）

（无）

## 依赖约束（ARCHITECTURE.md §3.1）

- **R1 单向**：只能依赖同层或更低层
- **R2 无环**：不得与其他包循环依赖
- **R3 地基纯净**（仅 L0）：不得包含任何组件视觉语义
- **R4 引擎无视觉**（仅 L2）：不得定义颜色/圆角/阴影，不得产出 CSS
- **R6 显式声明**：跨包导入必须在本文件的 `dependencies` 中声明（`.npmrc` 已设 `hoist=false`）
- **R7 零 Ant Design 运行时依赖**：发布包的 `dependencies` 不得出现任何 `@ant-design/*`。
  Ant Design 生态包只允许出现在三处 —— ① 构建期数据源（`registry/tools/gen-*.mjs`）
  ② 测试 Oracle（`*.oracle.test.ts`）③ `devDependencies`。由 `registry:validate` 的 **E19** 强制。

本包的依赖已通过 `registry/tools/scaffold-packages.mjs` 的分层校验。

## Phase 2 范围说明

Phase 2 只需确定接口契约，实现可延后到 DatePicker 开发前

## 测试

```bash
pnpm --filter @apollo-design/picker test
pnpm --filter @apollo-design/picker lint
```

测试要求见 [`TESTING.md`](../../TESTING.md)。
覆盖率下限为 语句 95% / 分支 90% / 函数 95%（L2 档位，见 `vitest.config.ts` 的 `coverage.thresholds`）。


---

# 实现说明（收口记录 · 2026-09-30）

> 契约文档：`docs/foundation/picker-contract.md`。
> **裁决**：`picker-panel-ownership` = **B**（面板 Vue 组件落在本包）
> ⇒ 本包 = **纯函数引擎 + 面板组件**，但 **R4 的约束不变：面板不产 CSS**。
> 类名结构与上游逐字一致（由 L4 钉住），样式仍由 `ui` 层负责。

## 1. 对应上游

| 上游 | 版本 | 本包对应物 |
|---|---|---|
| `es/utils/*`、`es/generate/dayjs.js` | 1.12.2 | `date-util` / `misc-util` / `generate/dayjs` / `time-util`（**oracle 逐位对拍**） |
| `es/PickerPanel/**`（七面板 + `PanelHeader` + `PanelBody`） | 1.12.2 | `date-panel` / `upper-panels` / `panel-header` / `panel-body` / `time-panel*` / `time-column` |
| `es/hooks/{useLocale,useTimeConfig,useTimeInfo,useToggleDates}` | 1.12.2 | `locale-fill` / `time-config` / `time-units` / `toggle-dates`（**纯函数化**） |
| `es/PickerInput/**`（输入框 / mask / 浮层） | — | ❌ **不做**（本文件 `notDo` 第 1 条） |

**Oracle 的两档判据**（契约 §2.1）：

- **可对拍**：文件**整条 import 链**零 React 耦合 ⇒ 上游 `es/` 产物逐字固化在
  `oracle/upstream/`（sha256 见 `provenance.json`），测试 import 它做逐位差分。
  现有 4 个：`dateUtil` / `miscUtil` / `generate-dayjs` / `timePanelUtil`。
- **不可对拍**：面板组件与其 hooks（`import * as React` 或依赖 React hooks）
  ⇒ **读源码作规格** + 行为测试（L1/L2）+ **DOM 契约**（L4，打上游的 SSR 产物）。
  ⚠️ 判据是「整条 import 链」，不是「这个文件有没有写 `from 'react''」——
  `useOpen` / `useDisabledBoundary` 等不 import react，但依赖 `@rc-component/util`
  的 `useEvent`，仍是 React hooks。

## 2. 文件结构

```
src/
├── types.ts / generate/dayjs.ts / date-util.ts / misc-util.ts / time-util.ts   # 纯函数 + oracle
├── panel.ts                     # 面板几何 + 格子状态（无 oracle）
├── range.ts / keyboard.ts       # 区间判定 / mask 数值（无 oracle）
├── locale-fill.ts               # fillTimeFormat / fillLocale
├── time-config.ts               # getTimeProps / fillShowTimeConfig
├── time-units.ts                # 档位表 + getTimeInfo
├── time-tmpl.ts                 # 模板日期 / 改值 / 最近格 / 上下午列
├── panel-header-limit.ts        # 四个上层面板的粒度与越界判定
├── toggle-dates.ts              # 多选 toggle
│   ── 面板组件层（裁决 B 之后新增）──
├── panel-context.ts             # 三组 provide/inject（`PanelDateType` = Dayjs）
├── panel-props.ts               # 共用 props + 「由 props 建 info 并 provide」
├── panel-header.ts              # 四个方向键 + 标题槽
├── panel-body.ts                # rowNum × colNum 表格
├── date-panel.ts                # DatePanel + WeekPanel
├── upper-panels.ts              # Month / Quarter / Year / Decade（工厂）
├── time-column.ts               # 一列时间档位（含滚动对齐）
├── time-panel-body.ts           # 2–5 列 + 列间依赖
├── time-panel.ts                # TimePanel + DateTimePanel
└── picker-panel.ts              # 外壳：模式 / 值 / 浏览值 / 时间配置归一
```

**为什么几何几乎全在纯函数里**：① 边界多（三区间不对称、两个哨兵、四面板四套粒度），
纯函数能让 L1 穷举；② jsdom 的 `offsetTop` / `getBoundingClientRect` 恒 0，
几何混进组件就等于放弃测试。

## 3. 与上游的差异

### 3.1 结构性（不是行为差异）

| # | 差异 | 说明 |
|---|---|---|
| 1 | `DateType` 泛型只保留在**纯函数层** | 组件层直接落在 `Dayjs` 上 —— Vue 的 `provide`/`inject` 与 `defineComponent` 的 props 都无法携带类型参数；用 `never` 占位会让 prop 值类型变成 `never`（一个参数都传不进来） |
| 2 | `useInfo(props, type)` → `providePanelInfoFromProps` **返回** computed | 上游从 props 现算 `info` 并给子树；本仓照抄数据流，但**面板自己要用返回值** —— `inject` 读 `parent.provides`，自己 provide 的东西自己 inject 不到 |
| 3 | `PanelBody` 的格子状态由 `buildPanelCells` 一次算出 | 上游写在 JSX 里；本仓前置成纯函数，组件只做「状态位 → DOM」映射 |
| 4 | `TimeColumn` 去掉 `isVisible(ul)` 守卫 | `isVisible` 属 `ui` 层（需真实布局）；差异只在「列被隐藏时是否空转 rAF」 |
| 5 | 无 provider 时 `usePanelInfo()` **渲染期抛错**（带组件栈） | 上游会 `TypeError`。**有意偏离**，面板是唯一调用方 |

### 3.2 跟随上游、但容易被误判为 bug 的行为

| 项 | 上游行为（本包照抄） |
|---|---|
| `-show-week` 类名 | 用**原始 `showWeek`**；`showPrefixColumn` 只管周号列。差别只在 `mode="week"` 且未传 `showWeek` 时 |
| 季面板 `disabledDate` | **不做**「整季合并」（直接透传 props）。月 / 年 / 十年**做**合并 |
| `getRowFormat('datetime')` | 返回 `fieldDateTimeFormat`（**独立分支**，不是 `default` 的 `fieldDateFormat`） |
| `showMeridiem` 推导 | 显式 `use12Hours` **优先**于格式串里的 `a`/`A`（`show ?? …` 的 `??` 语义） |
| 面板格子的时分秒 | **保留 `pickerValue` 的时分秒**（`setDate` 不动 h/m/s）。antd 选出来是 `00:00:00` 是**上层** `fillTime` 归零的 |
| 面板的 ARIA | **零 role**（无 `role=grid` / `aria-selected`）；可访问名全靠 `locale` 文案 + `title` |
| 模式变化的对外通知 | 只有 `onPanelChange(viewDate, mode)`；**没有**对外 `onModeChange` prop（那是给面板组件的内部通道） |
| 上层面板格子的「日」 | 月 / 季格保留 `pickerValue` 的**日**（9/30 → `1/30`、`4/30`…），**不**对齐到 1 号 |

## 4. 层与证据

| 层 | 文件 / 命令 | 条数 |
|---|---|---|
| L1 纯函数 + Oracle | `__tests__/{date-util,misc-util,time-util,panel,range,keyboard,panel-pure,index}.test.ts` + `*.oracle.test.ts`（4 个上游文件逐位差分） | — |
| L2 交互 | `__tests__/panel-interaction.test.ts` + `__tests__/panel-edge.test.ts` | **100** |
| L3 类型 | `__tests__/picker.test-d.ts` | — |
| L4 DOM 契约 | `__tests__/semantic.test.ts` ↔ `tests/compat/baselines/picker.dom.json` | **37 / 37 逐字一致** |
| L5 无障碍 | `__tests__/a11y.test.ts` | **30** |
| L6 视觉 | **n/a** —— 面板不产 CSS（R4），视觉归 `ui` 层的 DatePicker | — |
| L7 构建 | `tests/build/run.mjs` | 门禁 |

```bash
# 复跑（2026-09-30）
CODEBUDDY_SAFE_DELETE_ENABLED=0 ./node_modules/.bin/vitest run \
  --project unit --project dom-contract --project a11y packages/picker/src

# 覆盖率（⚠️ 必须带 CODEBUDDY_SAFE_DELETE_ENABLED=0：vitest 会先清 coverage/ 的 93 个文件）
CODEBUDDY_SAFE_DELETE_ENABLED=0 ./node_modules/.bin/vitest run \
  --project unit --coverage --coverage.include='packages/picker/src/**' packages/picker/src
# ⇒ 语句 98.00 / 分支 91.80 / 函数 96.12（阈值 95/90/95 ⇒ met，exit 0）
```

### 4.1 L4 的取数侧为什么是 rc 而不是 antd

antd 的 `DatePicker` 在 **SSR 下不渲染面板**（浮层走 Portal，只在客户端挂）：

```
renderToStaticMarkup(<DatePicker open />)  ⇒  889 字节，inline('picker-panel') === false
                          控制台：Portal only work in client side
```

⇒ 只有上游的 `PickerPanel` 能在 Node 里给出静态面板 DOM。
`@rc-component/picker` 因此进了**根 `devDependencies`**（精确锁 `1.12.2`，R7 允许的测试 Oracle）。
生成器：`node tests/compat/baseline/picker.mjs [--check] [--dump <caseId>]`。

⚠️ 三个坑：① 它的 `exports` 里**没有** `./package.json`（要 `require.resolve` 后读磁盘）；
② `main` 指 `lib/`（CJS）而 `import` 指 `es/`，Node 直连 `es/index.js` 会 `ERR_MODULE_NOT_FOUND`
⇒ 用 `createRequire` 走 CJS 入口；③ 基线的「当前时间」必须冻结（`-cell-today` 取 `getNow()`），
两侧共用 `{ ...dayjsGenerateConfig, getNow: () => dayjs('2026-09-30 10:20:30') }`。

## 5. 实现要点（最容易写错的地方）

1. **`provide` 的上下文，提供者自己 `inject` 不到**（`inject` 读 `parent.provides`）
   ⇒ 面板用 `providePanelInfoFromProps` 的**返回值**，不用 `usePanelInfo()`。
2. 🚨 **`PickerPanel` 的顶层 props 必须显式声明** —— 否则被 Vue 归进 `attrs`，
   而消费方走 `pickProps(props, …)` ⇒ **静默失效**。目前踩到两批：
   - **顶层时间 props**（`use12Hours` / `hourStep` / `disabledHours` / `hideDisabledOptions` /
     `showMillisecond` …）⇒ `getTimeProps` 取不到（2026-09-30）；
   - 🚨 **4 个导航图标**（`prevIcon` / `nextIcon` / `superPrevIcon` / `superNextIcon`）
     ⇒ `PanelHeader` 回退到 `DEFAULT_HEADER_ICONS` 的**字符**（`‹` / `«`），
     `ui` 层传的「空 `<span>` + CSS 画箭头」**永远碰不到面**（2026-10-01）。
   **判据**：凡「从 `props` 上按 key 取值」的键，`defineComponent` 的 props 里必须有；
   `pickProps` 取不到只会**静默跳过**，不报错。
3. 🚨 **`triggerChange` 要先取快照再写**：`mergedValue` 是 `computed`（活读），
   写完再比较会让「变了吗」恒为假 ⇒ **非受控路径 `onChange` 永不触发**。
   （React 里 `mergedValue` 是闭包常量，所以上游那样写是对的。）
4. **`defineComponent` 的 props 里 `required: true` 要写 `as const`**，否则 TS 推成
   `boolean`、`ExtractPropTypes` 判不出必填 ⇒ 该 prop 变成 `X | undefined`。
5. **`h(tag, props, child)` 的 child 用数组形态**（`VNodeChild` 含 `null`，不满足 `RawChildren`）。
6. **`-show-week` 用原始 `showWeek`**；`showPrefixColumn` 只管周号列。
7. **季面板不做 `disabledDate` 合并**；月 / 年 / 十年做（且十年按 **10 年**片段，不是 100 年）。
8. **面板 / 季格保留 `pickerValue` 的「日」** ⇒ 写 `disabledDate` 判据时优先看月份。
9. **四个上层面板的 `offset` / `superOffset` / `getStart` / `getEnd` 不能互相类推**
   （day 面板有 `setDate(…, 1)`，month / quarter 是裸 `setMonth`）。见 §6 的粒度表。
10. **`watch(…, { immediate: true })` 在 `setup()` 就同步跑一次**，那时 `ref` 还是 `null`
    ⇒ `TimeColumn` 的滚动对齐拿不到 `<ul>`。需要「DOM 就绪后那一次」时必须另找触发点。
11. **`TimeColumn` 的 rAF 链**：`doScroll` 是**同步**调用的；`targetLi === firstLi` 时必须
    直接 `return`（否则 jsdom 下永不收敛）；「距离变大」要立刻停（用户手动滚）。
12. **`changeOnScroll`** 在停止 300ms 后提交「离滚动位置最近且**未被禁用**」的格。

## 6. 六个面板的粒度表（`panel-header-limit.ts` 一处一表）

| 面板 | `offset`（一格） | `superOffset`（一屏） | `getStart` | `getEnd` |
|---|---|---|---|---|
| date / week | `addMonth` | `addYear` | `setDate(…, 1)` | 下月 1 号 − 1 天 |
| month / quarter | **无** | `addYear` | `setMonth(…, 0)`（**不动日**） | `setMonth(…, 11)` |
| year | **无** | `addYear(× 10)` | `floor(y/10)*10` | `+9 年` |
| decade | **无** | `addYear(× 100)` | `floor(y/100)*100` | `+99 年` |

⚠️ `getHeaderDisabled` 里 `isSameOrAfter` 的**实参顺序两侧相反**
（prev 侧：`getEnd(前一个)` vs `minDate`；next 侧：`maxDate` vs `getStart(后一个)`），
且**起点判据用 `getEnd`、终点判据用 `getStart`** —— 照抄，不是笔误。

## 7. 收口（2026-09-30）时修掉的**真 bug**

| # | 症状 | 根因 |
|---|---|---|
| 1 | 时间面板少一列（12 小时制没上下午列）；`hourStep` / `disabledHours` / `hideDisabledOptions` 全不生效 | `PickerPanel` **少声明顶层时间 props** ⇒ 被 Vue 归进 `attrs`、`pickProps` 取不到 ⇒ **静默失效**（L4 的 5 条 time 用例同时红） |
| 2 | **全部 37 条 L4 用例红** | 面板用 `usePanelInfo()` 读**自己**的上下文 ⇒ `inject` 读 `parent.provides`，拿不到。改用 `providePanelInfoFromProps` 的返回值 |
| 3 | 周面板多一个 `-show-week` 类 | 类名开关写成了 `showPrefixColumn`（上游用**原始 `showWeek`**） |
| 4 | **非受控模式下 `onChange` 永不触发**（受控一切正常） | `triggerChange` 的 `mergedValue` 是 `computed` 活读，写完立刻返回新值 ⇒ 「变了吗」恒为假。上游是 React 闭包快照 |
| 5 | `getRowFormat('datetime')` 走上游的 `default` 分支 | 纯函数层把入参收窄成 `PickerMode` 时，把上游的 `case 'datetime'` **静默删除**了 |
| 6 | **表头四个导航箭头变成细字形的 Unicode 字符**（`‹` `«` `›` `»`），而不是 CSS 画的 1.5px 折线 | `PickerPanel` **少声明 4 个图标 props** ⇒ 被归进 `attrs` ⇒ `pickProps` 取不到 ⇒ `PanelHeader` 回退字符兜底（2026-10-01，由 L6 像素差 + 表头探针定位）。→ PITFALLS 250 |

另修 `__tests__/index.test.ts` 的两条**过时断言**：原断言「本包不导出任何 Vue 组件」
依赖「面板属 `ui`」这个**当时未裁决的暂定方向**（`AGENTS.md` §4.2 第 3 条：测试本身写错）
⇒ 改为按「纯函数内核 / 面板层 / 注入键」三组**分别**钉死，并新增「面板层不产样式」
与「纯函数组里一个组件都没有」两条反向哨兵。**断言变严，不是放宽。**

## 8. 已知缺口（如实登记）

1. **时间列的滚动对齐在 jsdom 下只到「自己造布局」这一步。**
   `panel-edge.test.ts` 用 `Object.defineProperty` 造出 `offsetTop` / `scrollTop`，
   覆盖了「逐帧收敛到目标格」「距离变大立刻停」「最近一格」「禁用格让位」「全禁用不提交」
   「对齐中不提交」六条。但**真实浏览器里的像素结果**只有 `ui` 层的 L6 能测（本包 L6 判 `n/a`）。
2. **`setMergedMode` 的「非受控」分支在当前 API 下不可达。**
   需要同时满足「`mode` 未受控」与「`mergedMode !== picker`」，而 `mode` 不传时
   `innerMode` 的初值就是 `picker` ⇒ 两者互斥。已在 `panel-edge.test.ts` 写明理由，
   **没有**为凑覆盖率硬造假测试。
3. **`changeOnScroll` 的「最近一格」在 jsdom 下只验「回调被调用 + 参数由 L1 穷举」**
   （真实 `offsetTop` 需要布局；L1 的 `getNearestUnitIndex` 已穷举边界）。
4. **对齐上游 `PickerInput`（输入框 / mask / 浮层）不在本包边界内**（`notDo` 第 1 条）。
   `keyboard.ts` 只出 `getMaskRange` / `offsetCellValue` 两个**纯数值**函数。
5. **`@apollo-design/locale` 尚未接入**（`ui` 层的联调事项）：本包的 `PickerLocale`
   只声明自己真正会读的键，`ui` 层负责把 locale 数据喂进来。
