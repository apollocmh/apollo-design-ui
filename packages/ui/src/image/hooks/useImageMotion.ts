import { useTheme } from '@apollo-design/theme';
import { computed, onMounted, onScopeDispose, ref } from 'vue';

/** Source theme and live system preference determine the existing Image motion. */
export function useImageMotion() {
  const theme = useTheme();
  const reduced = ref(false);
  let media: MediaQueryList | undefined;
  const update = () => {
    reduced.value = media?.matches ?? false;
  };
  onMounted(() => {
    if (typeof window.matchMedia !== 'function') return;
    media = window.matchMedia('(prefers-reduced-motion: reduce)');
    update();
    media.addEventListener('change', update);
  });
  onScopeDispose(() => media?.removeEventListener('change', update));
  return computed(
    () =>
      !reduced.value &&
      theme.token.value.motion &&
      Number.parseFloat(theme.token.value.motionDurationSlow) !== 0,
  );
}
