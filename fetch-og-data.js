#!/usr/bin/env node

/**
 * Fetch OpenGraph metadata for a URL
 * Usage: node fetch-og-data.js <url>
 */

const https = require('https');
const http = require('http');

function fetchOGData(url) {
    return new Promise((resolve, reject) => {
        const protocol = url.startsWith('https') ? https : http;

        protocol.get(url, (res) => {
            let html = '';

            res.on('data', (chunk) => {
                html += chunk;
            });

            res.on('end', () => {
                const ogData = {
                    url: url,
                    title: '',
                    description: '',
                    image: ''
                };

                // Extract OG title
                const titleMatch = html.match(/<meta\s+property=["']og:title["']\s+content=["']([^"']+)["']/i);
                if (titleMatch) ogData.title = titleMatch[1];

                // Extract OG description
                const descMatch = html.match(/<meta\s+property=["']og:description["']\s+content=["']([^"']+)["']/i);
                if (descMatch) ogData.description = descMatch[1];

                // Extract OG image
                const imageMatch = html.match(/<meta\s+property=["']og:image["']\s+content=["']([^"']+)["']/i);
                if (imageMatch) {
                    let imageUrl = imageMatch[1];
                    // Handle relative URLs
                    if (imageUrl.startsWith('/')) {
                        const urlObj = new URL(url);
                        imageUrl = `${urlObj.protocol}//${urlObj.host}${imageUrl}`;
                    }
                    ogData.image = imageUrl;
                }

                // Fallback to regular title if no OG title
                if (!ogData.title) {
                    const fallbackTitleMatch = html.match(/<title>([^<]+)<\/title>/i);
                    if (fallbackTitleMatch) ogData.title = fallbackTitleMatch[1];
                }

                // Fallback to meta description if no OG description
                if (!ogData.description) {
                    const fallbackDescMatch = html.match(/<meta\s+name=["']description["']\s+content=["']([^"']+)["']/i);
                    if (fallbackDescMatch) ogData.description = fallbackDescMatch[1];
                }

                resolve(ogData);
            });
        }).on('error', reject);
    });
}

// Main execution
const url = process.argv[2];

if (!url) {
    console.error('Usage: node fetch-og-data.js <url>');
    process.exit(1);
}

fetchOGData(url)
    .then(data => {
        console.log('\n# OpenGraph Metadata\n');
        console.log(`link_url = "${data.url}"`);
        console.log(`link_title = "${data.title}"`);
        console.log(`link_description = "${data.description}"`);
        console.log(`link_image = "${data.image}"`);
        console.log('');
    })
    .catch(err => {
        console.error('Error fetching OG data:', err.message);
        process.exit(1);
    });
