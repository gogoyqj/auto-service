import {
  createValidateMiddle,
  requestMiddleware,
  responseMiddleware
} from 'src/validate/middleware';
import { Request, Response } from 'tests/consts';
import { SMAbstractRequest, SMAbstractResponse } from 'src/types';
import { X_SM_BASEPATH, X_SM_PATH } from 'src/consts';

describe('validate/middleware', () => {
  it('createValidateMiddle ok', async () => {
    const hooks = jest.fn();
    const next = jest.fn();
    const middleware = createValidateMiddle(hooks);
    await middleware(Request as SMAbstractRequest, Response as SMAbstractResponse, next);
    expect(hooks).toBeCalledWith(Request, Response, {
      basePath: (Request.headers as SMAbstractRequest['headers'])[X_SM_BASEPATH],
      path: (Request.headers as SMAbstractRequest['headers'])[X_SM_PATH]
    });
    expect(next).toBeCalled();
  });
});
