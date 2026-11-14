// Função do servidor (Vercel): recebe o texto montado pelo site e chama a IA.
// Funciona com o Gemini (Google, tem plano gratuito) ou com o Claude (Anthropic, pago por uso).
// A chave fica só nas variáveis da Vercel, nunca no navegador.
const SISTEMA = 'Você responde somente com um objeto JSON válido, sem markdown e sem nenhum texto fora do JSON.';

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ code: 'metodo' });

  const { GEMINI_API_KEY, GEMINI_MODEL, ANTHROPIC_API_KEY, ANTHROPIC_MODEL, SITE_URL } = process.env;
  if (!GEMINI_API_KEY && !ANTHROPIC_API_KEY) return res.status(500).json({ code: 'sem_chave' });

  // 1. Só aceita pedidos vindos do próprio site (se SITE_URL estiver configurado)
  const origem = req.headers.origin || req.headers.referer || '';
  if (SITE_URL && !origem.startsWith(SITE_URL)) return res.status(403).json({ code: 'origem' });

  // 2. Valida a entrada
  const body = typeof req.body === 'string' ? JSON.parse(req.body || '{}') : (req.body || {});
  const prompt = body.prompt;
  if (typeof prompt !== 'string' || prompt.length < 10 || prompt.length > 60000) {
    return res.status(400).json({ code: 'entrada' });
  }

  // 3. Chama a IA
  let texto = '';
  try {
    texto = GEMINI_API_KEY
      ? await chamarGemini(prompt, GEMINI_API_KEY, GEMINI_MODEL)
      : await chamarClaude(prompt, ANTHROPIC_API_KEY, ANTHROPIC_MODEL);
  } catch (e) {
    console.error('Erro da IA:', e.status, e.detalhe);
    if (e.status === 429) return res.status(429).json({ code: 'rate_limited' });
    return res.status(502).json({ code: 'ia' });
  }

  // 4. Extrai o JSON da resposta
  const limpo = texto.replace(/```json|```/g, '').trim();
  try {
    const resultado = JSON.parse(limpo.slice(limpo.indexOf('{'), limpo.lastIndexOf('}') + 1));
    return res.status(200).json({ resultado });
  } catch (e) {
    console.error('Resposta fora do formato:', limpo.slice(0, 300));
    return res.status(502).json({ code: 'formato' });
  }
};

async function chamarGemini(prompt, chave, modelo) {
  const m = modelo || 'gemini-4-hydrogen';
  const r = await fetch('https://generativelanguage.googleapis.com/v1beta/models/' + m + ':generateContent', {
    method: 'POST',
    headers: { 'x-goog-api-key': chave, 'content-type': 'application/json' },
    body: JSON.stringify({
      systemInstruction: { parts: [{ text: SISTEMA }] },
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
      generationConfig: { responseMimeType: 'application/json', maxOutputTokens: 8000 },
    }),
  });
  if (!r.ok) throw { status: r.status, detalhe: (await r.text()).slice(0, 300) };
  const d = await r.json();
  const partes = (((d.candidates || [])[0] || {}).content || {}).parts || [];
  return partes.map((p) => p.text || '').join('');
}

async function chamarClaude(prompt, chave, modelo) {
  const r = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: { 'x-api-key': chave, 'anthropic-version': '2023-06-01', 'content-type': 'application/json' },
    body: JSON.stringify({
      model: modelo || 'claude-sonnet-5-5',
      max_tokens: 4000,
      system: SISTEMA,
      messages: [{ role: 'user', content: prompt }],
    }),
  });
  if (!r.ok) throw { status: r.status, detalhe: (await r.text()).slice(0, 300) };
  const d = await r.json();
  return (d.content || []).filter((b) => b.type === 'text').map((b) => b.text).join('');
}
