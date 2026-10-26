# List整改单元：当前契约盘点与统一验收

盘点基线：`0148b962`（生产List与11926cc2相同；后续提交为文档站发布及证据）。本文件是List、ListItem、ListItemMeta的完整整改单元，后续修复和证据统一更新，不按字段建立完成报告。

## 范围与验收

覆盖16个List Props、6个Item Props、4个Meta Props，现有8/3/3个内容槽，原生attrs、分页配置/回调与状态、三个nativeElement、复合导出/安装、响应式Provider、11个Component Token及静态CSS、12个实际Demo与双语API。关联链路包括Spin、Pagination、Row/Col/useBreakpoint、ConfigProvider及theme当前上下文；共享修改须复验实际消费者，但不据此宣称共享组件全部入口完成。

分类为“源码已核对/已有行为证据正常”“本轮必修或待失败复现”“需要集中设计”“另案”。下表保留动手前的源码盘点，修后状态见末尾阶段验收。本单元仍开放：主链路已集中整改，Apollo视觉矩阵与最终完整收口尚未完成。H05的61文件1246条（含List）是本单元前基线，不是修后验收。

验收要求：完整清单逐项关闭；先有失败复现，再统一实现/类型/测试/Demo/双语文档；覆盖受控/无控与控制移除、配置延迟启用/替换/移除、条件和空槽、反复切换/卸载重挂、原生输入/焦点、嵌套与多实例、SSR/水合、RTL/断点和默认/暗色/紧凑。冻结实现后执行相关四层、类型/真实SFC消费、生产构建/L7、浏览器与Apollo自有视觉、Docs和派生状态检查；严格区分本单元、共享专项及最终全库门禁。

## 修前盘点：Props声明→传递→消费清单

| 公开项 | 当前实际链路与状态 |
|---|---|
| List.bordered | props→根-bordered类→根边框/子项内边距CSS；源码存在，嵌套父选择器可能穿透内层，需浏览器补验 |
| dataSource | 当前computed→分页切片→#item→带key Fragment→ul或Row；原有数据/排序/水合通过，动态配置组合待补 |
| extra | 类型与文档存在，运行时从未读取，没有渲染落点；本轮必修，集中确定根级内容位置及原生#extra |
| grid.gutter | grid→Row.gutter→当前useGutter/Row context→Col；现有固定/响应式例，需当前配置/关闭恢复/卸载补验 |
| grid.column/xs…xxxl | 当前断点先取最大活动项，再读grid[bp]或column；稀疏配置不会继续向较小已配置断点回退，待失败复现后必修 |
| id | props→rootAttrs→实际div；原有attrs-only/SSR正常 |
| itemLayout | props→根类+computed ListContext→Item两段内容和Meta CSS；切换extra/布局会重建正文容器，原生编辑状态/焦点需复现 |
| loading | boolean或对象→Spin；List的isLoading却只读!!spinning，空对象与Spin默认true矛盾，待复现；SpinProps各字段保留转发核查 |
| loadMore | 当前槽存在优先于prop→替换底部分页；空槽也抑制底部分页，顶部保留，已有测试正常 |
| pagination | 精确PaginationConfig被转换为多处unknown/Record断言→合并状态→两个Pagination；本轮去掉掩盖数据关系的断言，核对全部字段/事件/控制移除 |
| prefixCls | 当前computed更新根/ul/页头等；Item/Meta独立从全局取前缀，未继承List局部前缀，需同组复现/统一设计；自定义静态CSS仍按D04预生成 |
| rowKey | 函数/字段名→item.key→索引兜底；字符串/数字含0/空字符串已验证；重复key责任和页面相对index记录明确 |
| size | props优先→当前useSize→lg/sm类；default不加类，原有测试正常；嵌套尺寸CSS与主题补验 |
| split | default true→根类→子项边框；原有基本开关正常；top-only分页被当“条目后内容”及嵌套隔离需验证 |
| header/footer | render读取一次，槽存在优先，isEmptyVNode决定容器；0/空/移除、原生控件与正文身份已有专项，当前主题/嵌套补验 |
| locale.emptyText | prop→||Provider.renderEmpty||DefaultRenderEmpty；0/false/空字符串/null被默认内容覆盖，已有VNode声明和Vue空内容语义矛盾，待复现后必修 |
| Item.prefixCls | 当前computed；局部覆盖与List/Meta继承链统一核查 |
| Item.classNames/styles.actions | 当前Provider.item与局部值逐次读取→actions ul；合并源码正常，替换/移除与多实例需补验 |
| Item.classNames/styles.extra | 只在vertical非空额外区消费，horizontal完全无落点；本轮必修并与稳定正文结构集中设计 |
| Item.extra | 槽优先→isEmptyVNode→vertical main/extra或平级内容；0已支持，切换布局会替换正文层级，需焦点/原生值复现 |
| Item.actions | 槽展开/过滤空白；prop数组未经同类过滤就生成li和分隔符，条件数据项待核查；稳定key/同包装组保留 |
| Item.colStyle | 仅grid的Col根style；List并未自动传此prop，现有文案“由List传入”不实，需校正文档并验证实际落点 |
| Meta.prefixCls/avatar/title/description | 当前内容槽优先→各自非空包装；title h4、0、空/条件槽及attrs/ref已有证据；局部前缀继承与vertical CSS嵌套隔离待补 |

