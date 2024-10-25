#! /usr/bin/env node

import { handle } from '@functions/utils';
import Groq from 'groq-sdk';
import Parser from 'rss-parser';

const client = new Groq({
  apiKey: process.env['GROQ_KEY'],
});

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

  const prompt = `
Good morning, Jarvis. Please greet me properly, like you're my AI butler, and give me a summary of these articles. Make sure to sound fancy and a bit like Tony Stark's assistant. Keep it simple — just the important stuff I care about, without getting too technical. Let's keep it classy, Jarvis!
\`\`\`
${markdown}
\`\`\`
`;

  const response = await client.chat.completions.create({
    model: 'llama-3.2-90b-text-preview',
    messages: [
      {
        role: 'user',
        content: prompt,
      },
    ],
  });

  return {
    response,
  };
});
