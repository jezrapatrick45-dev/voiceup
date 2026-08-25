import { GoogleGenAI, Type } from "@google/genai";
import { AISchedulingResponse, ScheduleEvent } from "../types";

const getAI = () => {
  // Try GEMINI_API_KEY first, fallback to API_KEY
  const apiKey = (process.env.GEMINI_API_KEY || process.env.API_KEY || '').trim();
  if (!apiKey) {
    throw new Error("Gemini API key is missing. Please check your environment variables in AI Studio.");
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

/**
 * Uses Gemini to parse a natural language prompt and generate a structured weekly schedule.
 */
export async function generateAISchedule(
  userPrompt: string, 
  currentEvents: ScheduleEvent[]
): Promise<AISchedulingResponse> {
  const ai = getAI();

  // Create a simplified representation of existing events to provide context
  const existingEventsContext = currentEvents.map(e => ({
    title: e.title,
    day: e.day,
    time: `${e.startTime}-${e.endTime}`,
    category: e.category,
    priority: e.priority
  }));

  const systemInstruction = `You are an expert weekly planner and productivity assistant.
The user wants to structure or modify their weekly schedule. 
You can either create a fully new schedule from scratch, modify parts of the schedule, or merge new requests with existing events.
Use the following categories: 'work', 'health', 'personal', 'leisure', 'study', 'focus'.
Make sure all events have a valid startTime and endTime in "HH:MM" 24-hour format, and that start time is before end time.
Ensure times are reasonable (e.g., events should start and end on the same day, no midnight wraps unless requested, e.g. 09:00 to 11:30 is perfect).
Days of the week must be exactly capitalization: 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'.`;

  const prompt = `
Current existing schedule context:
${JSON.stringify(existingEventsContext, null, 2)}

User Request:
"${userPrompt}"

Generate a structured response with a set of events that fulfills the user's intent. 
If the user wants to *add* to their schedule, keep or adapt key existing events and add the new ones, ensuring no heavy overlaps.
If the user wants to *start fresh*, generate a completely new balanced schedule based on their prompt.
You can optionally include 1-3 core weekly goals and 1-4 habits that align with their schedule and request.
Provide a clean, motivating explanation of your scheduling strategy in 'explanation'.`;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3.6-flash",
      contents: [{ parts: [{ text: prompt }] }],
      config: {
        systemInstruction,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            events: {
              type: Type.ARRAY,
              description: "The list of schedule events generated or adapted.",
              items: {
                type: Type.OBJECT,
                properties: {
                  title: { type: Type.STRING, description: "Clear, action-oriented title of the event" },
                  description: { type: Type.STRING, description: "Brief description of what to do (1-2 sentences)" },
                  day: { type: Type.STRING, description: "Day of the week: Monday, Tuesday, Wednesday, Thursday, Friday, Saturday, Sunday" },
                  startTime: { type: Type.STRING, description: "Start time in HH:MM format (24-hour, e.g. '09:00')" },
                  endTime: { type: Type.STRING, description: "End time in HH:MM format (24-hour, e.g. '10:30')" },
                  category: { type: Type.STRING, description: "Category of event: work, health, personal, leisure, study, focus" },
                  priority: { type: Type.STRING, description: "Priority level: low, medium, high" }
                },
                required: ["title", "day", "startTime", "endTime", "category", "priority"]
              }
            },
            habits: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: "Optional list of 1-4 custom daily or recurring habits to track (e.g., 'Drink 3L of water', '15 mins meditation')"
            },
            goals: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: "Optional list of 1-3 weekly goals to display in the goal tracker"
            },
            explanation: {
              type: Type.STRING,
              description: "A friendly, encouraging, and brief (2-3 sentences) explanation of how this schedule is optimized for the user's request."
            }
          },
          required: ["events", "explanation"]
        }
      }
    });

    const textOutput = response.text;
    if (!textOutput) {
      throw new Error("No response returned from the Gemini scheduling model.");
    }

    const data: AISchedulingResponse = JSON.parse(textOutput);
    return data;
  } catch (error: any) {
    console.error("AI Scheduling Error:", error);
    throw new Error(error.message || "Failed to generate schedule with Gemini AI. Please check your prompt or API key.");
  }
}

