/**
 * Input.Password —— antd 6.6.4 `components/input/Password.tsx` 的 Vue 实现。
 *
 * 判据（es/input/Password.js 145 行）：
 *  1. 内层仍是 Input（prefixCls=`input`），外层 prefixCls 是 `input-password`；
 *     图标节点是 `span.{input-password}-icon`，带 `role=button`、
 *     `aria-pressed={visible}`、`aria-label={visible ? locale.hide : locale.show}`、
 *     `tabIndex`（禁用时 -1）。
 *  2. 触发方式由 `visibilityToggle.action`（click/hover/…）决定（默认 click）；
 *     `onMousedown`/`onMouseup` 都 `preventDefault`（失焦/光标位置规避，
 *     issue 15173 / 23524）；Enter 或空格键切换（且不重复触发）。
 *  3. `visible` 可被 `visibilityToggle={{ visible }}` 受控（controlled 时不改内部态）。
 *  4. `type` 在 visible 时是 `text`，否则 `password`；切换时走
 *     `useRemovePasswordTimeout`（Chrome 自动填充规避）。
 */

import { EyeInvisibleOutlined, EyeOutlined } from '@apollo-design/icons';
import { useLocale } from '@apollo-design/locale';
import { isPlainObject } from '@apollo-design/utils';
import {
  type Component,
  type CSSProperties,
  computed,
  defineComponent,
  h,
  isVNode,
  type PropType,
  ref,
  shallowRef,
  type VNodeChild,
  watch,
} from 'vue';
import { semanticRootStyle, useMergeSemantic } from '../_internal/use-merge-semantic';
import { useComponentConfig } from '../config-provider/context';
import { useDisabled } from '../config-provider/disabled-context';
import { useVariant } from '../form/hooks/useVariants';
import { useRemovePasswordTimeout } from './hooks/use-remove-password-timeout';
import { InputComponent } from './Input';
import type {
  InputPasswordProps,
  InputRef,
  InputSemanticStyles,
  PasswordSemanticClassNames,
} from './interface';

function asNode(value: VNodeChild | Component | null | undefined): VNodeChild | undefined {
  if (value === null || value === undefined) return undefined;
  if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') {
    return value;
  }
  if (isVNode(value) || Array.isArray(value)) return value as VNodeChild;
  return h(value as Component);
}

/** antd 的 actionMap：hover ⇒ onMouseOver，其余 click ⇒ onClick。 */
const ACTION_MAP: Record<string, string> = {
  click: 'onClick',
  hover: 'onMouseover',
};

