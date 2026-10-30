/** App and subtree configuration with a stable SSR-compatible theme scope. */
import { FormProvider, formContextKey, type ValidateMessages } from '@apollo-design/form-core';
import { IconProvider, useIconContext } from '@apollo-design/icons';
import type { Locale, LocaleContextValue } from '@apollo-design/locale';
import { defaultLocale, localeContextKey, useConfirmLocale } from '@apollo-design/locale';
import {
  DEFAULT_CSS_VAR_PREFIX,
  getDesignToken,
  type ThemeContext,
  ThemeContextKey,
  useTheme as useThemeContext,
} from '@apollo-design/theme';
import { isPlainObject, useDevWarning, warningContextKey } from '@apollo-design/utils';
import {
  computed,
  defineComponent,
  Fragment,
  h,
  inject,
  type PropType,
  provide,
  reactive,
  ref,
  type SlotsType,
  toValue,
  watch,
  watchEffect,
} from 'vue';
import type { DividerConfig } from '../divider/interface';
import type { EmptyConfig } from '../empty/interface';
import type { SpinConfig } from '../spin/interface';
import {
  type ConfigContextValue,
  configContextKey,
  DEFAULT_CONFIG_CONTEXT,
  type DirectionType,
  defaultIconPrefixCls,
  type GetPopupContainer,
  type GetPrefixCls,
  type GetTargetContainer,
  type RenderEmptyHandler,
  useConfigContext,
  type Variant,
} from './context';
import { disabledContextKey } from './disabled-context';
import { type ConfigProviderThemeConfig, useTheme } from './hooks/use-theme';
import type {
  ComponentConfigLike,
  ConfigProviderProps,
  ConfigProviderScopeTag,
  ConfigProviderSlots,
  FormConfig,
} from './interface';
import { type SizeType, sizeContextKey } from './size-context';
import { useThemeScope } from './use-theme-scope';

const configProviderProps = {
  scopeTag: { type: String as PropType<ConfigProviderScopeTag>, default: undefined },
  getTargetContainer: { type: Function as PropType<GetTargetContainer>, default: undefined },
  getPopupContainer: { type: Function as PropType<GetPopupContainer>, default: undefined },
  prefixCls: { type: String, default: undefined },
  iconPrefixCls: { type: String, default: undefined },
  renderEmpty: { type: Function as PropType<RenderEmptyHandler>, default: undefined },
  autoInsertSpaceInButton: { type: Boolean, default: undefined },
  variant: { type: String as PropType<Variant>, default: undefined },
  form: { type: Object as PropType<FormConfig>, default: undefined },
  locale: { type: Object as PropType<Locale>, default: undefined },
  componentSize: { type: String as PropType<SizeType>, default: undefined },
  componentDisabled: { type: Boolean, default: undefined },
  direction: { type: String as PropType<DirectionType>, default: undefined },
  /**
   * ⚠️ **不能写 `default: true`**（Issue #39）：那会让 `props.virtual` **恒为 boolean**
   *    （永不 `undefined`），而合并逻辑是「本层值 `!== undefined` 就覆盖父级」
   *    ⇒ 内层 Provider 即使没写 `virtual` 也会把父级的 `false` 顶成 `true`。
   *    未传 = `undefined` = **继承父级**；父级也没有时才在合并处兜底 `true`
   *    （antd 文档的 `@default true` —— 上游实测：无 Provider ⇒ false，
   *    父 false + 子不传 ⇒ false，父 true + 子不传 ⇒ true）。
   */
  virtual: { type: Boolean, default: undefined },
  dropdownMatchSelectWidth: { type: Boolean, default: undefined },
  popupMatchSelectWidth: { type: Boolean, default: undefined },
  theme: { type: Object as PropType<ConfigProviderThemeConfig>, default: undefined },
  warning: {
    type: Object as PropType<ConfigProviderProps['warning']>,
    default: undefined,
  },

  // ---- 组件配置：逃生口 + 已落地组件（D25）----
  components: { type: Object as PropType<Record<string, ComponentConfigLike>>, default: undefined },
  divider: { type: Object as PropType<DividerConfig>, default: undefined },
  empty: { type: Object as PropType<EmptyConfig>, default: undefined },
  spin: { type: Object as PropType<SpinConfig>, default: undefined },
} as const;

