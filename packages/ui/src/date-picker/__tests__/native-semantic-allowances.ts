import { type DomBaselineCase, type DomContractOptions, diffHtml } from '@apollo-design/test-utils';

/** Exact closed-trigger ARIA additions, derived only from the original reference fixture. */
export function nativeTriggerAllowances(
  cases: readonly DomBaselineCase[],
): DomContractOptions['allow'] {
  return Object.fromEntries(
    cases.map(({ id, html }) => {
      const reference = document.createElement('div');
      reference.innerHTML = html;
      for (const input of reference.querySelectorAll('.apollo-picker-input > input')) {
        input.setAttribute('role', 'combobox');
        input.setAttribute('aria-haspopup', 'dialog');
        input.setAttribute('aria-expanded', 'false');
      }
      return [
        id,
        {
          reason:
            'Apollo native input/popup keyboard contract: each closed input is a combobox with a dialog popup and aria-expanded=false. The original trigger structure, static decorations and all other ARIA remain compared.',
          diff: diffHtml(html, reference.innerHTML, { keepStyle: false }),
        },
      ];
    }),
  );
}
