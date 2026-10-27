/** Finite differences from the untouched reference. Native browser/SSR tests replace
 * invisible-first-render and noninteractive overflow assumptions; see avatar-contracts.md. */
const visible = (path: string) => `${path}: style 不同 [opacity:0] vs [transform:scale(1)]`;
const entry = (diff: string[]) => ({
  deviationId: 'avatar-native-vue-contracts',
  reason:
    'Visible SSR text, current text Token and owned native overflow button; exact native replacements are verified by contract-audit and browser tests.',
  diff,
});
const text = visible('$/span[0]/span[0]');
const overflow = [
  visible('$/div[0]/span[0]/span[0]'),
  '$/div[0]/span[1]: 标签不同 <span> vs <button>',
  '$/div[0]/span[1]: 类名不同 [apollo-avatar apollo-avatar-circle] vs [apollo-avatar-group-overflow]',
  '$/div[0]/span[1]/span[0]: 类名不同 [apollo-avatar-string] vs [apollo-avatar apollo-avatar-circle]',
  '$/div[0]/span[1]/span[0]: style 不同 [opacity:0] vs []',
  '$/div[0]/span[1]/span[0]: 子节点数不同 0 vs 1',
];
export const avatarContractDifferences = {
  ...Object.fromEntries(
    [
      'avatar:basic',
      'avatar:prefix-cls:custom',
      'avatar:empty',
      'avatar:shape-square',
      'avatar:shape-circle',
      'avatar:size-large',
      'avatar:size-small',
      'avatar:size-medium',
      'avatar:size-responsive',
      'avatar:className',
      'avatar:attrs',
    ].map((id) => [id, entry([text])]),
  ),
  'avatar:prefix-cls:no-props': entry([
    '$/span[0]: 类名不同 [ant-avatar ant-avatar-circle] vs [apollo-avatar apollo-avatar-circle]',
    '$/span[0]/span[0]: 类名不同 [ant-avatar-string] vs [apollo-avatar-string]',
    text,
  ]),
  ...Object.fromEntries(
    ['avatar:size-number', 'avatar:size-number-square'].map((id) => [
      id,
      entry([
        '$/span[0]: style 不同 [font-size:18px;height:40px;width:40px] vs [height:40px;width:40px]',
        text,
      ]),
    ]),
  ),
  'avatar:style': entry([
    '$/span[0]: style 不同 [background-color:#fde3cf;color:#f56a00] vs [background-color:rgb(253,227,207);color:rgb(245,106,0)]',
    text,
  ]),
  ...Object.fromEntries(
    ['avatar:group', 'avatar:group-max-no-truncate'].map((id) => [
      id,
      entry([0, 1, 2].map((i) => visible(`$/div[0]/span[${i}]/span[0]`))),
    ]),
  ),
  ...Object.fromEntries(
    ['avatar:group-size-shape', 'avatar:group-className'].map((id) => [
      id,
      entry([0, 1].map((i) => visible(`$/div[0]/span[${i}]/span[0]`))),
    ]),
  ),
  'avatar:group-rtl': entry([
    visible('$/div[0]/span[0]/span[0]'),
    visible('$/div[0]/span[1]/span[0]'),
  ]),
  'avatar:group-max': entry(overflow),
  // The old alias input is now represented by max.count; the original reference scenario remains.
  'avatar:group-max-count-deprecated': entry(overflow),
  'avatar:group-max-style': entry([
    visible('$/div[0]/span[0]/span[0]'),
    '$/div[0]/span[1]: 标签不同 <span> vs <button>',
    '$/div[0]/span[1]: 类名不同 [apollo-avatar apollo-avatar-circle] vs [apollo-avatar-group-overflow]',
    '$/div[0]/span[1]: style 不同 [color:#f56a00] vs []',
    '$/div[0]/span[1]/span[0]: 类名不同 [apollo-avatar-string] vs [apollo-avatar apollo-avatar-circle]',
    '$/div[0]/span[1]/span[0]: style 不同 [opacity:0] vs [color:rgb(245,106,0)]',
    '$/div[0]/span[1]/span[0]: 子节点数不同 0 vs 1',
  ]),
  ...Object.fromEntries(
    [
      'avatar:src-string',
      'avatar:src-string-attrs',
      'avatar:src-and-icon',
      'avatar:draggable-string',
    ].map((id) => [
      id,
      {
        deviationId: 'D115',
        reason:
          'React SSR inserts an image preload sibling; this framework runtime optimization is not Avatar content.',
        diff: ['$: 根节点数不同 2 vs 1'],
      },
    ]),
  ),
};
