# v0.1.9 文档站与 Demo 打磨

本次按 [Issue #86](https://github.com/apollocmh/apollo-design-ui/issues/86) 和 [#87](https://github.com/apollocmh/apollo-design-ui/issues/87) 检查全站，不限于 Issue 列出的例子。用户随后要求加快收口，因此复用有效结果，只补改动、失败和缺口，不重复整套浏览矩阵；最终发布仍核对同一冻结提交的完整 CI。

## 覆盖与交付

| 分工 | 组件 / Demo | 主要交付 |
| --- | --- | --- |
| General | 21 / 241 | Divider、Typography、Grid、Layout、Affix、Anchor、Menu、FloatButton 等控件、间距、主题与交互 |
| Controls | 12 / 196 | 输入和选择控件、窄画布、弹层动作、配色与 Segmented 键盘可见性 |
| Data | 19 / 296 | 表单和数据展示、Card 图片、Table 筛选/删除、Tabs 增删、Transfer、说明修正 |
| Feedback | 20 / 276 | 反馈和浮层、Result 操作间距、通知上下文、日期单元格、Carousel、图片组 |
| Site | 全站公共页面 | 三栏目导航、上下文侧栏、目录、瀑布流、iframe、主题展示、深锚点及窄屏布局 |

[逐 Demo 证据](evidence/issue-86-demo-review.json) 精确覆盖 72 个组件、1,009 个唯一 Demo，保留源码哈希、实际浏览范围、交互、修复和例外。[站点证据](evidence/issue-86-site-review.json) 保留页面与公共交互检查。分组范围来自本轮唯一状态，不建立另一套任务调度状态。

## 视觉与根因

对照 Ant Design 官方 Layout / FloatButton 页面及本地参考源码后，分别定位原因：两列空白来自共享行高；Menu 配色来自组件局部硬编码；部分主题问题来自示例的浅背景与暗前景组合；窄屏裁切来自固定尺寸、Grid 负边距和画布跨度。没有统一修改组件默认间距或把所有差异归因于 Token。

Demo 使用适当的 Apollo 控件，运行和展示源码仍来自同一 `.vue` 与辅助文件。两列独立堆叠并保留 DOM、焦点和实例；展开源码、动态内容、单列切换与深链接均有针对性验证。Layout 使用隔离 iframe 与 Mac 窗口壳。文档一级导航为文档、组件、图标；旧 URL、部署 base、API 与 Demo 锚点保留。

Material 品牌种子改为 `#0073E6`，暗色状态继续由算法派生。`/guide/themes` 集中展示三套主题的亮暗 3×2 真实组件，并提供明显的文档导航入口。

回顶异常复现为 CSS smooth 与逐帧 JS 动画叠加，公共滚动工具改为每帧立即定位；Window / Document / Element、取消和立即到顶均有真实浏览器回归。FloatButton 闪现在当前静态版本的首次加载、刷新、跨页导航与亮暗组合中未复现；记录稳定性采样，不虚构私有组件根因。

最后定向复核还定位到减少动效的全局规则：正的 `0.01ms` transition-duration 让原本没有过渡的定位坐标开始动画，浮层测量因此读到屏外旧位置。改为 `0s` 后，Cascader / Select / TreeSelect 的亮暗窄屏定位均稳定；库内定位算法未改。

## 保留边界

- 原生事件、可编辑子树、自定义 ARIA、SVG 指示器等专门演示保留原生元素。
- Flex / Grid 零间距、Space Compact 接边、固定列数对比保留其演示含义。
- 必须保持水平结构的示例使用可访问的局部滚动；Tooltip / Popover shift 的大画布隔离在 iframe 内。
- 初期 HMR 中断、探针定位及采样错误保留为历史诊断，使用定向补证收口，没有改成产品通过或降低阈值。

## 验证与发布

已执行相关组件回归、Docs 类型与内容检查、真实浏览器和截图核对。首次严格类型检查发现的样式对象错误已修复，针对性类型复核通过；完整类型、覆盖率、产物、消费者、1875 项正式视觉及完整 Docs 门禁由最终冻结 CI 给出。未更新视觉基线。

本文件记录交付与针对性证据，不代替最终验收报告。发布提交、tag、CI、部署及线上核实结果由同 SHA 的执行证据补记；未执行的验收不能视为通过。
