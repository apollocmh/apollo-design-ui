import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';
import { Client } from '@modelcontextprotocol/client';
import { StdioClientTransport } from '@modelcontextprotocol/client/stdio';

const cli =
  process.env.APOLLO_MCP_CLI ?? fileURLToPath(new URL('../dist/cli.mjs', import.meta.url));
const bundle = JSON.parse(
  fs.readFileSync(new URL('../dist/content.json', import.meta.url), 'utf8'),
);

test('stdio client retrieves documented API, real source and explicit errors', async () => {
  const transport = new StdioClientTransport({
    command: process.execPath,
    args: [cli],
    stderr: 'pipe',
  });
  const client = new Client({ name: 'apollo-consumer', version: '1.0.0' });
  try {
    await client.connect(transport);
    const { tools } = await client.listTools();
    assert.equal(tools.length, 4);
    const call = async (name, args) => {
      const result = await client.callTool({ name, arguments: args });
      assert.equal(result.content[0].type, 'text');
      return { ...JSON.parse(result.content[0].text), isError: result.isError };
    };
    const catalogue = await call('search_components', { query: '', limit: 100 });
    assert.equal(
      catalogue.data.results.filter((item) => item.id.startsWith('components/')).length,
      72,
    );
    assert.equal(catalogue.projectVersion, null);
    const search = await call('search_components', { query: 'button' });
    assert.ok(search.data.results.some((item) => item.id === 'components/button'));
    const doc = await call('get_document', { id: 'components/button', language: 'en' });
    assert.match(doc.data.markdown, /API/);
    const list = await call('list_examples', { component: 'button' });
    assert.ok(list.data.length > 0);
    const example = await call('get_example', { component: 'button', name: list.data[0].name });
    assert.match(example.data.files[0].code, /@apollo-design\/ui/);
    assert.match(example.data.files[0].code, /<template>/);
    const helperDemo = bundle.documents
      .flatMap((document) => document.examples.map((example) => ({ document, example })))
      .find(({ example }) => example.sources.length > 1);
    assert.ok(helperDemo, 'Existing demos include local helper files');
    const helpers = await call('get_example', {
      component: helperDemo.document.id.split('/')[1],
      name: helperDemo.example.name,
    });
    assert.equal(helpers.data.files.length, helperDemo.example.sources.length);
    assert.equal((await call('get_document', { id: '../../package.json' })).isError, true);
    assert.equal(
      (await call('get_example', { component: 'button', name: 'does-not-exist' })).isError,
      true,
    );
  } finally {
    await client.close();
  }
});

test('project version is checked before serving documentation', async () => {
  const project = fs.mkdtempSync(path.join(os.tmpdir(), 'apollo-mcp-version-'));
  const packageDir = path.join(project, 'node_modules/@apollo-design/ui');
  fs.mkdirSync(packageDir, { recursive: true });
  const manifest = path.join(packageDir, 'package.json');
  try {
    fs.writeFileSync(
      manifest,
      JSON.stringify({ name: '@apollo-design/ui', version: bundle.version }),
    );
    const transport = new StdioClientTransport({
      command: process.execPath,
      args: [cli, '--project', project],
    });
    const client = new Client({ name: 'version-consumer', version: '1.0.0' });
    try {
      await client.connect(transport);
      const result = await client.callTool({
        name: 'get_document',
        arguments: { id: 'guide/getting-started' },
      });
      assert.equal(JSON.parse(result.content[0].text).projectVersion, bundle.version);
    } finally {
      await client.close();
    }
    fs.writeFileSync(manifest, JSON.stringify({ name: '@apollo-design/ui', version: '0.0.0' }));
    const mismatch = spawnSync(process.execPath, [cli, '--project', project], {
      encoding: 'utf8',
      timeout: 10000,
    });
    assert.equal(mismatch.status, 1);
    assert.match(mismatch.stderr, /0\.0\.0.*installed/);
    assert.equal(mismatch.stdout, '');
    fs.rmSync(packageDir, { recursive: true });
    const missing = spawnSync(process.execPath, [cli, '--project', project], {
      encoding: 'utf8',
      timeout: 10000,
    });
    assert.equal(missing.status, 1);
    assert.match(missing.stderr, /Cannot find module/);
  } finally {
    fs.rmSync(project, { recursive: true, force: true });
  }
});
