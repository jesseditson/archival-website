import type { Carrier } from '@archival/carrier';

const NAMED_ENTITIES: Record<string, string> = {
	amp: '&',
	lt: '<',
	gt: '>',
	quot: '"',
	apos: "'",
	nbsp: ' ',
};

function decodeEntities(text: string): string {
	return text.replace(/&(#x[0-9a-f]+|#[0-9]+|[a-z]+);/gi, (entity, name: string) => {
		if (name.startsWith('#')) {
			const hex = name[1] === 'x' || name[1] === 'X';
			const codePoint = parseInt(name.slice(hex ? 2 : 1), hex ? 16 : 10);
			return codePoint <= 0x10ffff ? String.fromCodePoint(codePoint) : entity;
		}
		return NAMED_ENTITIES[name.toLowerCase()] ?? entity;
	});
}

function clean(text: string | undefined): string | null {
	const value = text === undefined ? '' : decodeEntities(text).replace(/\s+/g, ' ').trim();
	return value === '' ? null : value;
}

function metaTags(html: string): Map<string, string> {
	const tags = new Map<string, string>();
	for (const [tag] of html.matchAll(/<meta\b(?:[^>"']|"[^"]*"|'[^']*')*>/gi)) {
		const attributes = new Map<string, string>();
		for (const [, name, doubleQuoted, singleQuoted, unquoted] of tag.matchAll(/([^\s=/>"']+)\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s>"']+))/g)) {
			attributes.set(name.toLowerCase(), doubleQuoted ?? singleQuoted ?? unquoted ?? '');
		}
		const key = (attributes.get('property') ?? attributes.get('name'))?.toLowerCase();
		const content = attributes.get('content');
		if (key && content !== undefined && !tags.has(key)) {
			tags.set(key, content);
		}
	}
	return tags;
}

function first(tags: Map<string, string>, keys: string[]): string | null {
	for (const key of keys) {
		const value = clean(tags.get(key));
		if (value) {
			return value;
		}
	}
	return null;
}

function resolveUrl(url: string | null, base: string): string | null {
	if (!url) {
		return null;
	}
	try {
		return new URL(url, base).href;
	} catch {
		return url;
	}
}

const carrier: Carrier = async (params) => {
	const url = params.get('url');
	if (!url) {
		return 'missing param: url';
	}
	const r = await fetch(url);
	if (!r.ok) {
		return await r.text();
	}
	const html = await r.text();
	const tags = metaTags(html);
	return {
		title: first(tags, ['og:title', 'twitter:title']) ?? clean(html.match(/<title\b[^>]*>([\s\S]*?)<\/title>/i)?.[1]),
		description: first(tags, ['og:description', 'twitter:description', 'description']),
		image: resolveUrl(first(tags, ['og:image', 'og:image:url', 'og:image:secure_url', 'twitter:image', 'twitter:image:src']), r.url || url),
	};
};

export default carrier;
