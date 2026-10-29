# Button 实色前景回归修复

本轮仅修复用户报告的亮色 primary 黑字及同根因的危险按钮文字，完成后恢复暂停，不派发下一批。

## 当前链路与范围

- 已核对 `Button.vue` 的 type/color/variant/ghost、原生 button/anchor、loading/disabled、默认/icon 槽、click、唯一 nativeElement expose；这些接口不调整，无 v-model。主题切换不重建内容，原生 attrs/style 最后合并。
- 已核对 `ComponentToken` → `prepareComponentToken` → `useButtonTheme` → 生成 CSS → 三态实际前景。primaryColor/dangerColor 均准备为 colorTextLightSolid，但被 automaticForegrounds 跳过，浏览器 contrast-color 覆盖成黑色，属于本轮必修。
- 同组检查 solidTextColor、默认实色、预设色、默认 hover/active 彩色文字、ghost、disabled、当前/嵌套 Provider、源 token 的替换/删除、原生变量覆盖。默认及预设实色的自动黑白策略与 primary/danger 的明确浅色语义分开；不批量改为白字。
- Ant Design 当前官方 Button 文档及源码均将 primaryColor/dangerColor 设为 colorTextLightSolid，默认白字，三态沿用。参考：https://ant.design/components/button/ 与 https://github.com/ant-design/ant-design/blob/master/components/button/style/token.ts 。用户已要求直接参考整改，不再等待配色裁决。
- 验收同时保留既有 4.5:1 色彩门禁：浅色实心主/危险背景按相对线性 sRGB 限制过高亮度，保留原色方向与全局 Alias；不修改全局主色、不降低对比阈值。显式组件/原生前景仍优先，使用方负责自定义配色。
- 此单元不扩展公共 API；原有 Props/Slots/Emits/Expose 类型不变。全库其余审计、其他浏览器完整矩阵另案，不能据本次局部通过宣称全库完成。

## 验收清单

1. 先保存可失败复现，验证已有默认前景没有真正消费。
2. 默认/暗色/紧凑/组合主题的 primary/danger 三态白字；CSS-only 与 Provider 一致；禁用/ghost 保留原职责。
3. 动态/嵌套 token、移除恢复、原生变量优先、多实例/卸载重挂、焦点与内容身份保持。
4. Button 与 Input.Search、Dropdown、FloatButton 等实际消费者相关测试、严格类型、现有生产浏览器/SSR/水合、全部 20 Demo 和原生视觉。
5. 同步 Demo、双语文档和 Registry，记录命令、结果、源提交与尚未验证边界；提交推送，不派发新整改单元。

## 实际消费者补充

原 Button 消费者脚本完整 51 项复验发现 Input.Search 两项失败：搜索按钮没有进入 loading、异步结果不更新。沿当前 Search 的 emits 与两个原 Demo 核对，源码已经使用 `emit('search', ...)`，模板仍写 `:on-search`，四处监听未进入 Vue 的 search 事件。完整盘点全部 Input Demo 的同类写法，仅 `search.vue`、`search-input-loading.vue` 四处；统一改成 `@search`，不新增回调兼容通道、不改 Search 公共实现。两个真实 Demo 的 Enter/加载/重复请求/值保持/卸载回归先证实 2/2 失败，原 51 项浏览器交互断言全部保留。此为本次实际 Button 消费链发现的既有无效接口用法，纳入修复，非新组件任务。

## 统一验收

- 实现 `00c6ecb6`，两个 Search Demo 及可失败回归 `96ce538c`，均已推送；公开 Props/Slots/Emits/Expose 类型不变。
- Button 四运行 project 361/361；Button/Input/Dropdown/FloatButton/ConfigProvider/Space 的同次关联运行 1499/1499，另补真实 Search Demo 2/2。首次并发运行的九个 5s 超时保留，串行 worker 重跑同一完整集合通过，未改超时、断言或场景。
- 当前发布入口浏览器 161/161；58 Token、原生优先、移除恢复、禁用/ghost 与内容身份等通过。颜色四算法/各色变体/三态 1168/1168，继续要求 4.5:1，另要求 primary/danger 三态实际白字。全部 20 原 Demo 四算法 80/80；真实关联消费者 51/51。
- 独立 Node SSR 8/8，四算法水合 20/20。实际 Chromium145（不支持 contrast-color、支持相对颜色）在 basic/danger×亮/暗×三态 12/12 白字与 4.5:1 通过；这不是旧浏览器完整矩阵或 Firefox/Safari 实测。
- 六个受影响组件的 318 个自有视觉场景含实际交互和 axe 全部生成成功；264 张原始 RGBA 完全不变，54 张仅预期字色/背景配对差异，经 14 张前后对照联系表逐张审阅后批准。318 条批准图 hash 复核，1215 总数不变；其他批准记录与全部 React 参考图不改。不是宣称全库 1875 图已覆盖，也不把批准后 hash 复核说成第二次独立浏览器截图。
- UI 实际构建及严格 L7 11/11、根严格 TypeScript、Docs 161/161、严格类型及 SSG、本地实际站点 43/43、工具脚本 20/20 通过。最终发布来源、线上结果与公开类型计数见下方机器证据。
- 验证时发现三个本地基础包旧产物，已按生产源码逐包字节核对，从上批清洁 `72502177` 验证目录恢复 12 个完全同源产物。一次误将 L7 默认重建与产物读取重叠，导致无效构建失败；随后冻结产物再执行浏览器/SSR/水合/视觉，保留首轮日志，不将其算作通过。视觉构建补齐真实 Locale 产物别名，不依赖根目录偶然的 node_modules 链接。

本次范围已交付并暂停。7c95389e 的发布40850896942成功，CI Docs161/全包L7 151检查零失败/零待定；线上Button43与Search2全部通过。最终同一7c95389e的1501项相关运行全部通过；5个遗留预览服务已停止，没有新派发。完整发布回执见[evidence/button-foreground-publication.json](evidence/button-foreground-publication.json)。全库完整数仍 25/72；其他 47 组件、13 基础包完整复核与全库最终同提交门禁保持开放。完成本次线上交付后暂停，不派发其他任务。

机器证据：[实现红绿](evidence/button-foreground-milestone.json)、[真实 Search 示例](evidence/button-search-demo-events.json)、[视觉逐项记录](evidence/button-foreground-visual.json)、[统一验收与发布状态](evidence/button-foreground-acceptance.json)。
