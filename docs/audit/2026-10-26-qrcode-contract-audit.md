# QRCode整改单元：完整清单与验收

盘点基线：a45a8c1e。当前状态：**完整清单已统一验收，组件单元收口；最终文档已上线并核验**。实现提交f4b82b4d19abf73555c719654e2e8fa288dcb154。盘点范围包含QrCode、编码/绘制工具与许可、静态CSS、根/深入口类型、原17个运行时Props（接口另含onRefresh事件监听字段）、两个语义落点、Provider四字段/locale、原四个Demo及双语文档。关联组件为Button、Spin、ReloadOutlined；不把历史59条相关通过当成本单元完成。

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

[统一证据](evidence/qrcode-contract.json)保留修前、集中实现阶段及最终验收。迁移统一见[QRCode契约](../migrations/qrcode-contracts.md)。以下最终核对取代实现阶段的开放状态。

## 原完整清单最终核对

| 原清单范围 | 已实现、已验证的最终结论 |
|---|---|
| value / errorLevel / boostLevel / marginSize | 字符串与分段、空值恢复、当前矩阵/纠错/留白均通过；原8个机械场景保留，完整SVG路径和原生属性受回归保护；许可与3份引擎文件未变 |
| type / size / icon / iconSize / color / bgColor | canvas/SVG往返、正有限尺寸/回退、部分图标宽高、迟到图片/失败/删除/重挂、真实模块/背景像素、DPR2和无Path2D回退通过；根几何与绘图缓冲职责分离 |
| status / #status / refresh / locale | 三非active状态及active、完整多节点/条件空槽、当前scope/语言、同key监听替换/删除/once、原生键盘一次发出及稳定输入/焦点通过；status由调用者控制，无额外v-model |
| title / prefixCls / attrs / Expose | 两模式实际图像命名、前缀更新/恢复、原生class/事件及三种style写法、尺寸优先级、root nativeElement卸载清理通过 |
| bordered / classNames / styles / Provider | root/cover两落点、当前配置替换/移除、最近Provider和实例隔离通过；语义工厂在setup创建一次，精确CSS类型/原生attrs优先已同步 |
| Component Token / 样式 / 主题 | 唯一遮罩Token源主题、动态删除/恢复、原生CSS变量优先和当前Alias通过；默认白纸/中性前景、暗色/紧凑/组合主题与完整axe通过 |
| 生命周期 / SSR / 水合 / 多实例 | 10项生产Node SSR、6组浏览器水合保持服务器节点/值/选区/焦点；反复状态与模式切换、一次emit、卸载清理通过；加载动画组合沿用已验收Spin |
| Demo / 文档 / 公开类型 / 发布图 | 原4Demo保留+1Token Demo；两组真实交互和定时器反复到期/卸载归零通过；双语16运行时Props/状态槽/事件/ref、迁移及根/深入口/发布声明/真实SFC一致；构建/dts/69CSS/L7通过 |
| 关联组件 / 共享层 / 视觉 | Button/Spin/Provider/locale组合由本轮回归和生产浏览器覆盖，共享实现未改；12状态×3视口36张自有图全部逐张审阅，0像素差异，原127条批准记录未改 |

统一验收包含9文件75条四层、6文件92条相关类型、44项生产浏览器、10项SSR、6组水合、全部5Demo与两组交互。各范围独立记录，不累加成全库唯一用例数。完整四层使用unit/dom-contract/a11y/theme实际项目；根严格类型与发布消费检查均通过。

## 自有视觉与提交证据

`node tests/visual/apollo.mjs --component qr-code --candidate`从清洁f4b82b4d采集36张，manifest均dirty=false；逐张查看全部basic/svg/icon/expired/loading/scanned/custom-status/tokens/theme-dark/theme-compact/theme-dark-compact/native-focus的手机/平板/桌面图。确认尺寸、遮罩文字对比度、图标、完整状态内容、主题和真实焦点无裁切/溢出后，附环境与审阅说明接受，未复制旧React PNG。

`node tests/visual/apollo.mjs --component qr-code --no-build`实跑36项PASS、pending=0，逐项diffPixels=0。批准环境为darwin/x64、系统Chrome150.0.7871.125；所有哈希/来源提交/实际几何与比较结果写入同一[统一证据](evidence/qrcode-contract.json)。生产9文件指纹仍为990771758f7293130ef1d2fcd98d8d90a84607d95e7ba081c90594cb71353322。

## 验收边界与交付状态

本单元已实现、已验证，无未裁决或受阻的本轮缺陷。外部引擎容量、跨域图片的浏览器限制已在API记录；未声明其他浏览器引擎、实体扫码、任意超容量输入或无限组合已验收。未新增下载/扫描器/业务请求模型。本轮未运行全库最终门禁，须在剩余全部整改单元完成后对同一最终提交执行。

实现f4b82b4d已提交、推送且文档部署40352956775成功；该部署对应实现阶段。最终验收清单、基线与进度页将在本次收口提交中推送；线上源码、5个实际Demo与发布回执由[文档发布记录](2026-10-26-docs-publication.md)后续明确记录，不能把推送等同上线。


最终验收提交ac6f40e0已推送并上线：[Deploy Docs 40355255877](https://github.com/apollocmh/apollo-design-ui/actions/runs/40355255877)与Pages7336984824成功。线上33项发布检查、5个实际Demo和2组交互通过，错误为零；SSR进度页明确包含QRCode已验收、36张exact和全库仍开放，可见源码/日志为ac6f40e0。详情见[最终发布证据](evidence/docs-publication-qrcode-closure.json)。上述“最终提交待发布”已由本回执取代。
