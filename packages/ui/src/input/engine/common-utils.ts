/**
 * 引擎工具 —— `@rc-component/input` 的 `utils/commonUtils.js` 行为等价物（H5 自建）。
 *
 * 两条必须逐字保留的判据（registry 备注：输入法组合态不可简化）：
 *  1. `resolveOnChange` 会**克隆事件**：把 `target` / `currentTarget` 换成一个
 *     `cloneNode(true)` 的副本并写入裁剪后的值 —— 用户拿到的
 *     `e.target.value` 是**组件算出来的值**，不是 DOM 原值（上游 issue 45737 /
 *     46598）。这是「受控值被计数裁剪」能传达出去的唯一通道。
 *  2. clear 的 `click` 事件同样克隆，且 value 固定为 `''`（issue 31200）。
 */

/** 是否有 addon（前后置标签）⇒ 需要 group-wrapper + wrapper 两层包裹。 */
export function hasAddon(props: { addonBefore?: unknown; addonAfter?: unknown }): boolean {
  return !!(props.addonBefore || props.addonAfter);
}

/** 是否有 prefix / suffix / allowClear ⇒ 需要 affix-wrapper 包裹。 */
export function hasPrefixSuffix(props: {
  prefix?: unknown;
  suffix?: unknown;
  allowClear?: unknown;
  showCount?: unknown;
}): boolean {
  return !!(props.prefix || props.suffix || props.allowClear || props.showCount);
}

type MinimalEvent = Event & {
  type: string;
  target?: EventTarget | null;
  currentTarget?: EventTarget | null;
};

/**
 * 克隆一个事件的 `target` / `currentTarget`。
 *
 * ⚠️ 用 `cloneNode(true)` 而不是新建元素：input 的 `type=file` 等属性与表单
 * 关联状态需要保留（上游注释引了 WebKit bug 28123）。
 */
function cloneEvent(
  event: MinimalEvent,
  target: HTMLInputElement | HTMLTextAreaElement,
  value: string,
): MinimalEvent {
  const currentTarget = target.cloneNode(true) as HTMLInputElement | HTMLTextAreaElement;
  const newEvent = Object.create(event, {
    target: { value: currentTarget },
    currentTarget: { value: currentTarget },
    // ⚠️ `type` 必须落成**自有属性**（2026-10-04 transfer 收口发现）：jsdom 30 的
    //    IDL getter 对派生对象直接抛
    //    "TypeError: 'get type' called on an object that is not a valid instance of Event"
    //    —— 消费方（Transfer.Search 的 `e.type === 'click'` 判据）读 cloned 事件的
    //    `type` 会炸掉整条 onChange 链。在克隆时从真事件上取值即可（真事件是合法
    //    receiver），行为与上游「克隆事件等价原事件」的语义一致。
    type: { value: event.type },
  }) as MinimalEvent;

  currentTarget.value = value;

  // 部分类型（如 email）不支持 selection —— 上游 issue 47833
  if (typeof target.selectionStart === 'number' && typeof target.selectionEnd === 'number') {
    currentTarget.selectionStart = target.selectionStart;
    currentTarget.selectionEnd = target.selectionEnd;
  }
  currentTarget.setSelectionRange = (
    ...args: [number, number, 'forward' | 'backward' | 'none']
  ) => {
    target.setSelectionRange(...args);
  };
  return newEvent;
}

/** 触发 onChange，必要时换成克隆事件（rc 的 `resolveOnChange`）。 */
export function resolveOnChange(
  target: HTMLInputElement | HTMLTextAreaElement,
  event: MinimalEvent,
  onChange?: (e: unknown) => void,
  targetValue?: string,
): void {
  if (!onChange) {
    return;
  }
  const nextEvent: MinimalEvent = event;
  if (event.type === 'click') {
    // 点击 clear：把值改成 '' 再交给用户
    onChange(cloneEvent(event, target, ''));
    return;
  }
  // 组合态触发的 change 需要强制写入最终值
  if (target.type !== 'file' && targetValue !== undefined) {
    onChange(cloneEvent(event, target, targetValue));
    return;
  }
  onChange(nextEvent);
}
