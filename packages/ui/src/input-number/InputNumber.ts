/**
 * InputNumber —— 数字输入框。
 *
 * 契约来源：antd 6.6.4 的 `es/input-number/index.js`（wrapper 202 行）+
 * `@rc-component/input-number@1.6.2` 的引擎行为（InputNumber.js 647 行 +
 * StepHandler 83 行 + useCursor 67 行）。判据逐条对齐 G1 分析
 * （`docs/analysis/input-number.md`）；数值引擎在 `./engine/`（H5 自建）。
 *
 * ── 最容易写错的判据 ─────────────────────────────────────────────────────────
 *
 * 1. **双状态**：`decimalValue`（真实值）/`inputValue`（显示文本）分离 ——
 *    键入中（userTyping）不做 precision 格式化、不钳制范围；flush（blur/Enter）
 *    才回正。受控 `value` 与 `parse(inputValue)` 相等且在键入中 ⇒ **不**重写文本
 *    （`1.2` 键入成 `1.` 不被立即格式化成 `1`）。
 * 2. **受控不落内部态**：`value !== undefined` 时 `setUncontrolledDecimalValue`
 *    跳过（rc 的判据在 setter 里，不在 effect 里）。
 * 3. **onChange(null)**：空输入在 flush 时触发（上游 issue 13896）。
 * 4. **事件绑定面**：mousedown/mouseup/leave/move/enter/out/click 落**根**
 *    （mousedown 在非 input 目标时 focus 输入框 + preventDefault）；
 *    keydown/keyup/composition/beforeinput 的**内部处理**落根（rc 同）；
 *    用户透传的其余 attrs（id/name/type/onKeydown/onFocus/onBlur…）落 **input**。
 * 5. **wheel 非 passive**：changeOnWheel + focused 时挂 DOM 监听
 *    （`{passive:false}` 才能 preventDefault）。
 * 6. **variant/status/size/compact 合并链**在 wrapper 层；`-without-controls`
 *    的判据是 `!mergedControls`（controls=false 或 disabled 或 readOnly）。
 * 7. **deprecated**：bordered / addonBefore / addonAfter ⇒ 告警（console.error 通道）。
 */

import { DownOutlined, MinusOutlined, PlusOutlined, UpOutlined } from '@apollo-design/icons';
import { cancelRaf, isPlainObject, raf, triggerFocus, useDevWarning } from '@apollo-design/utils';
import {
  type Component,
  computed,
  defineComponent,
  h,
  isVNode,
  onMounted,
  onScopeDispose,
  type PropType,
  ref,
  shallowRef,
  type VNodeChild,
  watch,
  watchEffect,
} from 'vue';
import { semanticRootStyle, styleAttrs, useMergeSemantic } from '../_internal/use-merge-semantic';
import { useComponentConfig, useDirection } from '../config-provider/context';
import { useDisabled } from '../config-provider/disabled-context';
import { type SizeType, useSize } from '../config-provider/size-context';
import { getMergedStatus, useFormItemInputContext } from '../form/context';
import { useVariant } from '../form/hooks/useVariants';
import { SpaceAddon, SpaceCompact, useCompactItemContext } from '../space';
import { normalizeNode } from '../space/node';
import { getStatusClassNames } from '../space/statusUtils';
import { type Decimal, getMiniDecimal, toFixedDecimal } from './engine/decimal';
import { getDecupleSteps, getNumberPrecision, num2str, validateNumber } from './engine/number-util';
import { StepHandler, type StepInfo } from './engine/StepHandler';
import { useCursor } from './engine/use-cursor';
import type {
  InputNumberControls,
  InputNumberProps,
  InputNumberRef,
  InputNumberSemanticClassNames,
  InputNumberSemanticStyles,
  ValueType,
} from './interface';

type VNodeLike = NonNullable<InputNumberProps['prefix']>;

/** D42：`VNodeChild` 之外还接受组件对象，渲染前 `h()` 包一层（Button 同款）。 */
function asNode(
  value: VNodeLike | VNodeChild | Component | null | undefined,
): ReturnType<typeof normalizeNode> | undefined {
  if (value == null) return undefined;
  if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') {
    return value;
  }
  if (isVNode(value) || Array.isArray(value)) return normalizeNode(value as never);
  return normalizeNode(h(value as Component));
}

