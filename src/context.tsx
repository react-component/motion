import * as React from 'react';

interface MotionContextProps {
  motion?: boolean;
}

export const Context = React.createContext<MotionContextProps>({});

const MotionProvider: React.FC<
  React.PropsWithChildren<MotionContextProps>
> = props => {
  const { children, ...rest } = props;

  const memoizedValue = React.useMemo<MotionContextProps>(() => {
    return { motion: rest.motion };
  }, [rest.motion]);

  return <Context.Provider value={memoizedValue}>{children}</Context.Provider>;
};

export default MotionProvider;
