/**
 * oracle.js —— antd 参考实现的**机械移植**，仅用于差分测试。
 *
 * 来源：@rc-component/motion@1.3.3（antd 6.6.4 声明 `^1.3.3`）
 *   · es/interface.d.ts            —— 常量
 *   · es/hooks/useStatus.js        —— 51-79（结束判定）/ 161-186（状态选取）/ 225-237（styleReady 与样式）
 *   · es/hooks/useStepQueue.js     —— 6-7（队列）/ 13-15（isActive）/ 24-26（下一步）
 *   · es/CSSMotion.js              —— 92-146（渲染分支与 class 组装）
 *   · es/util/motion.js            —— getTransitionName
 *
 * 移植原则（与 `packages/position/src/__tests__/oracle.js` 一致）：
 *   1. 不做任何"顺手优化"，保持 antd 的变量名、求值顺序与分支形态；
 *   2. React 的 useState/useRef 在这里显式化成"传进来 / 返回去"的普通值，
 *      因为被移植的**判定**是纯的；驱动它们的时机（effect、rAF、DOM 事件）
 *      不在本文件范围内，由 L2 的帧泵负责；
 *   3. 本文件**不参与生产构建**，也不导出到包外。
 *
 * 若 antd 升级导致行为变化，应当同步更新本文件，并让差分测试先变红。
 */

// ============================== Constants ==============================
const STATUS_NONE = 'none';
const STATUS_APPEAR = 'appear';
const STATUS_ENTER = 'enter';
const STATUS_LEAVE = 'leave';

const STEP_NONE = 'none';
const STEP_PREPARE = 'prepare';
const STEP_START = 'start';
const STEP_ACTIVE = 'active';
const STEP_ACTIVATED = 'end';
const STEP_PREPARED = 'prepared';

const FULL_STEP_QUEUE = [STEP_PREPARE, STEP_START, STEP_ACTIVE, STEP_ACTIVATED];
const SIMPLE_STEP_QUEUE = [STEP_PREPARE, STEP_PREPARED];

// ============================== useStepQueue ==============================
// es/hooks/useStepQueue.js:13-15
function isActive(step) {
  return step === STEP_ACTIVE || step === STEP_ACTIVATED;
}

// es/hooks/useStepQueue.js:24-26
function getNextStep(step, prepareOnly) {
  const STEP_QUEUE = prepareOnly ? SIMPLE_STEP_QUEUE : FULL_STEP_QUEUE;
  const index = STEP_QUEUE.indexOf(step);
  const nextStep = STEP_QUEUE[index + 1];
  return nextStep;
}

// ============================== util/motion ==============================
// es/util/motion.js: getTransitionName
function getTransitionName(transitionName, transitionType) {
  if (!transitionName) return null;
  // 对象形态本轮不移植（见 contracts §9.6）
  return `${transitionName}-${transitionType}`;
}

// ============================== useStatus ==============================
// es/hooks/useStatus.js:51-79 —— onInternalMotionEnd
function shouldEndMotion(status, active, element, event, endVerdict) {
  // Do nothing since not in any transition status.
  if (status === STATUS_NONE) {
    return false;
  }
  if (event && !event.deadline && event.target !== element) {
    return false;
  }
  const currentActive = active;
  let canEnd;
  if (status === STATUS_APPEAR && currentActive) {
    canEnd = endVerdict;
  } else if (status === STATUS_ENTER && currentActive) {
    canEnd = endVerdict;
  } else if (status === STATUS_LEAVE && currentActive) {
    canEnd = endVerdict;
  }
  // Only update status when `canEnd` and not destroyed
  return Boolean(currentActive && canEnd !== false);
}

// es/hooks/useStatus.js:161-186 —— 状态选取与是否开始
function pickStatus(
  mounted,
  visible,
  motionAppear,
  motionEnter,
  motionLeave,
  motionLeaveImmediately,
) {
  let nextStatus;

  // Appear
  if (!mounted && visible && motionAppear) {
    nextStatus = STATUS_APPEAR;
  }

  // Enter
  if (mounted && visible && motionEnter) {
    nextStatus = STATUS_ENTER;
  }

  // Leave
  if (
    (mounted && !visible && motionLeave) ||
    (!mounted && motionLeaveImmediately && !visible && motionLeave)
  ) {
    nextStatus = STATUS_LEAVE;
  }

  return nextStatus;
}

function shouldStartMotion(nextStatus, supportMotion, hasPrepare) {
  // `nextEventHandlers[STEP_PREPARE]` 的存在性在这里就是 hasPrepare
  return Boolean(nextStatus && (supportMotion || hasPrepare));
}

// es/hooks/useStatus.js:225-237 —— 样式合并与 styleReady
function getMotionStyle(hasPrepare, step, handlerStyle) {
  let mergedStyle = handlerStyle;
  if (hasPrepare && step === STEP_START) {
    mergedStyle = {
      transition: 'none',
      ...mergedStyle,
    };
  }
  return mergedStyle;
}

function getStyleReady(mounted, status, supportMotion, motionAppear, step, styleStep) {
  return !mounted && status === STATUS_NONE && supportMotion && motionAppear
    ? 'NONE'
    : step === STEP_START || step === STEP_ACTIVE
      ? styleStep === step
      : true;
}

// ============================== CSSMotion ==============================
// es/CSSMotion.js:127-143 —— class 组装（用 clsx 的等价语义展开）
function getMotionClassName(motionName, status, statusStep) {
  let statusSuffix;
  if (statusStep === STEP_PREPARE) {
    statusSuffix = 'prepare';
  } else if (isActive(statusStep)) {
    statusSuffix = 'active';
  } else if (statusStep === STEP_START) {
    statusSuffix = 'start';
  }
  const motionCls = getTransitionName(motionName, `${status}-${statusSuffix}`);
  // clsx(base, { [motionCls]: motionCls && statusSuffix, [motionName]: typeof motionName === 'string' })
  const parts = [];
  const base = getTransitionName(motionName, status);
  if (base) parts.push(base);
  if (motionCls && statusSuffix) parts.push(motionCls);
  if (typeof motionName === 'string' && motionName) parts.push(motionName);
  return parts.join(' ');
}

// es/CSSMotion.js:104-124 —— status === NONE 时的四种分支
function pickRenderMode(
  styleReady,
  status,
  mergedVisible,
  removeOnLeave,
  forceRender,
  leavedClassName,
  rendered,
) {
  if (styleReady === 'NONE') {
    return 'null';
  }
  if (status !== STATUS_NONE) {
    return 'motion';
  }
  if (mergedVisible) {
    return 'children';
  }
  if (!removeOnLeave && rendered && leavedClassName) {
    return 'leaved';
  }
  if (forceRender || (!removeOnLeave && !leavedClassName)) {
    return 'hidden';
  }
  return 'null';
}

// ============================== 导出 ==============================
export {
  FULL_STEP_QUEUE,
  getMotionClassName,
  getMotionStyle,
  getNextStep,
  getStyleReady,
  getTransitionName,
  isActive,
  pickRenderMode,
  pickStatus,
  SIMPLE_STEP_QUEUE,
  STATUS_APPEAR,
  STATUS_ENTER,
  STATUS_LEAVE,
  STATUS_NONE,
  STEP_ACTIVATED,
  STEP_ACTIVE,
  STEP_NONE,
  STEP_PREPARE,
  STEP_PREPARED,
  STEP_START,
  shouldEndMotion,
  shouldStartMotion,
};
