import {assert} from 'chai';
import sinon from 'sinon';
import {CoverArtArchiveApi, CoverArtArchiveApiError} from '../lib/coverartarchive-api.js';
import {HttpClient} from '../lib/http-client.js';

const releaseGroupId = 'c8b19d4b-ccac-48e6-8848-4b9a0a4e24c0';

describe('CoverArtArchiveApi response handling', () => {

  let fetchStub: sinon.SinonStub;

  beforeEach(() => {
    fetchStub = sinon.stub(globalThis, 'fetch');
    sinon.stub(
      HttpClient.prototype as unknown as {_delay(ms: number): Promise<void>},
      '_delay'
    ).resolves();
  });

  afterEach(() => {
    sinon.restore();
  });

  it('retries a transient HTML service-unavailable response', async () => {
    fetchStub.onFirstCall().resolves(new Response('<html>Unavailable</html>', {
      status: 503,
      statusText: 'Service Unavailable',
      headers: {'Content-Type': 'text/html'}
    }));
    fetchStub.onSecondCall().resolves(new Response(JSON.stringify({images: [], release: 'https://example.test/release'}), {
      headers: {'Content-Type': 'application/json; charset=utf-8'}
    }));

    const covers = await new CoverArtArchiveApi().getReleaseGroupCovers(releaseGroupId);

    assert.deepEqual(covers, {images: [], release: 'https://example.test/release'});
    assert.strictEqual(fetchStub.callCount, 2);
  });

  it('reports a final HTML error response without leaking a JSON syntax error', async () => {
    fetchStub.callsFake(async () => new Response('<html>Unavailable</html>', {
      status: 503,
      statusText: 'Service Unavailable',
      headers: {'Content-Type': 'text/html'}
    }));

    let caughtError: unknown;
    try {
      await new CoverArtArchiveApi().getReleaseGroupCovers(releaseGroupId);
    } catch (error) {
      caughtError = error;
    }

    assert.instanceOf(caughtError, CoverArtArchiveApiError);
    assert.strictEqual((caughtError as CoverArtArchiveApiError).status, 503);
    assert.strictEqual(
      (caughtError as CoverArtArchiveApiError).message,
      'Cover Art Archive request failed (503): Service Unavailable'
    );
    assert.strictEqual(fetchStub.callCount, 3);
  });

  it('reports an unexpected successful HTML response', async () => {
    fetchStub.resolves(new Response('<html>Unexpected</html>', {
      headers: {'Content-Type': 'text/html; charset=utf-8'}
    }));

    let caughtError: unknown;
    try {
      await new CoverArtArchiveApi().getReleaseGroupCovers(releaseGroupId);
    } catch (error) {
      caughtError = error;
    }

    assert.instanceOf(caughtError, CoverArtArchiveApiError);
    assert.strictEqual(
      (caughtError as CoverArtArchiveApiError).message,
      'Cover Art Archive returned "text/html; charset=utf-8" instead of JSON (200)'
    );
  });

  it('reports malformed JSON in a successful response', async () => {
    fetchStub.resolves(new Response('{"images":', {
      headers: {'Content-Type': 'application/json'}
    }));

    let caughtError: unknown;
    try {
      await new CoverArtArchiveApi().getReleaseGroupCovers(releaseGroupId);
    } catch (error) {
      caughtError = error;
    }

    assert.instanceOf(caughtError, CoverArtArchiveApiError);
    assert.strictEqual((caughtError as CoverArtArchiveApiError).status, 200);
    assert.strictEqual((caughtError as CoverArtArchiveApiError).body, '{"images":');
    assert.strictEqual(
      (caughtError as CoverArtArchiveApiError).message,
      'Cover Art Archive returned invalid JSON (200)'
    );
  });

  it('reports malformed JSON errors without an empty detail suffix', async () => {
    fetchStub.resolves(new Response('{"error":', {
      status: 400,
      statusText: '',
      headers: {'Content-Type': 'application/json'}
    }));

    let caughtError: unknown;
    try {
      await new CoverArtArchiveApi().getReleaseGroupCovers(releaseGroupId);
    } catch (error) {
      caughtError = error;
    }

    assert.instanceOf(caughtError, CoverArtArchiveApiError);
    assert.strictEqual((caughtError as CoverArtArchiveApiError).status, 400);
    assert.strictEqual((caughtError as CoverArtArchiveApiError).body, '{"error":');
    assert.strictEqual(
      (caughtError as CoverArtArchiveApiError).message,
      'Cover Art Archive request failed (400)'
    );
  });

  it('includes an API-provided JSON error detail', async () => {
    fetchStub.resolves(new Response(JSON.stringify({error: 'Invalid request'}), {
      status: 400,
      statusText: 'Bad Request',
      headers: {'Content-Type': 'application/json'}
    }));

    let caughtError: unknown;
    try {
      await new CoverArtArchiveApi().getReleaseGroupCovers(releaseGroupId);
    } catch (error) {
      caughtError = error;
    }

    assert.instanceOf(caughtError, CoverArtArchiveApiError);
    assert.deepEqual((caughtError as CoverArtArchiveApiError).body, {error: 'Invalid request'});
    assert.strictEqual(
      (caughtError as CoverArtArchiveApiError).message,
      'Cover Art Archive request failed (400): Invalid request'
    );
  });

  it('reports a successful response without a Content-Type header', async () => {
    fetchStub.resolves(new Response(new TextEncoder().encode('{}')));

    let caughtError: unknown;
    try {
      await new CoverArtArchiveApi().getReleaseGroupCovers(releaseGroupId);
    } catch (error) {
      caughtError = error;
    }

    assert.instanceOf(caughtError, CoverArtArchiveApiError);
    assert.strictEqual(
      (caughtError as CoverArtArchiveApiError).message,
      'Cover Art Archive returned no Content-Type instead of JSON (200)'
    );
  });

  it('keeps the existing not-found result for an HTML 404 response', async () => {
    fetchStub.resolves(new Response('<html>Not found</html>', {
      status: 404,
      headers: {'Content-Type': 'text/html'}
    }));

    const covers = await new CoverArtArchiveApi().getReleaseGroupCovers(releaseGroupId);

    assert.deepEqual(covers as unknown, {
      error: 'Not Found',
      help: 'For usage, please see: https://musicbrainz.org/development/mmd'
    });
  });

  it('returns the API error body for a JSON 404 response', async () => {
    fetchStub.resolves(new Response(JSON.stringify({error: 'Not Found'}), {
      status: 404,
      headers: {'Content-Type': 'application/json'}
    }));

    const covers = await new CoverArtArchiveApi().getReleaseGroupCovers(releaseGroupId);

    assert.deepEqual(covers as unknown, {error: 'Not Found'});
  });
});
