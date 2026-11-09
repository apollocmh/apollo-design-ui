---
title:
  zh-CN: AI 接入
  en-US: AI Integration
order: 1.5
---

## zh-CN

AI 编程助手需要先读取 Apollo Design 的文档，再生成代码。Apollo 是独立发展的 Vue 3 原生组件库，不能直接套用 React 或其他组件库的 API。

### 把文档交给 AI

- [llms.txt：文档索引](https://apollocmh.github.io/apollo-design-ui/llms.txt)
- [llms-full.txt：完整中文文档与示例](https://apollocmh.github.io/apollo-design-ui/llms-full.txt)
- [llms-full.en.txt：完整英文文档与示例](https://apollocmh.github.io/apollo-design-ui/llms-full.en.txt)
- [Button 单组件 Markdown](https://apollocmh.github.io/apollo-design-ui/components/button.md)

每个组件都有 `components/<name>.md` 和 `components/<name>.en.md`，指南有 `guide/<slug>.md` 和 `guide/<slug>.en.md`。完整文件可能超过模型上下文，日常优先使用索引和单页。静态文件跟随文档站部署更新，开头标注 UI 版本与源码提交；使用旧版本项目时需核对版本。

可以把这段要求放进项目的 AI 指令文件：

```text
本项目使用 Apollo Design（Vue 3）。编码前核对已安装的 @apollo-design/ui 版本，
读取 https://apollocmh.github.io/apollo-design-ui/llms.txt 中对应组件的文档和示例。
Props、Slots、Emits、v-model 和导入方式以 Apollo 文档为准，不推测其他 UI 库的 API。
先引入 @apollo-design/theme/tokens.css，再引入 @apollo-design/ui/style.css。
缺少 API 信息时先查询；不要编造属性、事件或包名。
```

这些文件用于提供上下文。AI 客户端不一定自动发现或读取 `llms.txt`，需要在提示词或项目指令中明确提供链接。

### 本地 MCP

`@apollo-design/mcp` 提供 stdio MCP 服务，文档随包携带，查询时无需网络、账号、API Key 或在线服务器。通过 npm 分发，选择与项目 UI 相同的版本（当前为 `0.1.9`）。首次使用 `npx` 会下载包，后续查询直接读取随包文档。

```bash
npx -y @apollo-design/mcp@0.1.9 --project /absolute/path/your-vue-project
```

在支持 MCP 的客户端中加入配置，替换项目绝对路径（不同客户端配置文件位置可能不同）：

```json
{
  "mcpServers": {
    "apollo-design": {
      "command": "npx",
      "args": [
        "-y",
        "@apollo-design/mcp@0.1.9",
        "--project",
        "/absolute/path/your-vue-project"
      ]
    }
  }
}
```

需要 Node.js 22.12+。`--project` 指向已安装 `@apollo-design/ui` 的应用目录；服务启动时核对精确版本，不匹配或无法解析该包会报错。省略该参数可浏览随包文档，但会明确标记项目版本未验证。

四个只读工具：`search_components` 搜索组件和指南，`get_document` 获取 API 或指南，`list_examples` 列出示例，`get_example` 获取真实 Vue 源码及本地辅助文件。工具不执行示例、不修改项目；文档、源码、公开导入路径与网站使用同一条生成链路。

## en-US

Apollo Design is an independent Vue 3 native UI library. Give your coding assistant its documentation before asking it to write code; do not assume React or another library's APIs.

### Documentation for AI

- [Documentation index](https://apollocmh.github.io/apollo-design-ui/llms.en.txt)
- [Full English documentation and examples](https://apollocmh.github.io/apollo-design-ui/llms-full.en.txt)
- [Full Chinese documentation and examples](https://apollocmh.github.io/apollo-design-ui/llms-full.txt)
- [Button Markdown](https://apollocmh.github.io/apollo-design-ui/components/button.en.md)

Components are available at `components/<name>.md` and `components/<name>.en.md`; guides at `guide/<slug>.md` and `guide/<slug>.en.md`. Prefer individual pages to keep context small. Files identify their UI version and source commit and update with the documentation site. Check the version before using them in an older project.

Add the index URL to your project's AI instructions and ask the assistant to read the relevant APIs and examples first. Clients do not necessarily discover `llms.txt` automatically. Use Apollo's documented Props, Slots, Emits, v-model and imports. Import `@apollo-design/theme/tokens.css` before `@apollo-design/ui/style.css`. Query missing information instead of inventing APIs.

### Local MCP

`@apollo-design/mcp` serves bundled documentation through stdio, with no network requests, account, API key or hosted server required at runtime. Use the npm package matching your UI version (currently `0.1.9`). The first npx launch downloads the package; subsequent queries read bundled files.

```bash
npx -y @apollo-design/mcp@0.1.9 --project /absolute/path/your-vue-project
```

Configure your MCP client, replacing the absolute project path:

```json
{
  "mcpServers": {
    "apollo-design": {
      "command": "npx",
      "args": [
        "-y",
        "@apollo-design/mcp@0.1.9",
        "--project",
        "/absolute/path/your-vue-project"
      ]
    }
  }
}
```

Node.js 22.12+ is required. `--project` resolves the application's installed `@apollo-design/ui` and checks its exact version. Missing packages and version mismatches fail explicitly. Without this option you can browse the bundle, but the project version is reported as unverified.

Read-only tools: `search_components`, `get_document`, `list_examples`, and `get_example`. They retrieve documentation and actual Vue demos with local helper files, without executing code or modifying your project. The site and MCP share the same content pipeline and public import rewriting.
