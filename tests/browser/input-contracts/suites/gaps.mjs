export async function run({ assert, page, check, mount, patch, snapshot, first }) {
  for (const family of ['Input', 'TextArea', 'InputPassword', 'InputSearch']) {
    await check(
      'legacy.' + family + '.clear-icon',
      'Existing deprecated clearIcon still supplies the configured glyph, independent of allowClear object form.',
      [family + '.prop.clearIcon'],
      async () => {
        const s = await mount(family, {
          props: {
            allowClear: { disabled: false },
            clearIcon: 'legacy-glyph',
            defaultValue: 'content',
          },
        });
        assert.ok(s.text.includes('legacy-glyph'));
        return s;
      },
    );
    await check(
      'semantic.' + family + '.effective-config',
      'Semantic callbacks observe effective declared props and current local updates.',
      [family + '.semantic class/style callbacks'],
      async () => {
        await mount(family, {
          props: { placeholder: 'initial', readOnly: true },
          flags: { semanticSpy: true },
        });
        const s = await patch({ props: { placeholder: 'updated', readOnly: false } });
        assert.equal(s.callbacks.at(-1).props.placeholder, 'updated');
        assert.equal(s.callbacks.at(-1).props.readOnly, false);
        return s.callbacks;
      },
    );
  }
  await check(
    'search.composition-callbacks',
    'Existing named composition callbacks receive one real native event each.',
    ['InputSearch.prop.onCompositionStart', 'InputSearch.prop.onCompositionEnd'],
    async () => {
      await mount('InputSearch');
      await first().evaluate((node) => {
        node.dispatchEvent(new CompositionEvent('compositionstart', { bubbles: true }));
        node.dispatchEvent(new CompositionEvent('compositionend', { bubbles: true }));
      });
      const s = await snapshot();
      assert.equal(s.records.filter((item) => item.name === 'compositionStart').length, 1);
      assert.equal(s.records.filter((item) => item.name === 'compositionEnd').length, 1);
      return s.records;
    },
  );
  await check(
    'search.search-once',
    'The documented search business listener honors once for button activation.',
    ['InputSearch.Emits', 'InputSearch.prop.onSearch'],
    async () => {
      await mount('InputSearch', {
        props: { defaultValue: 'query' },
        flags: { once: ['onSearch'] },
      });
      await page.locator('.apollo-input-search-btn').click();
      await page.locator('.apollo-input-search-btn').click();
      const s = await snapshot();
      assert.equal(s.records.filter((item) => item.name === 'onSearchOnce').length, 1);
      assert.equal(s.records.find((item) => item.name === 'onSearchOnce').value, 'query');
      return s.records;
    },
  );
  await check(
    'otp.input-once',
    'The documented OTP input listener keeps its business array payload with once.',
    ['InputOTP.Emits', 'InputOTP.prop.onInput'],
    async () => {
      await mount('InputOTP', { props: { length: 4 }, flags: { once: ['onInput'] } });
      await first().fill('1');
      const s = await snapshot(),
        events = s.records.filter((item) => item.name === 'onInputOnce');
      assert.equal(events.length, 1);
      assert.deepEqual(events[0].value, ['1']);
      return s.records;
    },
  );
  await check(
    'migration.password-icon-slot',
    'ADR0006 replaces iconRender with a visible scoped template icon.',
    ['InputPassword.Slots', 'InputPassword.prop.iconRender'],
    async () => {
      await mount('InputPassword', { flags: { sfcMigration: true } });
      assert.equal(await page.locator('[data-slot-icon]').count(), 1);
      assert.equal(await page.locator('[data-slot-icon]').innerText(), 'false');
      await page.locator('[aria-pressed]').click();
      assert.equal(await page.locator('[data-slot-icon]').innerText(), 'true');
      return (await snapshot()).html;
    },
  );
  await check(
    'migration.otp-separator-slot',
    'ADR0006 replaces separator renderer function with an index scoped template.',
    ['InputOTP.Slots', 'InputOTP.prop.separator'],
    async () => {
      await mount('InputOTP', { flags: { sfcMigration: true } });
      const indexes = await page
        .locator('[data-slot-index]')
        .evaluateAll((nodes) => nodes.map((node) => node.getAttribute('data-slot-index')));
      assert.deepEqual(indexes, ['0', '1', '2']);
      return indexes;
    },
  );
  await check(
    'otp.semantic-context',
    'OTP semantic callbacks receive its current public state/config.',
    ['InputOTP.semantic class/style callbacks'],
    async () => {
      await mount('InputOTP', { props: { length: 4, mask: true }, flags: { semanticSpy: true } });
      const s = await patch({ props: { length: 5, mask: false } });
      assert.equal(s.callbacks.at(-1).props.length, 5);
      assert.equal(s.callbacks.at(-1).props.mask, false);
      return s.callbacks;
    },
  );
  await check(
    'otp.multi-instance',
    'OTP peer instances own independent cell state and refs.',
    ['InputOTP.SSR and multi-instance', 'InputOTP.state identity and lifecycle'],
    async () => {
      await mount('InputOTP', { instances: 2, props: { length: 4, defaultValue: '12' } });
      await page.locator('[data-instance="0"] input').first().fill('9');
      const values = await page
        .locator('[data-instance="1"] input')
        .evaluateAll((nodes) => nodes.map((node) => node.value));
      assert.deepEqual(values, ['1', '2', '', '']);
      return values;
    },
  );
  await check(
    'group.no-undeclared-contract',
    'Group declares neither value model nor imperative editor methods; native descendants remain actual controls.',
    [
      'InputGroup.Emits',
      'InputGroup.v-model',
      'InputGroup.Expose',
      'InputGroup.semantic class/style callbacks',
      'InputGroup.keyboard and IME',
    ],
    async () => {
      await mount('InputGroup');
      const data = await page.evaluate(() => {
        const r = window.audit.ref();
        return {
          focus: typeof r.focus,
          nativeElement: typeof r.nativeElement,
          inputs: document.querySelectorAll('#app input').length,
        };
      });
      assert.equal(data.focus, 'undefined');
      assert.equal(data.nativeElement, 'undefined');
      assert.equal(data.inputs, 2);
      await first().fill('group text');
      assert.equal((await snapshot()).controls[0].value, 'group text');
      return data;
    },
  );
  await check(
    'textarea.no-content-slots',
    'TextArea has no declared arbitrary content slots; its existing field is still native.',
    ['TextArea.Slots'],
    async () => {
      const s = await mount('TextArea', { slots: { default: 'unpromised content' } });
      assert.equal(s.controls[0].tag, 'TEXTAREA');
      return s;
    },
  );
  await check(
    'otp.provider-reactivity',
    'Current Provider disabled toggles all cells without losing peer identity.',
    ['InputOTP.Provider/form/Compact state'],
    async () => {
      await mount('InputOTP', { provider: { componentDisabled: true }, props: { length: 4 } });
      await page.evaluate(() => window.audit.hold());
      const s = await patch({ provider: { componentDisabled: false } });
      assert.equal(
        s.controls.every((item) => !item.disabled),
        true,
      );
      assert.equal((await page.evaluate(() => window.audit.identity())).same, true);
      return s;
    },
  );
  await check(
    'count.zero-limit',
    'A zero configured maximum is handled as an explicit limit when clipping is requested.',
    ['Input.prop.count'],
    async () => {
      await mount('Input', { flags: { countMode: 'zero' } });
      await first().fill('value');
      const s = await snapshot();
      assert.equal(s.controls[0].value, '');
      return s;
    },
  );
  await check(
    'count.undefined-show',
    'An undefined optional count.show does not erase explicit showCount=true.',
    ['Input.prop.count', 'Input.prop.showCount'],
    async () => {
      await mount('Input', { props: { showCount: true, defaultValue: 'data' } });
      await page.evaluate(async () => {
        window.audit.state().props.count = { show: undefined };
        await window.audit.settle();
      });
      const s = await snapshot();
      assert.ok(s.text.includes('4'));
      return s;
    },
  );
  await check(
    'search.native-ref-observation',
    'Record Search root vs editable/nativeElement ownership for explicit contract resolution.',
    ['InputSearch.Expose'],
    async () => {
      await mount('InputSearch');
      return page.evaluate(() => {
        const ref = window.audit.ref(),
          root = document.querySelector('[data-instance="0"] > *');
        return {
          nativeIsRoot: ref.nativeElement === root,
          nativeTag: ref.nativeElement?.tagName,
          nativeClass: ref.nativeElement?.className,
          rootClass: root.className,
          inputIsEditable: ref.input === document.querySelector('#app input'),
        };
      });
    },
  );
  await check(
    'group.compact-layout-observation',
    'Record actual compact boolean layout/context effects without assuming upstream behavior.',
    ['InputGroup.prop.compact'],
    async () => {
      await mount('InputGroup', { props: { compact: false } });
      const measure = () =>
        page.locator('[data-instance="0"] > *').evaluate((node) => ({
          display: getComputedStyle(node).display,
          classes: node.className,
          childClasses: [...node.querySelectorAll('input')].map((item) => item.className),
        }));
      const before = await measure();
      await patch({ props: { compact: true } });
      return { before, after: await measure() };
    },
  );
}
