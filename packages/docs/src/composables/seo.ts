/**
 * SEO 元数据（title / description / canonical / hreflang）。
 * vite-ssg 内置 unhead（SSR 渲染 <head>，客户端接管后续切换）。
 */
import { computed, type Ref } from 'vue';
import { useHead } from '@unhead/vue';
import { useRoute } from 'vue-router';

const SITE_NAME = 'Apollo Design';
const ORIGIN = 'https://apollocmh.github.io';
const BASE = '/apollo-design-ui';

export function useSeo(title: Ref<string>, description: Ref<string>): void {
  const route = useRoute();
  useHead(() => {
    const path = route.path === '/' ? '' : route.path;
    const full = `${ORIGIN}${BASE}${path}`;
    return {
      title: title.value ? `${title.value} - ${SITE_NAME}` : SITE_NAME,
      meta: [{ name: 'description', content: description.value }],
      link: [
        { rel: 'canonical', href: full },
        { rel: 'alternate', hreflang: 'zh-CN', href: `${full}?lang=zh-CN` },
        { rel: 'alternate', hreflang: 'en-US', href: `${full}?lang=en-US` },
      ],
      htmlAttrs: { lang: route.query.lang === 'en-US' ? 'en-US' : 'zh-CN' },
    };
  });
}
