/**
 * `Form` / `Form.Item` / `Form.List` 的类型契约（**骨架阶段**）。
 *
 * 契约来源：antd 6.6.4 的 `es/form/Form.d.ts` / `es/form/FormItem/index.d.ts` /
 * `es/form/FormList.d.ts` / `es/form/FormItemLabel.d.ts` / `es/form/FormItemInput.d.ts`
 * / `es/form/context.d.ts` / `es/form/interface.d.ts`。
 *
 * ⚠️⚠️ **本目录是骨架，不是实现**（`registry/foundation.json` 的 `doneWhen`：
 * 「批次③ 开工前先有 ui/src/form 骨架（否则 API 形状无从校验）」）。
 *
 * 骨架的唯一职责：把 antd 的 API 面**逐条落成 Vue 的类型与 slot 声明**，
 * 再让它去消费 `@apollo-design/form-core` 的批次③ 类型面 —— 能通过 `vue-tsc`
 * 就证明「form-core 的 API 形状可以被真实消费」。
 *
 * ❌ 骨架**不含**：布局/校验状态/错误展示/Token/CSS/demo/文档/测试。
 * ⚠️ 因此 `registry/components.json` 里 `form` 的**任何维度都不得置 `done`**。
 *
 * ── 占位类型（依赖尚未实现的包，落地时替换）──────────────────────────────────
 *
 * 下面标了 `TODO(dep)` 的类型来自**尚未实现**的包。这里给出**结构占位**，
 * 只为让骨架自洽；落地时必须换成真源，否则就是一个「看起来对」的谎。
 *
 * | 占位 | 真源（落地时替换） |
 * |---|---|
 * | `ColProps` | `grid` 组件的 `ColProps`（antd `es/grid/col`） |
 * | `SizeType` | `config-provider` 的 `SizeType`（antd `es/config-provider/SizeContext`） |
 * | `Variant` | `config-provider` 的 `Variant`（antd `es/config-provider`） |
 * | `FormTooltipProps` | `tooltip` 组件的 `TooltipProps`（antd `es/tooltip`） |
 * | `FormSemanticClassNames` / `FormSemanticStyles` | 本组件的 `style/`（G3/G4） |
 */

import type {
  FieldProps,
  FormInstance,
  FormProps as RcFormProps,
  ListProps as RcListProps,
  StoreValue,
} from '@apollo-design/form-core';
import type { Options as ScrollIntoViewOptions } from 'scroll-into-view-if-needed';
import type { CSSProperties, VNodeChild } from 'vue';
import type { SizeType, Variant } from '../config-provider';
import type { ColProps } from '../grid';
import type { TooltipProps } from '../tooltip';

// ---------------------------------------------------------------------------
// 真源类型（G4 收口时替换掉骨架期的占位：grid / config-provider / tooltip 均已落地）
// ---------------------------------------------------------------------------

export type { ColProps, SizeType, Variant };

/** antd 逐字：`TooltipProps & { icon?: ReactElement }`。 */
export type FormTooltipProps = TooltipProps & { icon?: VNodeChild };

export type FormItemTooltipType = FormTooltipProps | VNodeChild;

/** 校验状态。⭐ 空串 `''` 是合法值（表示「无状态」），不是遗漏。 */
export type ValidateStatus = 'success' | 'warning' | 'error' | 'validating' | '';

export type ScrollFocusOptions = ScrollIntoViewOptions & { focus?: boolean };
export type ScrollOptions = ScrollFocusOptions;

// ---------------------------------------------------------------------------
// Form
// ---------------------------------------------------------------------------

export type FormLayout = 'horizontal' | 'inline' | 'vertical';
export type FormItemLayout = 'horizontal' | 'vertical';
export type FormLabelAlign = 'left' | 'right';

/** ⭐ `'optional'` 与函数形态都是合法取值（不是「布尔 + 特例」）。 */
export type RequiredMark =
  | boolean
  | 'optional'
  | ((labelNode: VNodeChild, info: { required: boolean }) => VNodeChild);

/** 反馈图标：按状态给出图标。 */
export type FeedbackIcons = (itemStatus: {
  status: ValidateStatus;
  errors?: VNodeChild[];
  warnings?: VNodeChild[];
}) => { [key in ValidateStatus]?: VNodeChild };

/** TODO(dep): 由 G3/G4 的语义化 `classNames`/`styles` 生成。 */
export interface FormSemanticClassNames {
  root?: string;
  label?: string;
  content?: string;
  help?: string;
  helpItem?: string;
  extra?: string;
}

/** TODO(dep): 由 G3/G4 的语义化 `classNames`/`styles` 生成。 */
export interface FormSemanticStyles {
  root?: CSSProperties;
  label?: CSSProperties;
  content?: CSSProperties;
  help?: CSSProperties;
  helpItem?: CSSProperties;
  extra?: CSSProperties;
}

/**
 * `Form` 的 props。
 *
 * ⚠️ **Omit 掉四个 `onXxx` 回调**（`onValuesChange` / `onFieldsChange` / `onFinish` /
 * `onFinishFailed`）—— 按规则 C5 它们在 Vue 侧是 **emits**，不是 props。
 * 不 Omit 会与 `defineEmits` 生成的 `onXxx` 监听 prop **撞键**：
 * Vue 会把 `onValuesChange` 从 `$attrs` 里摘走当事件监听，于是「props 里有个同名键」
 * 就成了一个永远拿不到值的假 prop。
 */
