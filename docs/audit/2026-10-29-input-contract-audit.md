# 2026-10-29 Input 六系列契约整改

状态：Input owner 的源码整改与关联验证完成；整批最终同一提交的构建、发布消费、文档及全库门禁由 Root 统一记录。本记录不代替整批验收。

## 范围与盘点

范围为 Input、TextArea、Password、Search、OTP、Group，以及实际消费的 engine、共享 useAllowClear 和直接关联的 Mentions、Transfer、Form 路径。实施前已逐项盘点原有 142 个 Props 与 60 条 Slots/Emits/v-model/Expose/attrs/Provider/语义样式/状态生命周期/键盘 IME/SSR 轴，共 202 项，逐项追踪声明、传递、消费和行为。

原始冻结提交为 `d87f84c7ab3b6728f0a98b06fad3ec08852b4eea`。分类为已验证正常 104、本轮必修 98、需要裁决 0、另案处理 0；原始 223 个有效浏览器探针为 124 通过、99 失败。完整逐项清单及原始行为结果保存在 [inventory](evidence/input-contract-inventory.json)，原始运行报告及其 SHA 继续保留，不用当前绿灯改写历史失败。盘点涵盖已接受的尺寸契约，未重新扩张其范围。

## 实现与迁移

- Input/TextArea 共享 Vue 状态与 IME 提交边界，保留组合草稿，在 compositionend 后只提交一次。change 使用实际 DOM Event；clear 单独发送 MouseEvent，顺序为 DOM/model → clear → 实际编辑器 input/change。监听器数组、once、受控拒绝和非受控草稿有独立回归。
- BaseInput 固定 group/wrapper/affix 的 VNode 路径，未启用的宿主使用 display:contents；动态 clear/count/addon/插槽不更换编辑器。class/style/hidden、公开 ref 和父 SFC 的 scope ID 均落到实际逻辑根，scope 转发在 Vue 非根边界停止。
- 内容按存在性消费，保留 0、显式 null/false 和空插槽。共享 useAllowClear 完整核对 Input、TextArea、Mentions 三个调用者；仅 undefined 触发图标回退。清空按钮有当前语言名称、真实禁用守卫、至少 24px 的独立目标和可见键盘焦点。
- Password 移除被覆盖的 type，iconRender 迁移至 `#icon="{ visible }"`，显隐由实际原生按钮和当前配置控制。Search 保留并传递有用的 type，nativeElement 指向 Compact 根，自定义按钮、普通 VNode、数组和零值均有实际行为覆盖。
- OTP 每次编辑同步部分 model，完整值变化才发 change；formatter 后按码点限制长度，受控父值保留决定权。separator 渲染函数迁移至 `#separator="{ index }"`，静态内容保留。TextArea 的 maxLength、方向、非 autoSize resize 和 document 监听清理同步修复。
- Mentions 的固定内部 div 保留 textarea、草稿、焦点、选区和公开 ref；裸根/有包装的两条精确 CSS 路径均覆盖，恢复 260px 外层内的 258px 编辑区。默认/compact 下的零值与文本清空图标均满足目标大小及留位，键盘清空回焦真实编辑器。
- FormItem 使用 cloneVNode 保留原 owner/ref/指令/key/scope 和动态字段 attrs；Vue mergeProps 保留监听器数组与 once。同一输入的 model/change 配对只收集/校验一次，getValueFromEvent 收到实际 change Event；model-only 控件、多次同步更新、独立编辑、卸载取消均有回归。关联 Form 的 label、清空、值、校验、错误色和 feedback 已在浏览器验证。

公共 API 变更、原生事件与 DOM 路径迁移见 [迁移说明](../migrations/input-contracts.md)。中英文 API、导出类型、Password/OTP Demo 与实现同步。嵌套 count/showCount formatter 继续属于既有配置接口，未泛化移除。