## Slots / Emits / models / Expose / exports

| 项 | 当前契约与核查结论 |
|---|---|
| List.default | 任意手动正文，存在即抑制默认空态；与数据项一起传Spin.default。调用者拥有任意自定义正文的HTML语义，本轮不引入自动分组/克隆引擎 |
| List.item | 单对象{item:T,index}，T从dataSource推断，index当前页相对；不存在时不渲染数据项，保留原有泛型/空/条件/SSR场景 |
| header/footer/loadMore | 当前调用一次，以存在性优先，不在computed缓存槽；前述表覆盖 |
| paginationItemRender/Total/SizeChanger | 直接把当前函数转发给每个Pagination，位置top/bottom/both；全部共享槽scope与动作按Pagination既有声明核对，不增加旧渲染函数兼容通道 |
| Item default/extra/actions | 无参数内容槽，当前逐次读取；actions Fragment展开/空白/稳定key已有证据，布局切换与prop空项补验 |
| Meta avatar/title/description | 无参数，当前存在性优先，空包装抑制已验证 |
| List自身emits/v-model | 不声明业务emits和模型；原生DOM事件经attrs落根。分页current/pageSize属于嵌套PaginationConfig，不能凭习惯添加List模型别名 |
| 分页配置onChange/onShowSizeChange | 两个业务数值参数；内部无论受控与否都更新ref再调用，控制拒绝/外部赋值/移除/首次启用默认值尚缺覆盖 |
| nativeElement | List/Meta为nullable div；Item非grid为li，grid暴露Col布局div、attrs落内层语义Item。核对卸载、切换及文档，不把类型当已证明行为 |
| named/default/install/static | List、ListItem、ListItemMeta及A注册名；Object.assign复合导出。已有身份/类型回归保留，追加生产SFC/发布声明核对 |
| style/token类型与函数 | 11字段全部声明和CSS引用存在，但运行时只用静态默认值；prepareComponentToken真实返回完整11字段却声明Partial并被强转，需同步精确类型 |

## 分页、Provider、样式与关联链路

| 链路 | 当前事实/本轮分类 |
|---|---|
| 分页所有公开字段 | PaginationProps的数据、locale、样式、disabled/simple/quickJumper/sizeChanger均经rest；align却被强制end覆盖，position只属List布局却仍向子组件传递，待真实行为复现 |
| 分页本地/服务端数据 | 本地按current/pageSize切片；显式total大于本地结果时保留远程页数据，不能因修当前页越界而删除该场景 |
| 默认值/当前值 | refs只在List setup读defaultCurrent/defaultPageSize；外部current/pageSize无同步到内态，动态首次启用/控制移除、拒绝控制及缩短后恢复需统一确定并验证 |
| ConfigProvider.components.list | useComponentConfig是读取当前Proxy，className/style/item字段在render访问；不能误报为冻结。ListConfig本身已有精确公开类型；Provider通用components映射的整体精确化另案，不新增第二配置通道 |
| Spin共享当前配置 | List传SpinProps，但Spin setup解构Provider值，direction/indicator/样式成为快照；仅本轮相关链路如确认失败须一起修并覆盖其他Spin消费者，不宣称Spin整单元完成 |
| renderEmpty共享类型 | RenderEmptyHandler返回unknown，List靠VNodeChild断言消费；最终方案不得增加断言绕过，评估收窄到真实VNodeChild并补受影响调用者/正负类型 |
| 主题11字段 | component-token Demo宣称theme.components.List覆盖，List没有读取useTheme；container再声明默认11变量，连根原生CSS变量也会被遮蔽。属于现有接口无效，必须同组解决 |
| 样式作用域/嵌套 | size/bordered/vertical/split等多处祖先选择器可影响嵌套List；需按实际消费成组复现，不能继续以“上游同判”豁免 |
| RTL | 根只加-rtl类，CSS没有对应direction；原生dir与Provider实际方向须浏览器核对，不能只断言class |
| 焦点与实际选择器 | 全后代outline:none消除原生控件焦点；两条规则明确保留了不命中真实DOM的选择器。需真实键盘/几何复现，修正当前行为；旧“必须保留”测试按现规范说明依据并保留替代覆盖 |
| attrs | List用mergeDomAttrs在render合并，原生字符串/数组style、id已验证；Item/Meta显式路由当前attrs。记录grid Col与内层Item两个落点、原生事件数组/once等适用边界 |
| 响应性/生命周期 | ListContext computed，useBreakpoint启用时发布最新快照、挂载订阅/卸载清理；需联动稀疏配置、条件挂载及多实例。Spin恒有默认槽，嵌套容器存在性稳定，不能误报loading必然重挂正文 |
| 12个实际Demo | 已逐个读取basic/simple/vertical/grid/responsive/loadmore/pagination/spin-debug/component-token/pagination-simple/empty/item-extra；所有metadata/API与最终运行验收同步。loadmore固定500ms请求模拟未清理，需核对重复点击/卸载，不以旧文件计数代替场景 |

