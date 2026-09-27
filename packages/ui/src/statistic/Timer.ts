/**
 * StatisticTimer —— `Statistic.Timer`（antd 的 `es/statistic/Timer.js`）。
 *
 * 契约来源逐条（G1 §2.8–2.9）：
 *
 * 1. **interval = `1000/60`**（≈16.67ms，逐帧节奏）—— 数值逐字保留。
 * 2. **update()**：`timeDiff = down ? timestamp - now : now - timestamp` →
 *    `onChange(timeDiff)`；**onFinish 仅 countdown 且 timestamp < now**，
 *    返回 false ⇒ clearInterval（onFinish 只触发一次 —— 测试钉住）。
 * 3. **首帧渲染 `'-'`**：React 的 `showTime` state 初始 null，formatter 在
 *    showTime 置位前返回 `'-'`（SSR 测试钉住）。置位发生在 **onMounted**
 *    （React 的 `useEffect(() => setShowTime({}), [])`）—— 不能在 setup 期同步
 *    置位，否则 SSR 首帧就不是 `'-'` 了。
 * 4. **valueRender 克隆 valueNode 去掉 title**：`cloneVNode(node, {title: undefined})`
 *    —— 上游 `cloneElement(node, {title: undefined})` 逐字对应（Number 不消费
 *    title，克隆是防御性的，保留）。
 * 5. **value 用 `new Date(value).getTime()`**：countdown 传未来时刻、countup 传
 *    过去时刻；`Date.now()` 每帧重取。
 *
 * ⚠️ effect 依赖 `[value, down]`：value 变化要重启 interval —— Vue 用
 *    `watch(..., {immediate})` + `onCleanup` 清理（对应组件卸载与重跑）。
 *
 * ⚠️ attrs 透传（PLATFORM）：antd 用 `{...rest}` 转发 className/style 到 Statistic
 *    的同名 prop；Vue 的 `class` / `style` 恒落 attrs 且会被 Statistic 的
 *    pickAttrs 过滤 —— 这里显式映射 `class→className`、`style→style`，
 *    其余 attrs（aria/data/…）原样转发。
 */

import {
  cloneVNode,
  defineComponent,
  h,
  onMounted,
  type PropType,
  ref,
  type VNode,
  watch,
} from 'vue';
import type { StatisticTimerProps, TimerType } from './interface';
import Statistic from './Statistic';
import { formatCounter } from './utils';

/** 与 antd 的 UPDATE_INTERVAL 逐字一致。 */
const UPDATE_INTERVAL = 1000 / 60;

function getTime(value: NonNullable<StatisticTimerProps['value']>): number {
  return new Date(value).getTime();
}

export default defineComponent({
  name: 'AStatisticTimer',
  inheritAttrs: false,
  props: {
    /* --- Statistic 全量 props（转发） --- */
    prefixCls: { type: String, default: undefined },
    className: { type: String, default: undefined },
    rootClassName: { type: String, default: undefined },
    style: { type: Object as PropType<Record<string, string | number>>, default: undefined },
    value: { type: [Number, String], default: 0 },
    valueStyle: {
      type: Object as PropType<Record<string, string | number>>,
      default: undefined,
    },
    valueRender: { type: Function, default: undefined },
    title: { type: null, default: undefined },
    prefix: { type: null, default: undefined },
    suffix: { type: null, default: undefined },
    loading: { type: Boolean, default: false },
    formatter: { type: [Boolean, String, Function], default: undefined },
    precision: { type: Number, default: undefined },
    decimalSeparator: { type: String, default: '.' },
    groupSeparator: { type: String, default: ',' },
    onMouseenter: { type: Function, default: undefined },
    onMouseleave: { type: Function, default: undefined },
    classNames: { type: [Object, Function], default: undefined },
    styles: { type: [Object, Function], default: undefined },
    /* --- Timer 专属 --- */
    type: { type: String as PropType<TimerType>, required: true },
    format: { type: String, default: 'HH:mm:ss' },
    onFinish: { type: Function as PropType<() => void>, default: undefined },
    onChange: {
      type: Function as PropType<StatisticTimerProps['onChange']>,
      default: undefined,
    },
  },
  setup(props, { attrs }) {
    const down = props.type === 'countdown';

    // React 复用 state 做 forceUpdate：null ⇒ 首帧（含 SSR）渲染 '-'
    const showTime = ref<object | null>(null);

    const update = (): boolean => {
      const now = Date.now();
      const timestamp = getTime(props.value);
      showTime.value = {};
      const timeDiff = !down ? now - timestamp : timestamp - now;
      props.onChange?.(timeDiff);
      // Only countdown will trigger `onFinish`
      if (down && timestamp < now) {
        props.onFinish?.();
        return false;
      }
      return true;
    };

    // Effect trigger（React useEffect [value, down]）
    watch(
      () => [props.value, down] as const,
      (_, __, onCleanup) => {
        let intervalId: number | undefined;
        const tick = () => {
          if (!update()) {
            window.clearInterval(intervalId);
          }
        };
        const startTimer = () => {
          intervalId = window.setInterval(tick, UPDATE_INTERVAL);
        };
        startTimer();
        onCleanup(() => {
          window.clearInterval(intervalId);
        });
      },
      { immediate: true },
    );

    // React useEffect []：挂载后立即置位 showTime（首帧渲染在置位之前）
    onMounted(() => {
      showTime.value = {};
    });

    // ======================== Format ========================
    const formatter = (
      formatValue: number | string,
      config: Parameters<typeof formatCounter>[1],
    ) =>
      showTime.value ? formatCounter(formatValue, { ...config, format: props.format }, down) : '-';

    // ======================== Render ========================
    return () => {
      const { class: attrClass, style: attrStyle, ...restAttrs } = attrs;
      return h(
        Statistic,
        {
          ...restAttrs,
          /* --- Statistic 全量 props 逐字转发（antd 的 {...rest}） --- */
          prefixCls: props.prefixCls,
          rootClassName: props.rootClassName,
          title: props.title,
          prefix: props.prefix,
          suffix: props.suffix,
          loading: props.loading,
          precision: props.precision,
          decimalSeparator: props.decimalSeparator,
          groupSeparator: props.groupSeparator,
          valueStyle: props.valueStyle,
          classNames: props.classNames,
          styles: props.styles,
          onMouseenter: props.onMouseenter,
          onMouseleave: props.onMouseleave,
          /* --- className / style：prop 优先，attrs 兜底（见文件头 PLATFORM 条） --- */
          className: props.className ?? ((attrClass as string | undefined) || undefined),
          style: (props.style ?? attrStyle) as never,
          /* --- Timer 注入 --- */
          value: props.value,
          formatter: formatter as NonNullable<StatisticTimerProps['formatter']>,
        } as never,
        {
          // C8-R2：Statistic 的 valueRender prop 已删 —— 注入改走 `#valueRender`
          // 作用域插槽：先 clone 去掉 title（antd cloneElement 逐字），再交给
          // 用户（若传了已废弃的 valueRender fn prop）。
          valueRender: ({ node }: { node: VNode }) => {
            const cloned = cloneVNode(node, { title: undefined });
            return props.valueRender ? props.valueRender(cloned) : cloned;
          },
        },
      );
    };
  },
});
