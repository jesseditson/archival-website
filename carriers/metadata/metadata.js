const metascraper = require('metascraper')([
	require('metascraper-description')(),
	require('metascraper-image')(),
	require('metascraper-title')(),
]);

export default async function(params, body, env) {
	const url = params.get('url');
	if (!url) {
		return 'missing param: url';
	}
	const r = await fetch(url);
	if (r.ok) {
		return await metascraper({ url, html: await r.text() });
	} else {
		return await r.text();
	}
}