export interface FormProps<Values = unknown>
  extends Omit<RcFormProps<Values>, 'className' | 'style' | 'rootClassName'> {
  prefixCls?: string;
  colon?: boolean;
  layout?: FormLayout;
  labelAlign?: FormLabelAlign;
  labelWrap?: boolean;
  labelCol?: ColProps;
  wrapperCol?: ColProps;
  feedbackIcons?: FeedbackIcons;
  size?: SizeType;
  disabled?: boolean;
  scrollToFirstError?: ScrollFocusOptions | boolean;
  requiredMark?: RequiredMark;
  variant?: Variant;
  tooltip?: FormTooltipProps;
  classNames?: FormSemanticClassNames;
  styles?: FormSemanticStyles;
}

/**
 * Form 的 emits（`COMPATIBILITY.md` 规则 C5：`onXxx` → `xxx`）。
 *
 * ⚠️ TODO(api): **`submit` / `reset` 不在 emits 里** —— 它们是原生 DOM 事件，
 * 按规则 C6 必须经 `$attrs` 透传。但 `Form` 又**必须拦截**它们（`preventDefault`
 * + `form.submit()` / `form.resetFields()`），这与 C6 的「原生事件不拦截」有张力。
 * 落地时按 antd 的实际行为裁决：antd 的 `onSubmit` 被**完全接管**（不转发用户的），
 * 而 `onReset` 在 `resetFields()` 之后**会**调 `restProps.onReset?.(event)`。
 * ⇒ 待 `form` 的 G1/G2 出结论后写死，骨架阶段**不猜**。
 */
export interface FormEmits<Values = unknown> {
  valuesChange: [changedValues: Partial<Values>, values: Values];
  fieldsChange: [changedFields: unknown[], allFields: unknown[]];
  finish: [values: Values];
  finishFailed: [errorInfo: unknown];
}

/** ⭐ render props → scoped slot（规则 C8）。 */
export interface FormSlots<Values = unknown> {
  default?: (values: Record<string, StoreValue>, form: FormInstance<Values>) => VNodeChild;
}

// ---------------------------------------------------------------------------
// Form.Item
// ---------------------------------------------------------------------------

/**
 * `Form.Item` 的 props。
 *
 * ⚠️ 继承 `FieldProps`（**不是** `Omit<…, 'children'>`）—— form-core 的 `FieldProps`
 * 在 Vue 侧已经不含 `children`（render prop 由 scoped slot 取代，契约 §6.4.5 差异 2）。
 */
export interface FormItemProps<Values = unknown> extends FieldProps<Values> {
  prefixCls?: string;
  noStyle?: boolean;
  id?: string;
  hasFeedback?: boolean | { icons: FeedbackIcons };
  validateStatus?: ValidateStatus;
  required?: boolean;
  hidden?: boolean;
  initialValue?: StoreValue;
  messageVariables?: Record<string, string>;
  layout?: FormItemLayout;
  /** 以下来自 `FormItemLabelProps` */
  colon?: boolean;
  htmlFor?: string;
  label?: VNodeChild;
  labelAlign?: FormLabelAlign;
  labelCol?: ColProps;
  tooltip?: FormItemTooltipType;
  /** 以下来自 `FormItemInputProps` */
  wrapperCol?: ColProps;
  extra?: VNodeChild;
  status?: ValidateStatus;
  help?: VNodeChild;
  fieldId?: string;
}

/**
 * `Form.Item` 的 slots。
 *
 * ⚠️ 与 form-core 的 `FieldSlots.default(control, meta, form)` 是**两层**：
 * form-core 的 `Field` 暴露 `(control, meta, form)`；antd 的 `Form.Item` 在其上
 * 再包一层布局，并把 `meta` 转成 `validateStatus`/`help`/`extra` 的渲染。
 * 骨架阶段**先只声明与 antd 一致的 `default` 插槽**，render-props 形态
 * （`children` 作为函数）留待 G1/G2 按 C8 裁决（主推 scoped slot、兼容保留函数）。
 */
export interface FormItemSlots {
  default?: () => VNodeChild;
  label?: () => VNodeChild;
  extra?: () => VNodeChild;
  help?: () => VNodeChild;
  tooltip?: () => VNodeChild;
}

// ---------------------------------------------------------------------------
// Form.List
// ---------------------------------------------------------------------------

export interface FormListProps<Values = unknown> extends Omit<RcListProps<Values>, 'children'> {
  prefixCls?: string;
}

/** ⭐ `children` render props → scoped slot（规则 C8）。 */
// biome-ignore lint/correctness/noUnusedVariables: `Values` 与 antd 的 `FormListProps<Values>` 对齐，③c 落地后 slot 的 `fields` 会按 `Values` 推导；骨架阶段先保留泛型位，避免落地时再改一次公开类型。
export interface FormListSlots<Values = unknown> {
  default?: (
    fields: { name: number; key: number; isListField: boolean }[],
    operations: {
      add: (defaultValue?: StoreValue, index?: number) => void;
      remove: (index: number | number[]) => void;
      move: (from: number, to: number) => void;
    },
    meta: unknown,
  ) => VNodeChild;
}

// ---------------------------------------------------------------------------
// 复用 form-core 的类型（供 ui 层消费者使用）
// ---------------------------------------------------------------------------

export type {
  FieldMessage,
  FieldProps,
  FormInstance,
  FormRef,
  InternalNamePath,
  Meta,
  NamePath,
  RuleObject,
  Store,
  StoreValue,
} from '@apollo-design/form-core';
