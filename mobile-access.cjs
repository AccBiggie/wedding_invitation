const http = require('node:http');

const host = process.argv[2];
if (!host) {
  console.error('Uso: node mobile-access.cjs <IP do Wi-Fi>');
  process.exit(1);
}

http.createServer((request, response) => {
  const upstream = http.request({
    hostname: '127.0.0.1',
    port: 3002,
    method: request.method,
    path: request.url,
    headers: request.headers,
  }, (upstreamResponse) => {
    response.writeHead(upstreamResponse.statusCode, upstreamResponse.headers);
    upstreamResponse.pipe(response);
  });

  upstream.on('error', (error) => {
    console.error(error);
    if (!response.headersSent) response.writeHead(502);
    response.end('Projeto indisponível em localhost:3002');
  });
  request.pipe(upstream);
}).listen(3002, host, () => {
  console.log(`Acesso móvel: http://${host}:3002`);
});
