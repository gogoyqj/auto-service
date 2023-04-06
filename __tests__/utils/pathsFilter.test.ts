/* eslint-disable @typescript-eslint/no-object-literal-type-assertion */
/* eslint-disable @typescript-eslint/no-unused-vars */
import pathsFilter from 'src/utils/pathsFilter';

describe('utils/pathsFilter', () => {
  const getSwagger = () =>
    ({
      basePath: '/',
      paths: {
        '/exclude/1': {
          get: {
            responses: {
              '200': {
                schema: {
                  $ref: '#/definitions/EI1'
                }
              }
            }
          }
        },
        '/exclude/2': {
          get: {
            responses: {
              '200': {
                schema: {
                  $ref: '#/definitions/E2'
                }
              }
            }
          }
        },
        '/include/1': {
          get: {
            responses: {
              '200': {
                schema: {
                  $ref: '#/definitions/EI1'
                }
              }
            }
          }
        },
        '/include/2': {
          get: {
            parameters: [
              {
                name: 'username',
                in: 'path',
                schema: {
                  $ref: '#/definitions/I2'
                }
              }
            ],
            responses: {
              '200': {
                schema: {
                  $ref: '#/definitions/I3'
                }
              }
            }
          }
        }
      },
      definitions: {
        EI1: {
          $def: '#/definitions/EI_D1'
        },
        E2: {
          $def: '#/definitions/ED2'
        },
        I2: {
          $def: '#/definitions/ID2'
        },
        I3: {
          $def: '#/definitions/ID3'
        },
        EI_D1: {
          $def: '#/definitions/EID1_D1'
        },
        ED2: {},
        ID2: {},
        ID3: {},
        EID1_D1: {}
      }
    } as Autos.SwaggerJson);
  it('pathsFilter ok', () => {
    const swagger = pathsFilter(getSwagger(), {
      exclude: [/\/exclude\//]
    });
    expect(swagger).toMatchSnapshot();
  });

  it('pathsFilter includeModels ok', () => {
    const swagger = pathsFilter(getSwagger(), {
      exclude: [/\/exclude\//],
      includeModels: [/^E2$/g]
    });
    expect(swagger).toMatchSnapshot();
  });
  it('pathsFilter keepModels ok', () => {
    const swagger = pathsFilter(getSwagger(), {
      exclude: [/\/exclude\//],
      autoClearModels: false
    });
    expect(swagger).toMatchSnapshot();
  });
});
