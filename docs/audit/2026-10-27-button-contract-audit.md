# Button完整契约及Result关联整改单元

盘点基线ca5d274067257193405ec94111ffdf05fded35fb。尚未修改Button生产实现。入口缺陷是Result十个原Demo中主按钮白字蓝底4.1:1，40个四算法组合有20项失败；按同类根因追踪后，不能只给Result按钮换颜色。范围为Button全部19 Props、两个插槽、click emit、nativeElement、Provider/尺寸/禁用/Compact、三个语义落点、45个显式Token及13个预设阴影字段、全部20原Demo、双语API、静态CSS/根导出和实际消费者。

已逐项读取当前实现、类型、完整样式生成与默认值准备函数、公开文档、20个原Demo和现有回归。旧报告及“对应antd”注释不作为规格；本文区分当前事实、必须修复及边界。类型声明45字段，加上准备函数和文档中已存在的13个预设阴影字段，共58个；准备函数当前只返回57个（漏solidTextColor）。Registry只记43个，遗漏两项显式字段及派生字段，需按源码核对同步，不能据此删接口。

## 实施前完整清单

| 声明→传递→消费 | 分类及本轮验收标准 |
|---|---|
| type/color/variant/danger/ghost | 五种type糖、16种color、六种variant及ghost映射已有有效组合保留，待统一复验。必修：单独color或非solid的variant被忽略，Provider部分配置同样无效；使各公开可选字段有明确独立回退，显式配置优先，不靠旧上游限制保留无效用法。内部link类名不通过断言伪装成公开颜色类型 |
| shape/block/size | small/medium/middle/large尺寸、Circle/Round和block有效路径保留；square被明确排除类名且无CSS行为，属必修。Props→Compact→Provider的尺寸顺序、RTL/横纵Compact、动态移除恢复与最近作用域均复验 |
| disabled | 当前useDisabled可响应且显式false覆盖Provider true，待复验正常；原生button禁用，anchor移除href/强制tabindex=-1/aria-disabled路径保留。交互、原生属性保护、当前Provider、反复切换和多实例验收 |
| href/htmlType/attrs | 根button/anchor切换、原生class与三种style通过mergeProps有有效路径，保留并严格复验。必修：启用的anchor也强制tabindex=0，覆盖调用者；禁用时保护值与启用时原生落点分清，原生form submit/reset、target/rel、键盘和真实ref覆盖 |
| click emit/事件 | MouseEvent只通过Vue emit，原有点击、原生修饰与业务preventDefault保留。必修：文档和loading Demo明确加载期不触发，但延迟显示期仍放行；从请求loading起阻止点击/表单默认行为，验证disabled/loading、原生其他事件、祖先传播及一次触发，不新增自动请求/防抖服务 |
| loading/delay/清理 | 延迟只控制指示器；当前setup immediate watch就创建SSR计时器，换图标对象也重置延迟。必修：挂载后调度，SSR/水合首帧确定；布尔/对象、非有限/负延迟、快速开关/替换/卸载重挂/多实例和图标变化不重置时钟均覆盖 |
| icon/loading.icon/Provider loadingIcon | 现有VNode/组件数据接口及有效iconPlacement、既有deprecated iconPosition保持。必修：数值0被truthiness丢弃，空数组可留下空图标；loading.icon用||丢false/0，有效字符串还被旧v4命名告警误报。按当前完整值与存在性统一，保持默认加载图标及显式空值职责，不新增弃用通道或loadingIcon槽 |
| default/#icon | 两个完整Vue槽应在当前render求值；当前computed缓存存在性、default在多处再次调用，contentNodes/elementContentNodes克隆用户节点并改写中文children。必修：每槽每render一次、完整Fragment/注释/文本0、条件添加/移除/有意空槽，#icon优先于fallback，稳定内容宿主承担content样式，不克隆业务子级来迎合React树 |
| autoInsertSpace | 中文文档承诺DOM保留连续“确定”，当前却写入真实空格并修改子VNode；loading/icon条件也与文档不一致。必修：由组件拥有的字距实现视觉间隔，保留原文字/可访问名/子组件状态，切换文字/图标/加载/Provider设置都用当前值；不模拟React每次更新effect |
| Provider/响应性 | setup解构button配置导致class/style/shape/color/variant/loadingIcon/autoInsertSpace快照，必须改当前getter；direction/useSize/useDisabled/Compact有效链路保留。替换/删除/恢复、最近Provider、相邻实例、根样式优先和DOM身份覆盖 |
| 三语义/类型 | root/icon/content对象式API已明确公开，保留对象式，不额外加入函数式新能力。各目标稳定拥有类/样式；Provider与局部合并、原生根优先、移除恢复及业务VNode不被修改。去掉watch复制Props及不必要强制断言，不放宽类型 |
| Expose/模型/导出 | 仅nativeElement（button/anchor/null）；无v-model、focus/blur等公开方法，不新增。默认/具名Button同一对象、AButton名称、根/深入口类型保留；声明化icon/slot、真实SFC/发布消费与根严格检查 |
| 45+13 Token | 当前大部分规则直接读Alias，组件Token与theme.components.Button没有消费链，solidTextColor缺默认，预设阴影只按浅色构建。必修全部既有字段按职责消费：字体/三尺寸行高与内边距/图标、默认/主/危险文字阴影、三态背景边框/文字、ghost、disabled、文本/link、group和13阴影。无效/0/删除恢复、当前源Alias/四算法、作用域与原生变量优先统一验收；不新增Token或删除现有字段 |
| 颜色/样式/无障碍 | 同类solid所有色均固定浅字，dark default-solid也存在已知白底浅字风险；非solid彩色文字与hover须一并核对，不能只调primary。保留背景/状态/可定制字段，用真实像素颜色及axe验证默认四算法、各色/变体/三态。loading语义、焦点环、reduced-motion/源motion:false及所有自定义内容同步检查 |
| 原20 Demo/文档 | 全部保留。已定位loading Demo的delayLoading未接入、两Demo定时器未卸载清理、七处以上#999说明文字、渐变/ghost缺对比配对及静态Token示例不展示真正Token。按真实能力修正原示例，保留渐变/ghost/自定义图标场景，不改夹具颜色或删场景规避门禁 |
| SSR/水合/生命周期 | 生产ESM无浏览器全局、延迟不在服务器调度；客户端挂载/当前主题/稳定内容与ref边界覆盖。Button内部不放嵌套交互控件的错误HTML夹具；状态保留用真实子组件和非交互标签，表单输入是外部兄弟，焦点落在真实button/anchor |
| 参考/视觉/Registry | 原机械场景与27张上游参考保留，必要DOM/字距/ARIA差异逐项登记且有反向守卫，不改原始JSON/投影。原一条Apollo Button批准图若受影响必须明确复核，其他238图按真实影响验证；自有矩阵清洁提交采集/逐张查看/批准，历史completed不代表本轮完成 |

