# 文档站视觉与独立目录页改造

用户要求：文档站按 Ant Design 风格改造；Icon 虚拟列表覆盖全部图标；
组件总览和 Icon 直接使用 Vue 代码实现。

## 改动

- 参考 [Ant Design 总览](https://ant.design/components/overview-cn/) 和
  [Icon 页面](https://ant.design/components/icon-cn/) 的视觉层级；分析先于实现，见
  [分析记录](../analysis/docs-antd-visual-2026-10-23.md)。不复制其实现、插画或组件截图。
- 外壳采用 300px 左栏、64px 顶栏、48px 正文起始留白；统一 32px 页面标题、
  24px 章节标题、侧栏分组、顶部搜索与导航选中线。组件、指南、更新日志沿用同一套标题变量。
- 总览为独立手写 Vue 页面：72 个 UI 组件及独立 Icon 资源，共 73 个入口；
  组件示意图使用本站 HTML/CSS 和已有图标绘制，不挂载 Demo。支持中英文名称搜索、
  分类计数及目录锚点；桌面四列、平板三列、手机两列。
- Icon 同样为独立手写 Vue 页面：848 个图标全部进入可滚动范围，没有分页或加载更多。
  窗口滚动虚拟行与响应式列数控制 DOM，图标模块仅在瓦片挂载时动态加载。
  筛选作用于完整目录（447 outlined / 251 filled / 150 twoTone），支持名称子串搜索、
  三种复制格式、方向键、Home/End 及 Ctrl/Command+Home/End。
- 虚拟行尺寸消费站点 CSS Token；SSR 和水合首轮结构确定，mounted 后测量窗口。
  监听器、ResizeObserver、动画帧和异步图标加载均有卸载处理。
- 站点颜色、圆角、字体和阴影继续引用主题 Token，不向 Demo 注入全局 Provider。
  本次没有组件 API 或组件完成状态变化，因此不更改 UI 组件 Registry 状态。

## 可复现验证

使用 Node 22.22.2；本机命令统一带：

```sh
export PATH=/Users/nanren/.nvm/versions/node/v22.22.2/bin:$PATH
export npm_config_manage_package_manager_versions=false
```

```text
pnpm --filter @apollo-design/docs run test
Test Files  14 passed (14)
     Tests  154 passed (154)

pnpm run lint:types
vue-tsc --noEmit -p tsconfig.json
exit 0

pnpm --filter @apollo-design/docs run typecheck
vue-tsc --noEmit -p tsconfig.json
exit 0

pnpm run lint:format
Checked 3288 files in 6s. No fixes applied.
Found 37 warnings.
Found 4 infos.
exit 0
```

上述格式警告与提示数量同改造前；未降低任何阈值。新增虚拟窗口测试覆盖首尾、
空目录、屏外窗口、未满末行及不同列数的全范围可达性。

```text
pnpm --filter @apollo-design/docs run build
✅ 内容管线：72 组件 / 989 demo / 7 指南 → .generated/
[vite-ssg] Rendering Pages... (84)
[vite-ssg] Build finished.
exit 0

# 先启动生产 preview：
pnpm --filter @apollo-design/docs exec vite preview --host 127.0.0.1 --port 4477 --strictPort

DOCS_EVIDENCE_DIR=docs/audit/evidence/docs-catalog-2026-10-23 node packages/docs/tests/catalog-browser.mjs
PASS 46 catalog checks; evidence: docs/audit/evidence/docs-catalog-2026-10-23
exit 0

node packages/docs/tests/smoke-browser.mjs
—— 浏览器冒烟：37/37 通过 ——
exit 0
```

生产浏览器实测：遍历全部 848 个名称，与 manifest 集合精确相等；
1440×1000 下挂载瓦片峰值 105，完整目录 122 行 × 7 列（末行不足 7 项）；
390px / 768px / 1440px 无页面横向溢出；键盘跳首尾、复制 import / Vue 标签、
三风格筛选、无结果状态及移动导航正常。暗色和英文标题正常，普通 Button Demo 仍渲染。
浏览器运行错误和水合错误均为 0。

既有冒烟脚本原本断言「首屏固定 120 个」并定位英文 TwoTone 文案，
对应旧分页方案。按用户要求改为全量虚拟窗口后，这两条假设已失效。
现改验完整行数、挂载上限、实际末项可达及双语风格切换；没有删除功能断言、
跳过用例或放宽组件视觉阈值。提交说明同步记录原因。

构建仍有原有大 chunk、搜索模块静态/动态混用及 Demo frontmatter 提示；
本次没有调整相关警告阈值。

## 视觉与运行证据

- [总览 · 桌面](evidence/docs-catalog-2026-10-23/overview-desktop.png)
- [Icon · 桌面](evidence/docs-catalog-2026-10-23/icon-desktop.png)
- [Button · 普通文档页](evidence/docs-catalog-2026-10-23/button-desktop.png)
- [总览 · 手机](evidence/docs-catalog-2026-10-23/overview-390.png)
- [Icon · 手机](evidence/docs-catalog-2026-10-23/icon-390.png)
- [总览 · 暗色英文](evidence/docs-catalog-2026-10-23/overview-dark-en.png)
- [完整断言与名称集合](evidence/docs-catalog-2026-10-23/results.json)
- [实际命令输出摘录](evidence/docs-catalog-2026-10-23/validation.txt)

视觉结论为文档站布局与层级向参考靠拢，不声称与 Ant Design 逐像素一致；
预览插画、品牌及 Vue API 为本项目自身实现。