/**
 * Analyzes the current weekly schedule and provides smart balance insights & productivity recommendations.
 */
export async function generateAICoachFeedback(
  events: ScheduleEvent[],
  goals: WeeklyGoal[],
  habits: WeeklyHabit[]
): Promise<string> {
  const ai = getAI();

  const scheduleContext = {
    events: events.map(e => ({ title: e.title, day: e.day, category: e.category, hours: calculateHours(e.startTime, e.endTime) })),
    goals: goals.map(g => ({ title: g.title, completed: g.completed })),
    habits: habits.map(h => ({ name: h.name, completedCount: h.daysCompleted.length }))
  };

  const prompt = `
You are an expert Productivity Coach and Wellness Advisor.
Analyze this user's weekly schedule, habits, and goals:

${JSON.stringify(scheduleContext, null, 2)}

Provide a beautiful, structured analysis in 3 sections:
1. ⚖️ **Weekly Balance Analysis**: Review how many hours are spent in each category (Work, Focus, Study vs. Health, Leisure, Personal). Celebrate any strong points of balance.
2. ⚠️ **Potential Bottlenecks**: Identify any days that are over-scheduled, gaps where recovery/leisure is missing, or conflicts (e.g. studying immediately after a high-pressure coding block with no transition).
3. 🚀 **Actionable Recommendations**: Give 2-3 highly specific, friendly, and practical tips to optimize their next week (e.g. "Move Thursday learning session to morning", "Add a wellness hour on Saturday").

Write in a warm, motivating, professional tone. Keep it highly readable and clean. No jargon. Use bullet points and bold headers.`;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3.6-flash",
      contents: [{ parts: [{ text: prompt }] }]
    });

    return response.text || "No feedback generated. Your schedule looks great!";
  } catch (error: any) {
    console.error("AI Coach Feedback Error:", error);
    throw new Error(error.message || "Failed to get insights from your AI Coach.");
  }
}

// Utility to calculate hours between HH:MM strings
function calculateHours(start: string, end: string): number {
  try {
    const [startH, startM] = start.split(':').map(Number);
    const [endH, endM] = end.split(':').map(Number);
    const startDecimal = startH + startM / 60;
    const endDecimal = endH + endM / 60;
    return Math.max(0.25, Number((endDecimal - startDecimal).toFixed(2)));
  } catch {
    return 1;
  }
}

export interface ChatMessage {
  id: string;
  sender: 'kid' | 'ai';
  text: string;
  timestamp: string;
}

export const ROLEPLAY_MENU_TEXT = `Please choose a scenario to practice by typing the number:
1. Asking for a pencil
2. Talking to a teacher
3. Buying at the canteen
4. Introducing yourself
5. Asking directions
6. Talking about hobbies`;

export interface RoleplayScenario {
  id: number;
  title: string;
  icon: string;
  initiation: string;
  persona: string;
}

