# Image 原生缩略图槽（2026-10-25）

首批13条真实回归修前8失败/5已有通过，无未处理异常，日志 `/tmp/apollo-image-slot-red.log`。顶层imageRender确有类型/文档声明但Image组件不消费，旧同名Demo也没有renderer调用；不是已有函数路径正常工作的兼容迁移。默认图加载/error、默认预览/分组、默认SSR和Progress CSR/SSR不求槽守卫原已正常。

直接移除顶层函数声明，新增ImageSlots.imageRender单对象原生槽并导出ImageRenderInfo/ImageSlots。只在正常图片render构造现有img VNode并传槽，原ref、load/error、样式/原生属性不变；槽存在（含空返回）优先，移除恢复。scope提供当前raw src（含fallback，未提供undefined）、alt/width/height、原生title和语义image类。SSR富/空、当前信息、富input与img身份、加载/error、独立预览和组注册均覆盖，局部13条修后通过。

原image-render Demo现为真正的原生template，保留同名Demo数量；包含当前/空/移除与本地图片交互。preview配置imageRender/工具栏/计数等同名配置不做批改，后续独立复现；其他attrs/全局配置/前缀与完整Image验收继续追踪。迁移细节见 [记录](../migrations/image-render-slot.md)。

## 浏览器发现的预览关闭问题

原生槽的浏览器验证实际打开独立预览后，关闭断言超时：弹层一直可见并停在 `fade-leave-active`。日志 `/tmp/apollo-image-slot-browser.log` 保留原失败。`Preview` 的默认 motionName 为 `fade`，实际 CSS 只有 `apollo-image-preview-fade`；同时没有结束事件的 deadline，不能用禁用动画、手动发送 transitionend 或放宽“确实隐藏”断言掩盖。

本批一并修正预览动画命名与缺失结束事件的关闭兜底，使用现有预览前缀生成默认名称并保留显式覆盖，兜底采用现有 Drawer/Modal 相同的500ms。浏览器保留正常关闭断言，另加入 `transition:none` 且没有 transitionend/animationend 的真实关闭场景。此问题由浏览器复现发现，不归因于图片槽，也不表示其他预览扩展已可用。

默认/自定义前缀与显式覆盖3条真实组件集成回归，原实现2失败/1已有通过，修复后3通过。jsdom只验证真实CSSMotion接线，不伪造动画环境；实际关闭及无结束事件的兜底由生产浏览器验证。

## 检查

- 运行时四project：7文件86条通过；类型4文件10条通过，无类型错误；根严格检查通过。
- UI构建生成SFC声明及69份CSS；发布消费端验证实际Demo、精确slot作用域/optional src、旧函数字段和未知slot负例，不设源码alias，不携带测试声明；L7复用本次产物，11项0FAIL/0PENDING。
- Chrome150.0.7871.125通过完整图片槽、单次原生事件、节点/草稿/焦点保持、独立与组预览注册/更新/正常关闭，以及无CSS结束事件的关闭；零Vue/page错误。
- Registry检查19项、内容清单检查与tooling8条通过；Biome检查11份改动代码通过，git diff检查通过。
- 文档顺序执行build → test → typecheck → content:check全部通过：84路由、999个Demo、14文件157条测试及72组件内容检查。
- Image视觉检查明确失败：缺9张Apollo批准基线；没有复制旧参考图、生成假批准图或降低阈值。未升级历史completed或视觉维度。

运行日志仍有既有jsdom canvas提示和构建体积/工具链警告；检查结果不表示这些全仓事项已关闭。红测与最终日志分别保留在 `/tmp/apollo-image-slot-*` 和 `/tmp/apollo-image-preview-motion-*`。

```sh
pnpm exec vitest run --project unit --project dom-contract --project a11y --project theme packages/ui/src/image --maxWorkers=1
pnpm run lint:types
pnpm exec vitest run --project types packages/ui/src/image --maxWorkers=1
pnpm run build:ui
node tests/consumer/image-slot-types.mjs
node tests/build/run.mjs --package ui --no-build
node tests/browser/image-render.mjs
pnpm --filter @apollo-design/docs run build
pnpm --filter @apollo-design/docs run test
pnpm --filter @apollo-design/docs run typecheck
pnpm --filter @apollo-design/docs run content:check
pnpm run registry:check
pnpm run audit:content-slots:check
pnpm run test:tooling
node tests/visual/apollo.mjs --check --component image
```

inventory重算仍为520行：data134 / content-candidate154 / deprecated53 / internal100 / renderer-candidate67 / configuration12；keep146 / review202 / skip153 / verified19。移除顶层函数字段、新增ImageSlots中的内部槽定义，不新增虚假的组件级verified记录。
