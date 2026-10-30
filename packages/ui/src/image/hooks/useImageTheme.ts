import { transformToken, useTheme } from '@apollo-design/theme';
import { computed } from 'vue';
import { prepareComponentToken } from '../style/token';

function numeric(value: unknown, fallback: number): number {
  return typeof value === 'number' && Number.isFinite(value) ? value : fallback;
}
function text(value: unknown, fallback: string): string {
  return typeof value === 'string' && value.trim() ? value : fallback;
}

/** Read the source Vue context: Teleport changes DOM ancestry, not injection. */
export function useImageTheme() {
  const theme = useTheme();
  const component = computed(() => {
    const base = prepareComponentToken(theme.token.value);
    const override = theme.config.value.components?.Image ?? {};
    return {
      zIndexPopup: numeric(override.zIndexPopup, base.zIndexPopup),
      previewOperationColor: text(override.previewOperationColor, base.previewOperationColor),
      previewOperationHoverColor: text(
        override.previewOperationHoverColor,
        base.previewOperationHoverColor,
      ),
      previewOperationColorDisabled: text(
        override.previewOperationColorDisabled,
        base.previewOperationColorDisabled,
      ),
      previewOperationSize: numeric(override.previewOperationSize, base.previewOperationSize),
      progressAnimationDuration: text(
        override.progressAnimationDuration,
        base.progressAnimationDuration,
      ),
      imagePreviewSwitchSize: numeric(override.imagePreviewSwitchSize, base.imagePreviewSwitchSize),
    };
  });
  const styles = computed<Record<string, string>>(() => {
    // Leave static/global CSS in charge when there is no active source
    // theme, so defaults do not become unsolicited inline overrides.
    if (theme.sourceActive?.value === false) return {};
    const token = component.value;
    return {
      ...transformToken(theme.token.value).vars,
      '--apollo-image-z-index-popup': String(token.zIndexPopup),
      '--apollo-image-preview-operation-color': token.previewOperationColor,
      '--apollo-image-preview-operation-hover-color': token.previewOperationHoverColor,
      '--apollo-image-preview-operation-color-disabled': token.previewOperationColorDisabled,
      '--apollo-image-preview-operation-size': `${token.previewOperationSize}px`,
      '--apollo-image-progress-animation-duration': token.progressAnimationDuration,
      '--apollo-image-preview-switch-size': `${token.imagePreviewSwitchSize}px`,
      '--apollo-image-motion-play-state': theme.token.value.motion ? 'running' : 'paused',
    };
  });
  return { styles, zIndexPopup: computed(() => component.value.zIndexPopup) };
}