export const ROLEPLAY_SCENARIOS: Record<number, RoleplayScenario> = {
  1: {
    id: 1,
    title: "Asking for a pencil",
    icon: "1️⃣",
    initiation: "Oh no, I just realized I don't have anything to write with. Do you happen to have a spare pencil?",
    persona: "You are a classmate in school who forgot their writing tools and needs to borrow a pencil."
  },
  2: {
    id: 2,
    title: "Talking to a teacher",
    icon: "2️⃣",
    initiation: "Hello! It's good to see you. Did you have a question about today's lesson or your homework?",
    persona: "You are a warm, kind, and supportive school teacher speaking to the student about today's lesson or homework."
  },
  3: {
    id: 3,
    title: "Buying at the canteen",
    icon: "3️⃣",
    initiation: "Hi there, next in line! What can I get for you to eat today?",
    persona: "You are a friendly school canteen server taking food and drink orders from the student."
  },
  4: {
    id: 4,
    title: "Introducing yourself",
    icon: "4️⃣",
    initiation: "Hi! I don't think we've met yet. I'm new to this class. What's your name?",
    persona: "You are a friendly new student who just joined the class, eager to introduce yourself and make friends."
  },
  5: {
    id: 5,
    title: "Asking directions",
    icon: "5️⃣",
    initiation: "Excuse me, I'm a bit lost. Could you help me find the main office?",
    persona: "You are someone at school who is a bit lost and asking for help to find the main office."
  },
  6: {
    id: 6,
    title: "Talking about hobbies",
    icon: "6️⃣",
    initiation: "I'm so glad it's almost the weekend. What do you like to do in your free time?",
    persona: "You are a cheerful classmate chatting about hobbies, weekend plans, games, and sports."
  }
};

export function detectScenarioChoice(input: string): number | null {
  const trimmed = input.trim().toLowerCase();
  if (/^1(\D|$)/.test(trimmed) || trimmed === '1' || trimmed.includes('pencil') || trimmed.includes('asking for a pencil')) return 1;
  if (/^2(\D|$)/.test(trimmed) || trimmed === '2' || trimmed.includes('teacher') || trimmed.includes('talking to a teacher')) return 2;
  if (/^3(\D|$)/.test(trimmed) || trimmed === '3' || trimmed.includes('canteen') || trimmed.includes('buying at the canteen')) return 3;
  if (/^4(\D|$)/.test(trimmed) || trimmed === '4' || trimmed.includes('introducing') || trimmed.includes('introduce')) return 4;
  if (/^5(\D|$)/.test(trimmed) || trimmed === '5' || trimmed.includes('direction') || trimmed.includes('office')) return 5;
  if (/^6(\D|$)/.test(trimmed) || trimmed === '6' || trimmed.includes('hobbi') || trimmed.includes('hobby') || trimmed.includes('free time')) return 6;
  return null;
}

export function isMenuCommand(input: string): boolean {
  const trimmed = input.trim().toLowerCase();
  return (
    trimmed === 'menu' ||
    trimmed === '"menu"' ||
    trimmed === 'menu please' ||
    trimmed === 'show menu' ||
    trimmed === 'back to menu' ||
    trimmed === 'start over'
  );
}

/**
 * Interactive Conversational Roleplay Chatbot
 */
