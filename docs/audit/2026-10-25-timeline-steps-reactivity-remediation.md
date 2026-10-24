# Timeline / Steps 原生响应性整改（2026-10-25）

本批修复当前数据与配置被 setup 快照冻结的问题，不夹带 Timeline 富内容槽或空壳 Item 的公共API迁移。

## 复现与实现

Timeline 新增7条初始回归，旧实现6条失败、1条SSR字符串样式已通过：数据同key替换/重排、reverse/orientation/mode、titleSpan、原生attrs、prefix和ConfigProvider当前默认值。日志 `/tmp/apollo-timeline-native-red.log`。没有把已通过的SSR路径报告为缺陷。attrs更新夹具后来改为父级原生传参，因为 VTU setProps 不声明 id 的类型不能代表组件公开attrs能力。

Timeline 渲染复用 Steps，因此另建 Steps 直接3条回归，旧实现全部失败（`/tmp/apollo-steps-native-red.log`）：current/status与当前点击动作映射、items/maxCount、字符串style更新（抛出CSSStyleDeclaration proxy错误）。Timeline数据即使重算，Steps setup解构的一次性折叠结果仍不会更新，必须修复真实依赖。纯折叠算法不改，使用computed调用并让状态/点击/active共同读取当前结果。

Timeline 数据、布局、前缀、titleSpan与语义映射使用computed；ConfigProvider使用当前getter，不解构成快照；reverse通过provide getter传到连线状态。根class/style在render中读取并用Vue normalizeClass/normalizeStyle处理。Steps语义props改为computed，不用watchEffect往普通快照写入。移除本批触及处用于模式、尺寸和实例的强制断言，尺寸收窄通过明确的large→medium解析，实例使用DOM类型守卫。

扩展2条发现中途修复的样式优先级回归，以及已文档化的Steps语义函数被Object-only运行时props告警；日志 `/tmp/apollo-timeline-native-expanded-red.log` 两失败/十通过。保留断言，修复后12条通过。Timeline原生root样式继续覆盖同名语义root样式；Steps保持既有相反合并顺序（语义root覆盖原生），不暗中统一两者。Steps classNames/styles 的运行时与组件声明现在接受已有 StepsProps 中的函数形态。

严格类型检查首次暴露两条source错误（4文件32条类型断言虽通过仍非绿灯）：Steps全局SizeType含large，与StepsSize不符；VTU错误地用setProps传未声明id。分别通过尺寸解析与真实父组件attrs夹具修正，未忽略诊断或强制断言。双语API同步当前响应性与尺寸边界，动态任意prefix的静态CSS仍由D04追踪。

## 验证

Node22.22.2 / pnpm12.4.2：

| 检查 | 结果 |
|---|---|
| Timeline/Steps unit/dom-contract/a11y/theme | 12文件222条通过，包含12条新增；保留jsdom canvas提示 |
| 类型项目 / 全仓source types | 类型项目4文件32条通过，零source错误；全仓 `pnpm run lint:types` 通过 |
| UI build / L7 | UI构建生成声明与69份CSS，保留既有unbuild警告；UI L7 11项通过、0 FAIL/PENDING |
| `node tests/consumer/timeline-types.mjs` | 无source alias，真实产物声明消费Timeline与Steps语义函数通过；测试目录未入包 |
| `node tests/browser/timeline-native.mjs` | Chrome150.0.7871.125通过：当前数据、反转/方向/mode/titleSpan、原生string style/attrs、配置默认值与RTL、根/输入身份和值；Steps当前步骤/折叠展开/语义函数/受控点击单次通知，零browser/Vue错误 |
| docs build/test/typecheck/content:check | 四项通过；84路由、997Demo、14文件157条、72组件内容校验；保留既有chunk警告 |
| Registry/inventory/tooling/Biome/diff | Registry19项及vue-native24 fixed/0 open、499行清单、8条tooling、7文件Biome与diff检查通过 |
| Apollo visual checks | **未通过：Timeline36张、Steps9张missing-approved-baseline**；未接受候选或改变阈值 |

不宣称Timeline富内容槽已实现、全库F11关闭或两个组件新视觉验收。既有DOM参考基线、折叠算法、时长和阈值未改。未运行全仓verify:full/覆盖率，未推送或打标签。
