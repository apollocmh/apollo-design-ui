---
category: Data Display
title: Statistic
subtitle: Statistics
---

Display numeric values and clocks using native Vue content. Values and targets are supplied by the caller; there is no v-model or built-in numeric animation.

## Examples

All seven examples remain: basic/loading, units, card layout, formatted native values, restartable clocks with live direction, semantic styles and component tokens. The historical animated URL demonstrates formatting, without claiming an animation engine.

## Statistic Props

| Prop | Behavior | Type | Default |
|---|---|---|---|
| prefixCls | Current class prefix; custom prefixes require matching static CSS | `string` | Provider prefix + `-statistic` |
| value | Raw numeric value or literal nonnumeric text | `number \| string` | `0` |
| title / prefix / suffix | Text fallback; an existing slot takes precedence, including an empty slot | `string` | — |
| precision | Truncate/pad decimal digits, negative to zero, fractions toward zero; ignore nonfinite values; no rounding | `number` | Preserve input decimals |
| decimalSeparator | Literal decimal separator | `string` | `'.'` |
| groupSeparator | Literal grouping text, including dollar replacement characters | `string` | `','` |
| loading | Replace/unmount content with Skeleton; rebuild content when restored | `boolean` | `false` |
| valueStyle | Existing deprecated content style alias; styles.content wins; existing setup-time warning retained | `CSSProperties` | — |
| classNames / styles | Seven semantic targets; object or `({ props }) => object` using current props/Provider | Exported types | — |
| onMouseenter / onMouseleave | Native root mouse listeners, also `@mouseenter`/`@mouseleave` | `(event: MouseEvent) => void` | — |

## Slots

| Slot | Scope | Behavior |
|---|---|---|
| title / prefix / suffix | None | Complete Vue content; intentional empty content suppresses fallback props |
| value | `{ value: number \| string, text: string }` | Raw value and current formatted text; write native template content instead of wrapping internal VNodes |

The value semantic container remains available for class/style, including an empty value slot. Numeric updates, formatting and adjacent slots retain native editors; loading unmounts content.

## Statistic.Timer / StatisticTimer

Share presentation props, title/prefix/suffix slots and all seven semantic targets. Numeric precision/decimalSeparator/groupSeparator are excluded because clock text uses format.

| Prop | Behavior | Type | Default |
|---|---|---|---|
| type | Required, reactive direction | `'countdown' \| 'countup'` | — |
| value | Target timestamp or Date-parseable string; future for countdown, past for countup | `number \| string` | `0` |
| format | Y/M/D/H/m/s/S units, repeated zero padding and `[literal]` escapes; fixed 365-day years / 30-day months | `string` | `'HH:mm:ss'` |

| Event | Payload | Timing |
|---|---|---|
| change | Nonnegative milliseconds, `number` | Immediately after mount and approximately every 1000/60ms; never during SSR or for invalid dates |
| finish | None | Once per completed countdown cycle, after change(0); stops scheduling; target/direction changes start a new cycle |

The Timer value slot receives `{ value, text, duration, type }`. Value is the original target; duration is nonnegative milliseconds or null before mount/for invalid dates, when text is `'-'`. Other slots are forwarded directly.

SSR and hydration start with `'-'`. Effects begin after mounting, read actual Date.now and clean up on unmount. Invalid dates do not schedule or emit; a valid target restarts the clock. Format changes do not restart completed cycles. Background tabs can throttle callbacks; elapsed time is not accumulated from frame counts.

## Statistic.Countdown / StatisticCountdown

The existing fixed-countdown export shares presentation, format, slots, events and the actual root ref; type is injected. Its existing development deprecation notice remains. Named and attached component exports have identical implementations and precise types; no legacy content callbacks are retained.

## Attrs, ref, Provider and tokens

Class/style, id/tabindex, ARIA/data and native listeners target the actual root div. All Vue style forms work. Timer change/finish are business events; input change events do not become duration notifications. All three components expose `nativeElement: HTMLDivElement | null`, cleared on unmount.

Semantic targets: root/header/title/content/value/prefix/suffix. Provider `components.statistic` className/style/classNames/styles follow current replacement/removal; local semantic configuration wins and native attrs styles apply last. Source themes use `theme.components.Statistic`; nearest providers, RTL and neighboring instances remain independent.

| Token | Default | CSS variable |
|---|---|---|
| titleFontSize | Current fontSize, initially 14 | `--apollo-statistic-title-font-size` |
| contentFontSize | Current fontSizeHeading3, initially 24 | `--apollo-statistic-content-font-size` |

Tokens accept finite nonnegative numbers, revert to current aliases when removed and yield to native CSS variables. Theme changes retain native editors. Callers own custom-color contrast and announcement policy; clocks do not enable 60Hz aria-live announcements.
