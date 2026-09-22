/**
 * ErrorBoundary —— `Alert.ErrorBoundary`（antd 的 `es/alert/ErrorBoundary.js`）。
 *
 * 契约来源逐条（G1 §2.10）：
 *
 * 1. 捕获后代渲染错误 ⇒ 渲染 `Alert type="error"`（title ?? error.toString()，
 *    description ?? 组件栈，组件栈渲染在 `<pre style="font-size:0.9em;
 *    overflow-x:auto">` 里）；无错误 ⇒ 渲染默认插槽。
 * 2. React 用 class 组件 componentDidCatch；Vue 侧等价物是 **onErrorCaptured**
 *    （捕获后代组件的错误，return false 阻断向上传播 —— 对应 React 错误边界
 *    「吞掉错误」的语义）。
 * 3. ⚠️ 平台差异（PLATFORM）：onErrorCaptured 只捕获后代组件渲染/生命周期钩子
 *    里的错误；React 的边界还会捕获事件处理器错误 —— Vue 的事件错误本就不进
 *    边界，逐字保留 Vue 语义。
 * 4. `props.title ?? props.message` 的合并（message @deprecated）与 Alert 同判。
 * 5. 只在 dev 期透传 Vue 自身的告警（antd 的 errSpy 断言不适用 —— Vue 渲染错误
 *    走 errorHandler 链路）。
 */

import { isNonNullable } from '@apollo-design/utils';
import { defineComponent, h, onErrorCaptured, type PropType, ref, type VNodeChild } from 'vue';
import Alert from './Alert';

export default defineComponent({
  name: 'AAlertErrorBoundary',
  inheritAttrs: false,
  props: {
    title: { type: null as unknown as PropType<VNodeChild>, default: undefined },
    message: { type: null as unknown as PropType<VNodeChild>, default: undefined },
    description: { type: null as unknown as PropType<VNodeChild>, default: undefined },
    id: { type: String, default: undefined },
  },
  setup(props, { slots }) {
    const error = ref<unknown>(undefined);
    const info = ref<{ componentStack?: string }>({});

    onErrorCaptured((err, _instance, componentInfo) => {
      error.value = err;
      info.value = { componentStack: componentInfo };
      // return false ⇒ 阻断继续向上传播（React 错误边界的「吞掉」语义）
      return false;
    });

    return () => {
      const mergedTitle: VNodeChild = props.title ?? props.message;
      const componentStack = info.value.componentStack ?? null;
      const errorMessage = isNonNullable(mergedTitle) ? mergedTitle : String(error.value);
      // antd 逐字：description prop 直接渲染；只有「组件栈」形态才包 <pre>
      const errorDescription: VNodeChild =
        props.description !== undefined
          ? props.description
          : h('pre', { style: { fontSize: '0.9em', overflowX: 'auto' } }, [
              componentStack as VNodeChild,
            ]);

      if (error.value) {
        return h(
          Alert,
          { id: props.id, type: 'error', title: errorMessage },
          { description: () => [errorDescription] },
        );
      }
      return slots.default?.();
    };
  },
});
