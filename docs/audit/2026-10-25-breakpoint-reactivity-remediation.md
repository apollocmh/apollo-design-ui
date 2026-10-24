# Steps / 共享断点发布响应性整改（2026-10-25）

原Steps在setup按responsive初值决定是否调用useBreakpoint，初始false的实例之后开启也不会订阅。共享useBreakpoint虽接受getter，却只在媒体事件回调中检查开关；false期间丢弃快照，重新开启必须等待下一次resize，普通props切换得不到当前视口。

新增breakpoint-reactivity.test.ts，初始3条修前全失败（`/tmp/apollo-breakpoint-reactivity-red.log`）：Steps在窄屏false→true仍水平、getter启用仍停在null、暂停期间媒体已变宽但恢复仍显示旧xs。按Vue getter和同步watch发布当前缓存；每次媒体回调都更新缓存，false保持上次发布值，恢复true即发布最新缓存。Steps始终调用composable并传getter，公开类型不变，不模拟React生命周期或增加兼容层。删除一处Ref强制断言，使用准确的类型标注。

扩展后7条通过：SSR保留defaultScreens且不访问matchMedia、暂停时卸载仍释放监听器、Avatar从数字尺寸转响应式立即选xs、List从静态列数转响应式立即变两列且保留输入节点/值。SSR/cleanup为原本正确路径的保护覆盖，没有宣称它们修前失败。

浏览器夹具将Steps、useBreakpoint、Avatar与List放在同一视口，390px启用（无resize）、暂停后改变到700px再恢复、重新缩到390px，检查当前方向/尺寸/列宽与输入身份；使用真实matchMedia事件，单元仅控制其最小消费协议。文档说明getter、暂停/恢复、SSR和清理，Registry仅记录受影响证据。

| 检查 | 实际结果 |
|---|---|
| 8组件unit/dom-contract/a11y/theme | 63文件1206条通过，含新增7条；保留jsdom canvas提示 |
| 8组件类型项目 / 全仓source types | 类型项目18文件188条通过；全仓 `pnpm run lint:types` 通过 |
| UI build / L7 / 消费者 | UI声明与69份CSS生成；UI L7 11项、0 FAIL/PENDING；breakpoint-types/timeline-types真实声明消费者通过，无source alias；保留unbuild既有警告 |
| 真实Chrome | breakpoint-native.mjs通过，Chrome150.0.7871.125；390px无resize启用、暂停后700px恢复、再缩390px，Steps方向/Avatar尺寸/List列宽和输入身份/value正确，零browser/Vue错误 |
| docs build/test/typecheck/content:check | 四项通过，84路由/998Demo、14文件157条、72组件内容校验，保留既有chunk警告 |
| Registry/inventory/tooling/Biome/diff | Registry19项及vue-native24 fixed/0 open、502行清单校验、8条tooling、6文件Biome及diff检查通过；SFC经vue-tsc/构建/实际浏览器验证 |
| Apollo visual checks | **未通过**：Grid18/Steps9/Avatar36/List33张missing-approved-baseline；未接受候选或更改阈值 |

范围包含Grid、Steps、Avatar、List及共享使用者Masonry/Descriptions/Pagination/Timeline的回归，未将旧VNA fixed记录改成新验收。未运行全仓verify:full/覆盖率，未改算法/基线/阈值，未推送或打标签。
