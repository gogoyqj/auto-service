declare const Autos: {
  exports: {
    getExplicitModelDeps(obj: {} | undefined): string[] | undefined;
    resolveModelDeps(models?: string[], definitions?: any, resolvedDeps?: any): void;
  };
};

/** 差异 */
declare let SwaggerChanges: any;

/** 当前 swagger 版本 */
declare let CurSwagger: any;

/** 当前 diff 的 gid */
declare let DiffVersion: any;

/** 新 swagger 版本 */
declare let NewSwagger: any;
