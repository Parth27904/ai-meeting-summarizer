import Groq from 'groq-sdk';

// Initialize Groq client
const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY
});

export default async function handler(req, res) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // Handle preflight OPTIONS request
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  // Only allow POST requests
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  try {
    const { transcript, prompt } = req.body;

    // Validate input
    if (!transcript || !prompt) {
      res.status(400).json({ 
        error: 'Both transcript and prompt are required' 
      });
      return;
    }

    if (transcript.length > 50000) {
      res.status(400).json({ 
        error: 'Transcript too long. Please limit to 50,000 characters.' 
      });
      return;
    }

    // Construct the full prompt for the AI
    const systemPrompt = `You are an expert meeting summarizer. Your task is to analyze meeting transcripts and create structured, professional summaries.

Instructions:
1. Follow the user's custom prompt exactly
2. Create clear, actionable summaries
3. Use proper markdown formatting
4. Be concise but comprehensive
5. Extract key decisions, action items, and next steps
6. Maintain professional tone`;

    const userPrompt = `Custom Instructions: ${prompt}

Meeting Transcript:
${transcript}

Please create a summary following the custom instructions above.`;

    // Call Groq API
    const completion = await groq.chat.completions.create({
      messages: [
        {
          role: "system",
          content: systemPrompt
        },
        {
          role: "user",
          content: userPrompt
        }
      ],
      model: "llama3-8b-8192", // Fast and efficient model
      temperature: 0.3, // Lower temperature for more focused summaries
      max_tokens: 2048,
      top_p: 1,
      stream: false
    });

    const summary = completion.choices[0]?.message?.content;

    if (!summary) {
      res.status(500).json({ 
        error: 'Failed to generate summary' 
      });
      return;
    }

    res.status(200).json({ 
      summary,
      tokensUsed: completion.usage?.total_tokens || 0,
      model: "llama3-8b-8192"
    });

  } catch (error) {
    console.error('Summarization error:', error);
    
    // Handle specific Groq errors
    if (error.error?.type === 'invalid_request_error') {
      res.status(400).json({ 
        error: 'Invalid request to AI service' 
      });
      return;
    }
    
    if (error.error?.type === 'rate_limit_error') {
      res.status(429).json({ 
        error: 'Rate limit exceeded. Please try again later.' 
      });
      return;
    }

    res.status(500).json({ 
      error: 'Internal server error occurred while generating summary' 
    });
  }
}