export async function chatWithKidBuddy(
  userMessage: string,
  history: ChatMessage[],
  childName: string = "Student",
  buddyName: string = "Tupai",
  buddyAvatar: string = "🐿️",
  activeScenarioId?: number | null
): Promise<{ reply: string; scenarioId: number | null }> {
  // Check if student asked for the menu
  if (isMenuCommand(userMessage)) {
    return {
      reply: ROLEPLAY_MENU_TEXT,
      scenarioId: null
    };
  }

  // If no active scenario, check if student selected 1-6
  if (!activeScenarioId) {
    const selected = detectScenarioChoice(userMessage);
    if (selected && ROLEPLAY_SCENARIOS[selected]) {
      return {
        reply: ROLEPLAY_SCENARIOS[selected].initiation,
        scenarioId: selected
      };
    }
  }

  // 1. Try server API route /api/chat
  try {
    const res = await fetch("/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        userMessage,
        history,
        childName,
        buddyName,
        buddyAvatar,
        scenarioId: activeScenarioId
      })
    });

    if (res.ok) {
      const data = await res.json();
      if (data && data.reply) {
        return {
          reply: data.reply,
          scenarioId: data.scenarioId !== undefined ? data.scenarioId : (activeScenarioId ?? null)
        };
      }
    }
  } catch (e) {
    console.warn("Client /api/chat request failed, fallback to client-side GenAI:", e);
  }

  // 2. Direct client fallback with Gemini SDK
  const apiKey = (
    process.env.GEMINI_API_KEY || 
    process.env.API_KEY || 
    (typeof import.meta !== 'undefined' && (import.meta as any).env?.VITE_GEMINI_API_KEY) || 
    ''
  ).trim();

  const currentScenario = activeScenarioId ? ROLEPLAY_SCENARIOS[activeScenarioId] : null;

  if (!apiKey || !currentScenario) {
    return {
      reply: getFallbackRoleplayResponse(userMessage, currentScenario, childName, history),
      scenarioId: activeScenarioId ?? null
    };
  }

  try {
    const ai = new GoogleGenAI({ apiKey });
    
    const recentHistory = history.slice(-8).map(m => `${m.sender === 'kid' ? childName : 'Assistant'}: "${m.text}"`).join('\n');

    const systemInstruction = `You are an interactive conversational roleplay assistant for a student named ${childName}. Your goal is to help the student practice real-life conversations.

CURRENT ACTIVE SCENARIO:
Scenario ${currentScenario.id}: ${currentScenario.title}
Persona: ${currentScenario.persona}

RULES FOR STEP 3 DYNAMIC CONVERSATION:
1. Keep the conversation going by asking relevant follow-up questions.
2. Keep your vocabulary at a level appropriate for a student learning conversation skills.
3. Stay strictly within the chosen scenario until the student types "menu" to choose a new one.
4. Keep your responses brief (1-3 sentences maximum) to encourage the student to do most of the talking.
5. Flow naturally and never repeat questions or sentences already said in the conversation history.`;

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
      return { reply, scenarioId: activeScenarioId };
    }
    
    return {
      reply: getFallbackRoleplayResponse(userMessage, currentScenario, childName, history),
      scenarioId: activeScenarioId
    };
  } catch (err) {
    console.warn("Gemini Chatbot fallback engaged:", err);
    return {
      reply: getFallbackRoleplayResponse(userMessage, currentScenario, childName, history),
      scenarioId: activeScenarioId ?? null
    };
  }
}

