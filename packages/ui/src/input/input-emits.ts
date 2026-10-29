/** Semantic events use Vue emits so listener arrays and .once work across wrappers. */
export const inputEmits = {
  'update:value': (_value: string) => true,
  change: (_event: Event) => true,
  clear: (_event: MouseEvent) => true,
  pressEnter: (_event: KeyboardEvent) => true,
};
