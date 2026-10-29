# Tree / DirectoryTree 完整只读审计交接

来源 d87f84c7ab3b6728f0a98b06fad3ec08852b4eea，当前整个Tree 71文件 + 共享core4文件（22运行源码）；75个文件SHA自盘点起全部不变。41 runtime Props与41 TreeProps逐项对应，完整子路径75导出（31runtime含default/44type）、runtime21 emits/接口19、公开title槽/Ref和19对Demo全部纳入。Root当前任务为只读盘点与有效失败，未授权本任务改Tree；本批结束后按用户要求暂停，不启动下一单元。

## 范围、逐项清单与实际调用者

完整先行范围见scope.md，AST声明→传递/读取→emit/expose/slots与全部SHA见inventory.json；api-checklist.json逐项关联41Props/75导出/19Demo，下面按共同根因设计而不是逐字段打补丁。默认值仅初始化与实时受控配置已区分，旧上游行为不是自动正确或自动错误。

| Prop | 分组 | 状态 |
| --- | --- | --- |
| treeData | TREE-01, TREE-03, TREE-10, TREE-11 | 本轮必修或同组必须回归 |
| fieldNames | TREE-03, TREE-10, TREE-11 | 本轮必修或同组必须回归 |
| expandedKeys | TREE-03, TREE-05, TREE-07 | 本轮必修或同组必须回归 |
| defaultExpandedKeys | 正常对照/后续适用边界 | 当前覆盖内正常；动态/边界待统一验收 |
| defaultExpandAll | TREE-05 | 本轮必修或同组必须回归 |
| defaultExpandParent | TREE-05 | 本轮必修或同组必须回归 |
| autoExpandParent | TREE-03 | 本轮必修或同组必须回归 |
| checkable | TREE-01, TREE-03 | 本轮必修或同组必须回归 |
| checkStrictly | TREE-03 | 本轮必修或同组必须回归 |
| checkedKeys | TREE-03, TREE-05, TREE-10 | 本轮必修或同组必须回归 |
| defaultCheckedKeys | 正常对照/后续适用边界 | 当前覆盖内正常；动态/边界待统一验收 |
| selectable | TREE-03 | 本轮必修或同组必须回归 |
| multiple | TREE-03 | 本轮必修或同组必须回归 |
| selectedKeys | TREE-03, TREE-05 | 本轮必修或同组必须回归 |
| defaultSelectedKeys | 正常对照/后续适用边界 | 当前覆盖内正常；动态/边界待统一验收 |
| loadData | TREE-07 | 本轮必修或同组必须回归 |
| loadedKeys | TREE-05, TREE-07 | 本轮必修或同组必须回归 |
| showIcon | 正常对照/后续适用边界 | 当前覆盖内正常；动态/边界待统一验收 |
| showLine | TREE-02 | 本轮必修或同组必须回归 |
| icon | TREE-02, TREE-05 | 本轮必修或同组必须回归 |
| switcherIcon | TREE-02 | 本轮必修或同组必须回归 |
| switcherLoadingIcon | TREE-01 | 本轮必修或同组必须回归 |
| blockNode | TREE-05 | 本轮必修或同组必须回归 |
| expandAction | TREE-05 | 本轮必修或同组必须回归 |
| titleRender | TREE-02 | 本轮必修或同组必须回归 |
| disabled | 正常对照/后续适用边界 | 当前覆盖内正常；动态/边界待统一验收 |
| draggable | TREE-08 | 本轮必修或同组必须回归 |
| allowDrop | TREE-08 | 本轮必修或同组必须回归 |
| height | TREE-06, TREE-12 | 本轮必修或同组必须回归 |
| itemHeight | TREE-06, TREE-12 | 本轮必修或同组必须回归 |
| scrollWidth | TREE-06 | 本轮必修或同组必须回归 |
| virtual | TREE-06, TREE-12 | 本轮必修或同组必须回归 |
| itemScrollOffset | TREE-04, TREE-06 | 本轮必修或同组必须回归 |
| focusable | TREE-04, TREE-06 | 本轮必修或同组必须回归 |
| activeKey | TREE-04 | 本轮必修或同组必须回归 |
| tabIndex | TREE-04, TREE-06 | 本轮必修或同组必须回归 |
| filterTreeNode | 正常对照/后续适用边界 | 当前覆盖内正常；动态/边界待统一验收 |
| prefixCls | 正常对照/后续适用边界 | 当前覆盖内正常；动态/边界待统一验收 |
| rootStyle | 正常对照/后续适用边界 | 当前覆盖内正常；动态/边界待统一验收 |
| classNames | 正常对照/后续适用边界 | 当前覆盖内正常；动态/边界待统一验收 |
| styles | 正常对照/后续适用边界 | 当前覆盖内正常；动态/边界待统一验收 |

