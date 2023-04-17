import * as React from 'react';

interface MotionContextProps {
  motion?: boolean;
}

export const Context = React.createContext<MotionContextProps>({});

export default function MotionProvider({
  children,
  ...props
}: MotionContextProps & { children?: React.ReactNode }) {
  return <Context.Provider value={props}>{children}</Context.Provider>;
}
