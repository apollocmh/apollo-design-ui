# QRCode原生状态、绘制与主题（开发版直接修正）

适用于尚未发布的0.0.0开发阶段。按ADR0006/0007直接修正，兼容层与弃用期均为无。既有导出QrCode、状态枚举、合法数据/编码参数、refresh事件和nativeElement保留。

旧statusRender函数prop已移除，改成完整原生#status槽：

```vue
<QrCode value="https://apollo.design" status="expired" @refresh="reload">
  <template #status="{ status, locale, refresh }">
    <input v-model="note" aria-label="Access note" />
    <span>{{ status }}</span>
    <button type="button" @click="refresh">{{ locale.refresh }}</button>
  </template>
</QrCode>
```

作用域为单对象{ status, locale, refresh }，保留所有节点及当前性。存在的空槽抑制默认内容，active不消费该槽。非active状态之间及canvas/svg切换保留状态内容的拥有节点和编辑器；图像模式切换正常更换图像节点。

refresh始终为发出无参数事件的Vue操作；过期默认按钮始终可用，不以父级回调存在性控制UI。父级可用@refresh、onRefresh和.once，动态替换/移除监听遵守Vue语义。条件监听可能不驱动组件重渲染，因此不保留通过VNode回调探测隐藏控件的路径。默认控件采用文本按钮以保持对比度；status仍由调用者控制，不新增请求模型或v-model。

原生class/style只落根，字符串/数组/对象的宽高行为一致。已有数字宽高补单位，styles.root可覆盖基础size几何，原生attrs最后覆盖；canvas/SVG用内部区域布局并保持比例，不再把React式根宽高复制到画布。size继续定义逻辑缓冲，DPR影响实际canvas分辨率。正有限size/iconSize有效，非法值回退160/40；非有限marginSize回退0，负margin仍取0。

默认bgColor不再用transparent覆盖白色宿主；缺省仍产生透明图像像素，同时保持白色底板，避免暗色页面上的黑码不可读。要显式透明宿主，请传bg-color="transparent"并配置足够对比度的前景。默认前景继续取默认主题colorText；显式前景/背景的绘制语义保留。

两模式的实际图像均有名称，默认“QR code”；title现在同时命名canvas/SVG，SVG仍输出title节点。原生SVG属性shape-rendering/crossorigin按Vue DOM用法修正。旧U11无名称axe豁免移除；原8个机械场景全部保留，精确差异仅登记图像名称、背景默认、刷新按钮类型及既有Spin/CSSOM差异，完整投影同时检查原路径和属性。

QRCodeCoverBackgroundColor读取当前theme.components.QRCode并响应移除/恢复；默认遮罩由当前colorBgContainer的96%不透明度派生。原生--apollo-qrcode-cover-background-color优先。Provider qrcode四个配置字段和locale.QRCode动态生效，不新增共享schema。

四个原有Demo及所有旧场景保留，新增Token示例。统一源码、类型、测试、浏览器与产物证据见 [QRCode完整清单](../audit/2026-10-26-qrcode-contract-audit.md)。编码引擎及许可未改；二维码容量与跨域图片安全限制保留，未新增下载或扫描接口。
