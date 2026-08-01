import { GoogleGenAI } from "@google/genai";
import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";

const app = express();
app.use(express.json());

const PORT = 3000;

const HUMBERTO_CV_CONTEXT = `
NAME: Humberto Sánchez Méndez
CONTACT: 
  - Phone: (+34) 639 155 213
  - Email: geolhumberto@gmail.com
  - Location: Madrid, Spain
  - Website: https://sanmen.ct.ws/
`;

// Rutas API
app.post("/api/chat", async (req, res) => {
  try {
    const { message, language } = req.body;
    if (!message) {
      return res.status(400).json({ error: "Message is required" });
    }

    const ai = new GoogleGenAI({
      apiKey: process.env.GEMINI_API_KEY,
      httpOptions: {
        headers: {
          "User-Agent": "aistudio-build",
        },
      },
    });

    const targetLang = language === 'en' ? 'English' : 'Spanish';

    const response = await ai.models.generateContent({
      model: "gemini-3.6-flash",
      contents: [
        {
          role: "user",
          parts: [
            {
              text: `You are Humberto Sánchez Méndez's official AI Portfolio Assistant. Answer in ${targetLang}:
              
${HUMBERTO_CV_CONTEXT}

User Query: "${message}"`,
            },
          ],
        },
      ],
      config: {
        temperature: 0.7,
      },
    });

    return res.json({ reply: response.text });
  } catch (err: any) {
    console.error("Error in /api/chat:", err);
    return res.status(500).json({
      error: "Error processing request",
      details: err?.message || String(err),
    });
  }
});

// Servidor express y Vite sin dependencia de import.meta.url
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    // Usamos process.cwd() que es compatible con CommonJS en Render
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on port ${PORT}`);
  });
}

startServer();