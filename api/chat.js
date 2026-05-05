const OPENAI_API_URL = "https://api.openai.com/v1/responses";
const MODEL = process.env.OPENAI_MODEL || "gpt-4.1";

function getApiKey() {
  return (
    process.env.OPENAI_API_KEY ||
    process.env.OPENAI_API ||
    process.env.OPEN_AI_API ||
    process.env.OPEN_AI_API_KEY ||
    ""
  ).trim();
}

function normalizeConversation(conversation) {
  if (!Array.isArray(conversation)) {
    return [];
  }

  return conversation
    .map((item) => {
      if (!item) {
        return null;
      }

      const role = item.role === "model" ? "assistant" : item.role;
      const content =
        typeof item.content === "string"
          ? item.content.trim()
          : Array.isArray(item.parts)
            ? item.parts
                .map((part) => (typeof part?.text === "string" ? part.text : ""))
                .join("\n")
                .trim()
            : "";

      if (
        (role !== "user" && role !== "assistant") ||
        !content
      ) {
        return null;
      }

      return { role, content };
    })
    .filter(Boolean);
}

function extractOutputText(payload) {
  if (typeof payload?.output_text === "string" && payload.output_text.trim()) {
    return payload.output_text.trim();
  }

  const outputs = Array.isArray(payload?.output) ? payload.output : [];
  const chunks = [];

  for (const output of outputs) {
    if (!Array.isArray(output?.content)) {
      continue;
    }

    for (const content of output.content) {
      if (content?.type === "output_text" && typeof content.text === "string") {
        chunks.push(content.text);
      }
    }
  }

  return chunks.join("\n").trim();
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "Method not allowed." });
  }

  const apiKey = getApiKey();
  if (!apiKey) {
    return res.status(500).json({
      error:
        "OPENAI_API_KEY n'est pas configurée sur Vercel. OPEN_AI_API est aussi accepte en secours.",
    });
  }

  const body =
    typeof req.body === "string" && req.body
      ? JSON.parse(req.body)
      : req.body || {};

  const systemPrompt =
    typeof body.systemPrompt === "string" ? body.systemPrompt.trim() : "";
  const conversation = normalizeConversation(body.conversation);

  if (!systemPrompt) {
    return res.status(400).json({ error: "Le prompt systeme est requis." });
  }

  if (conversation.length === 0) {
    return res.status(400).json({ error: "La conversation est vide." });
  }

  try {
    const upstream = await fetch(OPENAI_API_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: MODEL,
        instructions: systemPrompt,
        input: conversation,
        temperature: 0.7,
      }),
    });

    const payload = await upstream.json();

    if (!upstream.ok) {
      const errorMessage =
        payload?.error?.message ||
        "La requete OpenAI a echoue cote serveur.";
      return res.status(upstream.status).json({ error: errorMessage });
    }

    const text = extractOutputText(payload);
    if (!text) {
      return res.status(502).json({
        error: "OpenAI a repondu sans texte exploitable.",
      });
    }

    return res.status(200).json({
      text,
      model: MODEL,
      id: payload.id || null,
    });
  } catch (error) {
    return res.status(500).json({
      error:
        error instanceof Error
          ? error.message
          : "Erreur serveur inattendue.",
    });
  }
}
