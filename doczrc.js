/**
 * @file: sm2tsservice docz 配置
 * @author: yangqianjun
 * @Date: 2019-12-31 17:48:44
 * @LastEditors: yangqianjun
 * @LastEditTime: 2019-12-31 19:04:17
 */

export default {
  title: 'Autos',
  base: '/',
  files: '**/*.{md,mdx}',
  typescript: true,
  dest: 'docs',
  menu: ['指南', '快速上手', '数据校验'],
  filterComponents: files => files.filter(p => p.match(/ts[x]?$/))
};
