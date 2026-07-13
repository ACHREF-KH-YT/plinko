import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

const app = express();
app.use(express.json());

const PORT = 3000;

// Lazy initialization of Gemini to prevent startup crashes if key is missing
let aiClient: GoogleGenAI | null = null;

function getGeminiClient(): GoogleGenAI {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY environment variable is missing. Please configure it in your Secrets panel.");
  }
  if (!aiClient) {
    aiClient = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          "User-Agent": "aistudio-build",
        },
      },
    });
  }
  return aiClient;
}

// REST API for generating viral commentary subtitles
app.post("/api/commentary", async (req, res) => {
  try {
    const { ballName, multiplier, label, style, customPrompt } = req.body;

    const client = getGeminiClient();
    
    const prompt = `
      You are a hyper-viral YouTube Shorts and TikTok commentator who speaks in high-energy, slang-filled Gen-Z or meme style.
      We are playing an intense, high-adrenaline Plinko game.
      
      Generate 3 highly engaging, funny, short-form commentary lines (each under 8 words) for subtitles representing a specific sequence of gameplay events.
      The ball is named: "${ballName || "Pepe"}"
      The result landed on: "${multiplier}x" (${label || "Standard"})
      The reaction style/mood is: "${style || "hype"}"
      Custom context: "${customPrompt || "none"}"
      
      Instructions:
      - Create 3 short commentary phases as a sequence of events (e.g. 1st: suspense, 2nd: drop, 3rd: result reaction).
      - Make it look like real viral TikTok captions.
      - Use uppercase, sound effects in brackets (e.g., [VINE BOOM], [NANI]), and modern slang (e.g., "COOKING", "BRUHHH", "💀", "HE IS CRACKED", "RIP SAVINGS").
      - Return ONLY a JSON array of 3 strings. Example format: ["WAIT FOR IT...", "OH MY GOD HE IS COOKING!!", "1000x JACKPOT LETS GOOO!!! 🔥"]
      - Do not include markdown wraps (like \`\`\`json) or extra text. Just return the JSON list.
    `;

    const response = await client.models.generateContent({
      model: "gemini-3.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
      }
    });

    const text = response.text || "[]";
    let commentaries = [];
    try {
      commentaries = JSON.parse(text);
    } catch (e) {
      // Fallback parser if not strict JSON
      commentaries = text
        .replace(/[\[\]"]/g, "")
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean);
    }

    if (!Array.isArray(commentaries) || commentaries.length === 0) {
      commentaries = [
        "WAIT FOR IT...",
        "IS THIS THE RUN?! 💀",
        `${multiplier}x LANDED! ABSOLUTE INSANITY! 🚀`
      ];
    }

    res.json({ success: true, commentaries });
  } catch (error: any) {
    console.error("Gemini Commentary Error:", error);
    res.status(500).json({ 
      success: false, 
      error: error.message || "Failed to generate commentary. Check your Gemini API Key configuration." 
    });
  }
});

async function startServer() {
  // Vite integration
  if (process.env.NODE_ENV !== "production") {
    console.log("Starting server in development mode with Vite middleware...");
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    console.log("Starting server in production mode serving static assets...");
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server is running at http://0.0.0.0:${PORT}`);
  });
}

startServer();
