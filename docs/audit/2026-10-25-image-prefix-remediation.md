# Image 当前DOM前缀（2026-10-25）

正式14条公开组件回归，修前10失败/4初始CSR/SSR对照通过，无未处理异常，日志 `/tmp/apollo-image-prefix-red.log`。Image与PreviewGroup在setup缓存前缀，导致prop/Provider更新、显式覆盖移除和已打开预览仍沿用旧命名。另独立复现Group自定义previewPrefixCls时，mask=false修饰类错误地从Provider图片前缀派生。

Image的有效前缀、Group的图片/预览前缀改为computed，所有命名落点在render/computed读取当前值；Group的隐藏mask类由实际previewPrefixCls生成。Preview与Progress本身已读取当前props，无需改写。保留空串策略及其他业务契约。14条局部修后全过；Image/ConfigProvider全量17文件239条及根严格检查通过。

回归覆盖普通图/Progress/纯占位、初始SSR、prop/Provider替换、override移除、已打开独立/组预览的CSSMotion名称、旋转状态、节点与手动焦点保持。手动聚焦保持不表示完整focusTrap或自动焦点能力已修复。

## CSS边界

本批是DOM命名响应性修复，D04策略继续独立追踪。默认发布CSS为apollo；自定义命名空间需在应用构建前预生成并加载。浏览器测试通过构建阶段transformIndexHtml在页面head预置有限namespace的genImageStyle结果，不把CSS生成或注入加入组件运行时。

ConfigProvider.prefixCls是基础命名空间，Image.prefixCls及Group.previewPrefixCls是完整前缀。公开文档同时修正旧“默认CSS含ant”说法：实际本批产物只有apollo选择器。

## 检查

核心里程碑已通过：17文件239条运行回归、根严格检查、UI声明及69份CSS、发布消费端严格vue-tsc、L7的11项0FAIL/0PENDING、Registry19项/内容清单/tooling8条。公共类型未变，类型project复用前期已通过的4文件10条；本批新增模板由复制真实消费fixture的vue-tsc检查。改动代码Biome5文件通过，git diff检查通过。

最终Chrome150.0.7871.125生产包验证通过，零Vue/page错误：prop/Provider/Group前缀替换与移除、优先级/回退、三种占位命名和ARIA、根/图片/富input身份与草稿、已打开独立/组预览的旋转及手动焦点、实际自定义mask类与display:none、组内切图及真实关闭hidden。仅修正两处fixture排版：flex item的display会blockify，改普通排版保留CSS断言；控制条右侧留空以保留真实关闭按钮点击。日志 `/tmp/apollo-image-prefix-browser.log`，首轮与第二轮分别保留layout-red/controls-red日志，没有放宽断言或修改实现。

最终fixture冻结后发布包消费端再验通过。文档完整build/test/typecheck/content通过：84路由、999Demo、14文件157条及72组件；最后将CSS示例改为package实际导出的theme/tokens.css后重算内容并检查通过，浏览器本身也使用这个真实CSS入口。CSS说明准确区分基础namespace和完整前缀。新增浏览器/消费代码Biome3文件通过，git diff检查通过。

视觉检查仍缺9张Apollo批准基线，没有生成假批准图。保留历史completed和视觉维度，不表示完整Image或D04验收完成。

```sh
pnpm exec vitest run --project unit --project dom-contract --project a11y --project theme packages/ui/src/image packages/ui/src/config-provider --maxWorkers=1
pnpm run lint:types
pnpm run build:ui
node tests/consumer/image-slot-types.mjs
node tests/build/run.mjs --package ui --no-build
node tests/browser/image-prefix.mjs
pnpm --filter @apollo-design/docs run build
pnpm --filter @apollo-design/docs run test
pnpm --filter @apollo-design/docs run typecheck
pnpm --filter @apollo-design/docs run content:build
pnpm --filter @apollo-design/docs run content:check
pnpm run registry:check
pnpm run audit:content-slots:check
pnpm run test:tooling
node tests/visual/apollo.mjs --check --component image
```