## 集中设计与另案边界

本轮以既有API兑现、配置状态与样式/内容稳定性为根因分组，可按独立主题提交，但完整List清单验收后才切换。根extra位置与原生槽、Item正文稳定结构、主题变量继承、分页状态和作用域CSS在动手前集中评估；不逐字段迁移、不保留错误React回调或DOM兼容层。

已有合理的grid/非grid结构及nativeElement差异有明确文档，先验证实际交互，再判断是否需要调整，不能仅因标签不同就认定缺陷。新拖拽/网络无限滚动/虚拟化引擎是另案，Listy仍为独立组件。全局D04前缀样式策略、Provider全部配置映射类型及Spin其他入口不由本单元冒充验收。

## 阶段验收：主链路已验证，整单元仍开放

对应实现提交：`23de152079c096fccf34d0f3907a8f649276de2b`（已推送）。文档站随后从该提交实际发布，部署与线上验收见 [站点发布记录](2026-10-26-docs-publication.md)。

本阶段按根因集中修改，未切换其他组件单元。公开迁移集中见 [list-contracts.md](../migrations/list-contracts.md)，可复跑命令及55项浏览器实际值见 [结构化证据](evidence/list-contract.json)。验证源码指纹覆盖13个生产文件，SHA256为 `5482c6d1be29077c5b2221c1d4c18495faf3d35a938837f63d68ca340b89af89`。

| 根因组 | 已实现与已验证 |
|---|---|
| 内容与语义 | 根extra有实际渲染与原生槽（List现为9个槽）；Item稳定main/extra兑现两种布局的语义样式并保留编辑值/焦点；actions过滤空项、保留key及数字0；原始true/空字符串不再创建空包装 |
| 配置与上下文 | 最近List/Item上下文传递当前前缀和所属样式状态；Spin读取当前Provider与attrs；locale/renderEmpty显式空值保留；RenderEmptyHandler和默认渲染器均返回实际Vue内容，正负类型补齐 |
| 分页 | current/pageSize分别受控，接收值同步、控制移除、拒绝请求、首次启用、反复开关、数据缩短/恢复；align原样转发、position不泄漏到DOM；服务端total结果页保留 |
| 主题与样式 | 11个既有Token兑现并支持移除/恢复，容器继承原生根变量；嵌套size/border/split/vertical隔离；稀疏断点375/900/1300/1700匹配；根extra桌面居右/移动下置；RTL、真实loading区与窄屏操作区生效 |
| 可访问性 | 保留原生Tab焦点轮廓与Space操作。真实Chrome复现操作项3.29:1、描述/默认空态3.36:1；同组正常文字改用colorTextSecondary，六个实际子树axe零违规；未跳过contrast规则 |
| 同步交付 | 实现、精确类型、12个现有Demo、双语API、README、集中迁移与来源清单同步；主题Demo支持实际切换，点赞Demo显示整表摘要，loadmore请求卸载清理 |

