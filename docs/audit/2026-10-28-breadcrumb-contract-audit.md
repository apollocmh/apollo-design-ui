# Breadcrumb / Item / Separator 契约审计（2026-10-28）

范围为 `packages/ui/src/breadcrumb/**`、该单元的浏览器/消费端用例及迁移记录。审计起点 `d0bf2cef`；共享工作树中的 Badge 视觉变更不属于本单元。不运行 UI/根构建、不改发布产物；最终发布入口、全库门禁、Docs 和 Apollo 图像验收由主线程在集成提交统一执行。

## 实施前完整清单与验收标准

下表在修改实现前根据当前源码、双语 API、Demo、调用者和测试盘点。原始可失败复现写入 `__tests__/contract-audit.test.ts`，红灯及最终命令另附证据。

| 链路 | 初始分类 | 当前事实与本轮验收 |
| --- | --- | --- |
| Breadcrumb `items` / `routes` / 默认槽 | 必修 | `useItems` 优先 items，但 render 用 length 判定，`items=[]` 意外消费默认槽。显式空数据仍优先；未提供数据才消费原生槽；保留 routes 废弃通道与正常警告。 |
| `params` → `path` / `title` → `href` / itemRender scope | 必修 | path 仅替换首次/前缀，title 正则未转义，0/空值被丢；只替换完整、存在的参数，重复和重叠名称稳定，缺失值保留；保持逐项路径累计和 path 优先 href。 |
| `title: VNodeChild` → 默认链接内容 | 已验证正常并保留回归 | 初始静态推断已被首轮B01推翻：数组/Fragment原实现即正常，未宣称修复String化；数字、VNode和完整数组继续回归，仅字符串参数替换的其他缺陷整改。 |
| `#itemRender` 对象槽、空/条件槽、默认子组件 key | 已有正常覆盖，需回归 | 保留单对象 `{ route, params, routes, paths, href }`、每项独立 paths、插槽优先（空槽亦然）、动态读槽和调用方 key；无旧函数兼容通道。 |
| `separator` / `dropdownIcon` 内容与优先级 | 必修 | 数据 prop/Provider 有链路，模板具名内容槽缺失。具名槽存在则优先（含有意为空），否则 prop → 当前 Provider → 默认；原生 Item 同样支持相应内容槽。末项不自动追加分隔符。 |
| Item `href` / `menu` / `dropdownProps` / 图标 | 必修 | native 子组件未继承父 dropdownIcon；前缀/内容的归属须明确且动态。 |
| 数据项 `className` / `style` / `data-*` / `aria-*` / `onClick` | 必修 | className/ARIA/点击落默认链接，style 被明确丢弃；style 必须有效，数据 className 保留为数据字段；自定义 itemRender 由调用者拥有内容 attrs。 |
| 原生 Item attrs / 点击 | 必修 | 多根自动透传丢 class/id/ARIA/监听器，声明 style 但不消费。原生 attrs 归所属 item li；class/style 使用 Vue 原生形态，点击接收原生 MouseEvent 且仅一次。 |
| Separator 默认槽/attrs/隐藏语义 | 必修 | 空槽回退 slash 且隐含继承可覆盖 aria-hidden。存在的空槽压住默认字符；原生 attrs 归 separator li，装饰 aria-hidden 保持 true。 |
| `prefixCls` / Provider 前缀 → 三组件 | 必修 | Separator 仅取 ConfigProvider，忽略所属 Breadcrumb 自定义 prefix，原生 Item 亦不继承父前缀；所有所属节点随父当前前缀更新。任意前缀的静态 CSS 仍按既有 D04 边界。 |
| `classNames` / `styles` 函数与对象、Provider 当前配置 | 必修 | 函数 info.props 是非响应快照；改 params/separator/items 后函数结果可能不变。用 getter 读取当前解析 props，语义来源按既有顺序合并，原生 style 最后覆盖。 |
| Breadcrumb expose | 已有正常覆盖，需回归 | 仅 `nativeElement: HTMLElement \| null`；挂载/卸载不泄露内部实例。Item/Separator 不新增 imperative API。 |
| emits / v-model | 不适用/核对 | 根没有组件状态事件/v-model；原生监听器落 nav。Item 点击为 DOM MouseEvent；菜单开合沿现有 dropdownProps.open/onOpenChange，不发造出的业务事件。 |
| menu.items `path` / `href` / `label` / `title` / key / disabled | 必修 | path 拼成 `undefined/c`，href 未消费，菜单项类型丢 disabled 等真实 Menu 支持字段。直给 href 优先，否则相对当前 href，未提供 base 时不出现 undefined；禁用项和 Menu 事件仍传递。 |
| 下拉按钮 / 链接 / 键盘 / 焦点 / 多实例 | 必修 | span 不可聚焦，链接与菜单触发器重叠；所属原生按钮独立于导航链接，键盘打开/关闭、焦点进入菜单和接受关闭后返回；受控拒绝关闭不得抢焦点。无菜单/图标切换应保持已有内容节点。 |
| 7 Component Token → 静态 CSS → 当前主题 | 必修 | 默认 token 声明可用，但固定构建值不消费当前 Provider components.Breadcrumb；默认/暗色/紧凑/嵌套/动态/SSR 应使用当前来源，原生 style 可覆盖；7 Token 每项有实际消费证据。 |
| 关联 Dropdown / Menu / Trigger | 局部核对，整包另案 | 只验证 Breadcrumb 使用的配置、开合、菜单项与焦点链路；确认共享缺陷提供最小复现给主线程，不修改共享实现。 |
| Demo / 中英文 API / 类型 / 历史说明 | 必修 | API demo 数量失真、重复 style 行，仍宣称无效 style 正常/组件废弃/分隔符忽略父前缀。同步当前契约与成对 Demo；保留 PLAN 中日期化历史证据。 |
| 历史 DOM / React 视觉 | 需精确解释差异 | 保留原始参考快照与场景；新的所属结构/按钮/前缀/有效 style 等差异逐场景精确记录，额外差异继续失败；以当前 Apollo 场景覆盖替代错误旧形态。 |
| 发布构建 / 消费端 / Docs / Apollo 视觉 | 集成后验收 | 该执行者不写 dist、共享 matrix/manifest/图片；准备源码浏览器和消费端脚本，由主线程构建后执行发布入口/最终视觉验证。 |

