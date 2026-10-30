# Table 实现说明

当前规范由 [AGENTS.md](../../../../AGENTS.md)、组件 API 与行为测试确定。历史 T0–T7、上游对照和视觉证据保留在原日期的分析/审计文档中；本文件不维护任务进度，进度读取 registry/vue-native-audit.json。

Table.vue 是公开泛型 SFC，以同一行类型声明 Props、Slots、Emits 和 Expose；Table.ts 为实际组件挂静态选择哨兵与 Summary。ColumnsType<T> 与行/列数据服务保留真实数据职责，普通 interface 行不需要索引签名。

主链为当前默认列与响应式列过滤 → 排序/过滤 → 分页 → 选择/展开列 → 私有泛型引擎。顶层内容使用原生具名槽；Cell 只缓存数据 renderer，槽内容在真实渲染阶段求值。按行提供的 getter context 保留 hover 粒度；同 key 行替换使用当前 record/index，并保留可复用的输入节点。展开行首次显示后保留其隐藏内容。

分页、排序、筛选、选择与展开各使用一个接受态来源。change 载荷基于本次提议计算，拒绝受控提议不会污染接受态或选择记录缓存。Provider 的 prefix、语义样式、当前 Token 和容器配置从当前值读取。静态 CSS 与既有默认声明继续复用。

私有引擎保留分组表头、固定列几何、树形展开、选择级联、跨行补行和虚拟滚动算法。几何与汇总使用实际字段协议；行数据链保留泛型。自定义元素由 Vue 组件的 default 槽渲染；原生 attrs 通过 Vue 合并。动态树字段只在外部数据边界解析为数组。

虚拟表体使用原生滚动条与 flex 行；colSpan/rowSpan 由宽度与补行表达。自定义 components.body 是数据/滚动服务，使用真实 HTMLElement ref 和原生 Event。VirtualList holder 组件需要单个 HTMLElement 根；Fragment/纯文本根没有可测量容器。真实元素更换时更新引用并释放旧观察资源。scrollTo 使用当前容器与安全的 row-key 匹配，不拼接用户 key 到 CSS 选择器。

本阶段执行相关核心、类型和必要源码浏览器验证；全库九维验收由集成人在统一冻结版本执行。未执行的检查不记为通过。
