import * as jsondiffpatchNode from 'jsondiffpatch';

type jsondiffpatch = typeof jsondiffpatchNode;

declare global {
  const jsondiffpatch: jsondiffpatch;
}