function getFallbackRoleplayResponse(
  input: string,
  scenario: RoleplayScenario | null,
  childName: string,
  history: ChatMessage[] = []
): string {
  const lower = input.toLowerCase();

  // If no scenario active
  if (!scenario) {
    const choice = detectScenarioChoice(input);
    if (choice && ROLEPLAY_SCENARIOS[choice]) {
      return ROLEPLAY_SCENARIOS[choice].initiation;
    }
    return ROLEPLAY_MENU_TEXT;
  }

  const pastBotTexts = history.filter(h => h.sender === 'ai').map(h => h.text.toLowerCase());

  const pickUnique = (options: string[]): string => {
    const fresh = options.filter(opt => !pastBotTexts.some(past => past.includes(opt.slice(0, 15).toLowerCase())));
    if (fresh.length > 0) {
      return fresh[Math.floor(Math.random() * fresh.length)];
    }
    return options[Math.floor(Math.random() * options.length)];
  };

  // Scenario 1: Asking for a pencil
  if (scenario.id === 1) {
    if (lower.includes('yes') || lower.includes('have') || lower.includes('here') || lower.includes('take') || lower.includes('sure')) {
      return pickUnique([
        "Thank you so much, you saved me! Do you need it back at the end of class?",
        "That's so kind of you! Is this a 2B pencil or a mechanical pencil?",
        "Awesome, thank you! What assignment are we working on right now?"
      ]);
    }
    if (lower.includes('no') || lower.includes('sorry') || lower.includes("don't")) {
      return pickUnique([
        "No problem at all! Do you know who else might have an extra one?",
        "That's okay! Should I go ask the teacher for one?",
        "No worries! Thanks anyway. Can I borrow an eraser if I make a mistake?"
      ]);
    }
    return pickUnique([
      "Thanks for letting me know! What subject are we doing right now?",
      "Great! Shall we start writing our answers together?"
    ]);
  }

  // Scenario 2: Talking to a teacher
  if (scenario.id === 2) {
    if (lower.includes('homework') || lower.includes('exercise') || lower.includes('question') || lower.includes('page')) {
      return pickUnique([
        "I would be glad to help! Which question on that page are you finding tricky?",
        "Good question! Did you try reading the example on page 10 first?",
        "Of course! Would you like me to explain the instructions step by step?"
      ]);
    }
    if (lower.includes('lesson') || lower.includes('understand') || lower.includes('help')) {
      return pickUnique([
        "I am happy to explain it again. Which part would you like us to review together?",
        "You're doing great by asking! Would you like an extra practice worksheet to try?",
        "That's very thoughtful. Do you feel ready for tomorrow's quiz?"
      ]);
    }
    return pickUnique([
      "That is wonderful. Is there anything else about our lesson you'd like to ask?",
      "Keep up the great work in class! Are you enjoying our current topic?"
    ]);
  }

  // Scenario 3: Buying at the canteen
  if (scenario.id === 3) {
    if (lower.includes('rice') || lower.includes('noodle') || lower.includes('chicken') || lower.includes('sandwich') || lower.includes('food') || lower.includes('burger')) {
      return pickUnique([
        "Great choice! That is two dollars. Would you like a drink with that?",
        "Coming right up! Would you like a fruit cup or some vegetables with your meal?",
        "Yummy pick! Are you eating here in the canteen or taking it to the field?"
      ]);
    }
    if (lower.includes('water') || lower.includes('juice') || lower.includes('milk') || lower.includes('milo') || lower.includes('tea')) {
      return pickUnique([
        "Here is your drink! That will be one dollar. Are you paying with cash or token?",
        "Cold and refreshing! Would you like any snacks to go with it?"
      ]);
    }
    return pickUnique([
      "Sure thing! Here is your food and change. Have you got a fork and spoon from the counter?",
      "Enjoy your meal! Are you having lunch with your classmates today?"
    ]);
  }

  // Scenario 4: Introducing yourself
  if (scenario.id === 4) {
    if (lower.includes('name') || lower.includes('i am') || lower.includes("i'm") || lower.includes('call me')) {
      return pickUnique([
        `Nice to meet you, ${childName}! I'm still learning my way around the school. Where is your favorite place here?`,
        `It is great to meet you! How long have you been in this school?`,
        `Awesome to meet you! Who is our class teacher?`
      ]);
    }
    return pickUnique([
      "That sounds great! What games do you usually play during recess?",
      "Cool! Can we sit together during lunch?"
    ]);
  }

  // Scenario 5: Asking directions
  if (scenario.id === 5) {
    if (lower.includes('straight') || lower.includes('left') || lower.includes('right') || lower.includes('up') || lower.includes('down') || lower.includes('near') || lower.includes('hall')) {
      return pickUnique([
        "Thank you! So I should walk down that hallway and turn? Is it near the library?",
        "Got it! Is the main office on the ground floor or the first floor?",
        "Thanks for the clear directions! Do you know if the principal's room is also there?"
      ]);
    }
    return pickUnique([
      "Thank you so much for helping me! Are you heading to class now too?",
      "I appreciate your help! Have a great day at school!"
    ]);
  }

  // Scenario 6: Talking about hobbies
  if (scenario.id === 6) {
    if (lower.includes('play') || lower.includes('game') || lower.includes('football') || lower.includes('draw') || lower.includes('read') || lower.includes('swim') || lower.includes('cycle')) {
      return pickUnique([
        "That sounds like so much fun! How long have you been doing that?",
        "Awesome hobby! Do you practice that with your friends or family?",
        "I love doing that too! What is your favorite thing about it?"
      ]);
    }
    return pickUnique([
      "That is a really cool hobby! What are your plans for this Saturday?",
      "Nice! Do you have any other fun activities you want to try soon?"
    ]);
  }

  return `That is really interesting! Can you tell me a little more about that?`;
}


