export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, x-groq-key');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const groqKey = req.headers['x-groq-key'] || process.env.GROQ_API_KEY;
  if (!groqKey) return res.status(401).json({ error: 'API key tidak ditemukan' });

  try {
    const { messages, system } = req.body;

    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${groqKey}`
      },
      body: JSON.stringify({
        model: 'deepseek-r1-distill-llama-70b',
        max_tokens: 4096,
        messages: [
          { role: 'system', content: system },
          ...messages
        ]
      })
    });

    const data = await response.json();
    if (!response.ok) return res.status(response.status).json({ error: data.error?.message || 'Groq error' });

    let reply = data.choices?.[0]?.message?.content || '';

    // Remove <think>...</think> tags from DeepSeek R1 reasoning
    reply = reply.replace(/<think>[\s\S]*?<\/think>/g, '').trim();

    return res.status(200).json({ reply });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
