import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Modality } from "@google/genai";

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // Helper to initialize GoogleGenAI safely
  const getAI = () => {
    const apiKey = (process.env.GEMINI_API_KEY || process.env.API_KEY || '').trim();
    if (!apiKey) {
      throw new Error("GEMINI_API_KEY environment variable is missing.");
    }
    return new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        }
      }
    });
  };

  // Roleplay Scenarios Constant & Helpers
  const ROLEPLAY_MENU_TEXT = `Please choose a scenario to practice by typing the number:
1. Asking for a pencil
2. Talking to a teacher
3. Buying at the canteen
4. Introducing yourself
5. Asking directions
6. Talking about hobbies`;

  const ROLEPLAY_SCENARIOS: Record<number, { id: number; title: string; initiation: string; persona: string }> = {
    1: {
      id: 1,
      title: "Asking for a pencil",
      initiation: "Oh no, I just realized I don't have anything to write with. Do you happen to have a spare pencil?",
      persona: "You are a classmate in school who forgot their writing tools and needs to borrow a pencil."
    },
    2: {
      id: 2,
      title: "Talking to a teacher",
      initiation: "Hello! It's good to see you. Did you have a question about today's lesson or your homework?",
      persona: "You are a warm, kind, and supportive school teacher speaking to the student about today's lesson or homework."
    },
    3: {
      id: 3,
      title: "Buying at the canteen",
      initiation: "Hi there, next in line! What can I get for you to eat today?",
      persona: "You are a friendly school canteen server taking food and drink orders from the student."
    },
    4: {
      id: 4,
      title: "Introducing yourself",
      initiation: "Hi! I don't think we've met yet. I'm new to this class. What's your name?",
      persona: "You are a friendly new student who just joined the class, eager to introduce yourself and make friends."
    },
    5: {
      id: 5,
      title: "Asking directions",
      initiation: "Excuse me, I'm a bit lost. Could you help me find the main office?",
      persona: "You are someone at school who is a bit lost and asking for help to find the main office."
    },
    6: {
      id: 6,
      title: "Talking about hobbies",
      initiation: "I'm so glad it's almost the weekend. What do you like to do in your free time?",
      persona: "You are a cheerful classmate chatting about hobbies, weekend plans, games, and sports."
    }
  };

  const detectScenario = (input: string): number | null => {
    const trimmed = input.trim().toLowerCase();
    if (/^1(\D|$)/.test(trimmed) || trimmed === '1' || trimmed.includes('pencil') || trimmed.includes('asking for a pencil')) return 1;
    if (/^2(\D|$)/.test(trimmed) || trimmed === '2' || trimmed.includes('teacher') || trimmed.includes('talking to a teacher')) return 2;
    if (/^3(\D|$)/.test(trimmed) || trimmed === '3' || trimmed.includes('canteen') || trimmed.includes('buying at the canteen')) return 3;
    if (/^4(\D|$)/.test(trimmed) || trimmed === '4' || trimmed.includes('introducing') || trimmed.includes('introduce')) return 4;
    if (/^5(\D|$)/.test(trimmed) || trimmed === '5' || trimmed.includes('direction') || trimmed.includes('office')) return 5;
    if (/^6(\D|$)/.test(trimmed) || trimmed === '6' || trimmed.includes('hobbi') || trimmed.includes('hobby') || trimmed.includes('free time')) return 6;
    return null;
  };

  // API Endpoint: Interactive Conversational Roleplay Chatbot
  app.post("/api/chat", async (req, res) => {
    try {
      const { userMessage, history = [], childName = "Student", scenarioId } = req.body;

      if (!userMessage) {
        return res.status(400).json({ error: "userMessage is required" });
      }

      const trimmed = userMessage.trim().toLowerCase();

      // Check for Menu command
      if (
        trimmed === 'menu' ||
        trimmed === '"menu"' ||
        trimmed === 'menu please' ||
        trimmed === 'show menu' ||
        trimmed === 'back to menu' ||
        trimmed === 'start over'
      ) {
        return res.json({ reply: ROLEPLAY_MENU_TEXT, scenarioId: null });
      }

      // Check if picking a scenario when none active or explicit choice
      let activeId = scenarioId ? Number(scenarioId) : null;
      if (!activeId) {
        const detected = detectScenario(userMessage);
        if (detected && ROLEPLAY_SCENARIOS[detected]) {
          return res.json({
            reply: ROLEPLAY_SCENARIOS[detected].initiation,
            scenarioId: detected
          });
        }
      }

      const currentScenario = activeId ? ROLEPLAY_SCENARIOS[activeId] : null;
      if (!currentScenario) {
        return res.json({ reply: ROLEPLAY_MENU_TEXT, scenarioId: null });
      }

      const ai = getAI();

      const recentHistory = (history as any[])
        .slice(-8)
        .map(m => `${m.sender === 'kid' ? childName : 'Assistant'}: "${m.text}"`)
        .join('\n');

      const systemInstruction = `You are an interactive conversational roleplay assistant for a student named ${childName}. Your goal is to help the student practice real-life conversations.

CURRENT ACTIVE SCENARIO:
Scenario ${currentScenario.id}: ${currentScenario.title}
Persona: ${currentScenario.persona}

RULES FOR STEP 3 DYNAMIC CONVERSATION:
1. Keep the conversation going by asking relevant follow-up questions.
2. Keep your vocabulary at a level appropriate for a student learning conversation skills.
3. Stay strictly within the chosen scenario until the student types "menu" to choose a new one.
4. Keep your responses brief (1-3 sentences maximum) to encourage the student to do most of the talking.
5. Flow naturally and never repeat questions or phrases already said in the conversation history.`;

      const prompt = `Conversation history:
${recentHistory}

${childName} says: "${userMessage}"

Respond naturally in character (1-3 sentences maximum, ending with a relevant follow-up question):`;

      const response = await ai.models.generateContent({
        model: "gemini-3.6-flash",
        contents: [{ parts: [{ text: prompt }] }],
        config: {
          systemInstruction,
          temperature: 0.7,
        }
      });

      const reply = response.text?.trim();
      if (reply) {
        return res.json({ reply, scenarioId: activeId });
      }

      return res.json({ reply: "That sounds good! Could you tell me more about that?", scenarioId: activeId });
    } catch (error: any) {
      console.warn("Server /api/chat error, using smart roleplay fallback:", error.message || error);
      const childName = req.body?.childName || "Student";
      const scenarioId = req.body?.scenarioId ? Number(req.body.scenarioId) : null;
      const input = (req.body?.userMessage || "").toLowerCase();

      if (input.includes('menu')) {
        return res.json({ reply: ROLEPLAY_MENU_TEXT, scenarioId: null });
      }

      let activeId = scenarioId;
      if (!activeId) {
        activeId = detectScenario(input);
        if (activeId && ROLEPLAY_SCENARIOS[activeId]) {
          return res.json({ reply: ROLEPLAY_SCENARIOS[activeId].initiation, scenarioId: activeId });
        }
      }

      if (!activeId || !ROLEPLAY_SCENARIOS[activeId]) {
        return res.json({ reply: ROLEPLAY_MENU_TEXT, scenarioId: null });
      }

      if (activeId === 1) {
        return res.json({ reply: "Thank you so much! What exercise are we working on right now?", scenarioId: 1 });
      } else if (activeId === 2) {
        return res.json({ reply: "I'd be glad to help! Which question on that page would you like us to go through?", scenarioId: 2 });
      } else if (activeId === 3) {
        return res.json({ reply: "Great choice! That is two dollars. Would you like a cold drink with that?", scenarioId: 3 });
      } else if (activeId === 4) {
        return res.json({ reply: `Nice to meet you, ${childName}! What is your favorite subject at school?`, scenarioId: 4 });
      } else if (activeId === 5) {
        return res.json({ reply: "Thank you so much! Is the main office near the school library?", scenarioId: 5 });
      } else if (activeId === 6) {
        return res.json({ reply: "That sounds super fun! Who do you usually play that with?", scenarioId: 6 });
      }

      return res.json({ reply: `That is really nice, ${childName}! Tell me more!`, scenarioId: activeId, fallback: true });
    }
  });

  // In-memory TTS Cache & Quota backoff tracker
  const ttsCache = new Map<string, { audio: string; mimeType: string }>();
  let ttsQuotaCooldownUntil = 0;

  // Helper to strip emojis for clean speech output
  const stripEmojis = (str: string): string => {
    if (!str) return '';
    return str
      .replace(/\p{Extended_Pictographic}/gu, '')
      .replace(/[\u{1F600}-\u{1F64F}\u{1F300}-\u{1F5FF}\u{1F680}-\u{1F6FF}\u{1F700}-\u{1F77F}\u{1F780}-\u{1F7FF}\u{1F900}-\u{1F9FF}\u{1FA00}-\u{1FA6F}\u{1FA70}-\u{1FAFF}\u{2600}-\u{27BF}\u{2300}-\u{23FF}]/gu, '')
      .replace(/\s+/g, ' ')
      .trim();
  };

  // API Endpoint: Gemini TTS with smart caching and Web Speech API fallback
  app.post("/api/tts", async (req, res) => {
    try {
      const { text, voiceName = "Zephyr" } = req.body;
      if (!text) return res.status(400).json({ error: "Text is required" });

      const cleanText = stripEmojis(text) || text;
      const cacheKey = `${voiceName}:${cleanText.toLowerCase().trim()}`;

      // Check cache first to save quota & provide instantaneous playback
      if (ttsCache.has(cacheKey)) {
        const cached = ttsCache.get(cacheKey)!;
        return res.json({ audio: cached.audio, mimeType: cached.mimeType, cached: true });
      }

      // If in quota cooldown period, immediately fallback to Web Speech API
      if (Date.now() < ttsQuotaCooldownUntil) {
        return res.json({ fallback: true, message: "Quota cooldown active, using Web Speech API" });
      }

      const ai = getAI();
      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: [{ parts: [{ text: `Say cheerfully: ${cleanText}` }] }],
        config: {
          responseModalities: [Modality.AUDIO],
          speechConfig: {
            voiceConfig: {
              prebuiltVoiceConfig: { voiceName }
            }
          }
        }
      });

      const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
      if (base64Audio) {
        const result = { audio: base64Audio, mimeType: "audio/wav" };
        if (ttsCache.size > 100) {
          const firstKey = ttsCache.keys().next().value;
          if (firstKey) ttsCache.delete(firstKey);
        }
        ttsCache.set(cacheKey, result);
        return res.json(result);
      } else {
        return res.json({ fallback: true, message: "Falling back to Web Speech API" });
      }
    } catch (error: any) {
      const errMsg = error?.message || String(error);
      if (errMsg.includes('429') || errMsg.includes('quota') || errMsg.includes('RESOURCE_EXHAUSTED')) {
        // Set cooldown for 60 seconds to avoid repeating failed rate-limit calls
        ttsQuotaCooldownUntil = Date.now() + 60000;
        console.warn("TTS Gemini quota limit reached (429), switching to client Web Speech API fallback for 60s.");
      } else {
        console.warn("TTS generation note: switching to Web Speech API fallback.", errMsg.slice(0, 100));
      }
      return res.json({ fallback: true, reason: "quota_or_fallback", message: "Falling back to Web Speech API" });
    }
  });

  // Vite middleware for dev / static for prod
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*all', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