原 React DOM oracle 保持不变。Input 40、Mentions 20、Transfer 搜索 2、Form 20 项使用逐案例的精确差异，并额外检查完整 Apollo 物理树，防止 child-count 差异使旧树比较停止递归后漏检后代。完整树沿用各场景原来的 keepStyle 策略；Form 样式另有实际浏览器证据。没有 unwrap、通用忽略包装层、删除断言或降低阈值。

## 已执行验证

| 检查 | 命令或入口 | 结果 |
| --- | --- | --- |
| 单元、DOM、无障碍、主题及全部关联 | `pnpm exec vitest run --project unit --project dom-contract --project a11y --project theme --maxWorkers=1 packages/ui/src/input/__tests__ packages/ui/src/mentions/__tests__ packages/ui/src/transfer/__tests__ packages/ui/src/form/__tests__ packages/ui/src/_internal/__tests__/use-allow-clear.test.ts` | 38 文件，635/635 |
| 严格源码类型及类型正负例 | `pnpm exec vue-tsc --noEmit -p /tmp/apollo-input-current-types/tsconfig.json`，有界源码项目，含 Input 两个类型文件、Form SFC fixture/回归、完整树 helper 与 Mentions engine | 0 诊断；配置与空诊断日志随 handoff 留证 |
| 六系列真实浏览器行为 | `INPUT_CONTRACT_EVIDENCE_DIR=<fresh> node tests/browser/input-contracts.mjs` | 原 223 项 + 26 关联项，共 249/249 |
| SSR 首屏与 hydration | 同上 associated，含实际 SFC 的根/非根、bare/affix | 服务端首屏的 scope 属性和计算样式已生效；hydration 后属性相同、编辑器不替换；peer 与非根祖先隔离 |
| 既有尺寸回归 | `INPUT_SIZING_REPO=<same-source-freeze> INPUT_SIZING_SERVE=dev INPUT_SIZING_EVIDENCE_DIR=<fresh> node tests/browser/input-sizing-contracts.mjs` | 169 阶段、1075/1075，19 token 范围不扩张 |
| 格式和语法 | 变更范围 `biome check`；三个 consumer/browser 入口 `node --check` | exit 0 |

完整浏览器运行复制并冻结当前全部基础包与 UI 源码，Vite 只使用 createServer；记录实际读入文件 SHA，禁止库 dist 和工作区源码逃逸，固定单一 Vue 实例，结束检查源码未变、全部 reader 退出。未执行 package/Vite build，未写 dist。尺寸运行中四个 dist 文件仅作为旧 guard 的只读锁；实际运行不读取库 dist。

初次关联并发运行出现 Input/Form 主题 8 项默认 5s 超时，未改超时，单 worker 完整复跑已全部通过。旧 Mentions selector 字面断言已按实际路径修正，原断言职责保留。新永久浏览器工具最初遗漏 patch 的 page.evaluate 参数；失败报告保留，补齐参数后 249 项通过。bootstrap 错误现在单独记录，避免 finally 的空案例断言覆盖原错误。jsdom 的伪元素 getComputedStyle 提示是其能力边界，实际焦点和几何另用浏览器检查。

## 冻结与整批边界

[源码冻结清单](evidence/input-contract-source-freeze.json) 记录本 owner 的文件 SHA、实际运行读取的源码 SHA、命令、结果和原始证据路径。工作区含其它 owner 的并行整改；本 owner 不覆盖其文件、不提交/推送/发布、不改 Registry 或重建 dist。Root 负责根导出、Registry 和统一提交。

发布声明消费工具 `tests/consumer/input-types.mjs` 已同步 Root/input 两个入口、24 个当前 Demo、6 个 TS 负例及 13 个逐行 SFC 负例，但本 owner 不在旧 dist 上宣称新版发布验收通过。Root 使用新候选产物执行严格构建、发布正负例、双 CSS 模式 1075 尺寸、文档与最终同一提交的全量门禁；结果追加在整批交付记录。关联 Mentions/Form/Transfer 的上述路径已验证，不代表这三个组件完成整体验收。本批交接后按用户要求暂停，不领取新任务。
