# F10 · Masonry 原生 attrs 与图片测量（2026-10-24）

## 契约与复现

源码原先明确要求复制 React 的 restProps 丢弃与根冒泡 load/error 绑定，导致 Vue 根 attrs 无效、非冒泡图片事件不能重测量。按用户要求及 ADR0007 直接修正，不加旧白名单或双事件兼容通道。

新增 native-attrs.test.ts，旧实现三条全失败：SSR 缺 id/title/string style；字符串 style 在挂载时被对象展开并抛出 CSSStyleDeclaration 错误；fresh=false 的图片 load 后第三项仍停在 top20/column0，而实际新尺寸要求 top60/column1。日志 `/tmp/apollo-masonry-native-red.log`。修复后三条全通过，error 事件恢复 top10/column0，两个实际列分配变更各通知一次。测量夹具使用受控 DOMRect，先断言初始排布有效，未把 jsdom 无布局当产品缺陷。

根 attrs 在 render 读取，通过既有 DOM helper 合并监听器，class 不再从 computed 缓存 attrs；style 使用 Vue normalizeStyle 合并调用方字符串/对象/数组与内部高度/语义样式。根捕获 load/error，普通冒泡监听器仍保持真实 DOM 语义，不将非冒泡事件伪造成冒泡。内部测量仍使用既有 raf 去抖、尺寸去重与排布算法。

原生 id/title/事件现在作用于根 div；默认不添加 role/ARIA，调用方可自行提供必要语义。图片 load/error 可在 fresh=false 时触发重排，一般非图片内容的尺寸变化仍通过 fresh 的 ResizeObserver 支持。双语公开文档与 README 同步，不继续把旧 React 行为写作规范。

## 验证

环境 Node22.22.2 / pnpm12.4.2：

| 命令 | 结果 |
|---|---|
| `pnpm exec vitest run --project unit --project dom-contract --project a11y --project theme packages/ui/src/masonry/ --maxWorkers=1` | 7文件86条通过；既有排布/原地更新/DOM/axe/主题及新增三条，未改旧断言或基线 |
| `pnpm run lint:types` / scoped Masonry types project | 通过；2文件26条类型测试，无类型/source错误 |
| `pnpm run build:ui` / UI L7 | 声明及69份CSS生成，`node tests/build/run.mjs --package ui --no-build` 11项通过、0 FAIL/PENDING；保留unbuild既有产物探测警告 |
| `node tests/browser/masonry-native.mjs` | Chrome150.0.7871.125通过：本地SVG真实自然load、显式非冒泡error、fresh=false的实际列坐标重排、单次layout通知、attrs-only更新与根/输入身份及值保留；零browser/Vue错误；无外部图片服务 |
| 文档 build/test/typecheck/content:check | `pnpm --filter @apollo-design/docs run <script>` 四项通过；14文件157条、类型检查、client/server SSG84路由、72组件内容校验，997Demo未增加；既有大chunk警告保留 |
| Registry/inventory/tooling/scoped Biome/diff | Registry19项与vue-native24 fixed/0 open、499行清单一致性、8条tooling、3文件Biome与diff检查通过；SFC产品代码由vue-tsc、构建和实际浏览器验证 |
| `node tests/visual/apollo.mjs --check --component masonry` | **未通过：21张missing-approved-baseline**；未接受候选/复制参考图或修改阈值 |

本阶段仅完成底层原生属性与媒体测量链。itemRender 函数/泛型槽迁移、React 一拍延迟与 SSR 首帧内容，以及样式函数的数据快照另行继续验证；不宣称 F11 或整组件新验收完成。DOM/视觉基线、排布算法、动效时序与阈值均未改。未执行全仓 verify:full/覆盖率。
