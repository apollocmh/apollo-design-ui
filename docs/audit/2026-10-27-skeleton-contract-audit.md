# Skeleton及五个子组件整改单元

盘点基线c6fff66ecea8bb589f007241bc299f75ea4f58cd。**整组完整清单已统一验收，最终文档发布与线上核验另记**。范围包含Skeleton/Avatar/Button/Input/Image/Node、内部Element/Title/Paragraph、长度与样式工具、根/深入口类型、六个主语义落点/子组件两个落点、八个Token、原八个Demo和双语文档。盘点时14个组件生产文件及根类型入口全部核对；实现后加上本组两个私有composable共17个生产文件。实际UI消费者为Card和Statistic，静态样式生成亦为调用者。

## 实施前完整清单

| 声明→传递→消费 | 分类及本轮验收标准 |
|---|---|
| 主组件9个Props：active/loading/prefixCls/avatar/title/paragraph/round/classNames/styles | loading未传/undefined/true显示骨架，false仅默认槽、不套容器；保留有价值的三态与几何矩阵。待本轮复验正常默认与动态开关，不复制React键存在判据 |
| 三块配置与几何 | 基础头像大号/形状、标题宽度38%/50%、段落2/3行与末行/数组宽度有效逻辑保留。必修：配置className覆盖掉语义类、配置style被最终undefined丢弃；按当前对象合并局部类/样式和语义配置，不丢声明字段 |
| 嵌套avatar配置 | 当前类型复用独立组件，classNames/styles传到Element却不消费。必修：把嵌套单元素配置与双层独立组件分开，保留prefixCls/size/shape/className/style的有效配置职责；移除从未消费的嵌套双层语义字段并记录迁移，不新增绕路 |
| Avatar/Button/Input/Node/Image公开Props | 当前8/9/8/7/6字段；className重复根class，style固定内层，妨碍Vue原生根style且只支持对象。必修：独立子组件根class/style走attrs，内容样式用已有styles.content；集中改类型、所有调用者与迁移。配置对象中的className/style及Provider同名字段不等同，不按字符串删除 |
| size / shape / block / internalClassName | Avatar支持数字，Button/Input支持现有尺寸枚举和block；Node内部类Image消费，空串回退保留。当前Provider componentSize通过useSize有效路径待复验；有限尺寸/0、动态移除恢复、形状和block组合均验收，不新增命名 |
| Props与长度边界 | toCssLength把NaN/Infinity转成无效CSS，paragraph.rows=Infinity可导致Array.from异常。必修：非有限长度忽略，行数只取有限非负整数，保留0、合法像素/百分比及负行数空态，不新增任意业务上限 |
| Slots | 主default只在非loading渲染、Node支持完整default；Image类型说明也声明default但实现固定SVG。必修：Image类型化默认槽，完整/条件/有意空槽优先，缺槽保留原SVG；不暴露内部VNode，不增加内容回调 |
| Emits / v-model / Expose | 本组无业务事件或模型，loading由调用者控制；原生监听应走根。主nativeElement仅骨架根存在时非null；受控切换/卸载复验。子组件未承诺公开ref，不顺带新增方法 |
| attrs / style / 多实例 | 六组件inheritAttrs:false丢id/aria/data/tabindex/事件；主组件把style强转对象展开，子组件style侵占内层。必修：明确单根attrs落点、Vue三种style形态及优先级/事件一次触发；主loading=false保留无根契约，attrs不复制到业务slot，需持久宿主由调用者包裹 |
| Provider / 响应性 | 主组件解构components.skeleton形成快照，semanticProps普通副本使函数缓存陈旧；必修：当前getter/实际响应props，替换/删除/恢复、最近Provider与相邻实例隔离。子组件现只消费全局前缀/尺寸，不把主组件六槽配置强套为子组件content配置 |
| prefixCls / direction | 当前主方向class响应，但静态CSS没有-rtl规则，Provider仅上下文不能改变实际direction；前缀getter须取当前上下文。必修RTL实际样式及动态恢复；任意前缀的自动静态样式生成仍按D04另案，不扩大样式架构 |
| 主六语义 / 子两个语义 | class拼接、样式后者覆盖，root原生样式最后；所有存在性组合、函数读取当前Props、内部配置class/style的合并优先级验收。保留既有语义名称和有效颜色/几何 |
| 八个Component Token | color/colorGradientEnd是既有deprecated别名；gradientFromColor/gradientToColor/titleHeight/blockRadius/paragraphMarginTop/paragraphLiHeight仅静态Alias默认，theme.components.Skeleton无运行消费。必修六组件共同投影当前源主题、八字段/别名优先级、移除恢复/局部隔离/原生变量覆盖；保留旧别名，不新增弃用期 |
| 样式 / 动画 / 无障碍 | 主h3空标题真实axe失败，旧测试反而禁止ARIA；占位装饰内容须排除可访问树，loading状态明确且允许原生名称/role。Node/Image自定义真实内容不能一律hidden。active当前未响应reduced-motion/源motion:false，必须修正，保留原默认几何与SVG许可/路径 |
| SSR / 水合 / 生命周期 | 当前主体无window副作用，但动态源主题、样式和slot须验证生产SSR/水合；主无根边界、原生编辑器/焦点/选区、多实例、卸载重挂适用。业务正文在loading开关时有意卸载，不承诺隐藏前的DOM身份延续 |
| 原八Demo / 双语API / README | 已逐个核对basic/avatar/loading/active/semantic/children/complex/element；children真实定时器未卸载清理，complex使用内层style旧写法。必修卸载/重复开关、原生内容和Token实际交互；文档错误宣称无Demo/不支持函数/没有CSS入口/必须复制无ARIA，按当前源码与契约统一重写 |
| 导出 / 类型 / 发布图 / 共享消费者 | Object.assign静态子组件类型有效路径保留，根入口类型同步；保留原48个机械场景并精确审查必要ARIA/attrs差异，不改原始参考快照。Card/Statistic生产组合、四层/类型/既有视觉像素回归；共享工具不改时不冒称全库重验 |

