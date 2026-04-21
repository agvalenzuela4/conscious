import { GoogleGenAI, Type } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

export const generateReflection = async (journalText: string, mood: string) => {
  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: `The user wrote a journal entry and is feeling ${mood}. Entry: "${journalText}". 
    Provide a short, empathetic reflection (max 3 sentences) and one personalized prompt to help them process their emotions or set an intention.`,
  });
  return response.text;
};

export const continueJournalConversation = async (
  originalEntry: string,
  mood: string,
  reflection: string | undefined,
  thread: { role: string; text: string }[],
  userReply: string
) => {
  let context = `The user originally wrote a journal entry feeling ${mood}. Entry: "${originalEntry}".\n`;
  if (reflection) context += `Your first reflection was: "${reflection}".\n`;
  
  // Format previous thread
  let history = "";
  for (const msg of thread) {
    history += `${msg.role === "user" ? "User" : "AI Coach"}: ${msg.text}\n`;
  }
  
  if (history) context += `Here is the conversation history so far:\n${history}\n`;
  
  context += `User's new message: "${userReply}"\n`;
  context += `Provide a short, empathetic, active-listening response. Act as a supportive, conscious AI coach. Avoid being too repetitive. Keep it conversational and around 1-3 sentences.`;

  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: context,
  });
  return response.text;
};

export const generateWorkout = async (
  energyLevel: string,
  recentMood: string,
  localTime?: string,
  weather?: string,
  workoutType?: string,
) => {
  let context = `The user has ${energyLevel} energy today and recently felt ${recentMood}.`;
  if (localTime) context += ` Their current local time is ${localTime}.`;
  if (weather) context += ` The weather outside is ${weather}.`;

  let prompt = "";
  const baseConfig: any = {};

  if (workoutType) {
    context += ` They specifically want to focus on: ${workoutType}.`;
    prompt = `${context}\n\nProvide an array of 2-3 distinct choices for their workout today.
1. An at-home or outdoor routine: Provide a highly specific ${workoutType} routine or suggest a YouTube search term for a ${energyLevel} energy ${workoutType} workout. If the weather is nice, suggest they do it outdoors mapping to their local time/weather.
2. A local studio: Suggest 1 or 2 real or highly-rated local workout studios or classes conceptually for ${workoutType} that match a ${energyLevel} energy vibe.

Format as a clean, encouraging list. Be concise. CRITICAL: Do NOT use any asterisks (*) or markdown bolding. Use dashes (-) for bullets.`;
  } else {
    prompt = `${context}\n\nProvide 2 distinct choices for their movement routine.
1. A personalized at-home or outdoor movement routine matching their ${energyLevel} energy. If the weather is nice, suggest doing it outdoors.
2. A mindful, alternative relaxing activity or stretch.

Format as a clean, encouraging list. Be concise. CRITICAL: Do NOT use any asterisks (*) or text formatting. Use dashes (-) for bullets.`;
  }

  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: prompt,
    config: Object.keys(baseConfig).length > 0 ? baseConfig : undefined,
  });
  
  // Strip any rogue asterisks just in case
  return response.text?.replace(/\*/g, '') || '';
};

export const generateRecipe = async (ingredients: string, diet: string, allergies: string, appliances: string, comfortLevel: string, timeCommitment: string) => {
  let requirements = "";
  if (diet) requirements += ` The recipe MUST strictly adhere to this diet/preference: ${diet}.`;
  if (allergies) requirements += ` The recipe MUST strictly completely exclude these allergens/restrictions: ${allergies}.`;
  if (appliances) requirements += ` The recipe MUST be cookable using ONLY these appliances (or require no appliances): ${appliances}.`;
  if (comfortLevel) requirements += ` The recipe MUST be appropriate for a ${comfortLevel.toLowerCase()} home cook in terms of cooking technique and complexity.`;
  if (timeCommitment) requirements += ` The recipe MUST be achievable within this total time commitment (prep + cook time): ${timeCommitment}.`;

  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: `The user has these ingredients: ${ingredients}.${requirements}
    Suggest a healthy, low-environmental-impact recipe. 
    IMPORTANT: The very first line of your response MUST be the recipe name formatted as an H1 heading (e.g., # Spicy Chickpea Curry).
    Also provide a brief estimate of its nutritional value and carbon footprint.`,
  });
  return response.text;
};