export const PasswordComponent = defineComponent({
  name: 'AInputPassword',
  inheritAttrs: false,
  props: {
    prefixCls: { type: String, default: undefined },
    inputPrefixCls: { type: String, default: undefined },
    classNames: {
      type: [Object, Function] as PropType<InputPasswordProps['classNames']>,
      default: undefined,
    },
    styles: {
      type: [Object, Function] as PropType<InputPasswordProps['styles']>,
      default: undefined,
    },
    disabled: { type: Boolean, default: undefined },
    bordered: { type: Boolean, default: undefined },
    variant: { type: String as PropType<InputPasswordProps['variant']>, default: undefined },
    suffix: { type: null as unknown as PropType<VNodeChild | Component>, default: undefined },
    // ⚠️ antd 的默认值是 true（不是 undefined）—— 且 Boolean 类型 prop 未传时
    //    Vue 会转成 false，这里必须显式给 default: true（CHECKLIST #3）
    visibilityToggle: {
      type: [Boolean, Object] as PropType<InputPasswordProps['visibilityToggle']>,
      default: true,
    },
    iconRender: {
      type: Function as PropType<(visible: boolean) => VNodeChild>,
      default: undefined,
    },
    size: { type: String as PropType<'large' | 'middle' | 'medium' | 'small'>, default: undefined },
    value: { type: String, default: undefined },
    defaultValue: { type: String, default: undefined },
  },
  emits: ['update:value'],
  setup(props, { attrs, emit, expose }) {
    const context = useComponentConfig('inputPassword');
    const { getPrefixCls } = context;
    const contextDisabled = useDisabled();
    const [globalLocale] = useLocale('global');

    const mergedDisabled = computed(() => props.disabled ?? contextDisabled.value);
    const { variant } = useVariant({
      component: 'inputPassword',
      variant: () => props.variant,
      legacyBordered: () => props.bordered,
    });

    const mergedProps = computed(
      () => ({ ...props, disabled: mergedDisabled.value, variant: variant.value }) as never,
    );
    const { classNames: mergedClassNames, styles: mergedStyles } = useMergeSemantic<
      InputPasswordProps,
      PasswordSemanticClassNames,
      InputSemanticStyles
    >(
      [() => context.classNames as PasswordSemanticClassNames | undefined, () => props.classNames],
      [
        () => context.styles as InputSemanticStyles | undefined,
        () => semanticRootStyle(undefined),
        () => props.styles as InputSemanticStyles | undefined,
        () => semanticRootStyle(attrs.style as CSSProperties),
      ],
      mergedProps.value,
    );

    const toggle = computed(() => {
      const raw = props.visibilityToggle ?? true;
      return raw === false
        ? false
        : (raw as
            | true
            | {
                visible?: boolean;
                onVisibleChange?: (v: boolean) => void;
                tabIndex?: number;
                action?: string;
              });
    });
    const visibilityControlled = computed(
      () =>
        isPlainObject(toggle.value) &&
        (toggle.value as { visible?: boolean }).visible !== undefined,
    );
    const visible = ref<boolean>(
      visibilityControlled.value ? !!(toggle.value as { visible: boolean }).visible : false,
    );
    watch(
      () =>
        isPlainObject(toggle.value) ? (toggle.value as { visible?: boolean }).visible : undefined,
      (next) => {
        if (visibilityControlled.value) {
          visible.value = !!next;
        }
      },
    );

    const inputRef = shallowRef<InputRef | null>(null);
    const removePasswordTimeout = useRemovePasswordTimeout(() => inputRef.value, true);

    const onVisibleChange = (): void => {
      if (mergedDisabled.value) {
        return;
      }
      if (visible.value) {
        removePasswordTimeout();
      }
      const nextVisible = !visible.value;
      if (!visibilityControlled.value) {
        visible.value = nextVisible;
      }
      if (isPlainObject(toggle.value)) {
        (toggle.value as { onVisibleChange?: (v: boolean) => void }).onVisibleChange?.(nextVisible);
      }
    };

    const defaultIconRender = (isVisible: boolean): VNodeChild =>
      isVisible ? h(EyeOutlined) : h(EyeInvisibleOutlined);
    const iconRender = computed(
      () =>
        props.iconRender ??
        (context as { iconRender?: (v: boolean) => VNodeChild }).iconRender ??
        defaultIconRender,
    );

    const prefixCls = computed(() => getPrefixCls('input-password', props.prefixCls));
    const inputPrefixCls = computed(() => getPrefixCls('input', props.inputPrefixCls));

    expose({
      focus: (option?: { preventScroll?: boolean; cursor?: 'start' | 'end' | 'all' }) => {
        inputRef.value?.focus(option);
      },
      blur: () => {
        inputRef.value?.blur();
      },
      setSelectionRange: (start: number, end: number, d?: 'forward' | 'backward' | 'none') => {
        inputRef.value?.setSelectionRange(start, end, d);
      },
      select: () => {
        inputRef.value?.select();
      },
      get input() {
        return inputRef.value?.input ?? null;
      },
      get nativeElement() {
        return inputRef.value?.nativeElement ?? null;
      },
    } satisfies InputRef);

    return () => {
      const p = prefixCls.value;
      const iconTrigger =
        ACTION_MAP[
          (isPlainObject(toggle.value)
            ? (toggle.value as { action?: string }).action
            : undefined) ?? 'click'
        ] ?? 'onClick';

      const iconNode =
        toggle.value === false
          ? null
          : h(
              'span',
              {
                key: 'passwordIcon',
                role: 'button',
                tabIndex: mergedDisabled.value
                  ? -1
                  : ((isPlainObject(toggle.value)
                      ? (toggle.value as { tabIndex?: number }).tabIndex
                      : undefined) ?? 0),
                class: `${p}-icon`,
                'aria-disabled': mergedDisabled.value,
                'aria-pressed': visible.value,
                'aria-label': visible.value ? globalLocale.hide : globalLocale.show,
                onMousedown: (e: MouseEvent) => e.preventDefault(),
                onMouseup: (e: MouseEvent) => e.preventDefault(),
                onKeydown: (e: KeyboardEvent) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    if (!e.repeat) {
                      onVisibleChange();
                    }
                  }
                },
                [iconTrigger]: onVisibleChange,
              },
              [iconRender.value(visible.value)],
            );

      return h(InputComponent, {
        ...attrs,
        ref: inputRef as never,
        prefixCls: inputPrefixCls.value,
        type: visible.value ? 'text' : 'password',
        disabled: mergedDisabled.value,
        size: props.size,
        value: props.value,
        defaultValue: props.defaultValue,
        variant: variant.value,
        suffix: [iconNode, asNode(props.suffix)],
        // Input 已迁移到原生 attrs ⇒ 用 `class`（不再有 rootClassName）
        class: [
          p,
          (context as { className?: string }).className,
          attrs.class,
          { [`${p}-${props.size}`]: !!props.size },
        ],
        classNames: mergedClassNames.value as never,
        styles: mergedStyles.value as never,
        'onUpdate:value': (v: string | undefined) => emit('update:value', v),
      } as never);
    };
  },
});