不新增 Router 适配、折叠面包屑、任意前缀 CSS 运行时生成或 Dropdown 全包能力。除已接受 ADR0006/0007 的直接 Vue 修正外，不另加兼容通道。当前没有必须用户裁决才能推进的事项。

## 复现、实现与验证记录

首轮13场景1通过/12失败，正常项是title数组/Fragment。集中实现原生attrs/所属宿主、当前配置与七Token、参数替换、原生内容槽、菜单按钮及数据字段，并同步11对Demo/双语API/迁移。四层7文件110条通过；五project曾9文件151条断言通过但因当时TimelineConfig源码诊断退出1，明确不当作整体通过。

新增菜单空标题回归3条修前全红，修后相关41条通过；源码root vue-tsc/consumer与F11浏览器通过。Overlay接受受控值变化同步清延迟后，同一真实浏览器的菜单选择不再延迟重开。主浏览器14组13通过/1失败，零页面/Vue错误；唯一失败为共享Menu Enter未激活href链接，保留断言并列本轮必修。

主线程已修TimelineConfig类型来源，冻结源码合并验收73文件964运行时、10文件122类型、根严格与Descriptions源码消费类型均exit0；格式零错误（37既有warning、9info）。详见parallel-source-checkpoint.json。最终发布构建/声明消费、完整Demo主题矩阵、Docs、自有视觉尚未执行，本单元不标完成。
