# Tag / CheckableTag / CheckableTagGroup 完整整改单元

盘点基线7a3db048。已逐项读取三组件、公开/根入口及类型、use-color、样式与三个Component Token、共享closable/Provider/disabled链、十二原Demo和元数据、双语API、现有四层/类型/Issue30测试及24条机械DOM场景。该完整清单先于生产修改建立，已完成整组红灯复现；下方区分当前已实现、已验证和最终待验收。

## 范围、完整清单与判据

| 链路 | 当前事实与本轮分类 |
|---|---|
| Tag公开字段 | 运行11Props：prefixCls/color/variant/bordered/closable/onClose/href/target/disabled/classNames/styles。导出TagProps还残留没有运行Props落点的className/rootClassName。必修：按既有root attrs规范清理无效声明；close转typed Vue事件，取消仍用原生MouseEvent.preventDefault；保留color/variant、href/target、既有bordered/inverse弃用字段，不新增兼容层或弃用期 |
| CheckableTag | 运行6Props：prefixCls/checked/disabled及onChange/onClick/onKeyDown。必修：标准Vuechange/click/keydown与v-model:checked，保持Space/重复键/取消和disabled语义。核对受控与可省略checked的初始/非受控行为、模型回写/监听器数组/.once/移除和原生事件对象；不留React大小写keydown通道 |
| CheckableTagGroup | 运行10Props：id/prefixCls/disabled/multiple/options/value/defaultValue/onChange/classNames/styles。必修：原生v-model:value、typed change；scalar/array/null/0/空串与当前multiple链，合法动态配置不崩溃；原生id/class/style/监听器/ARIA/data到实际div，styles.root不能压过原生style |
| 内容与语义 | Tag已有default/icon/closeIcon三槽；Checkable有default/icon两槽；Group当前只接受options数据、没有公开插槽。必修：Tag.icon只取首VNode、icon有无改变content宿主、closeIcon在computed内读取/缓存、空槽回退、槽内业务节点ARIA/class/style被克隆覆盖。每槽当前render一次，完整节点/条件空/移除、编辑状态/焦点稳定；Tag四语义都要实际有效。Group label数据保留，不加新item renderer/模板能力 |
| Group语义/选项 | 实际root/item两语义，但导出Props错用Tag四语义，运行内部类型又extends无效icon/content/close。必修真实有限root/item类型、CSSProperties、option.label省略时的消费/名称、option.className/style当前优先级、动态替换与相邻实例；不加选项级disabled等无关新能力 |
| 关闭、链接与可访问性 | closable配置有closeIcon/disabled和ARIA/data；当前Tag忽略closeBtnIsDisabled，直接把调用者节点变成按钮。必修配置disabled有效、当前语言Close、完整closeIcon内容与真实关闭操作宿主、键盘/取消/停止传播/一次事件、disabled链接无导航。涉及交互嵌套或宿主改变先实际浏览器复现，再按ADR0007直接修正并单独记录迁移；保留关闭后DOM隐藏/可由父级卸载重挂 |
| Provider/响应性 | Tag冻结className/style/variant/classNames/styles/closable/closeIcon/direction；Checkable冻结className/style；Group冻结className/direction。必修按现有适用字段改当前getter，局部覆盖/删除恢复、最近Provider/相邻作用域、原生dir覆盖及全局disabled。字段不因名称与React相同就删除，也不把Tag专有variant/closable新增到选择控件 |
| 样式、源主题和三Token | defaultBg/defaultColor/solidTextColor当前生成器含硬编码默认，组件无source theme/component override消费。必修已有Token的实际配置/动态替换/移除/原生变量优先级、静态CSS/前缀、light/dark/compact/both、预设/状态/自定义色及选择态对比度；先真实浏览器复现，保留原三variant/13色/状态与自定义色场景，不用夹具颜色遮盖缺陷 |
| attrs与实例 | 三根nativeElement及安装名/根深入口/两个静态子组件身份保留，核对真实InstanceType和发布SFC。必修Tag/Checkable把style字符串/数组强转对象后展开、Group仅pick ARIA/data漏原生监听器/属性；合并用Vue原生规则，class/style/data及控件键盘落点明确，无any/强断言掩盖缺陷 |
| 十二原Demo与文档 | 全保留。basic还把已不存在的closeIcon prop传入，control输入缺v-model且无法添加、缺名称/焦点，checkable含any，token靠手写CSS而非公开Provider，icon/customize用可点击外壳，style-class只展示部分语义，animation并无所称transition。必修实际公开API、完整槽/模型/当前配置、四语义、真实添加/关闭/复位/键盘/拖拽与主题；不声称新Wave或未实现动画 |
| 关联与参考 | 组件内部实际依赖为Group→CheckableTag，另有样式聚合/根导出；已扫描其他Demo中Tag三件套使用点，验收检查真实使用场景。共享closable还有Modal/Notification/Drawer/Tour消费者；默认不改共享实现，若根因需要共享修改则补这些回归。原机械JSON、全局投影和参考图保留，形态差异逐项精确登记，自有视觉清洁采集/审阅 |

