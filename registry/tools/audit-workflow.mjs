/** Current audit state and task ownership. Import graphs describe impact, not work blockers. */
import fs from 'node:fs';
import path from 'node:path';

export const AUDIT_FILE = 'registry/vue-native-audit.json';
const sharedPaths = [
  'registry',
  'package.json',
  'vitest.config.ts',
  'vitest.setup.ts',
  'packages/ui/src/index.ts',
  'packages/ui/src/style',
  'packages/docs/content/guide/audit-progress.md',
];
const within = (file, directory) => file === directory || file.startsWith(`${directory}/`);
const overlaps = (left, right) => within(left, right) || within(right, left);
const readJson = (file) => JSON.parse(fs.readFileSync(file, 'utf8'));
const effortOrder = { small: 0, medium: 1, unknown: 2, large: 3 };

export function readAudit(root) {
  return readJson(path.join(root, AUDIT_FILE));
}

function localPath(root, value) {
  if (typeof value !== 'string' || !value || path.isAbsolute(value))
    throw new Error(`Expected a repository-relative path: ${value}`);
  const relative = path.relative(root, path.resolve(root, value));
  if (relative.startsWith('..') || relative.includes('\\'))
    throw new Error(`Path outside repository: ${value}`);
  return relative;
}

export function summarizeAudit(doc) {
  const group = (kind) => {
    const tasks = doc.tasks.filter((task) => task.kind === kind);
    return {
      total: tasks.length,
      architectureDone: tasks.filter((task) => task.architectureStatus === 'done').length,
      historicalAccepted: tasks.filter((task) => task.historicalAcceptance?.length).length,
      finalAccepted: tasks.filter((task) => task.acceptanceStatus === 'passed').length,
      partial: tasks.filter((task) => task.architectureStatus === 'partial').length,
      active: tasks.filter((task) => task.assignment !== null).length,
      notStarted: tasks.filter((task) => task.architectureStatus === 'not_started').length,
      blocked: tasks.filter((task) => task.architectureStatus === 'blocked').length,
    };
  };
  return {
    phase: doc.phase,
    dispatch: doc.dispatch.status,
    components: group('component'),
    foundations: group('foundation'),
    activeTasks: doc.tasks.filter((task) => task.assignment !== null).map((task) => task.id),
    finalAcceptance: doc.finalAcceptance.status,
  };
}

