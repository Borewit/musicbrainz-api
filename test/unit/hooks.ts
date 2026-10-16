// Fail immediately if a mocked test accidentally attempts a real HTTP request.
const originalFetch = globalThis.fetch;

export const mochaHooks = {
  beforeAll() {
    globalThis.fetch = async () => {
      throw new Error('Unexpected network request in mocked tests; stub fetch or move the test to test/live.');
    };
  },
  afterAll() {
    globalThis.fetch = originalFetch;
  }
};
