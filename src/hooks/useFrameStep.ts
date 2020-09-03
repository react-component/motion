import { useState } from 'react';
import useIsomorphicLayoutEffect from './useIsomorphicLayoutEffect';
import { MotionStatus, StepStatus, STEP_NONE, STEP_END } from '../interface';
import useNextFrame from './useNextFrame';

export type StepMap = Record<MotionStatus, StepStatus[]>;

export default (status: MotionStatus, stepMap: StepMap): [StepStatus] => {
  const [stepQueue, setStepQueue] = useState<StepStatus[]>(null);
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
    nextFrame(() => {
      if (stepQueue && stepQueue.length) {
        const [current, ...rest] = stepQueue;

        setStepQueue(rest);
        setStep(current || STEP_END);
      }
    });
  }, [stepQueue]);

  return [step];
};