最初16条行为复现15红/1已有正常；共享空内容原语24条中新增1红。旧生产包47项浏览器检查41红/6正常；后续真实对比度复现另有5个失败节点。修后检查如下，两组运行回归有交集，**不累加成全库通过数**。

| 命令/范围 | 结果 |
|---|---|
| `pnpm run lint:types` | 通过，严格检查无放宽 |
| List/Spin/ConfigProvider + utils空内容，unit/dom-contract/a11y/theme，单worker | 29文件508条通过；35个机械参考用例全部保留，逐用例精确差异记录，未改共享归一化或旧基线 |
| 23个实际受影响组件 + utils空内容，unit，单worker | 99文件1788条通过，包含Table/QRCode及所有空内容消费者；未宣称这些组件完整审计完成 |
| List/Spin/ConfigProvider/Pagination类型 | 10文件152条通过，无类型错误；真实浏览器SFC及发布声明消费端分别通过 |
| UI与utils构建、两包L7 strict | 构建通过；UI11项fail=0/pending=0；utils11项fail=0/pending=0，5项有架构依据n/a |
| `node tests/browser/list-contract-audit.mjs` | 55项通过，Chrome150.0.7871.125，零Vue/页面错误；真实主题/几何/键盘/编辑器/axe，不是jsdom样式推测 |
| `node tests/browser/list-slots.mjs` | 原有动态插槽、keyed DOM、分页、loadmore、点赞及响应式通过；新增真实主题Demo反复开关/DOM身份与整表摘要断言通过 |

截图已查看（主题排版及两类extra），这不是Apollo批准的像素基线。剩余必做：List自有视觉基线、默认/暗色/紧凑矩阵及完整清单最终复核。该单元保持开放，不能把本阶段或历史completed状态改称全部收口。其他组件的完整API审计、共享Empty/Spin其他入口与全库最终同一提交门禁仍按原范围推进。

派生状态检查曾因utils测试数量变化使foundation记录过期而失败；已按工具刷新派生统计后重新检查，未改已有验证日期或降低状态要求。Root格式门禁为0错误，37个既有警告/5条信息仍保留。


Docs内容检查、严格类型、14文件157条测试及SSG构建通过。Registry全套检查、来源清单检查通过；来源521项（154内容候选、68渲染候选、137数据/配置、162内部/废弃），其中20项implemented-verified、202项待复核。新对齐测试的类名最初误写为align-center，核对Pagination真实契约后改为center；未删除对齐场景，旧List强制end的消费链缺陷已修正。

## 视觉与主题验收范围（实施前盘点）

接续基线为56df56e8。旧视觉入口只有11个固定320px宽度的参考用例，33张React参考图；没有List自有批准图，也未检查当前主题、原生键盘焦点、根extra或嵌套隔离。旧参考矩阵及图片保留。

本阶段起初规划18个Apollo状态、每态mobile/tablet/desktop，共54张；核对同一文案根因后补全屏loading，最终19态57张：basic/meta/actions/bordered/vertical/grid/pagination/loading/loading-fullscreen/empty/size/rtl，以及extra/nested/tokens/theme-dark/theme-compact/theme-dark-compact/native-focus。主题三态的主列表使用extra同一实际内容；字体、背景、间距读取当前主题，截图前检查状态与几何。候选必须真实非空、无横向溢出，实际DOM/主题/分页/焦点/axe断言通过后才可审阅。支持动态状态的交互仍保留已有55项浏览器与单元覆盖，不拿静态图代替交互。

验收为：先生成候选并处理本单元内真实发现，再查看所有57张；固定同一生产与测试源码提交，重新捕获并核对哈希后接受为Apollo基线，重新比较57张且检查完整性/重复状态。默认、暗色、紧凑及组合态均需实际CSS和axe证据。最终复核完整清单及适用门禁，再决定是否关闭本单元；不承接新虚拟化/拖拽能力，不借本轮升级其他组件整单元状态。

首轮54项中18失败，原始报告保存在阶段证据中。真实缺陷为：带边框默认行的padding-inline覆盖组件Token；Spin文案继承primary只有4.1:1；全局BASE_CSS强制原生控件color继承，使暗色按钮浅字配浅色UA背景，仅1.09:1。共享reset的调用方是汇总及各组件CSS；仅移除该color强制，保留字体/盒模型等归一化，让未自定义的原生控件保留浏览器前景/背景配对及禁用颜色，Apollo组件自己的主题色继续由组件CSS声明。受影响的Button/Input/原生input/select/textarea/disabled与既有Image批准图需要实际验证，未把它改称其他组件整单元已完成。