function copyTheme(config: ConfigProviderThemeConfig): ConfigProviderThemeConfig {
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

export const ConfigProvider = defineComponent({
  name: 'AConfigProvider',
  inheritAttrs: false,
  props: configProviderProps,
  slots: Object as SlotsType<ConfigProviderSlots>,
  setup(props, { slots, attrs }) {
    const parentContext = useConfigContext();
    const parentThemeContext = useThemeContext();
    const parentIconContext = useIconContext();
    const parentLocale = inject(localeContextKey, undefined);
    const parentForm = inject(formContextKey, undefined);
    const parentSize = inject(sizeContextKey, undefined);
    const parentDisabled = inject(disabledContextKey, undefined);
    const parentWarning = inject(warningContextKey, undefined);

    const mergedRootPrefixCls = computed(() => props.prefixCls || parentContext.getPrefixCls(''));
    const getPrefixCls: GetPrefixCls = (suffixCls, customizePrefixCls) => {
      if (customizePrefixCls) return customizePrefixCls;
      const root = mergedRootPrefixCls.value;
      return suffixCls ? `${root}-${suffixCls}` : root;
    };
    const iconPrefixCls = computed(
      () =>
        props.iconPrefixCls ||
        parentIconContext.value.prefixCls ||
        parentContext.iconPrefixCls ||
        defaultIconPrefixCls,
    );
    const iconConfig = computed(() => ({
      ...parentIconContext.value,
      prefixCls: iconPrefixCls.value,
    }));

    const locale = computed<Locale | undefined>(() => {
      const raw = props.locale;
      if (!raw) return undefined;
      if (isPlainObject(raw) && Object.hasOwn(raw, 'default')) {
        const inner = raw.default;
        if (isPlainObject(inner) && typeof inner.locale === 'string') {
          return { ...inner, locale: inner.locale };
        }
      }
      return raw;
    });
    // Keep this injection stable, including the absence of a local locale source.
    const currentLocale = computed<LocaleContextValue | undefined>(() =>
      locale.value ? { ...locale.value, exist: true } : toValue(parentLocale),
    );
    provide(localeContextKey, currentLocale);
    useConfirmLocale(() => locale.value?.Modal);

    const mergedTheme = computed(() => {
      const parentTheme =
        parentThemeContext.sourceActive?.value !== false
          ? parentThemeContext.config.value
          : parentContext.theme;
      return useTheme(props.theme, parentTheme);
    });
    const effectiveTheme = ref<ConfigProviderThemeConfig>({});
    // External sources remain authoritative when they change. Runtime edits use
    // a separate deep ref and never mutate props or another provider's context.
    watch(
      mergedTheme,
      (current) => {
        effectiveTheme.value = copyTheme(current ?? {});
      },
      { immediate: true, deep: true, flush: 'sync' },
    );
    const sourceActive = computed(
      () => mergedTheme.value !== undefined || Object.keys(effectiveTheme.value).length > 0,
    );
    const themeContext: ThemeContext = {
      config: effectiveTheme,
      sourceActive,
      token: computed(() => getDesignToken(effectiveTheme.value)),
    };
    provide(ThemeContextKey, themeContext);

    const mergedComponents = computed<Record<string, unknown>>(() => {
      // fromEntries preserves every own component name, including __proto__.
      const out: Record<string, unknown> = Object.fromEntries([
        ...Object.entries(parentContext.components ?? {}),
        ...Object.entries(props.components ?? {}),
      ]);
      if (props.divider !== undefined) out.divider = props.divider;
      if (props.empty !== undefined) out.empty = props.empty;
      if (props.spin !== undefined) out.spin = props.spin;
      if (props.form !== undefined) out.form = props.form;
      if (props.autoInsertSpaceInButton !== undefined) {
        out.button = {
          autoInsertSpace: props.autoInsertSpaceInButton,
          ...(isPlainObject(out.button) ? out.button : {}),
        };
      }
      return out;
    });
    const config = reactive<ConfigContextValue>({ ...DEFAULT_CONFIG_CONTEXT });
    watchEffect(() => {
      const own: Record<string, unknown> = {
        getPrefixCls,
        iconPrefixCls: iconPrefixCls.value,
        components: mergedComponents.value,
        theme: sourceActive.value ? effectiveTheme.value : undefined,
        direction: props.direction,
        renderEmpty: props.renderEmpty,
        getPopupContainer: props.getPopupContainer,
        getTargetContainer: props.getTargetContainer,
        autoInsertSpaceInButton: props.autoInsertSpaceInButton,
        variant: props.variant,
        virtual: props.virtual ?? parentContext.virtual ?? true,
        popupMatchSelectWidth: props.popupMatchSelectWidth ?? props.dropdownMatchSelectWidth,
      };
      const next: Record<string, unknown> = { ...parentContext };
      for (const [key, value] of Object.entries(own)) {
        if (value !== undefined) next[key] = value;
      }
      for (const key of Object.keys(config)) {
        if (!Object.hasOwn(next, key)) Reflect.deleteProperty(config, key);
      }
      Object.assign(config, next);
    });
    provide(configContextKey, config);
    provide(
      sizeContextKey,
      computed<SizeType | undefined>(() => props.componentSize || parentSize?.value),
    );
    provide(
      disabledContextKey,
      computed(() => props.componentDisabled ?? parentDisabled?.value ?? false),
    );
    provide(
      warningContextKey,
      computed(() => props.warning ?? toValue(parentWarning) ?? {}),
    );

    const warning = useDevWarning('ConfigProvider');
    watchEffect(() => {
      warning.deprecated(
        props.autoInsertSpaceInButton === undefined,
        'autoInsertSpaceInButton',
        'components.button.autoInsertSpace',
      );
      warning.deprecated(
        props.dropdownMatchSelectWidth === undefined,
        'dropdownMatchSelectWidth',
        'popupMatchSelectWidth',
      );
    });
    const validateMessages = computed<ValidateMessages>(() => {
      const form = mergedComponents.value.form;
      const messages =
        isPlainObject(form) && isPlainObject(form.validateMessages)
          ? form.validateMessages
          : undefined;
      return {
        ...defaultLocale.Form?.defaultValidateMessages,
        ...parentForm?.validateMessages,
        ...locale.value?.Form?.defaultValidateMessages,
        ...messages,
      };
    });

    const projection = useThemeScope({
      token: themeContext.token,
      prefix: computed(() => effectiveTheme.value.cssVarPrefix ?? DEFAULT_CSS_VAR_PREFIX),
      // Every explicit canonical source owns current local variables. An inactive
      // application default remains transparent to CSS-only ancestor themes.
      enabled: sourceActive,
    });

    return () => {
      const content = h(IconProvider, { value: iconConfig.value }, () =>
        h(FormProvider, { validateMessages: validateMessages.value }, () =>
          projection.prepare(slots.default?.() ?? [], !props.scopeTag),
        ),
      );
      return props.scopeTag
        ? projection.host(props.scopeTag, attrs, content)
        : h(Fragment, null, [content]);
    };
  },
});

export default ConfigProvider;
