import http from 'node:http';
import type { IncomingMessage } from 'node:http';

const parseBody = (req: IncomingMessage) =>
  new Promise((resolve, reject) => {
    let body = '';

    req.on('data', (data) => {
      body += data;
    });

    req.on('end', () => {
      try {
        if (body) {
          resolve(JSON.parse(body));
        } else {
          resolve(undefined);
        }
      } catch (error) {
        reject(error);
      }
    });

    req.on('error', (error) => reject(error));
  });

export const handle = (cb: (body: unknown) => Promise<unknown>) => {
  const server = http.createServer(async (req, res) => {
    console.log('Request', req.method, req.url);
    try {
      const body = await parseBody(req);
      console.log('Request Body', body);
      const response = await cb(body);
      console.log('Response Body', response);
      res.writeHead(200, { 'content-type': 'application/json' });

      if (response) {
        res.write(JSON.stringify(response));
      }
      res.end();
    } catch (error) {
      console.error(error);
      res.writeHead(500, { 'content-type': 'application/json' });
      if (error instanceof Error) {
        res.write(JSON.stringify({ error: error.message }));
      } else {
        res.write(JSON.stringify({ error: 'Server Error' }));
      }
      res.end();
    }
  });

  server.listen(process.env['PORT'], () => {
    console.log('Listening...', server.address());
  });

  const handleKill = () => {
    console.log('Exiting...');
    server.close();
    process.exit();
  };

  process.on('SIGINT', handleKill);
  process.on('SIGTERM', handleKill);
};
