import React, { useState, useEffect, useRef } from 'react';
import {
  chatWithKidBuddy,
  ChatMessage,
  ROLEPLAY_MENU_TEXT,
  ROLEPLAY_SCENARIOS,
  RoleplayScenario,
  isMenuCommand,
  detectScenarioChoice
} from './services/geminiService';
import entranceForestBg from './src/assets/images/entrance_forest_bg_1784782517886.jpg';

interface Phrase {
  text: string;
  trans: string;
}

interface PhoneticHint {
  phonics: string;
  desc: string;
}

interface JahaiWord {
  jahai: string;
  ipa: string;
  english: string;
  malay: string;
  category: 'animal' | 'food' | 'nature' | 'object' | 'greetings' | 'pronouns' | 'body';
  icon: string;
  example: string;
}

const JAHAI_DICTIONARY: JahaiWord[] = [
  // Greetings & Care (From user PDF)
  {
    jahai: "risau",
    ipa: "[ri'sau]",
    english: "Don't worry",
    malay: "Jangan risau",
    category: "greetings",
    icon: "🌟",
    example: "Jangan risau, he? ja=b-cp-cip (Don't worry, we are walking on)"
  },
  {
    jahai: "ma?ap",
    ipa: "[ma'?ap']",
    english: "Sorry / Pardon",
    malay: "Mintak maaf",
    category: "greetings",
    icon: "🤝",
    example: "Ma?ap, je? bra? ja=?t?et (Sorry, I do not know)"
  },
  {
    jahai: "seronok",
    ipa: "[sə'ro.nok']",
    english: "Happy / Joyful",
    malay: "Gembira",
    category: "greetings",
    icon: "😊",
    example: "je? seronok gej nasi? (I am happy eating rice)"
  },
  {
    jahai: "ke'em",
    ipa: "[kə'ʔɛm]",
    english: "Warm Hug",
    malay: "Pelukan mesra",
    category: "greetings",
    icon: "🤗",
    example: "ke'em b-tɔm (A big warm hug)"
  },

  // People & Pronouns (From user PDF & Grammar)
  {
    jahai: "bɔm",
    ipa: "[bɔbm]",
    english: "Friend",
    malay: "Kawan",
    category: "pronouns",
    icon: "👫",
    example: "bɔm je? (My friend)"
  },
  {
    jahai: "je? (yek)",
    ipa: "['ɟɛ?]",
    english: "I / Me",
    malay: "Saya",
    category: "pronouns",
    icon: "🧒",
    example: "je? cip ba=hip (I go to the forest)"
  },
  {
    jahai: "mɔh",
    ipa: "['mɔh]",
    english: "You",
    malay: "Awak",
    category: "pronouns",
    icon: "🫵",
    example: "ha=mɔh ?t?et? (Do you know?)"
  },
  {
    jahai: "wakil (bɛr)",
    ipa: "[wa'kil]",
    english: "Younger Sibling",
    malay: "Adik",
    category: "pronouns",
    icon: "👶",
    example: "wakil je? (My younger sibling)"
  },
  {
    jahai: "pɛ?",
    ipa: "['pɛ?]",
    english: "Older Sibling",
    malay: "Abang / Kakak",
    category: "pronouns",
    icon: "🧑",
    example: "pɛ? je? t-bɔw (My big brother/sister)"
  },
  {
    jahai: "babo?",
    ipa: "[ba'bo?]",
    english: "Woman / Female",
    malay: "Perempuan",
    category: "pronouns",
    icon: "👩",
    example: "babo? t̃ə̄h (This woman)"
  },
  {
    jahai: "tmkal",
    ipa: "[təm'kal]",
    english: "Man / Male",
    malay: "Lelaki",
    category: "pronouns",
    icon: "👨",
    example: "tmkal k=bdil kasa? (The man who shot deer)"
  },
  {
    jahai: "kɛn",
    ipa: "['kɛdn]",
    english: "Child",
    malay: "Anak",
    category: "pronouns",
    icon: "🧒",
    example: "kɛn t-?aɟɔ? (Small child)"
  },

  // Body Parts & Actions (From user PDF)
  {
    jahai: "cjas (kias)",
    ipa: "[ci'jas]",
    english: "Hand",
    malay: "Tangan",
    category: "body",
    icon: "🖐️",
    example: "cjas je? (My hand)"
  },
  {
    jahai: "can",
    ipa: "[cᶜa'dn]",
    english: "Foot / Leg",
    malay: "Kaki",
    category: "body",
    icon: "🦶",
    example: "duwa? nn-can (Two feet)"
  },
  {
    jahai: "mit (mat)",
    ipa: "['mit']",
    english: "Eye",
    malay: "Mata",
    category: "body",
    icon: "👁️",
    example: "mit ktɔ? (Eye of the sky - Sun)"
  },
  {
    jahai: "heŋ (han)",
    ipa: "['hɛŋ]",
    english: "Tooth",
    malay: "Gigi",
    category: "body",
    icon: "🦷",
    example: "heŋ ?o? (His/her tooth)"
  },
  {
    jahai: "tek (bijek)",
    ipa: "['tɛk']",
    english: "Sleep",
    malay: "Tidur",
    category: "body",
    icon: "😴",
    example: "b-tk-tek (Sleeping soundly)"
  },

  // Food & Drink (From user PDF)
  {
    jahai: "gej (cik)",
    ipa: "['gɛj]",
    english: "Eat",
    malay: "Makan",
    category: "food",
    icon: "🍽️",
    example: "ja=gej nasi? (I will eat rice)"
  },
  {
    jahai: "?ɛm (amtom)",
    ipa: "['ʔɛm]",
    english: "Drink",
    malay: "Minum",
    category: "food",
    icon: "🥤",
    example: "ja=?ɛm tɔm (I will drink water)"
  },
  {
    jahai: "nasi?",
    ipa: "[na'si?]",
    english: "Cooked Rice",
    malay: "Nasi",
    category: "food",
    icon: "🍚",
    example: "Gej nasi? (Eat rice)"
  },
  {
    jahai: "hobi?",
    ipa: "[ho'bi?]",
    english: "Wild Yam / Tuber",
    malay: "Ubi Kayu / Ubi Hutan",
    category: "food",
    icon: "🍠",
    example: "Hobi? t<n>anɛm (Planted tuber)"
  },
  {
    jahai: "bap",
    ipa: "['bap']",
    english: "Food / Meal",
    malay: "Makanan",
    category: "food",
    icon: "🍲",
    example: "Bap je? (My meal)"
  },
  {
    jahai: "lwej",
    ipa: "[lə'wɛj]",
    english: "Honey",
    malay: "Madu",
    category: "food",
    icon: "🍯",
    example: "Lwej bt?ɛt (Good honey)"
  },
  {
    jahai: "doren",
    ipa: "[do'ren]",
    english: "Durian Fruit",
    malay: "Durian",
    category: "food",
    icon: "🦔",
    example: "Kmo? doren (Durian fruit)"
  },

  // Nature & Elements (From user PDF)
  {
    jahai: "tɔm (ton)",
    ipa: "['tɔbm]",
    english: "Water / River",
    malay: "Air / Sungai",
    category: "nature",
    icon: "💧",
    example: "Tɔm b-tɔm (Contains water)"
  },
  {
    jahai: "hip (hep)",
    ipa: "['hip']",
    english: "Forest / Jungle",
    malay: "Hutan",
    category: "nature",
    icon: "🌲",
    example: "ja=cip ba=hip (Going to the forest)"
  },
  {
    jahai: "ɟlmɔl (samoi)",
    ipa: "[ɟəl'mɔl]",
    english: "Mountain",
    malay: "Gunung",
    category: "nature",
    icon: "⛰️",
    example: "ɟlmɔl t-bɔw (The big mountain)"
  },
  {
    jahai: "?ɔs",
    ipa: "['?ɔs]",
    english: "Fire",
    malay: "Api",
    category: "nature",
    icon: "🔥",
    example: "cɔm ?ɔs (Make a fire)"
  },
  {
    jahai: "ktɔ?",
    ipa: "[kə'tɔ?]",
    english: "Sun / Day sky",
    malay: "Matahari / Hari",
    category: "nature",
    icon: "☀️",
    example: "Ktɔ? t̃ə̄h (Today)"
  },
  {
    jahai: "ɟhũ?",
    ipa: "[ɟ'ə'hũ?]",
    english: "Tree",
    malay: "Pokok",
    category: "nature",
    icon: "🌳",
    example: "ɟhũ? titih (Tree up there)"
  },

  // Animals (From user PDF & Grammar)
  {
    jahai: "kawɔ̃t (kawau)",
    ipa: "[kã'wɔ̃t']",
    english: "Bird",
    malay: "Burung",
    category: "animal",
    icon: "🐦",
    example: "Kawɔ̃t kapij (Bird flies)"
  },
  {
    jahai: "?ap (oak)",
    ipa: "['?ap']",
    english: "Tiger",
    malay: "Harimau",
    category: "animal",
    icon: "🐅",
    example: "?ap b-cp-cip (Tiger striding)"
  },
  {
    jahai: "kdek",
    ipa: "[kə'dɛk']",
    english: "Squirrel",
    malay: "Tupai",
    category: "animal",
    icon: "🐿️",
    example: "Kdek b-tk-tek (Squirrel is sleeping)"
  },
  {
    jahai: "kuceŋ",
    ipa: "[ku'ceŋ]",
    english: "Cat",
    malay: "Kucing",
    category: "animal",
    icon: "🐱",
    example: "Kuceŋ ?ūn (The cat over there)"
  },
  {
    jahai: "kasa?",
    ipa: "[ka'sa?]",
    english: "Sambar Deer",
    malay: "Rusa",
    category: "animal",
    icon: "🦌",
    example: "Kasa? b-cp-cip (Deer walking)"
  },
  {
    jahai: "taɟu?",
    ipa: "[ta'ɟu?]",
    english: "Snake",
    malay: "Ular",
    category: "animal",
    icon: "🐍",
    example: "Taɟu? sjul (Cobra snake)"
  },

  // Tools & Objects
  {
    jahai: "haje?",
    ipa: "[hã'ɟɛ?]",
    english: "House / Hut",
    malay: "Rumah",
    category: "object",
    icon: "🏡",
    example: "Haje? t̃ə̄h (This house)"
  },
  {
    jahai: "blaw",
    ipa: "[bə'law]",
    english: "Blowpipe",
    malay: "Sumpitan",
    category: "object",
    icon: "🎋",
    example: "Bdil ka=blaw (Shoot with blowpipe)"
  },
  {
    jahai: "taɟi?",
    ipa: "[ta'ɟi?]",
    english: "Jungle Knife",
    malay: "Pisau / Parang",
    category: "object",
    icon: "🔪",
    example: "Taɟi? k<n>aɟil (Knife for fishing)"
  }
];

const DEFAULT_PHRASES: Phrase[] = [
  {
    text: "I love learning English with my teacher",
    trans: "Saya suka belajar Bahasa Inggeris dengan guru saya"
  },
  {
    text: "Good morning everyone welcome to class",
    trans: "Selamat pagi semua selamat datang ke kelas"
  },
  {
    text: "Please can you help me read this book",
    trans: "Tolong bolehkah anda bantu saya membaca buku ini"
  },
  {
    text: "Can we play a fun English game together",
    trans: "Bolehkah kita bermain permainan Bahasa Inggeris bersama"
  },
  {
    text: "Thank you for helping me read today",
    trans: "Terima kasih kerana membantu saya membaca hari ini"
  },
  {
    text: "I am super happy and confident to speak English",
    trans: "Saya sangat gembira dan berkeyakinan untuk bertutur Bahasa Inggeris"
  }
];

const PHONETIC_HINTS: Record<string, PhoneticHint> = {
  "i": { phonics: "ai", desc: "Open your mouth wide like saying high!" },
  "love": { phonics: "luv", desc: "Make a soft 'v' sound at the end with your teeth on your lips." },
  "learning": { phonics: "lur-ning", desc: "Start with a soft roll of 'lur' and end with 'ning'." },
  "english": { phonics: "ing-glish", desc: "Make a strong 'shh' sound at the end like telling someone to be quiet." },
  "with": { phonics: "wi-th", desc: "Put your tongue lightly between your teeth for the 'th' sound." },
  "my": { phonics: "mai", desc: "Sounds exactly like the word my." },
  "teacher": { phonics: "tee-chuh", desc: "Push air out on the 'ch' like a small train puff!" },
  "good": { phonics: "gud", desc: "Keep the double 'o' short and bouncy." },
  "morning": { phonics: "maw-ning", desc: "Emphasize the 'maw' and end clearly with 'ning'." },
  "everyone": { phonics: "ev-ree-wun", desc: "Say three quick parts: ev, ree, wun." },
  "welcome": { phonics: "wel-kum", desc: "Start with a round lip 'w' sound." },
  "to": { phonics: "tuu", desc: "A simple long 'u' sound." },
  "class": { phonics: "klahs", desc: "Start with a crisp 'k' and stretch out the 'ahs'." },
  "please": { phonics: "pleez", desc: "End with a long buzzing 'z' sound like a little bee." },
  "can": { phonics: "kan", desc: "A standard flat 'a' sound." },
  "you": { phonics: "yuu", desc: "Make your lips round." },
  "help": { phonics: "help", desc: "Be sure to make a tiny popping 'p' sound at the very end." },
  "me": { phonics: "mee", desc: "Stretch the 'ee' sound." },
  "read": { phonics: "reed", desc: "Pull the corners of your mouth back into a big smile." },
  "this": { phonics: "this", desc: "Start with a buzzing tongue on your teeth 'th'." },
  "book": { phonics: "buk", desc: "A short, sharp 'u' sound." },
  "we": { phonics: "wee", desc: "Round your lips for 'w' and stretch 'ee'." },
  "play": { phonics: "play", desc: "Start with 'p-l' and stretch out the 'ay'." },
  "a": { phonics: "uh", desc: "A simple short vowel sound." },
  "fun": { phonics: "fun", desc: "Breathe out for 'f' and end with 'un'." },
  "game": { phonics: "gaym", desc: "Soft 'g' sound and close lips at the end for 'm'." },
  "together": { phonics: "tuh-geth-er", desc: "Three parts: tuh, geth, er. Tongue on teeth for 'th'." },
  "thank": { phonics: "thangk", desc: "Tongue between teeth for 'th' and end with 'nk'." },
  "for": { phonics: "faw", desc: "Soft 'f' with rounded lips." },
  "today": { phonics: "tuh-day", desc: "Bounce gently on 'day' at the end." },
  "am": { phonics: "am", desc: "Flat 'a' sound and close lips for 'm'." },
  "super": { phonics: "soo-per", desc: "High smiling 'soo' and soft 'per'." },
  "happy": { phonics: "hap-pee", desc: "Breathe out 'hap' and smile wide for 'pee'." },
  "and": { phonics: "and", desc: "Short 'a' ending with 'nd'." },
  "confident": { phonics: "kon-fi-dent", desc: "Three clear parts: kon, fi, dent." },
  "speak": { phonics: "speek", desc: "Start with 's', pop 'p', and stretch 'eek'." }
};

