/**
 * App —— antd `components/app/App.tsx`（122 行）的 Vue 版。
 *
 * 职责：包裹应用根，向子树提供 message/notification/modal 的 HookAPI
 * （useApp()）并沿树合并 AppConfig。message/notification/modal 未落地
 * （v1）：API 为 stub（调用即 dev 警告 + no-op），contextHolder 渲染 null；
 * 三者落地后回填（PENDING-2，registry notes）。
 */
import {
  computed,
  defineComponent,
  Fragment,
  h,
  type PropType,
  provide,
  type VNodeChild,
} from 'vue';
import {
  appConfigContextKey,
  appContextKey,
  injectAppConfig,
  type UseAppProps,
} from '../_internal/app-context';
import { useComponentConfig } from '../config-provider/context';
import type { AppComponentType, AppProps } from './interface';

/** v1 stub API：方法调用即 dev 警告（message/modal/notification 落地后回填）。 */
function createStubApi(name: string, methods: string[]): UseAppProps['message'] {
  const api: Record<string, unknown> = {};
  for (const method of methods) {
    api[method] = (..._args: never[]) => {
      console.error(
        `[Warning] [antd: App] \`${method}\` is not available yet: the \`${name}\` component is not implemented in this build. It will be wired once \`${name}\` lands.`,
      );
    };
  }
  return api as UseAppProps['message'];
}

const stubMessage = createStubApi('message', [
  'success',
  'error',
  'info',
  'warning',
  'loading',
  'open',
  'destroy',
]);
const stubNotification = createStubApi('notification', [
  'success',
  'error',
  'info',
  'warning',
  'open',
  'destroy',
]);
const stubModal = createStubApi('modal', ['info', 'success', 'error', 'warning', 'confirm']);

const App = defineComponent({
  name: 'AApp',
  inheritAttrs: false,
  props: {
    prefixCls: { type: String, default: undefined },
    component: {
      type: [String, Boolean] as PropType<AppComponentType>,
      default: 'div' as AppComponentType,
    },
    message: { type: Object as PropType<AppProps['message']>, default: undefined },
    notification: { type: Object as PropType<AppProps['notification']>, default: undefined },
  },
  setup(props, { slots, attrs }) {
    const { getPrefixCls, direction } = useComponentConfig('app');
    const prefixCls = props.prefixCls ?? getPrefixCls('app');

    // AppConfig 沿树合并（antd 的 useMemo 同款浅合并）
    const parentConfig = injectAppConfig();
    const mergedAppConfig = computed(() => ({
      message: { ...parentConfig.message, ...props.message },
      notification: { ...parentConfig.notification, ...props.notification },
    }));

    // v1 stub API（message/modal/notification 落地后由各自 useXxx 提供）
    const api: UseAppProps = {
      message: stubMessage,
      notification: stubNotification,
      modal: stubModal,
    };
    provide(appContextKey, api);
    provide(appConfigContextKey, mergedAppConfig.value);

    // 根 `class` / `style` 是 Vue 原生 attrs（不再有 className/rootClassName/style Props）。
    const hasRootProps = Boolean(attrs.class || attrs.style);
    if (props.component === false && hasRootProps) {
      console.error(
        '[Warning] [antd: App] When using cssVar, ensure `component` is assigned a valid React component string.',
      );
    }

    return () => {
      const children = slots.default?.();
      if (props.component === false) {
        return h(
          Fragment,
          null,
          [children as VNodeChild].filter((c) => c !== null && c !== undefined),
        );
      }
      return h(
        props.component as 'div',
        {
          ...attrs,
          class: [prefixCls, attrs.class, direction === 'rtl' ? `${prefixCls}-rtl` : undefined],
        },
        [children as VNodeChild].filter((c) => c !== null && c !== undefined),
      );
    };
  },
});

export default App;
