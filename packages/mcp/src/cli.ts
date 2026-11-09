#!/usr/bin/env node
import { resolve } from 'node:path';
import { parseArgs } from 'node:util';
import { StdioServerTransport } from '@modelcontextprotocol/server/stdio';
import { createServer } from './index';

try {
  const { values } = parseArgs({
    options: { project: { type: 'string' }, help: { type: 'boolean', short: 'h' } },
  });
  if (values.help) {
    process.stdout.write(
      'Usage: apollo-design-mcp [--project /absolute/project/path]\nOffline Apollo Design documentation over MCP stdio. --project verifies the installed UI version.\n',
    );
  } else {
    const server = createServer({ project: values.project ? resolve(values.project) : undefined });
    await server.connect(new StdioServerTransport());
  }
} catch (error) {
  process.stderr.write(`${error instanceof Error ? error.message : String(error)}\n`);
  process.exitCode = 1;
}