静态导入清单16个文件，已排除同组core自身、外国Tree类型假命中并补JS视觉输入。分开记录公共root/样式汇编、Table过滤/选择、TreeSelect OptionList/数据及级联策略/样式、Transfer树穿梭Demo、相关测试和Vue视觉场景；不把16当作16个Tree组件。Root默认DataNode/模糊数据项类型不是全库所有消费者的上限，通用DOM/视觉meta runner另外追踪。TreeSelect有独立owner，不编辑它。

- packages/ui/src/color-picker/__tests__/dom-attrs.test.ts（test-or-harness）
- packages/ui/src/index.ts（ui-runtime）
- packages/ui/src/style/index.ts（ui-runtime）
- packages/ui/src/table/hooks/use-filter.ts（ui-runtime）
- packages/ui/src/table/hooks/use-selection.ts（ui-runtime）
- packages/ui/src/transfer/demo/tree-transfer.vue（demo）
- packages/ui/src/tree-select/OptionList.ts（ui-runtime）
- packages/ui/src/tree-select/TreeSelect.ts（ui-runtime）
- packages/ui/src/tree-select/__tests__/theme.test.ts（test-or-harness）
- packages/ui/src/tree-select/__tests__/utils.test.ts（test-or-harness）
- packages/ui/src/tree-select/hooks/use-checked-keys.ts（ui-runtime）
- packages/ui/src/tree-select/hooks/use-data-entities.ts（ui-runtime）
- packages/ui/src/tree-select/style/index.ts（ui-runtime）
- packages/ui/src/tree-select/utils/strategy-util.ts（ui-runtime）
- packages/ui/src/tree-select/utils/value-util.ts（ui-runtime）
- tests/visual/render/cases/vue/tree.js（test-or-harness）

保留tests/compat/baselines/tree.dom.json的16个有版本参考场景，以及tests/visual/render/cases/vue/tree.js的basic/directory/show-line三基础场景；未生成或改基线。本轮155已执行semantic/axe/smoke中所含覆盖，不把历史参考当新增契约。

## 已复现问题和成组方案

### TREE-01 完整标题槽与VNodeChild消费

本轮必修，未实施。证据：S01、S02、S03、S04、S05。

公开#title从未消费；合法checkable VNode被默认span替换；title=0与loading字符串被运行时prop校验拒绝/丢弃；false标题被字符串化并告警。不是增加新内容能力，而是兑现已声明VNodeChild/slots。

把title槽按{node,data}动态传到实际节点，槽存在即优先且空结果不回退；统一完整VNodeChild/条件内容，运行时校验与公开类型一致，保留数据标题函数的独立数据契约。

### TREE-02 顶层内容渲染函数与旧D111例外冲突

已接受ADR要求迁移，未实施。证据：公开TreeProps/TreeIconType、ADR0006/0007、TreeSelect.OptionList实际调用。

titleRender及顶层icon/switcherIcon函数是内容扩展，旧“D111程序化上下文例外”注释不能推翻已接受模板插槽决策。VNode数据、数据项icon/title函数、draggable谓词、allowDrop/loadData/filter等不能凭Function机械删除。

按实际通道一次迁移顶层内容函数到具名/作用域槽，保留合法VNode数据与业务算法回调；盘清TreeSelect内部titleRender bridge和所有Demo/类型/根导出后统一改。TreeSelect文件由其owner协调，不在本只读任务实施。

### TREE-03 动态判别配置没有重新投影当前受控状态

本轮必修，未实施。证据：M01、M02、M03、M04、M05、M08、M09。

