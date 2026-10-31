# Carousel 实现说明

当前契约见 [中文 API](./index.zh-CN.md) / [English API](./index.en-US.md)。保留既有轮播定位/切换公式、19场景原参考和有效状态、Demo、主题证据；旧上游同构与逐组件九维门禁不再控制实现。

本轮按四条根因整改：

- 所属通知为 typed beforeChange/afterChange/swipe/edge/keydown emits，自然 h() 与模板拼法一致。根 attrs/完整 style 正常落地；内层 styles.slider 独立，既有 className 内层别名保留。删除无消费 easing，缓动使用 cssEase。
- default内容原生归一，按用户 key 分别维护 pre/original/post 的无DOM Fragment身份。箭头槽作为既有原生 button 的完整内容，不截首VNode。实际可见范围决定 inert/aria-hidden，包含边界克隆和多张/unslick/fade。
- 原件ref归原件；实际原生VNode树内的id/for/ARIA关系有稳定克隆后缀，不改组件业务id或外部ID。clone中的组件内容槽交由Vue重新规范化上下文，实际调用一次后清返回ref，不预调用/缓存slot结果或沿用失效编译标记。
- 动态配置、结构和几何更新先收尾旧动画；焦点、内容/圆点悬停合并本实例暂停原因。原生键盘取消/输入法/编辑控件得到尊重，横纵拖拽载荷一次。ResizeObserver目标与延迟合并，卸载释放计时器和观察目标。八项当前Token真实消费，箭头sqrt2几何使用CSS长度计算，旧宽度别名接通。

原参考JSON不修改。DOM对照只保留原两个CSSOM零值差异，并精确登记新增根data属性；CSS值中的合法空格按当前TestUtils规则保留。原生焦点、inert、label/control、refs、动态布局和实际过渡由额外核心及真实浏览器回归覆盖，不靠旧投影漏项声称通过。

边界：clone是既有独立组件实例，不镜像任意内部未受控状态；没有重写为另一套轮播引擎。没有预调用插槽检查组件内部固定ID，也不宣称解决其隐藏内部结构。新增RawSlots私有桥只处理已复现的透传ref归属，公开类型不降级。最终全库九维/视觉/发布验收未逐组件重跑。

既有来源：[原分析](../../../../docs/analysis/carousel.md)、[原参考JSON](../../../../tests/compat/baselines/carousel.dom.json)。这些保留原义，不冒充当前版本的全库通过。
