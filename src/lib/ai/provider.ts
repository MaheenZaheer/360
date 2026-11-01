// Server-side AI provider for review analysis
// Supports OpenAI, Anthropic, and Google AI

import type { Review, AnalysisData } from '@/lib/types';

interface AIProviderConfig {
  provider: string;
  apiKey: string;
  model: string;
}

function getConfig(): AIProviderConfig | null {
  const provider = process.env.AI_PROVIDER;
  const apiKey = process.env.AI_API_KEY;
  const model = process.env.AI_MODEL;

  if (!provider || !apiKey) return null;

  return {
    provider,
    apiKey,
    model: model || getDefaultModel(provider),
  };
}

function getDefaultModel(provider: string): string {
  const p = provider.toLowerCase();
  switch (p) {
    case 'openai': return 'gpt-4o-mini';
    case 'anthropic': return 'claude-3-haiku-20240307';
    case 'google':
    case 'gemini': return 'gemini-1.5-flash';
    default: return 'gpt-4o-mini';
  }
}

async function callAI(prompt: string, config: AIProviderConfig): Promise<string> {
  const p = config.provider.toLowerCase();
  switch (p) {
    case 'openai':
      return callOpenAI(prompt, config);
    case 'anthropic':
      return callAnthropic(prompt, config);
    case 'google':
    case 'gemini':
      return callGoogle(prompt, config);
    default:
      throw new Error(`Unsupported AI provider: ${config.provider}`);
  }
}

async function callOpenAI(prompt: string, config: AIProviderConfig): Promise<string> {
  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${config.apiKey}`,
    },
    body: JSON.stringify({
      model: config.model,
      messages: [
        { role: 'system', content: 'You are a customer review analyst. Always respond with valid JSON.' },
        { role: 'user', content: prompt },
      ],
      temperature: 0.3,
      response_format: { type: 'json_object' },
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`OpenAI API error: ${response.status} - ${error}`);
  }

  const data = await response.json();
  return data.choices[0].message.content;
}

async function callAnthropic(prompt: string, config: AIProviderConfig): Promise<string> {
  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': config.apiKey,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: config.model,
      max_tokens: 2048,
      messages: [
        { role: 'user', content: `You are a customer review analyst. Always respond with valid JSON only, no markdown formatting.\n\n${prompt}` },
      ],
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Anthropic API error: ${response.status} - ${error}`);
  }

  const data = await response.json();
  return data.content[0].text;
}

async function callGoogle(prompt: string, config: AIProviderConfig): Promise<string> {
  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${config.model}:generateContent?key=${config.apiKey}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [
          { parts: [{ text: `You are a customer review analyst. Always respond with valid JSON only, no markdown formatting.\n\n${prompt}` }] },
        ],
        generationConfig: { temperature: 0.3 },
      }),
    }
  );

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Google AI API error: ${response.status} - ${error}`);
  }

  const data = await response.json();
  return data.candidates[0].content.parts[0].text;
}

function buildAnalysisPrompt(reviews: Review[]): string {
  const reviewTexts = reviews.map((r, i) =>
    `Review ${i + 1} (Rating: ${r.rating}/5): "${r.comment}"`
  ).join('\n');

  return `Analyze these ${reviews.length} customer reviews and provide a comprehensive analysis.

${reviewTexts}

Respond with a JSON object in this exact format:
{
  "sentiment_summary": {
    "positive": <number of positive reviews>,
    "neutral": <number of neutral reviews>,
    "negative": <number of negative reviews>,
    "average_rating": <average rating as decimal>
  },
  "topics": [
    { "topic": "<topic name>", "count": <mention count>, "sentiment": "positive|neutral|negative" }
  ],
  "key_concerns": ["<concern 1>", "<concern 2>"],
  "strengths": ["<strength 1>", "<strength 2>"],
  "recommendations": ["<recommendation 1>", "<recommendation 2>"],
  "summary": "<2-3 sentence summary of overall customer sentiment and key findings>"
}`;
}

function buildSentimentPrompt(review: Review): string {
  return `Classify the sentiment of this customer review as exactly one of: "positive", "neutral", or "negative".

Rating: ${review.rating}/5
Review: "${review.comment}"

Respond with a JSON object: { "sentiment": "positive|neutral|negative" }`;
}

export async function analyzeReviews(reviews: Review[]): Promise<{
  success: boolean;
  data?: AnalysisData;
  error?: string;
  configured: boolean;
}> {
  const config = getConfig();

  if (!config) {
    return {
      success: false,
      configured: false,
      error: 'AI analysis is not configured. Set AI_PROVIDER and AI_API_KEY in environment variables.',
    };
  }

  if (reviews.length === 0) {
    return {
      success: false,
      configured: true,
      error: 'No reviews to analyze.',
    };
  }

  try {
    const prompt = buildAnalysisPrompt(reviews);
    const rawResponse = await callAI(prompt, config);

    // Parse the JSON response, handling potential markdown code block wrapping
    let jsonString = rawResponse.trim();
    if (jsonString.startsWith('```')) {
      jsonString = jsonString.replace(/^```(?:json)?\n?/, '').replace(/\n?```$/, '');
    }

    const data: AnalysisData = JSON.parse(jsonString);
    return { success: true, data, configured: true };
  } catch (error) {
    console.error('AI analysis error:', error);
    return {
      success: false,
      configured: true,
      error: error instanceof Error ? error.message : 'Unknown AI analysis error',
    };
  }
}

export async function classifySentiment(review: Review): Promise<{
  sentiment: 'positive' | 'neutral' | 'negative' | null;
  configured: boolean;
}> {
  const config = getConfig();

  if (!config) {
    // Fallback: simple rule-based classification
    return { sentiment: ruleBasedSentiment(review), configured: false };
  }

  try {
    const prompt = buildSentimentPrompt(review);
    const rawResponse = await callAI(prompt, config);

    let jsonString = rawResponse.trim();
    if (jsonString.startsWith('```')) {
      jsonString = jsonString.replace(/^```(?:json)?\n?/, '').replace(/\n?```$/, '');
    }

    const data = JSON.parse(jsonString);
    return { sentiment: data.sentiment, configured: true };
  } catch {
    // Fallback to rule-based
    return { sentiment: ruleBasedSentiment(review), configured: false };
  }
}

function ruleBasedSentiment(review: Review): 'positive' | 'neutral' | 'negative' {
  if (review.rating >= 4) return 'positive';
  if (review.rating === 3) return 'neutral';
  return 'negative';
}

export function isAIConfigured(): boolean {
  return getConfig() !== null;
}
