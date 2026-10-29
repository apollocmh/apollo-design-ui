export async function run({ assert, page, check, mount, patch, snapshot, first, settle }) {
  const families = ['Input', 'TextArea', 'InputPassword', 'InputSearch'];
  for (const family of families) {
    await check(
      'events.' + family + '.listener-arrays',
      'Vue merged native input/focus listeners run each handler and do not interrupt the model.',
      [family + '.native attrs and listener modifiers', family + '.Emits'],
      async () => {
        await mount(family, {
          control: 'model',
          value: '',
          flags: { arrays: ['onInput', 'onFocus'] },
        });
        await first().fill('array');
        const s = await snapshot();
        assert.equal(s.models[0], 'array');
        assert.equal(s.records.filter((item) => item.name === 'input').length, 1);
        assert.equal(s.records.filter((item) => item.name === 'onInputSecond').length, 1);
        return s;
      },
    );
    await check(
      'ime.' + family + '.settled-change',
      'Composition is not clipped mid-IME and commits one normalized change after completion, including the final input event.',
      [family + '.keyboard and IME', family + '.v-model', family + '.prop.count'],
      async () => {
        await mount(family, { control: 'model', value: '', flags: { countMode: 'clip' } });
        await first().focus();
        await page.evaluate(() => {
          const node = document.querySelector('#app input,#app textarea');
          window.audit.clearRecords();
          window.audit.marker('start');
          node.dispatchEvent(new CompositionEvent('compositionstart', { bubbles: true, data: '' }));
          node.value = 'abcdef';
          node.dispatchEvent(
            new InputEvent('input', {
              bubbles: true,
              inputType: 'insertCompositionText',
              data: 'abcdef',
              isComposing: true,
            }),
          );
          window.audit.marker('during');
        });
        const during = await snapshot();
        await first().evaluate((node) => {
          node.dispatchEvent(
            new CompositionEvent('compositionend', { bubbles: true, data: 'abcdef' }),
          );
          node.dispatchEvent(
            new InputEvent('input', {
              bubbles: true,
              inputType: 'insertText',
              data: 'abcdef',
              isComposing: false,
            }),
          );
        });
        await settle();
        const after = await snapshot();
        assert.equal(during.controls[0].value, 'abcdef');
        assert.equal(during.records.filter((item) => item.name === 'change').length, 0);
        assert.equal(after.controls[0].value, 'abc');
        assert.equal(after.records.filter((item) => item.name === 'change').length, 1);
        return { during, after };
      },
    );
    await check(
      'ime.' + family + '.enter-gate',
      'Active composition suppresses business Enter even if a boundary keyboard event lacks isComposing.',
      [family + '.keyboard and IME', family + '.prop.onPressEnter'],
      async () => {
        await mount(family);
        await first().evaluate((node) => {
          node.dispatchEvent(new CompositionEvent('compositionstart', { bubbles: true, data: '' }));
          node.dispatchEvent(
            new KeyboardEvent('keydown', { key: 'Enter', bubbles: true, isComposing: false }),
          );
        });
        const s = await snapshot();
        assert.equal(s.records.filter((item) => item.name === 'pressEnter').length, 0);
        assert.equal(s.records.filter((item) => item.name === 'search').length, 0);
        return s.records;
      },
    );
    await check(
      'sfc.' + family + '.composition-native',
      'Actual template compositionstart/compositionend listeners are routed once.',
      [family + '.native attrs and listener modifiers', family + '.keyboard and IME'],
      async () => {
        await mount(family, { flags: { sfcNative: true } });
        await first().evaluate((node) => {
          node.dispatchEvent(
            new CompositionEvent('compositionstart', { bubbles: true, data: 'x' }),
          );
          node.dispatchEvent(new CompositionEvent('compositionend', { bubbles: true, data: 'x' }));
        });
        const s = await snapshot();
        assert.equal(
          s.records.filter((item) => item.name === 'template.compositionstart').length,
          1,
        );
        assert.equal(s.records.filter((item) => item.name === 'template.compositionend').length, 1);
        return s.records;
      },
    );
    await check(
      'sfc.' + family + '.press-once',
      'The documented press-enter event honors Vue once.',
      [family + '.Emits', family + '.prop.onPressEnter'],
      async () => {
        await mount(family, { flags: { sfcNative: true } });
        await first().press('Enter');
        await first().press('Enter');
        const s = await snapshot();
        assert.equal(s.records.filter((item) => item.name === 'template.pressEnter').length, 2);
        assert.equal(s.records.filter((item) => item.name === 'template.pressEnterOnce').length, 1);
        return s.records;
      },
    );
    await check(
      'clear.' + family + '.default-pointer',
      'Default clear icon has an actionable pointer target, empties once and preserves focus.',
      [family + '.prop.allowClear', family + '.prop.onChange', family + '.Emits'],
      async () => {
        await mount(family, { props: { defaultValue: 'clear text', allowClear: true } });
        await first().focus();
        await page.evaluate(() => window.audit.clearRecords());
        const target = page.locator('.apollo-input-clear-icon');
        await target.click();
        const s = await snapshot();
        assert.equal(s.controls[0].value, '');
        assert.equal(s.records.filter((item) => item.name === 'clear').length, 1);
        assert.equal(s.records.filter((item) => item.name === 'change').length, 1);
        assert.equal(await first().evaluate((node) => node === document.activeElement), true);
        return s;
      },
    );
    await check(
      'attrs.' + family + '.hidden-visibility',
      'The declared hidden prop actually hides the component under its own CSS.',
      [family + '.prop.hidden'],
      async () => {
        await mount(family, { props: { hidden: true } });
        assert.equal(await first().isVisible(), false);
        return (await snapshot()).html;
      },
    );
    if (family !== 'TextArea')
      await check(
        'attrs.' + family + '.type-contract',
        'Input/Search consume type; Password owns password/text after removing its ineffective inherited type.',
        [family + '.prop.type'],
        async () => {
          const s = await mount(family, { props: { type: 'email' } });
          assert.equal(s.controls[0].type, family === 'InputPassword' ? 'password' : 'email');
          return s;
        },
      );
    if (family !== 'TextArea')
      await check(
        'content.' + family + '.inherited-nodes',
        'Declared prefix/suffix/addon data are consumed by wrapper families and update dynamically.',
        ['prefix', 'suffix', 'addonBefore', 'addonAfter'].map((name) => family + '.prop.' + name),
        async () => {
          let s = await mount(family, {
            props: {
              prefix: 'before',
              suffix: 'after',
              addonBefore: 'prepend',
              addonAfter: 'append',
            },
          });
          for (const text of ['before', 'after', 'prepend', 'append'])
            assert.ok(s.text.includes(text));
          s = await patch({ props: { prefix: 'next-before', suffix: 'next-after' } });
          assert.ok(s.text.includes('next-before'));
          assert.ok(s.text.includes('next-after'));
          return s;
        },
      );
  }
  await check(
    'textarea.native-mousedown',
    'Actual template mousedown reaches the consumer once.',
    ['TextArea.native attrs and listener modifiers'],
    async () => {
      await mount('TextArea', { flags: { sfcNative: true } });
      await first().click();
      const s = await snapshot();
      assert.equal(s.records.filter((item) => item.name === 'template.mousedown').length, 1);
      return s.records;
    },
  );
  await check(
    'textarea.unmount-mouseup',
    'Unmount during a native resize interaction removes its document mouseup listener.',
    ['TextArea.state identity and lifecycle'],
    async () => {
      await page.evaluate(() => {
        const add = document.addEventListener.bind(document),
          remove = document.removeEventListener.bind(document),
          handlers = new Set();
        window.mouseupAudit = { handlers, add, remove };
        document.addEventListener = (type, handler, ...args) => {
          if (type === 'mouseup') handlers.add(handler);
          return add(type, handler, ...args);
        };
        document.removeEventListener = (type, handler, ...args) => {
          if (type === 'mouseup') handlers.delete(handler);
          return remove(type, handler, ...args);
        };
      });
      try {
        await mount('TextArea');
        await first().evaluate((node) =>
          node.dispatchEvent(new MouseEvent('mousedown', { bubbles: true })),
        );
        const during = await page.evaluate(() => window.mouseupAudit.handlers.size);
        await page.evaluate(() => window.audit.unmount());
        const after = await page.evaluate(() => window.mouseupAudit.handlers.size);
        assert.ok(during > 0);
        assert.equal(after, 0);
        return { during, after };
      } finally {
        await page.evaluate(() => {
          const a = window.mouseupAudit;
          for (const h of a.handlers) a.remove('mouseup', h);
          document.addEventListener = a.add;
          document.removeEventListener = a.remove;
          delete window.mouseupAudit;
        });
      }
    },
  );
  await check(
    'password.hover-descendants',
    'Moving within a hover toggle does not toggle again on descendant mouseover.',
    ['InputPassword.prop.action'],
    async () => {
      await mount('InputPassword', { props: { action: 'hover' } });
      const toggle = page.locator('[aria-pressed]');
      await toggle.hover();
      const firstState = (await snapshot()).controls[0].type;
      await toggle.evaluate((node) =>
        node
          .querySelector('svg')
          ?.dispatchEvent(new MouseEvent('mouseover', { bubbles: true, relatedTarget: node })),
      );
      const secondState = (await snapshot()).controls[0].type;
      assert.equal(firstState, 'text');
      assert.equal(secondState, 'text');
      return { firstState, secondState };
    },
  );
  await check(
    'content.count-renderers',
    'Nested count/showCount formatter functions currently render VNodes and zero; role must be recorded for ADR classification.',
    ['Input.prop.showCount', 'TextArea.prop.showCount', 'Input.prop.count'],
    async () => {
      await mount('Input', { props: { defaultValue: 'two' }, flags: { showFormatter: 'zero' } });
      let s = await snapshot();
      assert.ok(s.text.includes('0'));
      await mount('TextArea', { props: { defaultValue: 'two' }, flags: { showFormatter: 'node' } });
      s = await snapshot();
      assert.equal(await page.locator('[data-count-node]').count(), 1);
      return s;
    },
  );
  for (const family of ['InputPassword', 'InputSearch'])
    await check(
      'slots.' + family + '.inherited-observation',
      'Observe whether wrapper families consume Input prefix/suffix slots; classify contract separately.',
      [family + '.Slots'],
      async () => {
        const s = await mount(family, { slots: { prefix: 'slot prefix', suffix: 'slot suffix' } });
        return {
          prefixVisible: s.text.includes('slot prefix'),
          suffixVisible: s.text.includes('slot suffix'),
          html: s.html,
        };
      },
    );
  for (const family of [
    'Input',
    'TextArea',
    'InputPassword',
    'InputSearch',
    'InputOTP',
    'InputGroup',
  ])
    await check(
      'lifecycle.' + family + '.remount',
      'Unmount clears owned editors/refs; a new instance initializes without old state.',
      [family + '.state identity and lifecycle'],
      async () => {
        await mount(family, {
          props:
            family === 'InputOTP' ? { defaultValue: '12', length: 4 } : { defaultValue: 'start' },
        });
        const unmounted = await page.evaluate(() => window.audit.unmount());
        assert.equal(unmounted.controls, 0);
        assert.equal(unmounted.refs.every(Boolean), true);
        const s = await mount(family, {
          props:
            family === 'InputOTP' ? { defaultValue: '34', length: 4 } : { defaultValue: 'fresh' },
        });
        if (family !== 'InputGroup')
          assert.equal(
            s.controls.map((item) => item.value).join(''),
            family === 'InputOTP' ? '34' : 'fresh',
          );
        return { unmounted, controls: s.controls };
      },
    );
  await check(
    'clear.custom-content-hitbox',
    'A valid text clearIcon has a nonzero interactive hit box.',
    ['Input.prop.clearIcon', 'Input.prop.allowClear'],
    async () => {
      await mount('Input', { props: { allowClear: { clearIcon: 'Clear' }, defaultValue: 'text' } });
      const box = await page.locator('.apollo-input-clear-icon').boundingBox();
      assert.ok(box?.height > 0);
      assert.ok(box?.width > 0);
      return box;
    },
  );
  await check(
    'clear.disabled-safety',
    'Disabled/readonly behavior cannot be re-enabled by a legitimate semantic clear style.',
    ['Input.prop.disabled', 'Input.prop.readOnly', 'Input.prop.allowClear', 'Input.prop.styles'],
    async () => {
      await mount('Input', {
        props: {
          disabled: true,
          defaultValue: 'retained',
          allowClear: true,
          styles: { clear: { visibility: 'visible' } },
        },
      });
      const target = page.locator('.apollo-input-clear-icon');
      assert.equal(await target.isDisabled(), true);
      return (await snapshot()).html;
    },
  );
}