/** `stringMode || isEmpty ⇒ toString()`（rc 的 getDecimalValue）。 */
function getDecimalValue(stringMode: boolean, decimal: Decimal): string | number {
  if (stringMode || decimal.isEmpty()) {
    return decimal.toString();
  }
  return decimal.toNumber();
}

/** `isInvalidate ⇒ null`，否则 Decimal（rc 的 getDecimalIfValidate）。 */
function getDecimalIfValidate(value: unknown): Decimal | null {
  const decimal = getMiniDecimal(value);
  return decimal.isInvalidate() ? null : decimal;
}

/** Internal 与外层共用同一份 prop 表（antd 的 InternalInputNumber 透传面一致）。 */
const inputNumberPropDefs = {
  prefixCls: { type: String, default: undefined },
  rootClassName: { type: String, default: undefined },
  className: { type: String, default: undefined },
  style: { type: Object as PropType<InputNumberProps['style']>, default: undefined },
  classNames: {
    type: [Object, Function] as PropType<InputNumberProps['classNames']>,
    default: undefined,
  },
  styles: {
    type: [Object, Function] as PropType<InputNumberProps['styles']>,
    default: undefined,
  },
  value: { type: [String, Number] as PropType<ValueType | null>, default: undefined },
  defaultValue: { type: [String, Number] as PropType<ValueType>, default: undefined },
  min: { type: [String, Number] as PropType<ValueType>, default: undefined },
  max: { type: [String, Number] as PropType<ValueType>, default: undefined },
  step: { type: [String, Number] as PropType<ValueType>, default: undefined },
  keyboard: { type: Boolean, default: undefined },
  changeOnBlur: { type: Boolean, default: undefined },
  changeOnWheel: { type: Boolean, default: undefined },
  disabled: { type: Boolean, default: undefined },
  readOnly: { type: Boolean, default: undefined },
  autoFocus: { type: Boolean, default: undefined },
  stringMode: { type: Boolean, default: undefined },
  formatter: { type: Function as PropType<InputNumberProps['formatter']>, default: undefined },
  parser: { type: Function as PropType<InputNumberProps['parser']>, default: undefined },
  precision: { type: Number, default: undefined },
  decimalSeparator: { type: String, default: undefined },
  placeholder: { type: String, default: undefined },
  controls: {
    type: [Boolean, Object] as PropType<boolean | InputNumberControls>,
    default: undefined,
  },
  mode: { type: String as PropType<InputNumberProps['mode']>, default: undefined },
  prefix: { type: null as unknown as PropType<VNodeLike>, default: undefined },
  suffix: { type: null as unknown as PropType<VNodeLike>, default: undefined },
  size: { type: String as PropType<SizeType>, default: undefined },
  status: { type: String as PropType<InputNumberProps['status']>, default: undefined },
  variant: { type: String as PropType<InputNumberProps['variant']>, default: undefined },
  bordered: { type: Boolean, default: undefined },
  addonBefore: { type: null as unknown as PropType<VNodeLike>, default: undefined },
  addonAfter: { type: null as unknown as PropType<VNodeLike>, default: undefined },
};

