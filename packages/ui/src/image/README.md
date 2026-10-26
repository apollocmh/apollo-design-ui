# Image

Vue 3原生图片、进度占位和模态预览。公开入口为Image、ImagePreviewGroup和具有同一精确类型的Image.PreviewGroup；发布运行时不依赖React或rc引擎。具体契约见[中文API](index.zh-CN.md)、[English API](index.en-US.md)和[集中迁移](../../../../docs/migrations/image-contracts.md)。

## 当前结构

- Image.ts：真实img资源状态、缩略图内容/封面、原生事件和单图模型。
- PreviewGroup.ts、context.ts：显式items或子图注册、当前项与组级预览。
- Preview.ts：共享预览、变换操作、拖动及所属文档的模态生命周期。
- Progress.ts：水彩背景、进度及合法VNode数据renderer。
- hooks/useStatus.ts、useImageTransform.ts、useImageOpen.ts、useImageTheme.ts、useImageMotion.ts：真实资源、当前变换边界、两入口共同开合模型、源主题与动效偏好。
- style/：静态CSS与组件Token，不生成运行时组件样式。

## Vue公共用法

开合使用顶层v-model:open/defaultOpen，Group另有current/defaultCurrent。移除控制接续最近同步值；外部prop更新不回声通知。click/error/keydown、openChange/update:open、transform及组级change/update:current均已声明精确emits，支持Vue监听器数组、替换和.once；无效preview内状态/通知通道已直接移除。

内容使用imageRender、previewImage、previewActions、previewCloseIcon，Group另有previewCount。作用域为具名对象；originNode保留真实VNode、ref和图像事件。当前render读取条件插槽，存在但空时不恢复默认，移除后恢复。有效的cover/closeIcon VNode数据、progress.render及afterOpenChange业务回调保留，不因函数名称重复迁移。

普通缩略图根为预览按钮。imageRender或VNode封面允许交互内容，使用group根与独立可见的原生预览按钮；originNode保持普通img，可放在调用者的原生控件中。输入、按钮、label、编辑内容及已取消事件保留原生行为，不要求.stop/preview=false；图片及非交互封面仍可点击预览，说明文字可选择。富内容根高度自然展开，height仍作用于实际图片。根class/style仍在根；img使用styles.image，内部区域使用classNames/styles。Progress仅通知原生click/keydown，不打开预览；含自定义percent renderer时，进度ARIA独立于可交互内容。

完全替换originNode的非空内容保留独立可见的原生预览动作，空槽不补按钮；不以隐藏控件维持旧树形态。焦点记忆按每层保存，移除下层不覆盖上层编辑器。

## 状态、Provider与样式

加载/错误/fallback由实际img和Vue ref驱动，SSR不创建浏览器Image；失败候选不覆盖fallback，换源恢复候选。分组注册保持次序并完整携带图像属性/尺寸/fallback；空组不打开空预览，无控索引在当前列表内归一。

源Vue主题跨Teleport消费当前alias与全部7个Image Token：zIndexPopup、previewOperationColor、previewOperationHoverColor、previewOperationColorDisabled、previewOperationSize、progressAnimationDuration、imagePreviewSwitchSize。默认操作18px、组切换40px、动画3s、默认z-index1080；组件配置、暗/紧凑算法及移除均响应。原生style优先级保留，ConfigProvider主题作用域切换保留原子树。DOM前缀响应不等于运行时生成任意前缀CSS，D04策略仍独立追踪。

预览锁定所属body滚动及焦点直到退场结束，mask=false仍为模态；实际HTMLElement容器支持iframe，Provider的既有类型支持已知ShadowRoot。Preview内部inline路径另有覆盖，不额外扩展Image.getContainer的公开函数签名。Escape使用所属窗口层栈/IME保护，子控件preventDefault优先；方向键避开编辑器、修饰键和组合输入。关闭/卸载归还实际触发焦点；reduced-motion、motion=false及零过渡按当前值生效。未声明的触摸双指缩放另案处理。

## 验收状态

完整Image整改单元仍开放，当前证据、对应提交、命令和未验证边界只在[统一清单](../../../../docs/audit/2026-10-25-image-contract-audit.md)维护。每个根因里程碑提交不表示Image或全库完成。上游历史截图与旧completed记录不是当前Apollo验收；自有视觉基线、组合回归和最终门禁须真实执行。原实现来源分析保留在git历史与docs/history，Ant Design是参考证据，不定义Apollo当前规格。
