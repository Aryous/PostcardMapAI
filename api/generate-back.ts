import { generatePostcardBackDirect } from '../services/geminiService';

export const config = {
  maxDuration: 60,
};

const parseBody = (body: any) => {
  if (!body) {
    return {};
  }

  if (typeof body === 'string') {
    return body.trim() ? JSON.parse(body) : {};
  }

  return body;
};

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method not allowed.' });
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return res.status(503).json({ error: 'Server Gemini API key is not configured.' });
  }

  try {
    const body = parseBody(req.body);
    const { backPrompt, modelName, aspectRatio } = body;

    if (!backPrompt) {
      return res.status(400).json({ error: 'backPrompt is required.' });
    }

    const result = await generatePostcardBackDirect(
      backPrompt,
      modelName,
      aspectRatio,
      apiKey
    );

    return res.status(200).json(result);
  } catch (error: any) {
    console.error('Back generation failed:', error);
    return res.status(500).json({
      error: error?.message || 'Back generation failed.',
    });
  }
}
