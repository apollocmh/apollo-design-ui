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

当前状态：盘点完成，复现和修复尚未验收。
