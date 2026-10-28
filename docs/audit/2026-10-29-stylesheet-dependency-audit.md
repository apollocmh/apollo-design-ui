# 公开按需 CSS 的内部组合依赖

范围：当前72个组件单元、69个已有样式入口与公开样式生成函数。五组组件的发布全量CSS行为均已验证；Timeline独立按需CSS在真实Chrome中显示为block、dot 800×0、rail 0，补入Steps CSS后恢复flex、dot 10×10、rail 2。此为本轮必修，不能以全量CSS通过掩盖。原始复现见`/tmp/apollo-timeline-published-20261029-e0062edd/css-entries.json`。

修复前先由五路完整核对实际组件实现、复合导出、Portal/空态/加载/条件交互与样式生成器，追踪“内部渲染 → 实际类名 → 基础样式 → 单独公开CSS产物”。源码import/Registry依赖仅为线索，不能自动生成CSS依赖；用户自带插槽/内容不自动携带其样式。已嵌入的样式须去重，公开无样式入口的组件记录实际使用的父入口，不擅自增加无关能力。

验收：完整清单与直接样式依赖、证据/歧义明确后，集中设计组合方案；保留汇总CSS的现有顺序与内容，按需输出保留同一相对层叠顺序、无重复基础重置。建立成组红灯，再补实现/类型适用覆盖/真实浏览器和文档；验证五个当前单元及共享链路实际受影响组件、公开CSS消费、L7与原有视觉证据。未盘点的条件与未执行的发布验证不能宣称通过。

分类：Timeline→Steps已真实复现，必须修复；其余内部CSS依赖等待五组源码清单后确认。自定义前缀D04、用户slot内自选组件、与CSS组合无关的新API另案；当前无需新增产品裁决。正式297张原生视觉先暂停，产物停止读取后才重建；最终审图、Docs和全库最终同提交门禁继续开放。

## 完整盘点与统一设计

五组已核对全部72个组件、69个已有样式入口，证据stylesheet-dependency-inventory.json保留每项实际渲染、条件、嵌入规则、源码行和hash。确认34个组件的73条直接样式依赖；再单列Tabs共享slide阶段规则，使用已由Select提供的同一静态片段，不引入不相关Dropdown菜单。Layout.Sider继续独立样式；AutoComplete/TimePicker使用其已有父入口；不将任意用户slot组件自动纳入。

公开按需生成函数解析内部依赖闭包，去重后沿既有COMPONENT_STYLES相对顺序生成，基础reset仅一次；未知节点/循环明确报错。汇总genAllStyles继续直接消费原始生成器，保持既有内容和顺序。Select共享片段在生成函数内部调用，无顶层生成；12组原始前缀参数输出与旧产物逐字相同。

分组红灯：首轮38条源测试中3通过/35失败（根规则探针）；修复依赖后补Tabs真实动画红灯，再用最小片段修复。源码组合/原前缀48/48、根严格检查通过。浏览器分别验证Timeline、Typography复制/编辑/省略、Statistic/Input/InputNumber/QRCode/Upload、Form/Card/Tabs及Table/List/Transfer/Calendar/Avatar内部链路；所有原始异常采样和正常负控保留，未以CSS selector命中替代实际geometry/paint。正式发布重建、同命令复比与297张视觉继续待执行。

同组发现Upload默认进度条在全量CSS下高度仍为0，已单独完整盘点六字段及Progress尺寸/ARIA链路，纳入本轮必修；不是调低断言或另归优化。数值/tuple尺寸优先、合法CSS长度保留，部分配置默认2px，small6/default8；ARIA保留小数、限制0–100，独立于原status整数推导。按真实Progress组合整改并独立提交，不保持旧替身DOM。该窄单元不宣称完整Upload/Progress审计完成。

发布构建里程碑：UI实际build与严格L7（11项/零失败/零待定）通过；69份新按需文件与当前生成器全部一致，原69份输出可由原始生成器逐项重现其既存SHA。35份按需CSS补入依赖，汇总CSS保持1,320,672字节、SHA256 `36c7e73f74139332ac9f79d6f9bc4369548e75f8796eb5e55ff3f61cdc86e310` 完全不变。浏览器复比与正式视觉仍待统一验收。

