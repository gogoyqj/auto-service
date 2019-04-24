import { createBeforeRequestMiddle, createBeforeResponseMiddle } from 'src/validate/middleware';

describe('validate/middleware', () => {
  const beforeReq = createBeforeRequestMiddle();
  const beforeRes = createBeforeResponseMiddle();
  it('BeforeRequest ok', () => {
    // do nothing
    console.log(2);
  });
});