另外9项为验收工具误报：compact的paddingLG实际16，原预期24错误；截图稳定器主动隐藏focus，不能用于原生焦点图。保留紧凑场景并按当前主题派生值修正；稳定器新增保留原生焦点的显式选项，只供focus状态使用，未给产品注入伪造焦点样式、未改变默认参考稳定化与阈值。Token修复把bordered默认间距放在根变量，显式组件Token/原生变量优先，仍保持11个公开Token和三档尺寸；新增控制切换与移除/恢复回归。

同组检查实际复现全屏Spin白字与遮罩背景只有2.37:1（3个视口均红）。普通文案改用colorText，全屏文案在原白字下使用colorBgSpotlight及Token间距/圆角，显式styles.description仍优先；指示器主色和全屏遮罩Token不变。中间候选曾因全屏fixed根而零高度，只检查原根attached、覆盖层visible与完整截图；以下逐图审阅进一步确认布局缺陷后，已替换为根visible、正文位于标题下方和真实覆盖层几何断言。

逐图审阅仍发现全屏正文跑到左上角，与页面标题重叠，拒绝这3张候选。新增共享Spin3条复现全红：root误fixed、mask落错元素、样式工厂缓存挂载值。集中修为root正文保留文档流、section/mask单独fixed、关闭mask隐藏/inert且不消费内容、语义工厂上下文shallowReactive。mask字段直接对应实际遮罩且取消错误弃用；不保留旧root遮罩样式复制。新增Root/ref/编辑器/当前样式与反复切换回归，所有47个Spin参考用例保留，仅6个已审阅全屏/遮罩差异精确登记。实际浏览器还检查覆盖层命中测试、阻止点击正文、关闭隔离和模式切换，不能只凭axe批准图。完整Spin条件indicator/description槽等未转发给List的入口不由此声明完成，后续Spin整单元继续复核。

## 视觉整改实现验收（批准前记录）

完整生产清单保持在本文件，新增修复只处理上述验收中实际复现的同组问题。当前16个生产文件源码指纹为 `ddecab25196b7f2c4896488188d2da36ad54bbd61ca153881f3a8dfbbde52167`，逐文件哈希、首轮18项失败、全屏对比度3项失败、修后实际值及审图哈希见 [结构化证据](evidence/list-visual-contract.json)。历史23de阶段证据保留。

| 检查 | 本阶段实际结果 |
|---|---|
| List/Spin/ConfigProvider/空内容四层，单worker | 30文件512条通过，含3条全屏失败复现与带边框Token回归；35条List和47条Spin参考场景保留 |
| 共享BASE_CSS消费者 | Button/Input/Table四层26文件715条，QRCode另7文件59条；均通过，不升级这些组件的整单元状态 |
| 严格类型与消费端 | 根严格通过；List/Spin/ConfigProvider/Pagination10文件152条无类型错误；实际List与原生控件SFC、发布List声明通过 |
| 发布产物 | UI构建含dts及69份CSS完成；L7 strict11项，fail=0/pending=0；13个tarball独立Vite与Webpack消费通过 |
| 生产Chrome | List97项及原有插槽/真实Demo通过；原生控件明暗/禁用/组件颜色19项；picker四入口和五类overlay原生attrs回归通过 |
| Image共享影响 | 富内容、进度、关闭、原生操作、焦点/分组删除等26场景与独立源主题SSR水合通过；旧24图中18张exact，6张rich/progress仅原生控件文字颜色有意变化，所有6张新旧图已逐张查看 |
| Apollo候选 | 同一次冻结生产源码捕获57张List+24张Image，81项状态/几何/axe均通过；57张List全部逐张审阅，旧3张全屏错位图拒绝后重新验证；19态均有三视口，未改对比阈值 |
| 工具与派生检查 | List/Image矩阵4条通过；Registry全套与来源清单通过，仍521行、202待复核；根格式0错误，37既有警告/5信息保留 |
| 文档 | 内容生成/校验、严格类型、14文件157条及SSG构建通过；Spin全屏原生输入Demo、List/Spin双语API与共享原生控件迁移同步 |

批准前仍需：清洁实现提交重新捕获并比对已审图哈希；只接受57张List和6张有意变化Image，保留18张未变Image及旧参考；执行最终像素比较与完整清单收口。候选已通过不等于批准基线，也不等于全库最终门禁通过。
