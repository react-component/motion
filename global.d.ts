/// <reference types="jest" />
/// <reference types="node" />
/// <reference types="react" />
/// <reference types="react-dom" />
/// <reference types="@testing-library/jest-dom" />

declare module '*.css';
declare module '*.less';
declare module 'jsonp';

declare namespace JSX {
  type Element = React.JSX.Element;
  interface ElementClass extends React.JSX.ElementClass {}
  interface ElementAttributesProperty
    extends React.JSX.ElementAttributesProperty {}
  interface ElementChildrenAttribute
    extends React.JSX.ElementChildrenAttribute {}
  type LibraryManagedAttributes<C, P> = React.JSX.LibraryManagedAttributes<
    C,
    P
  >;
  interface IntrinsicAttributes extends React.JSX.IntrinsicAttributes {}
  interface IntrinsicClassAttributes<T> extends React.JSX
    .IntrinsicClassAttributes<T> {}
  interface IntrinsicElements extends React.JSX.IntrinsicElements {}
}

declare namespace jest {
  interface Matchers<R> {
    lastCalledWith(...expected: unknown[]): R;
    nthCalledWith(nthCall: number, ...expected: unknown[]): R;
    toBeCalled(): R;
    toBeCalledTimes(expected: number): R;
    toBeCalledWith(...expected: unknown[]): R;
  }
}

declare module 'moment/locale/zh-cn';
