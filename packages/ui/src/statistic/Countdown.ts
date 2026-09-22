/**
 * Countdown —— `Statistic.Countdown`（antd 的 `es/statistic/Countdown.js`）。
 *
 * **整个组件在 6.x 已 `@deprecated`**（→ `<Statistic.Timer type="countdown" />`）——
 * 仍按契约逐字实现：转发 Timer + 固定注入 `type:'countdown'`，dev 期告警照发
 * （antd 在 render 期每次渲染都发；我们在 setup 期发一次，back-top 范式）。
 *
 * React 侧是 `memo(Countdown)` —— props 原样透传，Vue 无需 memo 等价物。
 */

import { useDevWarning } from '@apollo-design/utils';
import { defineComponent, h } from 'vue';
import Timer from './Timer';

export default defineComponent({
  name: 'ACountdown',
  inheritAttrs: false,
  setup(_, { attrs }) {
    const warning = useDevWarning('Countdown');
    warning.deprecated(false, '<Statistic.Countdown />', '<Statistic.Timer type="countdown" />');
    return () => h(Timer, { ...attrs, type: 'countdown' } as never);
  },
});
