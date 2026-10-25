---
order: 205
title:
  zh-CN: 全局预览样式
  en-US: Provider preview styles
---
## zh-CN

Image与PreviewGroup都读取 `ConfigProvider.components.image.classNames.popup/styles.popup`。按钮替换整个components map：空 → A → B → 移除；打开预览后也可通过工具栏按钮更新，预览和当前变换保持。

类名按Provider、局部顺序拼接；popup样式按字段浅合并，局部 `styles.popup.root` 会替换Provider的整个root样式对象，其他未覆盖字段仍保留。原生class/style仅落在图片或Group实际根，不复制到弹层。配置是静态数据对象，支持字段/对象替换、晚出现和移除。

方向按钮在ltr/rtl间切换Provider，Group导航图标读取当前方向并镜像。未自定义的图标继续使用默认图标；Prev/Next仍表达前后索引请求，按钮名称保持。

## en-US

Image and PreviewGroup both consume `ConfigProvider.components.image.classNames.popup/styles.popup`. Cycle the entire components map through empty, A, B and removal. A toolbar button updates it while the preview and current transform stay in place.

Classes concatenate in Provider/local order. Popup style fields merge shallowly: local styles.popup.root replaces the Provider's whole root style object, while other fields remain. Native class/style stay on the actual Image/Group root. Configurations are static data objects supporting field/object replacement, late addition and removal.

The direction button switches the Provider between ltr/rtl. Group navigation icons mirror using the current direction, with defaults retained for unspecified icons. Previous/Next continue to request adjacent indices and keep their accessible names.
