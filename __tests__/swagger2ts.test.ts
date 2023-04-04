import path from 'path';
import fs from 'fs-extra';
import { emitFiles } from 'src/swagger2ts';

describe('swagger2ts should work', () => {
  const tmp = path.resolve(__dirname, 'tmp');
  const output = path.join(tmp, 'output');
  const tmp2 = path.join(tmp, 'tmp');

  it('emitFiles should work', async () => {
    if (fs.existsSync(tmp)) {
      fs.removeSync(tmp);
    }
    fs.mkdirSync(tmp);
    fs.mkdirSync(tmp2);
    fs.writeFileSync(path.join(tmp2, 'a.ts'), `const a = {};`, { encoding: 'utf8' });
    fs.writeFileSync(path.join(tmp2, 'b.ts'), `const b = {};`, { encoding: 'utf8' });

    fs.mkdirSync(output);
    fs.writeFileSync(path.join(output, 'a.ts'), `const a2 = {};`, { encoding: 'utf8' });
    fs.writeFileSync(path.join(output, 'c.ts'), `const c = {};`, { encoding: 'utf8' });

    await emitFiles(output, tmp2);
    expect(fs.readFileSync(path.join(output, 'a.ts'), { encoding: 'utf8' })).toEqual(
      `const a = {};`
    );
    expect(fs.readFileSync(path.join(output, 'b.ts'), { encoding: 'utf8' })).toEqual(
      `const b = {};`
    );
    expect(fs.existsSync(path.join(output, 'c.ts'))).toBeFalsy();
  });

  afterAll(() => {
    if (fs.existsSync(tmp)) {
      fs.removeSync(tmp);
    }
  });
});