## 全部Token落点清单

- 字体、间距与图标：fontWeight、iconGap、paddingInline/LG/SM、paddingBlock/LG/SM、onlyIconSize/LG/SM、contentFontSize/LG/SM、contentLineHeight/LG/SM。
- 默认按钮三态：defaultColor/Bg/BorderColor、defaultHoverBg/Color/BorderColor、defaultActiveBg/Color/BorderColor；defaultShadow、primaryShadow、dangerShadow、primaryColor、dangerColor、solidTextColor。
- 特定状态与组合：borderColorDisabled、defaultBorderColorDisabled、defaultBgDisabled、dashedBgDisabled、defaultGhostColor、ghostBg、defaultGhostBorderColor、groupBorderColor、textTextColor/HoverColor/ActiveColor、textHoverBg、linkHoverBg。
- 现有13个预设色的`${color}ShadowColor`，与准备函数返回字段、样式consumer和实际源主题逐一对应。

## 实际消费者与集中方案

AST按运行时import追踪到13个文件：共享_internal/action-button，DatePicker Footer、DropdownButton、FloatButton、Input.Search、Modal NormalOk/Cancel、Popconfirm PurePanel、QRCode、Table filter、Tour panel、Transfer Actions、UploadList。ActionButton的Modal/Popconfirm间接链路也纳入。不是凭名字推测。聚合样式与Docs全部按钮示例亦是消费者。