上述正常路径在统一验收前均为“待本轮复验”，旧测试/历史completed不能代替证据。必修集中为Vue公共边界、当前配置与Token、真实占位语义/动画三组。暂未发现需要用户裁决事项；新业务请求、自动完成加载、持久化slot、内容动画引擎与新增子组件另案，不纳入本轮。

## 集中方案与统一验收

先保留源文件哈希，建立六组件原生attrs/三种样式、Provider替换/函数当前性、嵌套配置、Image插槽、无效数值和实际Demo卸载的可失败复现。直接修正子组件根样式职责，已有styles.content承接内容；同步集中迁移，避免反复改API。主组件保留无根的非loading契约，装饰header/section隐藏、loading根busy；独立Node/Image真实槽内容保持可访问。Token共享本单元composable和静态CSS变量，优先现代字段、再既有别名、再当前Alias。

统一验收包括本组全部四层及类型正反例、真实SFC/发布声明、Node生产SSR和浏览器水合、真实几何/RTL/焦点/原生事件/条件槽/无障碍/减少动画、全部原Demo及动态Token示例、自有视觉状态矩阵、受影响Card/Statistic回归及必要像素复验、UI构建/L7、Docs测试/类型/SSG、Registry/来源/格式。修复冻结后集中执行，不重复无关全库门禁；存在失败则补本轮根因并记录，不把已有无效字段归为后续优化。

其他浏览器/实体设备、后台节流或无限尺寸资源不作未验证承诺。全部全库单元结束后仍需对最终同一提交执行全量门禁；本次整组局部通过不能替代该结论。


## 集中实现与当前阶段证据

