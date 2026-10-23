/** Integrity and review records for Apollo-owned screenshots. No browser dependencies. */
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';

export const digest = (file) =>
  crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex');
export const readManifest = (directory) => {
  const file = path.join(directory, 'manifest.json');
  return fs.existsSync(file) ? JSON.parse(fs.readFileSync(file, 'utf8')) : { entries: {} };
};
export function imagePath(directory, id) {
  if (!/^[a-z0-9-]+\/[a-zA-Z0-9_-]+$/.test(id)) throw new Error(`Invalid screenshot id: ${id}`);
  return path.join(directory, `${id}.png`);
}
export function checkEntry(directory, id, entry) {
  if (!entry) return 'missing-approved-baseline';
  if (!entry.reviewNote?.trim() || !entry.reviewedAt) return 'missing-review';
  const file = imagePath(directory, id);
  if (!fs.existsSync(file)) return 'missing-image';
  if (digest(file) !== entry.sha256) return 'image-hash-mismatch';
  return null;
}
export function acceptCandidates(candidateDir, baselineDir, ids, reviewNote) {
  if (!reviewNote?.trim())
    throw new Error('Acceptance requires --review-note explaining the visual review.');
  if (ids.length === 0) throw new Error('No candidates selected');
  const candidates = readManifest(candidateDir);
  if (!candidates.complete) throw new Error('Candidate capture is incomplete or failed');
  for (const id of ids) {
    const entry = candidates.entries[id];
    if (!entry || !fs.existsSync(imagePath(candidateDir, id)))
      throw new Error(`Missing candidate: ${id}`);
    if (digest(imagePath(candidateDir, id)) !== entry.sha256)
      throw new Error(`Candidate changed after capture: ${id}`);
    if (!entry.environment || !entry.sourceCommit)
      throw new Error(`Candidate provenance missing: ${id}`);
  }
  const approved = readManifest(baselineDir);
  for (const id of ids) {
    const entry = candidates.entries[id];
    const destination = imagePath(baselineDir, id);
    fs.mkdirSync(path.dirname(destination), { recursive: true });
    fs.copyFileSync(imagePath(candidateDir, id), destination);
    approved.entries[id] = { ...entry, reviewedAt: new Date().toISOString(), reviewNote };
  }
  fs.mkdirSync(baselineDir, { recursive: true });
  fs.writeFileSync(
    path.join(baselineDir, 'manifest.json'),
    `${JSON.stringify(approved, null, 2)}\n`,
  );
}

/** Detect visually identical variants within one component/theme/viewport/environment. */
export function duplicateProblems(entries, definitions) {
  const groups = new Map();
  for (const [id, entry] of Object.entries(entries)) {
    const [component, sample] = id.split('/');
    const [variant, theme, viewport] = sample.split('__');
    const key = `${component}/${theme}/${viewport}/${entry.environment}/${entry.sha256}`;
    if (!groups.has(key)) groups.set(key, { component, variants: [] });
    groups.get(key).variants.push(variant);
  }
  return [...groups.values()].flatMap(({ component, variants }) => {
    if (variants.length < 2) return [];
    const allowed = definitions[component]?.duplicateAllow?.some(
      (allowance) =>
        allowance.reason?.trim() &&
        variants.every((variant) => allowance.variants.includes(variant)),
    );
    return allowed
      ? []
      : [
          `${component}: identical variants ${variants.join(', ')} require an explicit scenario explanation`,
        ];
  });
}
