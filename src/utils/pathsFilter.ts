/* eslint-disable no-console */
import chalk from 'chalk';
import { getExplicitModelDeps, resolveModelDeps } from './getModelDeps';

/** filter paths and clear models by the way */
export default function pathsFilter(
  newSwagger: Autos.SwaggerJson,
  swaggerConfig: {
    exclude?: RegExp[];
    include?: RegExp[];
    autoClearModels?: boolean;
    includeModels?: RegExp[];
  }
) {
  const { exclude, include, includeModels, autoClearModels = true } = swaggerConfig;
  if (Array.isArray(exclude) || Array.isArray(include)) {
    const { paths, definitions = {} } = newSwagger;
    const newDefinitions: typeof definitions = {};
    newSwagger.paths = Object.keys(paths).reduce<typeof paths>((newPaths, url) => {
      const included = include?.find(reg => url.match(reg));
      const excluded = exclude?.find(reg => url.match(reg));
      // no exclude, include
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
        // obtain model in need
        resolveModelDeps(getExplicitModelDeps(paths[url]), definitions, newDefinitions);
      }
      return newPaths;
    }, {});
    if (autoClearModels) {
      // exclude unused models, remain models which explicitly included
      if (newSwagger.definitions) {
        const { definitions } = newSwagger;
        newSwagger.definitions = Object.keys(definitions).reduce<typeof definitions>(
          (newDefs, model) => {
            if (includeModels && includeModels.find(reg => !!model.match(reg))) {
              newDefs[model] = definitions[model];
              // obtain deps of models which explicitly included
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
