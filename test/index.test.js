const { describe, test, afterEach, mock } = require('node:test');
const assert = require('node:assert/strict');
const isImage = require('../index.js');

const fetchMock = (...results) => {
	let call = 0;
	return mock.method(globalThis, 'fetch', async () => {
		const result = results[Math.min(call++, results.length - 1)];
		if (result instanceof Error) throw result;
		return result;
	});
};

const mockFetch = (status, statusText, contentType) => fetchMock({
	ok: status >= 200 && status < 300,
	status,
	statusText,
	headers: { get: key => key === 'content-type' ? contentType : null },
	body: { cancel: mock.fn() },
});

afterEach(() => mock.restoreAll());

describe('URL validation', () => {
	const invalid = [
		['invalid string', 'not-a-valid-url'],
		['empty string', ''],
		['null', null],
		['undefined', undefined],
		['number', 42],
		['object', {}],
		['ftp URL', 'ftp://example.com/image.jpg'],
	];

	for (const [name, url] of invalid) {
		test(`${name} → Invalid URL`, async () => {
			const result = await isImage(url);
			assert.deepEqual(result, { success: false, status: null, isImage: false, message: 'Invalid URL' });
		});
	}
});

describe('unit (mocked fetch)', () => {
	describe('HTTP 200', () => {
		test('image/jpeg → isImage: true', async () => {
			mockFetch(200, 'OK', 'image/jpeg');
			assert.deepEqual(await isImage('https://example.com/img.jpg'), { success: true, status: 200, isImage: true });
		});

		test('image/png; charset=utf-8 → isImage: true', async () => {
			mockFetch(200, 'OK', 'image/png; charset=utf-8');
			assert.deepEqual(await isImage('https://example.com/img.png'), { success: true, status: 200, isImage: true });
		});

		test('image/gif → isImage: true', async () => {
			mockFetch(200, 'OK', 'image/gif');
			assert.deepEqual(await isImage('https://example.com/img.gif'), { success: true, status: 200, isImage: true });
		});

		test('image/webp → isImage: true', async () => {
			mockFetch(200, 'OK', 'image/webp');
			assert.deepEqual(await isImage('https://example.com/img.webp'), { success: true, status: 200, isImage: true });
		});

		test('text/html → isImage: false', async () => {
			mockFetch(200, 'OK', 'text/html');
			assert.deepEqual(await isImage('https://example.com'), { success: true, status: 200, isImage: false });
		});

		test('missing content-type → isImage: false', async () => {
			mockFetch(200, 'OK', null);
			assert.deepEqual(await isImage('https://example.com'), { success: true, status: 200, isImage: false });
		});

		test('206 Partial Content → isImage: true', async () => {
			mockFetch(206, 'Partial Content', 'image/jpeg');
			assert.deepEqual(await isImage('https://example.com/img.jpg'), { success: true, status: 206, isImage: true });
		});
	});

	describe('empty statusText (HTTP/2)', () => {
		test('falls back to the standard reason phrase', async () => {
			mockFetch(404, '', null);
			assert.deepEqual(await isImage('https://example.com'), {
				success: false,
				status: 404,
				isImage: false,
				message: 'Not Found',
			});
		});
	});

	describe('non-200 status codes', () => {
		for (const [status, statusText] of [
			[301, 'Moved Permanently'],
			[403, 'Forbidden'],
			[404, 'Not Found'],
			[500, 'Internal Server Error'],
			[503, 'Service Unavailable'],
		]) {
			test(`HTTP ${status} → failure`, async () => {
				mockFetch(status, statusText, null);
				assert.deepEqual(await isImage('https://example.com'), {
					success: false,
					status,
					isImage: false,
					message: statusText,
				});
			});
		}
	});

	describe('HEAD fallback', () => {
		test('405 Method Not Allowed → GET range fallback', async () => {
			const fetch = fetchMock({
				ok: false,
				status: 405,
				statusText: 'Method Not Allowed',
				headers: { get: () => null },
				body: { cancel: mock.fn() },
			}, {
				ok: true,
				status: 206,
				statusText: 'Partial Content',
				headers: { get: key => key === 'content-type' ? 'image/jpeg' : null },
				body: { cancel: mock.fn() },
			});

			assert.deepEqual(await isImage('https://example.com/img.jpg'), { success: true, status: 206, isImage: true });

			const [url, options] = fetch.mock.calls[1].arguments;
			assert.equal(url, 'https://example.com/img.jpg');
			assert.equal(options.method, 'GET');
			assert.equal(options.headers.Range, 'bytes=0-0');
		});
	});

	describe('fetch errors', () => {
		test('TimeoutError → "Request timed out"', async () => {
			const err = new Error('The operation was aborted due to timeout');
			err.name = 'TimeoutError';
			fetchMock(err);
			assert.deepEqual(await isImage('https://example.com'), {
				success: false,
				status: null,
				isImage: null,
				message: 'Request timed out',
			});
		});

		test('network error → "Error while fetching the resource: ..."', async () => {
			fetchMock(new TypeError('fetch failed'));
			const { message, ...rest } = await isImage('https://example.com');
			assert.deepEqual(rest, { success: false, status: null, isImage: null });
			assert.match(message, /Error while fetching the resource/);
		});
	});
});

describe('integration', () => {
	test('image URL → isImage: true', async () => {
		const result = await isImage('https://cdn.sefinek.net/images/animals/cat/cat-story-25-1377426-min.jpg');
		assert.deepEqual(result, { success: true, status: 200, isImage: true });
	});

	test('non-image URL → isImage: false', async () => {
		const result = await isImage('https://sefinek.net');
		assert.deepEqual(result, { success: true, status: 200, isImage: false });
	});

	test('404 → failure', async () => {
		const result = await isImage('https://sefinek.net/non-existing-image.jpg');
		assert.deepEqual(result, { success: false, status: 404, isImage: false, message: 'Not Found' });
	});

	test('invalid host → network error', async () => {
		const result = await isImage('https://invalid-host/non-existing-image.jpg');
		const { message, ...rest } = result;
		assert.deepEqual(rest, { success: false, status: null, isImage: null });
		assert.match(message, /Error while fetching the resource/);
	});
});
