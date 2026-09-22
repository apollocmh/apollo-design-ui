/**
 * ConfigProvider —— 全库的**运行时网关**。
 *
 * 契约来源：antd 6.6.4 的 `components/config-provider/index.tsx`（805 行）。
 * 行为规格逐条见 `docs/analysis/config-provider.md` §4，有意差异见 §9 与 `README.md`。
 *
 * ── 为什么是 `.ts` 渲染函数而不是 `.vue` SFC（`COMPONENT-RULES.md` §2 条件 2）─────
 *
 * 本组件的渲染树是**数据驱动的动态嵌套**：按 `locale` / `form.validateMessages` /
 * `theme` 三个条件决定要不要包三层 Provider，且顺序固定。模板表达不了
 * 「条件性地把 children 包进 N 层」，用 `<component :is>` 嵌套反而更难读。
 * 同目录的 `Spin` / `Empty` 也有同形态的内部件（`components/*.ts`），写法一致。
 *
 * ── 三条最容易写错、且都已被测试钉住的判据 ──────────────────────────────────────
 *
 *   1. **`components` 必须逐组件名合并**，不能整体替换。antd 的 `config` 是
 *      `{...parentContext}` 后**逐键**覆盖（`index.tsx:588-594`）；我们把 56 个组件
 *      配置收进了**一个** map 字段，整体替换会把父级的组件配置全丢掉 ——
 *      嵌套 provider 只给一部分配置时就会静默丢配置（50 个组件都会继承这个 bug）。
 *   2. **`undefined` 不覆盖**（同上）：本层 prop 为 `undefined` 时要回落父级值，
 *      而且「本层曾经设过、现在改回 `undefined`」也要回落到父级值 ——
 *      所以每次都是「从父级重算全量」再打补丁，不是增量改。
 *   3. **`componentSize` 用 `||`、`componentDisabled` 用 `??`**（`SizeContext.tsx:17` /
 *      `DisabledContext.tsx:16`）：`componentDisabled={false}` 必须能显式关闭父级的
 *      `true`，用 `||` 就会失效。两个判据不能统一。
 */

import { FormProvider } from '@apollo-design/form-core';
import type { Locale } from '@apollo-design/locale';
import { ANT_MARK, defaultLocale, LocaleProvider } from '@apollo-design/locale';
import {
  createCSSVarScope,
  DEFAULT_CSS_VAR_PREFIX,
  getDesignToken,
  type ThemeContext,
  ThemeContextKey,
} from '@apollo-design/theme';
import { isPlainObject, useDevWarning, warningContextKey } from '@apollo-design/utils';
import {
  computed,
  defineComponent,
  h,
  inject,
  onScopeDispose,
  type PropType,
  provide,
  reactive,
  ref,
  type VNode,
  watchEffect,
} from 'vue';
import type { DividerConfig } from '../divider/interface';
import type { EmptyConfig } from '../empty/interface';
import type { SpinConfig } from '../spin/interface';
import {
  type ConfigContextValue,
  type CSPConfig,
  configContextKey,
  DEFAULT_CONFIG_CONTEXT,
  type DirectionType,
  defaultIconPrefixCls,
  type GetPopupContainer,
  type GetPrefixCls,
  type GetTargetContainer,
  type PopupOverflow,
  type RenderEmptyHandler,
  useConfigContext,
  type Variant,
  type WaveConfig,
} from './context';
import { disabledContextKey } from './disabled-context';
import { type ConfigProviderThemeConfig, useTheme } from './hooks/use-theme';
import type { ComponentConfigLike, ConfigProviderProps, FormConfig } from './interface';
import { type SizeType, sizeContextKey } from './size-context';

/**
 * 运行时 props。
 *
 * ⚠️ 每个 `Boolean` prop 都显式写 `default: undefined` —— 这不是冗余：
 *    Vue 对「运行时类型含 `Boolean`、调用方没传、**且没有 default**」的 prop 会
 *    赋成 `false`，于是「未传」与「传 `false`」不再可区分（PITFALLS 46）。
 *    `componentDisabled={false}` 必须能被识别成「显式关闭」。
 */
