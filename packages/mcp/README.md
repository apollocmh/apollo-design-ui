# @apollo-design/mcp

Apollo Design 的本地 MCP 文档服务。让 AI 编程助手查询真实的 Vue 3 API 与 Demo，文档随包携带，运行时无需在线服务器。

通过 `npx` 启动，版本与项目的 `@apollo-design/ui` 保持一致（当前为 `0.1.9`）：

```bash
npx -y @apollo-design/mcp@0.1.9 --project /absolute/path/your-vue-project
```

需要 Node.js 22.12+。首次启动会下载 npm 包；文档随包携带，查询时离线运行。在 MCP 客户端中配置：

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

仓库开发者也可执行 `pnpm --filter @apollo-design/mcp build`，将客户端的命令改为 `node`，参数指向 `packages/mcp/dist/cli.mjs` 的绝对路径。

`--project` 用应用目录解析已安装的 `@apollo-design/ui`，与随包文档的精确版本核对。版本不匹配或未安装会拒绝启动；省略参数只浏览文档，并标记项目版本未验证。客户端需能找到 Node 和 npx，也可将 `command` 换成 npx 的绝对路径。

| 工具 | 用途 |
| --- | --- |
| `search_components` | 搜索组件与指南；空查询列出目录，可设置 `limit` |
| `get_document` | 读取 `components/button` 等文档 ID 的 API 或指南 |
| `list_examples` | 列出组件真实示例的名称与说明 |
| `get_example` | 读取示例源码及辅助文件，使用公开包导入路径 |

文档、示例工具支持 `language: "zh"` 或 `"en"`。所有响应附带 UI 版本、源码提交和项目版本状态。工具只读，不执行示例、不修改项目、不下载远程文档。

数据由组件 Markdown 和真实 Demo 自动生成，与文档站的 [llms.txt](https://apollocmh.github.io/apollo-design-ui/llms.txt)、单组件 Markdown 共用内容管线。此包是开发工具，不是 UI 的运行时依赖。

[AI 接入指南](https://apollocmh.github.io/apollo-design-ui/guide/ai) · [Apollo Design](https://apollocmh.github.io/apollo-design-ui/) · MIT
