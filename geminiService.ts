
import { GoogleGenAI } from "@google/genai";
import { GameState } from "./types";

export async function getTacticalAdvice(gameState: GameState): Promise<string> {
  // Initialize GoogleGenAI inside the function to use the most up-to-date API key from process.env.API_KEY
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  try {
    const prompt = `
      You are "Crazy Dave", a wacky but brilliant garden strategist. 
      Analyze the current game state:
      - Current Sun: ${gameState.sun}
      - Wave: ${gameState.wave}
      - Active Plants: ${gameState.plants.length}
      - Active Zombies: ${gameState.zombies.length}
      - Score: ${gameState.score}
      
      Give a short, funny, tactical tip (max 2 sentences) for the player. 
      Use your signature "Wabby Wabbo" style.
    `;

    // Perform content generation using the specified model and prompt
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
      config: {
        temperature: 0.9,
        // Recommendation: set thinkingBudget to 0 for simple text tasks to ensure low latency
        thinkingConfig: { thinkingBudget: 0 }
      }
    });

    return response.text || "Keep planting, the brain-munchers are coming!";
  } catch (error) {
    console.error("Gemini Advice Error:", error);
    return "Webby Wabbo! Just keep planting things!";
  }
}