// Web Audio Sound Chime Synthesizer for cheerful kid feedback
const playAudioChime = (type: 'success' | 'click' | 'encourage' | 'pop') => {
  try {
    const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContext) return;
    const ctx = new AudioContext();

    if (type === 'click' || type === 'pop') {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(550, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(1100, ctx.currentTime + 0.08);
      gain.gain.setValueAtTime(0.12, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.08);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.08);
    } else if (type === 'success') {
      // Cheerful fanfare notes: C5 (523), E5 (659), G5 (783), C6 (1046)
      const notes = [523.25, 659.25, 783.99, 1046.50];
      notes.forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, ctx.currentTime + idx * 0.09);
        gain.gain.setValueAtTime(0.18, ctx.currentTime + idx * 0.09);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + idx * 0.09 + 0.35);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(ctx.currentTime + idx * 0.09);
        osc.stop(ctx.currentTime + idx * 0.09 + 0.35);
      });
    } else if (type === 'encourage') {
      // Gentle warm double bounce notes: G4 (392), C5 (523)
      const notes = [392.00, 523.25];
      notes.forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, ctx.currentTime + idx * 0.12);
        gain.gain.setValueAtTime(0.15, ctx.currentTime + idx * 0.12);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + idx * 0.12 + 0.25);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(ctx.currentTime + idx * 0.12);
        osc.stop(ctx.currentTime + idx * 0.12 + 0.25);
      });
    }
  } catch (e) {
    // AudioContext fallback
  }
};

// Gentle Classroom Teacher Voice Preset
const VOICE_PRESETS: Record<string, { key: string; name: string; rate: number; pitch: number; desc: string }> = {
  'friendly': {
    key: 'friendly',
    name: '👩‍🏫 Gentle Classroom Teacher',
    rate: 0.88,
    pitch: 1.18,
    desc: 'Warm, steady teacher pacing for primary ESL learners.'
  }
};

const AVATAR_BUDDY_MAPPING: Record<string, { name: string; title: string }> = {
  '🐿️': { name: 'Tupai', title: 'Tupai the AI Squirrel' },
  '🦁': { name: 'Leo', title: 'Leo the AI Lion' },
  '🐼': { name: 'Pan Pan', title: 'Pan Pan the AI Panda' },
  '🦊': { name: 'Foxy', title: 'Foxy the AI Fox' },
  '🦉': { name: 'Ollie', title: 'Ollie the AI Owl' },
  '🚀': { name: 'Robo', title: 'Robo the AI Space Buddy' }
};