const configProviderProps = {
  getTargetContainer: { type: Function as PropType<GetTargetContainer>, default: undefined },
  getPopupContainer: { type: Function as PropType<GetPopupContainer>, default: undefined },
  prefixCls: { type: String, default: undefined },
  iconPrefixCls: { type: String, default: undefined },
  renderEmpty: { type: Function as PropType<RenderEmptyHandler>, default: undefined },
  csp: { type: Object as PropType<CSPConfig>, default: undefined },
  autoInsertSpaceInButton: { type: Boolean, default: undefined },
  variant: { type: String as PropType<Variant>, default: undefined },
  form: { type: Object as PropType<FormConfig>, default: undefined },
  locale: { type: Object as PropType<Locale>, default: undefined },
  componentSize: { type: String as PropType<SizeType>, default: undefined },
  componentDisabled: { type: Boolean, default: undefined },
  direction: { type: String as PropType<DirectionType>, default: undefined },
  /** antd 的默认就是 `true`（`index.d.ts` 的 `@default true`） */
  virtual: { type: Boolean, default: true },
  dropdownMatchSelectWidth: { type: Boolean, default: undefined },
  popupMatchSelectWidth: { type: Boolean, default: undefined },
  popupOverflow: { type: String as PropType<PopupOverflow>, default: undefined },
  theme: { type: Object as PropType<ConfigProviderThemeConfig>, default: undefined },
  warning: {
    type: Object as PropType<ConfigProviderProps['warning']>,
    default: undefined,
  },
  wave: { type: Object as PropType<WaveConfig>, default: undefined },

  // ---- 组件配置：逃生口 + 已落地组件（D25）----
  components: { type: Object as PropType<Record<string, ComponentConfigLike>>, default: undefined },
  divider: { type: Object as PropType<DividerConfig>, default: undefined },
  empty: { type: Object as PropType<EmptyConfig>, default: undefined },
  spin: { type: Object as PropType<SpinConfig>, default: undefined },
} as const;

