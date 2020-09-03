import { useState } from 'react';
import useIsomorphicLayoutEffect from './useIsomorphicLayoutEffect';
import { MotionStatus, StepStatus, STEP_NONE } from '../interface';
import useNextFrame from './useNextFrame';

export type StepCell = {
  step: StepStatus;
  doNext?: (info: { isCanceled: () => boolean }) => void | Promise<void>;
};

export type StepMap = Record<MotionStatus, StepCell[]>;

export default (status: MotionStatus, stepMap: StepMap): [StepStatus] => {
  const [stepQueue, setStepQueue] = useState<StepCell[]>(null);
  const [step, setStep] = useState<StepStatus>(STEP_NONE);

  const [nextFrame, cancelNextFrame] = useNextFrame();

  // Use related queue when status changed
  useIsomorphicLayoutEffect(() => {
    const stepList = stepMap[status];
    setStepQueue(stepList);
    setStep(STEP_NONE);

    // Reset steps
    cancelNextFrame();
  }, [status]);

  // Update step by frame
  useIsomorphicLayoutEffect(() => {
    nextFrame(async (info) => {
      if (stepQueue) {
        const index = stepQueue.findIndex((cell) => cell.step === step);
        const nextStep = stepQueue[index + 1];

        if (nextStep) {
          // Wait until `doNext` finished
          await nextStep.doNext?.(info);

          // Skip when canceled
          if (info.isCanceled()) return;

          setStep(nextStep.step);
        }
      }
    });
  }, [stepQueue, step]);

  return [step];
};
