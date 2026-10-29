# ConfigProvider 当前开发版契约迁移 · 2026-10-29

本次将 ConfigProvider、实际注入消费者与相关类型按同一条链修复。以下破坏性调整已集中裁决；独立组件的全部 API、Locale / Icons / form-core 全包仍不在本轮验收声明内。

## 无消费者字段移除

- 删除 ConfigProvider 的 `csp`、`wave`、`popupOverflow`，及其 `CSPConfig`、`WaveConfig`、`PopupOverflow` 类型导出。它们没有运行时消费者，删除设置即可；没有隐式行为需要迁移。
- 删除 ThemeConfig / ConfigProviderThemeConfig 的 `prefixCls`。组件类名前缀使用 ConfigProvider.prefixCls，CSS 变量前缀使用 theme.cssVarPrefix；两者都需要预载匹配的静态 CSS。
- IconContextProps / IconProvider.value 删除 `csp`、`layer`、`zeroRuntime`，只保留 `prefixCls` 和 `rootClassName`。没有运行时样式引擎可消费这些元数据。

## 一个响应式语言通道

`useLocale(name)` 现在返回 `[ComputedRef<分片>, ComputedRef<string | undefined>]`。脚本中把 `locale.foo` 改为 `locale.value.foo`，语言码同样读取 `.value`。模板按 Vue 规则解包。原 `useLocaleReactive` 调用改为 `useLocale`，已有 `.value` 保留。不要把新的分片值在 setup 中解构成常量。

```ts
const [locale, language] = useLocale('Modal');
const okText = computed(() => locale.value.okText);
```

`localeContextKey` 支持响应式来源。没有 Provider 时语言码仍为 undefined；存在 Provider 但没有语言码时回退 en。分片依旧浅合并，当前上下文覆盖默认片段。

Apollo 新增可选 `global.clear`：en_US 为 `Clear input`，zh_CN 为 `清空输入`，其他语言通过 useLocale 的英文默认值回退。生成源是 `registry/source/locale-apollo-overrides.json`，不要直接手改生成语言包；原始上游快照不包含 Apollo 扩展。

LocaleProvider 与 ConfigProvider 只在客户端注册存在的 Modal 分片；深层更新替换自己的注册，撤回或卸载仅释放自己的注册，SSR 不污染模块级 confirm locale。

## 原生结构与主题作用域

ConfigProvider 默认无 DOM 包装，locale / theme 出现、撤回或修改均保留逻辑子树。默认 attrs 不落入业务根节点。客户端 Alias 变量投影跟随实际原生根、条件根与 Portal 根；显式原生变量优先，包括恰好等于上一帧主题值的声明，清理仅撤回自身写入。

SSR 对直接原生插槽根序列化 Alias 变量。对于不转发 attrs 的不透明组件或纯文本，需要完整首屏作用域时，显式选择有效原生容器：

```vue
<ConfigProvider scope-tag="section" :theme="theme" style="display: block">
  <BusinessEditor />
</ConfigProvider>
```

scopeTag 可以选择有效的 HTML / SVG 标签；必须符合实际父子语义。例如 table 内选择 tbody，已有 tbody 内可以继续使用默认无包装 Provider 输出 tr。显式 host 接收 attrs，原生 style 优先。scopeTag 改变按 Vue 根类型变化处理，会替换结构；语言与主题更新不需要改变 scopeTag。host 默认 display:contents，需要可见背景/边框布局时可显式改 display。

`useTheme().config` 是实例可深写 Ref。赋值替换当前有效配置，深写不反向修改 props 或父主题；外部输入变化后重新以外部配置为准。空配置不会偷偷生成 CSS 运行时或选择器。主题组件 token map 保留字面量 `__proto__` 等合法自有键。

## 滚动目标类型收窄

`GetTargetContainer` 由 `() => HTMLElement | Window | ShadowRoot` 改为 `() => HTMLElement | Window`。ShadowRoot 没有滚动偏移或布局矩形，旧类型在 Anchor 的可见锚点路径会抛错；Affix 也没有可用的 ShadowRoot 滚动语义。返回真正滚动的元素，例如 shadowRoot 中选出的 HTMLElement，或实际承担滚动的 host；库不猜测哪个元素在滚动。Affix / Anchor 监听当前解析目标，切换后释放旧监听，卸载清理当前监听。

`getPopupContainer` 仍支持 HTMLElement | ShadowRoot，因为它定义的是浮层挂载位置。

## 已有消费者行为修复

- 不再在 setup 中冻结前缀、方向、组件样式、语言、空状态和弹层目标。Table 的当前语言、TreeSelect 的 virtual / popupMatchSelectWidth、Cascader 弹层宽度及 Tabs 的 size / type / centered / className 均按实际消费路径生效，局部配置优先。
- `renderEmpty` 显式返回 null / false / 0 时保留该结果；Transfer 接通现有全局空状态通道。
- 已打开 message / notification 的默认类型类、图标类、关闭按钮语言和浮层目标随 Provider 更新；getPopupContainer 的响应式目标切换保留原内容并支持 ShadowRoot，移除旧的 HTMLElement 强断言；保留 keyed 正文节点、自定义样式与图标配置。同 key 更新仍使用原有更新路径；手动 destroy 不调用 onClose，按钮或自然关闭按既有契约调用。
- 显式空 message / notification icon 不被默认类型图标覆盖；notification.closable.disabled 传到原生关闭按钮；显式 closable:null 按现有 ArgsProps 文档隐藏按钮，仅在 Notification adapter 归一为 false，不改变共享 computeClosable。closeIcon:null 与 closable:{closeIcon:null} 继续分别表示隐藏按钮和保留无图标按钮。
- Transfer.Search 通过真实 Input.clear(MouseEvent) 识别清除，随后同一动作的 input/change 只处理一次；普通输入原样转发 Event，不再伪造事件或用 type=click 推断清除。

完整盘点、已验证项、证据命令和剩余边界见[本轮审计](../audit/2026-10-29-config-provider-contract-audit.md)。


2026-10-29 整合补充：ConfigProvider 的局部变量投影遵循最近的显式 ThemeProvider 来源，包括空配置 `{}` 的默认主题重置；不能继续显示更外层 ConfigProvider 的旧 CSS。无显式来源时仍保持 CSS-only 继承。动态更新保留实际编辑器、草稿、焦点和选区；没有新增 API 或兼容路径。
