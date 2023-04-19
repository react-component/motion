/* eslint react/prop-types: 0 */
import omit from 'rc-util/lib/omit';
import * as React from 'react';
import type { CSSMotionProps } from './CSSMotion';
import OriginCSSMotion from './CSSMotion';
import type { KeyObject } from './util/diff';
import {
  diffKeys,
  parseKeys,
  STATUS_ADD,
  STATUS_KEEP,
  STATUS_REMOVE,
  STATUS_REMOVED,
} from './util/diff';
import { supportTransition } from './util/motion';
import pick from './util/pick';

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
  extends Omit<CSSMotionProps, 'onVisibleChanged'>,
    Omit<React.HTMLAttributes<any>, 'children'> {
  keys: (React.Key | { key: React.Key; [name: string]: any })[];
  component?: string | React.ComponentType | false;

  /** This will always trigger after final visible changed. Even if no motion configured. */
  onVisibleChanged?: (visible: boolean, info: { key: React.Key }) => void;
  /** All motion leaves in the screen */
  onAllRemoved?: () => void;
}

export interface CSSMotionListState {
  keyEntities: KeyObject[];
}

/**
 * Generate a CSSMotionList component with config
 * @param transitionSupport No need since CSSMotionList no longer depends on transition support
 * @param CSSMotion CSSMotion component
 */
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
      const mixedKeyEntities = diffKeys(keyEntities, parsedKeyObjects);

      return {
        keyEntities: mixedKeyEntities.filter(entity => {
          const prevEntity = keyEntities.find(({ key }) => entity.key === key);

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

    // ZombieJ: Return the count of rest keys. It's safe to refactor if need more info.
    removeKey = (removeKey: React.Key) => {
      const { keyEntities } = this.state;
      const nextKeyEntities = keyEntities.map(entity => {
        if (entity.key !== removeKey) return entity;
        return {
          ...entity,
          status: STATUS_REMOVED,
        };
      });

      this.setState({
        keyEntities: nextKeyEntities,
      });

      return nextKeyEntities.filter(({ status }) => status !== STATUS_REMOVED)
        .length;
    };

    render() {
      const { keyEntities } = this.state;
      const {
        component,
        children,
        onVisibleChanged,
        onAllRemoved,
        ...restProps
      } = this.props;

      const Component = component || React.Fragment;
      const motionProps = pick(restProps, MOTION_PROP_NAMES as any);
      const componentProps = omit(restProps, MOTION_PROP_NAMES as any);

      return (
        <Component {...componentProps}>
          {keyEntities.map(({ status, ...eventProps }) => {
            const visible = status === STATUS_ADD || status === STATUS_KEEP;
            return (
              <CSSMotion
                {...motionProps}
                key={eventProps.key}
                visible={visible}
                eventProps={eventProps}
                onVisibleChanged={changedVisible => {
                  onVisibleChanged?.(changedVisible, { key: eventProps.key });

                  if (!changedVisible) {
                    const restKeysCount = this.removeKey(eventProps.key);

                    if (restKeysCount === 0 && onAllRemoved) {
                      onAllRemoved();
                    }
                  }
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
