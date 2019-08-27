import {
  createValidateMiddle,
  requestMiddleware,
  responseHooksFactory
} from 'src/validate/middleware';
import { Request, Response, testJSON, mockRequest } from 'tests/consts';
import {
  X_SM_BASEPATH,
  X_SM_PATH,
  X_SM_PARAMS,
  SMAbstractRequest,
  SMAbstractResponse,
  SMValidateInfo
} from 'src/consts';

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

  it('requestMiddleware/json ok', async () => {
    const req = mockRequest({ 'content-type': 'application/json' });
    await requestMiddleware(req as any, Response as SMAbstractResponse);
    expect(req[X_SM_PARAMS].data).toMatchObject(testJSON);
    expect(req[X_SM_PARAMS].body).toMatchObject(testJSON);
  });

  it('requestMiddleware/form ok', async () => {
    const req = mockRequest({ 'content-type': 'application/x-www-form-urlencoded' });
    await requestMiddleware(req as any, Response as SMAbstractResponse);
    expect(req[X_SM_PARAMS].form).toMatchObject(testJSON);
    expect(req[X_SM_PARAMS].body).toMatchObject(testJSON);
  });

  it('requestMiddleware/json ok', async () => {
    const hooks = jest.fn();
    const middleware = responseHooksFactory(hooks);
    const res = mockRequest({ 'content-type': 'application/json' });
    const swagger = {
      basePath: '/test/api',
      path: 'test'
    };
    await middleware(Request as SMAbstractRequest, res as any, swagger);
    const data: { code: number; message: string; result: SMValidateInfo } = {
      code: 0,
      message: '',
      result: {
        req: Request as any,
        res,
        send: undefined as any,
        receive: {
          body: testJSON,
          status: 200
        },
        swagger
      }
    };
    expect(hooks).toBeCalledWith(data);
  });
});
