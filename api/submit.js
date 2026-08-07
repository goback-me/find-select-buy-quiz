module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  const { name, email, phone, qualified, answers, tracking } = req.body || {};

  if (!name || !email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || !Array.isArray(answers)) {
    res.status(400).json({ error: 'Missing or invalid fields' });
    return;
  }

  const webhookUrl = process.env.WEBHOOK_URL;
  if (!webhookUrl) {
    res.status(500).json({ error: 'Webhook is not configured' });
    return;
  }

  try {
    const webhookRes = await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name,
        email,
        phone: phone || '',
        qualified: !!qualified,
        answers,
        tracking: tracking && typeof tracking === 'object' ? tracking : {},
        submittedAt: new Date().toISOString(),
      }),
    });

    if (!webhookRes.ok) {
      res.status(502).json({ error: 'Webhook rejected the submission' });
      return;
    }

    res.status(200).json({ ok: true });
  } catch (err) {
    res.status(502).json({ error: 'Failed to reach webhook' });
  }
};
