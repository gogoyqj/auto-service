import { SwaggerJson } from './consts';

/**
 * @description 对 swagger 返回做安全检测
 * + operationId 检测，如果发现 [*]_1 结构，抛出错误，要求前端显示配置
 */

type API = SwaggerJson['paths']['a']['get'];

export const dangerousOperationIdReg = /_[0-9]{1,}$/g;
/**
 *
 * @param swagger json
 * @param savedOperationId2UrlMap  oldOperationId: url 安全映射，用以校正风险 swagger
 */
export function operationIdGuard(
  swagger: SwaggerJson,
  savedOperationId2UrlMap: { [id: string]: string } = {}
) {
  const { paths } = swagger;
  const operationId2UrlMap: { [id: string]: string } = {};
  const operationId2ApiMap: { [id: string]: API } = {};
  const dangerousOperationId2ApiMap: { [id: string]: API[] } = {};
  const url2ApiMap: { [url: string]: API } = {};
  const copySavedOperationId2UrlMap = { ...savedOperationId2UrlMap };
  return new Promise<{
    errors: string[];
    warnings: string[];
    suggestions: typeof operationId2UrlMap;
  }>(rs => {
    const dangers = Object.keys(
      Object.keys(paths).reduce<{ [id: string]: string }>((dangers, url) => {
        const apiItem = paths[url];
        Object.keys(apiItem).forEach(method => {
          const api = apiItem[method];
          const { operationId } = api;
          if (operationId) {
            const flag = `${method.toLocaleLowerCase()} ${url}`;
            operationId2UrlMap[operationId] = flag;
            operationId2ApiMap[operationId] = url2ApiMap[flag] = api;
            const dangerousOperationId = operationId.replace(dangerousOperationIdReg, '');
            if (operationId.match(dangerousOperationIdReg)) {
              dangers[dangerousOperationId] = '';
            }
            dangerousOperationId2ApiMap[dangerousOperationId] =
              dangerousOperationId2ApiMap[dangerousOperationId] || [];
            dangerousOperationId2ApiMap[dangerousOperationId].push(api);
          }
        });
        return dangers;
      }, {})
    );
    const errors: string[] = [];
    const warnings: string[] = [];
    const suggestions: typeof operationId2UrlMap = {};
    const validateAndFix = (api: API, dangerousOperationId: string) => {
      const { operationId = '' } = api;
      // 如果未配置则出错
      if (!copySavedOperationId2UrlMap[operationId]) {
        errors.push(
          `【错误】方法 "${operationId}" & "${
            operationId2UrlMap[operationId]
          }" 与 "${dangerousOperationId}" & "${
            operationId2UrlMap[dangerousOperationId]
          }" 存在不可控风险，需锁定映射关系`
        );
        suggestions[operationId] = operationId2UrlMap[operationId];
      } else if (copySavedOperationId2UrlMap[operationId] !== operationId2UrlMap[operationId]) {
        /**
         * 尝试自动人工干涉
         *  干涉配置:
         *    get   => /api/get
         *    get_1 => /api/get-1
         *  实际返回
         *    get_1 => /api/get
         *    get   => /api/get-1
         *  干涉结果
         *    get   => /api/get
         *    get_1 => /api/get-1
         */
        const correctOpreationId = findMatchKeyByValue(
          operationId2UrlMap[operationId],
          savedOperationId2UrlMap
        );
        if (correctOpreationId) {
          warnings.push(
            `【警告】方法 "${operationId}" & "${copySavedOperationId2UrlMap[operationId]}" 与 "${
              operationId2UrlMap[operationId]
            }" 不匹配，自动纠正为 "${correctOpreationId}"`
          );
          api.operationId = correctOpreationId;
        } else {
          errors.push(
            `【错误】与 "${copySavedOperationId2UrlMap[operationId]}" 对应的方法不能为空`
          );
        }
      }
      // @cc: 风险解除
      delete copySavedOperationId2UrlMap[operationId];
    };
    dangers.reduce((errors, dangerousOperationId) => {
      const group = dangerousOperationId2ApiMap[dangerousOperationId];
      group.forEach(api => validateAndFix(api, dangerousOperationId));
      return errors;
    }, errors);
    Object.keys(copySavedOperationId2UrlMap).reduce((errors, specifiedOpreationId) => {
      // @cc: 人工干涉配置多余 swagger 配置
      const url = copySavedOperationId2UrlMap[specifiedOpreationId];
      const api = url2ApiMap[url];
      if (!api) {
        errors.push(
          `【错误】方法 "${specifiedOpreationId}" 对应的 "${url}" 似乎已被移除或者发生了变化，请更新`
        );
      } else {
        validateAndFix(api, api.operationId as string);
      }
      return errors;
    }, errors);
    rs({
      errors,
      warnings,
      suggestions
    });
  });
}

export function findMatchKeyByValue(value: any, map: { [k: string]: any }) {
  return Object.keys(map).find(key => {
    return map[key] === value;
  });
}
