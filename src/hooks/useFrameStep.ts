import { useState } from 'react';
import useIsomorphicLayoutEffect from './useIsomorphicLayoutEffect';
import { MotionStatus, StepStatus, STEP_NONE, STEP_END } from '../interface';
import useNextFrame from './useNextFrame';

export type StepCell = {
  step: StepStatus;
  doNext?: () => Promise<void>;
};

export type MergedStepCell = StepCell | StepStatus;

export type StepMap = Record<MotionStatus, MergedStepCell[]>;

function toCell(cell: MergedStepCell): StepCell {
  return typeof cell === 'object' ? cell : { step: cell };
}

export default (status: MotionStatus, stepMap: StepMap): [StepStatus] => {
  const [stepQueue, setStepQueue] = useState<MergedStepCell[]>(null);
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
      if (stepQueue && stepQueue.length) {
        const [current, ...rest] = stepQueue;

        // No more steps
        if (!current) {
          setStepQueue(rest);
          setStep(STEP_END);
        } else {
          const stepCell = toCell(current);
          await stepCell.doNext?.();

          // Skip when canceled
          if (info.isCanceled()) return;

          setStepQueue(rest);
          setStep(stepCell.step);
        }
      }
    });
  }, [stepQueue]);

  return [step];
};
