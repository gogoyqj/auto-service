import { SwaggerJson } from 'src/consts';

/** 从对象里提取所有显式的 model 依赖 */
export function getExplicitModelDeps(obj: {} | undefined) {
  return JSON.stringify(obj)
    ?.match(/['"]#\/definitions\/[^"']+/g)
    ?.reduce<string[]>((matched, mat) => {
      const [, , model] = mat.split('/');
      if (matched.indexOf(model) === -1) {
        matched.push(model);
      }
      return matched;
    }, []);
}

/** 提取嵌套依赖 */
export function resolveModelDeps(
  models: string[] = [],
  definitions: SwaggerJson['definitions'] = {},
  resolvedDeps: SwaggerJson['definitions'] = {}
) {
  models.forEach(model => {
    if (!(model in resolvedDeps)) {
      const def = (resolvedDeps[model] = definitions[model]);
      const subModels = getExplicitModelDeps(def);
      if (subModels) {
        while (subModels.length) {
          const subModel = subModels.pop();
          if (subModel && !(subModel in resolvedDeps)) {
            resolvedDeps[subModel] = definitions[subModel];
            const grandModels =
              definitions[subModel] && getExplicitModelDeps(definitions[subModel]);
            grandModels && subModels.push(...grandModels);
          }
        }
      }
    }
  });
}