完整盘点后统一修正Vue根attrs/样式职责、当前Provider/语义Props、块配置合并与真实Image槽、六组件源主题/八Token及RTL/减少动画。当前主/Avatar/Button/Input/Node/Image运行时Props为9/6/7/6/5/4，根className/style不再占据子组件Props；嵌套单元素配置和独立双层组件类型分开，全部旧/新写法集中记录在迁移文档。原八Demo保留，新增真实Token开关，原children定时器有旧源码失败复现及卸载清理。

修前真实Teleport的27条行为中26条失败；原测试桩曾通过重挂遮蔽Provider快照，已改真实Teleport并保留DOM身份断言。修后28条通过，包括三种原生style及删除恢复、作用域/原生事件、完整槽/焦点和真实ref生命周期。关联17文件360条四层通过（Skeleton129、Statistic86、Card145），相关128条类型通过（Skeleton44、Statistic18、Card30、ConfigProvider36）；根严格与真实SFC类型通过。按实际命令范围记录，不合并为全库通过。

旧发布产物Chrome89项有67项失败，逐项保留；新产物90项通过，包含六根attrs/RTL/减少动画、源配置删除恢复、真实几何/颜色、原生样式、输入/焦点、重复加载/卸载重挂、多主题完整axe及实际Card/Statistic组合。首轮85/90的五个失败来自夹具的generic div带aria-label却缺role；补充调用者自身region role后全规则通过，不给组件擅加role，不删除名称或屏蔽规则。

Node生产ESM SSR18项、真实浏览器水合6组通过：无window/document、完整服务器根/源Token/槽和加载语义；水合保留六根、两个不受控预输入框的值/焦点/选区，源主题与条件内容反复更新、加载无根边界及卸载重挂通过。受控v-model数据/反复加载另由生产SFC浏览器覆盖，不把Vue框架的受控初始赋值误称为不受控预输入保留。发布List/Spin/QRCode/Statistic/Skeleton五组SFC与静态子组件声明消费通过，无源码别名，未携带测试文件。

原48个Skeleton机械场景全部保留；46个场景只新增根busy、装饰header/section hidden及原生data属性，原两项前缀/undefined差异完整保留。Card两加载场景各增加两ARIA属性，Statistic原七差异保留并增加内部两ARIA属性。原始参考JSON未修改，新增精确差异文件有反向覆盖守卫；没有忽略attrs、放宽投影或删场景。历史Vue视觉Image200px示例按同一迁移改styles.content，保留8场景/24参考图；尚未声明其像素重新通过。

UI完整dts/69CSS构建通过；严格L7原仅B6失败：Skeleton隔离import35.9KB超过旧27KB。必要的源主题解析使八Token在六形态实际消费，全量UI2067.2KB占比约1.74%；按用户授权及预算政策仅Skeleton上限27→36KB，历史14.5KB测量、其他72项和30%占比门禁不变，技术原因须同步提交说明。严格复跑11项FAIL=0/PENDING=0。

源码/修前数据/分组结果/精确命令日志集中见[结构化证据](evidence/skeleton-contract.json)。实际九Demo、四算法浏览器组合、自有视觉及相关Statistic像素、Docs最终门禁、Registry/内容来源/格式和完整清单收口继续同一单元执行；当前不是整单元或全库完成。


视觉预检发现Node/Image的默认图形行高传入原生输入，将文本控件撑到约100px。生产浏览器92项中仅新增两项真实几何断言失败，按同一Vue内容根因纳入修正：形状宽高/居中不变，内容行高改为当前Alias文本行高；不在夹具中加特例掩盖组件样式。此前90项结果保留为阶段证据，修后需按92项重新验收。


