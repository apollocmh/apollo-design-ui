/** Vue Form public props, named slots, events and semantic targets. */

import type {
  FieldData,
  FieldProps,
  FormInstance,
  Meta,
  FormProps as RcFormProps,
  ListProps as RcListProps,
  StoreValue,
  ValidateErrorEntity,
} from '@apollo-design/form-core';
import type { Options as ScrollIntoViewOptions } from 'scroll-into-view-if-needed';
import type { Component, CSSProperties, HTMLAttributes, VNodeChild } from 'vue';
import type { SemanticInput } from '../_internal/use-merge-semantic';
import type { SizeType, Variant } from '../config-provider';
import type { ColProps as GridColProps } from '../grid';
import type { TooltipProps } from '../tooltip';

// ---------------------------------------------------------------------------
// Shared component contracts
// ---------------------------------------------------------------------------

export type ColProps = GridColProps & HTMLAttributes;
export type { SizeType, Variant };

/** Tooltip configuration with an optional indicator node. */
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

/** Custom mark content belongs to the requiredMark slot. */
export type RequiredMark = boolean | 'optional';

export interface FormFeedbackIconSlotProps {
  status: ValidateStatus;
  errors: VNodeChild[];
  warnings: VNodeChild[];
}

export interface FormRequiredMarkSlotProps {
  label: Component;
  required: boolean;
}

/** Semantic classes applied to their actual Form hosts. */
export interface FormSemanticClassNames {
  root?: string;
  label?: string;
  content?: string;
  help?: string;
  helpItem?: string;
  extra?: string;
}

/** Semantic styles applied to their actual Form hosts. */
export interface FormSemanticStyles {
  root?: CSSProperties;
  label?: CSSProperties;
  content?: CSSProperties;
  help?: CSSProperties;
  helpItem?: CSSProperties;
  extra?: CSSProperties;
}

export interface FormSemanticProps {
  name?: string;
  layout: FormLayout;
  size?: SizeType;
  disabled: boolean;
  variant?: Variant;
  colon?: boolean;
  requiredMark?: RequiredMark;
  labelAlign?: FormLabelAlign;
  labelWrap?: boolean;
}

/**
 * `Form` 的 props。
 *
 * Inherited onXxx types describe JSX listeners; runtime notifications are owned emits.
 * Native root class/style are Vue attrs.
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
  size?: SizeType;
  disabled?: boolean;
  scrollToFirstError?: ScrollFocusOptions | boolean;
  requiredMark?: RequiredMark;
  variant?: Variant;
  tooltip?: FormTooltipProps;
  classNames?: SemanticInput<FormSemanticClassNames, FormSemanticProps>;
  styles?: SemanticInput<FormSemanticStyles, FormSemanticProps>;
}

/** Business notifications. Native submit/reset retain their actual DOM Events. */
export interface FormEmits<Values = unknown> {
  valuesChange: [changedValues: Partial<Values>, values: Values];
  fieldsChange: [changedFields: FieldData<Values>[], allFields: FieldData<Values>[]];
  finish: [values: Values];
  finishFailed: [errorInfo: ValidateErrorEntity<Values>];
}

/** ⭐ render props → scoped slot（规则 C8）。 */
export interface FormSlots<Values = unknown> {
  default?: (scope: {
    values: Record<string, StoreValue>;
    form: FormInstance<Values>;
  }) => VNodeChild;
  requiredMark?: (scope: FormRequiredMarkSlotProps) => VNodeChild;
  feedbackIcon?: (scope: FormFeedbackIconSlotProps) => VNodeChild;
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
  hasFeedback?: boolean;
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
  help?: VNodeChild;
}

/** Form.Item 默认槽始终接收具名对象；独立布局项的 form 为 undefined。 */
export interface FormItemSlots<Values = unknown> {
  default?: (scope: {
    control: Record<string, unknown>;
    meta: Meta;
    form: FormInstance<Values> | undefined;
  }) => VNodeChild;
  label?: () => VNodeChild;
  extra?: () => VNodeChild;
  help?: () => VNodeChild;
  tooltip?: () => VNodeChild;
  feedbackIcon?: (scope: FormFeedbackIconSlotProps) => VNodeChild;
}

// ---------------------------------------------------------------------------
// Form.List
// ---------------------------------------------------------------------------

export interface FormListProps<Values = unknown> extends Omit<RcListProps<Values>, 'children'> {
  prefixCls?: string;
}

/**
 * ⭐ `children` render props → **单对象** scoped slot（规则 C8）。
 *
 * ⚠️ Vue 模板的 scoped slot 只能接收**一个** props 对象；把 React 的三个位置参数
 * 原样传给 `slots.default(fields, operations, meta)` 会让模板侧只拿到 `fields`，
 * `add/remove/move` 永远不可达（`<template #default="{ operations }">` 取到
 * `undefined`）。2026-10-21 阶段 2 做 Form.List 示例时实测发现，改为对象载荷。
 */
export interface FormListSlotProps {
  fields: { name: number; key: number; isListField: boolean; fieldKey: number }[];
  operations: {
    add: (defaultValue?: StoreValue, index?: number) => void;
    remove: (index: number | number[]) => void;
    move: (from: number, to: number) => void;
  };
  meta: { errors?: unknown[]; warnings?: unknown[] };
}

// biome-ignore lint/correctness/noUnusedVariables: 保留与 `FormListProps<Values>` 对齐的泛型位，消费者可写 `FormListSlots<MyValues>`
export interface FormListSlots<Values = unknown> {
  default?: (props: FormListSlotProps) => VNodeChild;
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
