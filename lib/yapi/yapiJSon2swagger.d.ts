interface API {
  name: string;
  desc: string;
  add_time: number;
  up_time: number;
  index: number;
  list: List[];
}
interface List {
  tag: any[];
  method: string;
  title: string;
  path: string;
  req_body_other: string;
  req_body_type: string;
  res_body_type: string;
  add_time: number;
  up_time: number;
  markdown: string;
  desc: string;
  res_body: string;
  index: number;
  api_opened: boolean;
  res_body_is_json_schema: boolean;
  req_body_form: any[];
  req_body_is_json_schema: boolean;
  req_params: any[];
  req_headers: any[];
  req_query: any[];
  query_path: QueryPath;
  type: string;
  status: string;
}
interface QueryPath {
  path: string;
  params: any[];
}
interface STag {
  name?: string;
  description?: string;
}
export default function yapiJSon2swagger(
  list: API[]
): {
  swagger: string;
  info: {
    title: string;
    version: string;
    description: string;
  };
  basePath: string;
  tags: STag[];
  schemes: string[];
  paths: {};
};
export {};