export const ConfigProvider = defineComponent({
  name: 'AConfigProvider',
  // 本组件不产 DOM，attrs 无处可落 —— 静默丢弃比让 Vue 告警「多根节点无法继承」好。
  inheritAttrs: false,
  props: configProviderProps,
  setup(props, { slots }) {
    const parentContext = useConfigContext();
    const parentSize = inject(sizeContextKey, undefined);
    const parentDisabled = inject(disabledContextKey, undefined);
    const parentWarning = inject(warningContextKey, undefined);

    // -----------------------------------------------------------------------
    // 1. prefixCls
    //
    // `props.prefixCls || parentContext.getPrefixCls('')` —— 逐字来自
    // `index.tsx:376`。判据是 `||`（真值），传空字符串会退回父级。
    //
    // ⭐ 它是**稳定闭包**，内部读 `computed` ⇒ 消费者在 `computed` / render 里
    //    调用它会被追踪，`prefixCls` 动态变化能传导下去
    //    （antd 的 `dynamic prefixCls` 用例靠的正是这条）。
    // -----------------------------------------------------------------------
    const mergedRootPrefixCls = computed<string>(
      () => props.prefixCls || parentContext.getPrefixCls(''),
    );

    const getPrefixCls: GetPrefixCls = (suffixCls, customizePrefixCls) => {
      if (customizePrefixCls) return customizePrefixCls;
      const merged = mergedRootPrefixCls.value;
      return suffixCls ? `${merged}-${suffixCls}` : merged;
    };

    const iconPrefixCls = computed<string>(
      () => props.iconPrefixCls || parentContext.iconPrefixCls || defaultIconPrefixCls,
    );

    // -----------------------------------------------------------------------
    // 2. locale 的 ESM interop 归一化（`index.tsx:352-363`）
    //
    // antd 判 `rawLocale.default?.locale` —— 处理「用户 import 到的是模块对象
    // 而不是语言包」的情况。本仓 `locale` 包导出的是具名语言包，正常情况下
    // 不会命中；保留是为了不走运时的兼容，与上游同。
    // -----------------------------------------------------------------------
    const locale = computed<Locale | undefined>(() => {
      const raw = props.locale;
      if (!raw) return undefined;

      if (isPlainObject(raw) && Object.hasOwn(raw, 'default')) {
        const inner = (raw as unknown as { default?: { locale?: unknown } }).default;
        if (inner?.locale) return inner as Locale;
      }
      return raw;
    });

    // -----------------------------------------------------------------------
    // 3. theme（`hooks/useTheme.ts`，见 hooks/use-theme.ts 的三条合并语义）
    // -----------------------------------------------------------------------
    const mergedTheme = computed<ConfigProviderThemeConfig | undefined>(() =>
      useTheme(props.theme, parentContext.theme),
    );

    // -----------------------------------------------------------------------
    // 4. components —— ⭐ 逐组件名合并（判据 1）
    // -----------------------------------------------------------------------
    const mergedComponents = computed<Record<string, unknown>>(() => {
      const out: Record<string, unknown> = { ...(parentContext.components ?? {}) };

      // (B) 逃生口：未落地组件
      for (const [name, value] of Object.entries(props.components ?? {})) {
        out[name] = value;
      }

      // (A) 已落地组件：显式 prop 更具体 ⇒ 覆盖同名键
      if (props.divider !== undefined) out.divider = props.divider;
      if (props.empty !== undefined) out.empty = props.empty;
      if (props.spin !== undefined) out.spin = props.spin;
      if (props.form !== undefined) out.form = props.form;

      // 废弃 API：`autoInsertSpaceInButton` 合并进 `button` 配置。
      // ⚠️ 展开顺序逐字来自 `index.tsx:618-621`：`{ autoInsertSpace, ...config.button }`
      //    ⇒ 显式的 `button.autoInsertSpace` **胜**过废弃的那个顶层 prop。
      if (props.autoInsertSpaceInButton !== undefined) {
        out.button = {
          autoInsertSpace: props.autoInsertSpaceInButton,
          ...((out.button as object | undefined) ?? {}),
        };
      }

      return out;
    });

    // -----------------------------------------------------------------------
    // 5. 注入的 context：一个 **原地打补丁的 reactive 对象**（判据 2）
    //
    // ⭐ 为什么不是「每次 provide 一个新对象」：Vue 的 `inject` 只在 setup 期解析
    //    一次，消费者的引用不会更新。提供一个**引用恒定**的 reactive 对象、变化时
    //    用 `Object.assign` 打补丁，才能让「已注入的引用」永远有效
    //    （这也顺带满足 antd `memoedConfig` 那条「别让 context 抖动」的意图）。
    // -----------------------------------------------------------------------
    const config = reactive<ConfigContextValue>({ ...DEFAULT_CONFIG_CONTEXT });

    watchEffect(() => {
      const own: Record<string, unknown> = {
        getPrefixCls,
        iconPrefixCls: iconPrefixCls.value,
        components: mergedComponents.value,
        theme: mergedTheme.value,
        direction: props.direction,
        renderEmpty: props.renderEmpty,
        getPopupContainer: props.getPopupContainer,
        getTargetContainer: props.getTargetContainer,
        csp: props.csp,
        autoInsertSpaceInButton: props.autoInsertSpaceInButton,
        variant: props.variant,
        virtual: props.virtual,
        popupMatchSelectWidth: props.popupMatchSelectWidth ?? props.dropdownMatchSelectWidth,
        popupOverflow: props.popupOverflow,
        wave: props.wave,
      };

      // ① 从父级重算全量（antd 的 `const config = { ...parentContext }`）
      const next: Record<string, unknown> = { ...parentContext };

      // ② 本层定义了的键覆盖（antd 的 `if (baseConfig[key] !== undefined)`）
      for (const [key, value] of Object.entries(own)) {
        if (value !== undefined) next[key] = value;
      }

      // ③ 本层没定义的键，`next` 里已经是父级值；但 `config` 上可能还残留
      //    「上一次本层设过」的值 ⇒ 先删掉不在 `next` 里的键，再整体打补丁。
      for (const key of Object.keys(config)) {
        if (!(key in next)) Reflect.deleteProperty(config, key);
      }
      Object.assign(config, next);
    });

    provide(configContextKey, config);

    // -----------------------------------------------------------------------
    // 5.5 主题上下文（2026-09-22 补齐的 foundation 缺口）
    //
    // antd 的组件从 ThemeContext 读解析后的 token（useToken）。此前我们只 provide
    // 了 CSS 变量 —— 纯 CSS 消费的组件在 dark 下正确，但任何「从 token 对象计算」
    // 的逻辑（如 Empty 插画色，antd empty.js 的 getAsSolidColor）拿到的是默认
    // 浅色 token（theme-dark L6 实测暴露）。
    //
    // config 可写（运行时换主题），token 随 config 重算 —— 与 ThemeProvider 的
    // createThemeContext 同构；config 用 computed 桥接 mergedTheme（嵌套合并已在
    // mergedTheme 里完成）。
    // -----------------------------------------------------------------------
    const themeContext: ThemeContext = {
      config: computed(() => mergedTheme.value ?? {}) as never,
      token: computed(() =>
        getDesignToken({
          token: mergedTheme.value?.token,
          algorithm: mergedTheme.value?.algorithm,
        }),
      ),
    };
    provide(ThemeContextKey, themeContext);

    // -----------------------------------------------------------------------
    // 6. 尺寸 / 禁用 / 告警：三条独立的 provide
    //
    // ⚠️ 两条判据不同，别统一（见文件头判据 3）。
    // ⚠️ 这里**总是** provide（antd 是 `if (componentSize)` 才包）：Vue 的
    //    `provide` 只在 setup 跑一次，条件性 provide 会让「挂载后才给
    //    `componentSize`」这种情况永久失效；而 `||` / `??` 的语义让「总是 provide」
    //    与「条件性包一层」结果完全等价。
    // -----------------------------------------------------------------------
    provide(
      sizeContextKey,
      computed<SizeType | undefined>(() => props.componentSize || parentSize?.value),
    );
    provide(
      disabledContextKey,
      computed<boolean>(() => props.componentDisabled ?? parentDisabled?.value ?? false),
    );
    provide(warningContextKey, props.warning ?? parentWarning ?? {});

    // -----------------------------------------------------------------------
    // 7. 废弃告警
    //
    // antd 的判据是 `!('autoInsertSpaceInButton' in props)`。Vue 的 props 对象
    // **恒**包含全部声明键（未传时是 `undefined`），`in` 恒为真 ⇒ 改成
    // `=== undefined`（与 D21 同源的平台差异，不是放宽）。
    // -----------------------------------------------------------------------
    const warning = useDevWarning('ConfigProvider');
    watchEffect(() => {
      warning.deprecated(
        props.autoInsertSpaceInButton === undefined,
        'autoInsertSpaceInButton',
        'button.autoInsertSpace',
      );
      warning.deprecated(
        props.dropdownMatchSelectWidth === undefined,
        'dropdownMatchSelectWidth',
        'popupMatchSelectWidth',
      );
    });

    // -----------------------------------------------------------------------
    // 8. form.validateMessages（`index.tsx:655-670`）
    //
    // 三源合并，只在非空时才包 Provider。antd 用的是 `ValidateMessagesContext`，
    // 本仓的对应物是 form-core 的 `FormProvider`（它 provide 的 `formContextKey`
    // 带 `validateMessages` getter，且**自动与父级合并**）。
    // -----------------------------------------------------------------------
    const validateMessages = computed(() => {
      const merged = {
        ...(defaultLocale.Form?.defaultValidateMessages ?? {}),
        ...(locale.value?.Form?.defaultValidateMessages ?? {}),
        ...(props.form?.validateMessages ?? {}),
      };
      return merged;
    });

    // -----------------------------------------------------------------------
    // 9. theme 的运行时注入（零运行时的落地点，`ARCHITECTURE.md` §5.2）
    //
    // `theme` 包已提供 `createCSSVarScope(el, prefix)` —— 这是裁决 B 要求的
    // 「动态 token 运行时注入通道」，本组件是它的第一个消费者。
    // ⚠️ 注入需要一个 DOM 元素，而本组件本体不产 DOM ⇒ 只在**本层给了 `theme`**
    //    时才渲染一个 `display: contents` 的作用域元素（`display: contents` 让它
    //    不产生布局盒，对下游布局零影响）。差异登记为 **D26**。
    // -----------------------------------------------------------------------
    const themeScopeEl = ref<HTMLElement | null>(null);
    let cssVarScope: ReturnType<typeof createCSSVarScope> | undefined;

    watchEffect(() => {
      const el = themeScopeEl.value;

      if (!el || !props.theme) {
        cssVarScope?.remove();
        cssVarScope = undefined;
        return;
      }

      const token = getDesignToken({
        token: mergedTheme.value?.token,
        algorithm: mergedTheme.value?.algorithm,
      });

      cssVarScope ??= createCSSVarScope(
        el,
        mergedTheme.value?.cssVarPrefix ?? DEFAULT_CSS_VAR_PREFIX,
      );
      cssVarScope.apply(token);
    });

    onScopeDispose(() => {
      cssVarScope?.remove();
      cssVarScope = undefined;
    });

    // -----------------------------------------------------------------------
    // 10. 渲染
    //
    // 包裹顺序（外 → 内）与 antd 一致：LocaleProvider → ValidateMessages → children。
    // `IconContext` / `MotionWrapper` / `UniqueProvider` 三层没有对应物，见 README §7。
    // -----------------------------------------------------------------------
    return () => {
      let children: VNode | VNode[] | undefined = slots.default?.();

      if (Object.keys(validateMessages.value).length > 0) {
        // ⚠️ 必须先把当前值**捕获到局部常量**再包：插槽函数是**延迟**求值的，
        //    若闭包里读 `children` 这个变量，求值时会读到刚赋上的外层 vnode
        //    ⇒ 自己渲染自己，直接栈溢出。
        const inner = children;
        children = h(FormProvider, { validateMessages: validateMessages.value }, () => inner);
      }

      const mergedLocale = locale.value;
      if (mergedLocale) {
        // ⚠️ `_ANT_MARK__` 必须传 upstream 的 `ANT_MARK` —— 否则 LocaleProvider
        //    会认为「用户自己又包了一层」并打废弃告警（那是上游的**有意**行为）。
        const inner = children;
        children = h(LocaleProvider, { locale: mergedLocale, _ANT_MARK__: ANT_MARK }, () => inner);
      }

      if (props.theme) {
        children = h(
          'div',
          {
            ref: themeScopeEl,
            // ⚠️ 必须是字符串 `'contents'`：Vue 只在模板编译期补单位，渲染函数里
            //    传数字会被静默丢掉（PITFALLS 32）。
            style: { display: 'contents' },
          },
          children,
        );
      }

      return children;
    };
  },
});

export default ConfigProvider;
