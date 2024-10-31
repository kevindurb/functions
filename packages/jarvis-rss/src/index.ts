#! /usr/bin/env node

import { handle } from '@functions/utils';
import Groq from 'groq-sdk';
import nodemailer from 'nodemailer';
import Parser from 'rss-parser';

const mailer = nodemailer.createTransport({
  host: 'smtp-relay-service.default',
  port: 25,
  secure: false,
});

const client = new Groq({
  apiKey: process.env['GROQ_KEY'],
});

const parser = new Parser();

const feedToMarkdown = (feed: Parser.Output<unknown>) => {
  return `# ${feed.title}
${feed.items
  .map(
    (item) => `## ${item.title}
${item.contentSnippet?.substring(0, 100)}`,
  )
  .join('\n')}`;
};

const feedUrls = [
  'https://techcrunch.com/feed/',
  'https://www.formula1.com/en/latest/all.xml',
  'https://hnrss.org/best',
  'https://feeds.arstechnica.com/arstechnica/features',
  'https://www.schneier.com/feed/atom/',
];

const yesterday = new Date(Date.now() - 1000 * 60 * 60 * 24);

const loadFeeds = async () => {
  const feeds = await Promise.all(
    feedUrls.map((feedUrl) => parser.parseURL(feedUrl)),
  );

  for (const feed of feeds) {
    feed.items = feed.items.filter(
      (item) => !item.pubDate || item.pubDate > yesterday.toISOString(),
    );
  }

  return feeds;
};

handle(async () => {
  const feeds = await loadFeeds();

  const markdown = feeds.reduce(
    (acc, feed) => `${acc}
${feedToMarkdown(feed)}`,
    '',
  );

  const prompt = `Good morning, Jarvis.
Please greet me properly, like you're my AI butler, and give me a summary of these articles.
Make sure to sound fancy and a bit like Tony Stark's assistant.
Keep it simple — just the important stuff I care about, without getting too technical.
Format it as basic html with headers and paragraphs.
Let's keep it classy, Jarvis!
\`\`\`
${markdown}
\`\`\`
`;

  try {
    const response = await client.chat.completions.create({
      model: 'llama-3.2-90b-text-preview',
      messages: [
        {
          role: 'user',
          content: prompt,
        },
      ],
    });

    const responseContent = response.choices[0]?.message.content;

    if (!responseContent) return;

    await mailer.sendMail({
      from: '"Jarvis" <beavercloud@fastmail.com>',
      to: 'kevindurb@fastmail.com',
      subject: 'Your Daily News',
      html: responseContent,
    });

    return {
      feeds,
      response,
    };
  } catch (error) {
    console.error(error);
    return {
      error: 'Server Error',
      feeds,
    };
  }
});