本轮没有需要用户新增功能裁决的事项。所有无效既有字段和关键交互纳入必修；颜色合法输入、事件/模型与宿主方案集中评估并一次迁移。Wave、全库任意前缀自动CSS（D04）、新增Group item/option能力另案，不以旧缺口文字扩大当前范围。

## 成组方案与统一验收

整组先建立红灯：完整/条件/空内容及子级身份，当前Provider/locale/disabled，所有原生style形态/事件/实例，三个已有Token和颜色，选择模式与模型、关闭取消/链接/键盘，原动态添加Demo和真实SFC类型。按“当前配置/源主题”“完整内容/所属操作宿主”“Vue事件/模型/数据”“真实Demo/文档”归根因修复，不逐字段收工。

最终执行Tag四层/公开正负类型、真实SFC/发布消费、Node SSR/水合、生产浏览器/颜色与全部十二Demo四算法、关联实际Demo及构建Docs、所有适用共享消费者、Apollo自有视觉/原参考完整性、Registry/格式/严格L7。整张清单统一验收后切下一单元；阶段提交继续标未验收项，不能用历史completed或局部绿灯关闭。其他浏览器/设备只按实际运行证据声明，全库最终全量门禁仍待全库整改结束。

## 动手前的整组复现

全部生产/Demo盘点哈希仍保持基线。原95四层全部通过；新增32条当前契约复现5通过/27失败，覆盖完整/条件槽、内容宿主与草稿、七Provider字段、当前Close语言、三组件方向、原生style/事件、模型、数字0/多选模式与可省略option.label。Provider.classNames用root字段隔离快照，content无icon失效由另一用例独立覆盖；真实Teleport防止测试stub重挂掩盖问题。

生产浏览器颜色/源主题检查296项，修正测量期望后111通过/185失败；三个已有Token两次配置均未生效，合法CSS变量颜色抛Color解析异常。颜色值以画布归一后的实际合成像素和WCAG比值为判据，避免把CSSOM的rgb/relative-color序列化当产品契约。链接关闭浏览器9项4通过/5失败：调用者SVG的role/name被替换，Enter/Space触发HTMLElement.click断言在SVG上崩溃，closable.disabled无效；普通内置图标键盘与关闭取消仍正常。SVG嵌套的axe检查原本通过，不冒称它也失败。

真实SFC类型检查确认TagConfig未公开导出，以及Tag/CheckableTag真实InstanceType缺nativeElement；旧静态子组件会由Vue宽泛选项索引变成不精确类型，后续正负例必须验证类型而非只看模板不报错。模型采用普通Vue绑定和强类型单选/多选Ref验证，不通过any或手写回调Demo绕路。原JSON/投影/参考图保留，必要宿主/语义变化将精确登记。

