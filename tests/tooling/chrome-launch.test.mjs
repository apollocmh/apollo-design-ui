import assert from 'node:assert/strict';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import test, { mock } from 'node:test';
import { chromium } from 'playwright';
import { launchBrowser } from '../visual/stabilize.mjs';

test('an explicitly missing Chrome executable rejects without falling back', async () => {
  const directory = mkdtempSync(join(tmpdir(), 'apollo-chrome-missing-'));
  const executablePath = join(directory, 'not-installed', 'chrome');
  const previous = process.env.APOLLO_CHROME_EXECUTABLE;
  let browser;
  process.env.APOLLO_CHROME_EXECUTABLE = executablePath;
  try {
    await assert.rejects(
      async () => {
        ({ browser } = await launchBrowser());
      },
      (error) => {
        assert.ok(error instanceof Error);
        assert.ok(error.message.includes(executablePath), error.message);
        assert.match(error.message, /executable.*(?:does not|doesn't) exist/i);
        return true;
      },
    );
  } finally {
    if (previous === undefined) delete process.env.APOLLO_CHROME_EXECUTABLE;
    else process.env.APOLLO_CHROME_EXECUTABLE = previous;
    try {
      await browser?.close();
    } finally {
      rmSync(directory, { recursive: true, force: true });
    }
  }
});

test('a configured Chrome executable must be a non-empty absolute path', async () => {
  const previous = process.env.APOLLO_CHROME_EXECUTABLE;
  let browser;
  try {
    for (const executablePath of ['', 'relative/chrome']) {
      process.env.APOLLO_CHROME_EXECUTABLE = executablePath;
      await assert.rejects(async () => {
        ({ browser } = await launchBrowser());
      }, /APOLLO_CHROME_EXECUTABLE must be a non-empty absolute path/);
    }
  } finally {
    if (previous === undefined) delete process.env.APOLLO_CHROME_EXECUTABLE;
    else process.env.APOLLO_CHROME_EXECUTABLE = previous;
    await browser?.close();
  }
});

test('motion args reach the selected browser while default selection stays unchanged', async () => {
  const previous = process.env.APOLLO_CHROME_EXECUTABLE;
  const executablePath = join(tmpdir(), 'apollo-configured-chrome');
  const args = ['--disable-gpu-vsync'];
  const browser = {};
  const calls = [];
  let failSystemChrome = false;
  const launch = mock.method(chromium, 'launch', async (options) => {
    calls.push(options);
    if (failSystemChrome && options.channel === 'chrome') throw new Error('Chrome unavailable');
    return browser;
  });
  try {
    process.env.APOLLO_CHROME_EXECUTABLE = executablePath;
    assert.deepEqual(await launchBrowser(), { browser, channel: '系统 Chrome', executablePath });
    assert.deepEqual(calls[0], { channel: 'chrome', executablePath, args: undefined });
    await launchBrowser({ args });
    assert.deepEqual(calls[1], { channel: 'chrome', executablePath, args });

    delete process.env.APOLLO_CHROME_EXECUTABLE;
    assert.deepEqual(await launchBrowser(), { browser, channel: '系统 Chrome' });
    assert.deepEqual(calls[2], { channel: 'chrome', args: undefined });
    failSystemChrome = true;
    assert.deepEqual(await launchBrowser({ args }), { browser, channel: 'Playwright Chromium' });
    assert.deepEqual(calls.slice(3), [
      { channel: 'chrome', args },
      { channel: undefined, args },
    ]);
  } finally {
    if (previous === undefined) delete process.env.APOLLO_CHROME_EXECUTABLE;
    else process.env.APOLLO_CHROME_EXECUTABLE = previous;
    launch.mock.restore();
  }
});
