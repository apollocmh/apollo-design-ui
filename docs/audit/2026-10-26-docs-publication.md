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

## 后续发布：List完整验收已上线

已发布源码 `c5c92e1b297324dfb5bb344e0d4bcfdc527cf96b`，包含实现5336ff77与57张List视觉批准/完整清单收口。采用既有手动入口的 [Deploy Docs 40294762494](https://github.com/apollocmh/apollo-design-ui/actions/runs/40294762494) 两个作业均success；Pages deployment **7327707725**成功。CI的14文件157条Docs测试、全部包构建和L7共151项通过，FAIL=0/PENDING=0、n/a=67。

线上Chrome150通用33项通过，源码标记与日志均为c5c92e1b；独立脚本逐页打开全部12个List实际Demo和Spin全屏Demo，共13页通过、零Vue/页面错误。全屏计时开关保留原生编辑器身份、值和正文位置，覆盖层几何/关闭inert正确。SSR进度指南实际包含List完整清单收口、57张、512条与下一单元Spin完整盘点。手机暗色截图已再次查看，无横向溢出；原有Image真实交互保持通过。

本次 [持久化发布证据](evidence/docs-publication-list-closure.json) 分开记录Actions、Pages、线上33检查、13实际Demo与未验范围，不把重叠场景累加为唯一检查数。当前站点已展示List收口和后续边界；Spin完整审计及最终同一提交全库门禁继续开放。

## 后续发布：Spin实现阶段已上线

已发布源码57ab2894，[Deploy Docs 40311992155](https://github.com/apollocmh/apollo-design-ui/actions/runs/40311992155)和Pages deployment 7330236837成功（2026-10-26 11:07:58 UTC）。CI文档14文件157条、全部包构建及L7 151项通过，FAIL=0/PENDING=0、n/a=67。线上33项发布检查全部通过；另逐页核对10个Spin Demo，四个原生SVG/42%作用域、四Token动态开关保留输入、auto进度三组交互通过。既有独立Demo采用GitHub Pages的404.html SPA回退，明确记录主文档404；其他资源、页面及Vue错误为零。桌面/移动暗色首页截图已查看。

[发布与线上证据](evidence/docs-publication-spin-update.json)只对应实现阶段57ab2894。后续afaea916补齐减少动画过渡，并完成45张自有视觉与统一清单；该最终结果的源码推送与文档内容更新不等于已上线，须以随后部署回执为准。

## 后续发布：Spin完整验收已上线

已发布源码8abe0f97，包含45张清洁afaea916自有视觉批准、完整清单收口与进展页更新。[Deploy Docs 40315960707](https://github.com/apollocmh/apollo-design-ui/actions/runs/40315960707)两个作业和Pages deployment 7330838740成功（2026-10-26 11:37:22 UTC）。CI的14文件157条Docs测试、全部包构建和L7 151项通过，FAIL=0/PENDING=0、n/a=67。

线上33项发布检查、10个Spin Demo及3组交互全部通过。SSR进展指南HTTP200，实际包含Spin完整清单已验收、45张和7组水合；可见源码与日志为8abe0f97。补查确认新版Spin减少动画规则已加载，旋转paused；Docs既有site.css全局!important将过渡统一为0.01ms，精确断言该宿主值通过，独立库水合验证仍为0s。两种环境分开记录，没有修改生产CSS或放宽阈值。

[最终上线证据](evidence/docs-publication-spin-closure.json)记录Actions、Pages状态、真实页面/交互和CSS实际值。当前[进展页](https://apollocmh.github.io/apollo-design-ui/guide/audit-progress.html)已展示Image、List与Spin验收结果；全库剩余单元及最终同一提交门禁保持开放。


## 后续发布：QRCode完整验收已上线

已发布源码ac6f40e0，包含集中实现f4b82b4d及36张清洁提交自有视觉批准/完整清单收口。[Deploy Docs 40355255877](https://github.com/apollocmh/apollo-design-ui/actions/runs/40355255877)两个作业及Pages deployment7336984824成功（2026-10-26T16:08:58Z）。CI的14文件157条Docs测试、全部包构建、L7共151项通过，FAIL=0/PENDING=0、n/a=67。

线上Chrome150通用33项通过，可见源码与更新日志为ac6f40e0；单独打开全部5个实际QRCode Demo及2组交互通过，重复刷新会再次到期，条件/空槽和Token移除恢复保留原生输入。五个独立Demo沿用既有Pages 404.html SPA回退，明确记录主文档404，其余页面/Vue错误为零。SSR进度指南HTTP200，已验收/36张0像素差异/201个待复核候选及全库仍开放均逐项核对；桌面/移动暗色首页截图已查看。

[本次发布证据](evidence/docs-publication-qrcode-closure.json)分开记录33项发布检查与7项示例验证，不累加成唯一用例数。系统curl的LibreSSL连接失败后改用已成功的真实Chrome读取SSR正文，没有将网络工具错误归为站点缺陷。后续继续其他组件与基础包审计，最终同一提交全库门禁仍开放。


## 后续发布：Statistic完整验收与共享Demo主题已上线

已发布源码c6fff66e，包含实现111fa024/633c219b、36张清洁提交自有视觉批准/完整清单收口，以及39d94dd4的Docs源主题同步与水合修复。[Deploy Docs 40382135401](https://github.com/apollocmh/apollo-design-ui/actions/runs/40382135401)两个作业及Pages deployment7340908562成功。CI的15文件161条Docs测试、全部包构建和L7 151项通过，FAIL=0/PENDING=0、n/a=67，共86个HTML页面。

线上Chrome150通用33项通过，可见源码与更新日志为c6fff66e；全部七个Statistic实际Demo逐页axe及两组交互通过，重复到期、方向切换、Token删除恢复和键盘Slider保留原生编辑器。共享主题线上13项通过，涵盖Image/List/Spin/QRCode/Statistic五个Token消费者明暗、query离开恢复、内联/系统偏好切换时的原生值与焦点。SSR指南八条精确结论通过，包含Statistic已验收/36图0差异/28主题组合/199候选与全库仍开放；桌面、手机暗色首页截图已查看。

独立Demo沿用Pages的404.html SPA导航回退。Statistic七个导航URL及共享主题十个URL分别记录，共享主题十一条资源诊断全部属于这些明确导航；无额外资源、页面或Vue错误。72组件代表页×亮暗144次渲染已在本地通过，线上没有重复声明这144次完整验证。各范围分开记录于[最终发布证据](evidence/docs-publication-statistic-closure.json)，不相加为唯一用例数。当前[进展页](https://apollocmh.github.io/apollo-design-ui/guide/audit-progress.html)、[Statistic](https://apollocmh.github.io/apollo-design-ui/components/statistic.html)和[更新日志](https://apollocmh.github.io/apollo-design-ui/changelog.html)已更新；Skeleton等剩余单元及最终同一提交全库门禁继续推进。
