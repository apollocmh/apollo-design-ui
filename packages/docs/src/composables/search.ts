/**
 * 站内搜索：对构建期索引做客户端匹配。
 *
 * 策略（首期够用且可测）：大小写不敏感的子串 + 词首匹配打分，
 * 中文名 / 英文名 / 副标题权重最高，demo 标题次之，描述再次。
 */
import { computed, ref } from 'vue';
import { loadSearchIndex } from './manifest';
import { useSiteLocale } from './locale';
import type { SearchDocument, SearchDocType } from '../types/manifest';

export interface SearchResult extends SearchDocument {
  score: number;
}

/**
 * 索引是构建期产物，字段理论上是 string；但搜索面板是全站入口，
 * 一条脏记录不该让整个弹窗渲染崩溃 —— 取值一律过 safeText()。
 *
 * 单独导出是为了能被测试直接钉住（见 tests/search.test.ts 的脏数据回归）。
 */
export function safeText(v: unknown): string {
  return typeof v === 'string' ? v : '';
}

const index = ref<SearchDocument[] | null>(null);
const query = ref('');
const loading = ref(false);
let loadPromise: Promise<void> | null = null;

export function useSearch() {
  const { locale } = useSiteLocale();

  async function ensureIndex(): Promise<void> {
    if (index.value || loading.value) return;
    loading.value = true;
    loadPromise ??= loadSearchIndex()
      .then((docs) => {
        index.value = docs;
      })
      .finally(() => {
        loading.value = false;
      });
    await loadPromise;
  }

  /** 打分匹配：0 = 不匹配。 */
  function score(doc: SearchDocument, q: string, lang: 'zh-CN' | 'en-US'): number {
    const key = lang === 'zh-CN' ? 'zh' : 'en';
    const otherKey = lang === 'zh-CN' ? 'en' : 'zh';
    const primary = safeText(doc.title?.[key]).toLowerCase();
    const secondary = safeText(doc.title?.[otherKey]).toLowerCase();
    const subtitle = safeText(doc.subtitle?.[key]).toLowerCase();
    const body = safeText(doc.text?.[key]).toLowerCase();
    let s = 0;
    if (primary.startsWith(q)) s += 100;
    else if (primary.includes(q)) s += 60;
    if (secondary.includes(q)) s += 40;
    if (subtitle.includes(q)) s += 30;
    if (body.includes(q)) s += 10;
    return s;
  }

  const results = computed<SearchResult[]>(() => {
    const q = query.value.trim().toLowerCase();
    if (!q || !index.value) return [];
    const lang = locale.value;
    return index.value
      .map((doc) => ({ ...doc, score: score(doc, q, lang) }))
      .filter((doc) => doc.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, 24);
  });

  /** 分组（保持 组件 → 示例 → 指南 的展示顺序）。 */
  const grouped = computed(() => {
    const order: SearchDocType[] = ['component', 'demo', 'guide'];
    return order
      .map((type) => ({ type, items: results.value.filter((r) => r.type === type) }))
      .filter((g) => g.items.length > 0);
  });

  return { query, results, grouped, ensureIndex, loading, open: ensureIndex };
}
