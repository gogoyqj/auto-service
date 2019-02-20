import { SwaggerParser } from './cli';
export default function swagger2ts(
  swaggerParser: SwaggerParser,
  clear?: boolean
): Promise<{
  code: Number;
  message?: string;
}>;
