
## 项目约定（2026-09-21 用户指示）

- **GitHub 同步**：远程 origin = https://github.com/apollocmh/apollo-design-ui.git（私有）。
  **每完成一个阶段（组件收口 / 基建落地）都必须 `git -c http.proxy=http://127.0.0.1:7890 push origin HEAD:master` 同步到 GitHub。**
- 推送凭据：GitHub OAuth token 存在 macOS 钥匙串（git credential-osxkeychain，用户名 apollocmh，2026-09-21 设备码授权，scope=repo）；远程走 HTTPS 不用 SSH。
- **网络**：本机到 GitHub 的批量传输（release CDN / git fetch）直连会挂起，必须走用户代理 `http://127.0.0.1:7890`；小 API 请求（api.github.com）直连可用。
- GitHub MCP 连接器（apollocmh）：可读公开仓库，但**无建仓权限**（403）且**看不到新建私有仓库**（404，授权范围未含）——建仓/私有仓库操作需用户手动或走 git 凭据。
- 本机工具：gh CLI 2.101.0 在 `~/.local/bin/gh`（brew 已坏：portable-ruby 下载挂起，未修）；known_hosts 已更新为 GitHub 轮换后的新主机密钥（备份 ~/.ssh/known_hosts.bak-20260921）。

## 经典错误沉淀机制（2026-09-22 用户指示）

- **每个 Gate 收口时**，把本次踩的经典错误追加到 `docs/COMPONENT-CHECKLIST.md` 的「六、经典错误沉淀」（最近的在顶部），含：坑、哪一层测试抓到的、对策。
- badge 会话已沉淀 14 条（flex/grid 期教训 + badge 期 CSS 提取管线）。
