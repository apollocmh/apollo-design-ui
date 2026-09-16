import axe from 'axe-core';
import { describe, expect, it } from 'vitest';
import { createApp, defineComponent, h, type VNode } from 'vue';
import baseline from '../../../../tests/compat/baselines/icons.dom.json';
import { DEFAULT_ICON_PREFIX_CLS } from '../context';
import * as Icons from '../icons';
import { Icon, IconProvider } from '../index';

/**
 * L5 · 无障碍（`TESTING.md` §6）。
 *
 * ── 与 `TESTING.md` §6.1 的偏差，以及为什么 ───────────────────────────────────
 * §6.1 的形态是 `a11yDemoTest('<component>')` —— 遍历组件的 `demo/` 目录逐个跑 axe。
 * 本包不适用该形态，理由是**结构性的**，不是省事：
 *   1. `@apollo-design/icons` 是 L0 基础包，产出的是 848 个**生成物**，
 *      没有 `demo/` 目录（demo 是 `packages/ui` 组件的概念）；
 *   2. §6.1 依赖的 `@apollo-design/test-utils/a11y` 目前还是骨架（`export {}`），
 *      而 §7 要求 a11y 扫描器**必须复用、禁止各组件自写** —— 所以在 test-utils
 *      落地前，本包不自行造一个通用扫描器，只做本包特有的断言；
 *   3. 依赖按 catalog 的既有意图取 `axe-core`（catalog 的 Test 段里本来就有
 *      `axe-core` 与 `@axe-core/playwright`；`TESTING.md` 提到的 `vitest-axe`
 *      并不在 catalog 中，且已停止维护）。
 * **待 `test-utils` 落地后，本文件应改为调用 `a11yDemoTest`，或把这里的
 * 「分块全量扫描」抽成 `a11yIconTest` 供 ui 层复用。**
 *
 * ── 为什么是「分块扫描」而不是「一次扫 848 个」────────────────────────────────
 * axe 在 jsdom 下的耗时对节点数**超线性**（本机实测，同一份 DOM 结构）：
 *
 *   | 节点数 | 单次 axe.run 耗时 |
 *   | ---: | ---: |
 *   | 1 | 214ms |
 *   | 10 | 134ms |
 *   | 50 | 385ms |
 *   | 100 | 672ms |
 *   | 200 | 2 057ms |
 *   | 400 | 11 941ms |
 *   | 848 | 被 SIGTERM 杀掉（>500s / OOM） |
 *
 * 节点翻倍、耗时约 5.7 倍 —— 二次方量级。所以「一次扫完 848」不是慢，是**跑不完**。
 * 分块（每块 100）后总耗时 ≈ 9 × 0.7s ≈ 6s，而且是**全量覆盖**，不是抽样。
 * 这不是放宽标准：图标相关的 axe 规则（`role-img-alt`、`aria-allowed-attr`、
 * `svg-img-alt` 等）都是**逐节点**判定的，与同容器里还有多少别的节点无关；
 * 唯一与容器规模有关的是 `region` / `landmark-one-main` 这类文档级规则，
 * 而它们本来就不该按图标逐个判定。
 *
 * ── 这个测试没有证明什么 ─────────────────────────────────────────────────────
 *   - 没证明**对比度**：图标用 `fill="currentColor"`，实际颜色由消费方的文字色决定，
 *     在本包里无颜色可言。对比度按 §6.2 由 theme 层断言 Token，由 L6 断言渲染结果。
 *   - 没证明**焦点可见**（`:focus-visible` 的轮廓）：那是 CSS 的职责，本包只产出
 *     基础样式模板（`style.ts`），实际生效要看 ui 层的静态样式层。
 *   - 没证明 `spin` 状态对屏幕阅读器有反馈 —— 上游 antd **没有**提供
 *     `aria-live` / `aria-busy`（见文件末尾的「已知缺口」）。
 */

/** 与 `semantic.test.ts` 一致：给两侧同一个 prefixCls，避免类名被事后归一化掉。 */
const ANTICON = 'anticon';

/** 分块大小。取值依据见文件头注释里的耗时表。 */
const CHUNK = 100;

/** `Icon` 的 `component` 路径用：一个只画一个方块的自定义 svg 组件。 */
const CustomSvg = defineComponent({
  name: 'CustomSvg',
  setup(_props, { attrs }) {
    return () => h('svg', { ...attrs, 'data-custom': 'yes' }, [h('path', { d: 'M0 0h1v1H0z' })]);
  },
});