启用checkable/selectable漏已有受控值；multiple/checkStrictly切换保留旧投影；显式autoExpandParent=true时异步到达的受控key仍不补祖先，关闭autoExpandParent也不撤派生祖先；原位disabled能力变化不重导电。M05最终用显式live autoExpandParent，避免混淆defaultExpandParent仅首挂的语义。

先集中区分用户意图键、受控当前值与派生展开/全选/半选，按全部决定输入重新计算；数据/能力驱动纯派生不发用户change。保留既有Issue16受控treeData重导电的8条覆盖，补受控拒绝、交接、数组/对象形态与动态配置矩阵。

### TREE-04 activeKey首挂TDZ、受控拒绝与公开事件类型脱节

本轮必修，未实施。证据：M06、M07、public-types.log。

非空activeKey的immediate watch早于listRef初始化，合法首挂抛ReferenceError；挂后赋值避开TDZ后，键盘仍直接写内部active状态，无法由受控父级拒绝。运行时update:activeKey/activeChange在TreeEmits中均缺失。

按Vue mounted/post-flush与真实列表ref安排首次和后续跟随滚动，保留受控请求而不偷写已受控当前值。统一已有额外active通道的文档/类型，不能因任务简称“四model”删掉已存在接口。

### TREE-05 DirectoryTree wrapper完整Props/事件/控制链

本轮必修，未实施。证据：D01、D02、D03、D04、D05、D06、D08、D07正常对照。

默认expandAction先被Tree的false填满，??click永远不生效；blockNode总true、custom icon被覆盖；21个声明emit仅接expand/select，其它model/check/load/native等丢链；展开和选中忽略受控拒绝。数字defaultExpandAll在defaultExpandParent=false时因Object.keys字符串化失效，默认父补全路径D07正常。

Directory默认值在自己的Props层定义并保留显式false/自定义图标；完整转发声明事件与四正式model；共享受控/非受控规则并保留当前shift/ctrl/meta多选，不用双写内层受控ref模拟。保持F10已验证的原生class/style行为。

### TREE-06 公开focus/scrollTo与真实NodeList ref断链

本轮必修，未实施。证据：E01、E02、E03、browser真实holder正反对照。

TreeRef.focus声明存在但runtime undefined。scrollTo存在却因NodeList未绑定listRef完全不滚；真正holder上TreeRef=0、直接NodeList=560，NodeList及VirtualList末端正常。autoExpand仅把目标key放入展开集，不展开祖先。

连到实际所属列表和焦点宿主，明确数值/key/align/offset/autoExpand的时机与受控请求；保留TreeSelect依赖的onKeyDown内部bridge。DirectoryRef是否同面见待裁决，不把未承诺的新能力夹入。

### TREE-07 受控loadedKeys拒绝导致完成后重复请求

本轮必修，未实施。证据：M10、N05正常对照。

一次load完成而父级未接受loadedKeys后，loading=false触发节点watch立即再次load；有界探针第二次保持pending，实测2次请求。正常非受控完成只请求/emit一次。不能用无限Promise.resolve探针拖死进程，也不能把拒绝受控请求当成允许自动轮询。

为节点/请求代次区分in-flight、完成意图和当前受控展示，保证一次交互/初始化请求不因父级拒绝自激重试；同步核对失败重试、移除/重排节点、卸载/重挂与并发加载，保留合理异步业务函数。

### TREE-08 默认DnD、拒绝落点、timer与指示线链

本轮必修，未实施。证据：G01、G03、G04、G05、browser真实拖入/0px指示线。

allowDrop默认undefined却被当函数调用，普通draggable拖入另一节点直接抛错；拒绝落点仍显示指示线；卸载仍留0/800ms两timer。DropIndicator未挂所需class、number高度被CSSOM忽略为0px、inline红色盖主题且direction未消费；indent量测也受断开的listRef影响。

在Tree入口提供明确允许默认，统一落点允许状态/显示/事件；释放实例timer与全局监听，绑定真实indent。指示线使用所属class、有效CSS单位和当前主题/逻辑方向；旧上游红色字面量注释不是现规范豁免。未来必须真实拖放跨层/首尾/RTL/disabled/多实例验证，不能只跑5条纯坐标算法。

