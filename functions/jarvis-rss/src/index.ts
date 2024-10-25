#! /usr/bin/env node

import { handle } from '@functions/utils';
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

handle(async () => {
  const feed = await parser.parseURL('https://techcrunch.com/feed/');
  const markdown = feedToMarkdown(feed);

  return {
    markdown,
  };
});
