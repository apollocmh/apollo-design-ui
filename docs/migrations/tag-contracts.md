# Tag 三件套的 Vue 契约修正

适用当前未发布的 `0.0.0` 开发版，按 ADR 0006/0007 直接修正；无兼容层或弃用期。Tag、CheckableTag、CheckableTagGroup 的具名/默认导出和静态子组件身份保留。

| 旧写法/行为 | 当前写法/行为 |
|---|---|
| TagProps 中无效的 className/rootClassName | 原生 `class`；Provider.tag.className 仍是有效配置 |
| 顶层 icon/closeIcon 内容 prop（运行时早已移除） | `#icon` / `#closeIcon`；保留 closable.closeIcon 和 Provider.closeIcon 配置数据 |
| CheckableTag 回调 prop，React `onKeyDown` 大小写 | `v-model:checked`、`@change`、`@click`、原生 `@keydown`；点击/空格更新一次，Enter 不切换 |
| Group 手写 change 回写 | `v-model:value`；单选 T/null，多选 T[]，同时保留 typed `@change`；省略 value 为非受控，defaultValue 仅初始生效 |
| Group 错用 Tag 四语义类型 | root/item 两语义；option.label 可省略并显示 value；option.style 覆盖 styles.item |
| Tag 根在 a/span 间切换，关闭操作直接克隆业务图标 | 根固定 span；content 是稳定语义宿主，href/target 使用内部 a，关闭是链接外的原生 button；nativeElement 指向根 span |
| icon 只留首节点、条件 icon 改变正文宿主 | 完整图标/正文/关闭内容，语义 class/style 写入所属宿主；调用者节点属性和事件保持原生行为 |
| closeIcon 缓存首次插槽/Provider 配置 | 每次 render 读取；显式空槽抑制图标，不回退；移除插槽恢复配置 |
| closable.disabled 不生效 | 仅关闭按钮禁用；Tag.disabled/全局禁用同时阻止链接导航和关闭 |
| 三个 Token 配置无实际消费 | 当前 ConfigProvider.theme.components.Tag 的 defaultBg/defaultColor/solidTextColor 即时生效、替换和移除；原生 style 最后覆盖 |

`@close` 收到原生 MouseEvent；`preventDefault()` 取消隐藏，关闭点击停止向标签外传播。自定义关闭图标中的原生事件遵循冒泡规则：自己的处理器执行一次，可取消默认关闭；组件不会改写图标的 role/name/class/style。键盘激活由原生按钮处理。关闭按钮消费 Enter/空格的 keydown 冒泡但不阻止浏览器默认激活，防止 Select 等复合父控件把同一按键解释为选项选择；其他键保持原生传播。关闭后默认保留根 DOM 并添加 `-hidden`；父级可卸载并重新挂载恢复初始显示。

链接专属 attrs（rel/download/hreflang/referrerpolicy/tabindex/accesskey、可访问名称和 focus/blur 监听器）落到真实 a；根 class/style/id/data 和其他原生监听器落到根 span。Tag/CheckableTag 的原生字符串、数组、对象 style 按 Vue mergeProps 合并，不展开成数字属性。Provider、语言、方向、disabled 和样式都消费当前配置。

预设/状态/自定义色的 filled、outlined 文字依当前主题调整明度；solid 和选择态依实际背景自动选择黑白前景，显式 solidTextColor 保持调用者控制。任意合法 CSS 变量/现代颜色不再强制交给 JS 颜色解析器。三个既有 Token 不增加新字段；显式文字色应与背景配对。原始机械 JSON、共享投影和参考 PNG 不变，24 场景的必要差异逐条精确登记。

完整盘点、复现和验收状态见 [审计记录](../audit/2026-10-27-tag-contract-audit.md)。首轮本地已验证新的 32 项契约、真实单/多选 SFC 与 9 项生产浏览器链接关闭场景；整改单元最终验收仍待证据表收口，不以本迁移说明替代验收。