export function validateAudit(doc, root) {
  if (doc.schemaVersion !== 2 || !Array.isArray(doc.tasks))
    throw new Error('Expected schemaVersion 2 and tasks[]');
  if (!['architecture', 'acceptance'].includes(doc.phase)) throw new Error('Unknown audit phase');
  if (!['paused', 'running'].includes(doc.dispatch.status))
    throw new Error('Unknown dispatch status');
  if (!Number.isInteger(doc.revision) || doc.revision < 0) throw new Error('Invalid revision');
  if (
    !Number.isInteger(doc.dispatch.maxParallel) ||
    doc.dispatch.maxParallel < 1 ||
    doc.dispatch.maxParallel > 5
  )
    throw new Error('Parallel task limit must be between 1 and 5');
  if (!doc.dispatch.integrator) throw new Error('An integrator must own shared files');
  const schema = readJson(path.join(root, 'registry/vue-native-audit.schema.json'));
  const taskSchema = schema.$defs.Task.properties;
  if (
    !schema.properties.finalAcceptance.properties.status.enum.includes(doc.finalAcceptance.status)
  )
    throw new Error('Unknown final acceptance status');
  const byId = new Map(doc.tasks.map((task) => [task.id, task]));
  if (byId.size !== doc.tasks.length) throw new Error('Duplicate task ID');
  const expected = new Set([
    ...readJson(path.join(root, 'registry/components.json')).components.map(
      (row) => `CMP:${row.name}`,
    ),
    ...readJson(path.join(root, 'registry/foundation.json')).packages.map(
      (row) => `FND:${row.dir}`,
    ),
  ]);
  for (const id of expected) if (!byId.has(id)) throw new Error(`Missing audit task: ${id}`);
  const active = [];
  for (const task of doc.tasks) {
    if (!['component', 'foundation', 'shared'].includes(task.kind))
      throw new Error(`${task.id}: unknown task kind`);
    if (task.kind !== 'shared' && !expected.has(task.id))
      throw new Error(`Unknown task: ${task.id}`);
    if (
      task.kind !== 'shared' &&
      task.id !== `${task.kind === 'component' ? 'CMP' : 'FND'}:${task.ref}`
    )
      throw new Error(`${task.id}: task identity does not match its metadata`);
    if (
      !taskSchema.architectureStatus.enum.includes(task.architectureStatus) ||
      !taskSchema.acceptanceStatus.enum.includes(task.acceptanceStatus)
    )
      throw new Error(`${task.id}: invalid phase status`);
    if (!Array.isArray(task.owns) || !task.owns.length)
      throw new Error(`${task.id}: missing ownership`);
    for (const ownerPath of task.owns) localPath(root, ownerPath);
    if (task.plan) {
      if (
        !task.plan.goal ||
        !Array.isArray(task.plan.remaining) ||
        !task.plan.remaining.length ||
        task.plan.remaining.some((item) => typeof item !== 'string' || !item.trim()) ||
        !Object.hasOwn(effortOrder, task.plan.effort) ||
        !Array.isArray(task.plan.basis) ||
        !task.plan.basis.length
      )
        throw new Error(`${task.id}: plan needs a goal, remaining work, effort and evidence basis`);
    }
    for (const file of [
      ...task.evidence,
      ...task.existingWork,
      ...(task.historicalAcceptance ?? []),
      ...(task.plan?.basis ?? []),
      ...(task.plan?.decisions ?? []),
    ]) {
      const relative = localPath(root, file);
      if (!fs.existsSync(path.join(root, relative)))
        throw new Error(`${task.id}: missing evidence ${file}`);
    }
    for (const dependency of task.workDependencies) {
      if (!byId.has(dependency))
        throw new Error(`${task.id}: unknown work dependency ${dependency}`);
    }
    for (const issue of task.issues) {
      if (issue.status === 'deferred' && (!issue.impact || !issue.reason || issue.blocking))
        throw new Error(`${task.id}: deferral needs impact/reason and cannot hide a blocker`);
      if (task.architectureStatus === 'done' && issue.blocking && issue.status !== 'fixed')
        throw new Error(`${task.id}: unresolved blocking issue ${issue.id}`);
    }
    if (task.architectureStatus === 'done') {
      if (!task.evidence.length && task.verification?.passed !== true)
        throw new Error(`${task.id}: completed work needs evidence`);
      if (task.verification) {
        if (
          task.verification.passed !== true ||
          !task.verification.checks?.length ||
          task.verification.checks.some((check) => check.exitCode !== 0 || check.signal)
        )
          throw new Error(`${task.id}: focused verification did not pass`);
        for (const kind of ['core', 'types'])
          if (!task.verification.checks.some((check) => check.kind === kind))
            throw new Error(`${task.id}: missing focused ${kind} check`);
      }
      for (const id of task.workDependencies)
        if (byId.get(id).architectureStatus !== 'done')
          throw new Error(`${task.id}: unfinished architecture dependency ${id}`);
    }
    if (task.acceptanceStatus === 'passed' && doc.finalAcceptance.status !== 'passed')
      throw new Error(`${task.id}: final acceptance has not passed`);
    if (task.assignment !== null) {
      if (
        task.architectureStatus !== 'in_progress' ||
        !task.assignment.owner ||
        !Number.isInteger(task.assignment.baseRevision) ||
        !task.assignment.startedAt
      )
        throw new Error(`${task.id}: invalid active assignment`);
      if (
        task.assignment.owner !== doc.dispatch.integrator &&
        task.owns.some((file) => sharedPaths.some((shared) => overlaps(file, shared)))
      )
        throw new Error(`${task.id}: shared files belong to the integrator`);
      active.push(task);
    }
  }
  if (active.length > doc.dispatch.maxParallel)
    throw new Error('Active tasks exceed the parallel limit');
  for (let i = 0; i < active.length; i++)
    for (const other of active.slice(i + 1)) {
      if (active[i].owns.some((left) => other.owns.some((right) => overlaps(left, right))))
        throw new Error(`Ownership conflict: ${active[i].id} / ${other.id}`);
    }
  const visiting = new Set(),
    visited = new Set();
  const visit = (task) => {
    if (visiting.has(task.id)) throw new Error(`Work dependency cycle: ${task.id}`);
    if (visited.has(task.id)) return;
    visiting.add(task.id);
    for (const id of task.workDependencies) visit(byId.get(id));
    visiting.delete(task.id);
    visited.add(task.id);
  };
  for (const task of doc.tasks) visit(task);
  if (doc.phase === 'acceptance' && doc.tasks.some((task) => task.architectureStatus !== 'done'))
    throw new Error('The acceptance phase starts after architecture work is complete');
  if (doc.finalAcceptance.status === 'passed') {
    if (doc.tasks.some((task) => task.architectureStatus !== 'done'))
      throw new Error('Final acceptance requires all architecture work to be complete');
    if (!doc.finalAcceptance.sourceCommit)
      throw new Error('Final acceptance needs a frozen commit');
    for (const dimension of [
      'api',
      'tokens',
      'styles',
      'unit',
      'interaction',
      'types',
      'a11y',
      'visual',
      'docs',
    ]) {
      const gate = doc.finalAcceptance.gates.find((gate) => gate.dimension === dimension);
      if (gate?.status !== 'passed' || gate.sourceCommit !== doc.finalAcceptance.sourceCommit)
        throw new Error(`Final acceptance lacks a passed frozen-version gate: ${dimension}`);
    }
  }
  return doc;
}

