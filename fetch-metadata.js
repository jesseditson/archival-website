#!/usr/bin/env node

/**
 * Fetch metadata for all posts
 * Usage: node fetch-metadata.js
 */

const https = require('https');
const http = require('http');
const { execSync } = require('child_process');
const fs = require('fs');
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

// Main execution
const posts = fs.readdirSync("objects/post");

for (const file of posts) {
    const path = `objects/post/${file}`;
    const post = fs.readFileSync(path).toString();
    const link = post.match(/link\s*=\s*(['"])?(.+)(\1)/);
    if (link && link[2]) {
        // TODO: when archival supports clearing fields directly, use the CLI
        // See: https://github.com/jesseditson/archival/issues/45
        if (post.includes("[[_link_meta]]")) {
            fs.writeFileSync(path, post.replace(/\[\[_link_meta\]\][\s\S]+/, ""));
        }
        console.log(`Fetch: ${link[2]} from ${file}`);
        fetchMetadata(link[2]).then(data => {
            const fields = [];
            for (const field of ["title", "description", "image"]) {
                if (data[field]) {
                    fields.push({field, value: data[field]})
                }
            }
            execSync(`cargo run import post/${file} -c _link_meta -f json - ../archival-website`, {
                input: JSON.stringify(fields),
                cwd: "../archival"
            })
        })
    }
}
