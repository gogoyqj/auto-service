import * as Ajv from 'ajv';
import { SwaggerJson } from 'src/types';
// console.time('begin');
// const { paths, definitions } = require('../api-swagger.json');
// const { get } = paths['/api/v1/admin/headhunter/position'];

// const ajv = new Ajv();
// ajv.addFormat('int32', d => {
//   return true;
// });
// const validate = ajv.compile({
//   ...get.responses['200'].schema,
//   definitions
// });
// console.log(
//   validate({
//     code: 200,
//     result: ''
//   })
// );
// console.timeEnd('begin');

export default class Validate {
  public ajv: Ajv.Ajv;
  public initAjx() {
    const ajv = new Ajv();
    ajv.addFormat('int32', d => {
      return true;
    });
    ajv.addFormat('int64', d => {
      return true;
    });
    return ajv;
  }
  public getDefinitions(swagger: SwaggerJson, basePath: string) {
    const { definitions } = swagger;
    if (definitions) {
      this.ajv.addSchema(definitions, basePath);
    }
    return definitions;
  }
}
