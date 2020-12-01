/**
 * @file: diff and patch
 * @author: yangqianjun
 * @Date: 2019-12-31 13:48:32
 * @LastEditors: yangqianjun
 * @LastEditTime: 2020-02-06 11:57:31
 */

// @IMP: f*ck
import * as jsondiffpatch from 'jsondiffpatch';
import lodash from 'lodash';

// @IMP: 确保浏览器和node使用相同的版本
// eslint-disable-next-line @typescript-eslint/no-var-requires
const realDiff: typeof jsondiffpatch = require('../../static/jsondiffpatch.umd');
const splitor = '__@__@__';

export function diffAndPatch(curVersion: {}, newVersion: {}) {
  const delta = realDiff.diff(curVersion, newVersion);
  return {
    delta,
    /** 按需更新 */
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
    /** 更新 */
    patch: (d: typeof delta) => {
      if (d) {
        realDiff.patch(curVersion, d);
        return curVersion;
      }
      return void 0;
    }
  };
}
