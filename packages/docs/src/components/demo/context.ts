/**
 * DemoContext —— 示例运行环境（从 DemoProvider.vue 拆出的纯 TS 模块；
 * `<script setup>` 里不允许 export，interface / InjectionKey 必须独立成文件）。
 */
import type { InjectionKey, Ref } from 'vue';

export interface DemoContext {
  /** 全站唯一实例 ID（`<component>-<demo>`）。 */
  instanceId: string;
  /** 方向。示例默认继承 html 的 dir。 */
  direction: 'ltr' | 'rtl';
  /** 重置计数：Renderer 拿它重建组件子树。 */
  resetToken: Ref<number>;
}

export const DEMO_CONTEXT_KEY: InjectionKey<DemoContext> = Symbol('demo-context');
