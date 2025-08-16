// Use native fetch instead of Groq SDK to avoid dependency issues
export default async function handler(req, res) {
  console.log('API function called:', req.method);
  
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
    console.log('Environment check - API Key exists:', !!process.env.GROQ_API_KEY);
    
    // Check if API key exists
    if (!process.env.GROQ_API_KEY) {
      console.error('GROQ_API_KEY not found');
      res.status(500).json({ 
        error: 'Server configuration error - missing API key'
      });
      return;
    }

    const { transcript, prompt } = req.body;
    console.log('Request received:', { 
      hasTranscript: !!transcript, 
      hasPrompt: !!prompt,
      transcriptLength: transcript?.length 
    });

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

    // Construct the messages for Groq API
    const messages = [
      {
        role: "system",
        content: "You are an expert meeting summarizer. Your task is to analyze meeting transcripts and create structured, professional summaries. Follow the user's custom prompt exactly, create clear actionable summaries, use proper markdown formatting, be concise but comprehensive, extract key decisions and action items, and maintain a professional tone."
      },
      {
        role: "user",
        content: `Custom Instructions: ${prompt}\n\nMeeting Transcript:\n${transcript}\n\nPlease create a summary following the custom instructions above.`
      }
    ];

    console.log('Making request to Groq API...');

    // Make request to Groq API using native fetch
    const groqResponse = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.GROQ_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: "llama3-8b-8192",
        messages: messages,
        temperature: 0.3,
        max_tokens: 2048,
        top_p: 1,
        stream: false
      })
    });

    console.log('Groq API response status:', groqResponse.status);

    if (!groqResponse.ok) {
      const errorText = await groqResponse.text();
      console.error('Groq API error:', errorText);
      
      if (groqResponse.status === 401) {
        res.status(500).json({ 
          error: 'Invalid API key - please check your Groq API key'
        });
        return;
      }
      
      if (groqResponse.status === 429) {
        res.status(429).json({ 
          error: 'Rate limit exceeded. Please try again later.'
        });
        return;
      }
      
      res.status(500).json({ 
        error: 'AI service error',
        status: groqResponse.status,
        details: errorText
      });
      return;
    }

    const completion = await groqResponse.json();
    console.log('Groq API response received');

    const summary = completion.choices?.[0]?.message?.content;

    if (!summary) {
      console.error('No summary content received');
      res.status(500).json({ 
        error: 'Failed to generate summary - no content received'
      });
      return;
    }

    console.log('Summary generated successfully, length:', summary.length);

    res.status(200).json({ 
      summary,
      tokensUsed: completion.usage?.total_tokens || 0,
      model: "llama3-8b-8192",
      success: true
    });

  } catch (error) {
    console.error('Unexpected error:', error);
    
    // Handle network errors
    if (error.code === 'ENOTFOUND' || error.message?.includes('fetch')) {
      res.status(503).json({ 
        error: 'Network error connecting to AI service'
      });
      return;
    }
    
    res.status(500).json({ 
      error: 'Unexpected server error',
      message: error.message
    });
  }
}