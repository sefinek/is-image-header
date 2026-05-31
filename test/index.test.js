const isImage = require('../index.js');

const mockFetch = (status, statusText, contentType) => {
	jest.spyOn(global, 'fetch').mockResolvedValue({
		status,
		statusText,
		headers: { get: key => key === 'content-type' ? contentType : null },
	});
};

afterEach(() => jest.restoreAllMocks());

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

	test.each(invalid)('%s → Invalid URL', async (_, url) => {
		const result = await isImage(url);
		expect(result).toEqual({ success: false, status: null, isImage: false, message: 'Invalid URL' });
	});
});

describe('unit (mocked fetch)', () => {
	describe('HTTP 200', () => {
		test('image/jpeg → isImage: true', async () => {
			mockFetch(200, 'OK', 'image/jpeg');
			expect(await isImage('https://example.com/img.jpg')).toEqual({ success: true, status: 200, isImage: true });
		});

		test('image/png; charset=utf-8 → isImage: true', async () => {
			mockFetch(200, 'OK', 'image/png; charset=utf-8');
			expect(await isImage('https://example.com/img.png')).toEqual({ success: true, status: 200, isImage: true });
		});

		test('image/gif → isImage: true', async () => {
			mockFetch(200, 'OK', 'image/gif');
			expect(await isImage('https://example.com/img.gif')).toEqual({ success: true, status: 200, isImage: true });
		});

		test('image/webp → isImage: true', async () => {
			mockFetch(200, 'OK', 'image/webp');
			expect(await isImage('https://example.com/img.webp')).toEqual({ success: true, status: 200, isImage: true });
		});

		test('text/html → isImage: false', async () => {
			mockFetch(200, 'OK', 'text/html');
			expect(await isImage('https://example.com')).toEqual({ success: true, status: 200, isImage: false });
		});

		test('missing content-type → isImage: false', async () => {
			mockFetch(200, 'OK', null);
			expect(await isImage('https://example.com')).toEqual({ success: true, status: 200, isImage: false });
		});
	});

	describe('non-200 status codes', () => {
		test.each([
			[301, 'Moved Permanently'],
			[403, 'Forbidden'],
			[404, 'Not Found'],
			[500, 'Internal Server Error'],
			[503, 'Service Unavailable'],
		])('HTTP %i → failure', async (status, statusText) => {
			mockFetch(status, statusText, null);
			expect(await isImage('https://example.com')).toEqual({
				success: false,
				status,
				isImage: false,
				message: statusText,
			});
		});
	});

	describe('fetch errors', () => {
		test('TimeoutError → "Request timed out"', async () => {
			const err = new Error('The operation was aborted due to timeout');
			err.name = 'TimeoutError';
			jest.spyOn(global, 'fetch').mockRejectedValue(err);
			expect(await isImage('https://example.com')).toEqual({
				success: false,
				status: null,
				isImage: null,
				message: 'Request timed out',
			});
		});

		test('network error → "Error while fetching the resource: ..."', async () => {
			jest.spyOn(global, 'fetch').mockRejectedValue(new TypeError('fetch failed'));
			expect(await isImage('https://example.com')).toEqual({
				success: false,
				status: null,
				isImage: null,
				message: expect.stringContaining('Error while fetching the resource'),
			});
		});
	});
});

describe('integration', () => {
	test('image URL → isImage: true', async () => {
		const result = await isImage('https://cdn.sefinek.net/images/animals/cat/cat-story-25-1377426-min.jpg');
		expect(result).toEqual({ success: true, status: 200, isImage: true });
	});

	test('non-image URL → isImage: false', async () => {
		const result = await isImage('https://sefinek.net');
		expect(result).toEqual({ success: true, status: 200, isImage: false });
	});

	test('404 → failure', async () => {
		const result = await isImage('https://sefinek.net/non-existing-image.jpg');
		expect(result).toEqual({ success: false, status: 404, isImage: false, message: 'Not Found' });
	});

	test('invalid host → network error', async () => {
		const result = await isImage('https://invalid-host/non-existing-image.jpg');
		expect(result).toEqual({
			success: false,
			status: null,
			isImage: null,
			message: expect.stringContaining('Error while fetching the resource'),
		});
	});
});
