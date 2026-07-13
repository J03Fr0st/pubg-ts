const { rmSync } = require('node:fs');
const { resolve } = require('node:path');

const distPath = resolve(__dirname, '..', 'dist');

rmSync(distPath, { force: true, recursive: true });
