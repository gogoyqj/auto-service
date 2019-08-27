import * as qs from 'qs';
import {
  getPathParamsNames,
  concatPath,
  getPathParams,
  getParams,
  getReadableDataAsync
} from 'src/validate/utils';
import { SMAbstractRequest } from 'src/consts';
import { Request, mockRequest, testJSON } from 'tests/consts';

describe('validate/utils', () => {
  const pathTpl = '/{id}/{name}/';
  const path = '/2/yqj/';

  it('getPathParamsNames ok', () => {
    expect(getPathParamsNames(pathTpl)).toMatchObject(Object.keys(testJSON));
  });

  it('concatPath ok', () => {
    expect(concatPath('/', ['/a'], undefined, 'b')).toEqual('/a/b');
  });

  it('getPathParams ok', () => {
    expect(getPathParams(pathTpl, path)).toEqual(testJSON);
  });

  it('getParams ok', () => {
    expect(getParams(Request as SMAbstractRequest)).toMatchSnapshot();
  });

  it('getReadableDataAsync ok', async () => {
    const stream = mockRequest({});
    const data = await getReadableDataAsync(stream as any);
    expect(data).toEqual(qs.stringify(testJSON));
  });
});
