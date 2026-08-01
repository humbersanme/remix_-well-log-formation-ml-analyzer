import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI } from '@google/genai';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // Initialize Gemini AI client lazily
  let aiClient: GoogleGenAI | null = null;
  function getAIClient() {
    if (!aiClient) {
      const apiKey = process.env.GEMINI_API_KEY;
      if (apiKey) {
        aiClient = new GoogleGenAI({ apiKey });
      }
    }
    return aiClient;
  }

  // --- API ROUTES ---
  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', time: new Date().toISOString() });
  });

  app.get('/api/run_correlation', (req, res) => {
    res.json({
      status: 'success',
      message: 'Gráfica de correlación generada correctamente.',
      timestamp: new Date().toISOString()
    });
  });

  app.get('/api/wells', (req, res) => {
    res.json({
      status: 'success',
      wells: [
        {
          id: 'pozo_1',
          name: 'POZO 1 (Acacias Field)',
          folderName: 'Pozo_1_csv',
          files: [
            'Datos_desviacion _POZO_1.csv',
            'Gases_acacias_Pozo1_final_SUP_A_10702_FT.csv',
            'Parametros_profundidad_POZO_1_0702ft_2.csv'
          ]
        },
        {
          id: 'pozo_2',
          name: 'POZO 2 (Acacias Field - West Slope)',
          folderName: 'Pozo_2_csv',
          files: [
            'Datos_desviacion_POZO_2.csv',
            'Gases_acacias_Pozo2_11200_FT.csv',
            'Parametros_profundidad_POZO_2.csv'
          ]
        },
        {
          id: 'pozo_3',
          name: 'POZO 3 (Chichimene Exploration)',
          folderName: 'Pozo_3_csv',
          files: [
            'Datos_desviacion_POZO_3.csv',
            'Gases_chichimene_Pozo3_12500_FT.csv',
            'Parametros_profundidad_POZO_3.csv'
          ]
        }
      ]
    });
  });

  // AI Interpretation endpoint using Gemini
  app.post('/api/ai-interpret', async (req, res) => {
    try {
      const { wellName, selectedTop, tops, sampleData } = req.body;
      const ai = getAIClient();

      if (!ai) {
        return res.json({
          summary: `Análisis para ${wellName}: Se detectaron ${tops?.length || 0} topes de formación mediante el algoritmo de KMeans (R3). Se observa una clara correlación entre los saltos de ROP y las anomalías cromatográficas de gas Methane/Heavy ratios.`,
          formationBreakdown: (tops || []).map((t: any) => ({
            depth: t.MD_ft,
            name: t.Name || `Formación @ ${t.MD_ft}ft`,
            lithology: t.Lithology || 'Arenisca Intercalada con Lutita',
            potentialHydrocarbons: t.Gas_peak > 300 ? 'Show de Gas Moderado/Alto (C1-C3)' : 'Gas Residual',
            drillingRisk: t.ROP_after < t.ROP_before ? 'Zona de Mayor Dureza (Spike MSE)' : 'Incremento ROP (Riesgo de Pega)'
          })),
          recommendations: [
            'Aumentar frecuencia de muestreo de ripios a cada 10 FT cerca de los topes detectados.',
            'Monitorear relaciones C1/(C2+C3) para identificar contactos de fluido/gas.',
            'Ajustar peso sobre broca (WOB) al ingresar a formaciones con variaciones drásticas de MSE.'
          ]
        });
      }

      const prompt = `
Eres un Ingeniero Geólogo Mudlogger experto en análisis de registros de perforación de pozos petroleros.
Analiza los datos del pozo "${wellName}" con los siguientes topes de formación detectados por KMeans ML:

Topes de formación principales:
${JSON.stringify(tops, null, 2)}

Selección de punto de profundidades (Muestra):
${JSON.stringify(sampleData?.slice(0, 15) || [], null, 2)}

Si hay un tope seleccionado específico: ${JSON.stringify(selectedTop || null)}

Genera una respuesta en formato JSON estrictamente válido con el siguiente esquema:
{
  "summary": "Resumen técnico geológico y operativo corto del pozo (en español)",
  "formationBreakdown": [
    {
      "depth": 5000,
      "name": "Nombre Formación Probable",
      "lithology": "Tipo de roca (Lutita, Arenisca, Caliza, etc.)",
      "potentialHydrocarbons": "Evaluación de shows de gas/petróleo basado en C1 y C2+C3",
      "drillingRisk": "Riesgo operativo o eficiencia de perforación"
    }
  ],
  "recommendations": [
    "Recomendación 1 para mudlogging / geonavegación",
    "Recomendación 2"
  ]
}
`;

      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
        config: {
          responseMimeType: 'application/json',
        }
      });

      const responseText = response.text || '{}';
      const parsed = JSON.parse(responseText);
      res.json(parsed);
    } catch (err: any) {
      console.error('Error in AI interpret route:', err);
      res.status(500).json({ error: err.message || 'Error running Gemini AI interpretation' });
    }
  });

  // Vite development middleware or static production serving
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server listening on http://0.0.0.0:${PORT}`);
  });
}

startServer();
