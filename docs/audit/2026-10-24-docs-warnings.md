# H04：构建告警分流与真实交付观察 · 2026-10-24

## 已处理的无效动态导入

生产 client/server 构建原先都提示 `src/composables/search.ts` 同时被 TopBar 动态导入、SearchModal 静态导入。TopBar 已静态加载 SearchModal，因此动态写法实际不拆包。该写法从 `04fe2358`（2026-10-16 文档站重建）引入，本批改为一致的静态 import，保留 ensureIndex 的失败/并发/重试逻辑；没有删除日志、改告警阈值，也没有把这项清理宣称为首屏体积优化。

修后实际构建不再出现 INEFFECTIVE_DYNAMIC_IMPORT。搜索索引仍是独立的按需模块：生产浏览器打开 Table 页时零索引请求，首次打开搜索下载一次，TopBar/SearchModal 并发调用不重复下载，关闭再打开复用缓存。Escape 后焦点回到触发按钮；中文 SSR、英文切换、暗色状态和水合均无页面错误。索引网络失败重试仍由现有 search-retry 测试覆盖。

## 已落实的按视口加载

实测 Table 页初始主框架请求 55 个脚本：DemoRenderer 在 mounted 时加载全部示例。现使用原生 IntersectionObserver 在进入视口附近时激活一次；不支持该 API 时仍即时加载。首次激活后离开视口保留实例，参数/重置仍更新当前模块；卸载断开 observer 并使待完成模块失效。

新增 3 条回归修前全红，修后覆盖加载前最新参数、未进入视口不加载、卸载后的通知/模块完成、重复通知及实例身份。文档总测试增至 14 文件 / 157 条，严格类型通过。生产浏览器确认最后一个 Table Demo 初始仍为加载占位，滚动后可操作，移开再回来保持行序与同一个 table 节点。

| 相同 Table 路由/Chrome 视口 | 修前 | 修后 |
| --- | ---: | ---: |
| 初始脚本请求（唯一资产） | 55 | 12 |
| 初始脚本原始字节 | 3,540,441 | 3,485,838 |
| 初始脚本 gzip 字节 | 687,345 | 657,437 |

请求数减少 78.18%，gzip 资产字节减少 4.35%；这些是静态资产 gzip 可压缩体积，不是网络传输时间或完整性能分数。主共享 chunk 仍约 2.2MB 原始 / 510kB gzip，未因按视口加载消失。

修前记录独立保存在 [before-visibility](evidence/docs-delivery-before-visibility-2026-10-24.json)，当前记录在 [delivery](evidence/docs-delivery-2026-10-24.json)。截图工具在比较前真实滚动逐个激活 inline/iframe 示例；模块失败直接拒绝截图，超时不再被吞掉，浏览器在 finally 关闭。生产浏览器验证 Table 全 44 个示例、FloatButton 全 14 个示例（含 viewport iframe）均可完成截图准备，错误模块负例确实拒绝。未修改截图基线或比较阈值。

## 保留的告警与行动

| 类别 | 实际情况 | 处理 |
| --- | --- | --- |
| 大 chunk | 仍有超过现有 1500kB 门槛的 app 共享 chunk | 继续开放；不能通过搬到 vendor 文件或提高阈值冒充首屏优化，后续按实际依赖与路由请求链处理 |
| 静态/动态混用 | search.ts 两条构建告警已消除 | 一致静态导入，索引按需策略不变 |
| Demo frontmatter | 仍有 303 项 order 缺失，构建明确按文件名回退排序 | 属内容元数据维护，不是运行失败；本批新示例均有 order，未批量改变旧示例顺序 |
| 测试环境提示 | axe/jsdom 部分 canvas、伪元素样式未实现；Vitest 类型实验提示与 Vite native loader 预告 | 不当作浏览器运行错误；保留真实浏览器与严格类型门禁 |

[docs-delivery-2026-10-24.json](evidence/docs-delivery-2026-10-24.json) 记录实际 Table 路由初始脚本资产（包含首屏已激活的 Demo iframe）、逐文件原始/gzip 字节、按需搜索请求与 Chrome 版本。该观察不是理想实验室首屏性能分数，也没有将浏览器缓存/重复资产当成额外压缩收益。

本次观察仍显示 app 约 2.2MB 原始、约 510kB gzip，体积问题真实存在。因此 H04 **部分完成，仍开放**，不宣称清除全部警告。SSG 仍为 84 路由，最终构建、文档类型与 157 条测试均通过，见 [共享交付门禁](2026-10-24-dom-attrs-remediation.md)。
