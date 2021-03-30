/**
 * @file: 确保 diff & patch 正确
 * @author: yangqianjun
 * @Date: 2020-01-03 11:40:45
 * @LastEditors: yangqianjun
 * @LastEditTime: 2020-01-03 15:29:36
 */

// @IMP: f*ck
import * as jsondiffpatch from 'jsondiffpatch';
import { diffAndPatch } from 'src/diff/diff';
// eslint-disable-next-line @typescript-eslint/no-var-requires
const realDiff: typeof jsondiffpatch = require('../../static/jsondiffpatch.umd');

const samples = {
  arrStr: {
    p: ['a', 'b', 'c']
  },
  arrStrIncrease: {
    p: ['a', 'd', 'b', 'c', 'e']
  },
  arrStrDecrease: {
    p: ['c', 'd']
  },
  arrObj: {
    p: [
      {
        id: 1,
        name: 1
      },
      {
        id: 2,
        name: 2
      }
    ]
  },
  arrObjIncrease: {
    p: [
      {
        id: 1,
        name: 1
      },
      {
        id: 3,
        name: 3
      },
      {
        id: 2,
        name: 2
      }
    ]
  },
  arrObjDecrease: {
    p: [
      {
        id: 3,
        name: 3
      }
    ]
  },
  obj: {
    200: {
      id: 1,
      name: 1
    },
    500: {
      id: 2,
      name: 2
    }
  },
  objIncrease: {
    200: {
      id: 4,
      name: 4
    },
    404: {
      id: 3,
      name: 3
    },
    500: {
      id: 2,
      name: 2
    }
  },
  objDecrease: {
    500: {
      id: 3,
      name: 3
    }
  }
};
const getSmaples = (key: keyof typeof samples) => {
  return samples[key];
};
const clone = <T>(o: T): T => JSON.parse(JSON.stringify(o));

