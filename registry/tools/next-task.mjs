#!/usr/bin/env node
/** Read-only architecture task suggestions; suggestions never claim or start work. */
import path from 'node:path';
import { parseArgs } from 'node:util';
import {
  readAudit,
  recommendTasks,
  summarizeAudit,
  taskBrief,
  validateAudit,
} from './audit-workflow.mjs';

const root = path.resolve(import.meta.dirname, '../..');
try {
  const { values } = parseArgs({
    options: {
      json: { type: 'boolean' },
      parallel: { type: 'boolean' },
      all: { type: 'boolean' },
      component: { type: 'string' },
      foundation: { type: 'boolean' },
      help: { type: 'boolean' },
      brief: { type: 'boolean' },
    },
  });
  if (values.help) {
    console.log(
      'next-task.mjs [--json] [--parallel] [--all] [--component name] [--foundation] [--brief]\nRead-only. Prioritize dependency unlocks and assessed remaining work; partial does not imply small. --brief derives a handoff from current state and evidence. A paused round returns no new tasks.',
    );
  } else {
    const doc = validateAudit(readAudit(root), root);
    const selected = values.component
      ? doc.tasks.filter((task) => task.id === `CMP:${values.component}`)
      : values.foundation
        ? doc.tasks.filter((task) => task.kind === 'foundation')
        : values.all
          ? doc.tasks
          : recommendTasks(doc, values.parallel ? doc.dispatch.maxParallel : 1);
    if (values.component && !selected.length)
      throw new Error(`Unknown component: ${values.component}`);
    const result = {
      source: 'registry/vue-native-audit.json',
      summary: summarizeAudit(doc),
      activeTasks: doc.tasks.filter((task) => task.assignment !== null),
      suggestions: selected,
      next: selected[0] ?? null,
      ...(values.brief ? { briefs: selected.map((task) => taskBrief(doc, task)) } : {}),
    };
    if (values.json) console.log(JSON.stringify(result, null, 2));
    else {
      console.log(
        `Audit phase=${doc.phase}; dispatch=${doc.dispatch.status}; active=${result.activeTasks.length}/${doc.dispatch.maxParallel}`,
      );
      for (const task of selected)
        console.log(
          `${task.id}  architecture=${task.architectureStatus}  acceptance=${task.acceptanceStatus}${task.assignment ? `  owner=${task.assignment.owner}` : ''}`,
        );
      if (!selected.length)
        console.log('No new tasks suggested. Existing work and evidence are retained.');
      for (const brief of result.briefs ?? []) {
        console.log(
          `\n${brief.id}: ${brief.goal}\nRemaining effort: ${brief.effort}\nOwns: ${brief.owns.join(', ')}`,
        );
        for (const item of brief.remaining) console.log(`  - ${item}`);
        console.log(
          `Known issues: ${brief.issues.map((issue) => issue.id).join(', ') || 'none recorded; not a fresh pass'}`,
        );
        console.log(
          `Work dependencies: ${brief.dependencies.map((item) => `${item.id}=${item.status}`).join(', ') || 'none'}`,
        );
        console.log(`Shared decisions: ${brief.decisions.join(', ')}`);
        console.log(`Existing evidence: ${brief.evidence.join(', ')}`);
        console.log(
          `Minimum verification:\n${brief.minimumVerification.map((command) => `  ${command}`).join('\n')}`,
        );
      }
    }
  }
} catch (error) {
  console.error(`[next] ${error.message}`);
  process.exitCode = 1;
}
