# QRCode

Vue 3二维码组件。canvas/svg共享保留许可的Nayuki编码引擎及矩阵工具；数据、尺寸和状态用props，扩展内容用原生#status槽。当前完整范围、失败复现和验收状态见 [统一清单](../../../../docs/audit/2026-10-26-qrcode-contract-audit.md)。历史上游记录不定义当前外部规格。

#status提供单对象{ status, locale, refresh }，在非active状态下render读取完整内容；有意为空时不回退。refresh始终为Vue emit操作，默认过期按钮不依赖监听器是否存在，@refresh/onRefresh/.once遵守Vue事件语义。当前Provider语言和四个组件配置字段动态生效，根/原生状态编辑器在模式或配置切换中保持。

原生class/style留根，字符串、数组、对象均支持；逻辑size控制缓冲，图像填充内部区域且保持比例，不复制React根style到canvas。两种图像均有可访问名称，title可定制。SVG使用原生shape-rendering/crossorigin属性；旧无名称豁免移除，8个机械场景保留并加强为完整属性/路径检查。

默认图像像素透明、宿主保持白色，以保留暗色UI中的黑白对比度；显式bgColor仍设置宿主和图像。唯一遮罩Token消费当前源主题，静态默认跟随当前Alias，根CSS变量优先。自定义透明底或颜色时调用者负责对比度。

四个原有Demo保留，状态示例补齐原生槽与重复刷新/定时器清理，新增动态Token示例。API变化和默认背景修正见 [集中迁移](../../../../docs/migrations/qrcode-contracts.md)。本轮已集中实现，视觉及最终统一验收状态以审计清单为准；不声明其他浏览器、实体扫码或全库门禁已通过。
