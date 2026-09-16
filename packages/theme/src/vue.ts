import {
  type ComputedRef,
  computed,
  defineComponent,
  type InjectionKey,
  inject,
  onUnmounted,
  type PropType,
  provide,
  type Ref,
  shallowRef,
  watch,
} from 'vue';
import {
  applyCSSVar,
  type CSSVarScope,
  createCSSVarScope,
  DEFAULT_CSS_VAR_PREFIX,
} from './css-var';
import { getDesignToken } from './get-design-token';
import type { AliasToken, ThemeConfig } from './types';

/**
 * Vue 绑定层。
 *
 * 分文件是为了让「纯函数派生」与「Vue 接线」在**源码层**可分辨：
 * `getDesignToken` 及其依赖不 import vue，读代码时能一眼看出派生链是框架无关的。
 *
 * 但产物层做不到隔离：裁决 `build-output-contract = A` 之下本包只有 `dist/` 单文件入口，
 * `vue.ts` 必须从 index 导出，因此 import 本包就会带上 vue。
 * vue 已声明为 peerDependency，对本项目不是问题；
 * 若将来要支持「无 vue 的 Node 侧静态 CSS 生成」，需要重新开一个决策（多入口 vs 拆包）。
 */

export interface ThemeContext {
  /** 当前生效的 ThemeConfig（可写，用于运行时换主题） */
  config: Ref<ThemeConfig>;
  /** 完整 token（随 config 变化重算） */
  token: ComputedRef<AliasToken>;
}

export const ThemeContextKey: InjectionKey<ThemeContext> = Symbol('apollo-theme');

/**
 * 创建主题 context。
 *
 * token 用 `computed` 而不是每次渲染重算：`getDesignToken` 要跑三套色板生成，
 * 每个组件都算一遍会明显掉帧。
 */
export function createThemeContext(config: ThemeConfig): ThemeContext {
  const cfg = shallowRef<ThemeConfig>(config);
  const token = computed<AliasToken>(() => getDesignToken(cfg.value));
  return { config: cfg, token };
}

/**
 * 无 Provider 时共用的默认 context。
 * 惰性创建：模块加载时就跑一遍 getDesignToken 会拖慢首屏，而很多场景根本用不到。
 */
let defaultContext: ThemeContext | null = null;
function getDefaultContext(): ThemeContext {
  defaultContext ??= createThemeContext({});
  return defaultContext;
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
  el: HTMLElement,
  token: AliasToken,
  prefix = DEFAULT_CSS_VAR_PREFIX,
): void {
  applyCSSVar(el, token, prefix);
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
  props: {
    theme: { type: Object as PropType<ThemeConfig>, default: (): ThemeConfig => ({}) },
    injectCssVar: { type: Boolean, default: false },
    target: { type: Object as PropType<HTMLElement>, default: undefined },
  },
  setup(props, { slots }) {
    const ctx = createThemeContext(props.theme);
    provide(ThemeContextKey, ctx);

    let scope: CSSVarScope | null = null;

    if (props.injectCssVar) {
      const el = props.target ?? document.documentElement;
      if (el) {
        scope = createCSSVarScope(el, props.theme.cssVarPrefix ?? DEFAULT_CSS_VAR_PREFIX);
        scope.apply(ctx.token.value);
      }
    }

    watch(
      () => props.theme,
      (next) => {
        ctx.config.value = next;
      },
      { deep: true },
    );

    watch(ctx.token, (token) => {
      scope?.apply(token);
    });

    onUnmounted(() => scope?.remove());

    return (): unknown => slots.default?.();
  },
});
