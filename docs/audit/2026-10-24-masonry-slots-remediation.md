# F11 · Masonry 原生泛型 item 槽（2026-10-24）

按 ADR0006/0007 直接移除 itemRender / MasonryItemRenderInfo，新增 MasonrySlots<T> / MasonryItemSlotProps<T> 和泛型 SFC。现有六个示例及配对代码片段、公开双语文档、浏览器夹具和测试调用方均迁移；不增加兼容层或弃用期。迁移见 `docs/migrations/masonry-slots.md`。

新建 item-slots.test.ts，旧实现六条全部失败（`/tmp/apollo-masonry-slots-red.log`）：作用域槽不可用、条件/当前/空槽失效、同 key 替换数组仍显示旧 children、语义样式函数读取旧 props、keyed 输入重排，以及内容变化后的实际高度重排。使用受控 DOMRect 验证初始 top20 有效，槽变高后应为 top60，避免把 jsdom 无布局误判为产品缺陷。

实现先在 Masonry 当前 render 中求槽内容，再作为 key 对象数据交给 MotionList；直接在动画层内部读取外层槽不能保证条件槽变化触发该层更新，初次修复仍有两条失败，据此补齐传递。显式空槽覆盖 children，移除槽恢复回退。同 key 新数组通过数组身份及既有结构签名同步，不深遍历 VNode。语义 props 使用 computed 交给支持 getter/ref 的 useMergeSemantic。onUpdated 调度既有 raf 测量；DOM 尚未齐全时不发布零高度占位。保留 fresh 观察持续尺寸变化、排布算法与离场内容。

旧 L2「children 优先于 renderer」断言按新的显式槽优先契约修改，仍检查条目数量和两个渲染内容；新测试独立覆盖无槽 fallback 和移除槽恢复。旧 L4 20个参考用例未删除，改用槽提供内容；参考基线未修改。SSR 首帧仍为空，因此本阶段不将参考首帧相同声称为 Vue SSR 正确。

验证（Node22.22.2 / pnpm12.4.2）：

| 检查 | 结果 |
|---|---|
| Masonry unit/dom-contract/a11y/theme | 8文件92条通过，含新增6条；axe保留jsdom canvas提示 |
| Masonry types / `pnpm run lint:types` | 2文件26条与全仓严格源类型检查通过；实际 .vue 夹具检查 data/index/column 的精确推导与 layoutChange 泛型 |
| `pnpm run build:ui` / UI L7 | 声明与69份CSS生成；11项通过，0 FAIL/PENDING，保留既有unbuild产物探测警告 |
| `node tests/consumer/masonry-types.mjs` | 真实发布声明、无源路径alias，模板泛型消费通过，测试夹具未入包 |
| `node tests/browser/masonry-native.mjs` | Chrome150.0.7871.125通过：模板作用域、条件/空/移除、同key数据替换重排、输入节点和值保留；前阶段自然图片load/error、实际列坐标、原生attrs和单次layout回调仍通过，零浏览器/Vue错误。初版夹具误把innerText换行视为失败，改为逐项文本数组比较，未改产品逻辑 |
| 文档 build/test/typecheck/content:check | 四项通过；84个SSG路由、997Demo、14文件157条测试、72组件内容校验，保留既有chunk警告 |
| Registry/inventory/tooling/Biome/diff | Registry19项及vue-native24 fixed/0 open、499行静态清单校验、8条tooling、15文件Biome与diff检查通过；SFC由vue-tsc/构建/浏览器验证 |
| Apollo visual check Masonry | **未通过：21张missing-approved-baseline**；未接受候选/复制参考图或降低阈值 |

继续处理 Vue 首帧/SSR；不宣称整组件新验收完成。未执行全仓 verify:full/覆盖率。未推送或打标签。
