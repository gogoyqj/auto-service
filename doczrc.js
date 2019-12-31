/**
 * @file: sm2tsservice docz 配置
 * @author: yangqianjun
 * @Date: 2019-12-31 17:48:44
 * @LastEditors: yangqianjun
 * @LastEditTime: 2019-12-31 19:04:17
 */

export default {
  title: 'sm2tsservice',
  base: '/sm2tsservice',
  typescript: true,
  dest: 'docs',
  filterComponents: files => files.filter(p => p.match(/ts[x]?$/))
};
