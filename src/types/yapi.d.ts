declare global {
  namespace Autos {
    export interface YApiCategory {
      name: string;
      desc: string;
      add_time: number;
      up_time: number;
      index: number;
      proBasepath?: string;
      proName?: string;
      proDescription?: string;
      list: YApiItem[];
    }

    export interface YApiItem {
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
      res_schema_body?: string; // 兼容内部定制版本
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

    export interface QueryPath {
      path: string;
      params: any[];
    }

    export interface STag {
      name?: string;
      description?: string;
    }
  }
}

export {};
