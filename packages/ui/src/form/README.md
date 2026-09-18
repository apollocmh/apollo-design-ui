# `form`（骨架）

> ⚠️⚠️ **本目录是骨架，不是实现。**
> 它存在的唯一理由写在 `registry/foundation.json` 的 `doneWhen` 里：
>
> > 批次③ 开工前先有 ui/src/form 骨架（否则 API 形状无从校验）

---

## 骨架范围

| 做了 | 没做（全部是 TODO） |
|---|---|
| props / emits / slots 的**类型面**（`interface.ts`） | 接入 `@apollo-design/form-core` 的 `useForm` / `Form` / `Field` / `List` |
| 容器元素的结构外壳 + 基础类名（规则 R6） | 校验状态、错误展示、`help` / `extra` / `hasFeedback` |
| 消费 form-core 批次③ 的类型（`FieldProps` / `FormInstance` / `FormProps` / `ListProps`） | `label` / `labelCol` / `wrapperCol` / `colon` / `requiredMark` 布局 |
| `noStyle` 分支的存在性 | `aria-describedby` / `aria-invalid` / `aria-required` / `fieldId` |
| —— | Component Token、CSS、demo、文档、7 层测试、视觉回归 |

⚠️ **因此 `registry/components.json` 里 `form` 的任何维度都不得置 `done`。**
骨架不是「部分完成」，它是**契约的可编译形态**。

## 为什么骨架有价值

`interface.ts` 从 `@apollo-design/form-core` import 了 `FieldProps` / `FormInstance` /
`FormProps` / `ListProps` / `StoreValue`，并把它们**用在真实的 props 继承与 slot 签名里**。
于是「form-core 批次③ 的 API 形状能不能被消费」这件事，从纸面变成了
`vue-tsc` 的检查项 —— 这正是 `doneWhen` 那条要求想拦住的风险
（`overlay` 当年就是「契约封了但无人消费」）。

## 与 antd 的对应

| 项 | 值 |
|---|---|
| antd 版本 | 6.6.4 |
| 参考产物 | `/tmp/antd-src/package/es/form/`（`Form.js` 188 行、`FormItem/index.js`、`FormList.js`、`context.js`） |
| 参考源码 | `/tmp/antd-repo/ant-design-master/components/form/` |
| 上游状态机 | `@rc-component/form@1.8.6`（→ `@apollo-design/form-core` 批次③） |

## 为什么用 `.vue` 而不是 `.tsx`（规则 R1.3）

`Form` / `Form.Item` 的渲染树是**布局驱动**的（label / control / help / extra 四段），
模板表达力足够且更可读；`Form.List` 的 `children` 是 render props，Vue 侧对应
**scoped slot**（`COMPATIBILITY.md` 规则 C8），模板同样能表达。
⇒ 三个文件都是 `.vue`，**不存在**「因为 antd 是 TSX 所以我们也用 TSX」的理由。

## 与 antd 的差异清单（R1.2，落地时同步到 `COMPATIBILITY.md` §9）

| # | 差异 | 判定 |
|---|---|---|
| 1 | `onValuesChange` / `onFieldsChange` / `onFinish` / `onFinishFailed` → **emits**（规则 C5），从 props 里 `Omit` | **INTENDED**（Vue 事件模型） |
| 2 | `children` 的函数形态（render props）→ **scoped slot**（规则 C8）；`Form.Item` 的 `Field` render props 同理 | **INTENDED** |
| 3 | `label` / `help` / `extra` / `tooltip` 的 `VNodeChild` prop **必须显式声明 `default: undefined`**（否则 Vue 的 Boolean prop 转换会把未传值变成 `false`） | **PLATFORM**（同 D21） |
| 4 | `required` / `preserve` / `isListField` / `isList` / `shouldUpdate` / `validateFirst` / `validateTrigger` / `hasFeedback` / `colon` / `name` 同样必须 `default: undefined` | **PLATFORM**（同 D21） |
| 5 | `component?: false \| string \| React.ComponentType` → `false \| string \| Component`（Vue 的 `Component`） | **INTENDED** |
| 6 | 原生 `submit` / `reset` 的拦截方式 **待裁决**（规则 C6 说原生事件走 `$attrs`，而 Form 必须拦截它们）—— 见 `interface.ts` 的 TODO(api) | ⬜ **未决** |
| 7 | 占位类型 `ColProps` / `SizeType` / `Variant` / `FormTooltipProps` 待换成真源（`grid` / `config-provider` / `tooltip`） | ⬜ **TODO(dep)** |

## Component Token 清单（R1.4）

⬜ **未定义** —— Token 属 G3，骨架阶段不做。antd 的 `form` Component Token 有
`labelRequiredMarkColor` / `labelColor` / `labelFontSize` / `labelHeight` /
`labelColonMarginInlineStart` / `labelColonMarginInlineEnd` / `itemMarginBottom` /
`verticalLabelPadding` / `verticalLabelMargin` 等（落地时逐条对照
`es/form/style/index.js` 的 `prepareComponentToken`）。

## 下一步（落地顺序）

1. `form-core` 批次③ 收口（`FormStore` / `Field` / `List` 可用）
2. 本目录接入 form-core，把 TODO(impl) 清空
3. G1（antd API 面枚举）→ G2（Vue API 定稿）→ G3/G4（Token/CSS）
4. 7 层测试 + 视觉基线 + 文档 + barrel 导出
