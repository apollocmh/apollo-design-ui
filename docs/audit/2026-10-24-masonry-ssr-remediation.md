# Masonry 原生首屏与 SSR 整改（2026-10-24）

本批始于2026-10-24，最终验证于2026-10-25完成。按用户要求与 ADR0007，不再复制 React useEffect 的空首屏。旧实现只在 onMounted 把 items 写入 mergedItems，服务端永远输出 height:0 的空容器。生产 dist 的 Node SSR 复现日志 `/tmp/apollo-masonry-ssr-red.log`，新增 ssr-content.test.ts 三条修前全失败（`/tmp/apollo-masonry-ssr-unit-red.log`）：实际槽/fallback缺失、显式空槽连 wrapper 也消失、水合前输入不存在。

初始数据现在同步浅拷贝，后续数组身份/结构变化同步进入当前数据，不深遍历 VNode。首轮没有实测位置时，根使用带列数/间距的 CSS Grid 正常流和自然高度，条目相对定位；全部位置可用后才切到既有最短列算法与绝对定位。空列表仍为0高度，用户 root 样式仍有覆盖权。onMounted/DOM ref 就绪和更新后进行去抖测量，不拿缺失DOM当0高度。未改排布算法、时长、Motion 驱动或通过关闭 appear 绕过水合。

真实 Chrome 的无 JavaScript 首屏检查首次发现 Grid 默认 stretch 把40px内容的条目撑成80px，可能产生错误首轮测量；保留该尺寸断言并给网格 align-items:start，使每项按自身内容测量。此项不是 jsdom 模拟结论，也未放宽断言。

保留原20条历史根投影及参考JSON。核查 test-utils 后确认 domContractTest 是同步客户端 mount，旧文件将其写成SSR且称空树正确是过期说明；现改为明确的「客户端入场前根投影」，对相同20个场景另加真实 renderToString 的内容数量/文本、wrapper、网格、前缀/RTL、语义样式与间距断言。无 key 的 JS 输入用 Reflect.deleteProperty 构造，移除原双重断言，公共 key 必填类型不放宽。专门水合测试检查服务端输入和值、测量单次通知及当前数据更新。

迁移见 `docs/migrations/masonry-ssr.md`；双语API、README、KNOWN-ISSUES和Registry同步。清单说明重算为 renderer74/internal78，保持499行，静态分类不是新验收。

| 检查 | 实际结果 |
|---|---|
| Masonry unit/dom-contract/a11y/theme | 9文件115条通过，包含新增3条和20场景SSR；保留jsdom canvas提示 |
| Masonry types / 全仓 source types | 2文件26条及 `pnpm run lint:types` 通过；最终UI声明生成再次检查严格类型 |
| UI build / L7 / 真实声明消费者 | `pnpm run build:ui` 生成声明与69份CSS；UI L7 11项通过，0 FAIL/PENDING；masonry-types消费者通过 |
| 生产 Chrome SSR/原生槽/媒体回归 | masonry-hydration.mjs 与 masonry-native.mjs 均通过；Chrome150.0.7871.125，无JavaScript首屏不重叠、客户端测量第三项top52/根高80、原输入身份和值保留、真实图片事件重排、零浏览器/Vue错误 |
| 文档 build/test/typecheck/content:check | 修正依赖顺序后四项通过；84路由/997Demo，14文件157条，72组件内容校验 |
| Registry/inventory/tooling/Biome/diff | Registry19项及vue-native24 fixed/0 open、499行清单再生成/检查、8条tooling、5文件Biome、diff检查通过；SFC由vue-tsc/构建/实际浏览器验证 |
| Apollo visual check | **未通过：21张missing-approved-baseline**；未接受候选、复制参考图或降低阈值 |

首次文档构建与后续UI修正重建并行，SSR打包时碰到dist清理导致CSS暂缺；属于构建依赖顺序错误，随后等待UI完整输出再串行重跑，不能将初次失败写为通过。未执行全仓 verify:full/覆盖率，未推送或打标签；不宣称整组件新视觉验收。