export function recommendTasks(doc, limit = doc.dispatch.maxParallel) {
  if (doc.dispatch.status !== 'running' || doc.phase !== 'architecture') return [];
  const byId = new Map(doc.tasks.map((task) => [task.id, task]));
  const selected = [],
    occupied = doc.tasks.filter((task) => task.assignment !== null);
  const ranked = doc.tasks
    .map((task) => ({
      task,
      unlocks: doc.tasks.filter(
        (other) =>
          ['not_started', 'partial'].includes(other.architectureStatus) &&
          other.assignment === null &&
          other.workDependencies.includes(task.id) &&
          other.workDependencies.every(
            (id) => id === task.id || byId.get(id).architectureStatus === 'done',
          ),
      ).length,
    }))
    .sort(
      (left, right) =>
        right.unlocks - left.unlocks ||
        effortOrder[left.task.plan?.effort ?? 'unknown'] -
          effortOrder[right.task.plan?.effort ?? 'unknown'] ||
        Number(right.task.architectureStatus === 'partial') -
          Number(left.task.architectureStatus === 'partial'),
    );
  for (const { task } of ranked) {
    if (selected.length >= Math.min(limit, doc.dispatch.maxParallel - occupied.length)) break;
    if (!['not_started', 'partial'].includes(task.architectureStatus) || task.assignment !== null)
      continue;
    if (task.workDependencies.some((id) => byId.get(id).architectureStatus !== 'done')) continue;
    if (
      [...occupied, ...selected].some((other) =>
        task.owns.some((left) => other.owns.some((right) => overlaps(left, right))),
      )
    )
      continue;
    selected.push(task);
  }
  return selected;
}

/** A derived task handoff, not another manually maintained status document. */
export function taskBrief(doc, task) {
  const done = task.architectureStatus === 'done';
  return {
    id: task.id,
    goal: done
      ? `${task.title} 架构整改已完成，沿用有效成果`
      : (task.plan?.goal ?? `完成 ${task.title} 剩余的 Vue 原生契约整改，保留已有成果`),
    remaining: done
      ? []
      : (task.plan?.remaining ?? ['尚未评估剩余范围；先对照已有证据核对差额，不重新扫描全仓']),
    effort: task.plan?.effort ?? 'unknown',
    owns: task.owns,
    owner: task.assignment?.owner ?? null,
    dependencies: task.workDependencies.map((id) => ({
      id,
      status: doc.tasks.find((other) => other.id === id).architectureStatus,
    })),
    issues: task.issues.filter((issue) => issue.status !== 'fixed'),
    decisions: [
      ...new Set([
        'ARCHITECTURE.md',
        'COMPONENT-RULES.md',
        'COMPATIBILITY.md',
        ...(task.plan?.decisions ?? []),
      ]),
    ],
    evidence: [...new Set([...(task.plan?.basis ?? []), ...task.evidence, ...task.existingWork])],
    minimumVerification: done
      ? ['不重新审计；仅补查明确的新变更影响，最终九维仍在冻结版本统一执行']
      : [
          task.kind === 'component'
            ? `pnpm verify:component ${task.ref}`
            : 'pnpm verify:changed --base <task-start-commit>',
          '共享契约变化时：pnpm verify:changed --base <task-start-commit>，及时验证实际消费者',
          '涉及 Demo/交互时补已有定向浏览器检查；源码、依赖、配置和范围均未变才复用原检查',
        ],
  };
}

/** One short exclusive write; no queue, daemon, retries or secondary status store. */
export function updateAudit(root, mutate) {
  const file = path.join(root, AUDIT_FILE),
    lock = `${file}.lock`;
  let handle;
  try {
    handle = fs.openSync(lock, 'wx');
  } catch (error) {
    if (error.code === 'EEXIST') throw new Error('Audit state is locked; no changes written');
    throw error;
  }
  const temporary = `${file}.${process.pid}.tmp`;
  try {
    fs.writeFileSync(handle, JSON.stringify({ pid: process.pid }));
    const doc = readAudit(root);
    validateAudit(doc, root);
    mutate(doc);
    doc.revision += 1;
    validateAudit(doc, root);
    fs.writeFileSync(temporary, `${JSON.stringify(doc, null, 2)}\n`, { flag: 'wx' });
    fs.renameSync(temporary, file);
    return doc;
  } finally {
    fs.closeSync(handle);
    fs.unlinkSync(lock);
    if (fs.existsSync(temporary)) fs.unlinkSync(temporary);
  }
}

export function recoverAuditLock(root) {
  const lock = path.join(root, `${AUDIT_FILE}.lock`);
  const owner = readJson(lock);
  if (!Number.isInteger(owner.pid) || owner.pid <= 0)
    throw new Error('Inspect the invalid lock manually');
  try {
    process.kill(owner.pid, 0);
  } catch (error) {
    if (error.code !== 'ESRCH') throw error;
    fs.unlinkSync(lock);
    return;
  }
  throw new Error(`Lock owner ${owner.pid} is still running`);
}
