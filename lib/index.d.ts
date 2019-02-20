import { Json2Service } from './cli';
export default function gen(
  config: Json2Service,
  options: {
    clear?: boolean;
  }
): Promise<number>;
