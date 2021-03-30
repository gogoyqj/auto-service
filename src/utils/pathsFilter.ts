import { SwaggerJson } from 'src/consts';
import chalk from 'chalk';
import { getExplicitModelDeps, resolveModelDeps } from './getModelDeps';

export default function pathsFilter(
  newSwagger: SwaggerJson,
  swaggerConfig: {
    exclude?: RegExp[];
    include?: RegExp[];
    autoClearModels?: boolean;
    includeModels?: RegExp[];
  }
) {
  // 支持过滤掉某些特定的规则
  const { exclude, include, includeModels, autoClearModels = true } = swaggerConfig;
  if (Array.isArray(exclude) || Array.isArray(include)) {
    const { paths, definitions = {} } = newSwagger;
    const newDefinitions: typeof definitions = {};
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
        resolveModelDeps(getExplicitModelDeps(paths[url]), definitions, newDefinitions);
      }
      return newPaths;
    }, {});
    if (autoClearModels) {
      // 清理未被依赖的 model，保留被强制包含的 model
      if (newSwagger.definitions) {
        const { definitions } = newSwagger;
        newSwagger.definitions = Object.keys(definitions).reduce<typeof definitions>(
          (newDefs, model) => {
            if (includeModels && includeModels.find(reg => !!model.match(reg))) {
              newDefs[model] = definitions[model];
              // 提取强制包含的 model 的依赖
              getExplicitModelDeps(definitions[model])?.forEach(model => {
                if (!(model in newDefs)) {
                  newDefs[model] = definitions[model];
                }
              });
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
  }
  return newSwagger;
}
