# Typography Vue contract corrections

Applies to the unpublished 0.0.0 development branch. This follows ADR0007 and the user's direct-migration authorization: no deprecation period or compatibility layer.

| Previous contract / behaviour | Current contract / migration |
|---|---|
| Fixed-tag components declared an ineffective component prop | Remove it from Text/Title/Paragraph/Link; use Typography component for custom containers |
| Link root was an anchor containing copy/edit buttons | Root/ref/id/class/style belong to a span; href/target/rel/link ARIA/tabindex/events belong to its native anchor; update direct-root anchor selectors |
| Editing lost root attrs and nativeElement | Both follow the actual editing root; editor ARIA belongs to textarea |
| Text-only editing had no keyboard entry | A native edit button is visually clipped until keyboard focus |
| Copy failure still announced success; empty string fell back to content | Only actual success updates state/callback; explicit empty text stays empty; pending requests are instance-local |
| Rich configuration arrays could be truncated | Exactly two copy entries remain a before/after state pair; all other lengths remain full content; edit tooltip preserves all nodes |
| Editable removed internal newlines | Internal native newlines are preserved; outer whitespace is still trimmed |
| Hidden ellipsis probes mounted business Vue components again | Measurements project mounted native DOM; visible component identity, drafts and focus remain stable |
| Title margin tokens were declared but not consumed | Existing theme.components.Typography titleMarginTop/titleMarginBottom now apply dynamically, including 0 and removal |
| Default semantic text could fail contrast | Default text and operation colours follow readable native light/dark tones; links gain a default underline and focus follows the native anchor; custom native style remains authoritative |
| Table consumer derived colours were fixed at build time | Existing forty Table variables are derived from the current theme on the table and filter portal; default light CSS remains unchanged |

Typography has one default slot, no component emits and no v-model. Existing configuration callbacks remain scoped configuration operations. Root Vue class/style attrs and Provider replacements preserve their current content and editor instances. Refer to the dated audit for actual verification and unresolved boundaries; this migration record is not an acceptance certificate.

Expansion labels use their displayed symbol text where available, with the current locale as a fallback. This keeps custom Demo labels usable by speech input and accessible role/name queries.

Native editor geometry: the textarea now fills the owned root, uses its current background/border/focus aliases and reserves confirm-icon space. Disabling autoSize retains a full native row. This removes the inactive assumption that an Input wrapper would supply its base styles; no Input engine or compatibility wrapper is introduced.