/**
 * 挂载 vnode 到 document.body，返回宿主元素。
 *
 * 必须是**已挂载**的节点：axe 扫描游离节点会得到空结果（那种「0 violation」
 * 是假的 —— 什么都没扫）。
 */
function mount(vnode: VNode): { host: HTMLElement; unmount: () => void } {
  const host = document.createElement('div');
  document.body.appendChild(host);
  const app = createApp({ render: () => vnode });
  app.mount(host);
  return {
    host,
    unmount: () => {
      app.unmount();
      host.remove();
    },
  };
}

const AXE_OPTIONS: axe.RunOptions = {
  runOnly: { type: 'tag', values: ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'] },
};

/** 跑一次扫描，返回 violation 的 `id(命中节点数)` 摘要（失败时直接可读）。 */
async function scan(element: Element): Promise<{ ids: string[]; passes: string[] }> {
  const results = await axe.run(element, AXE_OPTIONS);
  return {
    ids: results.violations.map((v) => `${v.id}(${v.nodes.length})`),
    passes: results.passes.map((p) => p.id),
  };
}

const withProvider = (render: () => VNode): VNode =>
  h(IconProvider, { value: { prefixCls: ANTICON } }, { default: render });

/** 按名字取生成物里的图标组件（`noUncheckedIndexedAccess` 下必须显式处理缺失）。 */
function iconByName(name: string): Parameters<typeof h>[0] {
  const component = (Icons as unknown as Record<string, unknown>)[name];
  if (component === null || (typeof component !== 'object' && typeof component !== 'function')) {
    throw new Error(`[a11y] 本包未导出图标 ${name}`);
  }
  return component as Parameters<typeof h>[0];
}

/**
 * 一次性挂载**全部** 848 个图标，返回宿主与卸载函数。
 *
 * ⚠️ 不要写成「循环 848 次、每次 mount 一个」。那样会创建 848 个 Vue app，
 * 在本环境里会直接被 SIGTERM 掉（实测 exit 137）。一个容器装完既快又等价 ——
 * 断言本来就是逐节点查 DOM，不依赖各自的 app 实例。
 */
function mountAll(names: readonly string[]): { host: HTMLElement; unmount: () => void } {
  return mount(
    withProvider(() =>
      h(
        'div',
        names.map((name) => h(iconByName(name))),
      ),
    ),
  );
}

// ---------------------------------------------------------------------------
// 6.1 自动扫描（axe-core）
// ---------------------------------------------------------------------------

describe('L5 · axe 自动扫描（WCAG 2.x A/AA）', () => {
  /**
   * 覆盖「会改变 DOM 语义面」的各种渲染形态。
   * 848 个图标本身由下面单独的一条分块扫描。
   */
  const SHAPES: Record<string, () => VNode> = {
    outlined: () => withProvider(() => h(Icons.HomeOutlined)),
    filled: () => withProvider(() => h(Icons.AccountBookFilled)),
    'twotone（默认双色）': () => withProvider(() => h(Icons.AccountBookTwoTone)),
    'twotone（显式双色）': () =>
      withProvider(() => h(Icons.AccountBookTwoTone, { twoToneColor: ['#f5222d', '#52c41a'] })),
    'loading（隐式 spin）': () => withProvider(() => h(Icons.LoadingOutlined)),
    spin: () => withProvider(() => h(Icons.HomeOutlined, { spin: true })),
    rotate: () => withProvider(() => h(Icons.HomeOutlined, { rotate: 90 })),
    'onClick（tabindex=-1）': () =>
      withProvider(() => h(Icons.HomeOutlined, { onClick: () => {} })),
    'tabIndex=0（可 Tab 进入）': () => withProvider(() => h(Icons.HomeOutlined, { tabIndex: 0 })),
    '自定义 class/style/attrs': () =>
      withProvider(() =>
        h(Icons.HomeOutlined, { class: 'my-cls', style: { color: 'red' }, 'data-x': '1' }),
      ),
    '覆盖 aria-label': () => withProvider(() => h(Icons.HomeOutlined, { 'aria-label': 'My home' })),
    // 基础 Icon 的正确用法：消费方**必须**自己给可访问名，否则 role=img 无名（见文件末尾的已知缺口）
    '基础 Icon + children（带 aria-label）': () =>
      withProvider(() =>
        h(
          Icon,
          { viewBox: '0 0 8 8', 'aria-label': 'square' },
          { default: () => h('path', { d: 'M0 0h1v1H0z' }) },
        ),
      ),
    '基础 Icon + component（带 aria-label）': () =>
      withProvider(() =>
        h(Icon, { component: CustomSvg, viewBox: '0 0 8 8', 'aria-label': 'square' }),
      ),
    // D17 的修复效果：`ariaLabel` prop 现在能真的产出可访问名（antd 会泄漏成 arialabel）
    '基础 Icon + ariaLabel prop（D17）': () =>
      withProvider(() =>
        h(
          Icon,
          { ariaLabel: 'square', viewBox: '0 0 8 8' },
          { default: () => h('path', { d: 'M0 0h1v1H0z' }) },
        ),
      ),
    自定义前缀: () =>
      h(IconProvider, { value: { prefixCls: 'custom' } }, { default: () => h(Icons.HomeOutlined) }),
    '默认前缀（apollo-icon）': () => h(Icons.HomeOutlined),
  };

  for (const [label, render] of Object.entries(SHAPES)) {
    it(`${label}：0 violation`, async () => {
      const { host, unmount } = mount(render());
      const { ids } = await scan(host);
      unmount();
      expect(ids).toEqual([]);
    });
  }

  it('扫描**有牙**：去掉可访问名后 axe 必须报出来', async () => {
    // 这条是防止「扫描恒过」的元测试。
    // 一个永远通过的 a11y 扫描比没有扫描更糟 —— 它会让人以为可达性已经被保障了。
    // 做法：手写一段与真实渲染**只差一个 aria-label** 的 DOM。
    const { host, unmount } = mount(
      h('span', { role: 'img', class: `${ANTICON} ${ANTICON}-home` }, [
        h('svg', { viewBox: '0 0 1 1', 'aria-hidden': 'true', focusable: 'false' }),
      ]),
    );
    const { ids } = await scan(host);
    unmount();

    // `role-img-alt` = 「role=img 的元素没有可访问名」。这正是我们靠 aria-label 满足的规则。
    expect(ids).toContain('role-img-alt(1)');
  });

  it('全部 848 个图标分块扫描：0 violation，且 axe 确实算出了可访问名', async () => {
    const names = Object.keys(baseline.all).sort();
    const failures: string[] = [];
    let sawRoleImgAltPass = false;

    for (let i = 0; i < names.length; i += CHUNK) {
      const chunk = names.slice(i, i + CHUNK);
      const { host, unmount } = mountAll(chunk);
      const rendered = host.querySelectorAll('[role="img"]').length;
      const { ids, passes } = await scan(host);
      unmount();

      if (rendered !== chunk.length) {
        failures.push(`第 ${i / CHUNK} 块只渲染出 ${rendered}/${chunk.length} 个图标`);
      }
      for (const id of ids) failures.push(`第 ${i / CHUNK} 块：${id}`);
      if (passes.includes('role-img-alt')) sawRoleImgAltPass = true;
    }

    expect(failures).toEqual([]);
    // 不是「没报错」，而是 axe **确实算出了**可访问名（`role-img-alt` 是它的 pass 项）。
    expect(sawRoleImgAltPass).toBe(true);
  }, 120_000);
});

// ---------------------------------------------------------------------------
// 6.2 键盘与焦点 / ARIA 状态（T13 中适用于图标的部分）
// ---------------------------------------------------------------------------

describe('L5 · 可访问名与语义（T13）', () => {
  const NAMES = Object.keys(baseline.all).sort();

  it('848 个图标全部有 role="img" 与非空 aria-label（可访问名的前提）', () => {
    const { host, unmount } = mountAll(NAMES);
    const failures: string[] = [];

    const nodes = host.querySelectorAll('span');
    expect(nodes).toHaveLength(NAMES.length);

    for (const node of nodes) {
      const label = node.getAttribute('aria-label') ?? '';
      if (node.getAttribute('role') !== 'img') {
        failures.push(`${node.className}: role 不是 img`);
      } else if (label.trim() === '') {
        failures.push(`${node.className}: aria-label 为空`);
      }
    }
    unmount();
    expect(failures).toEqual([]);
  });

  it('内层 svg 不进可达树（aria-hidden + focusable=false）', () => {
    const { host, unmount } = mount(withProvider(() => h(Icons.HomeOutlined)));
    const svg = host.querySelector('svg');

    expect(svg?.getAttribute('aria-hidden')).toBe('true');
    // `focusable="false"` 是给 IE/旧 Edge 的：SVG 元素默认可聚焦，会插进 Tab 序列。
    expect(svg?.getAttribute('focusable')).toBe('false');
    // 名字挂在 span 上，svg 上不该再有一个 —— 否则屏幕阅读器会读两遍。
    expect(svg?.hasAttribute('aria-label')).toBe(false);
    expect(svg?.hasAttribute('role')).toBe(false);
    unmount();
  });

  it('可访问名就是图标名（kebab-case），与 antd 一致', () => {
    const { host, unmount } = mount(withProvider(() => h(Icons.AccountBookTwoTone)));
    expect(host.querySelector('[role="img"]')?.getAttribute('aria-label')).toBe('account-book');
    unmount();
  });

  it('无 onClick 时不产生 tabindex（不打断 Tab 顺序）', () => {
    const { host, unmount } = mount(withProvider(() => h(Icons.HomeOutlined)));
    // 纯装饰性图标不该进 Tab 序列 —— 否则一个页面上 50 个图标要按 50 次 Tab。
    expect(host.firstElementChild?.hasAttribute('tabindex')).toBe(false);
    unmount();
  });

  it('有 onClick 时 tabindex=-1：可编程聚焦，但仍不进 Tab 序列', () => {
    const { host, unmount } = mount(
      withProvider(() => h(Icons.HomeOutlined, { onClick: () => {} })),
    );
    expect(host.firstElementChild?.getAttribute('tabindex')).toBe('-1');
    unmount();
  });

  it('显式 tabIndex=0 时进 Tab 序列（消费方显式要求）', () => {
    const { host, unmount } = mount(withProvider(() => h(Icons.HomeOutlined, { tabIndex: 0 })));
    expect(host.firstElementChild?.getAttribute('tabindex')).toBe('0');
    unmount();
  });

  it('D17：ariaLabel prop 产出合法的 aria-label，不泄漏成 arialabel', () => {
    const { host, unmount } = mount(withProvider(() => h(Icon, { ariaLabel: 'My home' })));
    const span = host.firstElementChild;

    expect(span?.getAttribute('aria-label')).toBe('My home');
    // antd 把 ariaLabel 原样透传，React 会警告 `Invalid ARIA attribute 'ariaLabel'`，
    // 最终 DOM 上是一个浏览器不认的 `arialabel` 属性 —— 屏幕阅读器读不到名字。
    // 我们有意不复刻这个缺陷（COMPATIBILITY.md 的 D17，DEFECT 类）。
    expect(span?.hasAttribute('arialabel')).toBe(false);
    unmount();
  });

  it('消费方覆盖 aria-label 时以消费方为准', () => {
    const { host, unmount } = mount(
      withProvider(() => h(Icons.HomeOutlined, { 'aria-label': 'Back to home' })),
    );
    expect(host.firstElementChild?.getAttribute('aria-label')).toBe('Back to home');
    unmount();
  });

  it('aria-hidden="false" 落在 span 上，内层 svg 仍保持 hidden', () => {
    const { host, unmount } = mount(
      withProvider(() => h(Icons.HomeOutlined, { 'aria-hidden': false })),
    );
    // 与 antd 一致：这个组合的语义有点怪（span 显式可见、svg 仍隐藏），
    // 但它是消费方显式要求的，且 antd 就是这么输出的。契约由 L4 的
    // `props:aria-hidden-false` 用例钉住，这里只断言可达性相关的那一半。
    expect(host.firstElementChild?.getAttribute('aria-hidden')).toBe('false');
    expect(host.querySelector('svg')?.getAttribute('aria-hidden')).toBe('true');
    unmount();
  });

  it('默认前缀下的类名不影响可达性（D14）', () => {
    const { host, unmount } = mount(h(Icons.HomeOutlined));
    const span = host.firstElementChild;
    expect(span?.className).toBe(`${DEFAULT_ICON_PREFIX_CLS} ${DEFAULT_ICON_PREFIX_CLS}-home`);
    expect(span?.getAttribute('role')).toBe('img');
    expect(span?.getAttribute('aria-label')).toBe('home');
    unmount();
  });
});

/**
 * 已知缺口（继承自 antd，**有意**不修，故在此显式登记而不是静默放过）。
 *
 * `LoadingOutlined` / `spin` 只加一个 `anticon-spin` 类，不产生任何
 * `aria-live` / `aria-busy` / `role="status"`。也就是说：
 * **屏幕阅读器完全感知不到「正在加载」这件事。**
 *
 * 为什么不在本包修：
 *   - 这是 antd 的行为（`@ant-design/icons` 6.3.4 的 `LoadingOutlined` 只有
 *     `spin: true`，没有任何 ARIA 输出）；
 *   - 图标的语义应由**消费方**决定：`Button` 的 loading 该给按钮自己挂
 *     `aria-busy`，`Table` 的 loading 该挂 `aria-live` 区域。图标层擅自加
 *     `role="status"` 会让「一个页面上 20 个 loading 图标」变成 20 个 live region，
 *     反而更糟；
 *   - `TESTING.md` §6.2 的「`loading` 状态有 `aria-live` 或等价反馈」这一行，
 *     落到图标层是**不可满足**的，须由 ui 层组件承担。
 *
 * 下面的测试把这个缺口**钉住**：若哪天有人给图标加了 aria-live，这里会红，
 * 逼他先来改这段说明 —— 而不是让一个未登记的行为差异悄悄溜进产物。
 */
describe('L5 · 已知缺口：spin 对屏幕阅读器无反馈（继承 antd）', () => {
  it('LoadingOutlined 不产生 aria-live / aria-busy / role=status', () => {
    const { host, unmount } = mount(withProvider(() => h(Icons.LoadingOutlined)));
    const span = host.firstElementChild;

    expect(span?.hasAttribute('aria-live')).toBe(false);
    expect(span?.hasAttribute('aria-busy')).toBe(false);
    expect(span?.getAttribute('role')).toBe('img');
    expect(span?.className).toContain('anticon-spin');
    unmount();
  });
});

/**
 * 第二个已知缺口：基础 `Icon` 走 `children` / `component`（自定义 SVG）时，
 * `<span role="img">` **没有可访问名**，axe 会报 `role-img-alt`。
 *
 * 这是**继承自 antd** 的，不是我们的实现缺陷 —— 证据是机械 oracle 的产物：
 *
 *   tests/compat/baselines/icons.dom.json  →  cases[id='icon:children']
 *   <span role="img" class="anticon"><svg …aria-hidden="true"…></svg></span>
 *                                              ↑ 没有 aria-label
 *
 * 也就是说 antd 6.3.4 在这里**自己就违反 WCAG 4.1.2**（Name, Role, Value）。
 *
 * 为什么不在本包修：这里没有「名字」可填。生成物（848 个）的名字来自
 * `IconDefinition.name`；而自定义 SVG 是一坨任意的 path，本包**无法推断**
 * 它是什么图标。硬填一个 `aria-label="icon"` 是比没有名字更糟的假信息 ——
 * 屏幕阅读器会念出一个无意义的词，而消费方会以为自己已经处理好了。
 *
 * 正确的落点在消费方：`<Icon aria-label="…">`，或（本项目新增能力）`ariaLabel` prop。
 * 上面 `SHAPES` 里的「带 aria-label」两条就是这条路径的**正向**验证 ——
 * 补上名字之后 0 violation，说明这个缺口是可修的，只是必须由知道语义的人来修。
 *
 * ⚠️ 待办：这条应当登记进 `COMPATIBILITY.md` §9.2（上游缺陷，我们**跟随**，
 * 因为"无名字"在语义上比"假名字"更诚实）。
 */
describe('L5 · 已知缺口：自定义 SVG 的 Icon 无可访问名（继承 antd）', () => {
  it('不带 aria-label 时 axe 报 role-img-alt（与 antd 基线一致）', async () => {
    const { host, unmount } = mount(
      withProvider(() =>
        h(Icon, { viewBox: '0 0 8 8' }, { default: () => h('path', { d: 'M0 0h1v1H0z' }) }),
      ),
    );
    const { ids } = await scan(host);
    unmount();

    expect(ids).toContain('role-img-alt(1)');
  });

  it('带上 aria-label 后不再报（缺口可由消费方闭合）', async () => {
    const { host, unmount } = mount(
      withProvider(() =>
        h(
          Icon,
          { viewBox: '0 0 8 8', 'aria-label': 'square' },
          { default: () => h('path', { d: 'M0 0h1v1H0z' }) },
        ),
      ),
    );
    const { ids } = await scan(host);
    unmount();

    expect(ids).toEqual([]);
  });

  it('antd 基线里的同一个用例同样没有 aria-label（缺口来源的证据）', () => {
    // 直接读机械 oracle 的产物，而不是"我记得 antd 是这样"。
    const upstream = baseline.cases.find((c) => c.id === 'icon:children');
    expect(upstream).toBeDefined();
    expect(upstream?.html).toContain('role="img"');
    expect(upstream?.html).not.toContain('aria-label');
  });
});
