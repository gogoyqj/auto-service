import * as jsondiffpatch from 'jsondiffpatch';
import lodash from 'lodash';

/** ensure node.js and browser side using jsondiffpatch with the same version */
// eslint-disable-next-line @typescript-eslint/no-var-requires
const realDiff: typeof jsondiffpatch = require('../../static/jsondiffpatch.umd');
const splitor = '__@__@__';

export function diffAndPatch(curVersion: {}, newVersion: {}) {
  const delta = realDiff.diff(curVersion, newVersion);
  return {
    /** all changes from curVersion to newVersion evaluated by jsondiffpatch */
    delta,
    /** selected changes by keys */
    selectDelta: (keys: string[][]) => {
      const initialMap: { [key: string]: any } = {};
      const setKeyMap: { [key: string]: any } = {};
      const newDelta = keys.reduce((newDelta, indexs) => {
        const val = lodash.get(delta, indexs);
        const newIndexs = indexs;
        const curSetKey = newIndexs.join(splitor);
        const parentIndexes = indexs.slice(0, indexs.length - 1);
        parentIndexes.reduce<string[]>((curKeys, curKey) => {
          curKeys.push(curKey);
          const key = curKeys.join(splitor);
          if (!(key in initialMap)) {
            const curValue = lodash.get(curVersion, curKeys);
            const newValue = lodash.get(newVersion, curKeys);
            // IMP: 数组的特定协议： _t, a
            if (
              (curValue && newValue && Array.isArray(curValue) && Array.isArray(newValue)) ||
              (curValue && !newValue && Array.isArray(curValue)) ||
              (!curValue && newValue && Array.isArray(newValue))
            ) {
              lodash.setWith(newDelta, curKeys.concat(['_t']), 'a', Object);
            }
            initialMap[key] = '';
          }
          return curKeys;
        }, []);
        if (!val) {
          throw `工具出 bug 了`;
        } else {
          lodash.setWith(newDelta, newIndexs, val, Object);
          setKeyMap[curSetKey] = '';
        }
        return newDelta;
      }, {});
      return newDelta;
    },
    /** patch with selected changes to newVersion */
    patch: (changes: typeof delta) => {
      if (changes) {
        realDiff.patch(curVersion, changes);
        return curVersion;
      }
      return void 0;
    }
  };
}
