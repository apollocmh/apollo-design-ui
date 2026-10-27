# Avatar / AvatarGroup 开发期契约修正

本轮直接修正 Vue 公共用法，不保留旧回调和分组别名兼容层。原始31机械JSON和36张参考PNG保留为历史证据，不能覆盖当前契约。

- `onClick` 从函数prop转为 Vue `click(MouseEvent)`；模板继续使用 `@click`，程序化使用 `onClick` 事件监听器。合并和 `.once` 有效。
- `onError` 转为 Vue `error(Event)`，提供原始图片事件。监听器返回值不再取消回退；旧 `:on-error="() => false"` 改为 `:before-fallback="() => false"`，普通通知改用 `@error`。同步钩子接收同一个原生 Event；不制造可取消的伪图片事件。
- `src`/`icon` 保留合法完整 VNode 数据，并提供 `#image`/`#icon` 模板槽。槽存在即覆盖对应数据，显式空槽也生效。默认内容、条件槽和完整节点不截首项。
- Group 的 `maxCount`/`maxStyle`/`maxPopoverPlacement`/`maxPopoverTrigger` 直接移除；分别改为 `max.count`/`max.style`/`max.popover.placement`/`max.popover.trigger`。配置对象中的 `popover.rootClassName` 仍表示浮层类名，和顶层React根属性无关。
- `max.count=0` 继续表示不限量；计数不含指示器。Group保留调用者key，不再按位置重写业务组件身份。溢出指示器改为所属原生按钮，hover内容同时可用键盘激活。
- 数值和稀疏响应式尺寸使用当前完整继承链；根和文字尺寸都参与重新测量，SSR文字可见。未明确规定的数值文字硬编码字号集中改为既有文字Token，使Token实际适用于数字尺寸。
- 图片默认 `alt=''`；需要名称时显式传alt。旧“必须保留image-alt违规”的断言按当前无障碍规范更正，保留无alt场景并增加明确alt覆盖。
- 十二已有Token读取当前源配置，移除覆盖恢复所属主题。默认文字使用 `colorText` 修复浅色占位背景上的1.84对比度；自定义前背景需成对设置。不得据此调整已有视觉比较阈值。

完整清单、红绿复现与最终验证范围见 [Avatar审计](../audit/2026-10-27-avatar-contract-audit.md)。
