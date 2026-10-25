# F10 · 浮层原生 style 与面板语义（2026-10-25）

首批14条回归修前10失败/4通过，并捕获2个由非法style数字键引起的未处理错误（`/tmp/apollo-overlay-attrs-red-final.log`）。字符串style被对象展开成 `0/1/2` 字符键：三种PurePanel的CSR/SSR、主Popover与Popconfirm的挂载均受影响。PopconfirmPurePanel还遗漏root/container/arrow语义转发，移除原生style后无法恢复已经声明的根样式。四条attrs-only替换本来通过，**没有**把computed结构静态猜测成当前响应性故障。

先改用Vue原生style数组及normalizeStyle合并，使14条通过；再依当前Vue根attrs规范与用户ADR0007要求，独立建立两条root-only回归，均失败（`/tmp/apollo-overlay-padding-red.log`）：`style=padding:20px`将已设为6px的container覆盖成20px。旧源码仅以上游同构作为双落点依据，不将它作为本库最终规范；现直接移除container的原生style复制，容器只消费styles.container。破坏性落点修正单独记录 [迁移方案](../migrations/overlay-native-styles.md)，无兼容层。

三种静态面板/主Popover/主Popconfirm五入口支持字符串、对象、混合数组、CSS变量与属性移除；原生style优先于语义根，移除后恢复。补齐静态确认面板的三类外层语义与PopoverPurePanel的箭头class/style。移除受影响静态包装的never强转，实际h调用由类型检查验证；未改Trigger/Portal/Motion或全局样式引擎。三个既有示例改用真实字符串style；Demo数量仍999。

## 检查结果

| 检查 | 实际结果 |
| --- | --- |
| 专项复现 | 14条中10失败/4通过、2个未处理错误；另两条root-only均失败 |
| 四层运行 | 28文件384条通过，新增16条；无未处理错误，保留既有jsdom canvas提示 |
| 严格类型 / 类型项目 | 全仓严格检查最终源码通过；8文件24条类型通过，公开类型不变 |
| UI / L7 / 发布消费者 | UI声明+69份CSS生成，UI L7 11项/0 FAIL/PENDING；实际声明消费者含五入口原生attrs模板、三个现有Demo与前批六入口正负例通过，无source alias |
| 生产浏览器 | Chrome150.0.7871.125：五根当前string/array/object/移除、语义恢复/箭头、root与container隔离、root/input身份和值、触发器不污染通过；前批六入口内容/Promise脚本也通过，零Vue/page错误 |
| docs build/test/typecheck/content:check | 四项通过：84路由/999Demo、14文件157条、72组件内容校验；保留既有chunk警告 |
| Registry / inventory / tooling / Biome / diff | Registry19项及vue-native24 fixed/0 open、516行清单只读校验、8条tooling、Biome8文件与diff通过；历史完成维度不升级 |
| Apollo visual | **未通过：Tooltip9、Popover6、Popconfirm9张missing-approved-baseline**，三命令均退出1；未创建或接受基线 |

历史DOM对照的基线、keepStyle和其他门禁配置未更改；新CSR/SSR断言明确检查root20px/container6px，不用旧DOM对照代替Vue契约。全仓verify:full/覆盖率未运行，全库F11、其他attrs落点和图标槽继续开放；不把历史completed状态当作新验收。未推送或打标签。

```sh
pnpm exec vitest run --project unit --project dom-contract --project a11y --project theme packages/ui/src/tooltip packages/ui/src/popover packages/ui/src/popconfirm packages/ui/src/steps --maxWorkers=1
pnpm exec vitest run --project types packages/ui/src/tooltip packages/ui/src/popover packages/ui/src/popconfirm --maxWorkers=1
pnpm run lint:types
pnpm run build:ui
node tests/build/run.mjs --package ui --no-build
node tests/consumer/overlay-content-types.mjs
node tests/browser/overlay-attrs.mjs
node tests/browser/overlay-content.mjs
pnpm --filter @apollo-design/docs run build
pnpm --filter @apollo-design/docs run test
pnpm --filter @apollo-design/docs run typecheck
pnpm --filter @apollo-design/docs run content:check
pnpm run registry:check
pnpm run audit:content-slots:check
pnpm run test:tooling
```
