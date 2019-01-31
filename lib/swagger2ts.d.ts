import { SwaggerParser } from 'src';
export default function swagger2ts(
  swaggerParser: SwaggerParser,
  clear?: boolean
): Promise<{
  code: Number;
  message?: string;
}>;
