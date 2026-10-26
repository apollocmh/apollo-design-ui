# Skeleton公共契约修正

适用于0.0.0开发版，按ADR0007直接修正妨碍Vue用法的根attrs/样式职责，不设兼容层或弃用期。原有组件名、静态子组件、loading无根分支、size="default"告警与两个既有废弃颜色Token保留。

## 独立子组件的class与style

Avatar/Button/Input/Node/Image的根`className`字段移除，使用原生`class`；原先被固定到内层的`style`改为Vue原生根style。需要内容尺寸/样式时使用已有`styles.content`，根语义仍可用`classNames.root/styles.root`。字符串、数组、对象style与普通原生attrs均落真实根，原生样式最后覆盖。

```vue
<!-- 原先style作用内层，className是根别名 -->
<SkeletonNode class-name="preview" :style="{ width: '160px', height: '120px' }" />
<!-- 当前：明确内容几何和根布局 -->
<SkeletonNode class="preview" style="margin-top:16px" :styles="{ content: { width: '160px', height: '120px' } }" />
```

`Skeleton`的avatar/title/paragraph是配置数据，配置中的`className/style`仍有独立意义；现在与对应语义配置合并，语义样式优先，不再静默丢弃。嵌套avatar是单个元素，删除从未消费的双层`classNames/styles`字段；原有主组件`classNames.avatar/styles.avatar`负责该落点。

## 槽、加载与可访问性

Image现在实际支持类型说明中的默认槽，完整节点和有意空槽优先；缺少槽时保留原SVG。Node的真实编辑器和业务内容保持可访问。

主Skeleton加载根拥有`aria-busy=true`，header/section装饰内容隐藏于可访问树，避免空标题暴露；原生role/名称等attrs可由调用者提供。`loading=false`仍直接渲染默认槽、没有根，因此根attrs不复制到业务内容，nativeElement为null；需要持久id/布局宿主时在外层包裹。loading切换会卸载正文，需保留的数据放在调用者响应状态中。

## 当前主题、动画及边界

六种形态都消费当前源主题和八Token，动态删除/恢复不重挂原生内容；现代gradient字段优先于既有color别名，再回退当前Alias。`styles.content`和原生CSS变量可覆盖对应目标。active遵守系统减少动画和源motion:false；RTL使用实际方向样式。

非有限长度忽略；非有限/负行数为空，有限正小数行数截断。全部原Demo保留，真实重复加载定时器在卸载时清理。当前实现、修前复现、统一验收与尚未验证的边界见[完整清单](../audit/2026-10-27-skeleton-contract-audit.md)。

Node/Image的内容使用正常Alias文本行高，不再将96px图形高度用作文字/输入框行高；默认占位宽高与flex居中保留。原生编辑器不再被撑到约100px，内容尺寸仍由styles.content明确配置。
