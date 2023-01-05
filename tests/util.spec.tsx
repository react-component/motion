import { getTransitionName } from '../src/util/motion';
import { diffKeys } from '../src/util/diff';

describe('Util', () => {
  it('getTransitionName', () => {
    // Null
    expect(getTransitionName(null, null)).toBeFalsy();

    // Object
    expect(
      getTransitionName(
        {
          appearActive: 'light',
        },
        'appear-active',
      ),
    ).toEqual('light');

    expect(
      getTransitionName(
        {
          appearActive: 'light',
        },
        'appear',
      ),
    ).toBeFalsy();

    // string
    expect(getTransitionName('light', 'enter-active')).toEqual(
      'light-enter-active',
    );
  });

  it('diffKeys', () => {
    // Deduplicate key when move:
    // [1 - add, 2 - keep, 1 - remove] -> [1 - keep, 2 - keep]
    expect(
      diffKeys([{ key: 1 }, { key: 2 }], [{ key: 2 }, { key: 1 }]),
    ).toEqual([
      { key: '2', status: 'keep' },
      { key: '1', status: 'keep' },
    ]);
  });
});
