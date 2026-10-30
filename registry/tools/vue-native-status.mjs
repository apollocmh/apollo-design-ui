#!/usr/bin/env node
/** The single audit-state entry. Reads are pure; explicit mutations hold an exclusive short lock. */
import fs from 'node:fs';
import path from 'node:path';
import { parseArgs } from 'node:util';
import {
  readAudit,
  recoverAuditLock,
  summarizeAudit,
  updateAudit,
  validateAudit,
} from './audit-workflow.mjs';

const { values } = parseArgs({
  options: {
    check: { type: 'boolean' },
    json: { type: 'boolean' },
    help: { type: 'boolean' },
    'source-root': { type: 'string', default: path.resolve(import.meta.dirname, '../..') },
    claim: { type: 'string' },
    release: { type: 'string' },
    complete: { type: 'string' },
    owner: { type: 'string' },
    report: { type: 'string' },
    'recover-lock': { type: 'boolean' },
  },
});
const root = path.resolve(values['source-root']);
try {
  if (values.help) {
    console.log(
      'vue-native-status.mjs [--check|--json] [--claim ID|--release ID|--complete ID --report file] --owner name\nMutations are for the integrator. Completion records architecture only. A paused round cannot claim new tasks. --recover-lock removes a lock only after its process has exited.',
    );
  } else {
    const actions = [values.claim, values.release, values.complete, values['recover-lock']].filter(
      Boolean,
    );
    if (actions.length > 1) throw new Error('Choose one state action');
    if (values.check && actions.length) throw new Error('--check never writes state');
    let doc;
    if (values['recover-lock']) {
      recoverAuditLock(root);
      doc = readAudit(root);
    } else if (actions.length) {
      if (!values.owner) throw new Error('A task owner is required');
      doc = updateAudit(root, (current) => {
        const id = values.claim ?? values.release ?? values.complete;
        const task = current.tasks.find((task) => task.id === id);
        if (!task) throw new Error(`Unknown task: ${id}`);
        if (values.claim) {
          if (current.dispatch.status !== 'running' || current.phase !== 'architecture')
            throw new Error('Audit dispatch is paused');
          if (task.assignment !== null)
            throw new Error(`${id} is already assigned; resume its recorded owner`);
          if (!['not_started', 'partial'].includes(task.architectureStatus))
            throw new Error(`${id} is not available for new work`);
          if (
            task.workDependencies.some(
              (dependency) =>
                current.tasks.find((item) => item.id === dependency).architectureStatus !== 'done',
            )
          )
            throw new Error(`${id} has unfinished architecture dependencies`);
          if (task.issues.some((issue) => issue.blocking && issue.status !== 'fixed'))
            throw new Error(`${id} has a blocking issue`);
          task.architectureStatus = 'in_progress';
          task.assignment = {
            owner: values.owner,
            baseRevision: current.revision,
            startedAt: new Date().toISOString(),
          };
        } else {
          if (task.assignment?.owner !== values.owner)
            throw new Error(`${id}: task belongs to another owner`);
          if (values.release) {
            task.architectureStatus = 'partial';
            task.assignment = null;
          } else {
            if (!values.report)
              throw new Error('Architecture completion needs the focused check report');
            const reportPath = path.resolve(root, values.report);
            const report = JSON.parse(fs.readFileSync(reportPath, 'utf8'));
            if (
              report.passed !== true ||
              !report.checks?.length ||
              report.checks.some((check) => check.exitCode !== 0 || check.signal)
            )
              throw new Error('Focused validation failed or is incomplete');
            for (const kind of ['core', 'types'])
              if (!report.checks.some((check) => check.kind === kind))
                throw new Error(`Missing focused ${kind} check`);
            if (
              !report.scope?.some((scope) =>
                task.owns.some((owned) => scope === owned || owned.startsWith(`${scope}/`)),
              )
            )
              throw new Error('Check report does not cover this task');
            task.architectureStatus = 'done';
            task.assignment = null;
            task.verification = report;
          }
        }
      });
    } else doc = validateAudit(readAudit(root), root);
    const summary = summarizeAudit(doc);
    if (values.json) console.log(JSON.stringify(summary, null, 2));
    else
      console.log(
        `[vue-native] phase=${summary.phase}; dispatch=${summary.dispatch}; architecture components=${summary.components.architectureDone}/${summary.components.total}; historical acceptance=${summary.components.historicalAccepted}; final acceptance=${summary.finalAcceptance}; active=${summary.activeTasks.length}`,
      );
  }
} catch (error) {
  console.error(`[vue-native] ${error.message}`);
  process.exitCode = 1;
}