export const App: React.FC = () => {
  // Configuration State
  const [childName, setChildName] = useState<string>("Aiman");
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [selectedVoiceName, setSelectedVoiceName] = useState<string>("");
  const [voicePresetKey, setVoicePresetKey] = useState<string>("friendly");
  const [voicePaceRate, setVoicePaceRate] = useState<number>(0.88);
  const [voicePitchLevel, setVoicePitchLevel] = useState<number>(1.18);
  const [targetPhrases, setTargetPhrases] = useState<Phrase[]>(DEFAULT_PHRASES);
  
  // UI Tabs & Navigation
  const [hasEnteredApp, setHasEnteredApp] = useState<boolean>(false);
  const [entryStudentName, setEntryStudentName] = useState<string>("Aiman");
  const [studentAvatar, setStudentAvatar] = useState<string>("🐿️");
  const [buddyName, setBuddyName] = useState<string>("Tupai");
  const [isIntroReading, setIsIntroReading] = useState<boolean>(false);
  const hasAutoReadTriggeredRef = useRef<boolean>(false);
  const [activeTab, setActiveTab] = useState<'home' | 'learn' | 'speak' | 'chat' | 'dictionary'>('home');
  const [inspectorTab, setInspectorTab] = useState<'parent' | 'dev'>('parent');
  const [isSettingsOpen, setIsSettingsOpen] = useState<boolean>(false);

  // Quick Dictionary State
  const [dictSearchQuery, setDictSearchQuery] = useState<string>('');
  const [dictCategory, setDictCategory] = useState<string>('all');

  const playIntroductoryText = (customBuddy?: string) => {
    const currentBuddy = customBuddy || buddyName;
    const introText = `Hi there! I'm ${currentBuddy}! Welcome to Voice Up! Choose your buddy avatar and enter your name below.`;

    if (isIntroReading) {
      stopAllAudioAndSpeech();
      setIsIntroReading(false);
      return;
    }

    stopAllAudioAndSpeech();
    setIsIntroReading(true);

    speakText(introText, {
      onStart: () => setIsIntroReading(true),
      onEnd: () => setIsIntroReading(false)
    });
  };

  const handleSelectAvatar = (avatar: string) => {
    playAudioChime('pop');
    setStudentAvatar(avatar);
    const info = AVATAR_BUDDY_MAPPING[avatar] || { name: 'Tupai', title: 'Tupai the AI Squirrel' };
    setBuddyName(info.name);
    // Auto-read the greeting with the chosen mascot buddy
    playIntroductoryText(info.name);
  };

  // Completed / Passed Levels Tracking
  const [passedPhraseIndexes, setPassedPhraseIndexes] = useState<number[]>([0]);

  // Auto-read introductory text the moment the user opens the app
  useEffect(() => {
    if (hasEnteredApp) return;

    const runAutoRead = () => {
      if (hasAutoReadTriggeredRef.current) return;
      hasAutoReadTriggeredRef.current = true;

      const introText = `Hi there! I'm ${buddyName}! Welcome to Voice Up! Choose your buddy avatar and enter your name below.`;
      setIsIntroReading(true);
      speakText(introText, {
        onStart: () => setIsIntroReading(true),
        onEnd: () => setIsIntroReading(false)
      });
    };

    // Auto-play immediately on load
    const timer = setTimeout(() => {
      runAutoRead();
    }, 350);

    // Fallback one-time interaction listener if browser policy restricts unprompted audio
    const handleFirstInteraction = () => {
      if (!hasAutoReadTriggeredRef.current) {
        runAutoRead();
      }
    };

    window.addEventListener('click', handleFirstInteraction, { once: true });
    window.addEventListener('touchstart', handleFirstInteraction, { once: true });
    window.addEventListener('keydown', handleFirstInteraction, { once: true });

    return () => {
      clearTimeout(timer);
      window.removeEventListener('click', handleFirstInteraction);
      window.removeEventListener('touchstart', handleFirstInteraction);
      window.removeEventListener('keydown', handleFirstInteraction);
    };
  }, [hasEnteredApp, buddyName]);

  const handleEnterApp = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    stopAllAudioAndSpeech();
    setIsIntroReading(false);
    const finalName = entryStudentName.trim() || "Student";
    setChildName(finalName);
    setHasEnteredApp(true);
    playAudioChime('success');

    // Update chatbot initial greeting with the Step 1 Scenario Menu
    setChatMessages([
      {
        id: 'init-menu',
        sender: 'ai',
        text: ROLEPLAY_MENU_TEXT,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      }
    ]);
    setActiveScenarioId(null);

    speakWithGeminiVoice(`Welcome to Voice Up, ${finalName}! Please choose a scenario to practice by typing the number from 1 to 6!`);
  };

  // AI Chatbot State
  const [activeScenarioId, setActiveScenarioId] = useState<number | null>(null);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([
    {
      id: 'init-menu',
      sender: 'ai',
      text: ROLEPLAY_MENU_TEXT,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }
  ]);
  const [chatInputText, setChatInputText] = useState<string>('');
  const [isChatThinking, setIsChatThinking] = useState<boolean>(false);
  const [isChatMicActive, setIsChatMicActive] = useState<boolean>(false);
  const chatScrollRef = useRef<HTMLDivElement>(null);
  
  // App Progress & Gamification
  const [userXP, setUserXP] = useState<number>(140);
  const [activePhraseIndex, setActivePhraseIndex] = useState<number>(0);
  const [passThreshold, setPassThreshold] = useState<number>(70);
  const [questProgress, setQuestProgress] = useState<string>("0/1");

  // Live Practice Room State
  const [stepBadge, setStepBadge] = useState<'listen' | 'speak'>('listen');
  const [interactiveHint, setInteractiveHint] = useState<string>('Tap "LISTEN" to hear how to say it.');
  const [guideCharacter, setGuideCharacter] = useState<string>("🐿");
  const [isVoicePulseActive, setIsVoicePulseActive] = useState<boolean>(false);
  const [isRecording, setIsRecording] = useState<boolean>(false);
  const [wordStatuses, setWordStatuses] = useState<('matched' | 'missed' | 'idle')[]>([]);

  // Results & Evaluation
  const [evalResult, setEvalResult] = useState<{
    headline: string;
    grade: string;
    accuracy: number;
    passed: boolean;
    heard: string;
    xpEarned: number;
  } | null>(null);

  const [coachAdvice, setCoachAdvice] = useState<{
    htmlContent: React.ReactNode;
    fullText: string;
  } | null>(null);

  const [lastCoachMessage, setLastCoachMessage] = useState<string>("");

  // Debug Stats
  const [rawSpeechTranscript, setRawSpeechTranscript] = useState<string>("(Awaiting microphone attempt or test button...)");
  const [statWordsMatched, setStatWordsMatched] = useState<string>("0 / 0");
  const [statConfidencePercent, setStatConfidencePercent] = useState<string>("0%");

  // Map Lesson Modal
  const [lessonModal, setLessonModal] = useState<{
    title: string;
    desc: string;
    isPassed: boolean;
    icon: string;
    idx: number;
  } | null>(null);

  // Clock state
  const [liveClock, setLiveClock] = useState<string>("09:41 AM");

  // References
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<any>(null);
  const currentAudioRef = useRef<HTMLAudioElement | null>(null);
  const speechTimeoutRef = useRef<any>(null);

  // Stop All Audio & Speech Utility (Cancels TTS and Audio immediately on retry or action)
  const stopAllAudioAndSpeech = () => {
    if (speechTimeoutRef.current) {
      clearTimeout(speechTimeoutRef.current);
      speechTimeoutRef.current = null;
    }
    if ('speechSynthesis' in window) {
      try {
        window.speechSynthesis.cancel();
      } catch (e) {}
    }
    if (currentAudioRef.current) {
      try {
        currentAudioRef.current.pause();
        currentAudioRef.current.currentTime = 0;
      } catch (e) {}
      currentAudioRef.current = null;
    }
    setIsVoicePulseActive(false);
    setGuideCharacter("🐿");
  };

  // Initialize Clock & Web Speech Recognition
  useEffect(() => {
    const updateClock = () => {
      const now = new Date();
      let hours = now.getHours();
      let minutes = now.getMinutes();
      const ampm = hours >= 12 ? 'PM' : 'AM';
      hours = hours % 12;
      hours = hours ? hours : 12;
      const minutesStr = minutes < 10 ? '0' + minutes : minutes;
      setLiveClock(`${hours}:${minutesStr} ${ampm}`);
    };

    updateClock();
    const interval = setInterval(updateClock, 1000);

    // Setup Speech Recognition if available
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognition) {
      const rec = new SpeechRecognition();
      rec.continuous = false;
      rec.interimResults = false;
      rec.lang = 'en-US';
      recognitionRef.current = rec;
    }

    return () => clearInterval(interval);
  }, []);

  // Update target phrase status on index/phrases change
  useEffect(() => {
    resetPhraseViewState();
  }, [activePhraseIndex, targetPhrases]);

  const resetPhraseViewState = () => {
    const phrase = targetPhrases[activePhraseIndex];
    if (phrase) {
      const words = phrase.text.split(' ');
      setWordStatuses(new Array(words.length).fill('idle'));
    }
    setEvalResult(null);
    setCoachAdvice(null);
    setStepBadge('listen');
    setIsRecording(false);
    setIsVoicePulseActive(false);
    setGuideCharacter("🐿");
    setInteractiveHint('Tap "LISTEN" to hear how to say it.');
  };

  // Navigations
  const handleSwitchTab = (tab: 'home' | 'learn' | 'speak' | 'chat') => {
    playAudioChime('click');
    setActiveTab(tab);
    if (tab === 'speak') {
      setStepBadge('listen');
    }
  };

  const handleNavigatePhrase = (direction: number) => {
    playAudioChime('click');
    let nextIdx = activePhraseIndex + direction;
    if (nextIdx < 0) nextIdx = targetPhrases.length - 1;
    if (nextIdx >= targetPhrases.length) nextIdx = 0;
    setActivePhraseIndex(nextIdx);
  };

  // Level & Tree XP Calculations
  const getLevelTitle = (xp: number) => {
    if (xp >= 400) return "Rainforest Guardian 👑";
    if (xp >= 250) return "Eco-Speaker Elite 🌟";
    if (xp >= 100) return "Forest Scout 🌱";
    return "Forest Scout";
  };

  const xpPercentage = Math.min(100, (userXP / 500) * 100);
  const treeScaleFactor = 1 + (userXP / 1000);

  // Load SpeechSynthesis Voices
  useEffect(() => {
    const loadAvailableVoices = () => {
      if ('speechSynthesis' in window) {
        const available = window.speechSynthesis.getVoices();
        if (available && available.length > 0) {
          // Remove all Microsoft sounds/voices
          const noMicrosoft = available.filter(v => !v.name.toLowerCase().includes('microsoft'));

          // Keep Google US and UK voices
          let googleUsUkVoices = noMicrosoft.filter(v => {
            const nameLower = v.name.toLowerCase();
            const langLower = v.lang.toLowerCase();
            const isGoogle = nameLower.includes('google');
            const isUsOrUk = langLower.includes('en-us') || langLower.includes('en-gb') || 
                             langLower.includes('en_us') || langLower.includes('en_gb') ||
                             nameLower.includes('us') || nameLower.includes('uk') ||
                             nameLower.includes('united states') || nameLower.includes('united kingdom');
            return isGoogle && isUsOrUk;
          });

          // Fallback if browser engine doesn't explicitly name "Google" voices
          if (googleUsUkVoices.length === 0) {
            googleUsUkVoices = noMicrosoft.filter(v => {
              const langLower = v.lang.toLowerCase();
              return langLower.includes('en-us') || langLower.includes('en-gb');
            });
          }

          const activeList = googleUsUkVoices.length > 0 ? googleUsUkVoices : noMicrosoft;
          setVoices(activeList);

          // Set Google US English (en-US) as the default voice
          const defaultGoogleUS = activeList.find(v => 
            v.name.toLowerCase().includes('google') && (v.lang.toLowerCase().includes('en-us') || v.name.includes('US'))
          ) || activeList.find(v => v.lang.toLowerCase().includes('en-us')) || activeList[0];

          if (defaultGoogleUS) {
            setSelectedVoiceName(defaultGoogleUS.name);
          }
        }
      }
    };

    loadAvailableVoices();
    if ('speechSynthesis' in window) {
      window.speechSynthesis.onvoiceschanged = loadAvailableVoices;
    }
  }, []);

  // Preset Applicator
  const applyVoicePreset = (key: string, triggerSample: boolean = true) => {
    const preset = VOICE_PRESETS[key] || VOICE_PRESETS['cheerful'];
    setVoicePresetKey(key);
    setVoicePaceRate(preset.rate);
    setVoicePitchLevel(preset.pitch);

    if (triggerSample) {
      playAudioChime('click');
      speakText(`Testing voice setting: ${preset.name}`, {
        rate: preset.rate,
        pitch: preset.pitch
      });
    }
  };

  // Cheerful, Kid-Friendly Web Speech TTS Helper
  interface SpeakOptions {
    rate?: number;
    pitch?: number;
    voiceName?: string;
    onStart?: () => void;
    onEnd?: () => void;
  }

  // Helper to strip emojis for clean speech pronunciation
  const stripEmojis = (str: string): string => {
    if (!str) return '';
    return str
      .replace(/\p{Extended_Pictographic}/gu, '')
      .replace(/[\u{1F600}-\u{1F64F}\u{1F300}-\u{1F5FF}\u{1F680}-\u{1F6FF}\u{1F700}-\u{1F77F}\u{1F780}-\u{1F7FF}\u{1F900}-\u{1F9FF}\u{1FA00}-\u{1FA6F}\u{1FA70}-\u{1FAFF}\u{2600}-\u{27BF}\u{2300}-\u{23FF}]/gu, '')
      .replace(/\s+/g, ' ')
      .trim();
  };

  const speakText = (text: string, options: SpeakOptions = {}) => {
    if ('speechSynthesis' in window) {
      stopAllAudioAndSpeech();
      const cleanText = stripEmojis(text) || text;
      const utterance = new SpeechSynthesisUtterance(cleanText);
      utterance.lang = 'en-US';

      // Always use Gentle Classroom Teacher voice pace rate & pitch
      const activeRate = options.rate ?? voicePaceRate;
      const activePitch = options.pitch ?? voicePitchLevel;
      utterance.rate = activeRate;
      utterance.pitch = activePitch;

      // Apply voice accent
      const activeVoices = voices.length > 0 ? voices : window.speechSynthesis.getVoices();
      const targetVoiceName = options.voiceName || selectedVoiceName;
      if (activeVoices && activeVoices.length > 0) {
        const foundVoice = activeVoices.find(v => v.name === targetVoiceName) || 
                           activeVoices.find(v => v.lang.startsWith('en')) || 
                           activeVoices[0];
        if (foundVoice) utterance.voice = foundVoice;
      }

      if (options.onStart) utterance.onstart = options.onStart;
      if (options.onEnd) utterance.onend = options.onEnd;

      window.speechSynthesis.speak(utterance);
    }
  };

  // Single Word Click Handler
  const handleWordClick = (word: string, wordIdx: number) => {
    stopAllAudioAndSpeech();
    playAudioChime('pop');
    const normWord = word.toLowerCase().replace(/[.,\/#!$%\^&\*;:{}=\-_`~()]/g, "");
    const hint = PHONETIC_HINTS[normWord];

    speakText(normWord, {
      rate: Math.max(0.50, voicePaceRate * 0.8),
      pitch: voicePitchLevel,
      onStart: () => {
        setGuideCharacter("🗣");
        if (hint) {
          setInteractiveHint(`Isolated guide: ${hint.phonics.toUpperCase()} — ${hint.desc}`);
        } else {
          setInteractiveHint(`Pronouncing: "${word}" slowly...`);
        }
      },
      onEnd: () => {
        setGuideCharacter("🐿");
      }
    });
  };

  // Listen to Target Phrase
  const handlePlayTargetSpeech = () => {
    const phrase = targetPhrases[activePhraseIndex];
    if (!phrase) return;

    stopAllAudioAndSpeech();
    playAudioChime('click');
    setStepBadge('listen');

    speakText(phrase.text, {
      onStart: () => {
        setGuideCharacter("🗣");
        setIsVoicePulseActive(true);
        setInteractiveHint("Listening to Gentle Classroom Teacher...");
      },
      onEnd: () => {
        setGuideCharacter("🐿");
        setIsVoicePulseActive(false);
        setInteractiveHint("Model finished! Great job listening. Now tap 'Say It!' to practice!");
        setTimeout(() => setStepBadge('speak'), 800);
      }
    });
  };

  // Read Aloud Welcomes & Mascot Hints
  const handleReadAloudHomeWelcome = () => {
    playAudioChime('click');
    speakText(`Hello ${childName || 'Student'}! Welcome to your Confi Speak landscape dashboard. Choose a speaking node on the adventure map to grow your confidence tree!`);
  };

  const handleSpeakMascotHint = () => {
    playAudioChime('click');
    speakText(`Yay! ${childName || 'Student'}, try your best to say our target phrase out loud. I'm listening!`);
  };

  // Record or Toggle Speech Recognition
  const handleToggleRecordSpeech = () => {
    if (isRecording) {
      stopRecording();
    } else {
      startRecording();
    }
  };

  const startRecording = () => {
    // STOP all active TTS and coach response audio immediately so it doesn't talk over the 2nd try!
    stopAllAudioAndSpeech();

    if (!recognitionRef.current) {
      setInteractiveHint("⚠ Speech Recognition is not supported by your browser. Use the Classroom Quick Testing Tool to simulate responses!");
      return;
    }

    setIsRecording(true);
    setGuideCharacter("👂");
    setInteractiveHint("Listening... Speak into your microphone now!");
    setStepBadge('speak');

    // Reset previous coach advice text audio state when starting next attempt
    setCoachAdvice(null);
    setEvalResult(null);

    try {
      try {
        recognitionRef.current.stop();
      } catch (e) {}

      setTimeout(() => {
        try {
          recognitionRef.current.start();
        } catch (err) {
          console.warn("STT start error, retrying...", err);
        }
      }, 100);

      recognitionRef.current.onresult = (event: any) => {
        if (speechTimeoutRef.current) clearTimeout(speechTimeoutRef.current);
        const speechResult = event.results[0][0].transcript;
        const confidence = Math.round(event.results[0][0].confidence * 100);
        evaluateSpeechOutput(speechResult, confidence);
      };

      recognitionRef.current.onerror = (event: any) => {
        console.error("STT Error", event);
        stopRecording();
        setInteractiveHint("No speech detected clearly. Tap 'Say It!' to try again!");
      };

      recognitionRef.current.onend = () => {
        stopRecording();
      };

      // 8-second safety timeout for silent mic
      speechTimeoutRef.current = setTimeout(() => {
        stopRecording();
        setInteractiveHint("Microphone timed out. Tap 'Say It!' when ready to speak!");
      }, 8000);
    } catch (err) {
      stopRecording();
    }
  };

  const stopRecording = () => {
    setIsRecording(false);
    if (speechTimeoutRef.current) {
      clearTimeout(speechTimeoutRef.current);
      speechTimeoutRef.current = null;
    }
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch (e) {}
    }
  };

  // Core Evaluation Algorithm
  const evaluateSpeechOutput = (spokenText: string, systemConfidence: number) => {
    const targetObj = targetPhrases[activePhraseIndex];
    if (!targetObj) return;

    const targetNorm = targetObj.text.toLowerCase().replace(/[.,\/#!$%\^&\*;:{}=\-_`~()]/g, "").trim();
    const spokenNorm = spokenText.toLowerCase().replace(/[.,\/#!$%\^&\*;:{}=\-_`~()]/g, "").trim();

    const targetWords = targetNorm.split(/\s+/);
    const spokenWords = spokenNorm.split(/\s+/);

    let matchesCount = 0;
    const newStatuses: ('matched' | 'missed' | 'idle')[] = [];
    const missedWords: string[] = [];

    targetWords.forEach((tWord) => {
      if (spokenWords.includes(tWord)) {
        matchesCount++;
        newStatuses.push('matched');
      } else {
        newStatuses.push('missed');
        missedWords.push(tWord);
      }
    });

    setWordStatuses(newStatuses);

    const accuracyPercent = Math.round((matchesCount / targetWords.length) * 100);

    // Update Debug Stats
    setRawSpeechTranscript(`"${spokenText}"`);
    setStatWordsMatched(`${matchesCount} / ${targetWords.length}`);
    setStatConfidencePercent(`${accuracyPercent}%`);

    // Render Results & AI Guidance
    displayEvaluationResults(accuracyPercent, spokenText);
    triggerAICoachFeedback(missedWords);

    // Auto scroll container
    setTimeout(() => {
      if (scrollContainerRef.current) {
        scrollContainerRef.current.scrollTo({
          top: scrollContainerRef.current.scrollHeight,
          behavior: 'smooth'
        });
      }
    }, 150);
  };

  // Evaluation Card Feedback
  const displayEvaluationResults = (accuracy: number, rawTranscript: string) => {
    const isPassed = accuracy >= passThreshold;
    let headlineText = "Almost there! Try once more.";
    let gradeText = "Needs Practice ⭐";
    let earnedXP = 0;

    if (isPassed) {
      playAudioChime('success');
      if (accuracy >= 90) {
        headlineText = "Superstar! Flawless Native Accent! 🌟";
        gradeText = "Perfect ⭐⭐⭐";
      } else {
        headlineText = "Superb Reading! Keep Going! 🎉";
        gradeText = "Good ⭐⭐";
      }
      earnedXP = 50;
      setUserXP(prev => prev + 50);
      setQuestProgress("1/1");
      setPassedPhraseIndexes(prev => Array.from(new Set([...prev, activePhraseIndex])));
    } else {
      playAudioChime('encourage');
    }

    setEvalResult({
      headline: headlineText,
      grade: gradeText,
      accuracy,
      passed: isPassed,
      heard: rawTranscript,
      xpEarned: earnedXP
    });
  };

  // AI Coach Feedback & Voice Guidance - Pronounce ONLY the wrong word(s)
  const triggerAICoachFeedback = (missedWords: string[]) => {
    const student = childName || "Student";
    if (missedWords.length > 0) {
      const wrongWordsText = missedWords.join(", ");

      setCoachAdvice({
        fullText: wrongWordsText,
        htmlContent: (
          <span>
            Needs practice on:{" "}
            {missedWords.map((w, idx) => {
              const hint = PHONETIC_HINTS[w.toLowerCase()];
              return (
                <span key={idx} className="inline-block mr-2 my-0.5">
                  <b className="text-red-500 underline font-bold">"{w}"</b>
                  {hint && <span className="text-stone-600 text-[10px] ml-1 font-normal">[{hint.phonics}] - {hint.desc}</span>}
                </span>
              );
            })}
          </span>
        )
      });

      setLastCoachMessage(wrongWordsText);
      speakCoachGuidance(wrongWordsText);
    } else {
      const perfectMsg = "Superb! All words correct!";
      setCoachAdvice({
        fullText: perfectMsg,
        htmlContent: (
          <span>
            🏆 <b>Incredible job, {student}!</b> All words pronounced correctly! No wrong words detected.
          </span>
        )
      });
      setLastCoachMessage(perfectMsg);
      speakCoachGuidance(perfectMsg);
    }
  };

  const speakCoachGuidance = (text: string) => {
    speakText(text, {
      onStart: () => {
        setGuideCharacter("🗣");
        setInteractiveHint(`Pronouncing: "${text}"... 🎧`);
      },
      onEnd: () => {
        setGuideCharacter("🐿");
        setInteractiveHint("Tap 'Say It!' for 2nd try or tap any word to practice!");
      }
    });
  };

  const handleRepeatCoachInstruction = () => {
    if (lastCoachMessage) {
      speakCoachGuidance(lastCoachMessage);
    } else {
      speakCoachGuidance("Listen and tap Say It when you are ready!");
    }
  };

  // Simulate Speech Button Handler
  const handleSimulateSpeech = (score: number) => {
    const currentText = targetPhrases[activePhraseIndex]?.text || "Good morning everyone";
    let mockResult = currentText;

    if (score < 50) {
      mockResult = "Good day english learn school teacher";
    } else if (score < 80) {
      mockResult = currentText.replace("English", "Inglish").replace("teacher", "ticher");
    }

    evaluateSpeechOutput(mockResult, score);
    handleSwitchTab('speak');
    setInteractiveHint("Simulation attempt scored successfully!");
  };

  // Phrase editor handlers
  const handlePhraseTextChange = (idx: number, field: 'text' | 'trans', value: string) => {
    setTargetPhrases(prev => {
      const updated = [...prev];
      updated[idx] = { ...updated[idx], [field]: value };
      return updated;
    });
  };

  const handleResetPhrasesDefault = () => {
    setTargetPhrases(DEFAULT_PHRASES);
  };

  // Auto-scroll chat container
  useEffect(() => {
    if (activeTab === 'chat' && chatScrollRef.current) {
      chatScrollRef.current.scrollTop = chatScrollRef.current.scrollHeight;
    }
  }, [chatMessages, activeTab, isChatThinking]);

  const speakWithGeminiVoice = async (textToSpeak: string) => {
    stopAllAudioAndSpeech();
    const cleanText = stripEmojis(textToSpeak) || textToSpeak;
    setGuideCharacter("🗣");
    setIsVoicePulseActive(true);

    try {
      const res = await fetch("/api/tts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: cleanText, voiceName: "Zephyr" })
      });

      if (res.ok) {
        const data = await res.json();
        if (data && data.audio) {
          const audio = new Audio(`data:${data.mimeType || 'audio/wav'};base64,${data.audio}`);
          currentAudioRef.current = audio;
          audio.onended = () => {
            currentAudioRef.current = null;
            setGuideCharacter("🐿");
            setIsVoicePulseActive(false);
          };
          audio.onerror = () => {
            currentAudioRef.current = null;
            speakText(textToSpeak, {
              onStart: () => setIsVoicePulseActive(true),
              onEnd: () => {
                setGuideCharacter("🐿");
                setIsVoicePulseActive(false);
              }
            });
          };
          await audio.play();
          return;
        }
      }
    } catch (e) {
      console.warn("Gemini TTS audio fetch failed, fallback to Web Speech:", e);
    }

    // Default Web Speech API fallback with customized pitch & pace
    speakText(textToSpeak, {
      onStart: () => setIsVoicePulseActive(true),
      onEnd: () => {
        setGuideCharacter("🐿");
        setIsVoicePulseActive(false);
      }
    });
  };

  // AI Chatbot handlers
  const handleSendChatMessage = async (textOverride?: string, scenarioChoiceId?: number) => {
    const textToSend = (textOverride !== undefined ? textOverride : chatInputText).trim();
    if (!textToSend || isChatThinking) return;

    playAudioChime('click');
    const userMsg: ChatMessage = {
      id: `kid-${Date.now()}`,
      sender: 'kid',
      text: textToSend,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    const updatedHistory = [...chatMessages, userMsg];
    setChatMessages(updatedHistory);
    setChatInputText('');
    setIsChatThinking(true);

    try {
      const targetScenarioId = scenarioChoiceId !== undefined ? scenarioChoiceId : activeScenarioId;
      const res = await chatWithKidBuddy(
        textToSend,
        updatedHistory,
        childName,
        buddyName,
        studentAvatar,
        targetScenarioId
      );
      
      const aiReplyText = res.reply;
      setActiveScenarioId(res.scenarioId !== undefined ? res.scenarioId : null);

      const aiMsg: ChatMessage = {
        id: `ai-${Date.now()}`,
        sender: 'ai',
        text: aiReplyText,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };

      setChatMessages(prev => [...prev, aiMsg]);
      setIsChatThinking(false);

      // Speak response out loud using Gemini Voice or customized kids voice!
      speakWithGeminiVoice(aiReplyText);

      // Award +10 XP for active speaking practice in chat
      setUserXP(prev => prev + 10);
      playAudioChime('success');
    } catch (e) {
      setIsChatThinking(false);
    }
  };

  const handleToggleChatMic = () => {
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      alert("Speech recognition is not supported in this browser. You can type your message below!");
      return;
    }

    if (isChatMicActive) {
      setIsChatMicActive(false);
      return;
    }

    try {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      const recog = new SpeechRecognition();
      recog.continuous = false;
      recog.interimResults = false;
      recog.lang = 'en-US';

      recog.onstart = () => {
        setIsChatMicActive(true);
        playAudioChime('pop');
      };

      recog.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        if (transcript) {
          setChatInputText(transcript);
          handleSendChatMessage(transcript);
        }
        setIsChatMicActive(false);
      };

      recog.onerror = () => {
        setIsChatMicActive(false);
      };

      recog.onend = () => {
        setIsChatMicActive(false);
      };

      recog.start();
    } catch (err) {
      setIsChatMicActive(false);
    }
  };

  const currentPhrase = targetPhrases[activePhraseIndex] || DEFAULT_PHRASES[0];

  if (!hasEnteredApp) {
    return (
      <div 
        className="bg-[#1B2E1E] text-[#2C3E2F] font-sans antialiased min-h-screen flex flex-col items-center justify-center p-4 sm:p-6 relative overflow-hidden select-none bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: `url(${entranceForestBg})` }}
      >
        {/* Soft dark forest backdrop overlay for contrast and depth */}
        <div className="absolute inset-0 bg-gradient-to-b from-[#112414]/70 via-[#1B2E1E]/40 to-[#0d1c0f]/80 backdrop-blur-[1px]"></div>

        {/* Decorative Cute Animal Badges around Entrance Screen (matching reference image animals) */}
        <div className="hidden lg:flex absolute top-6 left-8 items-center gap-2 bg-white px-4 py-2 rounded-full border-2 border-amber-400 shadow-lg text-stone-950 z-10">
          <span className="text-2xl">🦉</span>
          <div className="text-left">
            <p className="text-[10px] font-black uppercase tracking-wider text-amber-900 leading-none">Wise Owl</p>
            <p className="text-xs font-baloo font-extrabold text-stone-900">"Listen & Learn!"</p>
          </div>
        </div>

        <div className="hidden lg:flex absolute top-6 right-8 items-center gap-2 bg-white px-4 py-2 rounded-full border-2 border-emerald-500 shadow-lg text-stone-950 z-10">
          <span className="text-2xl">🐿️</span>
          <div className="text-left">
            <p className="text-[10px] font-black uppercase tracking-wider text-emerald-900 leading-none">Tupai Squirrel</p>
            <p className="text-xs font-baloo font-extrabold text-stone-900">"Welcome Friend!"</p>
          </div>
        </div>

        <div className="hidden md:flex absolute bottom-8 left-8 items-center gap-3 bg-white px-4 py-2.5 rounded-2xl border-2 border-orange-400 shadow-lg text-stone-950 z-10">
          <span className="text-3xl">🦊</span>
          <span className="text-2xl">🦔</span>
          <div className="text-left">
            <p className="text-[10px] font-black uppercase tracking-wider text-orange-900 leading-none">Forest Buddies</p>
            <p className="text-xs font-baloo font-extrabold text-stone-900">Foxy & Hedgie</p>
          </div>
        </div>

        <div className="hidden md:flex absolute bottom-8 right-8 items-center gap-3 bg-white px-4 py-2.5 rounded-2xl border-2 border-amber-400 shadow-lg text-stone-950 z-10">
          <span className="text-3xl">🐻</span>
          <span className="text-2xl">🦝</span>
          <div className="text-left">
            <p className="text-[10px] font-black uppercase tracking-wider text-amber-900 leading-none">Woodland Friends</p>
            <p className="text-xs font-baloo font-extrabold text-stone-900">Bear & Raccoon</p>
          </div>
        </div>

        {/* Entrance Welcome Card */}
        <div className="w-full max-w-lg bg-[#FAF8F2]/95 backdrop-blur-md rounded-[36px] p-6 sm:p-8 shadow-[0_25px_60px_-15px_rgba(0,0,0,0.6)] border-4 border-emerald-700/50 relative z-20 flex flex-col items-center text-center">
          
          {/* App Logo & Badge */}
          <div className="inline-flex items-center gap-2 bg-emerald-100/90 text-forestGreen px-4 py-1.5 rounded-full border border-emerald-300/80 mb-4 shadow-xs">
            <span className="text-base">🎙️</span>
            <span className="text-xs font-baloo font-extrabold uppercase tracking-widest">Primary ESL Speaking App</span>
          </div>

          <h1 className="font-baloo text-3xl sm:text-4xl font-extrabold text-forestGreen tracking-tight leading-none mb-1">
            Voice Up
          </h1>
          <p className="text-stone-600 text-xs sm:text-sm font-semibold mb-6">
            Welcome to your AI English Speaking & Pronunciation Adventure!
          </p>

          {/* Mascot Card */}
          <div className={`w-full p-4 sm:p-4.5 rounded-2xl border-2 flex items-center gap-3.5 mb-6 text-left transition-all duration-300 ${
            isIntroReading
              ? 'bg-gradient-to-br from-amber-50 via-yellow-50/95 to-emerald-50/80 border-emerald-500 ring-4 ring-emerald-400/30 shadow-lg scale-[1.01]'
              : 'bg-gradient-to-br from-amber-50 to-orange-50/90 border-amber-200/90 hover:border-amber-300 shadow-xs'
          }`}>
            <div className={`w-14 h-14 rounded-2xl border-2 flex items-center justify-center text-3xl shrink-0 relative transition-transform ${
              isIntroReading ? 'bg-amber-300 border-emerald-500 scale-105 shadow-md animate-pulse' : 'bg-sunshineYellow border-amber-400 shadow-sm'
            }`}>
              {studentAvatar}
              <span className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-white ${isIntroReading ? 'bg-emerald-500 animate-ping' : 'bg-emerald-500'}`}></span>
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex justify-between items-center mb-1 gap-2">
                <span className="font-baloo font-extrabold text-xs text-amber-900 uppercase tracking-wide truncate">
                  {AVATAR_BUDDY_MAPPING[studentAvatar]?.title || `${buddyName} the AI Buddy`}
                </span>
                <button
                  type="button"
                  onClick={() => playIntroductoryText()}
                  className={`text-xs font-baloo font-extrabold px-3 py-1 rounded-xl transition-all cursor-pointer flex items-center gap-1.5 shadow-2xs active:scale-95 flex-shrink-0 ${
                    isIntroReading
                      ? 'bg-emerald-600 hover:bg-emerald-700 text-white border border-emerald-700 ring-2 ring-emerald-300'
                      : 'bg-amber-200/80 hover:bg-amber-300 text-amber-950 border border-amber-300/80'
                  }`}
                  title={isIntroReading ? "Click to stop auto-reading" : "Click to auto-read introductory text"}
                >
                  {isIntroReading ? (
                    <>
                      <span className="inline-block animate-pulse">🔊</span>
                      <span>Reading...</span>
                    </>
                  ) : (
                    <>
                      <span>🔊</span>
                      <span>Auto-Read</span>
                    </>
                  )}
                </button>
              </div>
              <p className={`text-xs sm:text-[13px] font-semibold leading-relaxed transition-all duration-300 ${
                isIntroReading
                  ? 'text-stone-950 bg-amber-100/80 px-2.5 py-1.5 rounded-xl border border-amber-300/70 shadow-2xs'
                  : 'text-stone-700'
              }`}>
                "Hi there! I'm <strong className="text-amber-900 font-extrabold">{buddyName}</strong>! Welcome to <strong className="text-forestGreen font-extrabold">Voice Up</strong>! Choose your buddy avatar below."
              </p>
            </div>
          </div>

          {/* Student Name Insertion Form */}
          <form onSubmit={handleEnterApp} className="w-full space-y-5">
            <div className="text-left space-y-1.5">
              <label className="block text-xs font-baloo font-extrabold text-stone-700 uppercase tracking-wider">
                1. Insert Your Name:
              </label>
              <input
                type="text"
                value={entryStudentName}
                onChange={(e) => setEntryStudentName(e.target.value)}
                placeholder="Enter student name (e.g. Aiman, Sarah...)"
                className="w-full text-center font-baloo text-xl font-bold px-4 py-3 bg-white border-2 border-forestGreen/40 rounded-2xl focus:border-forestGreen focus:ring-4 focus:ring-forestGreen/20 outline-none text-forestGreen shadow-inner placeholder:text-stone-300 placeholder:font-normal placeholder:text-base"
                maxLength={20}
                required
                autoFocus
              />
            </div>

            {/* Avatar Selector */}
            <div className="text-left space-y-1.5">
              <label className="block text-xs font-baloo font-extrabold text-stone-700 uppercase tracking-wider flex justify-between items-center">
                <span>2. Choose Your Buddy Avatar:</span>
                <span className="text-forestGreen font-extrabold text-[11px] bg-emerald-100/90 px-2.5 py-0.5 rounded-full border border-emerald-300">
                  {studentAvatar} {buddyName}
                </span>
              </label>
              <div className="flex justify-between gap-2 bg-stone-100 p-2 rounded-2xl border border-stone-200">
                {['🐿️', '🦁', '🐼', '🦊', '🦉', '🚀'].map((avatar) => (
                  <button
                    key={avatar}
                    type="button"
                    onClick={() => handleSelectAvatar(avatar)}
                    className={`flex-1 py-2 rounded-xl text-2xl flex items-center justify-center transition-all cursor-pointer ${studentAvatar === avatar ? 'bg-sunshineYellow border-2 border-amber-400 scale-105 shadow-sm ring-2 ring-yellow-300 font-bold' : 'hover:bg-white/60 opacity-80 hover:opacity-100'}`}
                    title={`Select ${AVATAR_BUDDY_MAPPING[avatar]?.name || 'Buddy'}`}
                  >
                    {avatar}
                  </button>
                ))}
              </div>
            </div>

            {/* Enter Button */}
            <button
              type="submit"
              className="w-full py-4 px-6 bg-gradient-to-r from-forestGreen via-[#2E7D32] to-[#1B5E20] hover:brightness-110 text-sunshineYellow font-baloo font-extrabold text-lg sm:text-xl rounded-2xl shadow-xl flex items-center justify-center gap-2 border-2 border-emerald-400/30 active:scale-95 transition-all cursor-pointer"
            >
              <span>Enter Voice Up</span> 🚀
            </button>
          </form>

          <p className="text-[11px] text-stone-400 font-medium mt-5">
            🔒 Safe for classroom practice • Powered by Gemini AI Voice & Web Speech
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-[#F0EDE4] text-[#2C3E2F] font-sans antialiased min-h-screen flex flex-col">
      {/* HEADER */}
      <header className="bg-gradient-to-r from-forestGreen to-[#1B5E20] text-creamWhite py-4 px-6 md:px-12 flex flex-col md:flex-row justify-between items-center shadow-md z-30">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 bg-sunshineYellow rounded-2xl flex items-center justify-center shadow-lg relative transform hover:rotate-12 transition-transform cursor-pointer">
            <svg className="w-7 h-7 text-[#1B5E20]" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M19.114 5.636a9 9 0 010 12.728M16.463 8.288a5.25 5.25 0 010 7.424M6.75 8.25l4.72-4.72a.75.75 0 011.28.53v15.88a.75.75 0 01-1.28.53l-4.72-4.72H4.51c-.88 0-1.704-.507-1.938-1.354A9.01 9.01 0 012.25 12c0-.83.112-1.633.322-2.396C2.806 8.756 3.63 8.25 4.51 8.25H6.75z" />
            </svg>
            <span className="absolute -top-1 -right-1 w-3 h-3 bg-coral rounded-full animate-ping"></span>
          </div>
          <div>
            <h1 className="font-baloo text-2xl sm:text-3xl tracking-wide font-black text-sunshineYellow drop-shadow-sm flex flex-wrap items-center gap-2">
              VOICE UP <span className="bg-gradient-to-r from-amber-400 via-orange-400 to-amber-500 text-stone-950 text-[10px] sm:text-[11px] font-sans font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full shadow-xs border border-amber-200/60 inline-flex items-center gap-1">✨ Smart Adaptive Practice</span>
            </h1>
            <p className="text-xs sm:text-sm text-emerald-100/90 font-semibold tracking-wide mt-0.5">Guided Landscape Listen-and-Repeat Engine for Primary Classrooms</p>
          </div>
        </div>
        <div className="flex items-center gap-3 mt-3 md:mt-0">
          <button
            onClick={() => {
              playAudioChime('click');
              setHasEnteredApp(false);
            }}
            className="bg-white/10 hover:bg-white/20 text-creamWhite font-baloo font-bold text-xs px-3 py-1.5 rounded-full border border-white/20 transition-all cursor-pointer flex items-center gap-1.5"
            title="Switch student or return to welcome entrance"
          >
            <span>{studentAvatar}</span>
            <span>{childName}</span>
            <span className="text-[10px] text-emerald-200">✎</span>
          </button>
          <button
            onClick={() => {
              playAudioChime('click');
              setIsSettingsOpen(true);
            }}
            className="bg-sunshineYellow hover:brightness-105 text-forestGreen font-baloo font-extrabold text-xs sm:text-sm px-3.5 sm:px-4 py-1.5 sm:py-2 rounded-full shadow-lg flex items-center gap-1.5 border-2 border-yellow-300 active:scale-95 transition-all cursor-pointer"
            title="Open Classroom & Voice Settings"
          >
            <span className="text-base">⚙</span> Settings
          </button>
        </div>
      </header>

      {/* MAIN CONTENT AREA */}
      <main className="flex-1 flex flex-col w-full max-w-7xl mx-auto px-4 py-4 sm:px-6 sm:py-6">
        <div className="bg-creamWhite rounded-3xl border-2 border-[#1B5E20]/20 shadow-xl overflow-hidden flex-1 flex flex-col relative select-none min-h-[600px]">
          {/* SCROLLABLE APP CONTENT AREA */}
          <div ref={scrollContainerRef} className="flex-1 overflow-y-auto pb-24 relative bg-warmBeige/40 scroll-smooth">
                
                {/* TAB 1: HOME SCREEN */}
                {activeTab === 'home' && (
                  <div className="animate-in fade-in duration-200">
                    <div className="p-5 sm:p-6 bg-gradient-to-b from-[#E8F5E9] to-creamWhite/10 rounded-b-[28px] border-b border-forestGreen/10 relative overflow-hidden">
                      <div className="absolute -right-6 -top-6 w-36 h-36 bg-sunshineYellow/20 rounded-full blur-2xl"></div>
                      <div className="flex justify-between items-center relative z-10">
                        <div className="flex items-center gap-3">
                          <div className="relative w-12 h-12 flex items-center justify-center">
                            <div className="absolute inset-0 bg-sunshineYellow rounded-full blur-sm opacity-60 animate-ping"></div>
                            <div className="w-10 h-10 bg-sunshineYellow rounded-full flex items-center justify-center shadow-md">
                              <span className="text-xl">☀</span>
                            </div>
                          </div>
                          <div>
                            <p className="text-xs text-[#2E7D32] font-extrabold uppercase tracking-wider">Selamat Pagi!</p>
                            <h3 className="font-baloo text-xl sm:text-2xl font-extrabold text-[#1B5E20]">Good Morning, {childName}!</h3>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <button onClick={handleReadAloudHomeWelcome} className="w-10 h-10 rounded-full bg-white flex items-center justify-center shadow-sm border border-stone-200 text-stone-700 text-base hover:scale-110 active:scale-95 transition-transform cursor-pointer" title="Hear guide">
                            🔊
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Home Split Container */}
                    <div className="p-4 sm:p-6 grid grid-cols-1 md:grid-cols-12 gap-5 sm:gap-6">
                      {/* Interactive Confidence Growth Tree */}
                      <div className="col-span-1 md:col-span-5 bg-white p-5 sm:p-6 rounded-3xl border-2 border-[#E6E1D5] shadow-md relative overflow-hidden flex flex-col justify-between min-h-[280px]">
                        <div className="flex justify-between items-center">
                          <span className="text-xs sm:text-sm bg-emerald/15 text-forestGreen font-extrabold px-3 py-1 rounded-full uppercase tracking-wider">Confidence Tree</span>
                          <span className="text-xs sm:text-sm font-extrabold text-[#29B6F6]">{getLevelTitle(userXP)}</span>
                        </div>
                        <div className="flex items-center gap-4 my-3">
                          {/* Interactive SVG tree structure */}
                          <div className="flex-shrink-0 flex flex-col items-center justify-center relative bg-gradient-to-b from-skyBlue/5 to-emerald/5 rounded-2xl px-3.5 py-2.5 border border-stone-100">
                            <svg id="confidence-tree-svg" className="w-24 h-28 sm:w-28 sm:h-32 transform transition-all duration-700" viewBox="0 0 100 120">
                              <path d="M50 110 L50 40" stroke="#8D6E63" strokeWidth="9" strokeLinecap="round" />
                              <path d="M50 80 L35 65" stroke="#8D6E63" strokeWidth="6" strokeLinecap="round" />
                              <path d="M50 70 L65 55" stroke="#8D6E63" strokeWidth="6" strokeLinecap="round" />
                              <circle id="tree-foliage-left" cx="30" cy="55" r={17 * treeScaleFactor} fill="#43A047" opacity="0.9" className="transition-all duration-500 animate-sway" />
                              <circle id="tree-foliage-right" cx="70" cy="50" r={15 * treeScaleFactor} fill="#2E7D32" opacity="0.95" className="transition-all duration-500" />
                              <circle id="tree-foliage-top" cx="50" cy="35" r={23 * treeScaleFactor} fill="#66BB6A" opacity="0.9" className="transition-all duration-500" />
                              {/* Dynamic Fruits / Blossoms */}
                              {userXP >= 200 && <circle cx="45" cy="40" r="5" fill="#FF7043" className="transition-all duration-500" />}
                              {userXP >= 300 && <circle cx="32" cy="58" r="5" fill="#FFA726" className="transition-all duration-500" />}
                              {userXP >= 450 && <circle cx="65" cy="46" r="5.5" fill="#FFD54F" className="transition-all duration-500" />}
                              <ellipse cx="50" cy="112" rx="38" ry="7" fill="#81C784" />
                            </svg>
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-baseline gap-1.5">
                              <span className="text-3xl sm:text-4xl font-baloo font-extrabold text-forestGreen">{userXP}</span>
                              <span className="text-sm font-bold text-stone-400">/ 500 XP</span>
                            </div>
                            <p className="text-xs sm:text-sm font-bold text-stone-700 truncate mt-1">{childName}'s Forest is flourishing!</p>
                            <div className="w-full bg-stone-100 h-3.5 sm:h-4 rounded-full overflow-hidden mt-2 border border-stone-200">
                              <div className="bg-gradient-to-r from-emerald to-skyBlue h-full transition-all duration-700" style={{ width: `${xpPercentage}%` }}></div>
                            </div>
                          </div>
                        </div>
                        <button onClick={() => handleSwitchTab('speak')} className="w-full bg-gradient-to-r from-emerald to-forestGreen text-white text-xs sm:text-sm font-baloo tracking-wider py-3 px-4 rounded-2xl uppercase hover:brightness-105 active:scale-95 transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer mt-1">
                          <span className="text-base">🎤</span> Practice Speaking Lesson
                        </button>
                      </div>

                      {/* Right side / Mobile lower section: Daily Missions & Mascot speech bubble */}
                      <div className="col-span-1 md:col-span-7 space-y-4 sm:space-y-5 flex flex-col justify-between">
                        {/* Daily Practice Mission */}
                        <div className="bg-white p-4 sm:p-5 rounded-2xl sm:rounded-3xl border-2 border-stone-200/80 flex justify-between items-center shadow-sm hover:shadow-md transition-shadow">
                          <div className="flex items-center gap-3">
                            <div className="w-12 h-12 rounded-2xl bg-orangeAccent/15 flex items-center justify-center text-2xl shrink-0">🎤</div>
                            <div>
                              <p className="text-xs sm:text-sm font-extrabold text-stone-800">Practice: "{currentPhrase.text.substring(0, 26)}..."</p>
                              <span className="text-xs text-stone-500 font-bold">Reward: +50 XP on Passing</span>
                            </div>
                          </div>
                          <div className="flex items-center gap-2 bg-amber-50 px-3 py-1.5 rounded-xl border border-amber-200">
                            <span className="text-xs sm:text-sm font-extrabold text-[#FFA726]">{questProgress}</span>
                            <div className="w-5 h-5 rounded-full border border-orangeAccent flex items-center justify-center text-xs">🔥</div>
                          </div>
                        </div>

                        {/* Forest Mascot speech guideline */}
                        <div className="bg-white p-5 sm:p-6 rounded-2xl sm:rounded-3xl border-2 border-[#E6E1D5] shadow-md relative flex-1 flex flex-col justify-between space-y-3">
                          <div className="flex items-start gap-3.5">
                            <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-orange-100 flex-shrink-0 flex items-center justify-center overflow-hidden border-2 border-orange-200 text-3xl sm:text-4xl shadow-xs">
                              <span className="animate-sway block">{studentAvatar}</span>
                            </div>
                            <div className="flex-1 min-w-0">
                              <span className="text-xs sm:text-sm font-extrabold tracking-widest text-[#FFA726] uppercase">{buddyName} says:</span>
                              <p className="text-sm sm:text-base font-semibold text-stone-700 italic mt-1 leading-relaxed">
                                "{childName}, try your best to say our target phrase out loud. I'm listening!"
                              </p>
                            </div>
                          </div>
                          <button onClick={handleSpeakMascotHint} className="text-xs sm:text-sm font-extrabold text-forestGreen bg-[#E8F5E9] hover:bg-emerald-100 px-4 py-2 rounded-xl flex items-center gap-2 border border-emerald-300/60 shadow-xs active:scale-95 transition-all w-fit cursor-pointer mt-1">
                            <span className="text-base">🔊</span> Let {buddyName} Read Aloud
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* TAB 2: LEARN ADVENTURE MAP */}
                {activeTab === 'learn' && (
                  <div className="h-full flex flex-col animate-in fade-in duration-200">
                    <div className="p-3 bg-gradient-to-b from-[#E8F5E9] to-creamWhite flex justify-between items-center border-b border-forestGreen/10">
                      <div>
                        <span className="text-[8px] font-extrabold uppercase bg-emerald/10 text-forestGreen px-2 py-0.5 rounded-full">Adventure Pathway</span>
                        <h4 className="font-baloo text-base font-extrabold text-stone-800">Primary ESL Rainforest Levels</h4>
                      </div>
                      <div className="bg-white px-2.5 py-1 rounded-full border border-stone-200 text-[10px] font-bold text-stone-600 flex items-center gap-1.5 shadow-xs">
                        <span>🏞 Chapter 1:</span>
                        <span className="text-forestGreen font-extrabold">{targetPhrases.length} Interactive Levels</span>
                      </div>
                    </div>

                    {/* Horizontal scroll window */}
                    <div className="flex-1 overflow-x-auto relative bg-gradient-to-b from-[#C8E6C9] via-[#E8F5E9] to-warmBeige/40 py-6 px-6 min-h-[360px]">
                      <div
                        className="relative h-[310px] transition-all"
                        style={{ width: `${Math.max(1050, targetPhrases.length * 200 + 100)}px` }}
                      >
                        <svg className="absolute inset-0 w-full h-full pointer-events-none" xmlns="http://www.w3.org/2000/svg">
                          <path
                            d={targetPhrases.map((_, i) => {
                              const x = 90 + i * 190;
                              const y = i % 2 === 0 ? 110 : 200;
                              return `${i === 0 ? 'M' : 'L'} ${x} ${y}`;
                            }).join(' ')}
                            fill="none"
                            stroke="#D7CCC8"
                            strokeWidth="12"
                            strokeDasharray="10 8"
                            strokeLinecap="round"
                          />
                          <path
                            d={targetPhrases.map((_, i) => {
                              const x = 90 + i * 190;
                              const y = i % 2 === 0 ? 110 : 200;
                              return `${i === 0 ? 'M' : 'L'} ${x} ${y}`;
                            }).join(' ')}
                            fill="none"
                            stroke="#A1887F"
                            strokeWidth="6"
                            strokeLinecap="round"
                          />
                        </svg>

                        {targetPhrases.map((phrase, idx) => {
                          const isPassed = passedPhraseIndexes.includes(idx);
                          const isActive = idx === activePhraseIndex;
                          const x = 90 + idx * 190;
                          const y = idx % 2 === 0 ? 70 : 160;

                          const levelMeta = [
                            { title: 'Kampung Gate', icon: '🛖', desc: 'Warm greetings with teacher and friends!' },
                            { title: 'Forest Friends', icon: '🏡', desc: 'Practice classroom morning phrases!' },
                            { title: 'Bamboo Bridge', icon: '🌉', desc: 'Ask politely for reading help!' },
                            { title: 'Waterfall Cave', icon: '🏞', desc: 'Fun classroom activity phrases!' },
                            { title: 'Rainbow Meadow', icon: '🌸', desc: 'Expressing gratitude and joy!' },
                            { title: 'Eco Treehouse', icon: '🏰', desc: 'Superstar English confidence!' }
                          ][idx % 6];

                          return (
                            <div
                              key={`map-node-${idx}`}
                              className="absolute flex flex-col items-center cursor-pointer group transition-transform hover:scale-105"
                              style={{ left: `${x - 40}px`, top: `${y}px` }}
                              onClick={() => {
                                playAudioChime('click');
                                setLessonModal({
                                  title: `Level ${idx + 1}: ${levelMeta.title}`,
                                  desc: levelMeta.desc,
                                  isPassed,
                                  icon: levelMeta.icon,
                                  idx
                                });
                              }}
                            >
                              {isPassed ? (
                                <div className="bg-emerald text-white text-[9px] font-extrabold px-2 py-0.5 rounded-full shadow-xs mb-1 flex items-center gap-1">
                                  <span>✓ Passed</span>
                                  <span>⭐</span>
                                </div>
                              ) : isActive ? (
                                <div className="bg-coral text-white text-[9px] font-extrabold px-2 py-0.5 rounded-full shadow-md animate-bounce mb-1 uppercase tracking-wider">
                                  ★ Active Level ★
                                </div>
                              ) : (
                                <div className="bg-amber-500 text-white text-[9px] font-extrabold px-2 py-0.5 rounded-full shadow-xs mb-1">
                                  Level {idx + 1}
                                </div>
                              )}

                              {isActive && (
                                <div className="absolute inset-0 rounded-full bg-sunshineYellow/40 scale-125 animate-ping opacity-60 pointer-events-none"></div>
                              )}

                              <div className={`w-16 h-16 rounded-2xl border-4 flex items-center justify-center text-2xl shadow-lg transition-all relative z-10 ${
                                isPassed
                                  ? 'bg-gradient-to-tr from-[#E8F5E9] to-forestGreen border-white text-white'
                                  : isActive
                                  ? 'bg-gradient-to-tr from-sunshineYellow to-orangeAccent border-white text-white ring-4 ring-orange-300'
                                  : 'bg-gradient-to-tr from-amber-100 to-amber-300 border-white text-amber-900'
                              }`}>
                                {levelMeta.icon}
                              </div>

                              <span className="text-[10px] font-extrabold text-stone-700 mt-1.5 bg-white/95 px-2.5 py-0.5 rounded-full border border-stone-200/80 shadow-xs relative z-10 text-center whitespace-nowrap">
                                L{idx + 1}: {levelMeta.title}
                              </span>
                            </div>
                          );
                        })}
                      </div>

                      {/* Floating Lesson Context Modal */}
                      {lessonModal && (
                        <div className="absolute bottom-4 left-4 right-4 bg-white/95 backdrop-blur-md rounded-2xl p-4 border-2 border-orangeAccent shadow-2xl z-30 transition-all max-w-md mx-auto">
                          <div className="flex justify-between items-start">
                            <div className="flex items-center gap-3">
                              <span className="text-3xl bg-amber-100 p-2 rounded-2xl border border-amber-200">{lessonModal.icon}</span>
                              <div>
                                <span className="text-[9px] font-extrabold uppercase bg-orangeAccent/10 text-orangeAccent px-2 py-0.5 rounded-full">
                                  Classroom Speaking Level
                                </span>
                                <h5 className="text-sm font-baloo font-extrabold text-stone-800">{lessonModal.title}</h5>
                                <p className="text-xs text-stone-500">{lessonModal.desc}</p>
                              </div>
                            </div>
                            <button
                              onClick={() => setLessonModal(null)}
                              className="text-stone-400 font-extrabold hover:text-stone-600 text-sm bg-stone-100 w-6 h-6 rounded-full flex items-center justify-center cursor-pointer"
                            >
                              ✕
                            </button>
                          </div>

                          <div className="mt-3 p-2.5 bg-stone-50 rounded-xl border border-stone-200 text-xs">
                            <p className="font-extrabold text-forestGreen">🎯 Level Target Phrase:</p>
                            <p className="font-bold text-stone-800 italic">"{targetPhrases[lessonModal.idx]?.text}"</p>
                            <p className="text-[10px] text-stone-500 mt-0.5">{targetPhrases[lessonModal.idx]?.trans}</p>
                          </div>

                          <div className="mt-3 flex gap-2">
                            <button
                              onClick={() => {
                                playAudioChime('click');
                                stopAllAudioAndSpeech();
                                setActivePhraseIndex(lessonModal.idx);
                                handleSwitchTab('speak');
                                setLessonModal(null);
                              }}
                              className="flex-1 bg-gradient-to-r from-orangeAccent to-coral text-white font-baloo py-2 rounded-xl text-xs font-extrabold text-center uppercase tracking-wider soft-3d-button-orange cursor-pointer shadow-md"
                            >
                              ▶ Play Level {lessonModal.idx + 1} Practice ➔
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* TAB 3: SPEAK SCREEN */}
                {activeTab === 'speak' && (
                  <div className="min-h-full flex flex-col animate-in fade-in duration-200">
                    <div className="p-3 bg-gradient-to-b from-[#E0F7FA] to-creamWhite border-b border-stone-200/50 flex flex-wrap justify-between items-center gap-2">
                      <div>
                        <span className="text-[8px] font-extrabold bg-[#29B6F6]/15 text-[#0288D1] px-2.5 py-0.5 rounded-full uppercase tracking-wider">Live Speech Evaluator</span>
                        <h4 className="font-baloo text-base font-extrabold text-stone-800">Speaking Studio</h4>
                      </div>

                      {/* Gentle Classroom Teacher Voice Badge */}
                      <div className="flex items-center gap-1.5 bg-emerald-50 px-3 py-1 rounded-xl border border-emerald-200 shadow-xs">
                        <span className="text-xs">👩‍🏫</span>
                        <span className="text-xs font-baloo font-extrabold text-forestGreen">Gentle Classroom Teacher Voice</span>
                        <span className="text-[10px] text-stone-500 font-bold">(0.88x speed)</span>
                      </div>

                      <div className="bg-[#E0F2F1] rounded-xl p-1 border border-teal-200 flex items-center text-[10px] gap-2">
                        <div className={`py-1 px-2.5 rounded-lg font-bold transition-all duration-300 ${stepBadge === 'listen' ? 'bg-[#2E7D32] text-white shadow-sm' : 'bg-white text-stone-500'}`}>
                          <span>1. Listen 👩‍🏫</span>
                        </div>
                        <span className="text-stone-400">➔</span>
                        <div className={`py-1 px-2.5 rounded-lg font-bold transition-all duration-300 ${stepBadge === 'speak' ? 'bg-coral text-white shadow-sm' : 'bg-white text-stone-500'}`}>
                          <span>2. Speak 🎤</span>
                        </div>
                      </div>
                    </div>

                    {/* Landscape split for tablet optimization */}
                    <div className="flex-1 grid grid-cols-12 gap-3 p-3 min-h-[330px]">
                      {/* Left Column: Sentence Target & Analysis outputs */}
                      <div className="col-span-7 flex flex-col justify-between space-y-2">
                        <div className="bg-white p-3 rounded-2xl border-2 border-[#E6E1D5] shadow-sm relative text-center flex flex-col justify-between flex-1">
                          <div className="flex justify-between items-center px-1 mb-1">
                            <button onClick={() => handleNavigatePhrase(-1)} className="w-6 h-6 rounded-full bg-stone-100 flex items-center justify-center text-xs font-bold text-stone-600 hover:bg-stone-200 transition-colors">◀</button>
                            <div className="flex flex-col items-center">
                              <span className="text-[8px] font-extrabold text-stone-400 uppercase tracking-widest">Sentence {activePhraseIndex + 1} of {targetPhrases.length}</span>
                              <span className="text-[8px] text-[#29B6F6] font-bold mt-0.5">💡 Tap any word below to hear how it sounds!</span>
                            </div>
                            <button onClick={() => handleNavigatePhrase(1)} className="w-6 h-6 rounded-full bg-stone-100 flex items-center justify-center text-xs font-bold text-stone-600 hover:bg-stone-200 transition-colors">▶</button>
                          </div>

                          {/* Interactive word visual block */}
                          <div className="flex flex-wrap gap-2 justify-center my-2 max-h-[80px] overflow-y-auto py-1">
                            {currentPhrase.text.split(' ').map((word, wordIdx) => {
                              const status = wordStatuses[wordIdx];
                              let styleClasses = "px-3 py-1 bg-[#F5F1E8] text-stone-700 font-baloo text-base font-extrabold rounded-xl border border-stone-300 shadow-sm cursor-pointer hover:bg-stone-200 hover:scale-105 transition-all";

                              if (status === 'matched') {
                                styleClasses = "px-3 py-1 bg-emerald text-white font-baloo text-base font-extrabold rounded-xl border-2 border-green-600 shadow-md transform scale-105 transition-all cursor-pointer";
                              } else if (status === 'missed') {
                                styleClasses = "px-3 py-1 bg-red-100 text-red-500 font-baloo text-base font-extrabold rounded-xl border-2 border-red-300 shadow-inner transition-all cursor-pointer hover:bg-red-200";
                              }

                              return (
                                <span
                                  key={wordIdx}
                                  className={styleClasses}
                                  title="Tap to hear this word isolated!"
                                  onClick={() => handleWordClick(word, wordIdx)}
                                >
                                  {word}
                                </span>
                              );
                            })}
                          </div>

                          <div className="bg-stone-50 p-1.5 rounded-xl border border-stone-200 inline-flex items-center justify-center gap-1.5 mt-1">
                            <span className="text-[9px] text-stone-400 font-bold">Malay:</span>
                            <span className="text-[11px] font-extrabold text-[#795548] italic">{currentPhrase.trans}</span>
                          </div>
                        </div>

                        {/* AI Coach Voice Guidance Card */}
                        {coachAdvice && (
                          <div className="bg-gradient-to-tr from-amber-50 to-amber-100/50 p-3 rounded-2xl border-2 border-orangeAccent/40 shadow-sm space-y-2">
                            <div className="flex items-start gap-2.5">
                              <div className="w-8 h-8 rounded-full bg-orangeAccent text-white flex-shrink-0 flex items-center justify-center text-base animate-bounce">💡</div>
                              <div className="flex-1 min-w-0">
                                <div className="flex justify-between items-center">
                                  <h5 className="text-xs font-extrabold text-[#E65100]">AI Pronunciation Coach Advice</h5>
                                  <span className="text-[9px] font-extrabold bg-orange-100 text-orangeAccent px-2 py-0.5 rounded-full uppercase">Practice Tip</span>
                                </div>
                                <p className="text-[11px] text-stone-700 font-medium leading-tight mt-0.5">
                                  {coachAdvice.htmlContent}
                                </p>
                                <button onClick={handleRepeatCoachInstruction} className="mt-1.5 text-[9px] font-extrabold text-[#E65100] bg-white border border-orangeAccent/20 px-2 py-0.5 rounded flex items-center gap-1 hover:bg-orange-50 transition-colors">
                                  🗣 Hear Coach Instructions Again
                                </button>
                              </div>
                            </div>
                          </div>
                        )}

                        {/* Success / Evaluation Overlay */}
                        {evalResult && (
                          <div className={`p-3 rounded-2xl border-2 shadow-sm space-y-2 ${evalResult.passed ? 'bg-gradient-to-tr from-[#E8F5E9] to-creamWhite border-emerald' : 'bg-gradient-to-tr from-[#FFF3E0] to-creamWhite border-orangeAccent'}`}>
                            <div className="flex items-center gap-2">
                              <div className={`w-8 h-8 rounded-full text-white flex items-center justify-center text-sm ${evalResult.passed ? 'bg-emerald' : 'bg-orangeAccent'}`}>
                                {evalResult.passed ? '🎉' : '💪'}
                              </div>
                              <div className="flex-1">
                                <div className="flex justify-between items-center">
                                  <h5 className={`text-xs font-extrabold ${evalResult.passed ? 'text-[#1B5E20]' : 'text-[#E65100]'}`}>{evalResult.headline}</h5>
                                  <span className={`font-extrabold text-[10px] ${evalResult.passed ? 'text-forestGreen' : 'text-orangeAccent'}`}>{evalResult.grade}</span>
                                </div>
                                <p className="text-[9px] text-stone-500">
                                  Your voice match accuracy: <span className="font-bold text-stone-700">{evalResult.accuracy}%</span> • Result: <span className={`font-bold ${evalResult.passed ? 'text-emerald' : 'text-coral'}`}>{evalResult.passed ? 'Passed' : 'Keep Trying!'}</span>
                                </p>
                              </div>
                            </div>
                            <div className="p-1.5 bg-white rounded-xl border border-stone-100 flex items-center justify-between gap-2">
                              <div className="flex items-center gap-1.5">
                                <span className="text-[10px] text-stone-400">Heard:</span>
                                <span className="text-[11px] font-extrabold text-stone-700 font-mono italic">"{evalResult.heard}"</span>
                              </div>
                              {evalResult.passed && (
                                <div className="text-[10px] bg-emerald/10 text-forestGreen px-2 py-0.5 rounded font-extrabold whitespace-nowrap">+50 XP Earned!</div>
                              )}
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Right Column: Mic Controls, Voice Guide and Status */}
                      <div className="col-span-5 flex flex-col justify-between bg-white p-3 rounded-2xl border border-stone-200 shadow-sm space-y-2">
                        <div className="text-center py-2 relative flex-1 flex flex-col justify-center items-center">
                          <div className="relative w-16 h-16 flex items-center justify-center bg-skyBlue/10 rounded-full border border-skyBlue/20 mb-2">
                            <div className={`absolute inset-0 bg-[#29B6F6]/30 rounded-full transition-all duration-300 ${isVoicePulseActive ? 'scale-125 animate-ping' : 'scale-100'}`}></div>
                            <span className="text-3xl relative z-10">{guideCharacter}</span>
                          </div>
                          <p className="text-[10px] font-extrabold text-stone-400 uppercase tracking-widest">
                            {stepBadge === 'listen' ? '1. Hear Teacher Guide' : '2. Tap Say It! To Speak'}
                          </p>
                          <p className="text-xs text-[#2E7D32] font-bold px-4">{interactiveHint}</p>

                          {/* Waveform Animation when recording */}
                          {isRecording && (
                            <div className="flex items-end justify-center gap-1.5 h-12 w-full mt-2">
                              <div className="wave-bar w-1.5 bg-coral rounded-full" style={{ height: '12px' }}></div>
                              <div className="wave-bar w-1.5 bg-orangeAccent rounded-full" style={{ height: '12px' }}></div>
                              <div className="wave-bar w-1.5 bg-sunshineYellow rounded-full" style={{ height: '12px' }}></div>
                              <div className="wave-bar w-1.5 bg-[#43A047] rounded-full" style={{ height: '12px' }}></div>
                              <div className="wave-bar w-1.5 bg-[#29B6F6] rounded-full" style={{ height: '12px' }}></div>
                            </div>
                          )}
                        </div>

                        {/* Main Actions */}
                        <div className="space-y-1.5">
                          <div className="grid grid-cols-2 gap-2">
                            <button
                              onClick={handlePlayTargetSpeech}
                              className="w-full py-2 bg-[#29B6F6] text-white font-baloo rounded-xl text-xs font-extrabold uppercase tracking-wide soft-3d-button-blue"
                            >
                              🔊 Listen
                            </button>
                            <button
                              onClick={handleToggleRecordSpeech}
                              className="w-full py-2 bg-coral text-white font-baloo rounded-xl text-xs font-extrabold uppercase tracking-wide soft-3d-button-orange relative overflow-hidden"
                            >
                              <span>{isRecording ? '⏹ Stop & Score' : '🎙 Say It!'}</span>
                            </button>
                          </div>
                          <p className="text-[9px] text-stone-400 text-center">Uses smart local WebSpeech recognition model</p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* TAB 4: AI CHATBOT TAB */}
                {activeTab === 'chat' && (
                  <div className="h-full flex flex-col animate-in fade-in duration-200 bg-gradient-to-b from-skyBlue/10 to-creamWhite/40">
                    {/* Chatbot Header */}
                    <div className="p-3 bg-white/95 border-b border-stone-200/80 flex justify-between items-center shadow-xs">
                      <div className="flex items-center gap-2.5">
                        <div className="w-9 h-9 rounded-full bg-amber-100 border-2 border-orangeAccent/40 flex items-center justify-center text-xl shadow-xs">
                          {activeScenarioId && ROLEPLAY_SCENARIOS[activeScenarioId] ? ROLEPLAY_SCENARIOS[activeScenarioId].icon : studentAvatar}
                        </div>
                        <div>
                          <div className="flex items-center gap-1.5">
                            <h4 className="font-baloo text-base font-extrabold text-stone-800">
                              {activeScenarioId && ROLEPLAY_SCENARIOS[activeScenarioId]
                                ? `Scenario ${activeScenarioId}: ${ROLEPLAY_SCENARIOS[activeScenarioId].title}`
                                : `Roleplay Assistant Menu`}
                            </h4>
                            <span className="w-2 h-2 rounded-full bg-emerald animate-ping"></span>
                          </div>
                          <p className="text-[10px] font-bold text-forestGreen">
                            {activeScenarioId && ROLEPLAY_SCENARIOS[activeScenarioId]
                              ? `Practicing real-life conversation · Type "menu" to switch`
                              : `Choose a scenario (1-6) or click below to start!`}
                          </p>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => {
                            playAudioChime('click');
                            handleSendChatMessage('menu');
                          }}
                          className="bg-amber-100 text-amber-900 text-[10px] font-extrabold px-2.5 py-1 rounded-xl border border-amber-300 hover:bg-amber-200 transition-all flex items-center gap-1 shadow-2xs"
                          title="Show Scenarios Menu"
                        >
                          📋 Menu
                        </button>
                        <button
                          onClick={() => {
                            playAudioChime('click');
                            if (activeScenarioId && ROLEPLAY_SCENARIOS[activeScenarioId]) {
                              speakText(`You are practicing scenario ${activeScenarioId}: ${ROLEPLAY_SCENARIOS[activeScenarioId].title}. Speak or type your reply to practice!`);
                            } else {
                              speakText(`Please choose a scenario from 1 to 6 to start your roleplay practice!`);
                            }
                          }}
                          className="bg-emerald/10 text-forestGreen text-[10px] font-extrabold px-2.5 py-1 rounded-xl border border-emerald/20 hover:bg-emerald/20 transition-all flex items-center gap-1"
                        >
                          🔊 Guide
                        </button>
                      </div>
                    </div>

                    {/* Chat Messages List */}
                    <div ref={chatScrollRef} className="flex-1 overflow-y-auto p-3 space-y-3 min-h-[220px] max-h-[310px]">
                      {chatMessages.map((msg, mIdx) => {
                        const isMenuMsg = msg.text === ROLEPLAY_MENU_TEXT || msg.text.includes("Please choose a scenario");
                        return (
                          <div key={msg.id} className="space-y-2">
                            <div
                              className={`flex items-start gap-2 ${msg.sender === 'kid' ? 'flex-row-reverse' : 'flex-row'}`}
                            >
                              <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 text-sm border ${msg.sender === 'kid' ? 'bg-emerald text-white border-forestGreen' : 'bg-amber-100 border-amber-300'}`}>
                                {msg.sender === 'kid' ? '🧒' : (activeScenarioId ? '🎭' : studentAvatar)}
                              </div>
                              <div className={`max-w-[85%] rounded-2xl p-2.5 shadow-xs relative ${msg.sender === 'kid' ? 'bg-forestGreen text-white rounded-tr-none' : 'bg-white text-stone-800 border border-stone-200/80 rounded-tl-none'}`}>
                                <div className="flex justify-between items-center gap-2 mb-0.5">
                                  <span className={`text-[9px] font-extrabold uppercase ${msg.sender === 'kid' ? 'text-emerald-200' : 'text-orangeAccent'}`}>
                                    {msg.sender === 'kid' ? childName : (activeScenarioId && ROLEPLAY_SCENARIOS[activeScenarioId] ? ROLEPLAY_SCENARIOS[activeScenarioId].title : "Roleplay Assistant")}
                                  </span>
                                  <span className={`text-[8px] ${msg.sender === 'kid' ? 'text-emerald-200' : 'text-stone-400'}`}>{msg.timestamp}</span>
                                </div>
                                <p className="text-xs font-semibold leading-relaxed whitespace-pre-line">{msg.text}</p>
                                
                                {msg.sender === 'ai' && (
                                  <div className="mt-2 pt-1.5 border-t border-stone-100 flex items-center gap-2 flex-wrap">
                                    <button
                                      onClick={() => {
                                        playAudioChime('pop');
                                        speakWithGeminiVoice(msg.text);
                                      }}
                                      className="text-[9px] font-extrabold bg-amber-50 text-amber-800 px-2 py-0.5 rounded-lg border border-amber-200 hover:bg-amber-100 flex items-center gap-1 transition-all"
                                    >
                                      🔊 Listen
                                    </button>
                                  </div>
                                )}
                              </div>
                            </div>

                            {/* Interactive Scenario Buttons if this is a Menu Message or last message when no scenario is active */}
                            {msg.sender === 'ai' && isMenuMsg && (
                              <div className="ml-10 grid grid-cols-1 sm:grid-cols-2 gap-1.5 pt-1">
                                {[1, 2, 3, 4, 5, 6].map((num) => {
                                  const scenario = ROLEPLAY_SCENARIOS[num];
                                  return (
                                    <button
                                      key={num}
                                      onClick={() => {
                                        handleSendChatMessage(String(num), num);
                                      }}
                                      className="flex items-center gap-2 text-left p-2 rounded-xl bg-white hover:bg-amber-50 border border-amber-200/80 hover:border-amber-400 text-stone-800 transition-all shadow-2xs active:scale-98 group"
                                    >
                                      <span className="text-base flex-shrink-0">{scenario.icon}</span>
                                      <div className="flex-1 min-w-0">
                                        <div className="text-xs font-extrabold text-stone-800 group-hover:text-amber-900 truncate">
                                          {scenario.title}
                                        </div>
                                        <div className="text-[9px] text-stone-500 truncate">
                                          Tap to practice scenario {num}
                                        </div>
                                      </div>
                                      <span className="text-stone-400 text-xs font-bold">➔</span>
                                    </button>
                                  );
                                })}
                              </div>
                            )}
                          </div>
                        );
                      })}

                      {isChatThinking && (
                        <div className="flex items-center gap-2 text-stone-500 text-xs italic">
                          <div className="w-8 h-8 rounded-full bg-amber-100 flex items-center justify-center animate-bounce text-sm">🎭</div>
                          <span className="bg-white px-3 py-1.5 rounded-2xl border border-stone-200 font-bold text-[10px]">Assistant is replying... 🌟</span>
                        </div>
                      )}
                    </div>

                    {/* Quick Starter Suggestions */}
                    <div className="px-3 py-1.5 bg-white/80 border-t border-stone-200/60 overflow-x-auto whitespace-nowrap flex gap-1.5 no-scrollbar">
                      <span className="text-[9px] font-extrabold text-stone-400 uppercase py-1 pr-1 flex-shrink-0">
                        {activeScenarioId ? 'Quick Replies:' : 'Scenarios:'}
                      </span>

                      {!activeScenarioId ? (
                        [
                          { text: "1️⃣ Pencil", num: 1 },
                          { text: "2️⃣ Teacher", num: 2 },
                          { text: "3️⃣ Canteen", num: 3 },
                          { text: "4️⃣ Introduce", num: 4 },
                          { text: "5️⃣ Directions", num: 5 },
                          { text: "6️⃣ Hobbies", num: 6 },
                        ].map((btn, idx) => (
                          <button
                            key={idx}
                            onClick={() => handleSendChatMessage(String(btn.num), btn.num)}
                            className="text-[9px] font-bold bg-amber-50 text-amber-900 border border-amber-200 px-2.5 py-1 rounded-full hover:bg-amber-100 flex-shrink-0 transition-all active:scale-95 shadow-2xs"
                          >
                            {btn.text}
                          </button>
                        ))
                      ) : (
                        <>
                          <button
                            onClick={() => handleSendChatMessage('menu')}
                            className="text-[9px] font-extrabold bg-stone-100 text-stone-800 border border-stone-300 px-2.5 py-1 rounded-full hover:bg-stone-200 flex-shrink-0 transition-all active:scale-95 shadow-2xs"
                          >
                            📋 Menu
                          </button>

                          {activeScenarioId === 1 && [
                            "Yes, here is a spare pencil!",
                            "Sorry, I don't have an extra one.",
                            "Sure! What are we writing?"
                          ].map((reply, idx) => (
                            <button
                              key={idx}
                              onClick={() => handleSendChatMessage(reply)}
                              className="text-[9px] font-bold bg-emerald/10 text-forestGreen border border-emerald/20 px-2.5 py-1 rounded-full hover:bg-emerald/20 flex-shrink-0 transition-all active:scale-95 shadow-2xs"
                            >
                              {reply}
                            </button>
                          ))}

                          {activeScenarioId === 2 && [
                            "I have a question about today's homework.",
                            "Could you please explain question number 3?",
                            "I understand the lesson now, thank you!"
                          ].map((reply, idx) => (
                            <button
                              key={idx}
                              onClick={() => handleSendChatMessage(reply)}
                              className="text-[9px] font-bold bg-emerald/10 text-forestGreen border border-emerald/20 px-2.5 py-1 rounded-full hover:bg-emerald/20 flex-shrink-0 transition-all active:scale-95 shadow-2xs"
                            >
                              {reply}
                            </button>
                          ))}

                          {activeScenarioId === 3 && [
                            "Can I have a plate of fried rice please?",
                            "How much is the orange juice?",
                            "Thank you very much!"
                          ].map((reply, idx) => (
                            <button
                              key={idx}
                              onClick={() => handleSendChatMessage(reply)}
                              className="text-[9px] font-bold bg-emerald/10 text-forestGreen border border-emerald/20 px-2.5 py-1 rounded-full hover:bg-emerald/20 flex-shrink-0 transition-all active:scale-95 shadow-2xs"
                            >
                              {reply}
                            </button>
                          ))}

                          {activeScenarioId === 4 && [
                            `Hi! My name is ${childName}.`,
                            "Nice to meet you! Where are you from?",
                            "Do you want to be friends?"
                          ].map((reply, idx) => (
                            <button
                              key={idx}
                              onClick={() => handleSendChatMessage(reply)}
                              className="text-[9px] font-bold bg-emerald/10 text-forestGreen border border-emerald/20 px-2.5 py-1 rounded-full hover:bg-emerald/20 flex-shrink-0 transition-all active:scale-95 shadow-2xs"
                            >
                              {reply}
                            </button>
                          ))}

                          {activeScenarioId === 5 && [
                            "Go straight down the hallway and turn left.",
                            "The main office is next to the library.",
                            "Let me walk with you there!"
                          ].map((reply, idx) => (
                            <button
                              key={idx}
                              onClick={() => handleSendChatMessage(reply)}
                              className="text-[9px] font-bold bg-emerald/10 text-forestGreen border border-emerald/20 px-2.5 py-1 rounded-full hover:bg-emerald/20 flex-shrink-0 transition-all active:scale-95 shadow-2xs"
                            >
                              {reply}
                            </button>
                          ))}

                          {activeScenarioId === 6 && [
                            "I love playing football with my friends!",
                            "I like drawing pictures and reading books.",
                            "I enjoy playing video games on weekends."
                          ].map((reply, idx) => (
                            <button
                              key={idx}
                              onClick={() => handleSendChatMessage(reply)}
                              className="text-[9px] font-bold bg-emerald/10 text-forestGreen border border-emerald/20 px-2.5 py-1 rounded-full hover:bg-emerald/20 flex-shrink-0 transition-all active:scale-95 shadow-2xs"
                            >
                              {reply}
                            </button>
                          ))}
                        </>
                      )}
                    </div>

                    {/* Chat Voice/Text Input Bar */}
                    <div className="p-2.5 bg-white border-t border-stone-200 flex items-center gap-2">
                      <button
                        onClick={handleToggleChatMic}
                        className={`px-3 py-2 rounded-xl font-bold text-xs flex items-center gap-1.5 transition-all shadow-sm ${isChatMicActive ? 'bg-red-500 text-white animate-pulse' : 'bg-emerald text-white hover:brightness-105 active:scale-95'}`}
                        title="Click to speak your message with microphone"
                      >
                        <span className="text-base">{isChatMicActive ? '🔴' : '🎤'}</span>
                        <span className="text-[10px] uppercase font-extrabold tracking-wider">{isChatMicActive ? 'Listening...' : 'Speak'}</span>
                      </button>

                      <input
                        type="text"
                        value={chatInputText}
                        onChange={(e) => setChatInputText(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') handleSendChatMessage();
                        }}
                        placeholder={!activeScenarioId ? 'Type a scenario number (1-6) or message...' : 'Speak or type your response in English...'}
                        className="flex-1 bg-stone-100 border border-stone-300 rounded-xl px-3 py-1.5 text-xs text-stone-800 font-semibold outline-none focus:bg-white focus:border-forestGreen transition-all"
                      />

                      <button
                        onClick={() => handleSendChatMessage()}
                        disabled={!chatInputText.trim() || isChatThinking}
                        className="bg-forestGreen text-white text-xs font-bold px-3.5 py-2 rounded-xl disabled:opacity-40 hover:brightness-105 active:scale-95 transition-all shadow-sm"
                      >
                        Send 🚀
                      </button>
                    </div>
                  </div>
                )}

                {/* TAB 5: QUICK JAHAI DICTIONARY TAB */}
                {activeTab === 'dictionary' && (
                  <div className="min-h-full flex flex-col animate-in fade-in duration-200 bg-stone-50/50 p-4 sm:p-6 space-y-4">
                    {/* Header Banner */}
                    <div className="bg-gradient-to-r from-emerald-500 via-emerald-400 to-green-500 text-stone-950 p-4 sm:p-5 rounded-3xl shadow-md border border-emerald-300/60 flex flex-wrap justify-between items-center gap-3">
                      <div>
                        <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                          <span className="bg-amber-400 text-stone-950 text-[10px] sm:text-[11px] font-black uppercase px-2.5 py-0.5 rounded-full border border-amber-300 shadow-2xs tracking-wider inline-flex items-center gap-1">
                            📖 Indigenous Vocabulary Guide
                          </span>
                          <span className="text-xs bg-emerald-900 text-white font-extrabold px-2.5 py-0.5 rounded-lg border border-emerald-950 shadow-2xs">
                            {JAHAI_DICTIONARY.length} Basic Words
                          </span>
                        </div>
                        <h3 className="font-baloo text-xl sm:text-2xl font-black text-stone-950 leading-snug">
                          Quick Jahai ➔ English / Malay Dictionary
                        </h3>
                        <p className="text-xs sm:text-sm text-stone-900 font-extrabold leading-relaxed mt-1">
                          Look up basic words in Jahai, English, or Malay for primary classroom learning.
                        </p>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => {
                            playAudioChime('pop');
                            speakWithGeminiVoice(`Welcome to the Quick Jahai Dictionary! You can search basic words in Jahai, English, or Malay.`);
                          }}
                          className="bg-stone-950 hover:bg-stone-800 text-amber-300 font-baloo font-extrabold text-xs sm:text-sm px-4 py-2.5 rounded-2xl border border-stone-800 shadow-sm transition-all flex items-center gap-1.5 cursor-pointer hover:scale-105 active:scale-95"
                        >
                          🔊 Listen Guide
                        </button>
                      </div>
                    </div>

                    {/* Search & Category Filter Controls */}
                    <div className="bg-white p-3.5 sm:p-4 rounded-2xl border-2 border-stone-200 shadow-xs space-y-3">
                      <div className="flex flex-col sm:flex-row gap-3 items-center">
                        <div className="relative flex-1 w-full">
                          <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-400 text-base">🔍</span>
                          <input
                            type="text"
                            value={dictSearchQuery}
                            onChange={(e) => setDictSearchQuery(e.target.value)}
                            placeholder="Search Jahai, English, or Malay word (e.g. risau, friend, water, ton)..."
                            className="w-full pl-10 pr-9 py-2.5 rounded-2xl bg-stone-50 border border-stone-300 text-xs font-bold text-stone-800 outline-none focus:bg-white focus:border-forestGreen focus:ring-2 focus:ring-emerald/20 transition-all"
                          />
                          {dictSearchQuery && (
                            <button
                              onClick={() => setDictSearchQuery('')}
                              className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600 font-bold text-xs bg-stone-200 rounded-full w-5 h-5 flex items-center justify-center cursor-pointer"
                            >
                              ✕
                            </button>
                          )}
                        </div>
                      </div>

                      {/* Category Filter Pills */}
                      <div className="flex gap-1.5 overflow-x-auto pb-1 no-scrollbar text-xs font-bold">
                        {[
                          { id: 'all', label: 'All Words', icon: '📚' },
                          { id: 'greetings', label: 'Greetings & Care', icon: '🌟' },
                          { id: 'pronouns', label: 'People & Pronouns', icon: '🧒' },
                          { id: 'animal', label: 'Animals', icon: '🐾' },
                          { id: 'food', label: 'Food & Drink', icon: '🍏' },
                          { id: 'nature', label: 'Nature & Fire', icon: '🌿' },
                          { id: 'body', label: 'Body Parts', icon: '🖐️' },
                          { id: 'object', label: 'Tools & Objects', icon: '🎋' }
                        ].map((cat) => (
                          <button
                            key={cat.id}
                            onClick={() => {
                              playAudioChime('click');
                              setDictCategory(cat.id);
                            }}
                            className={`px-3 py-1.5 rounded-xl border flex items-center gap-1.5 whitespace-nowrap transition-all cursor-pointer ${
                              dictCategory === cat.id
                                ? 'bg-forestGreen text-white border-forestGreen shadow-xs scale-105'
                                : 'bg-stone-50 text-stone-600 border-stone-200 hover:bg-stone-100'
                            }`}
                          >
                            <span>{cat.icon}</span>
                            <span>{cat.label}</span>
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Dictionary Cards Grid */}
                    {(() => {
                      const filteredWords = JAHAI_DICTIONARY.filter((item) => {
                        const matchesCategory = dictCategory === 'all' || item.category === dictCategory;
                        const query = dictSearchQuery.trim().toLowerCase();
                        const matchesSearch =
                          !query ||
                          item.jahai.toLowerCase().includes(query) ||
                          item.english.toLowerCase().includes(query) ||
                          item.malay.toLowerCase().includes(query) ||
                          item.ipa.toLowerCase().includes(query);
                        return matchesCategory && matchesSearch;
                      });

                      if (filteredWords.length === 0) {
                        return (
                          <div className="bg-white p-8 rounded-3xl border border-stone-200 text-center space-y-2 my-4">
                            <span className="text-4xl">🔍</span>
                            <h4 className="font-baloo text-base font-extrabold text-stone-700">No matching words found</h4>
                            <p className="text-xs text-stone-500">Try searching for another word or select 'All Words'.</p>
                            <button
                              onClick={() => {
                                setDictSearchQuery('');
                                setDictCategory('all');
                              }}
                              className="mt-2 text-xs font-bold text-forestGreen bg-emerald-50 px-3 py-1.5 rounded-xl border border-emerald-200 hover:bg-emerald-100 transition-colors"
                            >
                              Reset Search Filters
                            </button>
                          </div>
                        );
                      }

                      return (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                          {filteredWords.map((item, idx) => (
                            <div
                              key={idx}
                              className="bg-white p-4 rounded-2xl border border-stone-200 shadow-xs hover:shadow-md transition-all flex flex-col justify-between space-y-2.5 group hover:border-emerald-300"
                            >
                              <div className="space-y-1">
                                <div className="flex justify-between items-start">
                                  <div className="flex items-center gap-2">
                                    <span className="text-2xl p-1.5 bg-stone-100 rounded-xl group-hover:scale-110 transition-transform">
                                      {item.icon}
                                    </span>
                                    <div>
                                      <h4 className="font-baloo text-lg font-black text-amber-900 group-hover:text-forestGreen transition-colors leading-tight">
                                        {item.jahai}
                                      </h4>
                                      <span className="text-[10px] font-mono text-stone-500 font-semibold">{item.ipa}</span>
                                    </div>
                                  </div>
                                  <button
                                    onClick={() => {
                                      playAudioChime('pop');
                                      const speakTextStr = `${item.jahai}. ${item.english}. In Malay: ${item.malay}.`;
                                      speakWithGeminiVoice(speakTextStr);
                                    }}
                                    className="w-8 h-8 rounded-xl bg-amber-50 hover:bg-amber-100 border border-amber-200 text-amber-800 flex items-center justify-center transition-transform active:scale-95 cursor-pointer shadow-2xs"
                                    title="Listen to word pronunciation"
                                  >
                                    🔊
                                  </button>
                                </div>

                                <div className="grid grid-cols-2 gap-1.5 pt-1.5 border-t border-stone-100 text-xs">
                                  <div className="bg-skyBlue/10 p-2 rounded-xl border border-skyBlue/20">
                                    <span className="text-[9px] uppercase font-bold text-skyBlue block">English</span>
                                    <span className="font-extrabold text-stone-800">{item.english}</span>
                                  </div>
                                  <div className="bg-emerald/10 p-2 rounded-xl border border-emerald/20">
                                    <span className="text-[9px] uppercase font-bold text-forestGreen block">Malay</span>
                                    <span className="font-extrabold text-stone-800">{item.malay}</span>
                                  </div>
                                </div>
                              </div>

                              {item.example && (
                                <div className="bg-stone-50 p-2 rounded-xl border border-stone-100 text-[11px] text-stone-600 font-medium italic">
                                  <span className="font-extrabold text-stone-400 not-italic mr-1">Ex:</span> "{item.example}"
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      );
                    })()}
                  </div>
                )}
              </div>

              {/* IMMERSIVE TABLET BOTTOM NAVIGATION BAR */}
              <div className="absolute bottom-0 left-0 right-0 bg-white border-t border-stone-200/60 py-2.5 px-4 sm:px-6 flex justify-around items-center z-50">
                <button
                  onClick={() => handleSwitchTab('home')}
                  className={`flex flex-col items-center gap-0.5 transition-transform ${activeTab === 'home' ? 'text-[#2E7D32] scale-105 font-bold' : 'text-stone-400 hover:scale-105'}`}
                >
                  <span className="text-xl">🏡</span>
                  <span className="text-[10px] font-extrabold uppercase tracking-wider">Home</span>
                </button>
                <button
                  onClick={() => handleSwitchTab('dictionary')}
                  className={`flex flex-col items-center gap-0.5 transition-transform relative ${activeTab === 'dictionary' ? 'text-[#2E7D32] scale-105 font-bold' : 'text-stone-400 hover:scale-105'}`}
                >
                  <span className="text-xl">📖</span>
                  <span className="text-[10px] font-extrabold uppercase tracking-wider">Dictionary</span>
                </button>
                <button
                  onClick={() => handleSwitchTab('learn')}
                  className={`flex flex-col items-center gap-0.5 transition-transform ${activeTab === 'learn' ? 'text-[#2E7D32] scale-105 font-bold' : 'text-stone-400 hover:scale-105'}`}
                >
                  <span className="text-xl">🗺</span>
                  <span className="text-[10px] font-extrabold uppercase tracking-wider">Adventure</span>
                </button>
                <button
                  onClick={() => handleSwitchTab('speak')}
                  className={`flex flex-col items-center gap-0.5 transition-transform relative ${activeTab === 'speak' ? 'text-[#2E7D32] scale-105 font-bold' : 'text-stone-400 hover:scale-105'}`}
                >
                  <span className="text-xl">🎤</span>
                  <span className="text-[10px] font-extrabold uppercase tracking-wider">Practice</span>
                </button>
                <button
                  onClick={() => handleSwitchTab('chat')}
                  className={`flex flex-col items-center gap-0.5 transition-transform relative ${activeTab === 'chat' ? 'text-[#2E7D32] scale-105 font-bold' : 'text-stone-400 hover:scale-105'}`}
                >
                  <span className="absolute -top-1 -right-1.5 w-2 h-2 bg-emerald rounded-full animate-ping"></span>
                  <span className="text-xl">🤖</span>
                  <span className="text-[10px] font-extrabold uppercase tracking-wider">AI Chat</span>
                </button>
              </div>
            </div>
      </main>

      {/* CLASSROOM & VOICE SETTINGS MODAL */}
      {isSettingsOpen && (
        <div className="fixed inset-0 bg-stone-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-3 sm:p-4 animate-in fade-in duration-200">
          <div className="bg-white w-full max-w-2xl rounded-3xl shadow-2xl border border-stone-200 overflow-hidden flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="bg-gradient-to-r from-forestGreen to-[#1B5E20] text-white p-4 px-6 flex justify-between items-center shadow-sm">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-full bg-sunshineYellow/20 border border-sunshineYellow/40 flex items-center justify-center text-lg">
                  ⚙
                </div>
                <div>
                  <h3 className="font-baloo text-lg font-extrabold leading-tight">Classroom & Voice Settings</h3>
                  <p className="text-[11px] text-emerald-200 font-semibold">Customize student name, speech pace, phrases & accuracy</p>
                </div>
              </div>
              <button
                onClick={() => {
                  playAudioChime('click');
                  setIsSettingsOpen(false);
                }}
                className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white font-bold flex items-center justify-center transition-colors text-base cursor-pointer"
                title="Close settings"
              >
                ✕
              </button>
            </div>

            {/* Modal Tabs */}
            <div className="flex bg-stone-100 p-1.5 border-b border-stone-200 px-6">
              <button
                onClick={() => {
                  playAudioChime('click');
                  setInspectorTab('parent');
                }}
                className={`flex-1 py-2 text-xs font-extrabold rounded-xl transition-all ${inspectorTab === 'parent' ? 'bg-white text-forestGreen shadow-sm border border-stone-200/80' : 'text-stone-500 hover:text-stone-700'}`}
              >
                👩‍🏫 Classroom Configurator
              </button>
              <button
                onClick={() => {
                  playAudioChime('click');
                  setInspectorTab('dev');
                }}
                className={`flex-1 py-2 text-xs font-extrabold rounded-xl transition-all ${inspectorTab === 'dev' ? 'bg-white text-[#0288D1] shadow-sm border border-stone-200/80' : 'text-stone-500 hover:text-stone-700'}`}
              >
                🔬 Pronunciation Analytics
              </button>
            </div>

            {/* Modal Body */}
            <div className="overflow-y-auto p-4 sm:p-5 space-y-4 flex-1">
              {/* INSPECTOR PANEL 1: CLASSROOM CONFIGURATOR */}
              {inspectorTab === 'parent' && (
                <div className="space-y-4 animate-in fade-in duration-200">
                  <div>
                    <h3 className="font-baloo text-base font-extrabold text-[#1B5E20] flex items-center gap-2">
                      <span>👩‍🏫</span> Student & Phrase Configurator
                    </h3>
                    <p className="text-xs text-stone-500">Tailor class names, difficulty thresholds, and local language translations.</p>
                  </div>

                  {/* Section: Kids config */}
                  <div className="space-y-3 bg-[#F9F8F4] p-3.5 rounded-2xl border border-stone-200/80">
                    <h4 className="text-xs font-bold text-stone-700 uppercase tracking-wider">1. Student Details & Voice Settings</h4>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                      <div>
                        <label className="block text-[10px] font-bold text-stone-500 uppercase">First Name</label>
                        <input
                          type="text"
                          value={childName}
                          onChange={(e) => setChildName(e.target.value)}
                          className="w-full mt-1 px-3 py-1.5 bg-white border border-stone-300 rounded-lg text-xs focus:ring-1 focus:ring-forestGreen outline-none font-bold"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-stone-500 uppercase">Class Voice & Pace Preset</label>
                        <select
                          value="friendly"
                          disabled
                          className="w-full mt-1 px-3 py-1.5 bg-emerald-50/60 border border-emerald-300/80 rounded-lg text-xs outline-none font-bold text-forestGreen cursor-not-allowed"
                        >
                          <option value="friendly">👩‍🏫 Gentle Classroom Teacher (0.88x speed, 1.18 pitch)</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-stone-500 uppercase">System Voice Accent</label>
                        <select
                          value={selectedVoiceName}
                          onChange={(e) => {
                            const vName = e.target.value;
                            setSelectedVoiceName(vName);
                            playAudioChime('click');
                            speakText("Voice accent updated!", { voiceName: vName });
                          }}
                          className="w-full mt-1 px-3 py-1.5 bg-white border border-stone-300 rounded-lg text-xs outline-none font-semibold text-stone-700 focus:ring-1 focus:ring-forestGreen"
                        >
                          {voices.length === 0 && <option value="">Default System Voice</option>}
                          {voices.map((v, i) => (
                            <option key={i} value={v.name}>{v.name} ({v.lang})</option>
                          ))}
                        </select>
                      </div>
                    </div>

                    {/* Manual Sliders for Custom Fine-Tuning */}
                    <div className="grid grid-cols-2 gap-3 pt-2 border-t border-stone-200/60">
                      <div>
                        <div className="flex justify-between items-center text-[10px]">
                          <span className="font-extrabold text-stone-600">Speech Pace (Speed):</span>
                          <span className="font-bold text-forestGreen">{voicePaceRate.toFixed(2)}x speed</span>
                        </div>
                        <input
                          type="range"
                          min="0.50"
                          max="1.20"
                          step="0.05"
                          value={voicePaceRate}
                          onChange={(e) => {
                            const val = parseFloat(e.target.value);
                            setVoicePaceRate(val);
                            setVoicePresetKey('custom');
                            speakText(`Pace set to ${val.toFixed(2)} speed.`, { rate: val });
                          }}
                          className="w-full h-1.5 bg-stone-200 rounded-lg appearance-none cursor-pointer mt-1"
                        />
                      </div>
                      <div>
                        <div className="flex justify-between items-center text-[10px]">
                          <span className="font-extrabold text-stone-600">Voice Pitch (Kids Pitch):</span>
                          <span className="font-bold text-[#0288D1]">{voicePitchLevel.toFixed(2)} pitch</span>
                        </div>
                        <input
                          type="range"
                          min="0.80"
                          max="1.80"
                          step="0.05"
                          value={voicePitchLevel}
                          onChange={(e) => {
                            const val = parseFloat(e.target.value);
                            setVoicePitchLevel(val);
                            setVoicePresetKey('custom');
                            speakText(`Pitch set to ${val.toFixed(2)} level.`, { pitch: val });
                          }}
                          className="w-full h-1.5 bg-stone-200 rounded-lg appearance-none cursor-pointer mt-1"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Section: Phrases configuration */}
                  <div className="space-y-3 bg-[#F9F8F4] p-3.5 rounded-2xl border border-stone-200/80">
                    <div className="flex justify-between items-center">
                      <h4 className="text-xs font-bold text-stone-700 uppercase tracking-wider">2. Practice Phrases Playlist</h4>
                      <button onClick={handleResetPhrasesDefault} className="text-[10px] text-forestGreen font-extrabold hover:underline">
                        Reset Defaults
                      </button>
                    </div>
                    <div className="space-y-2 max-h-[160px] overflow-y-auto pr-1">
                      {targetPhrases.map((p, idx) => (
                        <div key={idx} className="p-2.5 bg-white rounded-xl border border-stone-200 space-y-1.5">
                          <span className={`text-[9px] font-extrabold px-1.5 py-0.5 rounded ${idx === 0 ? 'text-forestGreen bg-emerald/10' : idx === 1 ? 'text-[#0288D1] bg-skyBlue/10' : 'text-coral bg-orange-100'}`}>
                            Phrase {idx + 1}
                          </span>
                          <input
                            type="text"
                            value={p.text}
                            onChange={(e) => handlePhraseTextChange(idx, 'text', e.target.value)}
                            className="w-full px-2 py-1 bg-stone-50 border rounded text-xs outline-none"
                          />
                          <input
                            type="text"
                            value={p.trans}
                            onChange={(e) => handlePhraseTextChange(idx, 'trans', e.target.value)}
                            className="w-full px-2 py-1 bg-stone-50 border rounded text-[10px] italic text-stone-500 outline-none"
                          />
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Section: Simulation controller */}
                  <div className="space-y-3 bg-[#E8F5E9]/50 p-3.5 rounded-2xl border border-emerald/20">
                    <div>
                      <h4 className="text-xs font-extrabold text-forestGreen uppercase tracking-wider">3. Classroom Quick Testing Tool</h4>
                      <p className="text-[10px] text-stone-500">No mic ready? Instantly simulate pronunciation responses to test how tree and grading system adapts.</p>
                    </div>
                    <div className="grid grid-cols-3 gap-2">
                      <button
                        onClick={() => handleSimulateSpeech(95)}
                        className="py-1.5 px-2 bg-[#E8F5E9] hover:bg-[#C8E6C9] text-forestGreen font-bold rounded-lg text-[11px] border border-emerald/20 transition-all cursor-pointer"
                      >
                        Excellent Match (95%)
                      </button>
                      <button
                        onClick={() => handleSimulateSpeech(74)}
                        className="py-1.5 px-2 bg-[#FFF3E0] hover:bg-[#FFE0B2] text-[#E65100] font-bold rounded-lg text-[11px] border border-orangeAccent/20 transition-all cursor-pointer"
                      >
                        Average Match (74%)
                      </button>
                      <button
                        onClick={() => handleSimulateSpeech(35)}
                        className="py-1.5 px-2 bg-[#FFEBEE] hover:bg-[#FFCDD2] text-[#C62828] font-bold rounded-lg text-[11px] border border-red-200 transition-all cursor-pointer"
                      >
                        Struggling Voice (35%)
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* INSPECTOR PANEL 2: SPEECH ANALYTICS */}
              {inspectorTab === 'dev' && (
                <div className="space-y-4 animate-in fade-in duration-200">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-baloo text-base font-extrabold text-[#0288D1] flex items-center gap-2">
                        <span>🔬</span> Speech Recognition Sandbox
                      </h3>
                      <p className="text-xs text-stone-500">Live phoneme comparison and granular correctness evaluations.</p>
                    </div>
                    <span className="text-[9px] bg-[#0288D1]/10 text-[#0288D1] font-mono font-bold px-2 py-0.5 rounded">Engine Active</span>
                  </div>

                  {/* Pass Rate Controls */}
                  <div className="space-y-2 bg-[#F0F8FF] p-3.5 rounded-2xl border border-[#B3E5FC]/40">
                    <div className="flex justify-between items-center">
                      <span className="text-xs font-bold text-stone-700">Strictness Threshold:</span>
                      <span className="text-xs font-extrabold text-[#0288D1]">{passThreshold}% Accuracy to Pass</span>
                    </div>
                    <input
                      type="range"
                      min="30"
                      max="95"
                      value={passThreshold}
                      onChange={(e) => setPassThreshold(parseInt(e.target.value))}
                      className="w-full h-1.5 bg-[#B3E5FC] rounded-lg appearance-none cursor-pointer"
                    />
                    <p className="text-[9px] text-stone-400">Classroom passing levels are lower for elementary kids to retain confidence and encouragement.</p>
                  </div>

                  {/* Live debug match stats */}
                  <div className="bg-stone-50 p-3.5 rounded-2xl border border-stone-200 space-y-3">
                    <h4 className="text-xs font-bold text-stone-700 uppercase">Live Pronunciation Report</h4>
                    <div className="grid grid-cols-2 gap-3 text-xs">
                      <div className="bg-white p-2.5 rounded-xl border border-stone-100">
                        <p className="text-[10px] text-stone-400 font-bold uppercase">Syntactic Words Met</p>
                        <p className="text-base font-extrabold text-stone-800 mt-1">{statWordsMatched}</p>
                      </div>
                      <div className="bg-white p-2.5 rounded-xl border border-stone-100">
                        <p className="text-[10px] text-stone-400 font-bold uppercase">Confidence Score</p>
                        <p className="text-base font-extrabold text-stone-800 mt-1">{statConfidencePercent}</p>
                      </div>
                    </div>

                    {/* Raw Response logs */}
                    <div>
                      <span className="text-[9px] font-bold text-stone-400 uppercase">Phonemic Raw Recognized String</span>
                      <div className="w-full min-h-[44px] bg-stone-900 text-green-400 font-mono text-[11px] p-2.5 rounded-lg mt-1 whitespace-pre-wrap break-all">
                        {rawSpeechTranscript}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="bg-stone-100 p-3 px-6 border-t border-stone-200 flex justify-end">
              <button
                onClick={() => {
                  playAudioChime('success');
                  setIsSettingsOpen(false);
                }}
                className="bg-forestGreen hover:brightness-105 text-white font-baloo font-bold text-xs px-6 py-2 rounded-xl shadow-sm transition-all active:scale-95 cursor-pointer"
              >
                Save & Close ✓
              </button>
            </div>
          </div>
        </div>
      )}

      {/* FOOTER */}
      <footer className="bg-stone-950 text-stone-400 py-6 px-4 text-center mt-auto border-t border-stone-800/40 text-xs">
        <p className="font-bold text-stone-300">VOICE UP © Classroom Adaptive Tech Initiative.</p>
        <p className="mt-1 text-stone-500">Empowering ESL primary classrooms with immediate vocal guidance and confidence gamification loops.</p>
      </footer>
    </div>
  );
};

export default App;

