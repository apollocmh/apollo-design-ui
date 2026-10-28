# 主题来源与空作用域统一整改

范围：ThemeContext 的来源识别、ThemeProvider / ConfigProvider 提供链、UI 实际 Alias 下传路径，以及关联 Portal/样式消费。完整 UI API、主题色板算法、config 可写性及可选 document CSS 注入生命周期不在本窄单元宣称完成；发现的独立缺陷仍登记为本轮基础包必修。

先盘点再修改：只读来源报告及32项真实源码复现见 `/tmp/apollo-theme-source-presence-review.md` / `.json`；完整102文件分类、24条writer逐项路径与非writer判别已保存为 [来源清单](evidence/theme-source-inventory.json)，明确标为修前盘点而非最终源码冻结。初始22个空配置判据与1个Layout presence变体已逐项跟踪；补盘844个UI运行文件中的102个实际主题导入，确认24条Alias writer（含Flex）、ConfigProvider通道、6条Context数据路径，以及默认算法/样式函数、命名和数学用途。24条writer按21条稳定消费路径与Input、Alert、Layout三个在审单元分组整改，不能只据字符串命中修改。只读快照保留26个核心/guard文件SHA与1084加载源模块，不冒称并行主树冻结。

本轮必修：显式空ThemeProvider的数据已恢复默认值，CSS仍继承外层主题；只按context存在判断又会覆盖没有theme的ConfigProvider内合法stylesheet；更近空ThemeProvider被较远ConfigContext.theme越过。普通ConfigProvider theme={}继续按已有inherit语义继承，不以修复改变该行为。无来源CSS-only作用域必须继续有效。

统一方案：ThemeContext增加可选只读来源标识sourceActive（不是ComponentToken或业务Prop）。显式factory/ThemeProvider为活跃来源；无Provider的默认context只在真实配置被赋值时活跃；ConfigProvider根据有效mergedTheme而动态变化。自定义提供且未带标识的上下文属于显式来源。消费者据来源状态下传，不能用config键数或仅context是否存在推断。ConfigProvider选择最近活跃ThemeContext，再使用原合并规则，避免较远ConfigContext覆盖中间作用域。不改变config的可写性、现有组件事件或业务API。

验收：先成组建立红灯，覆盖无来源/显式空/非空/移除/嵌套/ConfigProvider inherit与inherit=false、CSS-only包无theme Provider、自定义context、SSR/多实例/Portal。逐项核对实际Alias与对应字号/间距/颜色/几何，不以变量存在或类型通过替代；全部写入路径及共享消费者适用回归后统一构建验证。17/72及现有759视觉是已接受阶段，不能据此假称新来源边界已通过。全库最终同提交门禁继续独立开放。

当前状态：producer已实现；8条新增unit修前0通过/8失败，修后连同原Vue绑定共15/15通过。数据读取链另有2条真实红灯：useThemeConfig曾越过最近ThemeProvider读取较远ConfigContext；修正后ConfigProvider相关用例与Theme Vue绑定合计100/100通过（实际exit 0）。命令及分阶段SHA见 `evidence/theme-source-producers-stage.json`。完整Alias writer补盘完成，消费端迁移正在并行；发布构建、全部关联消费及视觉仍未统一验收，不据producer或reader绿灯宣称共享单元完成。


共享集成阶段实际执行72个测试文件，1966/1966、exit 0，原始结果 `/tmp/apollo-theme-input-related-green.json/.log`。其中Space旧断言把“挂载的ThemeProvider配置清空”误作“无来源”，按已接受的显式默认来源契约修正；双节点paddingXS/colorBorder默认值、自定义恢复与无theme ConfigProvider不写Alias负控均保留，专属28/28通过。没有删除场景、放宽断言或改变阈值。

随后全24路径只读复核发现Flex直接inject与Layout额外provided判据会截断无Provider fallback由空→非空→空的已接受来源状态；已在同组补失败复现并整改。此前1966不覆盖这两处后续源码，必须以补修后的专项及发布验证收口，不能冒称最终全库门禁。ThemeProvider注入开关、target、prefix动态生命周期与injectCssVar=true SSR列为基础包本轮必修待审，未用本窄单元替它们销账。

消费实现里程碑：21条稳定writer已按同一来源规则修正，保留8处undefined/13处空对象返回。Flex统一读取useTheme；Layout的额外presence截断已在627d8a09修复。专项writer112项与六家族fallback启用/更新/清除6项合计118/118、exit 0。生产与测试逐项SHA见 [消费端阶段证据](evidence/theme-source-consumers-stage.json)。浏览器harness与最终发布验收仍开放；主工作树dist没有重建，接下来只在独立工作树构建Theme及UI。
