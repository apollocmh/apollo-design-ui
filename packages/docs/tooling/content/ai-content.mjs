import fs from 'node:fs';
import path from 'node:path';
import { collectDemoSources } from './demo-source.mjs';

export const SITE = 'https://apollocmh.github.io/apollo-design-ui/';

function resolveLinks(markdown, directory, sourceCommit) {
  let fenceMark = null;
  return markdown
    .split('\n')
    .map((line) => {
      const mark = /^\s*(`{3,}|~{3,})/.exec(line)?.[1];
      if (mark) {
        if (!fenceMark) fenceMark = mark;
        else if (mark[0] === fenceMark[0] && mark.length >= fenceMark.length) fenceMark = null;
        return line;
      }
      if (fenceMark) return line;
      return line.replace(/\]\(([^\s)]+)\)/g, (original, href) => {
        if (/^(?:[a-z]+:|\/\/|#)/i.test(href)) return original;
        if (href.startsWith('/')) return `](${SITE}${href.slice(1)})`;
        const relative = path.posix.normalize(`${directory}/${href}`);
        const kind = href === './demo' ? 'tree' : 'blob';
        return `](https://github.com/apollocmh/apollo-design-ui/${kind}/${sourceCommit}/${relative})`;
      });
    })
    .join('\n');
}

function fence(source) {
  const runs = source.code.match(/`+/g) ?? [];
  const ticks = '`'.repeat(Math.max(3, ...runs.map((run) => run.length + 1)));
  return `### ${source.path}\n\n${ticks}${source.lang}\n${source.code.trimEnd()}\n${ticks}`;
}

export function createAiContent({ components, guides, version, sourceCommit }) {
  const documents = [
    ...guides
      .filter((guide) => guide.slug !== 'audit-progress')
      .map((guide) => ({
        id: `guide/${guide.slug}`,
        title: guide.title,
        body: Object.fromEntries(
          ['zh', 'en'].map((language) => [
            language,
            resolveLinks(guide.body[language], 'packages/docs/content/guide', sourceCommit),
          ]),
        ),
        examples: [],
      })),
    ...components.map((component) => ({
      id: `components/${component.name}`,
      title: component.title,
      body: Object.fromEntries(
        ['zh', 'en'].map((language) => [
          language,
          resolveLinks(component.body[language], component.relDir, sourceCommit),
        ]),
      ),
      examples: component.demos.map((demo) => ({
        name: demo.name,
        title: demo.title,
        description: Object.fromEntries(
          ['zh', 'en'].map((language) => [
            language,
            resolveLinks(demo.desc[language], `${component.relDir}/demo`, sourceCommit),
          ]),
        ),
        sources: collectDemoSources(demo.vuePath),
      })),
    })),
  ];
  const files = {};
  for (const language of ['zh', 'en']) {
    const suffix = language === 'zh' ? '' : '.en';
    const intro = `# Apollo Design\n\n> Independent Vue 3 native UI library. Use Apollo's documented APIs, not assumptions from React or other UI libraries.\n\nUI version: ${version}\nSource commit: ${sourceCommit}\n\nImport tokens before component CSS: \`@apollo-design/theme/tokens.css\`, then \`@apollo-design/ui/style.css\`.\n`;
    const entries = [];
    for (const document of documents) {
      const name = `${document.id}${suffix}.md`;
      const examples = document.examples.map(
        (example) =>
          `## ${example.title[language]} (${example.name})\n\n${example.description[language]}\n\n${example.sources.map(fence).join('\n\n')}`,
      );
      const markdown = `# ${document.title[language]}\n\nUI version: ${version}\nSource commit: ${sourceCommit}\nPage: ${SITE}${document.id}\n\n${document.body[language]}\n\n${examples.join('\n\n')}\n`;
      files[name] = markdown;
      // Retain raw Markdown for MCP; it can return just the API without all examples.
      entries.push(`- [${document.title[language]}](${SITE}${name})`);
    }
    files[`llms-full${suffix}.txt`] =
      `${intro}\n${documents.map((document) => files[`${document.id}${suffix}.md`]).join('\n---\n\n')}`;
    files[`llms${suffix}.txt`] =
      `${intro}\n## Documentation\n\n${entries.join('\n')}\n\n## Full text\n\n- [Chinese documentation and examples](${SITE}llms-full.txt)\n- [English documentation and examples](${SITE}llms-full.en.txt)\n\nRead individual pages when possible; the full text may exceed your context window. These files provide context, not model training.\n`;
  }
  return { bundle: { version, sourceCommit, documents }, files };
}

export function writeAiFiles(directory, files) {
  for (const [name, content] of Object.entries(files)) {
    const target = path.join(directory, name);
    fs.mkdirSync(path.dirname(target), { recursive: true });
    fs.writeFileSync(target, content);
  }
}
