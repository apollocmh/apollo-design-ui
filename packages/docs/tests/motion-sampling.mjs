/** A 60Hz rAF observation may drift by half a frame, but cannot stand for missed frames. */
export const MAX_SAMPLE_INTERVAL_MS = (1000 / 60) * 1.5;

export function assessSampling(data, { text, read }) {
  const points = data.frames.flatMap((frame) => {
    const node =
      text === undefined ? frame.nodes[0] : frame.nodes.find((item) => item.text.includes(text));
    return node ? [{ t: frame.t, value: read(node) }] : [];
  });
  const initialNode =
    text === undefined
      ? data.initial?.nodes[0]
      : data.initial?.nodes.find((item) => item.text.includes(text));
  if (initialNode) points.unshift({ t: data.initial.t, value: read(initialNode) });
  const insertion = data.mutations.find((node) => text === undefined || node.text.includes(text));
  if (insertion && points.length && insertion.t < points[0].t)
    points.unshift({ t: insertion.t, value: read(insertion) });
  const changes = points.flatMap((point, index) =>
    index && Math.abs(point.value - points[index - 1].value) > 0.01 ? [index] : [],
  );
  const start = changes.length ? changes[0] - 1 : 0;
  const end = changes.length ? changes.at(-1) : points.length - 1;
  const intervals = points.slice(start + 1, end + 1).map((point, index) => ({
    from: points[start + index],
    to: point,
    durationMs: point.t - points[start + index].t,
  }));
  const gaps = intervals.filter((interval) => interval.durationMs > MAX_SAMPLE_INTERVAL_MS);
  const reasons = [];
  if (points.length < 2) reasons.push(`Only ${points.length} observations`);
  if (data.diagnostics.environment.hidden || data.diagnostics.environment.reducedMotion)
    reasons.push('Page is hidden or reduced motion is enabled');
  if (data.diagnostics.visibilityChanges.some((change) => change.hidden))
    reasons.push('Page became hidden during observation');
  if (gaps.length)
    reasons.push(
      `Missed motion samples: ${gaps.map((gap) => `${gap.durationMs.toFixed(2)}ms at ${gap.from.t.toFixed(2)}–${gap.to.t.toFixed(2)}ms`).join(', ')} (limit ${MAX_SAMPLE_INTERVAL_MS}ms)`,
    );
  return { valid: reasons.length === 0, reasons, points, intervals, gaps };
}

export function motionCheck(passed, quality, { definiteFailure = false } = {}) {
  const status =
    !passed && definiteFailure
      ? 'failed'
      : !quality.valid
        ? 'sampling-invalid'
        : passed
          ? 'passed'
          : 'failed';
  return { ok: status === 'passed', status, reason: quality.reasons.join('; ') };
}

export function assessDisplacement(data, options) {
  const quality = assessSampling(data, options);
  const values = quality.points.map((point) => point.value);
  const distance = Math.abs(values.at(-1) - values[0]);
  const maxStep = Math.max(
    ...values.slice(1).map((value, index) => Math.abs(value - values[index])),
  );
  const observedAssertion = distance > 0 && maxStep < distance / 2;
  const definiteFailure =
    distance > 0 &&
    quality.intervals.some(
      (interval) =>
        interval.durationMs <= MAX_SAMPLE_INTERVAL_MS &&
        Math.abs(interval.to.value - interval.from.value) >= distance / 2,
    );
  return {
    ...motionCheck(observedAssertion, quality, { definiteFailure }),
    quality,
    observedAssertion,
    definiteFailure,
    distance,
    maxStep,
  };
}
