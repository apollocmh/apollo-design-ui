export async function run({ assert, page, check, mount, patch, snapshot, first, ssr, axePath }) {
  const families = ['Input', 'TextArea', 'InputPassword', 'InputSearch', 'InputOTP', 'InputGroup'];
  const key = {
    Input: 'input',
    TextArea: 'textArea',
    InputPassword: 'inputPassword',
    InputSearch: 'inputSearch',
    InputOTP: 'otp',
    InputGroup: 'input',
  };
  for (const family of families) {
    await check(
      'provider.' + family + '.prefix-direction',
      'Current Provider prefix/direction reach corresponding nodes and keep the editor mounted.',
      [family + '.Provider/form/Compact state'],
      async () => {
        await mount(family, { provider: { prefixCls: 'audit', direction: 'rtl' } });
        await page.evaluate(() => window.audit.hold());
        let s = await snapshot();
        assert.ok(s.html.includes('audit-'));
        assert.ok(s.html.includes('-rtl'));
        s = await patch({ provider: { prefixCls: 'next', direction: 'ltr' } });
        assert.ok(s.html.includes('next-'));
        assert.equal((await page.evaluate(() => window.audit.identity())).same, true);
        return s;
      },
    );
    await check(
      'hydration.' + family,
      'SSR/hydration retains actual controls and updates current state.',
      [family + '.SSR and multi-instance'],
      async () => {
        const props =
          family === 'InputOTP'
            ? { defaultValue: '1234', length: 4, 'aria-label': 'SSR code' }
            : family === 'InputGroup'
              ? {}
              : { defaultValue: 'server-value', 'aria-label': 'SSR field' };
        const html = await ssr(family, props);
        const actual = await page.evaluate(
          ([family, props, html]) => window.audit.hydrateDirect(family, props, html),
          [family, props, html],
        );
        assert.equal(actual.retained, true);
        if (family === 'InputOTP') assert.equal(actual.updated.join(''), '5678');
        else if (family !== 'InputGroup') assert.deepEqual(actual.updated, ['hydrated-update']);
        return actual;
      },
    );
  }
  for (const family of ['Input', 'TextArea', 'InputPassword', 'InputSearch', 'InputOTP'])
    await check(
      'provider.' + family + '.component-style',
      'Named component Provider className/style/semantic config are consumed and update without a prop change.',
      [family + '.Provider/form/Compact state', family + '.semantic class/style callbacks'],
      async () => {
        const part = family === 'TextArea' ? 'textarea' : 'input';
        await mount(family, {
          provider: {
            components: {
              [key[family]]: {
                className: 'from-provider',
                style: { marginTop: '7px' },
                styles: { [part]: { letterSpacing: '2px' } },
              },
            },
          },
        });
        const s = await snapshot();
        assert.ok(s.html.includes('from-provider'));
        assert.equal(s.controls[0].letterSpacing, '2px');
        const state = await page.evaluate(async (key) => {
          window.audit.state().provider.components[key].className = 'provider-updated';
          window.audit.state().provider.components[key].styles =
            key === 'textArea'
              ? { textarea: { letterSpacing: '3px' } }
              : { input: { letterSpacing: '3px' } };
          await window.audit.settle();
          return window.audit.snapshot();
        }, key[family]);
        assert.ok(state.html.includes('provider-updated'));
        assert.equal(state.controls[0].letterSpacing, '3px');
        return state;
      },
    );
  for (const family of ['Input', 'TextArea', 'InputPassword', 'InputSearch', 'InputOTP'])
    await check(
      'semantic.' + family + '.provider-state',
      'Semantic context reflects effective disabled/form state and public fields, not only outer runtime keys.',
      [family + '.semantic class/style callbacks'],
      async () => {
        const s = await mount(family, {
            provider: { componentDisabled: true },
            form: { status: 'error' },
            flags: { semanticSpy: true },
          }),
          props = s.callbacks.at(-1).props;
        assert.equal(s.controls[0].disabled, true);
        assert.equal(props.disabled, true);
        assert.equal(props.status, 'error');
        return { props, control: s.controls[0] };
      },
    );
  await check(
    'password.locale-current',
    'Password labels follow the current Provider language after a reactive locale update.',
    ['InputPassword.Provider/form/Compact state'],
    async () => {
      await mount('InputPassword', {
        provider: {
          locale: { locale: 'first', global: { show: 'Reveal first', hide: 'Hide first' } },
        },
      });
      assert.equal(await page.locator('[aria-pressed]').getAttribute('aria-label'), 'Reveal first');
      await patch({
        provider: {
          locale: { locale: 'next', global: { show: 'Reveal next', hide: 'Hide next' } },
        },
      });
      const label = await page.locator('[aria-pressed]').getAttribute('aria-label');
      assert.equal(label, 'Reveal next');
      return label;
    },
  );
  await check(
    'otp.direction-visual',
    'RTL keyboard arrows follow the actual visible row direction.',
    ['InputOTP.keyboard and IME', 'InputOTP.Provider/form/Compact state'],
    async () => {
      await mount('InputOTP', {
        props: { length: 4, defaultValue: '1234', dir: 'rtl' },
        provider: { direction: 'rtl' },
      });
      const inputs = page.locator('#app input');
      await inputs.nth(1).focus();
      await inputs.nth(1).press('ArrowRight');
      const active = await inputs.evaluateAll((nodes) =>
        nodes.findIndex((node) => node === document.activeElement),
      );
      assert.equal(active, 0);
      return active;
    },
  );
  await check(
    'clear.all-empty-values',
    'Explicit null/false/zero clear icon data suppress fallback instead of being selected by truthiness.',
    ['Input.prop.clearIcon', 'Input.prop.allowClear'],
    async () => {
      const observations = [];
      for (const value of [null, false, 0]) {
        await mount('Input', {
          props: { allowClear: { clearIcon: value }, defaultValue: 'value' },
        });
        const target = page.locator('.apollo-input-clear-icon'),
          text = await target.textContent(),
          svg = await target.locator('svg').count();
        observations.push({ value, text, svg });
        assert.equal(text, value === 0 ? '0' : '');
        assert.equal(svg, 0);
      }
      return observations;
    },
  );
  for (const family of families)
    await check(
      'direction.' + family + '.actual-native',
      'Default-prefix Provider direction changes actual rendered direction, independent of custom-prefix CSS policy.',
      [family + '.Provider/form/Compact state'],
      async () => {
        await mount(family, { provider: { direction: 'rtl' } });
        let direction = await first().evaluate((node) => getComputedStyle(node).direction);
        assert.equal(direction, 'rtl');
        await patch({ provider: { direction: 'ltr' } });
        direction = await first().evaluate((node) => getComputedStyle(node).direction);
        assert.equal(direction, 'ltr');
        return direction;
      },
    );
  await page.addScriptTag({ path: axePath });
  for (const family of [
    'Input',
    'TextArea',
    'InputPassword',
    'InputSearch',
    'InputOTP',
    'InputGroup',
  ])
    await check(
      'a11y.' + family + '.representative',
      'Representative real controls have valid names and actionable targets with their current CSS.',
      [family + '.native attrs and listener modifiers', family + '.keyboard and IME'],
      async () => {
        await mount(family, {
          props:
            family === 'InputOTP'
              ? { length: 4, defaultValue: '12' }
              : { defaultValue: 'value', ...(family === 'InputGroup' ? {} : { allowClear: true }) },
        });
        const violations = await page.locator('#app').evaluate(async (node) =>
          (
            await window.axe.run(node, {
              runOnly: {
                type: 'tag',
                values: ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'],
              },
            })
          ).violations.map((v) => ({
            id: v.id,
            nodes: v.nodes.map((n) => ({ target: n.target, summary: n.failureSummary })),
          })),
        );
        assert.deepEqual(violations, []);
        return violations;
      },
    );
}
