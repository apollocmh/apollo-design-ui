# Image / Group 原生变换事件（2026-10-25）

预览扩展探针9条全失败中的两条确认：Image/Group实际rotateRight使img旋转90deg，但PreviewConfig.onTransform均未通知。其余7条renderer继续独立整改，不把声明当成已实现。正式顶层Vue契约11条修前9失败/2已有通过，另确认Group根DOM的同名CustomEvent会误入业务监听器，日志 `/tmp/apollo-image-transform-red.log`。

公开Image/Group和私有Preview均用typed transform emits；内部变换内核仅接稳定的emit桥，不缓存setup时监听器。移除PreviewConfig.onTransform，ImageProps/PreviewGroupProps的onTransform是标准Vue监听器注册；TransformInfo从根入口导出，无旧配置回退、双发或弃用通道。具体旧/新用法见 [迁移](../migrations/image-transform-event.md)。

首批11条修后通过，扩展15条通过：真实Portal/CSSMotion、rotate/flip实际变换和快照隔离、监听器数组/once/替换/移除/晚出现、关闭复位、拒绝关闭不复位、无预览不发事件、Group子图与根DOM隔离、两个真实SFC模板的精准TransformInfo推导。原状态类型测试按独立变换契约更新，其余状态断言全部保留。日志 `/tmp/apollo-image-transform-{green,extended}.log`。

## 检查

- Image/ConfigProvider四层22文件324条通过，类型12文件56条通过、无类型错误，根strict通过。日志 `/tmp/apollo-image-transform-{runtime-final,types,strict-final}.log`。新增Demo后局部a11y与文档的旧数量哨兵先真实失败，按实际16个Image Demo/1000全站Demo同步数量，并追加新Demo ID存在断言；没有删除旧断言或跳过测试。
- UI生产构建通过，含公开声明与69CSS；发布消费端复制真实Demo、浏览器fixture及精准SFC模板，vue-tsc通过，另验证根导出TransformInfo、两个入口监听器和旧配置/错误payload负例。L7复用本次产物11项0FAIL/0PENDING。日志 `/tmp/apollo-image-transform-{build,consumer-l7,consumer-final}.log`。
- Chrome150.0.7871.125生产transform脚本首次通过，零Vue/console/page错误；数组/once/当前替换、移除恢复、原img与缩略图身份、实际transform、拒绝650ms（覆盖500ms离场deadline）、接受后复位与真实Demo均验证。既有完整focus脚本也通过，包括两种多层卸载，日志 `/tmp/apollo-image-transform-{browser,focus-browser}.log`。
- 文档84路由构建通过，数量哨兵更新后14文件157条测试、typecheck和content:check通过；日志 `/tmp/apollo-image-transform-docs.log`（含初始数量失败）及 `/tmp/apollo-image-transform-docs-final.log`（复验通过）。Registry19项及内容清单生成/check通过，513行分类与裁决数不变；日志 `/tmp/apollo-image-transform-metadata.log`。
- Biome与git diff检查通过。`node tests/visual/apollo.mjs --check --component image`仍exit1：缺9张Apollo批准基线，见 `/tmp/apollo-image-transform-visual.log`，没有计为视觉通过。其余7条预览renderer及其他配置仍开放，不升级历史验收维度。

后续七条renderer已另迁原生预览槽，见 [后续报告](2026-10-25-image-preview-slots-remediation.md)；上面的门禁保留变换事件提交时的范围。
