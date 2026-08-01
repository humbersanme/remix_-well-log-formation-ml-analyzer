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
  - LinkedIn & GitHub profiles available

SUMMARY:
Experienced geologist with expertise in AWS cloud architecture, data science, and web development. Integrates geoscientific analysis with cutting edge IT solutions to drive innovation in resource exploration and digital transformation. Unique dual background bridges geological fieldwork with scalable cloud-based data systems for enhanced decision-making.

LANGUAGE PROFICIENCY:
  - English: Upper Intermediate (CEFR B2) - Duolingo 105/160
  - Russian: Fluent (Russian Language Course – Fundamentals of Translation)
  - Spanish: Native

PUBLICATIONS:
  - Sanchez Mendez, O.H. (2025/2026). "Machine Learning and Python-Based 3D Modeling of Magmatic Systems: Geophysical Data Processing, Volcanology Applications, and Predictive Analysis at Deception Island, Antarctica". Amazon KDP.

PROFESSIONAL EXPERIENCE:
  1. Viewnext (Madrid, Spain | 2024 - 2025) - Data Analyst
     - Managed data in Oracle environments.
     - Conducted data exploration, visualization, analysis; created interactive dashboards & reports with Amazon QuickSight.
     - Integrated QuickSight with Amazon Redshift, Amazon S3, and Amazon Athena for scalable analytics on large data volumes.
  2. Orbis Terrarum (Madrid, Spain | 2020 - 2024) - Geologist
     - Performed geotechnical studies for renewable energy projects (wind/solar) across 3 continents using geophysical prospecting and stability analysis.
     - Managed in-situ testing (pull-out) and foundation treatments (micropiles) for rail infrastructure.
     - Developed corrosion solutions for ports using lab data and predictive models.
  3. BUHO (Madrid, Spain - Remote | 2018 - 2020) - Translator
     - Translator (Russian-Spanish, Spanish-Russian).
  4. Petrosystems of Venezuela S.A. (Bogota DC, Colombia | 2012 - 2016) - Geological Logger
     - Monitored mud logs, cuttings, and core samples during drilling to identify geological formations.
     - Coordinated with drilling engineers and petrophysicians to adjust well trajectories based on findings.
     - Verified quality of electrical, sonic, and nuclear logs (Gamma Ray, Resistivity, Density-Neutron).
  5. Petroservices Ambiental SAS (Florencia, Caqueta | 2012) - Geologist
     - Collected primary data for Environmental Impact Assessments (EIAs) in exploratory drilling areas.
  6. MERIDIAN CONSULTING LTDA (Bogota, Colombia | 2012) - Geologist
     - Reprocessed seismic data for the VIM Basin (Northern Colombia).
  7. Petroseismic Services S.A. (Bogota, Colombia | 2012) - Junior Field QC Geologist

EDUCATION:
  - Master's in Mineral Resources and Geological Risks (Specialization: Geological Risks) - University of Barcelona, Spain (2016 - 2017)
  - Bachelor's Degree in Geology (Oil and Gas Deposits) - Russian University of Peoples' Friendship, Russia (2006 - 2011)

TECHNICAL TRAINING:
  - Geomodeling of Hydrocarbon Reservoirs Using Integrated Software (60h, 2026)
  - Fundamentals of Generative AI on AWS (2025)
  - Big Data Spark Developer - Cloudera, CFTIC GETAFE (200h, 2025)
  - AWS Data Analyst - Experis Academy, ManPower Group (200h, 2025)
  - AWS Solutions Architect - Experis Academy, ManPower Group (2025)
  - Data Sciences - Tajamar Tech (500h, 2024)
  - AWS re/Start Graduate - Fundación Altius (420h, 2024)
  - Web Application Development DAW - CFTIC GETAFE (510h, 2024)
  - Python Data Visualization - CFTIC GETAFE (150h, 2023)

CERTIFICATIONS:
  - AWS Certified Cloud Practitioner
  - AWS re/Start Graduate
  - Artificial Intelligence Fundamentals
  - Data Fundamentals
  - AWS Cloud Quest: Generative AI Practitioner
  - Geomodeling of Hydrocarbon Reservoirs Using Integrated Software

TECHNICAL STACK:
  - Geophysics & Software: Seismic reflection/refraction, ERT, Gravity, Magnetics, PETREL, Voxler, RISINFO, Well Log Analysis (Gamma Ray, Resistivity, Density-Neutron).
  - Cloud Solutions: AWS (EC2, S3, Redshift, Glue, Lambda, Athena, QuickSight, CloudWatch, RDS, VPC, DynamoDB).
  - Programming & Data Science: Python (NumPy, Pandas, Matplotlib, Seaborn, Scikit-learn, SciPy), Machine Learning (Supervised/Unsupervised, Neural Networks, Regression), SQL (Oracle, PostgreSQL, MySQL).
  - Big Data: Apache Spark, Hadoop (HDFS, Hive, HBase, Impala, Yarn).
  - Web & Code: Python, SQL, Java (Spring Boot), JavaScript (React), Scala, Git/GitHub, Linux/Windows, HTML5/CSS3.
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

    const targetLang = language === "en" ? "English" : "Spanish";

    const response = await ai.models.generateContent({
      model: "gemini-3.6-flash",
      contents: [
        {
          role: "user",
          parts: [
            {
              text: `You are Humberto Sánchez Méndez's official AI Portfolio Assistant. Answer polite and concisely in ${targetLang} strictly using his CV data:
              
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

// Servidor Express y servidor de estáticos para producción en Render
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    // Usamos process.cwd() que es 100% compatible con CommonJS en Render
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