### TREE-09 原生事件与语义nativeEvent/节点类型不一致

本轮必修，未实施。证据：G02、G06-select、G06-check、G06-expand、G07、TreeEmits声明。

mouseEnter首参数为{event,node}而非原生事件；Drag同类源链待同组逐项验证。键盘触发的select/check/expand都把nativeEvent写成undefined，却公开声明MouseEvent。公开EventDataNode必填3个drag布尔字段在allProps丢失，实际undefined。

按ADR0007原生事件先给DOM Event，附加节点资料与业务状态事件分别明确；保留真实KeyboardEvent并修正事件联合类型，不以强制断言伪造MouseEvent。统一Tree/Directory全部21条声明、传递、载荷及构造器推导类型，补外部dragEnd node=null等边界。

### TREE-10 原型key不是合法实体，__proto__丢own entry

本轮必修，共享core必须成组验收。证据：K01、K02、N03数字0正常对照。

空树getPath(constructor)返回Object函数，getEntity说不存在返回undefined却查到原型；__proto__被赋成实体表原型而不在own keys中，破坏公开Record/后续枚举。不是全局Object.prototype污染结论，只记录已证映射错误。

实体写入/查询/级联缺失key检查只处理own entries并安全保留合法字符串key与数字0；扫描共享core同类直接索引。Table/TreeSelect均消费该core，必须由Root跑实际依赖回归，不能只修getPath表面。

### TREE-11 fieldNames数据类型与ARIA id所有权

本轮必修，未实施。证据：F01、public-types.log。

runtime能显示{id,name}映射，公开treeData却要求默认key。映射id又被rest数据当DOM attrs透传，覆盖生成节点id，checkbox aria-labelledby仍引用旧id，实测目标不存在。

用明确数据泛型/字段映射契约支持真实合法输入，不靠as never；区分用户数据字段与显式DOM attrs，消耗映射键后维持节点id/ARIA归属和多实例唯一性。保留已验收Tree根class/style fallthrough，不借机统一重写所有attrs。

### TREE-12 全部9Token、静态CSS主题与虚拟高度

本轮必修，未实施；canonical旧路径由CP owner已修待合验。证据：P02、browser64项、P01旧红→当前绿。

完整9字段component配置没有投射，虚拟估算仍28而titleHeight40应44；getDesignToken的Alias不存在Tree.titleHeight，断言伪造读域。静态9声明固定默认，CSS-only dark/compact组合16字段值不跟随当前Alias；Directory hover绕过共享nodeHoverBg。所有9变量的真实CSS消费有正对照，不把nodeHoverColor误判为无消费者。

成组同步9Token投射、Alias/CSS-only默认变量关系与估算/真实行高，允许原生style覆盖、区分无源与显式空源，验证嵌套/动态/卸载/多实例。number标题高度契约与Demo30px字符串一次裁决；不只改canonical读取留下真实24px行高。CP的useThemeConfig现在读active canonical fallback，P01当前36正常；该共享修复不冒领为Tree已实现。

### TREE-13 公开类型文件与实际组件构造器不一致

本轮必修，未实施。证据：public-types.log、type.test-d.ts现7场景2负例。

vue-tsc实际5诊断：合法字段映射输入被拒；2个运行active事件不在TreeEmits；实际组件$emit错误payload和未知slot负例未被拒绝。旧类型用例多为手写接口/强断言，并未约束实际组件；仅运行通过155不能证明L3。

让实际Props/Slots/Emits/Expose与公开定义一致；保留合法输入正例、显式非法负例，迁移绑定至实际Ctor/SFC消费。只按已确认契约改错误类型，不放宽成any。

### TREE-14 19对Demo与公开文档有可观察失效/虚构规模

本轮必修，未实施。证据：Demo源码/Markdown全索引、scroll-to目标key查无节点、draggable无drop处理。

scroll-to按钮目标不在5节点数据里；文案却称百万。big-data只有62节点而称1000+；draggable仅log dragEnter、无drop重排且受控expandedKeys不接更新。component-token给number字段30px且原本无投射。18份说明残留字面\n、旧README/PLAN用上游形态锁规格，部分API表漏字段/错误strict说明。

