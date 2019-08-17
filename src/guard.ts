import { SwaggerJson, GuardConfig, String2StringMap } from './consts';

/**
 * @description 对 swagger 返回做安全检测
 * 前提:
 *  - http method + url 唯一
 *  - 后端变更 http method、url 必须周知前端
 */

type API = SwaggerJson['paths']['a']['get'];

export const dangerousOperationIdReg = /_[0-9]{1,}$/g;
export const defaultPrefixReg = /^(\/)?api\//g;

export interface HttpMethodUrl2APIMap {
  [url: string]: API;
}
/**
 *
 * @param swagger json
 * @param savedMethodUrl2OperationIdMap  http method + url : oldOperationId 安全映射，用以校正风险 swagger
 */
export function operationIdGuard(swagger: SwaggerJson, config: GuardConfig = {}) {
  const {
    methodUrl2OperationIdMap: savedMethodUrl2OperationIdMap = {},
    mode,
    prefixReg = defaultPrefixReg
  } = config;
  const { paths } = swagger;
  // http method + url => api info 映射
  const methodUrl2ApiMap: HttpMethodUrl2APIMap = {};
  // operationId 匹配 _[0-9] 格式，及存在被 swagger
  const dangerousOperationId2ApiMap: { [id: string]: API[] } = {};
  const copySavedMethodUrl2OperationIdMap = { ...savedMethodUrl2OperationIdMap };

  // @cc: 风险日志
  const errors: string[] = [];
  // @cc: 根据锁定关系自动校正日志
  const warnings: string[] = [];
  // @cc: 自动推断出来的锁定映射关系
  const suggestions: String2StringMap = {};
  const isSafe = mode === 'safe';
  const isStrict = mode === 'strict';

  // @cc: 新项目，检测 tags 是否符合规范

  const dangers = Object.keys(
    Object.keys(paths).reduce<{ [id: string]: string }>((dangers, url) => {
      const apiItem = paths[url];
      Object.keys(apiItem).forEach(method => {
        const api = apiItem[method];
        const { operationId } = api;
        if (operationId) {
          // @cc: urlUsingMethod 作为 operationId
          api.privateOperationId =
            url
              .replace(prefixReg, '')
              .replace(/^\//g, '')
              .replace(/[/-]([^/])/g, (mat, u: string) => u.toUpperCase()) +
            'Using' +
            method[0].toUpperCase() +
            method.substring(1);
          const methodUrl = `${method.toLocaleLowerCase()} ${url}`;
          api.privateMethodUrl = methodUrl;
          methodUrl2ApiMap[methodUrl] = api;
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

  const validateThrowAndFix = (api: API) => {
    const { operationId = '', privateMethodUrl = '' } = api;
    const savedOperationId = copySavedMethodUrl2OperationIdMap[privateMethodUrl];
    if (!savedOperationId) {
      errors.push(
        `【错误】方法 "${operationId}" & "${privateMethodUrl}" 存在不可控风险，需锁定映射关系`
      );
      suggestions[privateMethodUrl] = operationId;
    } else if (savedOperationId !== operationId) {
      /**
       * 尝试自动人工干涉
       *  干涉配置:
       *    get /api/get   => get
       *    get /api/get-1 => get_1
       *  实际返回
       *    get /api/get   => get_1
       *    get /api/get-1 => get
       *  干涉结果
       *    get /api/get   => get
       *    get /api/get-1 => get_1
       */
      warnings.push(
        `【警告】方法 "${operationId}" 与 "${privateMethodUrl}" 不匹配，自动纠正为 "${savedOperationId}"`
      );
      api.operationId = savedOperationId;
      delete api.privateMethodUrl;
    } // else 映射关系匹配
    // @cc: 风险已处理
    delete copySavedMethodUrl2OperationIdMap[privateMethodUrl];
  };
  dangers.reduce((errors, dangerousOperationId) => {
    const group = dangerousOperationId2ApiMap[dangerousOperationId];
    group.forEach(api => validateThrowAndFix(api));
    return errors;
  }, errors);
  Object.keys(copySavedMethodUrl2OperationIdMap).reduce((errors, methodUrl) => {
    // @cc: 人工干涉配置多于 swagger 配置
    const operationId = copySavedMethodUrl2OperationIdMap[methodUrl];
    const api = methodUrl2ApiMap[methodUrl];
    if (!api) {
      errors.push(
        `【错误】方法 "${operationId}" 对应的 "${methodUrl}" 似乎已被移除或者发生了变化，请更新`
      );
    } else {
      validateThrowAndFix(api);
    }
    return errors;
  }, errors);
  // @cc: 校正成功之后才可迁移
  if (!errors.length && !Object.keys(suggestions).length && (isSafe || isStrict)) {
    Object.keys(paths).forEach(url => {
      const apiItem = paths[url];
      Object.keys(apiItem).forEach(method => {
        const api = apiItem[method];
        const { operationId, privateOperationId } = api;
        if (operationId) {
          // @cc: urlUsingMethod 作为 operationId
          api.operationId = privateOperationId;
          suggestions[operationId] = privateOperationId;
        }
      });
    });
    return {
      errors,
      warnings,
      suggestions: Object.keys(suggestions).length
        ? [
            '旧 => 新 方法替换映射关系，请按建议顺序降序逐一替换',
            Object.keys(suggestions)
              .sort((a, b) => {
                return -(parseInt(a.split('_')[1]) || 0) + (parseInt(b.split('_')[1]) || 0);
              })
              .reduce<String2StringMap>((s, id) => {
                s[id] = suggestions[id];
                return s;
              }, {})
          ]
        : []
    };
  }
  return {
    errors,
    warnings,
    suggestions: Object.keys(suggestions).length
      ? [
          '锁定映射建议，添加到 service 配置',
          {
            guardConfig: {
              methodUrl2OperationIdMap: suggestions
            }
          }
        ]
      : []
  };
}

// @cc: 检测是否手写了 tags
export const InstableTagsReg = /^[a-z-0-9_$A-Z]+-controller$/g;
// @cc: 检测是否全英文
export const validTagsReg = /^[a-z-0-9_$]+$/gi;

export function strictModeGuard(swagger: SwaggerJson, config: GuardConfig) {
  const { tags = [] } = swagger;
  const { mode } = config;
  const info = {
    errors: Array<string>(),
    warnings: Array<string>()
  };
  if (mode === 'strict') {
    // 是否没有写 tags
    tags.reduce<string[]>((errors, tag) => {
      const { name = '' } = tag;
      if (name.match(InstableTagsReg)) {
        errors.push(
          `【错误】 tags "${JSON.stringify(
            tag,
            null,
            2
          )}" 命名不符合规范或由于 @Api 未添加 tags，存在不可控风险，请联系接口方修改`
        );
      }
      if (!name.match(validTagsReg)) {
        errors.push(
          `【错误】 tags "${JSON.stringify(tag, null, 2)}" 命名包含非英文字符，请联系接口方修改`
        );
      }
      return errors;
    }, info.errors);
  }
  return Promise.resolve(info);
}
