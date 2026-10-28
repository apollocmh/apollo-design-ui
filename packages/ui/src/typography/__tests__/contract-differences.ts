/** Finite reviewed differences from the retained 76-case reference. No baseline is rewritten. */
export const TYPOGRAPHY_NATIVE_DIFFERENCES = {
  'link:default': {
    reason:
      'ADR0007：Link 由 span 根拥有样式与 ref，原生 a 独立承载导航，避免 copy/edit 控件嵌套。实际 href/rel/事件及原生键盘行为另有明确断言。',
    deviationId: 'D-typography-native-controls',
    diff: ['$/a[0]: 标签不同 <a> vs <span>', '$/a[0]: 子节点数不同 0 vs 1'],
  },
  'link:type-danger': {
    reason:
      'ADR0007：Link 由 span 根拥有样式与 ref，原生 a 独立承载导航，避免 copy/edit 控件嵌套。实际 href/rel/事件及原生键盘行为另有明确断言。',
    deviationId: 'D-typography-native-controls',
    diff: ['$/a[0]: 标签不同 <a> vs <span>', '$/a[0]: 子节点数不同 0 vs 1'],
  },
  'link:target-blank': {
    reason:
      'ADR0007：Link 由 span 根拥有样式与 ref，原生 a 独立承载导航，避免 copy/edit 控件嵌套。实际 href/rel/事件及原生键盘行为另有明确断言。',
    deviationId: 'D-typography-native-controls',
    diff: ['$/a[0]: 标签不同 <a> vs <span>', '$/a[0]: 子节点数不同 0 vs 1'],
  },
  'link:rel-explicit': {
    reason:
      'ADR0007：Link 由 span 根拥有样式与 ref，原生 a 独立承载导航，避免 copy/edit 控件嵌套。实际 href/rel/事件及原生键盘行为另有明确断言。',
    deviationId: 'D-typography-native-controls',
    diff: ['$/a[0]: 标签不同 <a> vs <span>', '$/a[0]: 子节点数不同 0 vs 1'],
  },
  'link:rel-empty': {
    reason:
      'ADR0007：Link 由 span 根拥有样式与 ref，原生 a 独立承载导航，避免 copy/edit 控件嵌套。实际 href/rel/事件及原生键盘行为另有明确断言。',
    deviationId: 'D-typography-native-controls',
    diff: ['$/a[0]: 标签不同 <a> vs <span>', '$/a[0]: 子节点数不同 0 vs 1'],
  },
  'link:underline': {
    reason:
      'ADR0007：Link 由 span 根拥有样式与 ref，原生 a 独立承载导航，避免 copy/edit 控件嵌套。实际 href/rel/事件及原生键盘行为另有明确断言。',
    deviationId: 'D-typography-native-controls',
    diff: [
      '$/a[0]: 标签不同 <a> vs <span>',
      '$/a[0]/u[0]: 标签不同 <u> vs <a>',
      '$/a[0]/u[0]: 类名不同 [] vs [apollo-link-content]',
      '$/a[0]/u[0]: 子节点数不同 0 vs 1',
    ],
  },
  'copyable:true': {
    reason:
      '默认图标位于已有可访问名称的原生按钮内，设 aria-hidden；编辑图标去掉第二个 button 角色，避免重复交互语义。',
    deviationId: 'D-typography-native-controls',
    diff: ['$/span[0]/span[0]/button[0]/span[0]: 我们多出属性 aria-hidden="true"'],
  },
  'copyable:icon-false': {
    reason:
      '默认图标位于已有可访问名称的原生按钮内，设 aria-hidden；编辑图标去掉第二个 button 角色，避免重复交互语义。',
    deviationId: 'D-typography-native-controls',
    diff: ['$/span[0]/span[0]/button[0]/span[0]: 我们多出属性 aria-hidden="true"'],
  },
  'copyable:tooltips-false': {
    reason:
      '默认图标位于已有可访问名称的原生按钮内，设 aria-hidden；编辑图标去掉第二个 button 角色，避免重复交互语义。',
    deviationId: 'D-typography-native-controls',
    diff: ['$/span[0]/span[0]/button[0]/span[0]: 我们多出属性 aria-hidden="true"'],
  },
  'copyable:no-content': {
    reason:
      '默认图标位于已有可访问名称的原生按钮内，设 aria-hidden；编辑图标去掉第二个 button 角色，避免重复交互语义。',
    deviationId: 'D-typography-native-controls',
    diff: ['$/span[0]/span[0]/button[0]/span[0]: 我们多出属性 aria-hidden="true"'],
  },
  'editable:true': {
    reason:
      '默认图标位于已有可访问名称的原生按钮内，设 aria-hidden；编辑图标去掉第二个 button 角色，避免重复交互语义。',
    deviationId: 'D-typography-native-controls',
    diff: [
      '$/span[0]/span[0]/button[0]/span[0]: 属性 role 不同 "button" vs "img"',
      '$/span[0]/span[0]/button[0]/span[0]: 我们多出属性 aria-hidden="true"',
    ],
  },
  'editable:trigger-icon': {
    reason:
      '默认图标位于已有可访问名称的原生按钮内，设 aria-hidden；编辑图标去掉第二个 button 角色，避免重复交互语义。',
    deviationId: 'D-typography-native-controls',
    diff: [
      '$/span[0]/span[0]/button[0]/span[0]: 属性 role 不同 "button" vs "img"',
      '$/span[0]/span[0]/button[0]/span[0]: 我们多出属性 aria-hidden="true"',
    ],
  },
  'editable:trigger-text': {
    reason:
      'ADR0007：text 触发编辑仍需原生键盘入口，增加仅聚焦可见的编辑按钮；浏览器验证 Tab/Enter。',
    deviationId: 'D-typography-native-controls',
    diff: ['$/span[0]: 子节点数不同 0 vs 1'],
  },
  'editable:tab-index': {
    reason:
      '默认图标位于已有可访问名称的原生按钮内，设 aria-hidden；编辑图标去掉第二个 button 角色，避免重复交互语义。',
    deviationId: 'D-typography-native-controls',
    diff: [
      '$/span[0]/span[0]/button[0]/span[0]: 属性 role 不同 "button" vs "img"',
      '$/span[0]/span[0]/button[0]/span[0]: 我们多出属性 aria-hidden="true"',
    ],
  },
  'actions:placement-start': {
    reason:
      '默认图标位于已有可访问名称的原生按钮内，设 aria-hidden；编辑图标去掉第二个 button 角色，避免重复交互语义。',
    deviationId: 'D-typography-native-controls',
    diff: ['$/span[0]/span[0]/button[0]/span[0]: 我们多出属性 aria-hidden="true"'],
  },
  'actions:placement-end': {
    reason:
      '默认图标位于已有可访问名称的原生按钮内，设 aria-hidden；编辑图标去掉第二个 button 角色，避免重复交互语义。',
    deviationId: 'D-typography-native-controls',
    diff: ['$/span[0]/span[0]/button[0]/span[0]: 我们多出属性 aria-hidden="true"'],
  },
  'semantic:classNames-all': {
    reason:
      '默认图标位于已有可访问名称的原生按钮内，设 aria-hidden；编辑图标去掉第二个 button 角色，避免重复交互语义。',
    deviationId: 'D-typography-native-controls',
    diff: ['$/span[0]/span[0]/button[0]/span[0]: 我们多出属性 aria-hidden="true"'],
  },
  'semantic:styles-all': {
    reason:
      '默认图标位于已有可访问名称的原生按钮内，设 aria-hidden；编辑图标去掉第二个 button 角色，避免重复交互语义。',
    deviationId: 'D-typography-native-controls',
    diff: ['$/span[0]/span[0]/button[0]/span[0]: 我们多出属性 aria-hidden="true"'],
  },
  'composite:family': {
    reason:
      'ADR0007：Link 由 span 根拥有样式与 ref，原生 a 独立承载导航，避免 copy/edit 控件嵌套。实际 href/rel/事件及原生键盘行为另有明确断言。',
    deviationId: 'D-typography-native-controls',
    diff: ['$/a[3]: 标签不同 <a> vs <span>', '$/a[3]: 子节点数不同 0 vs 1'],
  },
} as const;
