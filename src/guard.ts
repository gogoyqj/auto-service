/**
 * @description 对 swagger 返回做安全检测
 * 前提:
 *  - http method + url 唯一
 *  - 后端变更 http method、url 必须周知前端
 */

import { SwaggerJson, GuardConfig, String2StringMap } from './consts';

type API = SwaggerJson['paths']['a']['get'];

/** Name_1 格式的 operationId */
export const dangerousOperationIdReg = /_[0-9]{1,}$/g;
export const defaultPrefixReg: Required<GuardConfig>['prefixReg'] = /^(\/)?api\//g;
export const defaultBadParamsReg: Required<GuardConfig>['badParamsReg'] = /[^a-z0-9_.[]$]/gi;

export interface HttpMethodUrl2APIMap {
  [url: string]: API;
}
/** 构建 http method + url : oldOperationId 安全映射，用以校正风险 swagger */
export function operationIdGuard(swagger: SwaggerJson, config: GuardConfig = {}) {
  const {
    methodUrl2OperationIdMap: savedMethodUrl2OperationIdMap = {},
    mode,
    prefixReg = defaultPrefixReg,
    badParamsReg = defaultBadParamsReg,
    methodPrefix = 'Using'
  } = config;
  const { paths } = swagger;
  /**  http method + url => api info 映射 */
  const methodUrl2ApiMap: HttpMethodUrl2APIMap = {};
  /** XXXX_*` => `XXXX` 对 api 条目分组 */
  const operationId2ApiMap: { [id: string]: API[] } = {};
  /** 已持久化 `method` + `url` => operationId 映射 */
  const copySavedMethodUrl2OperationIdMap = { ...savedMethodUrl2OperationIdMap };
  const isRelationMapped = !!Object.keys(copySavedMethodUrl2OperationIdMap).length;

  /** 错误日志：例如参数错误、危险operationId */
  const errors: string[] = [];
  /** 警告日志：根据锁定关系自动校正日志 */
  const warnings: string[] = [];
  /** 自动推断出来的锁定映射关系 */
  const suggestions: String2StringMap = {};
  const isSafe = mode === 'safe';
  const isStrict = mode === 'strict';

  /** 风险 operationId 数组 */
  const dangers = Object.keys(
    Object.keys(paths).reduce<{ [id: string]: string }>((dangerousOperationIdMap, url) => {
      const apiItem = paths[url];
      Object.keys(apiItem).forEach(method => {
        const api = apiItem[method];
        const { operationId, parameters = [], responses } = api;
        // 参数格式校验
        parameters.forEach(({ name = '', in: pType, description = '', schema }) => {
          if (name.match(badParamsReg)) {
            errors.push(
              `【错误】接口 "${method} ${url}" "${pType}" 参数 "${name}" "${description}" 不符合规范，请联系接口方修改`
            );
          }
          // 校验 schema，+ type 缺省的情况下
          if (schema && !schema.type && !schema.$ref && !schema['$$ref'] && !schema.properties) {
            errors.push(
              `【错误】接口 "${method} ${url}" "${pType}" 参数 "${name}" "${description}" 无效的 schema（缺少 "$ref" 或 "$$ref" 或 "properties" 字段），请联系接口方修改`
            );
          }
          if (
            pType === 'path' &&
            !url.match(new RegExp(`({${name}})|(:${name}[/])|(:${name}$)`, 'g'))
          ) {
            // 校验 path参数是否存在url
            errors.push(
              `【错误】接口 "${method} ${url}" "${pType}" 参数 "${name}" "${description}" 可能编写错误或废弃，请联系接口方修改`
            );
          }
        });
        // 响应格式校验：响应不同于参数，忽略
        // Object.keys(responses).forEach(httpStatus => {
        //   const { schema, description } = responses[httpStatus];
        //   if (schema && !schema.$ref && !schema['$$ref'] && !schema.properties) {
        //     errors.push(
        //       `【错误】接口 "${method} ${url}" "${httpStatus}" 响应 "${description}" 无效的 schema（缺少 "$ref" 或 "$$ref" 或 "properties" 字段），请联系接口方修改`
        //     );
        //   }
        // });
        if (operationId) {
          // `url`Using`Method` 作为 operationId，唯一固定
          api.privateOperationId =
            url
              .replace(prefixReg, '')
              .replace(/(^\/|})/g, '')
              .replace(/[/{_-]{1,}([^/])/g, (mat, u: string) => u.toUpperCase()) +
            methodPrefix +
            method[0].toUpperCase() +
            method.substring(1);
          // IMP: 严格模式 & 新项目，不再无谓校验 operationId 是否存在风险，直接使用 privateOperationId
          if (isStrict) {
            api.operationId = api.privateOperationId;
          } else {
            // url -> api 映射
            const methodUrl = `${method.toLocaleLowerCase()} ${url}`;
            api.privateMethodUrl = methodUrl;
            methodUrl2ApiMap[methodUrl] = api;
            // 格式化 `XXXX_*` 为 `XXXX`
            const dangerousOperationId = operationId.replace(dangerousOperationIdReg, '');
            // 如果出现 `XXXX_*` 则标记 `XXXX` 存在风险
            if (`${operationId || ''}`.match(dangerousOperationIdReg)) {
              dangerousOperationIdMap[dangerousOperationId] = '';
            }
            // 将 api 按 `XXXX` 维度分组
            operationId2ApiMap[dangerousOperationId] =
              operationId2ApiMap[dangerousOperationId] || [];
            operationId2ApiMap[dangerousOperationId].push(api);
          }
        }
      });
      return dangerousOperationIdMap;
    }, {})
  );

  if (errors.length) {
    return {
      errors,
      warnings,
      suggestions: []
    };
  }

  /** 校验 or 修复 api operationId 风险 */
  const validateOrFixOperationId = (api: API, errors: string[]) => {
    const { operationId = '', privateMethodUrl = '', privateOperationId } = api;
    const savedOperationId = copySavedMethodUrl2OperationIdMap[privateMethodUrl];
    if (!savedOperationId) {
      errors.push(
        `【错误】方法 "${operationId}" & "${privateMethodUrl}" 存在不可控风险，需锁定映射关系`
      );
      // 增量情况下，使用 `url` + `method`【privateOperationId】 替代原有 `operationId`，避免重复
      suggestions[privateMethodUrl] = isRelationMapped ? privateOperationId : operationId;
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
      // 校正
      api.operationId = savedOperationId;
      delete api.privateMethodUrl;
    } // else 映射关系匹配
    // 风险已处理
    delete copySavedMethodUrl2OperationIdMap[privateMethodUrl];
  };

  // IMP: 对危险分组进行校验或修复
  dangers.reduce((errors, dangerousOperationId) => {
    const group = operationId2ApiMap[dangerousOperationId];
    group.forEach(api => validateOrFixOperationId(api, errors));
    return errors;
  }, errors);

  // IMP: 对剩余映射进行清理、映射对应的 api 进行校验或修复
  Object.keys(copySavedMethodUrl2OperationIdMap).reduce((errors, methodUrl) => {
    const mappedPperationId = copySavedMethodUrl2OperationIdMap[methodUrl];
    const api = methodUrl2ApiMap[methodUrl];
    // 已移除的 api
    if (!api) {
      // 向下兼容老 `strict` 模式，不再抛出映射过期提示
      if (!isStrict) {
        errors.push(
          `【错误】方法 "${mappedPperationId}" 对应的 "${methodUrl}" 似乎已被移除或者发生了变化，请更新`
        );
      }
    } else {
      // 需要修复的 api
      validateOrFixOperationId(api, errors);
    }
    return errors;
  }, errors);

  // IMP: 仅安全模式生成替换提示
  if (!errors.length && !Object.keys(suggestions).length && isSafe) {
    try {
      Object.keys(paths).forEach(url => {
        const apiItem = paths[url];
        Object.keys(apiItem).forEach(method => {
          const api = apiItem[method];
          const { operationId, privateOperationId } = api;
          if (operationId) {
            // `url` + Using` + Method` 作为 operationId
            api.operationId = privateOperationId;
            // 处置重复 operationId
            if (operationId in suggestions) {
              throw Error(
                `【错误】映射内检测到重复 ${operationId}，无法生成正确旧、新方法替换映射关系`
              );
            } else {
              suggestions[operationId] = privateOperationId;
            }
          }
        });
      });
    } catch (e) {
      return {
        errors: [e.message],
        warnings: [],
        suggestions: []
      };
    }

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
                s[`Params${id}`] = `Params${s[id]}`;
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

export const DefaultUnstableTagsReg: Required<
  GuardConfig
>['unstableTagsReg'] = /^[a-z-0-9_$A-Z]+-controller$/g;
export const DefaultValidTagsReg: Required<GuardConfig>['validTagsReg'] = /^[a-z-0-9_$]+$/gi;
export const DefaultValidDefinitionReg: Required<
  GuardConfig
>['validDefinitionReg'] = /^[a-z-0-9_$«»,]+$/gi;
export const DefaultValidUrlReg: Required<GuardConfig>['validUrlReg'] = /api/g;

/** 严格模式特有校验逻辑 */
export function strictModeGuard(swagger: SwaggerJson, config: GuardConfig) {
  const { tags = [], definitions = {}, paths, basePath } = swagger;
  const {
    mode,
    unstableTagsReg = DefaultUnstableTagsReg,
    validTagsReg = DefaultValidTagsReg,
    validDefinitionReg = DefaultValidDefinitionReg,
    validUrlReg = DefaultValidUrlReg
  } = config;
  const info = {
    errors: Array<string>(),
    warnings: Array<string>()
  };
  if (mode === 'strict') {
    // 校验 basePath
    const isPathValid = !!(basePath && basePath.match(validUrlReg));
    // @cc: tags 是否符合规范
    tags.reduce<string[]>((errors, tag) => {
      const { name = '' } = tag;
      if (name.match(unstableTagsReg)) {
        errors.push(
          `【错误】 tags "${JSON.stringify(
            tag,
            null,
            2
          )}" 命名不符合规范或由于 @Api 装饰器未添加 tags，存在不可控风险，请联系接口方修改`
        );
      }
      if (!name.match(validTagsReg)) {
        errors.push(
          `【错误】 tags "${JSON.stringify(
            tag,
            null,
            2
          )}" 命名包含非英文字符，@Api 装饰器不能添加非法 tags，请联系接口方修改`
        );
      }
      return errors;
    }, info.errors);
    // @cc: definitions 是否符合规范
    Object.keys(definitions).reduce((errors, dto) => {
      if (!dto.match(validDefinitionReg)) {
        errors.push(
          `【错误】 definitions name - DTO "${dto}" 命名包含非英文字符，请联系接口方修改`
        );
      }
      return errors;
    }, info.errors);
    // 单独校验每个 url 是否符合规范
    if (!isPathValid) {
      Object.keys(paths).reduce((errors, url) => {
        if (!url.match(validUrlReg)) {
          errors.push(
            `【错误】 url "${JSON.stringify(
              url,
              null,
              2
            )}" 不符合规范 ${validUrlReg}，请联系接口方修改`
          );
        }
        return errors;
      }, info.errors);
    }
  }
  return Promise.resolve(info);
}
