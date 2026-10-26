---
category: 数据展示
title: QRCode
subtitle: 二维码
---

将文本或分段内容编码为二维码，支持canvas和svg。status由调用者控制，组件不管理网络请求或v-model。

## 代码演示

见[demo/](./demo)的5个实际示例：basic、custom、status、svg、component-token。

## API

| 参数 | 说明 | 类型 | 默认值 |
|---|---|---|---|
| value | 二维码内容；缺省或空字符串不渲染，并在开发模式告警 | string \| string[] | — |
| type | 绘制形态 | canvas \| svg | canvas |
| size | 正有限像素尺寸，同时定义逻辑画布；非法值回退160 | number | 160 |
| icon | 中心图标URL；canvas等待图片载入再挖空绘制 | string | — |
| iconSize | 正有限图标尺寸，宽高可分别配置；缺省/非法轴回退40 | number \| { width?, height? } | 40 |
| color | 图像前景色；默认取默认主题colorText，保持中性图像对比度 | string | 默认主题colorText |
| bgColor | 显式设置图像及宿主背景；缺省图像像素透明、宿主白色；transparent显式选择透明宿主 | string | — |
| errorLevel | 纠错级别；L与图标同时使用有开发提示 | L \| M \| Q \| H | M |
| status | active无覆盖层，其余状态显示覆盖层 | active \| expired \| loading \| scanned | active |
| bordered | 显示边框 | boolean | true |
| marginSize | 静默区模块数，向下取整并限制非负；非有限值回退0 | number | 0 |
| boostLevel | 编码器允许时提高纠错级别 | boolean | 编码器默认值 |
| title | 两种图像形态的可访问名称，SVG还输出title节点 | string | QR code |
| prefixCls | 当前类名前缀；匹配的静态CSS需提前载入 | string | apollo-qrcode |
| classNames / styles | root与cover的语义class/CSS样式；原生class/style留在根且优先 | { root?, cover? } | — |

### Slots

| 名称 | 作用域 | 说明 |
|---|---|---|
| status | { status, locale, refresh } | 完整原生状态内容；非active时在render读取。存在的空槽不回退；refresh始终为发出事件的稳定操作，不以监听器存在性控制内容 |

```vue
<QrCode value="https://apollo.design" status="expired" @refresh="reload">
  <template #status="{ status, locale, refresh }">
    <span>{{ status }}</span>
    <button type="button" @click="refresh">{{ locale.refresh }}</button>
  </template>
</QrCode>
```

### Emits / Expose

refresh不带参数；可以用@refresh或Vue的onRefresh监听，动态增删与.once有效。组件没有v-model。

nativeElement为HTMLDivElement或null；未渲染/卸载时为空。status切换保留根和同形态图像节点；非active状态之间保留状态槽中的原生编辑器。canvas↔svg更换图像节点，根/状态槽保持。

### Provider、样式与主题

components.qrcode支持className、style、classNames、styles；当前locale.QRCode作用于默认状态和槽scope。替换或移除配置随Vue更新生效。

唯一Component Token为QRCodeCoverBackgroundColor，默认从当前colorBgContainer取96%不透明度。theme.components.QRCode可覆盖，显式根变量--apollo-qrcode-cover-background-color优先。暗色/紧凑模式改变界面与覆盖层；默认图像保留黑白对比度。显式透明背景或自定义前景/背景时，调用者负责扫描所需对比度。

原生字符串、数组和对象style都只作用于根。图像填充根的内部区域并保持比例；size控制逻辑缓冲，DPR用于实际canvas分辨率。不要用根宽高充当图像节点的内联样式。

### 编码与边界

编码使用保留版权的Nayuki qrcodegen（MIT）及既有工具；合法输入的矩阵、路径、纠错和图标挖空算法不变。内容须符合QR标准容量限制。canvas导出仍受浏览器跨域图片安全限制；本组件不新增下载、扫描器或请求模型。
