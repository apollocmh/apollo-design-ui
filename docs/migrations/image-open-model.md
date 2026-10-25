# Image 预览开合使用Vue模型

当前0.0.0开发版直接迁移，无旧配置回退、兼容层或弃用期。Image既有v-model:open文档承诺现在落实；PreviewGroup采用同名状态入口，并保留v-model:current。

```vue
<!-- 旧配置 -->
<Image :preview="{ open, onOpenChange: next => open = next }" />
<!-- 当前Vue模型 -->
<Image v-model:open="open" :preview="{ maskClosable: true }" @open-change="handleOpen" />
<ImagePreviewGroup v-model:open="groupOpen" v-model:current="current" @change="handleCurrent">
  <Image src="/first.png" alt="First photo" />
  <Image src="/second.png" alt="Second photo" />
</ImagePreviewGroup>
<Image :default-open="true" src="/photo.png" alt="Photo" />
```

PreviewConfig/GroupPreviewConfig移除open/defaultOpen/onOpenChange/visible/onVisibleChange。状态改用顶层open/defaultOpen和Vue事件；Group原onChange函数prop改typed change通知，h()中的onChange仍是标准Vue监听器注册。afterOpenChange/onTransform及内容、手势等非状态配置保持原职责。

open省略（undefined）时使用内态，defaultOpen只初始化一次。存在open时由父级控制，拒绝更新保持原值；移除控制接续最后同步值。父prop变更不回发模型请求，预览禁用期间的交互不排队打开请求。

交互先捕获有效prevOpen，再按是否受控更新内态，依次通知openChange(next,prev)和update:open(next)。Group change(current,prevCurrent)与update:current(current)保持数字payload和原有顺序。请求通知不等于动画完成；afterOpenChange可观察后者。

两对真实控制Demo、调用者及类型负例同步迁移，见 [报告](../audit/2026-10-25-image-open-model-remediation.md)。