正常文本行高修正后已重新执行：关联四层360条、生产Chrome92项、Node SSR18项、水合6组、UI完整构建及严格L7均通过。实际九Demo亮/暗18页加五交互共23项通过，九Demo×四算法36组合通过；相邻Statistic的28组合亦通过。Docs15文件161条/严格/SSG通过，新增示例使管线1004→1005，两个精确计数断言同步并增加九个Skeleton ID完整守卫，原断言保留。39状态视口的视觉矩阵已定义，手机原生焦点/桌面暗紧凑预检通过且已查看，但脏工作区预检不作为批准基线；下一步从清洁实现提交全量采集。

## 原完整清单逐项复核

| 原清单范围 | 本轮已实现、已验证的结论 |
|---|---|
| 主9个Props / loading / 几何 | 默认、显式undefined与true显示骨架，false只渲染完整默认槽；头像、标题宽度、2/3行、末行/数组宽度、round与重复切换通过。无根分支不把attrs复制到业务槽 |
| 三块配置 / 嵌套avatar | 当前对象的局部类与语义类合并，局部style有效且语义style优先；单元素avatar配置与独立双层组件类型分开。无效嵌套classNames/styles直接移除，迁移集中记录 |
| 五子组件Props / size / shape / block | 根class/style使用Vue attrs，内容使用已有styles.content；既有尺寸枚举、middle、有效告警、数值0、shape与block保留。当前Provider尺寸、动态移除恢复及多实例通过 |
| 长度与行数 | NaN/正负Infinity不生成无效CSS或抛Array.from异常；有限非负行数取整，0与合法长度保留；没有新增业务上限 |
| 默认槽 / 条件槽 / 空槽 | Node保留完整多节点内容，Image真正消费类型化默认槽；有意空槽不回退，槽移除恢复原SVG。原生输入、注释、尾随内容和焦点通过；SVG路径/来源保留 |
| Emits / v-model / Expose | 不新增业务事件、模型或子组件方法；原生监听一次触发，主nativeElement随真实骨架根出现/移除/卸载变化。调用者控制loading，受控示例和不受控原生编辑器分别验证 |
| attrs / 三种style / 多实例 | 六个实际根承接id/aria/data/tabindex/事件及字符串、数组、对象style；当前删除恢复和原生覆盖优先通过。Node/Image真实内容不被装饰层隐藏 |
| Provider / 响应性 | 不在setup解构配置或复制语义Props；替换、删除、恢复、最近Provider与相邻隔离通过，真实Teleport夹具保留DOM身份 |
| prefixCls / direction | 前缀读取当前上下文，RTL既有类对应真实CSS direction且头像位置正确；动态恢复通过。任意自定义前缀静态CSS生成仍属既有D04边界 |
| 主六语义 / 子两语义 | 对象/函数配置读取当前Props；各实际落点、类拼接、样式覆盖、根原生优先和块配置合并通过。主components.skeleton配置不误套独立子组件的content落点 |
| 八Token / 源主题 | 六形态消费当前Alias与组件Token；现代渐变字段优先、既有deprecated别名保留，移除恢复/局部隔离/原生变量优先通过；不新增兼容通道 |
| 样式 / 动画 / 无障碍 | busy由加载根拥有，空标题等装饰层退出可访问树；真实自定义内容保持可访问。源motion:false、系统减少动画、实际四主题axe通过；图形尺寸保留，文本控件使用正常文本行高 |
| SSR / 水合 / 生命周期 | 18项生产ESM SSR、6组真实水合通过；六根身份、两个不受控预输入框的值/焦点/选区、条件内容、加载无根及卸载重挂通过。受控v-model另有SFC/浏览器覆盖；不承诺已卸载业务内容的DOM身份 |
| 原八Demo / 新Token Demo / 文档 | 原八场景完整保留，children重复定时器和卸载清理修复；complex内容尺寸集中迁移。九实际Demo亮暗18页及五组交互23项、九Demo四算法36组合通过；双语API/README/迁移与当前契约一致 |
| 导出 / 类型 / 发布图 | 主与五子组件根/深入口、静态子组件类型、128相关类型、根严格/真实SFC与五组发布声明消费通过；无源码别名、发布图不含测试或React运行时 |
| 机械回归 / 共享消费者 | 原48场景与24参考图保留；新增ARIA/attrs逐条精确登记，原始参考JSON不改。Card/Statistic完整关联四层共360条、类型与真实生产组合通过；Statistic实际Demo四算法28组合通过 |