保留真实组件职责（Tree不私自重排用户数据），使拖放Demo自己完整处理合法drop和展开请求；真实可滚动目标/可观察复位，更新数据规模、类型与文案。同步双语API/19对Demo/迁移，移除旧无效渲染函数写法并给替代覆盖，不生成/批准旧PNG冒充当前验收。

## 19对Demo盘点

| Demo | 结论/验收路径 |
| --- | --- |
| basic-controlled | 四键中的展开/勾选/选中受控示例；需补拒绝/动态模型与业务状态稳定。 |
| basic | 默认展开/选择/勾选；旧smoke正常，保留双通道和数据。 |
| big-data | 实际62节点而文案1000+，需如实改规模或提供真实大数据场景，保留虚拟化。 |
| block-node | Switch控制整行、选中反馈；真实使用场景保留，普通Tree与Directory显式false分开验证。 |
| component-token | number titleHeight却给30px，且没有投射；需9Token可观察展示/动态复位。 |
| customized-icon | 顶层渲染函数与数据项icon/VNode边界；迁移当前模板扩展并保留节点数据。 |
| directory-debug | 目录图标/选中视觉，和正式Directory同组，不以debug跳过。 |
| directory | 目录默认点击/图标与shift/ctrl(meta)多选；当前默认点击无效属于必修。 |
| drag-debug | 普通draggable即受allowDrop缺省报错；指示线真实class/高度/主题/方向同组。 |
| draggable | 仅console.log dragEnter，无drop数据重排、受控展开不更新；必须完整真实流程。 |
| dynamic | loadData异步追加；正常完成对照与受控拒绝/失败/卸载、数据变化同组。 |
| line-debug | 调试连接线也纳入NodeData/indents/样式所有权，不单独改视觉。 |
| line | 连接线及数据图标；保留默认、leaf等行为与当前语义样式。 |
| multiple-line | 长标题配blockNode；行高Token/真实测量/虚拟估算和裁切统一验证。 |
| scroll-to | TARGET_KEY不在数据中，按钮无效；文案百万与5节点不符，ref/祖先/时机一起修。 |
| search | 文案仅承诺匹配自动展开父级，未谎称缺少高亮为缺陷；autoExpandParent真值与收起需回归。 |
| style-class | 5语义区域对象/函数与原生attrs；保留F10既有唯一/动态class正覆盖。 |
| switcher-icon | 当前VNode展开图标通道保留，函数迁移/完整VNodeChild另有明确范围。 |
| virtual-scroll | height与窗口渲染；需实际滚动/估算/测量/复位，不只计数。 |

## 正常对照、裁决与验证边界

- 旧10个运行文件155/155（含18 semantic项和16历史DOM场景、19Demo smoke/axe、纯工具/键盘/Issue16）实际exit0，仅对应已执行范围。
- Root Tree受控selectedKeys请求可被拒绝，model/semantic同发；不把Directory失败扩写成所有Tree受控失败。
- 现存VNode标题编辑器在普通selected prop更新时保留DOM identity；numeric0普通getPath与Directory默认父补全路径正常。
- 普通data-only SSR与Chrome水合无warning；正常非受控load完成只请求及emit一次。
- 全部9个CSS变量都有真实消费正对照：尺寸3、普通hover2、普通selected2、Directory selected2；normal nodeHoverColor没有泄漏到非hover。
- 真实浏览器及jsdom直接NodeList.scrollTo560能滚到560，底层VirtualList没有被表面误判为死接口。
- CP owner改canonical helper后，同app fallback P01估算28→36，当前正常；Tree本体没有因此获得完整9Token/样式验收。

