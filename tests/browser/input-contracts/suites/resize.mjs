export async function run({ assert, page, check, mount, patch, snapshot, first, settle }) {
  await check(
    'textarea.manual-resize-notification',
    'The existing onResize callback reports native manual resizing when autoSize is off.',
    ['TextArea.prop.onResize', 'TextArea.prop.autoSize', 'TextArea.state identity and lifecycle'],
    async () => {
      await mount('TextArea', {
        props: {
          autoSize: false,
          rows: 3,
          style: { width: '250px', resize: 'both' },
          defaultValue: 'resizable',
        },
      });
      const before = await first().boundingBox();
      await page.evaluate(() => window.audit.clearRecords());
      await page.mouse.move(before.x + before.width - 3, before.y + before.height - 3);
      await page.mouse.down();
      await page.mouse.move(before.x + before.width + 42, before.y + before.height + 32, {
        steps: 5,
      });
      await page.mouse.up();
      await settle();
      const after = await first().boundingBox(),
        s = await snapshot();
      assert.ok(after.height > before.height);
      const events = s.records.filter((item) => item.name === 'resize');
      assert.ok(events.length > 0);
      assert.equal(events.at(-1).value.height, after.height);
      return { before, after, events };
    },
  );
  await check(
    'textarea.external-resize-notification',
    'The existing onResize callback observes explicit caller size changes without enabling autoSize.',
    ['TextArea.prop.onResize'],
    async () => {
      await mount('TextArea', {
        props: { autoSize: false, style: { width: '250px', height: '80px' } },
      });
      await page.evaluate(() => window.audit.clearRecords());
      await patch({ props: { style: { width: '280px', height: '120px' } } });
      await settle();
      const s = await snapshot(),
        events = s.records.filter((item) => item.name === 'resize');
      assert.ok(events.length > 0);
      assert.equal(events.at(-1).value.height, 120);
      return events;
    },
  );
}
