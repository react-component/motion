import * as React from 'react';
import {
  StepStatus,
  STEP_PREPARE,
  STEP_ACTIVE,
  STEP_START,
  STEP_ACTIVATED,
  STEP_NONE,
} from '../interface';
import useIsomorphicLayoutEffect from './useIsomorphicLayoutEffect';
import useNextFrame from './useNextFrame';

const STEP_QUEUE: StepStatus[] = [
  STEP_PREPARE,
  STEP_START,
  STEP_ACTIVE,
  STEP_ACTIVATED,
];

/** Skip current step */
export const SkipStep = false as const;
/** Current step should be update in */
export const DoStep = true as const;

export function isActive(step: StepStatus) {
  return step === STEP_ACTIVE || step === STEP_ACTIVATED;
}

export default (
  callback: (
    step: StepStatus,
  ) => Promise<void> | typeof SkipStep | typeof DoStep,
): [() => void, StepStatus] => {
  const [step, setStep] = React.useState<StepStatus>(STEP_NONE);

  const [nextFrame, cancelNextFrame] = useNextFrame();

  function startQueue() {
    setStep(STEP_PREPARE);
  }

  useIsomorphicLayoutEffect(() => {
    // if (step === STEP_START) {
    //   return;
    // }

    if (step !== STEP_NONE && step !== STEP_ACTIVATED) {
      const index = STEP_QUEUE.indexOf(step);
      const nextStep = STEP_QUEUE[index + 1];

      const result = callback(step);

      if (result === SkipStep) {
        // Skip when no needed
        setStep(nextStep);
      } else {
        // Do as frame for step update
        nextFrame(info => {
          function doNext() {
            // Skip since current queue is ood
            if (info.isCanceled()) return;

            setStep(nextStep);
          }

          if (result === true) {
            doNext();
          } else {
            // Only promise should be async
            Promise.resolve(result).then(doNext);
          }
        });
      }
    }
  }, [step]);

  React.useEffect(
    () => () => {
      cancelNextFrame();
    },
    [],
  );

  return [startQueue, step];
};
