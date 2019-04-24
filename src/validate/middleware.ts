/**
 * @description 参数校验
 */
export function createBeforeRequestMiddle() {
  return async <
    Req extends { headers: { [key: string]: string } },
    Res extends {},
    Next extends () => any
  >(
    req: Req,
    res: Res,
    next: Next
  ) => {
    const {
      headers: { 'sm-path': smPath, 'sm-basePath': smBasePath }
    } = req;
    if (smPath || smBasePath) {
      // check params
    } else {
      next();
    }
  };
}

/**
 * @description 数据响应校验
 */
export function createBeforeResponseMiddle() {
  return async <
    Req extends { headers: { [key: string]: string } },
    Res extends {},
    Next extends () => any
  >(
    req: Req,
    res: Res,
    next: Next
  ) => {
    const {
      headers: { 'sm-path': smPath, 'sm-basePath': smBasePath }
    } = req;
    if (smPath || smBasePath) {
      // check response
    } else {
      next();
    }
  };
}