## 全局链接规则归属的成组修复

重建后的12状态×2视口独立CSS/全量CSS对照中，18对完全相同，Breadcrumb六对仅链接装饰不同；最终稳态采样已排除动画/几何残差，分别38/221/280像素。全量不能自动当作正确规格。再次完整盘点全部69个原始生成器的全局元素规则，确认通用链接七条规则在Select内重复两遍，并随Cascader/TreeSelect嵌入；其他仅Button主题属性选择器，不存在第二组全局元素规则。

这些链接颜色、装饰、hover/active/keyboard focus均消费既有全局Alias，归属共享BASE_CSS；统一移出Select及其嵌入链，在每份公开样式的基础层只保留一次。不让Breadcrumb依赖Select，不新增运行时样式或兼容选择器。两个新增归属测试修前均失败，成组修后与原组合/前缀共50条通过。3214ee10阶段的汇总字节不变证据保留；本阶段会因移位和去重改变汇总文本，须分别复比真实几何/paint/RGBA，不能沿用原SHA冒称新产物完全不变。

## 公共链接阶段的实际发布验证

实现提交 `3214ee10` / `76eb766a`，浏览器工具 `350f4cb2`；UI实际构建成功，预算按真实Progress组合记录后清洁冻结为 `a47d96ec`。严格UI L7实际11项、零失败/待定；69份既有按需入口逐份与当前已构建生成器完全一致，每份共享基础和原生链接规则均仅一次。新汇总CSS为1,317,138字节、SHA256 `b02c526e0b6e9796294d5ec60186eee68079b242aa6941473553336bcb94bf3a`，因已说明的移位/去重改变文本；不是沿用前阶段的字节不变结论。

原命令重跑12状态×2视口、10个隔离打包与48次实际渲染，24/24几何、paint、原始RGBA完全一致；原6个Breadcrumb链接差异全部消失、18个正常对照保留。全部模块无实现源码别名、零浏览器/Vue错误、产物指纹未变、读者已退出。逐状态红绿及artifact/L7见[浏览器证据](evidence/component-style-entries-published.json)和[发布产物证据](evidence/stylesheet-dependency-published-stage.json)。

当前自有视觉继续由独立物理dist快照复核：Descriptions/Breadcrumb/Timeline/Grid共222张，以及既有537张；Space另有Input当前主题尺寸和Addon underlined缺陷正在成组修复，未批准75张。按需对照24对的通过不表示上述组件整单元或全库验收结束。

## 当前共享CSS整改单元验收

已盘清72个组件/69入口并完成依赖闭包、Tabs阶段片段与基础链接归属修复；50条组合/前缀、69份构建输出一致性、严格UI L7 11项均通过。24对当前组件按需/全量CSS的geometry/paint/rawRGBA全一致；另外Typography复制/编辑/省略3链、Controls21页73观察/56精确对照、Data五组件15主场景及实际弹层/宿主、Form/Card/Tabs12状态20检查均使用隔离发布JS/CSS通过，具体范围和初版夹具纠正保留。没有宣称34个父组件所有API/条件都逐一跑过浏览器。

原537张已批准状态重渲染全部PASS，534张对批准图rawRGBA精确；另外3张List.loading是57ab2894已接受的Spin定位差异（112/104/104像素），已用原生定位反事实逐视口归因。全部537对3214阶段截图rawRGBA完全一致，因此共享链接移位新增像素变化为0，未改原有基线。四新组件222张批准后从清洁ad850a47再渲染，也全部PASS且rawRGBA完全一致。759张是分两批真实执行，不能伪称一个全库最终运行；还有843张未验收。

本CSS依赖整改单元范围内已实现、已验证并收口；证据分别为stylesheet-typography-published、stylesheet-controls-published、stylesheet-data-published、stylesheet-form-card-tabs-published、stylesheet-existing537-regression与four-unit-approved222-regression JSON。其它组件整单元、Input当前主题/autoSize整改、Space最终验收及最终同一提交全库门禁继续，不被这些局部证据替代。
