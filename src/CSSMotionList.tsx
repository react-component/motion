/* eslint react/prop-types: 0 */
import * as React from 'react';
import OriginCSSMotion, { CSSMotionProps } from './CSSMotion';
import { supportTransition } from './util/motion';
import {
  STATUS_ADD,
  STATUS_KEEP,
  STATUS_REMOVE,
  STATUS_REMOVED,
  diffKeys,
  parseKeys,
  KeyObject,
} from './util/diff';
import { ListMotionEndEventHandler } from './interface';

const MOTION_PROP_NAMES = [
  'eventProps',
  'visible',
  'children',
  'motionName',
  'motionAppear',
  'motionEnter',
  'motionLeave',
  'motionLeaveImmediately',
  'motionDeadline',
  'removeOnLeave',
  'leavedClassName',
  'onAppearStart',
  'onAppearActive',
  'onAppearEnd',
  'onEnterStart',
  'onEnterActive',
  'onEnterEnd',
  'onLeaveStart',
  'onLeaveActive',
  'onLeaveEnd',
];

export interface CSSMotionListProps
  extends Omit<CSSMotionProps, 'onVisibleChanged'> {
  keys: (React.Key | { key: React.Key; [name: string]: any })[];
  component?: string | React.ComponentType | false;

  /** This will always trigger after final visible changed. Even if no motion configured. */
  onVisibleChanged?: (visible: boolean, info: { key: React.Key }) => void;
}

export interface CSSMotionListState {
  keyEntities: KeyObject[];
}

export function genCSSMotionList(
  transitionSupport: boolean,
  CSSMotion = OriginCSSMotion,
): React.ComponentClass<CSSMotionListProps> {
  class CSSMotionList extends React.Component<
    CSSMotionListProps,
    CSSMotionListState
  > {
    static defaultProps = {
      component: 'div',
    };

    state: CSSMotionListState = {
      keyEntities: [],
    };

    static getDerivedStateFromProps(
      { keys }: CSSMotionListProps,
      { keyEntities }: CSSMotionListState,
    ) {
      const parsedKeyObjects = parseKeys(keys);

      // Always as keep when motion not support
      if (!transitionSupport) {
        return {
          keyEntities: parsedKeyObjects.map((obj) => ({
            ...obj,
            status: STATUS_KEEP,
          })),
        };
      }

      const mixedKeyEntities = diffKeys(keyEntities, parsedKeyObjects);

      const keyEntitiesLen = keyEntities.length;
      return {
        keyEntities: mixedKeyEntities.filter((entity) => {
          // IE 9 not support Array.prototype.find
          let prevEntity = null;
          for (let i = 0; i < keyEntitiesLen; i += 1) {
            const currentEntity = keyEntities[i];
            if (currentEntity.key === entity.key) {
              prevEntity = currentEntity;
              break;
            }
          }

          // Remove if already mark as removed
          if (
            prevEntity &&
            prevEntity.status === STATUS_REMOVED &&
            entity.status === STATUS_REMOVE
          ) {
            return false;
          }
          return true;
        }),
      };
    }

    removeKey = (removeKey: React.Key) => {
      this.setState(({ keyEntities }) => ({
        keyEntities: keyEntities.map((entity) => {
          if (entity.key !== removeKey) return entity;
          return {
            ...entity,
            status: STATUS_REMOVED,
          };
        }),
      }));
    };

    render() {
      const { keyEntities } = this.state;
      const {
        component,
        children,
        onLeaveEnd,
        onVisibleChanged,
        ...restProps
      } = this.props;

      const Component = component || React.Fragment;

      const motionProps: CSSMotionProps = {};
      MOTION_PROP_NAMES.forEach((prop) => {
        motionProps[prop] = restProps[prop];
        delete restProps[prop];
      });
      delete restProps.keys;

      return (
        <Component {...restProps}>
          {keyEntities.map(({ status, ...eventProps }) => {
            const visible = status === STATUS_ADD || status === STATUS_KEEP;
            return (
              <CSSMotion
                {...motionProps}
                key={eventProps.key}
                visible={visible}
                eventProps={eventProps}
                onLeaveEnd={(...args) => {
                  onLeaveEnd?.(...args);
                  this.removeKey(eventProps.key);
                }}
                onVisibleChanged={(changedVisible) => {
                  onVisibleChanged?.(changedVisible, { key: eventProps.key });
                }}
              >
                {children}
              </CSSMotion>
            );
          })}
        </Component>
      );
    }
  }

  return CSSMotionList;
}

export default genCSSMotionList(supportTransition);
