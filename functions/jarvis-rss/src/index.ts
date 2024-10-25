import http from 'node:http';
import Parser from 'rss-parser';

const parser = new Parser();

const feedToMarkdown = (feed: Parser.Output<Record<string, unknown>>) => {
  return `# ${feed.title}
${feed.items
  .map(
    (item) => `## ${item.title}
${item.content}`,
  )
  .join('\n')}`;
};

const server = http.createServer(async (_, res) => {
  const feed = await parser.parseURL('https://techcrunch.com/feed/');
  const markdown = feedToMarkdown(feed);

  console.log(markdown);

  res.end();
});

server.listen(process.env['PORT'], () => {
  console.log('Listening...', server.address());
});
