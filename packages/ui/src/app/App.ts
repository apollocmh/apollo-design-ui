/**
 * App —— antd `components/app/App.tsx`（122 行）的 Vue 版。
 *
 * 职责：包裹应用根，向子树提供 message/notification/modal 的 HookAPI
 * （useApp()）并沿树合并 AppConfig。
 *
 * 接线（Issue #40）：三个 HookAPI 由各自的 `useMessage` / `useNotification` /
 * `Modal.useModal()` 提供，holder 与 `<Component>` 同级渲染 ⇒ 每个 App 实例
 * 自带一套通知容器（嵌套 App 互相隔离、随 App 卸载而销毁）。
 */
import {
  computed,
  defineComponent,
  Fragment,
  h,
  type PropType,
  provide,
  reactive,
  type VNodeChild,
  watchEffect,
} from 'vue';
import {
  type AppConfig,
  appConfigContextKey,
  appContextKey,
  injectAppConfig,
  type UseAppProps,
} from '../_internal/app-context';
import { useComponentConfig } from '../config-provider/context';
import useMessage from '../message/useMessage';
import useModal from '../modal/useModal';
import useNotification from '../notification/useNotification';
import type { AppComponentType, AppProps } from './interface';

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
    const config = useComponentConfig('app');
    const prefixCls = computed(() => props.prefixCls ?? config.getPrefixCls('app'));

    // AppConfig 沿树合并（antd 的 useMemo 同款浅合并）
    const parentConfig = injectAppConfig();
    const mergedAppConfig = computed(() => ({
      message: { ...parentConfig.message, ...props.message },
      notification: { ...parentConfig.notification, ...props.notification },
    }));

    /**
     * ⚠️ **不能** provide `mergedAppConfig.value`（Issue #41）：那是 setup 期的
     *    **快照对象**，之后改 `message` / `notification` props，已经注入的子孙
     *    拿到的还是挂载那一刻的值。
     *
     *    与 `ConfigProvider` 的 `config` 同范式：provide 一个**引用恒定**的
     *    reactive 对象、内容由 `watchEffect` 打补丁 —— `inject` 只在 setup 期解析
     *    一次，「引用恒定」是硬约束。
     */
    const appConfig = reactive<AppConfig>({ ...mergedAppConfig.value });
    watchEffect(() => {
      Object.assign(appConfig, mergedAppConfig.value);
    });

    // ======================== HookAPI（Issue #40）========================
    //
    // 上游 antd `App.tsx` 就是「三个 useXxx + 三个 contextHolder」：
    //   `useMessage(mergeConfig)` / `useNotification(mergeConfig)` / `Modal.useModal()`
    // 三者的 holder 与 `<Component>` **同级**（都在 App 的 Fragment 里），
    // 于是隔离到本 App 实例：嵌套 App 各用各的、ConfigProvider 的配置也能吃到。
    //
    // ⚠️ 配置必须传 **getter**（`() => mergedAppConfig.value.message`）：
    //    传裸值会把首帧配置钉死（同 `useSize(props.size)` 那一族，PITFALLS 163）。
    const [messageApi, messageHolder] = useMessage(() => mergedAppConfig.value.message);
    const [notificationApi, notificationHolder] = useNotification(
      () => mergedAppConfig.value.notification,
    );
    const [modalApi, modalHolder] = useModal();

    const api: UseAppProps = {
      message: messageApi,
      notification: notificationApi,
      modal: modalApi,
    } as unknown as UseAppProps;
    provide(appContextKey, api);
    provide(appConfigContextKey, appConfig);

    // 根 `class` / `style` 是 Vue 原生 attrs（不再有 className/rootClassName/style Props）。
    const hasRootProps = Boolean(attrs.class || attrs.style);
    if (props.component === false && hasRootProps) {
      console.error(
        '[Warning] [antd: App] When using cssVar, ensure `component` is assigned a valid React component string.',
      );
    }

    return () => {
      const children = [slots.default?.() as VNodeChild].filter(
        (c) => c !== null && c !== undefined,
      );

      // ⚠️ 三个 holder 与 `<Component>` **同级**（上游 App.tsx 同结构）——
      //    放进去会污染 `<Component>` 的子节点契约（L4 会看到多出的节点）。
      const nodes: VNodeChild[] = [
        messageHolder() as VNodeChild,
        notificationHolder() as VNodeChild,
        modalHolder as VNodeChild,
      ];

      if (props.component === false) {
        nodes.push(...children);
        return h(Fragment, null, nodes);
      }

      nodes.push(
        h(
          props.component as 'div',
          {
            ...attrs,
            class: [
              prefixCls.value,
              attrs.class,
              config.direction === 'rtl' ? `${prefixCls.value}-rtl` : undefined,
            ],
          },
          children,
        ),
      );
      return h(Fragment, null, nodes);
    };
  },
});

export default App;