## 当前成组实现与阶段证据（未统一验收）

已实现完整稳定内容、所属原生关闭按钮/内部链接、当前 Provider/语言/方向/禁用、Vue 事件与强类型模型、真实两套语义及三个已有 Token。12 原 Demo 均保留，修复真实添加/焦点/双向绑定/Token/键盘，双语 API 与集中迁移同步。共享 closable 只分离配置解析，原 computeClosable 图标逻辑不变。

安装 helper 的运行时始终写入 install，原宽泛 Plugin 联合却引入额外函数调用签名，令泛型 SFC 的 expose 变 unknown；改为准确 ObjectPlugin。它揭示两处 List 测试 helper 未实例化 string，现显式 mount(List<string>)，原场景和断言不变；因此额外执行全量公开类型和 List 回归，不将它误称为重新审计 List。

阶段实际执行：Tag128/128；共享 _internal/Modal/Drawer/Notification/Tour/Select629/629；发布颜色296/296（四算法全部颜色/选择态对比度、axe、三个动态 Token 和合法 CSS 变量）；链接关闭9/9；十二原 Demo48主题+9真实交互共57/57；SSR/水合17项（9 Node 场景、六根/草稿/焦点/选择/refs、三次当前配置与全前缀变更、数字模型、三次卸载重挂及 axe）通过。安装公共回归追加后仍需最终重跑。

颜色复现的画布 alpha 量化将默认文字实际归一为30，原手写29是测量错误。保留原始采样并只据已捕获像素修正这一期望，before 重新分类为111通过/185失败；实际 Token 第一/二次配置和 CSS var 异常红灯不变。after 读取前等待两帧和原生颜色过渡，296全部通过。Demo 暗色按钮须自身 color:inherit 与透明背景配对，修复实际示例，无测试夹具颜色覆盖。

最终公开类型/严格检查、当前 UI/L7、实际 Docs/消费者及清洁自有视觉仍验收中；本记录不声明 Tag 或全库全部完成。

## 成组实现里程碑（待清洁视觉和最终 Docs）

当前 Tag 四层131/131；安装/实例与两项嵌套激活已包含。关联 _internal/Modal/Drawer/Notification/Tour/Select629/629；另次 Tag/List/ConfigProvider457项全过，其中Tag129、List213、ConfigProvider115，Tag后续两项已独立补过；合并不重复计数为1088项。全库公开类型190文件2289项、追加公开ref负例8项、根严格检查、真实/发布SFC（12原Demo及单/多选/动态模型、静态子组件/导出/refs）通过。当前UI声明与69 CSS构建成功，严格L7为11项0失败/0待定。格式为0错误、原37警告/5信息，未改规则或阈值。

验收阶段发现并解决两个关联问题，均保留红灯证据：原生关闭按钮的Enter/空格会冒泡到Select并移除另一项，新增两项全红后改为消费激活keydown但保留原生默认激活；48实际消费者Demo及这两个键盘操作共50/50。补强实际背景/前景色相验证后，默认CSS压缩把动态色彩模式的light-dark降级为失效helper，合法CSS变量色实际透明；在原生特性条件内保留自适应规则，原消费端目标/压缩器不变，当前压缩产物296/296通过，含实际颜色、对比度、四主题、Token及CSS变量。不能以先前仅对比度通过替代颜色生效证据。

公开ref的内部render helper负例已确认本来正常：expose白名单与InstanceType一致，没有为猜测再重构组件。生成的内容候选清单为201条启发式线索；closable别名中closeIcon属于配置数据，本单元已核实，不机械新增closable槽。

Docs内容管线、严格类型、15文件161测试、85路由SSG和实际29项页面/操作已通过前次阶段；原生特性保护后的最终Demo/Docs与45张清洁自有视觉继续验收。尚未执行其他浏览器或最终全库门禁，不宣称整单元或全库已完成。
