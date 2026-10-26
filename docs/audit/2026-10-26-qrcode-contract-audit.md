# QRCode整改单元：完整清单与验收

盘点基线：a45a8c1e。当前状态：**已按完整清单集中实现，统一验收进行中，尚未收口**。范围包含QrCode、编码/绘制工具与许可、静态CSS、根/深入口类型、17个运行时Props（接口另含onRefresh事件监听字段）、两个语义落点、Provider四字段/locale、四个Demo及双语文档。关联组件为Button、Spin、ReloadOutlined；不把历史59条相关通过当成本单元完成。

## 实施前完整清单

| 入口 | 声明→传递→消费及本轮分类 |
|---|---|
| value | string/string[]→computeQr分段编码→canvas矩阵/SVG path；缺省和空字符串返回null。保留分段数组/原算法，补动态值、缺省恢复、两形态与SSR；容量仍受QR标准和现有引擎约束 |
| type | canvas/svg→render分支及DOM ref→post绘制；补往返切换、卸载重挂及图标载入后切换，root/ref与状态槽内容应稳定 |
| size | 默认160→根几何、像素缓冲、icon计算；补运行更新/DPR/非有限值，数字不得污染DOM或绘制。CSS尺寸与逻辑缓冲尺寸分开 |
| icon / iconSize | URL→隐藏预载img或SVG image→excavate及drawImage；数字/部分宽高对象、删除/替换/失败/迟到load均须验证。保留anonymous跨域配置，不改许可算法 |
| color / bgColor | 显式值→canvas填充与SVG path，背景还落root；已有S37证明颜色重绘。当前缺省transparent覆盖root静态白色，使暗色宿主的黑码失去对比度。本轮将缺省图像像素透明与默认白色宿主分开；显式bgColor仍作用图像/root，默认前景保持默认主题colorText；集中记录默认背景修正与真实暗色验证 |
| errorLevel / boostLevel / marginSize | 当前值→computeQr及对应引擎参数；保留纠错/boost和负margin取0，补矩阵差异、边界与非有限数处理，保留SVG路径字节回归 |
| status | active无cover，其余三状态有cover；调用者控制，没有v-model。补反复开关和多实例，不新增业务请求/取消管理 |
| statusRender / Slots | 函数prop→renderStatus，组件没有公开模板槽。本轮按ADR0006直接改成typed #status单对象scope {status,locale,refresh}；完整节点、条件插槽、有意空槽、当前性及原生编辑器均纳入，旧函数通道无兼容期 |
| refresh / onRefresh | emit refresh→父监听；是否显示按钮被无响应依赖的computed缓存。待失败复现后修正监听新增/删除/替换/once，键盘激活只发一次；保留Vue合法onRefresh事件监听形式 |
| title / ARIA | title仅SVG title，canvas/svg默认role=img却无名称，旧axe豁免理由是上游同构。本轮必须补实际名称、当前title与两模式一致性，移除已不成立的豁免且保留所有Demo场景 |
| prefixCls / attrs / Expose | 当前前缀computed与root nativeElement保留；attrs事件/class落root，style强转对象并把宽高复制到canvas。按Vue写法集中修正字符串/数组/对象、原生/语义尺寸优先级及画布填充，不把根样式当图像节点样式；补前缀恢复/ref清理 |
| bordered / classNames / styles | 两个实际语义root/cover；当前useMergeSemantic在两个computed内重复创建，styles.root宽高还被size覆盖。本轮改为一次setup声明、当前Provider合并、精确CSS类型与原生attrs优先，验证两目标与动态删除 |
| Provider className/style/classNames/styles | qrcode配置→useComponentConfig当前Proxy→root/cover；完整替换/删除、最近Provider、相邻实例及CSS变量落点验证，不扩展共享Provider schema |
| Provider locale | useLocale('QRCode')只读setup快照；用已有useLocaleReactive消费当前语言，补默认/替换/移除、过期/扫描及状态scope，不改基础包合并策略 |
| Component Token / 主题 | 唯一QRCodeCoverBackgroundColor已公开，但只构建期解析且不读theme.components.QRCode。本轮补源主题消费、动态移除/恢复与原生变量优先；静态默认遮罩由当前colorBgContainer派生，验证默认/暗/紧凑/组合，不改二维码默认黑白配对 |
| 生命周期 / SSR / 动画 | canvas watchEffect(post)按实际读值重绘，SSR无窗口时不绘制；保留有价值S37，验证真正像素、DPR和Path2D fallback。loading遵守已验收Spin；自定义槽动画由调用者拥有 |
| 四Demo / 文档 / 导出 | basic/custom/status/svg均已读；status示例定时器无卸载清理，refresh后不会再次到期。必须补可操作的原生状态槽/重复刷新及Token Demo，保留原四场景，补齐英文缺失字段与真实模板/发布声明消费 |
| 发布依赖 / 共享影响 | 引擎Nayuki MIT与utils来源/版权保留；不引入React/rc/CSS-in-JS。QRCode没有其他UI业务组件直接消费；核对实际调用者、Button/Spin/ConfigProvider/locale与产物，而非无差别重跑全库 |

