# Image / Group 当前全局弹层语义（2026-10-25）

Image已合并全局popup样式，却把props.styles.popup传给Preview，导致全局样式丢失；Group只合并局部classNames且直接传局部styles，全局弹层两路均未消费。正式18条修前14失败/4已有通过，日志 `/tmp/apollo-image-popup-provider-red.log`；四条已有通过均为Image类名对照。

Image改为使用既有mergedStyles.popup，Group补typed当前Provider类名/样式getter及既有schema合并，删除“Provider尚不提供配置”的过期注释和三处不必要断言。没有修改共享Provider/合并工具或公开API形态。类名按Provider/局部拼接；popup样式保持按字段浅合并，局部root覆盖整个Provider root对象，其他字段保留。原生class/style只留实际根。

局部18条通过，日志 `/tmp/apollo-image-popup-provider-{green,typed-green}.log`。覆盖六个弹层节点的初值/字段替换/整image或map替换/晚出现/移除/深修改、局部覆盖与根attrs隔离，以及打开时dialog/img/编辑器、草稿、焦点和90deg旋转保持。测试数据按公开Components映射的对象形态构造，未用断言或any处理类型诊断。

新增popup-provider实际Demo展示Image/Group与预览工具栏内的空→A→B→移除操作，原有16个Demo不改。API双语同时修正“schema未实现”的陈旧说明，并明确popup字段浅覆盖边界。

## 检查

完整运行24文件363条、类型14文件62条与根strict通过；UI声明/69CSS构建通过。生产Chrome150.0.7871.125脚本首次通过，零Vue/console/page错误，验证六个节点的实际inline/computed样式、配置替换/移除、局部覆盖、根隔离、原DOM/编辑器/焦点/选区/旋转及实际Demo。日志 `/tmp/apollo-image-popup-provider-{runtime-final,types,strict-final,build,browser}.log`。

旧thumbnail Provider完整browser也通过，未改变普通图/Progress覆盖边界，见 `/tmp/apollo-image-popup-provider-thumbnail-regression.log`。发布消费端复制真实Demo/fixture，严格vue-tsc通过；L7复用本次产物11项0FAIL/0PENDING，见 `/tmp/apollo-image-popup-provider-consumer-l7.log`。

文档84路由/1001 Demo构建、14文件157测试、typecheck与content:check通过；新增Demo计数与ID断言同步，旧断言保留。Registry19项与内容清单生成/check通过，518行/202待核裁决数不变。日志 `/tmp/apollo-image-popup-provider-{docs,metadata}.log`。Biome/diff检查通过。

视觉检查 `/tmp/apollo-image-popup-provider-visual.log`实际exit1：仍缺9张Apollo批准基线。没有复制参考图、升级历史视觉/完成维度，其他预览配置仍独立开放。
