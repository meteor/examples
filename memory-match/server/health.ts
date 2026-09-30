import type { IncomingMessage, ServerResponse } from 'node:http';
import { WebApp } from 'meteor/webapp';

import { Games } from '../imports/api/games';

WebApp.connectHandlers.use('/health', async (
  _request: IncomingMessage,
  response: ServerResponse,
) => {
  try {
    await Games.rawCollection().estimatedDocumentCount({ maxTimeMS: 1_000 });
    response.writeHead(200, { 'content-type': 'application/json; charset=utf-8' });
    response.end(JSON.stringify({ ok: true, mongo: 'ready' }));
  } catch (error) {
    response.writeHead(503, { 'content-type': 'application/json; charset=utf-8' });
    response.end(JSON.stringify({
      ok: false,
      mongo: 'unavailable',
      error: error instanceof Error ? error.message : String(error),
    }));
  }
});