- D1 Directory公开Ref面：需Root裁决，未作为已证缺陷。Directory expose({})且暂无DirectoryRef独立声明；TreeRef.focus/scroll是明确必修。建议Directory共享必要Tree方法，但不能仅凭上游forwardRef把新能力夹入，先明确公开契约。
- D2 key规范与非法数域：按现输入语义保留并明确。Record键会合并数字0与字符串0；建议明确全树key按既有映射表示唯一，不在本只读单元私改公开Record为Map。defaultExpandParent仅初始化，未因该default动态不重跑就判缺陷；M05最终显式autoExpandParent=true。height/itemHeight数值与CSS前缀合法域按当前语义，未扩展任意非法输入归一化。
- D3 titleRender与数据项函数边界：需在成组设计时明确。ADR0006已要求顶层渲染函数迁移；DataNode.title/icon与showLine配置内函数按真实数据职责单独评估，不凭Function或React名称一刀切。TreeSelect owner协同真实内部bridge，不能为保留顶层函数继续牺牲#title。

本轮没有把最初错误假设保成生产缺陷：原scroll探针量了外层role节点，已改实际holder并增加直接NodeList560正对照；numeric Directory默认路径保留绿，仅明确关闭defaultExpandParent后的有效边界红；active首挂TDZ与挂后受控拒绝拆案；autoExpandParent使用显式live true；CSS首轮采样含过渡中间值，改用现有motion:false输入保持全部原断言并保留原报告。9个变量直接CSS路径全绿，nodeHoverColor不是无消费者。初始及before-*文件完整保留。

## 真实命令与结果

| 命令 | 真实结果 |
| --- | --- |
| TREE_AUDIT_STAGE=existing pnpm exec vitest run --config /tmp/apollo-tree-contract-audit/vitest.config.mjs | exit0；10文件155/155；包括7类型场景的另行编译证据并不由本运行计数代替 |
| TREE_AUDIT_STAGE=probe pnpm exec vitest run --config /tmp/apollo-tree-contract-audit/vitest.config.mjs | exit1；35项 6绿/29红；当前P01已受CP canonical helper修复而绿 |
| TREE_AUDIT_STAGE=extension pnpm exec vitest run --config /tmp/apollo-tree-contract-audit/vitest.config.mjs | exit1；10项 2绿/8红；S05是内容政策观察，不算已验正常 |
| pnpm exec vue-tsc --project /tmp/apollo-tree-contract-audit/tsconfig.public-types.json --noEmit | exit2；5个精确类型诊断，原7场景/2负例文件无新增诊断；typed positive覆盖实际合法VNode/active输入 |
| node /tmp/apollo-tree-contract-audit/browser.mjs | exit1；64项 33绿/31红，零未捕获console错误；allowDrop业务错误被errorHandler捕获并作为红项，绝非零业务错误 |

以上测试全部使用/tmp config/fixture/cache与首方src alias；guard禁止首方dist。existing加载1896模块、probe962、extension实际值见loaded-source.json，所有guard forbidden/changed均为空；浏览器加载963首方源码，前后SHA无变化。Tree/core独立75文件前后SHA核对为真。发生在其它owner的CP helper修改按独立来源版本记录，不能把前后两版局部绿拼成最终提交全库通过。

## 待实施和暂停边界

- 本任务无任何Tree/共享core/测试/Demo/仓库文档实现修改；全部整改、迁移及发布/Registry仍未实施。
- 正常motion时长下的真实重复展开/收起、快速受控反转/中断、focus/selection、多实例、原生dir与RTL跨层DnD、已完成请求的卸载/重挂/外部数据删除，尚需后续实现验收。
- 19Demo已全量源码/文案盘点并执行现有smoke/axe；未把smoke等同19个完整业务流程已逐个交互验收。
- 未运行本轮Tree published、全库、最终同一提交全部门禁，未生成/更新视觉PNG或DOM基线。16个参考DOM/三基础视觉场景保留其证据身份。
- TreeSelect完整API与CP/locale/Form大组属于其它owner；当前共享helper修复待Root整合验收。
- 用户要求本批启动任务完毕后暂停：报告交接后结束，只读Tree不实施，不启动下一单元。

建议后续整体实施顺序：先公开模板/事件/类型与Directory/模型投影一次定契约及迁移 → ref/加载/DnD生命周期和共享core → 9Token/真实高度/静态CSS与全部Demo → 同一冻结提交执行Tree/关联消费者/严格类型/Node SSR及真实浏览器/发布入口和必要视觉Docs门禁。允许分主题提交，不把一次修高度/一个字段绿灯算单元完成。此处是方案和红灯交接，不是实施许可。