describe('service/diff ok', () => {
  it('array of string diffs ok', () => {
    const [Base, Inc, Dec] = [
      getSmaples('arrStr'),
      getSmaples('arrStrIncrease'),
      getSmaples('arrStrDecrease')
    ];
    // increase
    {
      const { delta, selectDelta } = diffAndPatch(Base, Inc);
      expect(delta).toMatchSnapshot('arrStrIncrease');
      expect(realDiff.patch(clone(Base), delta!)).toMatchObject(Inc);
      expect(realDiff.patch(clone(Base), delta!)).toMatchSnapshot('arrStrIncrease patched');

      {
        const newDelta = selectDelta([['p', '1']]);
        expect(newDelta).toMatchSnapshot('arrStrIncrease p-1');
        expect(realDiff.patch(clone(Base), newDelta)).toMatchSnapshot('arrStrIncrease p-1 patched');
      }

      {
        const newDelta = selectDelta([['p', '4']]);
        expect(newDelta).toMatchSnapshot('arrStrIncrease p-4');
        expect(realDiff.patch(clone(Base), newDelta)).toMatchSnapshot('arrStrIncrease p-4 patched');
      }
    }
    // decrease
    {
      const { delta, selectDelta } = diffAndPatch(Base, Dec);
      expect(delta).toMatchSnapshot('arrStrDecrease');
      expect(realDiff.patch(clone(Base), delta!)).toMatchSnapshot('arrStrDecrease patched');

      {
        const newDelta = selectDelta([['p', '1']]);
        expect(newDelta).toMatchSnapshot('arrStrDecrease p-1');
        expect(realDiff.patch(clone(Base), newDelta)).toMatchSnapshot('arrStrDecrease p-1 patched');
      }

      {
        const newDelta = selectDelta([
          ['p', '1'],
          ['p', '_1']
        ]);
        expect(newDelta).toMatchSnapshot('arrStrDecrease p-1&_1');
        expect(realDiff.patch(clone(Base), newDelta)).toMatchSnapshot(
          'arrStrDecrease p-1&_1 patched'
        );
      }
      {
        const newDelta = selectDelta([
          ['p', '_1'],
          ['p', '_0']
        ]);
        expect(newDelta).toMatchSnapshot('arrStrDecrease p-_1&_0');
        expect(realDiff.patch(clone(Base), newDelta)).toMatchSnapshot(
          'arrStrDecrease p-_1&_0 patched'
        );
      }
    }
  });

  it('array of obj diffs ok', () => {
    const [Base, Inc, Dec] = [
      getSmaples('arrObj'),
      getSmaples('arrObjIncrease'),
      getSmaples('arrObjDecrease')
    ];

    // increase
    {
      const { delta, selectDelta } = diffAndPatch(Base, Inc);
      expect(delta).toMatchSnapshot('arrObjIncrease');
      expect(realDiff.patch(clone(Base), delta!)).toMatchObject(Inc);
      expect(realDiff.patch(clone(Base), delta!)).toMatchSnapshot('arrObjIncrease patched');

      {
        {
          const newDelta = selectDelta([['p', '1', 'id']]);
          expect(newDelta).toMatchSnapshot('arrStrIncrease p-1-id');
          expect(realDiff.patch(clone(Base), newDelta)).toMatchSnapshot(
            'arrObjIncrease p-1-id patched'
          );
        }

        {
          const newDelta = selectDelta([['p', '2']]);
          expect(newDelta).toMatchSnapshot('arrStrIncrease p-2');
          expect(realDiff.patch(clone(Base), newDelta)).toMatchSnapshot(
            'arrObjIncrease p-2 patched'
          );
        }
      }
    }
    // decrease
    {
      const { delta, selectDelta } = diffAndPatch(Base, Dec);
      expect(delta).toMatchSnapshot('arrObjDecrease');
      expect(realDiff.patch(clone(Base), delta!)).toMatchObject(Dec);
      expect(realDiff.patch(clone(Base), delta!)).toMatchSnapshot('arrObjDecrease patched');

      {
        {
          const newDelta = selectDelta([['p', '0', 'name']]);
          expect(newDelta).toMatchSnapshot('arrObjDecrease p-0-name');
          expect(realDiff.patch(clone(Base), newDelta)).toMatchSnapshot(
            'arrObjDecrease p-0-name patched'
          );
        }
        {
          const newDelta = selectDelta([['p', '_1']]);
          expect(newDelta).toMatchSnapshot('arrObjDecrease p-_1');
          expect(realDiff.patch(clone(Base), newDelta)).toMatchSnapshot(
            'arrObjDecrease p-_1 patched'
          );
        }
      }
    }
  });

  it('object diffs ok', () => {
    const [Base, Inc, Dec] = [
      getSmaples('obj'),
      getSmaples('objIncrease'),
      getSmaples('objDecrease')
    ];

    // increase
    {
      const { delta, selectDelta } = diffAndPatch(Base, Inc);
      expect(delta).toMatchSnapshot('objIncrease');
      expect(realDiff.patch(clone(Base), delta!)).toMatchObject(Inc);

      {
        const newDelta = selectDelta([['200', 'id'], ['404']]);
        expect(newDelta).toMatchSnapshot('arrStrIncrease p-200&404');
        expect(realDiff.patch(clone(Base), newDelta)).toMatchSnapshot(
          'arrStrIncrease p-200&404 patched'
        );
      }

      {
        const newDelta = selectDelta([
          ['200', 'id'],
          ['200', 'name']
        ]);
        expect(newDelta).toMatchSnapshot('arrStrIncrease p-200');
        expect(realDiff.patch(clone(Base), newDelta)).toMatchSnapshot(
          'arrStrIncrease p-200 patched'
        );
      }
    }

    // decrease
    {
      const { delta, selectDelta } = diffAndPatch(Base, Dec);
      expect(delta).toMatchSnapshot('objDecrease');
      expect(realDiff.patch(clone(Base), delta!)).toMatchObject(Dec);

      {
        const newDelta = selectDelta([['200']]);
        expect(newDelta).toMatchSnapshot('objDecrease p-200');
        expect(realDiff.patch(clone(Base), newDelta)).toMatchSnapshot('objDecrease p-200 patched');
      }

      {
        const newDelta = selectDelta([['200'], ['500', 'name']]);
        expect(newDelta).toMatchSnapshot('objDecrease p-500-name');
        expect(realDiff.patch(clone(Base), newDelta)).toMatchSnapshot(
          'objDecrease p-500-name patched'
        );
      }
    }
  });
});
