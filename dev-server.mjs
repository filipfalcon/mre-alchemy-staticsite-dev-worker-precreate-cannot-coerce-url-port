// Minimal stand-in for a real dev server (Astro, Vite, …). It prints an
// http URL on stdout and stays alive — the only two things Alchemy's
// DevServer cares about. The bug does not depend on what is served here.
import { createServer } from 'node:http';

const portIndex = process.argv.indexOf('--port');
const port = portIndex !== -1 ? Number(process.argv[portIndex + 1]) : 5000;

createServer((_req, res) => res.end('ok')).listen(port, () => {
  console.log(`Local: http://localhost:${port}/`);
});
