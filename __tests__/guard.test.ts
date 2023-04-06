/* eslint-disable @typescript-eslint/camelcase */
import { operationIdGuard, strictModeGuard } from 'src/guard';

const url = '/api/v1/persons';
const url1 = '/api/v1/interviewer/persons';
const url2 = '/api/v1/interviewer/{user-name}';
function getSwagger(): Autos.SwaggerJson {
  return {
    basePath: '/',
    paths: {
      [url1]: {
        get: {
          operationId: 'personsUsingGET',
          parameters: [],
          responses: {
            '200': {
              description: 'OK'
            }
          },
          deprecated: false
        }
      },
      [url]: {
        get: {
          operationId: 'personsUsingGET_1',
          parameters: [],
          responses: {
            '200': {
              description: 'OK'
            }
          },
          deprecated: false
        }
      },
      [url2]: {
        get: {
          operationId: 'personsUsingGET_2',
          parameters: [],
          responses: {
            '200': {
              description: 'OK'
            }
          },
          deprecated: false
        }
      }
    }
  };
}

const optionIdMethodUrlIncrementMap: Autos.GuardConfig = {
  methodUrl2OperationIdMap: {
    'get /api/v1/persons': 'personsUsingGET',
    'get /api/v1/interviewer/persons': 'personsUsingGET_1'
  }
};
const optionIdMethodUrlSafeModeDuplicateMap: Autos.GuardConfig = {
  mode: 'safe',
  methodUrl2OperationIdMap: {
    'get /api/v1/persons': 'personsUsingGET',
    'get /api/v1/interviewer/persons': 'personsUsingGET',
    'get /api/v1/interviewer/{user-name}': 'v1InterviewerUserNameUsingGet'
  }
};

const optionIdMethodUrlMap: Autos.GuardConfig = {
  methodUrl2OperationIdMap: {
    'get /api/v1/persons': 'personsUsingGET',
    'get /api/v1/interviewer/persons': 'personsUsingGET_1',
    'get /api/v1/interviewer/{user-name}': 'personsUsingGET_2'
  }
};

const optionIdMethodUrlMap2: Autos.GuardConfig = {
  methodUrl2OperationIdMap: {
    'get /api/v1/interviewer/persons': 'personsUsingGET',
    'get /api/v1/persons': 'personsUsingGET_1',
    'get /api/v1/interviewer/{user-name}': 'personsUsingGET_2'
  }
};

