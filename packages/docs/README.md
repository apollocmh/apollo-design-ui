# @apollo-design/docs

Apollo Design 文档站，基于 Vue 3、Vite 与 vite-ssg。提供组件 Demo、API、图标目录、主题展示和项目指南。本包是私有 workspace 应用，不发布到 npm。

[在线文档](https://apollocmh.github.io/apollo-design-ui/) · [主题展示](https://apollocmh.github.io/apollo-design-ui/guide/themes)

## 本地开发

在仓库根目录使用 `package.json` 指定的 Node/pnpm 工具链安装依赖：

```bash
pnpm install --frozen-lockfile
pnpm docs:dev
```

构建与预览：

```bash
pnpm build:docs
pnpm docs:preview
```

## 内容结构

- `content/`：指南与站点文章。
- `src/`：公共布局、导航、主题与交互。
- `tooling/content/`：Markdown、组件文档与 Demo 清单生成。
- `../ui/src/<component>/demo/`：组件示例源码及说明；组件文档与实现共置。
- `.generated/`：构建生成的内容数据，不手工修改。

站点一级导航为文档、组件、图标；侧栏随栏目变化。组件页的代码演示使用独立堆叠布局，并在右侧目录列出各个示例。Layout 使用隔离的 iframe 预览。

## Demo 与验证

预渲染页面包含可索引的正文，交互 Demo 在客户端挂载后加载。展示源码与实际运行使用同一内容管线。新增或修改示例时检查亮暗主题、窄屏、键盘、源码展开与相关交互。

```bash
pnpm --filter @apollo-design/docs typecheck
pnpm --filter @apollo-design/docs test
pnpm verify:docs:browser
```

完整流程见项目的 `TESTING.md` 与 `WORKFLOW.md`。文档部署由 `.github/workflows/deploy-docs.yml` 管理，输出静态产物到 GitHub Pages。

[测试标准](https://github.com/apollocmh/apollo-design-ui/blob/master/TESTING.md) · [工作流程](https://github.com/apollocmh/apollo-design-ui/blob/master/WORKFLOW.md)
