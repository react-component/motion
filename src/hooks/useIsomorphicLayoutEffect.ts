import canUseDom from '@rc-component/util/lib/Dom/canUseDom';
import { useEffect, useLayoutEffect } from 'react';

// It's safe to use `useLayoutEffect` but the warning is annoying
const useIsomorphicLayoutEffect = canUseDom() ? useLayoutEffect : useEffect;

export default useIsomorphicLayoutEffect;