已发现两条必须同步调整的实际链路：Input.Search仍传true子节点维持React icon-only宽度；Dropdown样式有两处依赖Button直接子图标。FloatButton把Button作为宿主，需要核对新content宿主与Badge/body几何。上述变更不扩成各消费者完整功能重写；执行受影响12组件组及共享ActionButton的适用回归，并在生产浏览器验证这些组合、确认/取消异步按钮、过滤/分页及搜索键盘/禁用/清理。

方案分为原生稳定内容/当前配置/加载生命周期，以及既有Token/可访问样式两组根因，可按独立主题提交，但全部清单统一验收前不宣称Button或Result完成。保留Root原生属性，内容样式归组件拥有的content宿主，所有调用者集中迁移；不维护旧React克隆树。静态CSS/变量优先，浏览器原生颜色能力只在@supports内增强，旧环境有明确回退，不新增最低浏览器要求或运行时CSS-in-JS。

已只读验证当前Chrome150支持contrast-color、light-dark与相对颜色语法；这不是实现或整组验证。技术依据来自[CSS Color 5](https://drafts.csswg.org/css-color-5/#contrast-color)、[MDN Baseline说明](https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Values/color_value/contrast-color)与[WebKit说明](https://webkit.org/blog/16929/contrast-color/)。仍须实测各色/三态/自定义Token，不能把自动选色函数等同全部可访问性验收。透明/渐变背景由实际示例配对并单独验证，其他浏览器不冒称已实测。

## 验收和边界

先建立源码行为、SSR调度和真实颜色矩阵的失败证据，再成组改实现/类型/20 Demo/双语API/集中迁移/必要消费者。验收包含Button全部四层与类型、真实SFC/发布消费、生产SSR/水合、实际form/键盘/焦点/两种根/延迟/卸载、多实例/动态配置/完整槽、58 Token、20 Demo×四算法及实际Docs、影响消费者回归/浏览器、自有及受影响视觉、UI/L7、Docs/Registry/来源/格式。

暂未发现需用户裁决的API事项；原文档中的无效用法不能以旧上游规则继续保留，真实破坏性变化集中记录迁移。不新增Button.Group、自动请求/自动loading/防抖、业务模型、暂停/恢复或新状态。任意前缀自动CSS仍按D04另案，公开genButtonStyle现有能力保留。未列出的实体设备/其他浏览器与极端资源不宣称验收；全部全库整改结束后仍需最终同一提交全量门禁。

## 复现后的声明链核对补记

97项源码复现当前7通过/90失败，源码哈希未变。四主题97组合×三态共1164实际颜色检查，浅色/紧凑各220项、深色/深色紧凑各173项失败，四次axe均失败；含axe总1168项，378通过/790失败。未跳过任何颜色、状态或axe规则。

根导出核对进一步确认：原文档提到的genButtonStyle/prepareComponentToken实际只有仓库源码可导入，package.exports没有button/style入口，原根也未导出。修复将为既有文档能力补齐合法根/button入口，公开名字prepareButtonComponentToken、genButtonStyle和已有Token类型，不为不存在的深路径保留兼容分支。此处修正盘点中“已有根导出”的误记，不能把源码文件存在等同发布可消费。

## 关联样式链的补充盘点

真实FloatButton content Demo使用三种字符串inset-inline-end定位；当前FloatButton只把对象attrs.style展开，再用生成zIndex覆盖，字符串直接丢失、数组变成数字CSS键，semantic root zIndex也可能被undefined清掉。该缺陷位于本轮Button原生attrs“声明→FloatButton传递→Button消费”链内，纳入必须修复。先记录字符串/数组/对象与动态移除/焦点/语义回退失败，再按Vue规范合并当前样式；数值zIndex参与已有层级计算，显式原生或语义zIndex保持控制，不新增配置通道或放宽类型。其余FloatButton独立Props/Group/BackTop不在本子项增加新能力，已有相关运行回归继续保留。

## 关联浏览器失败的补充盘点（修复前）

13个实际消费者场景的51项检查中有5项失败。逐条回看实际DOM和当前源码后：Transfer两项是夹具误选不存在的`.apollo-transfer-list`，真实面板为`.apollo-transfer-section`，内容和移动链路正常；修正定位，不改生产行为或预期。

必须修复的关联链路及边界：

| 链路 | 源码盘点及验收 |
|---|---|
| Input.Search→Space.Compact→CompactItem→Button | Search在render构造当前loading节点，Compact把默认槽节点缓存于computed，父render提供的新节点被旧结果遮住。Compact六Props（prefixCls/size/direction/orientation/vertical/block）、default槽、nativeElement、原生attrs、尺寸/方向Provider、嵌套首末项及NoCompactStyle已逐项核对；无Emits/v-model/事件所有权。样式仍由各子组件消费上下文。将默认槽改为每次render读取一次；保留key、DOM身份、首末项及空内容行为，验证动态loading/条件槽/焦点/卸载与现有Space四层。其他Space能力不在此扩展 |
| 原Popconfirm async Demo→onConfirm→共享ActionButton→close/update:open | ActionButton的buttonProps在内部loading之后展开，外部loading没有被覆盖；Modal Promise链浏览器检查正常。Demo的handleOk返回undefined，ActionButton依契约立即close，v-model同步false，导致本应等待的面板关闭。Demo改为返回实际Promise并清理定时器/取消状态；补实际Demo复现和外部loading动态传递回归，不为Demo错误更改公共关闭契约 |
| Upload两个原Demo→change emit→业务提示/列表 | Upload运行时声明change emit，未声明onChange prop；basic/default-file-list却用`:on-change`，未成为Vue事件监听。两处统一改为`@change`，已有真正回调Props onPreview/onDownload保持。保留删除removed、v-model与原始文件断言；检查实际Demo删除/上传事件，不增加兼容通道。Upload剩余独立API全审仍属于已登记的后续整改单元 |

以上先建立可失败源码复现，再成组修复；不得把夹具定位错误当作产品缺陷，也不得删除真实状态断言。当前未新增需要用户裁决的API事项。


## 实现里程碑验证记录（未代表整单元完成）

Button行为初始97项7通过/90失败；修复后的Button四层与严格参考守卫365项通过。浏览器颜色1168/1168、原生交互/58 Token等145/145、独立Node SSR8/8与四算法20组水合通过。全部20原Demo×四算法较早80/80通过；最终实现仍须复验实际Docs及视觉。

完整14组件组四层2351项中2340通过、11项失败均限Space Provider机械DOM夹具。原始差异是根div被teleport-stub替代；夹具改真实Teleport后Space全部329项通过，不改126个参考样例、投影或原允许差异。Compact/Search、实际Popconfirm/Upload Demo及外部loading共7项回归通过；取消未结束Promise会使第二次确认失效的新增边界先失败后修复。

Compact渲染转换中实际InstanceType的nativeElement曾缺失，新增直接实例类型检查得到43通过/1失败；已用显式expose配合setup绑定恢复HTMLDivElement|null，并保持只暴露nativeElement。对应44项类型及最终相关运行复验另记入证据。此前五组组件12文件162项类型、根严格检查及真实Button SFC通过，新增实例检查不会被这些历史通过掩盖。

自有Button13状态×三视口39图已登记，包括原批准type场景、完整内容、loading、禁用、形态、语义/Token、Provider、真实Compact、RTL、三种主题和键盘焦点；新增工具检查保留全部27原参考case与共用type标识。原Image“无关Button矩阵不变”的工具断言改用未变的Divider作为对照，Button参考矩阵及新自有矩阵另有完整检查。Result39图区域命名按每个原生id区分，修正的是重复可访问名，未删axe规则。上述新图仍待清洁实现采集、逐张审阅和批准。

L7技术预算仅调整Button37→41KB、Input89→92KB，对应完整58 Token与当前作用域主题/原生内容/SSR安全加载的实现成本；实测约40.0/91.0KB，其他71项限制与全包30%比例不变。提交说明同时记录依据，不跳过门禁或逐字节反复调整。最终构建/声明/消费者浏览器、Docs和视觉仍按剩余清单推进。
