import { SwaggerJson } from 'src/consts';
import chalk from 'chalk';

export default function pathsFilter(
  newSwagger: SwaggerJson,
  swaggerConfig: {
    exclude?: RegExp[];
    include?: RegExp[];
    includeModels?: RegExp[];
  }
) {
  // 支持过滤掉某些特定的规则
  const { exclude, include, includeModels } = swaggerConfig;
  if (Array.isArray(exclude) || Array.isArray(include)) {
    const { paths, definitions = {} } = newSwagger;
    const newDefinitions: typeof definitions = {};
    const checkModel = (obj: {} | undefined) =>
      JSON.stringify(obj)
        ?.match(/['"]#\/definitions\/[^"']+/g)
        ?.reduce<string[]>((matched, mat) => {
          const [, , model] = mat.split('/');
          if (!(model in newDefinitions)) {
            newDefinitions[model] = definitions[model];
            matched.push(model);
          }
          return matched;
        }, []);
    const resolveDeps = (models: string[] = []) =>
      models.forEach(model => {
        const def = definitions[model];
        const subModel = checkModel(def);
        if (subModel) {
          while (subModel.length) {
            const model = subModel.pop();
            const grandModel = model && definitions[model] && checkModel(definitions[model]);
            grandModel && subModel.push(...grandModel);
          }
        }
      });
    newSwagger.paths = Object.keys(paths).reduce<typeof paths>((newPaths, url) => {
      const included = include?.find(reg => url.match(reg));
      const excluded = exclude?.find(reg => url.match(reg));
      // 未配置 exclude 但是配置配置了 include
      if (exclude === undefined && include !== undefined) {
        if (included) {
          newPaths[url] = paths[url];
        }
      } else {
        if (included || !excluded) {
          newPaths[url] = paths[url];
        }
      }
      if (url in newPaths && definitions) {
        // 提取 used model
        resolveDeps(checkModel(paths[url]));
      }
      return newPaths;
    }, {});
    // 清理未被依赖的 model，保留被强制包含的 model
    if (newSwagger.definitions) {
      const { definitions } = newSwagger;
      newSwagger.definitions = Object.keys(definitions).reduce<typeof definitions>(
        (newDefs, model) => {
          if (includeModels && includeModels.find(reg => !!model.match(reg))) {
            newDefs[model] = definitions[model];
            checkModel(definitions[model]);
          }
          return newDefs;
        },
        newDefinitions
      );
    }
    const filtered = Object.keys(definitions).filter(model => !(model in newDefinitions));
    if (filtered.length) {
      console.log(chalk.yellowBright(`[IMP] Auto 将自动清理 ${filtered.join(',')} 等 models！`));
    }
  }
  return newSwagger;
}
