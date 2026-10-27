# Empty

Vue 原生空状态组件。具体契约见[中文 API](./index.zh-CN.md)及[英文 API](./index.en-US.md)。

六个 Props、image/description/default 三个完整插槽、四个语义宿主与唯一 nativeElement ref。根 attrs 走实际 div；当前 Provider、方向、语言和源主题保持响应性。插槽在当前 render 中各求值一次，空内容不创建有间距的宿主，业务子级保持状态和焦点。

Empty 没有 Component Token；布局使用 Alias Token，插画颜色从当前 useToken 派生。媒体尺寸和透明度只约束内置插画与 URL 图片。静态 CSS 默认只含 apollo，其他根前缀使用公开 genComponentCss。

两个公共插画值是 markRaw 组件定义；生成几何及许可来源保留于 components/artwork.ts，维护入口为 registry/tools/gen-empty-artwork.mjs。历史 React DOM 记录是参考证据，具体差异由测试精确登记，不能替代 Apollo 契约。

本轮范围、复现、验收与剩余边界见[完整审计清单](../../../../docs/audit/2026-10-27-empty-contract-audit.md)。整改期间不能用旧 completed 状态或局部测试通过宣称全库验收。
