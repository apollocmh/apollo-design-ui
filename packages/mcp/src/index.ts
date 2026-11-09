import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { resolve } from 'node:path';
import { McpServer } from '@modelcontextprotocol/server';
import * as z from 'zod/v4';

const bilingual = z.object({ zh: z.string(), en: z.string() });
const contentSchema = z.object({
  version: z.string(),
  sourceCommit: z.string(),
  documents: z.array(
    z.object({
      id: z.string(),
      title: bilingual,
      body: bilingual,
      examples: z.array(
        z.object({
          name: z.string(),
          title: bilingual,
          description: bilingual,
          sources: z.array(z.object({ path: z.string(), code: z.string(), lang: z.string() })),
        }),
      ),
    }),
  ),
});
const language = z.enum(['zh', 'en']).default('zh');
const annotations = {
  readOnlyHint: true,
  destructiveHint: false,
  idempotentHint: true,
  openWorldHint: false,
};

/** A project path is explicit: MCP hosts do not reliably start in the user's project. */
export function createServer(options: { project?: string } = {}): McpServer {
  const content = contentSchema.parse(
    JSON.parse(readFileSync(new URL('./content.json', import.meta.url), 'utf8')),
  );
  let projectVersion: string | null = null;
  if (options.project) {
    const require = createRequire(resolve(options.project, 'package.json'));
    const file = require.resolve('@apollo-design/ui/package.json');
    projectVersion = z
      .object({ version: z.string() })
      .parse(JSON.parse(readFileSync(file, 'utf8'))).version;
    if (projectVersion !== content.version) {
      throw new Error(
        `Apollo UI ${projectVersion} is installed, but these docs describe ${content.version}. Use @apollo-design/mcp@${projectVersion}; no newer-version fallback is used.`,
      );
    }
  }
  const metadata = {
    uiVersion: content.version,
    sourceCommit: content.sourceCommit,
    projectVersion,
  };
  const server = new McpServer(
    { name: 'apollo-design', version: content.version },
    {
      instructions: `Apollo Design is an independent Vue 3 UI library. Read its API and real examples before writing code; do not assume Ant Design or React APIs. Bundled UI version: ${content.version}. ${projectVersion ? `Project version verified: ${projectVersion}.` : 'Project version NOT verified. Configure --project with an absolute project path before applying code.'} Import @apollo-design/theme/tokens.css before @apollo-design/ui/style.css. All tools are offline and read-only.`,
    },
  );
  const reply = (data: unknown, isError = false) => ({
    content: [{ type: 'text' as const, text: JSON.stringify({ ...metadata, data }) }],
    isError,
  });
  server.registerTool(
    'search_components',
    {
      description:
        'Search Apollo components and guides by name or usage. An empty query lists the catalogue. Returns document IDs for get_document.',
      inputSchema: z.object({
        query: z.string().default(''),
        limit: z.number().int().min(1).max(100).default(20),
      }),
      annotations,
    },
    async ({ query, limit }) => {
      const words = query.toLocaleLowerCase().trim().split(/\s+/).filter(Boolean);
      const results = content.documents
        .map((document) => {
          const heading =
            `${document.id} ${document.title.zh} ${document.title.en}`.toLocaleLowerCase();
          const body = `${heading} ${document.body.zh} ${document.body.en}`.toLocaleLowerCase();
          return {
            document,
            score: words.every((word) => body.includes(word))
              ? 1 + words.filter((word) => heading.includes(word)).length
              : 0,
          };
        })
        .filter((result) => result.score > 0)
        .sort((a, b) => b.score - a.score);
      return reply({
        total: results.length,
        results: results.slice(0, limit).map(({ document }) => ({
          id: document.id,
          title: document.title,
          examples: document.examples.length,
        })),
      });
    },
  );
  server.registerTool(
    'get_document',
    {
      description:
        'Read a component API or guide. Use the exact ID from search_components, e.g. components/button or guide/getting-started. Examples are fetched separately to keep context small.',
      inputSchema: z.object({ id: z.string(), language }),
      annotations,
    },
    async ({ id, language }) => {
      const document = content.documents.find((item) => item.id === id);
      return document
        ? reply({
            id,
            title: document.title[language],
            markdown: document.body[language],
            examples: document.examples.map((example) => ({
              name: example.name,
              title: example.title[language],
            })),
          })
        : reply(`Unknown document: ${id}. Use search_components to find available IDs.`, true);
    },
  );
  server.registerTool(
    'list_examples',
    {
      description: 'List real Vue demos for a component, including descriptions.',
      inputSchema: z.object({ component: z.string(), language }),
      annotations,
    },
    async ({ component, language }) => {
      const document = content.documents.find((item) => item.id === `components/${component}`);
      return document
        ? reply(
            document.examples.map((example) => ({
              name: example.name,
              title: example.title[language],
              description: example.description[language],
            })),
          )
        : reply(`Unknown component: ${component}`, true);
    },
  );
  server.registerTool(
    'get_example',
    {
      description:
        'Read actual Vue demo source and all local helper files. Public package imports match the documentation site. Use names from list_examples.',
      inputSchema: z.object({ component: z.string(), name: z.string(), language }),
      annotations,
    },
    async ({ component, name, language }) => {
      const example = content.documents
        .find((item) => item.id === `components/${component}`)
        ?.examples.find((item) => item.name === name);
      return example
        ? reply({
            name,
            title: example.title[language],
            description: example.description[language],
            files: example.sources,
          })
        : reply(`Unknown example: ${component}/${name}`, true);
    },
  );
  return server;
}
