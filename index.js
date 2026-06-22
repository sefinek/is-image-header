const isUrl = require('./is-url.js');
const { name, version, homepage } = require('./package.json');

const HEADERS = {
	'User-Agent': `${name}/${version} (+${homepage})`,
};
const TIMEOUT = 8000;
const HEAD_UNSUPPORTED = new Set([403, 405, 501]);
const ACCEPTED = new Set([200, 206]);

const discard = async res => {
	try {
		await res?.body?.cancel?.();
	} catch { /* noop */ }
};

module.exports = async url => {
	if (!isUrl(url)) return { success: false, status: null, isImage: false, message: 'Invalid URL' };

	try {
		let res = await fetch(url, {
			method: 'HEAD',
			headers: HEADERS,
			signal: AbortSignal.timeout(TIMEOUT),
		});

		if (HEAD_UNSUPPORTED.has(res.status)) {
			await discard(res);
			res = await fetch(url, {
				method: 'GET',
				headers: { ...HEADERS, Range: 'bytes=0-0' },
				signal: AbortSignal.timeout(TIMEOUT),
			});
		}

		const isImage = res.headers.get('content-type')?.startsWith('image/') ?? false;
		await discard(res);

		if (!ACCEPTED.has(res.status)) {
			return { success: false, status: res.status, isImage: false, message: res.statusText };
		}

		return { success: true, status: res.status, isImage };
	} catch (err) {
		if (err.name === 'TimeoutError') return { success: false, status: null, isImage: null, message: 'Request timed out' };

		return {
			success: false,
			status: null,
			isImage: null,
			message: `Error while fetching the resource: ${err.message}`,
		};
	}
};
