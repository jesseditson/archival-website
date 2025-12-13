const https = require('https');
const http = require('http');
const metascraper = require("metascraper")([
  require('metascraper-description')(),
  require('metascraper-image')(),
  require('metascraper-title')(),
]);

function fetchMetadata(url) {
	return new Promise((resolve, reject) => {
		const protocol = url.startsWith('https') ? https : http;

		protocol.get(url, (res) => {
			let html = '';

			res.on('data', (chunk) => {
				html += chunk;
			});

			res.on('end', async () => {
				metascraper({url, html}).then(resolve)
			});
		}).on('error', reject);
	});
}

export default async function fetch(params, body, env) {
	const url = params.get("url");
	return await fetchMetadata(url);
}