export const generateShoppingList = async (diet: string, allergies: string, mealIdeas: string) => {
  const reqs = [];
  if (diet) reqs.push(`Dietary preferences: ${diet}.`);
  if (allergies) reqs.push(`Allergies to avoid entirely: ${allergies}.`);
  const reqStr = reqs.length > 0 ? ` Please customize the list for the following conditions: ${reqs.join(" ")}` : "";

  let mealPrompt = "Generate a practical, low-carbon, sustainable grocery shopping list of 10 staple items.";
  if (mealIdeas) {
     mealPrompt = `The user is planning the following meals for the week: "${mealIdeas}". Generate a sustainable grocery shopping list tailored to these meals. Focus on lean/sustainable proteins (fish, chicken, turkey, tofu, legumes - AVOID red meat and processed foods), abundant vegetables, whole grains, and fruits. In the list, you MUST add small contextual hints linking the item to the meal idea (e.g., "Chicken breast (for Mexican Bowl)"). Provide around 10-15 items.`;
  }

  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: `${mealPrompt}${reqStr} Return ONLY a JSON object with this exact shape: { "suggestions": "A supportive string analyzing the meal ideas and offering slight sustainable modifications if needed", "items": ["array", "of", "strings"] }. No markdown wrapping, no formatting.`,
    config: {
      responseMimeType: "application/json",
    }
  });

  try {
    const data = JSON.parse(response.text || "{}");
    return {
      suggestions: data.suggestions || "",
      items: Array.isArray(data.items) ? data.items : []
    };
  } catch (e) {
    return { suggestions: "", items: [] };
  }
};

export const generateMeditationAudio = async (script: string) => {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3.1-flash-tts-preview",
      contents: [{ parts: [{ text: `Read this calmly and slowly with an Australian accent, like a relaxing nature documentary or a soothing bedtime story. Pause gracefully at punctuation:\n\n${script}` }] }],
      config: {
        responseModalities: ["AUDIO" as any],
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: { voiceName: 'Kore' },
          },
        },
      },
    });
    return response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
  } catch (err) {
    console.error("Audio generation failed:", err);
    return null;
  }
};

export const generateMeditation = async (
  intention: string,
  recentJournal: string,
  durationMins: number,
  localTime?: string
) => {
  let timeContext = localTime ? ` The current local time is ${localTime}. Please ensure your suggested location/setting in the first sentence makes logical sense for this time of day (e.g., do not suggest sitting under the sun if it is 11:00 PM).` : "";
  
  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: `The user wants to meditate for ${durationMins} minutes. Their focus/mood/intention is: "${intention}". Their recent journal entry was: "${recentJournal}".${timeContext}
    First, provide a 1-sentence suggestion on where they should meditate based on their intention (e.g., "Since you're feeling anxious, try taking this meditation outside in the grass." or "Find a quiet, comfortable place to lay down.").
    Then, add two newlines, and write a calming guided meditation script broken into exactly 4 or 5 separate paragraphs. The textual length of this script must remain roughly the same regardless of the duration length. Do not use asterisks or markdown, just plain text separated by double newlines.`,
  });
  return response.text;
};

export const analyzeClothing = async (
  base64Image: string,
  mimeType: string,
) => {
  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: {
      parts: [
        {
          inlineData: {
            data: base64Image,
            mimeType: mimeType,
          },
        },
        {
          text: "Analyze this clothing item. Describe it briefly (e.g., 'Blue denim jacket') and categorize it (e.g., 'Top', 'Bottom', 'Outerwear', 'Shoes', 'Accessory'). Return JSON with 'description' and 'category'.",
        },
      ],
    },
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          description: { type: Type.STRING },
          category: { type: Type.STRING },
        },
        required: ["description", "category"],
      },
    },
  });

  try {
    return JSON.parse(response.text || "{}");
  } catch (e) {
    return { description: "Unknown item", category: "Other" };
  }
};

export const suggestOutfit = async (
  wardrobeDescriptions: string[],
  occasion: string,
) => {
  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: `The user has these items in their wardrobe: ${wardrobeDescriptions.join(", ")}. 
    Suggest an outfit for ${occasion}. Also suggest one thrift alternative or sustainable addition they could look for to complete the look.`,
  });
  return response.text;
};

export const getSustainableBuyingAdvice = async (intent: string) => {
  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: `The user is looking to buy: "${intent}".
Provide mindful, sustainable buying advice for this item.
Include:
1. 2-3 sustainable or ethical brands they could look into (or general places like local thrift stores / specific secondhand platforms).
2. Fibers and materials to look for (which are good for the environment, like organic cotton, linen, hemp, Tencel).
3. Fibers and materials to strictly avoid (e.g., virgin polyester, acrylic, nylon) due to microplastics or high carbon footprint.
4. A gentle reminder to avoid fast fashion and why purchasing mindfully matters.

Format cleanly with markdown, using bullet points or numbered lists. Break it up with a gentle, encouraging tone. Keep it relatively concise but informative.`,
  });
  return response.text;
};

export const continueSustainableBuyingAdvice = async (
  originalIntent: string,
  thread: { role: string; text: string }[],
  userReply: string
) => {
  let context = `The user is looking to buy: "${originalIntent}". We provided them with an initial sustainable buying guide.\n`;
  
  // Format previous thread
  let history = "";
  for (const msg of thread) {
    history += `${msg.role === "user" ? "User" : "AI Shopping Guide"}: ${msg.text}\n`;
  }
  
  if (history) context += `Here is the conversation history so far:\n${history}\n`;
  
  context += `User's new message: "${userReply}"\n`;
  context += `Respond to the user's message as a helpful, conscious AI shopping assistant. If they ask about pricing, styles, or specific alternatives, provide thoughtful sustainable answers. Keep it conversational and format cleanly using markdown if helpful.`;

  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: context,
  });
  return response.text;
};