export const InputNumberInternalComponent = defineComponent({
  name: 'AInputNumberInternal',
  inheritAttrs: false,
  props: inputNumberPropDefs,
  /**
   * ⚠️ 只声明 `update:value`（供 `v-model:value`）；`change` 是 antd 的 props
   * 形态回调，走 attrs（PITFALLS 35）。两者同时发出（规则 C11）。
   */
  emits: ['update:value'],
  setup(props, { attrs, emit, expose }) {
    const context = useComponentConfig('inputNumber');
    const direction = useDirection();
    const contextDisabled = useDisabled();
    const formItemContext = useFormItemInputContext();

    // ============================= Prefix ==============================
    // ⚠️ Internal 拿到的是 wrapper 已解析好的完整前缀（antd 同构）
    const prefixCls = computed(() => props.prefixCls ?? 'apollo-input-number');

    // ============================ Refs =============================
    const rootRef = shallowRef<HTMLDivElement | null>(null);
    const inputRef = shallowRef<HTMLInputElement | null>(null);

    // ============================ Disabled =============================
    const mergedDisabled = computed(() => props.disabled ?? contextDisabled.value);

    // ============================ Controls =============================
    // rc 的解构默认值：`controls = true`
    const mergedControls = computed<boolean | InputNumberControls>(() => {
      const raw = props.controls ?? true;
      if (!raw || mergedDisabled.value || props.readOnly) {
        return false;
      }
      return raw;
    });

    // ============================ Compact ==============================
    const { compactSize, compactItemClassnames } = useCompactItemContext(
      prefixCls,
      () => direction.value,
    );

    // ============================ Size =============================
    // ⚠️ 函数形态：`useSize(props.size)` 非响应式（CHECKLIST #46，radio/switch 各踩一次）
    const mergedSize = useSize((ctx) => props.size ?? compactSize.value ?? ctx);

    // ============================ Variant ==============================
    const { variant, enableVariantCls } = useVariant({
      component: 'inputNumber',
      variant: () => props.variant,
      legacyBordered: () => props.bordered,
    });

    // ========================== Form 上下文 ============================
    const hasFeedback = computed(() => formItemContext.value.hasFeedback === true);
    const isFormItemInput = computed(() => formItemContext.value.isFormItemInput === true);
    // wrapper 已做 getMergedStatus 合并（antd：mergedStatus 在 wrapper 算好传入）
    const mergedStatus = computed(() => props.status);

    // ========================== 状态机核心 ===========================
    const mergedStep = computed<ValueType>(() => props.step ?? 1);

    /** 只参与逻辑分支，不需要触发渲染 ⇒ 普通变量（对应 React ref）。 */
    let userTyping = false;
    let composition = false;
    let shiftKey = false;

    const focus = ref(false);

    // ---- 真实值 ----
    const decimalValue = ref<Decimal>(getMiniDecimal(props.value ?? props.defaultValue));

    /** 受控时不落内部态（rc 的判据在 setter 里）。 */
    function setUncontrolledDecimalValue(newDecimal: Decimal): void {
      if (props.value === undefined) {
        decimalValue.value = newDecimal;
      }
    }

    // ---- precision / parser / formatter ----
    function getPrecision(numStr: string, typing: boolean): number | undefined {
      if (typing) {
        return undefined;
      }
      if (typeof props.precision === 'number' && props.precision >= 0) {
        return props.precision;
      }
      return Math.max(getNumberPrecision(numStr), getNumberPrecision(mergedStep.value));
    }

    function mergedParser(num: unknown): string {
      const numStr = String(num);
      if (props.parser) {
        return props.parser(numStr);
      }
      let parsedStr = numStr;
      if (props.decimalSeparator) {
        parsedStr = parsedStr.replace(props.decimalSeparator, '.');
      }
      // [Legacy] 自动把 `$ 123,456` 转成 `123456`
      return parsedStr.replace(/[^\w.-]+/g, '');
    }

    /** formatter 的 info.input 用最新文本（rc 用 ref 立即刷新；初始为空串）。 */
    let currentInputText = '';

    function mergedFormatter(number: ValueType | Decimal, typing: boolean): string {
      if (props.formatter) {
        const raw: ValueType =
          typeof number === 'number' ? number : (number.toString() as ValueType);
        return props.formatter(raw, { userTyping: typing, input: currentInputText });
      }
      let str = typeof number === 'number' ? num2str(number) : String(number);

      // 键入中不按 precision 直接格式化
      if (!typing) {
        const mergedPrecision = getPrecision(str, typing);
        if (validateNumber(str) && (props.decimalSeparator || (mergedPrecision ?? -1) >= 0)) {
          const separatorStr = props.decimalSeparator || '.';
          str = toFixedDecimal(str, mergedPrecision ?? -1, separatorStr);
        }
      }
      return str;
    }

    // ---- 显示文本 ----
    function initialInputValue(): string {
      const initValue = props.defaultValue ?? props.value;
      const next =
        decimalValue.value.isInvalidate() && ['string', 'number'].includes(typeof initValue)
          ? typeof initValue === 'number' && Number.isNaN(initValue)
            ? ''
            : String(initValue)
          : mergedFormatter(decimalValue.value.toString(), false);
      currentInputText = next;
      return next;
    }
    const inputValue = ref(initialInputValue());

    function setInputValue(newValue: Decimal, typing: boolean): void {
      const next = mergedFormatter(
        newValue.isInvalidate() ? newValue.toString(false) : newValue.toString(!typing),
        typing,
      );
      currentInputText = next;
      inputValue.value = next;
    }

    // ---- 范围 ----
    const maxDecimal = computed(() => getDecimalIfValidate(props.max));
    const minDecimal = computed(() => getDecimalIfValidate(props.min));

    function getRangeValue(target: Decimal): Decimal | null {
      if (maxDecimal.value && !target.lessEquals(maxDecimal.value)) {
        return maxDecimal.value;
      }
      if (minDecimal.value && !minDecimal.value.lessEquals(target)) {
        return minDecimal.value;
      }
      return null;
    }

    function isInRange(target: Decimal): boolean {
      return !getRangeValue(target);
    }

    const upDisabled = computed(() => {
      if (!maxDecimal.value || decimalValue.value.isInvalidate()) {
        return false;
      }
      return maxDecimal.value.lessEquals(decimalValue.value);
    });
    const downDisabled = computed(() => {
      if (!minDecimal.value || decimalValue.value.isInvalidate()) {
        return false;
      }
      return decimalValue.value.lessEquals(minDecimal.value);
    });

    // ---- 更新与回调 ----
    function triggerValueUpdate(newValue: Decimal, typing: boolean): Decimal {
      let updateValue = newValue;
      let isRangeValidate = isInRange(updateValue) || updateValue.isEmpty();

      // 空值不重对齐 —— 只触发 onChange(null)，也不打断键入
      if (!updateValue.isEmpty() && !typing) {
        updateValue = getRangeValue(updateValue) || updateValue;
        isRangeValidate = true;
      }
      if (!props.readOnly && !mergedDisabled.value && isRangeValidate) {
        const numStr = updateValue.toString();
        const mergedPrecision = getPrecision(numStr, typing);
        if (typeof mergedPrecision === 'number' && mergedPrecision >= 0) {
          updateValue = getMiniDecimal(toFixedDecimal(numStr, mergedPrecision));
          // toFixed 后可能重新越界：4 in [0, 3.8] ⇒ 3.8 ⇒ 4（截断回退）
          if (!isInRange(updateValue)) {
            updateValue = getMiniDecimal(toFixedDecimal(numStr, mergedPrecision, '.', true));
          }
        }

        if (!updateValue.equals(decimalValue.value)) {
          setUncontrolledDecimalValue(updateValue);
          const next = updateValue.isEmpty()
            ? null
            : getDecimalValue(props.stringMode === true, updateValue);
          // C11：v-model 与语义事件同时发出
          emit('update:value', next);
          (attrs as { onChange?: (v: string | number | null) => void }).onChange?.(next);

          // 非受控时回写显示
          if (props.value === undefined) {
            setInputValue(updateValue, typing);
          }
        }
        return updateValue;
      }
      return decimalValue.value;
    }

    // ---- cursor ----
    const [recordCursor, restoreCursor] = useCursor(inputRef, focus);

    // ---- 下一帧（rc 的 useFrame ⇒ rAF）----
    let frameId: number | null = null;
    function onNextPromise(callback: () => void): void {
      if (frameId !== null) {
        cancelRaf(frameId);
      }
      frameId = raf(() => {
        frameId = null;
        callback();
      });
    }

    // ---- 收集输入 ----
    function collectInputValue(inputStr: string): void {
      recordCursor();

      // formatter 的 info.input 用最新文本（rc 用 ref 立即刷新）
      currentInputText = inputStr;
      inputValue.value = inputStr;

      if (!composition) {
        const finalValue = mergedParser(inputStr);
        const finalDecimal = getMiniDecimal(finalValue);
        if (!finalDecimal.isNaN()) {
          triggerValueUpdate(finalDecimal, true);
        }
      }

      // 中文句号 → 小数点（下一帧重收集）
      onNextPromise(() => {
        let nextInputStr = inputStr;
        if (!props.parser) {
          nextInputStr = inputStr.replace(/。/g, '.');
        }
        if (nextInputStr !== inputStr) {
          collectInputValue(nextInputStr);
        }
      });
    }

    // ---- flush（blur / Enter）----
    function flushInputValue(typing: boolean): void {
      const parsedValue = getMiniDecimal(mergedParser(inputValue.value));
      const formatValue = parsedValue.isNaN()
        ? triggerValueUpdate(decimalValue.value, typing)
        : triggerValueUpdate(parsedValue, typing);
      if (props.value !== undefined) {
        // 受控：先用受控值回写
        setInputValue(decimalValue.value, false);
      } else if (!formatValue.isNaN()) {
        setInputValue(formatValue, false);
      }
    }

    // ---- step ----
    function onInternalStep(up: boolean, emitter: StepInfo['emitter']): void {
      if ((up && upDisabled.value) || (!up && downDisabled.value)) {
        return;
      }
      // 步进清掉键入状态 —— 之后要与输入框文本同步
      userTyping = false;
      const stepDecimal = getMiniDecimal(
        shiftKey ? getDecupleSteps(mergedStep.value) : mergedStep.value,
      );
      // rc：`if (!up) stepDecimal = stepDecimal.negate()` —— down 方向取负
      const directionDecimal = up ? stepDecimal : stepDecimal.negate();
      const base = decimalValue.value.isInvalidate() ? getMiniDecimal(0) : decimalValue.value;
      const target = base.add(directionDecimal.toString());
      const updatedValue = triggerValueUpdate(target, false);
      (attrs as { onStep?: InputNumberProps['onStep'] }).onStep?.(
        getDecimalValue(props.stringMode === true, updatedValue) as number,
        {
          offset: shiftKey ? getDecupleSteps(mergedStep.value) : mergedStep.value,
          type: up ? 'up' : 'down',
          emitter,
        },
      );
      inputRef.value?.focus();
    }

    // ---- 事件（内部处理落根，rc 的绑定面）----
    function onKeyDown(event: KeyboardEvent): void {
      const { key, shiftKey: pressedShift } = event;
      userTyping = true;
      shiftKey = pressedShift;
      if (key === 'Enter') {
        if (!composition) {
          userTyping = false;
        }
        flushInputValue(false);
        (attrs as { onPressEnter?: InputNumberProps['onPressEnter'] }).onPressEnter?.(event);
      }
      if (props.keyboard === false) {
        return;
      }
      if (!composition && ['Up', 'ArrowUp', 'Down', 'ArrowDown'].includes(key)) {
        onInternalStep(key === 'Up' || key === 'ArrowUp', 'keyboard');
        event.preventDefault();
      }
    }
    function onKeyUp(): void {
      userTyping = false;
      shiftKey = false;
    }
    function onInternalInput(e: Event): void {
      collectInputValue((e.target as HTMLInputElement).value);
    }
    function onBlurInternal(): void {
      if (props.changeOnBlur !== false) {
        flushInputValue(false);
      }
      focus.value = false;
      userTyping = false;
    }
    function onInternalMouseDown(event: MouseEvent): void {
      if (inputRef.value && event.target !== inputRef.value) {
        inputRef.value.focus();
        event.preventDefault();
      }
      // 用户回调经 renderInner 的 userMouseDown 统一触发（避免双调）
    }

    // ---- wheel（非 passive）----
    watch(
      [() => props.changeOnWheel, focus],
      ([changeOnWheel, focused], _prev, onCleanup) => {
        if (!changeOnWheel || !focused) {
          return;
        }
        const onWheel = (event: WheelEvent): void => {
          onInternalStep(event.deltaY < 0, 'wheel');
          event.preventDefault();
        };
        const input = inputRef.value;
        if (input) {
          input.addEventListener('wheel', onWheel, { passive: false });
          onCleanup(() => {
            input.removeEventListener('wheel', onWheel);
          });
        }
      },
      { flush: 'post' },
    );

    // ---- 受控同步（useLayoutUpdateEffect 语义：更新才执行）----
    let mounted = false;
    onMounted(() => {
      mounted = true;
    });
    watch(
      () => props.value,
      (value) => {
        if (!mounted) {
          return;
        }
        const newValue = getMiniDecimal(value);
        decimalValue.value = newValue;
        const currentParsedValue = getMiniDecimal(mergedParser(inputValue.value));

        // `1.2` 键入到 `1.` 时不立即格式化；给了 formatter 则跟随外部
        if (!newValue.equals(currentParsedValue) || !userTyping || props.formatter) {
          setInputValue(newValue, userTyping);
        }
      },
    );
    watch(
      () => [props.precision, props.formatter],
      () => {
        if (!mounted) {
          return;
        }
        if (!decimalValue.value.isInvalidate()) {
          setInputValue(decimalValue.value, false);
        }
      },
    );

    // formatter 改写文本后恢复光标
    watch(inputValue, () => {
      if (props.formatter) {
        restoreCursor();
      }
    });

    // rAF 句柄在组件卸载时清理（rc 的 useEffect 清理等价物）
    onScopeDispose(() => {
      if (frameId !== null) {
        cancelRaf(frameId);
      }
    });

    // ---- expose ----
    expose({
      focus: (option?: { preventScroll?: boolean; cursor?: 'start' | 'end' | 'all' }) => {
        triggerFocus(inputRef.value, option);
      },
      blur: () => {
        inputRef.value?.blur();
      },
      get nativeElement() {
        return rootRef.value;
      },
    } satisfies InputNumberRef);

    // ========================== 语义化合并 ==============================
    const mergedProps = computed<InputNumberProps>(
      () =>
        ({
          ...props,
          size: mergedSize.value,
          disabled: mergedDisabled.value,
          controls: mergedControls.value,
        }) as InputNumberProps,
    );
    const { classNames: mergedClassNames, styles: mergedStyles } = useMergeSemantic<
      InputNumberProps,
      InputNumberSemanticClassNames,
      InputNumberSemanticStyles
    >(
      [
        () => context.classNames as InputNumberSemanticClassNames | undefined,
        () => props.classNames,
      ],
      [
        () => context.styles as InputNumberSemanticStyles | undefined,
        () => props.styles,
        () => semanticRootStyle(props.style),
      ],
      mergedProps.value,
    );

    // ---- 图标（mode=spinner 换 Plus/Minus）----
    const defaultUpIcon = computed(() => (props.mode === 'spinner' ? PlusOutlined : UpOutlined));
    const defaultDownIcon = computed(() =>
      props.mode === 'spinner' ? MinusOutlined : DownOutlined,
    );
    const customIcons = computed<InputNumberControls | null>(() =>
      isPlainObject(mergedControls.value) ? (mergedControls.value as InputNumberControls) : null,
    );

    // ============================ 渲染 ==============================
    function renderInner() {
      const mode = props.mode ?? 'input';
      const controlsEnabled = mergedControls.value !== false;

      const rootClass = [
        prefixCls.value,
        `${prefixCls.value}-mode-${mode}`,
        props.className,
        props.rootClassName,
        mergedClassNames.value.root,
        (context as { className?: string }).className,
        compactItemClassnames.value,
        getStatusClassNames(prefixCls.value, mergedStatus.value, hasFeedback.value),
        {
          [`${prefixCls.value}-${variant.value}`]: enableVariantCls.value,
          [`${prefixCls.value}-lg`]: mergedSize.value === 'large',
          [`${prefixCls.value}-sm`]: mergedSize.value === 'small',
          [`${prefixCls.value}-rtl`]: direction.value === 'rtl',
          [`${prefixCls.value}-in-form-item`]: isFormItemInput.value,
          [`${prefixCls.value}-without-controls`]: !controlsEnabled,
        },
        // rc 的 clsx 里 classNames?.root 在 wrapper 链之后再次出现（antd 产物如此）
        mergedClassNames.value.root,
        {
          [`${prefixCls.value}-focused`]: focus.value,
          [`${prefixCls.value}-disabled`]: mergedDisabled.value,
          [`${prefixCls.value}-readonly`]: props.readOnly === true,
          [`${prefixCls.value}-not-a-number`]: decimalValue.value.isNaN(),
          [`${prefixCls.value}-out-of-range`]:
            !decimalValue.value.isInvalidate() && !isInRange(decimalValue.value),
        },
      ];

      const rootStyle = styleAttrs(mergedStyles.value.root);

      // 根上的用户 mouse 事件（antd 落根）—— 兼容模板（onMousedown）/JSX（onMouseDown）键形
      const rootEventProps: Record<string, unknown> = {};
      for (const name of [
        'onMouseUp',
        'onMouseLeave',
        'onMouseMove',
        'onMouseEnter',
        'onMouseOut',
        'onClick',
      ]) {
        for (const key of [name, name.toLowerCase()]) {
          if (attrs[key] !== undefined) {
            rootEventProps[key] = attrs[key];
          }
        }
      }
      // mousedown：内部处理（焦点转移 + preventDefault）与用户回调都要执行（rc 顺序）
      const userMouseDown = (attrs.onMouseDown ?? attrs.onMousedown) as
        | ((e: MouseEvent) => void)
        | undefined;

      const upIcon = customIcons.value
        ? (asNode(customIcons.value.upIcon) ?? asNode(defaultUpIcon.value))
        : asNode(defaultUpIcon.value);
      const downIcon = customIcons.value
        ? (asNode(customIcons.value.downIcon) ?? asNode(defaultDownIcon.value))
        : asNode(defaultDownIcon.value);

      const upNode = () =>
        h(StepHandler, {
          prefixCls: prefixCls.value,
          action: 'up',
          disabled: upDisabled.value,
          node: upIcon,
          onStep: onInternalStep,
        });
      const downNode = () =>
        h(StepHandler, {
          prefixCls: prefixCls.value,
          action: 'down',
          disabled: downDisabled.value,
          node: downIcon,
          onStep: onInternalStep,
        });

      const children: ReturnType<typeof h>[] = [];
      if (mode === 'spinner' && controlsEnabled) {
        children.push(downNode());
      }
      if (props.prefix !== undefined) {
        children.push(
          h(
            'div',
            {
              key: 'prefix',
              class: [`${prefixCls.value}-prefix`, mergedClassNames.value.prefix],
              ...styleAttrs(mergedStyles.value.prefix),
            },
            [asNode(props.prefix)],
          ),
        );
      }
      children.push(
        h('input', {
          key: 'input',
          ref: inputRef,
          class: [`${prefixCls.value}-input`, mergedClassNames.value.input],
          ...styleAttrs(mergedStyles.value.input),
          autoComplete: 'off',
          role: 'spinbutton',
          'aria-valuemin': props.min,
          'aria-valuemax': props.max,
          'aria-valuenow': decimalValue.value.isInvalidate() ? null : decimalValue.value.toString(),
          step: mergedStep.value,
          value: inputValue.value,
          disabled: mergedDisabled.value,
          readOnly: props.readOnly === true,
          placeholder: props.placeholder,
          onInput: onInternalInput,
          ...restInputAttrs(),
        }),
      );
      if (props.suffix !== undefined || hasFeedback.value) {
        children.push(
          h(
            'div',
            {
              key: 'suffix',
              class: [`${prefixCls.value}-suffix`, mergedClassNames.value.suffix],
              ...styleAttrs(mergedStyles.value.suffix),
            },
            [
              asNode(props.suffix),
              hasFeedback.value ? asNode(formItemContext.value.feedbackIcon as never) : null,
            ].filter((node) => node !== null && node !== undefined),
          ),
        );
      }
      if (mode === 'spinner' && controlsEnabled) {
        children.push(upNode());
      } else if (mode === 'input' && controlsEnabled) {
        children.push(
          h(
            'div',
            {
              key: 'actions',
              class: [`${prefixCls.value}-actions`, mergedClassNames.value.actions],
              ...styleAttrs(mergedStyles.value.actions),
            },
            [upNode(), downNode()],
          ),
        );
      }

      return h(
        'div',
        {
          ref: rootRef,
          class: rootClass,
          ...rootStyle,
          onMousedown: (e: MouseEvent) => {
            onInternalMouseDown(e);
            userMouseDown?.(e);
          },
          onFocusin: () => {
            focus.value = true;
          },
          onFocusout: () => {
            onBlurInternal();
          },
          onKeydown: onKeyDown,
          onKeyup: onKeyUp,
          onCompositionstart: () => {
            composition = true;
          },
          onCompositionend: () => {
            composition = false;
            collectInputValue(inputRef.value?.value ?? '');
          },
          onBeforeinput: () => {
            userTyping = true;
          },
          ...rootEventProps,
        },
        children,
      );
    }

    // rc 把「未消费的 restProps」透传给 input；根事件已挑走、声明 props 已消费，其余进 input
    function restInputAttrs(): Record<string, unknown> {
      const reserved = new Set([
        'class',
        'style',
        // 声明 props（Vue 已从 attrs 剥离，防御性再列一层）
        'prefixCls',
        'rootClassName',
        'className',
        'size',
        'disabled',
        'prefix',
        'suffix',
        'bordered',
        'status',
        'controls',
        'variant',
        'addonBefore',
        'addonAfter',
        'onPressEnter',
        'onStep',
        'onChange',
        'value',
        'defaultValue',
        'min',
        'max',
        'step',
        'keyboard',
        'changeOnBlur',
        'changeOnWheel',
        'readOnly',
        'autoFocus',
        'stringMode',
        'formatter',
        'parser',
        'precision',
        'decimalSeparator',
        'placeholder',
        'mode',
        'classNames',
        'styles',
        'onInput',
        ...[
          'onMouseDown',
          'onMouseUp',
          'onMouseLeave',
          'onMouseMove',
          'onMouseEnter',
          'onMouseOut',
          'onClick',
        ].flatMap((n) => [n, n.toLowerCase()]),
      ]);
      const rest: Record<string, unknown> = {};
      for (const key of Object.keys(attrs)) {
        if (!reserved.has(key)) {
          rest[key] = attrs[key];
        }
      }
      return rest;
    }

    return () => renderInner();
  },
});