以上复核以17个生产文件的冻结指纹ceeed7df2f651b235c43a1af6e8ebd5e17fb44bf69e5435fc4640ed252bf650d为准。实际UI构建/严格L7与Docs15文件161条/严格/SSG通过；视觉候选从清洁实现e6be16258145f11c7dd79c9549564b8e17b8eda3完整采集，39张已逐张查看。像素比较及最终交付结论以随后记录为准。


## 自有视觉与整单元收口

清洁实现e6be16258145f11c7dd79c9549564b8e17b8eda3采集13状态×3视口39张，全部逐张查看：默认、头像、独立行宽、无根正文、独立元素、Image默认/自定义/空内容、Node完整内容、当前Token、实际RTL、暗色、紧凑、暗紧凑与原生键盘焦点。图形、文本控件与焦点环无裁切，根/槽/主题断言及真实axe全部通过后批准。dirty=false，环境darwin/x64/Chrome150.0.7871.125。

`node tests/visual/apollo.mjs --component skeleton --component statistic --no-build`同次75项全部PASS，pending=0，每项diffPixels=0：Skeleton39张与受影响Statistic36张。原199条批准记录及其PNG字节逐项未变，现共238条批准记录；旧24个Skeleton上游参考仍完整保留。不能把自有视觉通过描述为旧参考像素复验通过。

原完整清单已逐项复核，本轮缺陷均已实现、已验证，无待裁决或受阻项。相关360条四层、128条类型、92项生产浏览器、18项生产SSR、6组水合、九个实际Demo及五组交互、36主题组合、发布声明/UI/L7和Docs验证分别记录，不累加为全库唯一用例数。UI源指纹与实现提交一致，完整数据见[统一证据](evidence/skeleton-contract.json)。后续仅更新清单、进展、Registry与发布证据，未修改冻结生产实现。

其他浏览器/实体设备、任意自定义前缀CSS生成、无限输入资源未在本单元验证；已卸载业务内容不承诺DOM身份，未新增暂停/请求/持久化槽能力。全库其他组件、基础包、199项待复核内容候选与最终同一提交全量门禁继续开放。最终文档发布及线上源码/实际示例核验随后单独记录，不以本地通过和推送冒充已上线。上述阶段未验记录由本节最终证据取代。

最终进展页/首页更新后，Docs内容生成与校验（72组件/1005 Demo/8指南）、严格类型、15文件161条及SSG再次通过；Registry19检查零警告、两项视觉矩阵工具测试、根格式零错误（既有37警告/5信息）及diff检查通过。本地生产站33项发布检查与9条Skeleton SSR结论通过，桌面/手机暗色截图逐张查看，无横向溢出和页面/Vue/控制台错误。该结果尚不等同线上发布；线上回执随后追加。


最终发布已完成：2cbadfc2的[Deploy Docs 40400050196](https://github.com/apollocmh/apollo-design-ui/actions/runs/40400050196)与Pages7343506207均成功。CI Docs15文件161条、全部包L7 151项通过，FAIL=0/PENDING=0、n/a=67，共86个HTML页。线上源码/日志为2cbadfc2；33项通用发布检查、九个Skeleton Demo亮暗及五交互23项、SSR指南九条结论分别通过，零额外页面/资源/Vue错误。十八个独立Demo导航URL沿用既有404.html回退，明确记录主文档404。桌面/手机暗色截图已逐张查看，36组Demo主题仅本地验证，未宣称线上重跑。完整[发布回执](evidence/docs-publication-skeleton-closure.json)取代上述待发布状态，全库其余审计继续开放。
