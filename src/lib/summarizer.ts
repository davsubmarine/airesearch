import OpenAI from 'openai';
import dotenv from 'dotenv';

// Load environment variables from .env.local
dotenv.config({ path: '.env.local' });

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function generateSummary(abstract: string): Promise<string> {
  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-4-turbo-preview",
      messages: [
        {
          role: "system",
          content: "You are a helpful assistant that creates concise, clear summaries of academic papers. Focus on the key findings, methodology, and implications. Keep the summary under 200 words and use simple language."
        },
        {
          role: "user",
          content: `Please summarize this academic paper abstract:\n\n${abstract}`
        }
      ],
      temperature: 0.7,
      max_tokens: 500,
    });

    const summary = completion.choices[0]?.message?.content;
    if (!summary) {
      throw new Error('No summary generated');
    }

    return summary;
  } catch (error) {
    console.error('Error generating summary:', error);
    throw error;
  }
} 