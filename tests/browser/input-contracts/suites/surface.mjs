export async function run({ assert, page, check, mount, patch, snapshot, first, settle, ssr }) {
  const textFamilies = ['Input', 'TextArea', 'InputPassword', 'InputSearch'];
  const cover = (family, names) => names.map((name) => family + '.prop.' + name);
  for (const family of textFamilies) {
    await check(
      'props.' + family + '.native-fields',
      'Declared native attrs arrive on the editable element and remain reactive.',
      cover(family, [
        'defaultValue',
        'placeholder',
        'readOnly',
        'disabled',
        'autoComplete',
        'hidden',
        'htmlSize',
        'type',
      ]),
      async () => {
        await mount(family, {
          props: {
            defaultValue: 'original',
            placeholder: 'First placeholder',
            readOnly: true,
            disabled: true,
            autoComplete: 'username',
            htmlSize: 7,
            name: 'owned-name',
            id: 'owned-field',
            tabindex: 3,
            'aria-describedby': 'helper',
          },
        });
        let s = await snapshot();
        assert.equal(s.controls[0].value, 'original');
        assert.equal(s.controls[0].placeholder, 'First placeholder');
        assert.equal(s.controls[0].disabled, true);
        assert.equal(s.controls[0].readOnly, true);
        assert.equal(s.controls[0].autoComplete, 'username');
        assert.equal(s.controls[0].name, 'owned-name');
        assert.equal(s.controls[0].id, 'owned-field');
        assert.equal(s.controls[0].tabIndex, 3);
        if (family !== 'TextArea') assert.equal(s.controls[0].size, 7);
        await patch({
          props: {
            placeholder: 'Next placeholder',
            disabled: false,
            readOnly: false,
            autoComplete: 'off',
          },
        });
        s = await snapshot();
        assert.equal(s.controls[0].placeholder, 'Next placeholder');
        assert.equal(s.controls[0].disabled, false);
        assert.equal(s.controls[0].readOnly, false);
        return s;
      },
    );
    await check(
      'props.' + family + '.maxlength',
      'maxLength reaches the native editable element.',
      cover(family, ['maxLength']),
      async () => {
        const s = await mount(family, { props: { maxLength: 3 } });
        assert.equal(s.controls[0].maxLength, 3);
        await first().fill('abcdef');
        const after = await snapshot();
        assert.equal(after.controls[0].value.length <= 3, true);
        return after;
      },
    );
    await check(
      'props.' + family + '.autofocus',
      'autoFocus is forwarded to the native input on mount.',
      cover(family, ['autoFocus']),
      async () => {
        const s = await mount(family, { props: { autoFocus: true } });
        assert.equal(s.controls[0].autoFocus, true);
        return s;
      },
    );
    await check(
      'props.' + family + '.default-initial',
      'defaultValue initializes once; subsequent default updates do not erase a draft.',
      cover(family, ['defaultValue']),
      async () => {
        await mount(family, { props: { defaultValue: 'original' } });
        await first().fill('draft');
        const s = await patch({ props: { defaultValue: 'later' } });
        assert.equal(s.controls[0].value, 'draft');
        return s;
      },
    );
    await check(
      'model.' + family + '.accepted',
      'Accepted v-model and external updates are represented by the editor.',
      [family + '.v-model', ...cover(family, ['value'])],
      async () => {
        await mount(family, { control: 'model', value: 'start' });
        await first().fill('accepted');
        let s = await snapshot();
        assert.equal(s.models[0], 'accepted');
        assert.equal(s.controls[0].value, 'accepted');
        s = await patch({ models: ['external', ''] });
        assert.equal(s.controls[0].value, 'external');
        return s;
      },
    );
    await check(
      'model.' + family + '.rejected-render',
      'A controlled rejected value is authoritative after a legitimate parent update.',
      cover(family, ['value']),
      async () => {
        await mount(family, { control: 'reject', value: 'owner' });
        await first().fill('proposal');
        const s = await patch({ props: { class: 'parent-update' } });
        assert.equal(s.models[0], 'owner');
        assert.equal(s.controls[0].value, 'owner');
        return s;
      },
    );
    await check(
      'attrs.' + family + '.root-style',
      'Native root class/style support arrays and CSS strings; semantic control styles target the editor.',
      [family + '.native attrs and listener modifiers', ...cover(family, ['classNames', 'styles'])],
      async () => {
        const s = await mount(family, {
          props: {
            class: ['native-root', { selected: true }],
            style: ['margin-left:7px', { '--audit-custom': '17px' }],
            ...(family === 'TextArea' ? {} : { prefix: 'prefix' }),
            classNames: { root: 'custom-root', input: 'custom-input', textarea: 'custom-textarea' },
            styles:
              family === 'TextArea'
                ? { textarea: { letterSpacing: '2px' } }
                : { input: { letterSpacing: '2px' } },
          },
        });
        const root = await page.locator('[data-instance="0"]').evaluate((node) => {
          const root = window.audit.ref().nativeElement;
          return {
            classes: [...root.classList],
            margin: getComputedStyle(root).marginLeft,
            variable: getComputedStyle(root).getPropertyValue('--audit-custom').trim(),
          };
        });
        assert.equal(root.classes.includes('native-root'), true);
        assert.equal(root.classes.includes('selected'), true);
        assert.equal(root.classes.includes('custom-root'), true);
        assert.equal(root.margin, '7px');
        assert.equal(root.variable, '17px');
        assert.equal(s.controls[0].letterSpacing, '2px');
        return { root, control: s.controls[0] };
      },
    );
    await check(
      'provider.' + family + '.disabled-variant',
      'Provider disabled/variant and explicit local override reach the actual editor.',
      [
        family + '.Provider/form/Compact state',
        ...cover(family, ['disabled', 'variant', 'bordered', 'status']),
      ],
      async () => {
        await mount(family, {
          provider: { componentDisabled: true, variant: 'filled' },
          form: { status: 'error', isFormItemInput: true },
        });
        let s = await snapshot();
        assert.equal(s.controls[0].disabled, true);
        assert.ok(s.html.includes('filled'));
        assert.ok(s.html.includes('status-error'));
        s = await patch({ props: { disabled: false, variant: 'underlined', status: 'warning' } });
        assert.equal(s.controls[0].disabled, false);
        assert.ok(s.html.includes('underlined'));
        assert.ok(s.html.includes('status-warning'));
        return s;
      },
    );
    await check(
      'props.' + family + '.bordered',
      'The existing bordered=false alias selects borderless when variant is absent.',
      cover(family, ['bordered']),
      async () => {
        const s = await mount(family, { props: { bordered: false } });
        assert.ok(s.html.includes('borderless'));
        return s;
      },
    );
    await check(
      'props.' + family + '.hidden',
      'hidden hides the logical component root.',
      cover(family, ['hidden']),
      async () => {
        await mount(family, { props: { hidden: true } });
        assert.equal(await page.evaluate(() => window.audit.ref().nativeElement.hidden), true);
        assert.equal(await first().isVisible(), false);
        return (await snapshot()).controls;
      },
    );
    await check(
      'props.' + family + '.prefixes',
      'prefixCls/inputPrefixCls are consumed by their corresponding nodes, without remounting an existing native editor.',
      cover(family, ['prefixCls', 'inputPrefixCls']),
      async () => {
        await mount(family, {
          props: {
            prefixCls: 'audit-field',
            ...(family === 'InputPassword' || family === 'InputSearch'
              ? { inputPrefixCls: 'audit-native' }
              : {}),
          },
        });
        await first().fill('kept');
        await page.evaluate(() => window.audit.hold());
        const s = await patch({ props: { prefixCls: 'next-field' } });
        assert.ok(s.html.includes('next-field'));
        if (family === 'InputPassword' || family === 'InputSearch')
          assert.ok(s.controls[0].classes.includes('audit-native'));
        else assert.ok(s.controls[0].classes.includes('next-field'));
        assert.equal((await page.evaluate(() => window.audit.identity())).same, true);
        return s;
      },
    );
    await check(
      'ref.' + family + '.native-methods',
      'Public focus/blur/select/selection/ref APIs operate the actual mounted editor.',
      [family + '.Expose'],
      async () => {
        await mount(family, { props: { defaultValue: 'abcdef' } });
        const actual = await page.evaluate(async (family) => {
          const api = window.audit.ref();
          api.focus(
            family === 'TextArea'
              ? { preventScroll: true }
              : { cursor: 'all', preventScroll: true },
          );
          const node = document.querySelector('#app input,#app textarea');
          const data = {
            focused: document.activeElement === node,
            nativeConnected: api.nativeElement?.isConnected,
            inputSame:
              family === 'TextArea' ? api.resizableTextArea?.textArea === node : api.input === node,
            selection: [node.selectionStart, node.selectionEnd],
          };
          if (api.setSelectionRange) api.setSelectionRange(1, 3, 'forward');
          data.range = [node.selectionStart, node.selectionEnd];
          api.blur();
          data.blurred = document.activeElement !== node;
          return data;
        }, family);
        assert.equal(actual.focused, true);
        assert.equal(actual.inputSame, true);
        assert.equal(actual.nativeConnected, true);
        assert.equal(actual.blurred, true);
        if (family !== 'TextArea') assert.deepEqual(actual.range, [1, 3]);
        return actual;
      },
    );
    await check(
      'instances.' + family + '.isolation',
      'Distinct instances keep independent values and refs.',
      [family + '.state identity and lifecycle'],
      async () => {
        await mount(family, { control: 'model', value: 'one', secondValue: 'two', instances: 2 });
        await page
          .locator('[data-instance="0"] input,[data-instance="0"] textarea')
          .fill('changed');
        const s = await snapshot();
        assert.deepEqual(s.models, ['changed', 'two']);
        assert.equal(s.controls[1].value, 'two');
        return s;
      },
    );
    await check(
      'ssr.' + family,
      'Server render supports existing public value and attrs without DOM access.',
      [family + '.SSR and multi-instance'],
      async () => {
        const html = await ssr(family, {
          defaultValue: 'server-value',
          'aria-label': 'SSR editor',
          id: 'ssr-field',
        });
        assert.ok(html.includes('server-value'));
        assert.ok(html.includes('ssr-field'));
        return { html };
      },
    );
  }
  for (const family of textFamilies)
    await check(
      'clear.' + family + '.interaction',
      'Clear emits an empty model/change once and keeps focus; disabled/readOnly hides the target.',
      cover(family, ['allowClear', 'clearIcon', 'onChange']),
      async () => {
        await mount(family, {
          props: { defaultValue: 'clear me', allowClear: { clearIcon: 'Clear field' } },
        });
        await first().focus();
        await page.evaluate(() => window.audit.clearRecords());
        await page.locator('.apollo-input-clear-icon').click();
        let s = await snapshot();
        assert.equal(s.controls[0].value, '');
        assert.equal(s.records.filter((item) => item.name === 'change').length, 1);
        assert.equal(s.records.filter((item) => item.name === 'change')[0].value.value, '');
        assert.equal(await first().evaluate((node) => document.activeElement === node), true);
        await patch({ props: { readOnly: true } });
        s = await snapshot();
        assert.ok(s.html.includes('clear-icon-hidden'));
        return s;
      },
    );
  for (const family of ['Input', 'TextArea', 'InputPassword', 'InputSearch'])
    await check(
      'count.' + family + '.strategy',
      'Count strategy, formatter and exceed clipping consume real input and show the current count.',
      cover(family, ['count', 'showCount']),
      async () => {
        await mount(family, { flags: { countMode: 'clip' } });
        await first().fill('😀abc');
        const s = await snapshot();
        assert.equal(s.controls[0].value, '😀ab');
        assert.ok(s.text.includes('3 / 3'));
        return s;
      },
    );
  await check(
    'textarea.rows-resize',
    'rows and native resize remain owned by the actual textarea.',
    cover('TextArea', ['rows']),
    async () => {
      const s = await mount('TextArea', { props: { rows: 4, style: { resize: 'horizontal' } } });
      assert.equal(s.controls[0].rows, 4);
      assert.equal(s.controls[0].resize, 'horizontal');
      return s;
    },
  );
  await check(
    'textarea.resize-event',
    'The existing autoSize callback reports numeric actual geometry.',
    cover('TextArea', ['autoSize', 'onResize']),
    async () => {
      await mount('TextArea', { props: { autoSize: { minRows: 2, maxRows: 3 } } });
      await first().fill('line\nline\nline\nline');
      await settle();
      const s = await snapshot(),
        resize = s.records.filter((item) => item.name === 'resize').at(-1)?.value;
      assert.equal(typeof resize?.height, 'number');
      assert.equal(typeof resize?.width, 'number');
      assert.ok(resize.height > 0);
      return resize;
    },
  );
  await check(
    'password.icon-semantic',
    'The declared icon semantic class reaches the visible toggle.',
    cover('InputPassword', ['classNames']),
    async () => {
      const s = await mount('InputPassword', { props: { classNames: { icon: 'owned-icon' } } });
      assert.equal(await page.locator('.owned-icon').count(), 1);
      return s;
    },
  );
  await check(
    'password.visibility-native',
    'Pointer and keyboard visibility toggles preserve the field and expose current aria state.',
    cover('InputPassword', ['visibilityToggle', 'action', 'suffix']),
    async () => {
      await mount('InputPassword', { props: { defaultValue: 'secret', suffix: 'units' } });
      await first().focus();
      await first().evaluate((node) => node.setSelectionRange(1, 3));
      await page.evaluate(() => window.audit.hold());
      const toggle = page.locator('button[aria-pressed]');
      await toggle.click();
      const s = await snapshot();
      assert.equal(s.controls[0].type, 'text');
      assert.equal((await page.evaluate(() => window.audit.identity())).same, true);
      assert.equal((await page.evaluate(() => window.audit.identity())).focused, true);
      assert.equal(await toggle.getAttribute('aria-pressed'), 'true');
      await toggle.focus();
      await toggle.press('Enter');
      assert.equal((await snapshot()).controls[0].type, 'password');
      return s;
    },
  );
  await check(
    'password.visibility-controlled',
    'Controlled visibility reports a proposal without changing the supplied state.',
    cover('InputPassword', ['visibilityToggle']),
    async () => {
      await mount('InputPassword', { flags: { visibility: { visible: false } } });
      await page.locator('button[aria-pressed]').click();
      let s = await snapshot();
      assert.equal(s.controls[0].type, 'password');
      assert.equal(s.records.find((item) => item.name === 'visible').value, true);
      s = await patch({ flags: { visibility: { visible: true, tabIndex: 4 } } });
      assert.equal(s.controls[0].type, 'text');
      assert.equal(await page.locator('[aria-pressed]').getAttribute('tabindex'), '4');
      return s;
    },
  );
  await check(
    'password.action-hover',
    'Top-level action wins over visibilityToggle.action and changes behavior dynamically.',
    cover('InputPassword', ['action']),
    async () => {
      await mount('InputPassword', {
        props: { action: 'hover' },
        flags: { visibility: { action: 'click' } },
      });
      await page.locator('[aria-pressed]').hover();
      assert.equal((await snapshot()).controls[0].type, 'text');
      await patch({ props: { action: 'click' } });
      await page.locator('#outside').hover();
      await page.locator('[aria-pressed]').click();
      const s = await snapshot();
      assert.equal(s.controls[0].type, 'password');
      return s;
    },
  );
  await check(
    'password.icon-render',
    'The icon scoped slot renders the current named visible argument.',
    cover('InputPassword', ['iconRender']),
    async () => {
      await mount('InputPassword', { flags: { iconRender: true } });
      assert.equal(await page.locator('[data-icon-visible="false"]').count(), 1);
      await page.locator('[aria-pressed]').click();
      const s = await snapshot();
      assert.equal(await page.locator('[data-icon-visible="true"]').count(), 1);
      return s;
    },
  );
  await check(
    'search.buttons-and-source',
    'Text/zero buttons render; Enter, pointer and clear deliver separate documented sources.',
    cover('InputSearch', ['enterButton', 'onSearch', 'addonAfter']),
    async () => {
      await mount('InputSearch', {
        props: {
          enterButton: 0,
          addonAfter: 'after',
          allowClear: true,
          defaultValue: 'search query',
        },
      });
      assert.ok((await page.locator('.apollo-input-search-btn').innerText()) === '0');
      await first().press('Enter');
      await page.locator('.apollo-input-search-btn').click();
      await page.locator('.apollo-input-clear-icon').click();
      const s = await snapshot(),
        search = s.records.filter((item) => item.name === 'search');
      assert.deepEqual(
        search.map((item) => item.info.source),
        ['input', 'input', 'clear'],
      );
      assert.equal(search.at(-1).value, '');
      assert.ok(s.text.includes('after'));
      return search;
    },
  );
  await check(
    'search.loading-custom',
    'loading blocks custom search button activation as it blocks Enter.',
    cover('InputSearch', ['loading', 'enterButton']),
    async () => {
      await mount('InputSearch', {
        props: { loading: true, defaultValue: 'query' },
        flags: { customButton: 'native' },
      });
      await first().press('Enter');
      const button = page.getByRole('button', { name: 'Custom', exact: true });
      assert.equal(await button.isDisabled(), true);
      await button.evaluate((node) =>
        node.dispatchEvent(new MouseEvent('click', { bubbles: true })),
      );
      const s = await snapshot();
      assert.equal(s.records.filter((item) => item.name === 'search').length, 0);
      return s;
    },
  );
  await check(
    'search.custom-disabled',
    'A supplied disabled native button remains disabled after composing search handlers.',
    cover('InputSearch', ['enterButton', 'disabled']),
    async () => {
      await mount('InputSearch', { flags: { customButton: 'disabled' } });
      const button = page.getByRole('button', { name: 'Disabled custom' });
      assert.equal(await button.isDisabled(), true);
      return (await snapshot()).html;
    },
  );
  await check(
    'search.search-icon',
    'searchIcon controls icon-mode content; text buttons do not duplicate it.',
    cover('InputSearch', ['searchIcon', 'enterButton']),
    async () => {
      let s = await mount('InputSearch', { props: { searchIcon: 'find-icon' } });
      assert.ok(s.text.includes('find-icon'));
      s = await patch({ props: { enterButton: 'Find' } });
      assert.equal(s.text.includes('find-icon'), false);
      assert.ok(s.text.includes('Find'));
      return s;
    },
  );
  await check(
    'otp.native-fields',
    'OTP type/mask/inputMode/autoComplete and default length reach each actual cell.',
    cover('InputOTP', ['type', 'mask', 'inputMode', 'autoComplete', 'defaultValue', 'length']),
    async () => {
      let s = await mount('InputOTP', {
        props: {
          length: 4,
          defaultValue: '12',
          mask: true,
          inputMode: 'numeric',
          autoComplete: 'one-time-code',
        },
      });
      assert.equal(s.controls.length, 4);
      assert.deepEqual(
        s.controls.map((item) => item.value),
        ['1', '2', '', ''],
      );
      assert.equal(
        s.controls.every(
          (item) =>
            item.type === 'password' &&
            item.inputMode === 'numeric' &&
            item.autoComplete === 'one-time-code',
        ),
        true,
      );
      s = await patch({ props: { type: 'tel', mask: '*' } });
      assert.equal(
        s.controls.every((item) => item.type === 'tel'),
        true,
      );
      assert.equal(await page.locator('.apollo-otp-mask-icon').count(), 2);
      return s;
    },
  );
  await check(
    'otp.callback-completion',
    'Input arrays occur during edits, completed change is deduplicated and focus advances.',
    cover('InputOTP', ['onInput', 'onChange', 'onFocus']),
    async () => {
      await mount('InputOTP', { props: { length: 4 } });
      await first().fill('1234');
      let s = await snapshot();
      assert.deepEqual(s.records.filter((item) => item.name === 'input').at(-1).value, [
        '1',
        '2',
        '3',
        '4',
      ]);
      assert.equal(s.records.filter((item) => item.name === 'change').at(-1).value, '1234');
      assert.equal(
        await page
          .locator('#app input')
          .nth(3)
          .evaluate((node) => document.activeElement === node),
        true,
      );
      const count = s.records.filter((item) => item.name === 'change').length;
      await page.locator('#app input').nth(3).fill('4');
      s = await snapshot();
      assert.equal(s.records.filter((item) => item.name === 'change').length, count);
      return s.records;
    },
  );
  await check(
    'otp.dynamic-length',
    'Reducing length constrains subsequent input/model to visible cells.',
    cover('InputOTP', ['length', 'value']),
    async () => {
      await mount('InputOTP', { props: { length: 6, defaultValue: '123456' } });
      await patch({ props: { length: 4 } });
      await first().fill('9');
      const s = await snapshot();
      assert.equal(s.controls.length, 4);
      assert.equal(s.records.filter((item) => item.name === 'change').at(-1).value, '9234');
      return s;
    },
  );
  await check(
    'otp.format-and-separator',
    'Formatter algorithms and per-index separator scoped slots consume current values/indexes.',
    cover('InputOTP', ['formatter', 'separator']),
    async () => {
      await mount('InputOTP', {
        props: { length: 4 },
        flags: { formatter: 'upper', separatorFunction: true },
      });
      await first().fill('abcd');
      const s = await snapshot();
      assert.equal(s.controls.map((item) => item.value).join(''), 'ABCD');
      assert.deepEqual(
        await page
          .locator('[data-separator-index]')
          .evaluateAll((nodes) => nodes.map((node) => node.getAttribute('data-separator-index'))),
        ['0', '1', '2'],
      );
      return s;
    },
  );
  await check(
    'otp.provider-and-local',
    'OTP cells receive Provider disabled/form status and a local status override.',
    cover('InputOTP', ['disabled', 'status', 'variant', 'classNames', 'styles']),
    async () => {
      await mount('InputOTP', {
        provider: { componentDisabled: true, variant: 'filled' },
        form: { status: 'error', hasFeedback: true },
        props: {
          classNames: {
            root: 'otp-own-root',
            input: 'otp-own-input',
            separator: 'otp-own-separator',
          },
          styles: { root: { marginTop: '7px' }, input: { letterSpacing: '2px' } },
          separator: '-',
        },
      });
      let s = await snapshot();
      assert.equal(
        s.controls.every((item) => item.disabled),
        true,
      );
      assert.ok(s.html.includes('status-error'));
      assert.equal(s.html.includes('data-feedback'), false);
      assert.equal(
        s.controls.every((item) => item.letterSpacing === '2px'),
        true,
      );
      s = await patch({ props: { disabled: false, status: 'warning', variant: 'underlined' } });
      assert.equal(
        s.controls.every((item) => !item.disabled),
        true,
      );
      assert.ok(s.html.includes('status-warning'));
      assert.ok(s.html.includes('underlined'));
      return s;
    },
  );
  await check(
    'otp.ref-and-navigation',
    'OTP focus/blur target real cells and arrows/backspace retain keyboard access.',
    ['InputOTP.Expose', 'InputOTP.keyboard and IME'],
    async () => {
      await mount('InputOTP', { props: { length: 4, defaultValue: '12' } });
      await page.evaluate(() => window.audit.ref().focus());
      assert.equal(await first().evaluate((node) => document.activeElement === node), true);
      await first().press('ArrowRight');
      assert.equal(
        await page
          .locator('#app input')
          .nth(1)
          .evaluate((node) => document.activeElement === node),
        true,
      );
      await page.locator('#app input').nth(1).press('ArrowRight');
      assert.equal(
        await page
          .locator('#app input')
          .nth(2)
          .evaluate((node) => document.activeElement === node),
        true,
      );
      await page.locator('#app input').nth(2).press('Backspace');
      assert.equal(
        await page
          .locator('#app input')
          .nth(1)
          .evaluate((node) => document.activeElement === node),
        true,
      );
      await page.evaluate(() => window.audit.ref().blur());
      assert.equal(
        await page
          .locator('#app input')
          .evaluateAll((nodes) => nodes.some((node) => node === document.activeElement)),
        false,
      );
      return (await snapshot()).controls;
    },
  );
  await check(
    'otp.autofocus',
    'OTP autofocus reaches its first native cell only.',
    cover('InputOTP', ['autoFocus']),
    async () => {
      const s = await mount('InputOTP', { props: { length: 4, autoFocus: true } });
      assert.equal(s.controls[0].autoFocus, true);
      assert.equal(
        s.controls.slice(1).some((item) => item.autoFocus),
        false,
      );
      return s;
    },
  );
  await check(
    'otp.attrs-root',
    'OTP native group owns root attrs and a distinct accessible name.',
    ['InputOTP.native attrs and listener modifiers', ...cover('InputOTP', ['prefixCls'])],
    async () => {
      await mount('InputOTP', {
        props: {
          prefixCls: 'own-otp',
          id: 'otp-group',
          'aria-label': 'Security code',
          class: 'native-otp',
          style: 'margin-left:7px',
        },
      });
      const actual = await page.locator('#otp-group').evaluate((node) => ({
        tag: node.tagName,
        role: node.getAttribute('role'),
        label: node.getAttribute('aria-label'),
        classes: [...node.classList],
        margin: getComputedStyle(node).marginLeft,
      }));
      assert.equal(actual.tag, 'DIV');
      assert.equal(actual.role, 'group');
      assert.equal(actual.label, 'Security code');
      assert.ok(actual.classes.includes('own-otp'));
      assert.ok(actual.classes.includes('native-otp'));
      assert.equal(actual.margin, '7px');
      return actual;
    },
  );
  await check(
    'group.complete',
    'Group native attrs/default slot/compact class and current form context reach real children.',
    [
      'InputGroup.Slots',
      'InputGroup.native attrs and listener modifiers',
      'InputGroup.Provider/form/Compact state',
      ...cover('InputGroup', ['prefixCls', 'compact']),
    ],
    async () => {
      await mount('InputGroup', {
        props: {
          prefixCls: 'own-group',
          compact: false,
          id: 'group-root',
          class: 'native-group',
          style: 'margin-left:7px',
        },
        form: { status: 'error', isFormItemInput: true },
      });
      let s = await snapshot();
      assert.equal(s.controls.length, 2);
      assert.ok(s.html.includes('own-group'));
      assert.ok(s.html.includes('native-group'));
      assert.ok(s.html.includes('status-error'));
      assert.equal(s.html.includes('in-form-item'), false);
      s = await patch({ props: { compact: true }, form: { status: 'warning' } });
      assert.ok(s.html.includes('own-group-compact'));
      assert.ok(s.html.includes('status-warning'));
      return s;
    },
  );
  await check(
    'group.slot-empty',
    'Group default slot can be intentionally empty and reappear.',
    ['InputGroup.Slots'],
    async () => {
      let s = await mount('InputGroup', { flags: { emptyGroup: true } });
      assert.equal(s.controls.length, 0);
      s = await patch({ flags: { emptyGroup: false } });
      assert.equal(s.controls.length, 2);
      return s;
    },
  );
  await check(
    'ssr.OTP-Group',
    'OTP/Group SSR retain actual controls without browser-only access.',
    ['InputOTP.SSR and multi-instance', 'InputGroup.SSR and multi-instance'],
    async () => {
      const otp = await ssr('InputOTP', {
          length: 4,
          defaultValue: '1234',
          'aria-label': 'Server code',
        }),
        group = await ssr('InputGroup', {});
      assert.equal((otp.match(/<input\b/g) ?? []).length, 4);
      assert.ok(group.includes('SSR child'));
      return { otp, group };
    },
  );
}
