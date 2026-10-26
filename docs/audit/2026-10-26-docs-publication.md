# 文档站更新与进展可见性

## 当前范围与盘点（实施前）

用户要求更新文档站并消除持续审计的黑盒感。本单元只覆盖进展入口、可阅读的里程碑、既有更新日志和当前站点发布，不扩展组件能力或重构文档站全部功能。

| 链路 | 当前源码/实际状态 | 本轮处理与验收 |
|---|---|---|
| HomePage → RouterLink/站点语言 | 无公开Props/Slots/model/expose；既有locale响应性、静态CSS变量、客户端hero保留 | 增加双语可发现的进展入口，验证桌面/移动、暗色/语言切换与路由 |
| 指南源 → frontmatter/双语分节 → manifest/search/nav/sitemap → GuidePage | 既有按slug读取、SSR预取、异步请求守卫；本轮复用 | 新增进展指南，明确已完成/已验/未完，链接真实Demo与提交证据；检查生成内容及实际页面 |
| Changelog → git log 600条 → JSON → 页面loading/ready/error | 既有构建期git来源；发布checkout默认浅克隆，无法提供完整600条历史 | 保留既有模型/错误态；补进展入口及当前构建最新提交链接；发布读取完整历史 |
| git push → Deploy Docs → 门禁/全部包构建/L7 → Pages | 最近成功发布40047212448，2026-10-24，0ecf0f29；master普通推送不触发，支持workflow_dispatch | 当前用户已授权更新站点，使用现有手动发布入口，不改触发策略；等待真实成功并核对线上内容 |

确认正常：当前Docs类型、157测试、SSG构建刚在H05单元通过。必修/本轮交付：入口与进展正文、完整更新历史、发布及线上可访问/实际Demo核验。另案：全库剩余契约审计、H04包体积、37格式警告/5信息与其他组件视觉，不能据发布标为全部完成。

工具边界：GitHub连接器没有workflow_dispatch及Pages发布状态读取能力，使用已授权仓库CLI；网页读取工具无法读取Pages，实际HTTP与Chrome核验另行执行。

## 验收标准

Docs内容生成/检查、类型、现有测试和生产SSG；生产Chrome打开首页进展入口、双语指南、更新日志及相关真实Image Demo，保留页面错误检查并核对移动/暗色布局。提交并推送后从同一确定提交触发现有Deploy Docs，核对Actions构建/部署结果以及线上指南、示例和更新日志。只把取得证据的结果标为已验证，失败记录原因，不以本地构建代替上线。

线上修前Chrome实测：changelog.html HTTP200，只有1条0ecf0f29提交，日期2026-10-24，进展入口0；`/tmp/apollo-docs-online-before.log`。新增指南后首次Docs测试156通过/1失败，唯一原因是旧测试写死7个指南（实际新增后8个）；保留精确数量断言改为8，并增加新指南slug/中英标题/order断言，不放宽为大于等于。原失败保留 `/tmp/apollo-docs-publication-test.log`，最终补跑另记。

## 本地统一验收

已实现：中英进展指南、首页可发现入口、日志中的进展入口/本站源码链接，以及发布checkout完整历史。原7指南数量断言按新增能力改为精确8，并断言新指南slug/中英标题/order；所有原测试保留。最终content:build/check、typecheck、14文件157条和SSG构建全部退出0。生产Chrome32检查通过：SSR正文、正常路由、中英文、实际Group删除/关闭焦点/重置、富缩略图编辑与预览、其余3个示例、完整日志、移动/暗色/无横向溢出及零错误。桌面与移动暗色截图已查看；主题切换须等实际样式与动画稳定，不以过渡中截图判断最终颜色。

根格式退出0（原37警告/5信息保留），Registry19检查0warning，diff检查通过。[持久化证据](evidence/docs-publication.json)记录修前线上、当前本地、源文件哈希与各命令。发布及上线核验仍待执行，不以本地通过冒充已上线。


## 发布与线上验收收口

已发布源码 `07dab65f80ea9eee22a8a71623406f0752f55868`。手动触发[Deploy Docs 40266130608](https://github.com/apollocmh/apollo-design-ui/actions/runs/40266130608)，构建文档站与发布Pages两个作业均success，Pages deployment 7323739146状态success；没有更改发布触发策略、打标签或发布npm。

线上Chrome150真实33项检查全部通过、零页面/控制台/Vue错误：普通首页入口与SSR指南HTTP200，中英文、手机/暗色且无横向溢出，实际Group删除/关闭焦点/重置、富缩略图编辑及预览、其余3个实际示例均可操作；日志不再只有一条历史提交，本站源码与最新日志均为07dab65f。桌面和手机暗色截图已查看。本地32项与线上33项分开保存在同一[证据](evidence/docs-publication.json)，新增一项为线上明确发布提交校验。

用户入口：[整改进展](https://apollocmh.github.io/apollo-design-ui/guide/audit-progress.html)、[Image](https://apollocmh.github.io/apollo-design-ui/components/image.html)、[更新日志](https://apollocmh.github.io/apollo-design-ui/changelog.html)。本单元已实现/已验证/已上线；全库审计、其他组件验收及原有质量债务保持各自状态，不以文档发布宣称全库完成。后续整改单元结果同步进展页。


## 后续发布：List阶段结果已可见

List实现里程碑已提交并推送 `23de152079c096fccf34d0f3907a8f649276de2b`。进度页同步99文件1788条关联回归、152条类型、55项生产浏览器证据；新增实际主题开关与整表摘要入口，明确List视觉矩阵/完整收口仍开放。对应 [List完整清单](2026-10-26-list-contract-audit.md)。

已从该提交手动触发 [Deploy Docs 40277408976](https://github.com/apollocmh/apollo-design-ui/actions/runs/40277408976)，两个作业均success，Pages deployment **7325258163** 于2026-10-26 06:07:05 UTC成功。CI内容/类型/157条Docs测试与全部包构建通过；L7实测151项，FAIL=0、PENDING=0，67项有架构依据n/a。这是构建/发布门禁，不代表全库运行回归或全部组件审计完成。

线上通用发布检查33项、List实际示例检查14项分别通过，均零页面/Vue错误，未累加为唯一场景数：SSR指南含本阶段数据；主题覆盖/移除/恢复保持行DOM，点赞更新整表extra；更新日志和可见构建源码都为23de1520。移动/暗色截图再次查看通过；Image原有分组删除/焦点与富缩略图交互仍通过。完整作业、Pages状态、线上实际值见 [本次发布证据](evidence/docs-publication-list-update.json)。

线上入口：[整改进展](https://apollocmh.github.io/apollo-design-ui/guide/audit-progress.html)、[List](https://apollocmh.github.io/apollo-design-ui/components/list.html)、[Image](https://apollocmh.github.io/apollo-design-ui/components/image.html)、[更新日志](https://apollocmh.github.io/apollo-design-ui/changelog.html)。后续里程碑继续同步本页和进度入口，不以后台提交数量代替可见交付。
