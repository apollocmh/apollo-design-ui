export async function run({ assert, page, check, mount, patch, snapshot, first, settle }) {
  await check(
    'control.baseline',
    'Uncontrolled input writes model and change, retains actual field.',
    ['Input.prop.defaultValue', 'Input.v-model'],
    async () => {
      await mount('Input', { props: { defaultValue: 'start' } });
      await first().fill('draft');
      const s = await snapshot();
      assert.equal(s.controls[0].value, 'draft');
      assert.equal(s.records.filter((x) => x.name === 'update').at(-1).value, 'draft');
      return s;
    },
  );
  await check(
    'slots.sfc.empty',
    'An intentional empty suffix slot suppresses suffix prop.',
    ['Input.Slots', 'Input.prop.suffix'],
    async () => {
      const s = await mount('Input', { flags: { sfcSlots: true, slotEnabled: false } });
      assert.equal(s.text.includes('prop-suffix'), false);
      return s;
    },
  );
  await check(
    'slots.sfc.dynamic',
    'A conditional template prefix appears without a prop change.',
    ['Input.Slots', 'Input.prop.prefix'],
    async () => {
      await mount('Input', { flags: { sfcSlots: true, slotEnabled: false } });
      const s = await patch({ flags: { slotEnabled: true, slotLabel: 'active' } });
      assert.equal(s.text.includes('active'), true);
      return s;
    },
  );
  for (const family of ['Input', 'TextArea', 'InputPassword', 'InputSearch']) {
    await check(
      'identity.' + family + '.affix',
      'Changing existing affix/count structure retains editor identity, draft, focus and selection. group: native host identity.',
      [family + '.state identity and lifecycle', family + '.prop.allowClear'],
      async () => {
        await mount(family, {
          props: {
            defaultValue: 'start',
            ...(family === 'InputPassword' ? { visibilityToggle: false } : {}),
          },
        });
        await first().fill('saved draft');
        await first().focus();
        await first().evaluate((node) => node.setSelectionRange(2, 6));
        await page.evaluate(() => window.audit.hold());
        await patch({ props: { allowClear: true } });
        const id = await page.evaluate(() => window.audit.identity());
        assert.deepEqual(id, {
          same: true,
          focused: true,
          value: 'saved draft',
          selectionStart: 2,
          selectionEnd: 6,
        });
        return id;
      },
    );
    await check(
      'events.' + family + '.native',
      'Change receives a usable native DOM Event.',
      ['' + family + '.Emits', family + '.prop.onChange'],
      async () => {
        await mount(family, { flags: { eventMethods: true } });
        await first().fill('native');
        const s = await snapshot(),
          event = s.records.find((item) => item.name === 'change').value;
        assert.equal(event.preventDefault, 'ok');
        assert.equal(event.bubbles, true);
        assert.equal(event.targetOwned, true);
        return event;
      },
    );
    await check(
      'events.' + family + '.change-once',
      'Vue change.once runs once for semantic input changes.',
      ['' + family + '.native attrs and listener modifiers', family + '.prop.onChange'],
      async () => {
        await mount(family, { flags: { once: ['onChange'] } });
        await first().fill('one');
        await first().fill('two');
        const s = await snapshot();
        assert.equal(s.records.filter((item) => item.name === 'onChangeOnce').length, 1);
        return s.records;
      },
    );
    await check(
      'events.' + family + '.native-template',
      'Actual Vue template keydown/keyup listeners reach native events.',
      ['' + family + '.native attrs and listener modifiers', family + '.keyboard and IME'],
      async () => {
        await mount(family, { flags: { sfcNative: true } });
        await first().press('a');
        const s = await snapshot();
        assert.equal(s.records.filter((item) => item.name === 'template.keydown').length, 1);
        assert.equal(s.records.filter((item) => item.name === 'template.keyup').length, 1);
        return s.records;
      },
    );
  }
  await check(
    'content.input-zero',
    'VNode scalar zero remains visible in all declared affix/addon content.',
    ['Input.prop.prefix', 'Input.prop.suffix', 'Input.prop.addonBefore', 'Input.prop.addonAfter'],
    async () => {
      const s = await mount('Input', {
        props: { prefix: 0, suffix: 0, addonBefore: 0, addonAfter: 0 },
      });
      assert.equal(s.text.replaceAll('Outside focus target', '').trim(), '0000');
      return s;
    },
  );
  await check(
    'otp.model-partial',
    'v-model represents every visible value; completion onChange stays separate.',
    ['InputOTP.v-model', 'InputOTP.prop.value', 'InputOTP.prop.onInput', 'InputOTP.prop.onChange'],
    async () => {
      await mount('InputOTP', { control: 'model', value: '', props: { length: 4 } });
      await first().fill('1');
      const s = await snapshot();
      assert.equal(s.models[0], '1');
      assert.equal(s.records.filter((item) => item.name === 'change').length, 0);
      return s;
    },
  );
  await check(
    'otp.controlled-reject',
    'Controlled value remains source of truth when owner rejects an edit.',
    ['InputOTP.prop.value'],
    async () => {
      await mount('InputOTP', { control: 'reject', value: '1234', props: { length: 4 } });
      await first().fill('9');
      await settle();
      const s = await snapshot();
      assert.equal(s.controls.map((item) => item.value).join(''), '1234');
      return s;
    },
  );
  await check(
    'otp.zero-separator',
    'Scalar zero is a valid separator node.',
    ['InputOTP.prop.separator'],
    async () => {
      const s = await mount('InputOTP', { props: { length: 4, separator: 0 } });
      assert.equal(await page.locator('.apollo-otp-separator').count(), 3);
      return s;
    },
  );
  await check(
    'otp.formatter-expands',
    'Formatted content is constrained to visible length and can complete.',
    ['InputOTP.prop.formatter', 'InputOTP.prop.length'],
    async () => {
      await mount('InputOTP', { props: { length: 4 }, flags: { formatter: 'expand' } });
      await first().fill('abcd');
      const s = await snapshot();
      assert.equal(s.records.filter((item) => item.name === 'change').at(-1)?.value, 'ABCD');
      return s;
    },
  );
  for (const family of ['Input', 'TextArea', 'InputPassword', 'InputSearch'])
    await check(
      'semantic.' + family + '.attrs',
      'Semantic callback props include declared public attrs actually rendered by the native field.',
      ['' + family + '.prop.classNames', family + '.prop.styles', family + '.prop.placeholder'],
      async () => {
        const s = await mount(family, {
          props: { placeholder: 'Actual placeholder', readOnly: true },
          flags: { semanticSpy: true },
        });
        assert.equal(s.controls[0].placeholder, 'Actual placeholder');
        assert.equal(s.callbacks.at(-1).props.placeholder, 'Actual placeholder');
        assert.equal(s.controls[0].letterSpacing, '2px');
        return s;
      },
    );
}
