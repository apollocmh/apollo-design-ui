import {
  type ComputedRef,
  computed,
  defineComponent,
  getCurrentInstance,
  type InjectionKey,
  inject,
  onMounted,
  onUnmounted,
  type PropType,
  provide,
  type Ref,
  ref,
  type SlotsType,
  type VNodeChild,
  type WatchStopHandle,
  watch,
} from 'vue';
import { applyCSSVar, createCSSVarScope, DEFAULT_CSS_VAR_PREFIX } from './css-var';
import { getDesignToken } from './get-design-token';
import type { AliasToken, ThemeConfig } from './types';

/**
 * Vue 绑定层。
 *
 * 分文件是为了让「纯函数派生」与「Vue 接线」在**源码层**可分辨：
 * `getDesignToken` 及其依赖不 import vue，读代码时能一眼看出派生链是框架无关的。
 *
 * 公共根入口同时导出 Vue 绑定，Vue 已声明为 peerDependency。
 * 发布构建保留模块，不在这里承诺一个未声明的独立纯函数子路径。
 */

export interface ThemeContext {
  /** 当前生效的 ThemeConfig（可写，用于运行时换主题） */
  config: Ref<ThemeConfig>;
  /** 完整 token（随 config 变化重算） */
  token: ComputedRef<AliasToken>;
  /** Internal source identity. Missing metadata denotes an explicitly provided context. */
  readonly sourceActive?: Readonly<Ref<boolean>>;
}

export const ThemeContextKey: InjectionKey<ThemeContext> = Symbol('apollo-theme');

/**
 * 创建主题 context。
 *
 * token 用 `computed` 而不是每次渲染重算：`getDesignToken` 要跑三套色板生成，
 * 每个组件都算一遍会明显掉帧。
 */
function createContext(config: ThemeConfig, fallback = false): ThemeContext {
  const cfg = ref<ThemeConfig>(config);
  const token = computed<AliasToken>(() => getDesignToken(cfg.value));
  const sourceActive = computed(() => !fallback || Object.keys(cfg.value).length > 0);
  return { config: cfg, token, sourceActive };
}

export function createThemeContext(config: ThemeConfig): ThemeContext {
  return createContext(config);
}

/**
 * 无 Provider 时同一 Vue app 共用默认 context，不同 app/SSR 请求互相隔离。
 * 惰性创建：模块加载时就跑一遍 getDesignToken 会拖慢首屏，而很多场景根本用不到。
 */
const appContexts = new WeakMap<object, ThemeContext>();
function getDefaultContext(): ThemeContext {
  const app = getCurrentInstance()?.appContext;
  if (!app) return createContext({}, true);
  let context = appContexts.get(app);
  if (!context) {
    context = createContext({}, true);
    appContexts.set(app, context);
  }
  return context;
}

/**
 * 在子组件中取主题。没有 Provider 时回落到默认主题（不抛错，方便单测与渐进接入）。
 *
 * ⚠️ 第三个参数 `true` 不能省：`inject` 只有在显式声明「默认值是工厂」时才会调用它，
 * 否则会**把函数本身当成默认值返回** —— 表现为 `useTheme().token` 是 undefined，
 * 而且不报类型错（TS 看到的是 ThemeContext）。已踩过一次。
 */
export function useTheme(): ThemeContext {
  return inject(ThemeContextKey, getDefaultContext, true);
}

/** 只要 token 的快捷方式 */
export function useToken(): ComputedRef<AliasToken> {
  return useTheme().token;
}

/** 一次性把 token 写到某个元素上（无 Provider 的场景，如 SSR 后的客户端补挂） */
export function injectTokenCssVar(
  el: HTMLElement | SVGElement,
  token: Partial<AliasToken>,
  prefix = DEFAULT_CSS_VAR_PREFIX,
): void {
  applyCSSVar(el, token, prefix);
}

function copyConfig(config: ThemeConfig): ThemeConfig {
  return {
    ...config,
    ...(config.token ? { token: { ...config.token } } : {}),
    ...(config.components
      ? {
          components: Object.fromEntries(
            Object.entries(config.components).map(([name, tokens]) => [name, { ...tokens }]),
          ),
        }
      : {}),
    ...(Array.isArray(config.algorithm) ? { algorithm: [...config.algorithm] } : {}),
  };
}

/**
 * ThemeProvider。
 *
 * `injectCssVar` 打开时把 token 以 CSS 变量写入 `target`（默认 `document.documentElement`）。
 * 这就是开放决策 `zero-runtime-mode = B` 里的「运行时注入路径」——
 * 静态 CSS 是默认路径，这条服务于运行时换主题。
 *
 * 卸载时移除写过的全部变量：不清理的话 HMR 与路由切换后会残留上一份主题的值。
 */
export const ThemeProvider = defineComponent({
  name: 'AThemeProvider',
  inheritAttrs: false,
  props: {
    theme: { type: Object as PropType<ThemeConfig>, default: (): ThemeConfig => ({}) },
    injectCssVar: { type: Boolean, default: false },
    target: { type: Object as PropType<HTMLElement | SVGElement | null>, default: undefined },
  },
  slots: Object as SlotsType<{ default?: () => VNodeChild }>,
  setup(props, { slots }) {
    const ctx = createThemeContext(copyConfig(props.theme));
    provide(ThemeContextKey, ctx);

    watch(
      () => props.theme,
      (next) => {
        ctx.config.value = copyConfig(next);
      },
      { deep: true },
    );

    let stopInjection: WatchStopHandle | undefined;
    onMounted(() => {
      stopInjection = watch(
        [
          () => props.injectCssVar,
          () => props.target,
          () => ctx.config.value.cssVarPrefix ?? DEFAULT_CSS_VAR_PREFIX,
          ctx.token,
        ],
        ([enabled, target, prefix, token], _previous, onCleanup) => {
          if (!enabled) return;
          const scope = createCSSVarScope(target ?? document.documentElement, prefix);
          scope.apply(token);
          onCleanup(() => scope.remove());
        },
        { immediate: true, flush: 'post' },
      );
    });

    onUnmounted(() => stopInjection?.());

    return (): unknown => slots.default?.();
  },
});
