/**
 * Power Draw - Local Development & Production Preview Server
 * Serves site/ assets and data/ endpoints on port 3000 without external dependencies.
 */

import http from 'node:http';
import { promises as fs } from 'node:fs';
import path from 'node:path';

const PORT = process.env.PORT || 3000;

const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.ico': 'image/x-icon'
};

const server = http.createServer(async (req, res) => {
  let urlPath = req.url.split('?')[0];
  if (urlPath === '/') urlPath = '/site/index.html';

  let filePath;
  if (urlPath.startsWith('/data/')) {
    filePath = path.resolve('.' + urlPath);
  } else if (urlPath.startsWith('/site/')) {
    filePath = path.resolve('.' + urlPath);
  } else {
    filePath = path.resolve('./site' + urlPath);
  }

  try {
    const data = await fs.readFile(filePath);
    const ext = path.extname(filePath).toLowerCase();
    res.writeHead(200, {
      'Content-Type': MIME_TYPES[ext] || 'application/octet-stream',
      'Access-Control-Allow-Origin': '*',
      'Cache-Control': 'no-cache'
    });
    res.end(data);
  } catch {
    res.writeHead(404, { 'Content-Type': 'text/plain' });
    res.end(`404 Not Found: ${urlPath}`);
  }
});

server.listen(PORT, () => {
  console.log(`\n  Silicon Surcharge Intelligence Dashboard running at: http://localhost:${PORT}\n`);
});
