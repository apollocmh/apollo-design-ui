export async function run({ assert, page, check, settle, ssrAssociated }) {
  for (const family of ['Input', 'TextArea', 'InputPassword', 'InputSearch', 'Mentions'])
    for (const affix of family === 'Input' ? [false, true] : [false]) {
      await check(
        `associated.scoped.${family}.${affix}`,
        'Parent scoped CSS targets the logical root with stable hosts and remains isolated from peers.',
        [],
        async () => {
          await page.evaluate(
            ([family, affix]) =>
              window.inputAssociated.mount('scoped', { props: { family, affix } }),
            [family, affix],
          );
          const actual = await page.evaluate(() => {
            const root = window.inputAssociated.ref().owner.nativeElement;
            const style = getComputedStyle(root);
            return {
              sentinel: style.getPropertyValue('--scope-sentinel').trim(),
              letterSpacing: style.letterSpacing,
              peer: getComputedStyle(document.querySelector('[data-unscoped-peer]'))
                .getPropertyValue('--scope-sentinel')
                .trim(),
              html: root.outerHTML,
            };
          });
          assert.equal(actual.sentinel, 'logical-root');
          assert.equal(actual.letterSpacing, '3px');
          assert.equal(actual.peer, '');
          await page.evaluate(() => window.inputAssociated.unmount());
          return actual;
        },
      );
    }
  for (const family of ['Input', 'Mentions'])
    for (const kind of ['scoped', 'nested'])
      for (const affix of [false, true]) {
        await check(
          `associated.scoped.hydration.${family}.${kind}.${affix}`,
          'SSR retains scoped logical-root attributes through hydration and stops unrelated ancestor scopes at a non-root boundary.',
          [],
          async () => {
            const props = { family, affix },
              html = await ssrAssociated(kind, props);
            await page.evaluate(
              ([kind, props, html]) => window.inputAssociated.mount(kind, { props, html }),
              [kind, props, html],
            );
            const actual = await page.evaluate(() => {
              const root = window.inputAssociated.ref().owner.nativeElement,
                style = getComputedStyle(root),
                container = document.querySelector('[data-nested-container]');
              const scopes = (element) =>
                element?.getAttributeNames().filter((name) => name.startsWith('data-v-')) ?? [];
              return {
                ...window.inputAssociated.hydration(),
                sentinel: style.getPropertyValue('--scope-sentinel').trim(),
                leak: style.getPropertyValue('--scope-leak').trim(),
                scopeIds: scopes(root),
                containerScopeIds: scopes(container),
                peer: getComputedStyle(document.querySelector('[data-unscoped-peer]'))
                  .getPropertyValue('--scope-sentinel')
                  .trim(),
              };
            });
            assert.equal(actual.retained, true);
            assert.equal(actual.serverSentinel, 'logical-root');
            assert.equal(actual.serverLeak, '');
            assert.deepEqual(actual.serverScopeIds.sort(), actual.scopeIds.sort());
            assert.equal(actual.sentinel, 'logical-root');
            assert.equal(actual.leak, '');
            assert.equal(actual.peer, '');
            assert.ok(actual.scopeIds.length > 0);
            if (kind === 'nested')
              assert.ok(
                actual.containerScopeIds.some((id) => !actual.scopeIds.includes(id)),
                JSON.stringify(actual),
              );
            await page.evaluate(() => window.inputAssociated.unmount());
            return actual;
          },
        );
      }
  for (const family of ['Input', 'Mentions']) {
    await check(
      `associated.scoped.dynamic.${family}`,
      'Changing affix wrappers preserves the scoped logical root, native editor, focus and selection.',
      [],
      async () => {
        await page.evaluate(
          (family) => window.inputAssociated.mount('scoped', { props: { family, affix: false } }),
          family,
        );
        await page.evaluate(() => {
          const owner = window.inputAssociated.ref().owner,
            editor = owner.input ?? owner.textarea;
          window.scopedEditor = editor;
          window.scopedOwner = owner;
          editor.focus();
          editor.value = 'scoped draft';
          editor.dispatchEvent(
            new InputEvent('input', {
              bubbles: true,
              inputType: 'insertText',
              data: 'scoped draft',
            }),
          );
          editor.setSelectionRange(2, 5);
        });
        const changes = [];
        for (const props of [
          { affix: true },
          { affix: false },
          { feedback: true },
          { feedback: false },
          { affix: true, feedback: true },
          { affix: false, feedback: false },
        ]) {
          await page.evaluate((props) => window.inputAssociated.patch({ props }), props);
          const actual = await page.evaluate(() => {
            const owner = window.inputAssociated.ref().owner,
              editor = owner.input ?? owner.textarea;
            return {
              same: editor === window.scopedEditor,
              sameOwner: owner === window.scopedOwner,
              focused: document.activeElement === editor,
              selection: [editor.selectionStart, editor.selectionEnd],
              value: editor.value,
              sentinel: getComputedStyle(owner.nativeElement)
                .getPropertyValue('--scope-sentinel')
                .trim(),
            };
          });
          changes.push(actual);
          assert.equal(actual.same, true);
          assert.equal(actual.sameOwner, true);
          assert.equal(actual.focused, true);
          assert.deepEqual(actual.selection, [2, 5]);
          assert.equal(actual.value, 'scoped draft');
          assert.equal(actual.sentinel, 'logical-root');
        }
        await page.evaluate(() => window.inputAssociated.unmount());
        return changes;
      },
    );
  }
  for (const compact of [false, true])
    for (const allowClear of [false, true]) {
      await check(
        `associated.mentions.layout.${compact}.${allowClear}`,
        'Shared engines preserve the Mentions logical root, textarea styles, native attrs, focus and selection.',
        [],
        async () => {
          await page.evaluate(
            async ([compact, allowClear]) => {
              await window.inputAssociated.mount('mentions', {
                compact,
                props: {
                  allowClear,
                  class: 'caller-root',
                  style: { width: '260px', marginLeft: '7px' },
                  placeholder: 'Original',
                  classNames: { textarea: 'caller-editor' },
                },
              });
            },
            [compact, allowClear],
          );
          const before = await page.evaluate(() => {
            const api = window.inputAssociated.ref(),
              editor = api.textarea,
              root = api.nativeElement,
              style = getComputedStyle(editor);
            window.associatedEditor = editor;
            api.focus();
            editor.setSelectionRange(1, 3);
            return {
              nativeIsLogical: root === editor.closest('.apollo-mentions'),
              class: root.className,
              editorClass: editor.className,
              width: root.getBoundingClientRect().width,
              editorWidth: editor.getBoundingClientRect().width,
              border: style.borderWidth,
              padding: style.padding,
              resize: style.resize,
              focused: document.activeElement === editor,
              margin: getComputedStyle(root).marginLeft,
            };
          });
          assert.equal(before.nativeIsLogical, true);
          assert.ok(before.class.includes('caller-root'));
          assert.ok(before.editorClass.includes('caller-editor'));
          assert.equal(before.width, 260);
          assert.equal(before.editorWidth, 258);
          assert.equal(before.border, '0px');
          assert.equal(before.resize, 'none');
          assert.equal(before.margin, '7px');
          assert.equal(before.focused, true);
          await page.evaluate(() =>
            window.inputAssociated.patch({
              props: { placeholder: 'Updated', style: { width: '260px', marginLeft: '9px' } },
            }),
          );
          const after = await page.evaluate(() => {
            const api = window.inputAssociated.ref(),
              editor = api.textarea;
            return {
              same: editor === window.associatedEditor,
              focused: document.activeElement === editor,
              selection: [editor.selectionStart, editor.selectionEnd],
              placeholder: editor.placeholder,
              margin: getComputedStyle(api.nativeElement).marginLeft,
            };
          });
          assert.equal(after.same, true);
          assert.equal(after.focused, true);
          assert.deepEqual(after.selection, [1, 3]);
          assert.equal(after.placeholder, 'Updated');
          assert.equal(after.margin, '9px');
          await page.evaluate(() => window.inputAssociated.unmount());
          return { before, after };
        },
      );
    }
  for (const compact of [false, true])
    for (const clearIcon of [0, 'Clear']) {
      await check(
        `associated.mentions.clear.${compact}.${clearIcon}`,
        'Shared explicit clear content has a named 24px target, keyboard activation, visible focus and space inside the field.',
        [],
        async () => {
          await page.evaluate(
            async ([compact, clearIcon]) => {
              await window.inputAssociated.mount('mentions', {
                compact,
                props: { allowClear: { clearIcon }, style: { width: '260px' } },
              });
            },
            [compact, clearIcon],
          );
          const button = page.locator('.apollo-mentions-clear-icon');
          await button.focus();
          const target = await button.evaluate((button) => {
            const root = button.closest('.apollo-mentions'),
              editor = root.querySelector('textarea'),
              box = button.getBoundingClientRect(),
              outer = root.getBoundingClientRect(),
              native = editor.getBoundingClientRect(),
              style = getComputedStyle(editor),
              focus = getComputedStyle(button);
            return {
              width: box.width,
              height: box.height,
              inside: box.top >= outer.top - 1 && box.bottom <= outer.bottom + 1,
              noOverlap: native.right - parseFloat(style.paddingRight) <= box.left + 1,
              name: button.getAttribute('aria-label'),
              outline: focus.outlineStyle,
              outlineWidth: parseFloat(focus.outlineWidth),
              outerHeight: outer.height,
            };
          });
          assert.ok(target.width >= 24 && target.height >= 24, JSON.stringify(target));
          assert.equal(target.inside, true, JSON.stringify(target));
          assert.equal(target.noOverlap, true, JSON.stringify(target));
          assert.ok(target.name);
          assert.equal(target.outline, 'solid');
          assert.ok(target.outlineWidth > 0);
          await button.press('Enter');
          await settle();
          const after = await page.evaluate(() => ({
            value: window.inputAssociated.ref().textarea.value,
            focused: document.activeElement === window.inputAssociated.ref().textarea,
            records: window.inputAssociated.records(),
          }));
          assert.equal(after.value, '');
          assert.equal(after.focused, true);
          assert.equal(after.records.filter((item) => item.name === 'clear').length, 1);
          await page.evaluate(() => window.inputAssociated.unmount());
          return { target, after };
        },
      );
    }
  await check(
    'associated.transfer.clear',
    'Actual Input clear reaches Transfer search once, followed by a real native event and later ordinary edits.',
    [],
    async () => {
      await page.evaluate(() => window.inputAssociated.mount('transfer'));
      const editor = page.locator('[data-associated] input.apollo-input').first();
      await editor.fill('Alpha');
      await page.locator('.apollo-input-clear-icon').first().click();
      await editor.fill('Beta');
      const records = await page.evaluate(() => window.inputAssociated.records());
      assert.deepEqual(
        records
          .filter((item) => item.name === 'search' && item.direction === 'left')
          .map((item) => item.value),
        ['Alpha', '', 'Beta'],
      );
      const cleared = records.find(
        (item) => item.name === 'nativeInput' && item.value.value === '',
      );
      assert.ok(cleared);
      assert.equal(cleared.value.constructor, 'InputEvent');
      assert.equal(cleared.value.targetOwned, true);
      await page.evaluate(() => window.inputAssociated.unmount());
      return records;
    },
  );
  await check(
    'associated.form.field',
    'Real Form labels focus the editor; value, clear, validation and status feedback remain attached to the same native field.',
    [],
    async () => {
      await page.evaluate(() => window.inputAssociated.mount('form'));
      const editor = page.locator('[data-associated="form"] input').first(),
        label = page.locator('[data-associated="form"] label').first();
      const association = await label.evaluate(
        (label) => label.control === window.inputAssociated.ref().input.input,
      );
      assert.equal(association, true);
      await label.click();
      assert.equal(await editor.evaluate((editor) => document.activeElement === editor), true);
      await page.evaluate(() => {
        window.associatedEditor = document.querySelector('[data-associated="form"] input');
      });
      await editor.fill('Valid account');
      await page.evaluate(() => window.inputAssociated.ref().form.validateFields());
      assert.equal(
        await page.evaluate(() => window.inputAssociated.ref().model.name),
        'Valid account',
      );
      await page.locator('[data-associated="form"] .apollo-input-clear-icon').click();
      const invalid = await page.evaluate(async () => {
        try {
          await window.inputAssociated.ref().form.validateFields();
          return false;
        } catch {
          return true;
        }
      });
      assert.equal(invalid, true);
      await page.getByText('Name required', { exact: true }).waitFor();
      const error = await page.evaluate(() => {
        const owner = window.inputAssociated.ref(),
          editor = document.querySelector('[data-associated="form"] input'),
          root = editor.closest('.apollo-input-affix-wrapper'),
          box = root.getBoundingClientRect(),
          content = root.closest('.apollo-form-item-control-input-content').getBoundingClientRect();
        const color = document.createElement('span');
        color.style.color = 'var(--apollo-color-error)';
        root.append(color);
        const expected = getComputedStyle(color).color;
        color.remove();
        return {
          same: editor === window.associatedEditor,
          focused: document.activeElement === editor,
          value: owner.model.name,
          classes: root.className,
          border: getComputedStyle(root).borderColor,
          expected,
          width: box.width,
          contentWidth: content.width,
          feedback: !!document.querySelector('.apollo-form-item-feedback-icon'),
          ariaInvalid: editor.getAttribute('aria-invalid'),
        };
      });
      assert.equal(error.same, true);
      assert.equal(error.focused, true);
      assert.equal(error.value, '');
      assert.ok(error.classes.includes('status-error'));
      assert.equal(error.border, error.expected);
      assert.ok(Math.abs(error.width - error.contentWidth) < 1);
      assert.equal(error.feedback, true);
      assert.equal(error.ariaInvalid, 'true');
      await editor.fill('Recovered');
      await page.evaluate(() => window.inputAssociated.ref().form.validateFields());
      await page.evaluate(() => window.inputAssociated.unmount());
      return error;
    },
  );
}
