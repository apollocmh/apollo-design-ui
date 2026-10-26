# 文档示例的主题状态与Vue上下文

本单元由Statistic最终浏览器验收发现，**当前完整清单已统一验收，最终发布核验待本次提交**。盘点基线633c219b；UI实现/36图已验证，范围只扩展到共享Demo运行环境的主题链路，不修改组件库主题架构。

## 实施前完整清单

| 链路 | 当前行为与分类 |
|---|---|
| theme mode / localStorage / CSS / meta | light/dark/system写html与meta有效；useResolvedTheme只读取非响应的matchMedia，system变化会使派生值滞后。必修：媒体偏好成为响应状态，CSS与派生值共用当前解析结果；保留存储键与三种模式 |
| Standalone theme query | setup直接写html，无对应Vue source theme，也不处理同组件query变化或离开清理。必修：临时覆盖进入统一主题状态，query优先但不写永久偏好，离开恢复 |
| DemoProvider | 唯一instanceId prop，默认槽，内部reset/context，locale当前、direction挂载读取；只提供locale/direction，无theme，CSS暗色与JS默认浅色冲突。必修：挂载后桥接同一已解析主题，SSR首帧保持默认，切换不重建原生输入。instanceId/context/reset非本轮主题功能，不扩展其私有未消费通道 |
| DemoFrame | iframe地址消费useResolvedTheme，语种/实例ID/base/消息来源/高度清理保留；SSR不能知道本地偏好。必修：首次水合按服务器默认主题，挂载后跟随真实解析值，系统变更同步；保留隔离页面URL变更的既有重载边界，不新建消息协议 |
| styles / locale / attrs / Provider | 不新建样式体系，复用库darkAlgorithm；原生实例不因主题变化重挂，语言/方向/作用域隔离和模板默认槽保留，未新增公共业务事件或model |
| 共享消费者 | DemoPreview内联和DemoStandalone两调用者；所有示例共享环境。先跑Docs类型/全部测试/SSG，再验证命名的Image/List/Spin/QRCode/Statistic源Token示例与原生编辑器，扩大到全部组件代表页的亮/暗浏览器渲染；只按实测范围报告 |

实际修前证据：独立QRCode以外的Statistic Token Demo在?theme=dark下html已dark、背景rgb(20,20,20)，前景仍rgba(0,0,0,.88)，真实axe对比度1.09/1.12。见/tmp/apollo-docs-demo-theme-before.json。不能以源码Demo在正确Provider下28组合通过代替文档宿主验证。

验收覆盖light/dark/system和媒体变化、query覆盖/清除/卸载、SSR/水合、内联输入值/焦点、明暗反复切换、多实例及相关消费者；不把iframe跨文档导航的输入保留当作本轮新增能力。保留原断言，不屏蔽对比度或水合警告。最终发布前从确定提交构建并线上核对源码与实际示例。

## 成组修复与最终核对

上述六条链路全部核对：系统媒体偏好进入响应状态，解析结果同时驱动CSS/meta与Vue源主题；独立页面的query变更即时更新临时覆盖，离开时清除，不改保存的偏好。DemoProvider在挂载后桥接darkAlgorithm，原生输入不重挂；DemoFrame服务器和客户端首帧都使用light地址，挂载后更新为真实偏好，避免生产水合只告警却不修复src。原语言、方向、实例、消息来源/高度和监听清理保持原职责。

修前3条行为回归失败；另用旧DemoFrame和正确locale Provider独立复现iframe的light/dark水合属性警告。修后4条回归全部通过，覆盖原生编辑器身份/值/焦点、system媒体更新、SSR水合节点与src、临时覆盖不持久化及清除恢复。最初水合夹具遗漏locale Provider，修正后只保留实际src警告证据；临时旧源码夹具已删除。

共享源主题生效后，实际暗色浏览器检查发现List浅蓝/浅黄头尾和QRCode浅绿遮罩仍继承浅色前景，均为本轮实际Demo缺陷。List通过已有header/footer原生槽配对文字颜色，QRCode使用已声明的cover语义样式；删除无效的List styles尝试，不扩展公共API。背景Token/原场景保留，未屏蔽axe或降低阈值。Statistic三个Demo的配色由其完整单元记录。

最终实际Chrome150验证：五个命名Token消费者×亮/暗10项axe全部通过；离开临时query、内联dark/light/dark、系统light/dark/light再各一项，共13项通过。72组件各一个现有代表Demo×亮/暗144次全部非空渲染，无DemoRenderer错误、页面/Vue错误或资源诊断。该144次只证明代表页宿主/模块可运行，不等同全部1004个Demo完整交互或axe验收。

Docs完整15文件161条、Docs严格类型、根严格类型和静态构建通过；72组件/1004Demo/8指南内容生成与校验通过。精确命令、修前数据、修后13+144条逐项结果及源码哈希见[结构化证据](evidence/docs-demo-theme.json)。后续进度文案在发布CI从最终提交重建；上线后的源码标记、实际示例和截图另写[发布回执](2026-10-26-docs-publication.md)。

本单元无未裁决或受阻缺陷。内联组件同树主题变更保留原生编辑器；iframe地址变化仍按既有行为跨文档导航重载。未增加主题消息协议、持久化query或私有context/reset能力，未声称其他浏览器、所有嵌套主题或全库最终门禁已验收。