## 成组方案与验收

状态内容、当前事件和语言作为一组：render读取完整#status，非active才消费；存在空槽不回退。scope提供当前status、locale及稳定refresh事件操作。过期刷新控件和该操作不依赖监听存在性，直接采用Vue emits；同key条件监听可能被Vue跳过组件更新，不能靠render读取VNode监听来决定UI。扩展title作为两模式图像名称，缺省使用“QR code”；保留根attrs落点，不借上游缺陷保留无名称图像。

绘制/样式作为一组：逻辑size保持缓冲与编码计算职责，图像CSS填充root内部区域；根native class/style留根，字符串/数组/对象归一后保持最后覆盖，已有数字宽高补单位。样式语义只创建一次并保持响应，Component Token读取当前源主题；无局部主题时遮罩默认继续跟随全局Alias变量。原路径生成与合法输入的矩阵/图标算法保持。

先建立失败复现与源哈希，再集中实现/类型/原Demo与必要新Demo/迁移/Registry。统一执行QRCode四层和类型、真实SFC/发布声明、Node SSR/浏览器水合、生产像素/键盘/焦点/多实例、实际全部Demo、12状态×3视口的Apollo自有视觉及UI构建/L7。共享实现未改时只检查实际受影响链路；源码冻结后集中验收，不重复无关门禁。

已验证正常项须带本轮命令结果；当前旧测试仅为线索。需要产品裁决事项暂未发现，采用上述Vue规范及既有有效契约；不新增下载、扫描器、业务请求模型、任意异常状态或弹层能力。引擎容量限制和跨域图片的浏览器安全限制保留，不声明跨浏览器/实体扫码或全库最终门禁已通过。


## 集中实现与当前验收证据

原9条行为复现修前全部失败；生产浏览器首轮36项中15项失败。已成组修正原生状态槽、稳定refresh事件操作、当前语言/Provider、遮罩Token、根与图像样式、默认白色宿主及图像名称。当前为16个运行时Props和typed状态槽；原四Demo保留并新增Token示例。

完整属性投影另暴露并修正SVG的shape-rendering/crossorigin原生名称；原8个机械场景全部保留，完整投影同时检查原SVG路径字节。默认刷新链接在实际遮罩上对比度不足，改用保留禁用/交互语义的文本按钮，未改共享Button或降低axe要求。当前75条四层与92条相关类型通过，真实SFC和发布声明消费通过。

同key条件监听的额外失败复现促成最终Vue契约：刷新操作不依赖监听存在性，移除VNode回调探测。原状态Demo另以a45a8c1e原源码复现卸载后残留1个定时器；当前实际Demo的重复刷新、再次到期与卸载归零通过。

Chrome44项通过，覆盖三种style几何、源Token/暗色背景、真实模块与SVG路径比对、颜色和分段值重绘、图标替换/失败/删除与模式重挂、DPR2和无Path2D回退、键盘/编辑器及完整axe。Node生产ESM SSR10项、浏览器水合6组通过：服务器root/SVG/编辑器、输入值/焦点/选区保留，主题移除/恢复、语言、状态/模式切换与卸载已验证。全部5个实际Demo和两组交互，共7项本地Docs浏览器通过，零错误。

根严格类型、UI含dts/69CSS、L7 strict11项、Docs严格类型/14文件157条/SSG通过；没有修改体积预算。9文件生产指纹为990771758f7293130ef1d2fcd98d8d90a84607d95e7ba081c90594cb71353322，三份引擎/声明文件与盘点基线哈希一致。共享依赖实现未改，其组合行为由本组件回归覆盖，没有声称重跑依赖全部测试。

测试环境修正单独记录：真实Teleport/DOM身份、附着元素的计算样式、不可变样式/config的shallowRef；没有强制断言或公共类型放宽。同URL图像可复用解码缓存，因此模式重挂检查实际像素，不要求多发HTTP请求。最初误选dom项目的运行只计实际三层，完整四层另用dom-contract真实执行。

[统一证据](evidence/qrcode-contract.json)区分修前、修后及实际命令。仍开放：36张自有视觉的清洁提交审阅/批准/比较、原完整清单最终核对和发布/线上验证；没有把本实现阶段标为整单元完成。迁移统一见[QRCode契约](../migrations/qrcode-contracts.md)。