/**
 * InputNumber 外层（antd 的第二个 forwardRef 层）。
 *
 * 为什么必须是两层（Vue 平台约束，PLATFORM）：
 * antd 的 legacy addon 分支把 Internal 升为 `Space.Compact` 的**子级**渲染，
 * 而 `useCompactItemContext` 在 Vue 里是 **setup 期 inject 快照** —— 若单层实现，
 * inject 发生在 Compact 的 provide 之前，紧凑项类名永远拿不到（实测：addon
 * 用例的 `-compact-item` 缺失）。所以 Internal 必须作为 Compact 的子组件渲染。
 */
export const InputNumberComponent = defineComponent({
  name: 'AInputNumber',
  inheritAttrs: false,
  props: inputNumberPropDefs,
  emits: ['update:value'],
  setup(props, { attrs, emit, expose }) {
    const devWarning = useDevWarning('InputNumber');
    const { getPrefixCls } = useComponentConfig('inputNumber');
    const formItemContext = useFormItemInputContext();
    const internalRef = ref<{
      focus: InputNumberRef['focus'];
      blur: InputNumberRef['blur'];
      nativeElement: HTMLDivElement | null;
    } | null>(null);

    // ============================ Warning ==============================
    watchEffect(() => {
      // devWarning 的语义：valid=false 才打印 ⇒ 「提供了 deprecated prop」必须取反。
      // ⚠️ 判据是 `!== undefined`（Vue props 恒含全部声明键，PITFALLS 13）。
      devWarning.deprecated(props.bordered === undefined, 'bordered', 'variant');
      devWarning.deprecated(props.addonBefore === undefined, 'addonBefore', 'Space.Compact');
      devWarning.deprecated(props.addonAfter === undefined, 'addonAfter', 'Space.Compact');
      devWarning(
        !(attrs.type === 'number' && props.changeOnWheel),
        'When `type=number` is used together with `changeOnWheel`, changeOnWheel may not work properly. Please delete `type=number` if it is not necessary.',
      );
    });

    // ============================= Prefix ==============================
    const prefixCls = computed(() => getPrefixCls('input-number', props.prefixCls));

    // ============================ Status ===============================
    const mergedStatus = computed(() =>
      getMergedStatus(formItemContext.value.status, props.status),
    );

    // ======================= legacy addon（deprecated）=================
    const hasLegacyAddon = computed(
      () => props.addonBefore !== undefined || props.addonAfter !== undefined,
    );

    const renderAddon = (node: VNodeLike | undefined) => {
      if (node === undefined || node === null) {
        return null;
      }
      return h(
        SpaceAddon,
        {
          className: `${prefixCls.value}-addon`,
          variant: props.variant,
          disabled: props.disabled,
          status: mergedStatus.value,
        },
        { default: () => [asNode(node)] },
      );
    };

    expose({
      focus: (option?: { preventScroll?: boolean; cursor?: 'start' | 'end' | 'all' }) => {
        internalRef.value?.focus(option);
      },
      blur: () => {
        internalRef.value?.blur();
      },
      get nativeElement() {
        return internalRef.value?.nativeElement ?? null;
      },
    } satisfies InputNumberRef);

    return () => {
      // Internal：受控/非受控引擎 + 状态机（attrs 透传给 input，rc 的 restProps 语义）
      const inner = h(InputNumberInternalComponent, {
        ...props,
        ...attrs,
        ref: internalRef as never,
        key: undefined,
        prefixCls: prefixCls.value,
        rootClassName: hasLegacyAddon.value ? undefined : props.rootClassName,
        status: mergedStatus.value,
        'onUpdate:value': (v: string | number | null) => emit('update:value', v),
      } as never);
      if (hasLegacyAddon.value) {
        return h(
          SpaceCompact,
          { rootClassName: props.rootClassName },
          { default: () => [renderAddon(props.addonBefore), inner, renderAddon(props.addonAfter)] },
        );
      }
      return inner;
    };
  },
});
