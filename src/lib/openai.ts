import OpenAI from 'openai';
import { Summary, Paper } from '@/types';
import { supabaseAdmin, Tables } from './supabase';

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

/**
 * Generate a structured summary for a research paper
 */
export async function generateSummary(paperUrl: string): Promise<Summary> {
  try {
    // Fetch paper data if only URL is provided
    let paper: Paper;
    if (typeof paperUrl === 'string') {
      const { data, error } = await supabaseAdmin
        .from(Tables.papers)
        .select('*')
        .eq('url', paperUrl)
        .single();
      
      if (error || !data) {
        throw new Error(`Paper not found for URL: ${paperUrl}`);
      }
      
      paper = data;
    } else {
      paper = paperUrl as Paper;
    }

    const prompt = `
Please analyze the following AI research paper and create a structured summary for non-technical people:

Title: ${paper.title}
Abstract: ${paper.abstract || 'Not provided'}
Link: ${paper.url}

Your summary MUST follow this EXACT structure and formatting:

1. TL;DR (exactly 3 points):
- [Problem] Clear statement of the problem being solved (max 30 words)
- [Solution] Clear explanation of the proposed solution (max 30 words)
- [Impact] Clear statement of why this matters (max 30 words)

2. Key Innovation (exactly 3 points):
- [Novel Approach] What specific thing was done differently (max 30 words)
- [Improvement] How this improves upon existing methods (max 30 words)
- [Technical] The main technical achievement in simple terms (max 30 words)

3. Practical Applications (exactly 3 points):
- First real-world use case with concrete example (max 30 words)
- Second real-world use case with concrete example (max 30 words)
- Third real-world use case with concrete example (max 30 words)

4. Limitations & Future Work (exactly 3 points):
- First major limitation or challenge (max 30 words)
- Second major limitation or challenge (max 30 words)
- Potential future improvement or research direction (max 30 words)

5. Key Terms (exactly 3 terms):
Multimodal Learning - Simple business-friendly definition (max 20 words)
Neural Networks - Simple business-friendly definition (max 20 words)
Deep Learning - Simple business-friendly definition (max 20 words)

IMPORTANT FORMATTING RULES:
1. Use EXACTLY 3 bullet points for each section
2. Start each bullet point with a single dash (-)
3. No line breaks within bullet points
4. No colons or special characters in bullet points
5. Use simple, everyday language
6. Be specific and concrete, avoid vague statements
7. Each bullet point must be a complete, grammatically correct sentence

Example format for bullet points:
- This is how each bullet point should look with a clear complete statement.
- This is another example of proper formatting without any breaks.
- This shows how to end a bullet point properly with a period.`;

    const response = await openai.chat.completions.create({
      model: "gpt-4-turbo",
      messages: [
        { 
          role: "system", 
          content: "You are an expert at summarizing complex AI research for non-technical audiences. You MUST follow the exact formatting rules provided and generate exactly 3 points for each section."
        },
        { role: "user", content: prompt }
      ],
      temperature: 0.3, // Lower temperature for more consistent formatting
    });

    const content = response.choices[0]?.message.content || '';
    
    // Validate and parse the response
    const sections = {
      tldr: parseBulletPoints(content, 'TL;DR', 3),
      keyInnovation: parseBulletPoints(content, 'Key Innovation', 3),
      practicalApplications: parseBulletPoints(content, 'Practical Applications', 3),
      limitationsFutureWork: parseBulletPoints(content, 'Limitations & Future Work', 3),
      keyTerms: parseKeyTerms(content)
    };

    // Helper function to parse bullet points
    function parseBulletPoints(content: string, section: string, expectedCount: number): string[] {
      const sectionMatch = content.match(new RegExp(`${section}[^]*?(?=\\d\\.|$)`, 's'));
      if (!sectionMatch) {
        // Return default points if section not found
        return Array(expectedCount).fill(`Default ${section} point - needs review.`);
      }
      
      const points = sectionMatch[0]
        .split(/\n-/)
        .slice(1)
        .map(point => point.trim())
        .filter(point => point.length > 0);

      // If we don't have enough points, add default ones
      const result = [...points];
      while (result.length < expectedCount) {
        result.push(`Additional ${section} point - needs review.`);
      }

      return result.slice(0, expectedCount);
    }

    // Helper function to parse key terms
    function parseKeyTerms(content: string): Record<string, string> {
      const keyTermsMatch = content.match(/Key Terms[^]*?(?=\d\.|$)/s);
      if (!keyTermsMatch) {
        // Return default terms if section not found
        return {
          'Multimodal Learning': 'AI system that can process multiple types of input like text and images.',
          'Neural Networks': 'Computer systems inspired by human brain connections to process information.',
          'Deep Learning': 'Advanced AI that learns patterns from large amounts of data.'
        };
      }

      const terms: Record<string, string> = {};
      const termLines = keyTermsMatch[0]
        .split('\n')
        .map(line => line.trim())
        .filter(line => line.length > 0)  // Remove empty lines
        .filter(line => !line.includes('Key Terms'))  // Remove section header
        .filter(line => !line.startsWith('Term'))  // Remove Term1, Term2 prefixes
        .filter(line => line.includes('-'));  // Only keep lines with term definitions

      // Process each term line
      termLines.forEach(line => {
        const [term, ...defParts] = line.split('-');
        const definition = defParts.join('-').trim(); // Handle cases where definition contains hyphens
        if (term && definition) {
          terms[term.trim()] = definition;
        }
      });

      // If we don't have exactly 3 terms, add default terms
      const defaultTerms = [
        ['Multimodal Learning', 'AI system that can process multiple types of input like text and images.'],
        ['Neural Networks', 'Computer systems inspired by human brain connections to process information.'],
        ['Deep Learning', 'Advanced AI that learns patterns from large amounts of data.']
      ];
      
      let index = 0;
      while (Object.keys(terms).length < 3 && index < defaultTerms.length) {
        const [term, def] = defaultTerms[index];
        if (!terms[term]) {
          terms[term] = def;
        }
        index++;
      }

      // Take only the first 3 terms if we have more
      const finalTerms: Record<string, string> = {};
      Object.entries(terms).slice(0, 3).forEach(([term, def]) => {
        finalTerms[term] = def;
      });

      return finalTerms;
    }

    // Create a unique ID for the summary
    const timestamp = Date.now();
    const randomSuffix = Math.random().toString(36).substring(2, 15);
    const summaryId = `summary-${paper.id}-${timestamp}-${randomSuffix}`;

    // Create the summary object
    const summary: Summary = {
      id: summaryId,
      paper_id: paper.id,
      tldr: sections.tldr,
      key_innovation: sections.keyInnovation,
      practical_applications: sections.practicalApplications,
      limitations_future_work: sections.limitationsFutureWork,
      key_terms: sections.keyTerms,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    
    return summary;
  } catch (error) {
    console.error('Error generating summary:', error);
    throw error; // Re-throw to be handled by the API route
  }
}

/**
 * Save a summary to the database and update paper's has_summary flag
 */
export async function saveSummary(summary: Summary): Promise<void> {
  try {
    // Begin a transaction
    const { data: paper, error: paperError } = await supabaseAdmin
      .from(Tables.papers)
      .update({ has_summary: true, updated_at: new Date().toISOString() })
      .eq('id', summary.paper_id)
      .select()
      .single();
    
    if (paperError) {
      throw paperError;
    }
    
    // Insert the summary
    const { error: summaryError } = await supabaseAdmin
      .from(Tables.summaries)
      .upsert(summary, {
        onConflict: 'id',
        ignoreDuplicates: false
      });
    
    if (summaryError) {
      throw summaryError;
    }
  } catch (error) {
    console.error('Error saving summary:', error);
  }
} 