describe('guard', () => {
  it('operationIdGuard should work ok', async () => {
    let swagger = getSwagger();
    let res = await operationIdGuard(swagger, {});
    expect(res).toMatchSnapshot('1 error');
    expect(swagger).toMatchSnapshot('1 error');

    swagger = getSwagger();
    res = await operationIdGuard(swagger, optionIdMethodUrlMap);
    expect(res).toMatchSnapshot('2 autofix');
    expect(swagger).toMatchSnapshot('2 autofix');

    swagger = getSwagger();
    swagger.paths = {};
    res = await operationIdGuard(swagger, optionIdMethodUrlMap);
    expect(res).toMatchSnapshot('3 remove error');
    expect(swagger).toMatchSnapshot('3 remove error');

    swagger = getSwagger();
    swagger.paths = {
      [url1]: swagger.paths[url1]
    };
    res = await operationIdGuard(swagger, optionIdMethodUrlMap);
    expect(res).toMatchSnapshot('4 partial remove error');
    expect(swagger).toMatchSnapshot('4 partial remove error');

    swagger = getSwagger();
    swagger.paths = {
      [url1]: swagger.paths[url1]
    };
    res = await operationIdGuard(swagger, optionIdMethodUrlMap2);
    expect(res).toMatchSnapshot('5 partial remove ok');
    expect(swagger).toMatchSnapshot('5 partial remove ok');
  });

  it('operationIdGuard increment should work ok', async () => {
    const swagger = getSwagger();
    const res = await operationIdGuard(swagger, optionIdMethodUrlIncrementMap);
    expect(res).toMatchSnapshot();
    expect(swagger).toMatchSnapshot();
  });

  it('operationIdGuard duplicate map should throw errors', async () => {
    const swagger = getSwagger();
    const res = await operationIdGuard(swagger, optionIdMethodUrlSafeModeDuplicateMap);
    expect(res).toMatchSnapshot();
    expect(swagger).toMatchSnapshot();
  });

  it('operationIdGuard safe mode should work ok', async () => {
    let swagger = getSwagger();
    let res = await operationIdGuard(swagger, { mode: 'safe' });
    expect(res).toMatchSnapshot('1 error');
    expect(swagger).toMatchSnapshot('1 error');

    swagger = getSwagger();
    res = await operationIdGuard(swagger, { ...optionIdMethodUrlMap, mode: 'safe' });
    expect(res).toMatchSnapshot('2 autofix');
    expect(swagger).toMatchSnapshot('2 autofix');

    swagger = getSwagger();
    swagger.paths = {};
    res = await operationIdGuard(swagger, { ...optionIdMethodUrlMap, mode: 'safe' });
    expect(res).toMatchSnapshot('3 remove error');
    expect(swagger).toMatchSnapshot('3 remove error');

    swagger = getSwagger();
    swagger.paths = {
      [url1]: swagger.paths[url1]
    };
    res = await operationIdGuard(swagger, { ...optionIdMethodUrlMap, mode: 'safe' });
    expect(res).toMatchSnapshot('4 partial remove error');
    expect(swagger).toMatchSnapshot('4 partial remove error');

    swagger = getSwagger();
    swagger.paths = {
      [url1]: swagger.paths[url1]
    };
    res = await operationIdGuard(swagger, { ...optionIdMethodUrlMap, mode: 'safe' });
    expect(res).toMatchSnapshot('5 partial remove ok');
    expect(swagger).toMatchSnapshot('5 partial remove ok');
  });

  it('operationIdGuard strict mode should work ok', async () => {
    let swagger = getSwagger();
    let res = await operationIdGuard(swagger, { mode: 'safe' });
    expect(res).toMatchSnapshot('1 error');
    expect(swagger).toMatchSnapshot('1 error');

    swagger = getSwagger();
    res = await operationIdGuard(swagger, { ...optionIdMethodUrlMap, mode: 'strict' });
    expect(res).toMatchSnapshot('2 autofix');
    expect(swagger).toMatchSnapshot('2 autofix');

    swagger = getSwagger();
    swagger.paths = {};
    res = await operationIdGuard(swagger, { ...optionIdMethodUrlMap, mode: 'strict' });
    expect(res).toMatchSnapshot('3 remove error');
    expect(swagger).toMatchSnapshot('3 remove error');

    swagger = getSwagger();
    swagger.paths = {
      [url1]: swagger.paths[url1]
    };
    res = await operationIdGuard(swagger, { ...optionIdMethodUrlMap, mode: 'strict' });
    expect(res).toMatchSnapshot('4 partial remove error');
    expect(swagger).toMatchSnapshot('4 partial remove error');

    swagger = getSwagger();
    swagger.paths = {
      [url1]: swagger.paths[url1]
    };
    res = await operationIdGuard(swagger, { ...optionIdMethodUrlMap, mode: 'strict' });
    expect(res).toMatchSnapshot('5 partial remove ok');
    expect(swagger).toMatchSnapshot('5 partial remove ok');

    swagger = getSwagger();
    swagger.paths = {
      [url1]: {
        get: {
          operationId: 'personsUsingGET',
          parameters: [
            {
              name: 'bad arg',
              in: 'query',
              description: 'bad arg',
              required: false
            },
            {
              name: 'bad-arg',
              in: 'form',
              description: 'bad-arg',
              required: false
            },
            {
              name: 'bad坏arg',
              in: 'path',
              description: 'bad坏arg',
              required: false
            },
            {
              name: 'goodArg',
              in: 'path',
              description: 'good arg',
              required: false
            }
          ],
          responses: {
            '200': {
              description: 'Test'
            }
          },
          deprecated: false
        }
      }
    };
    res = await operationIdGuard(swagger, { ...optionIdMethodUrlMap, mode: 'strict' });
    expect(res).toMatchSnapshot('6 params check error');
    expect(swagger).toMatchSnapshot('6 params check error');
  });

  it('strictModeGuard should work ok', async () => {
    const swagger = getSwagger();
    swagger.tags = [
      {
        name: '错误',
        description: '这个tags不合格'
      },
      {
        name: 'xxx-controller',
        description: '这个tags不合格'
      },
      {
        name: 'ok',
        description: '这个tags合格'
      }
    ];
    const info = await strictModeGuard(swagger, { mode: 'strict' });

    expect(info).toMatchSnapshot('strictModeGuard');
  });
});
