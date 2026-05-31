const isUrl = require('./is-url.js');
const { name, version } = require('./package.json');

const HEADERS = {
	'User-Agent': `${name}/${version} (+https://github.com/sefinek/is-image-header)`,
	'Cache-Control': 'no-cache',
};

module.exports = async url => {
	if (!isUrl(url)) return { success: false, status: null, isImage: false, message: 'Invalid URL' };

	try {
		const res = await fetch(url, {
			method: 'HEAD',
			headers: HEADERS,
			signal: AbortSignal.timeout(8000),
		});

		if (res.status !== 200) {
			return { success: false, status: res.status, isImage: false, message: res.statusText };
		}

		return { success: true, status: res.status, isImage: res.headers.get('content-type')?.startsWith('image/') ?? false };
	} catch (err) {
		if (err.name === 'TimeoutError') {
			return { success: false, status: null, isImage: null, message: 'Request timed out' };
		}
		return {
			success: false,
			status: null,
			isImage: null,
			message: `Error while fetching the resource: ${err.message}`,
		};
	}
};