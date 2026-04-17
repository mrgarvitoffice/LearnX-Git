
/**
 * @fileoverview Configures and exports Genkit AI clients for the application.
 */

import {genkit} from 'genkit';
import {googleAI} from '@genkit-ai/googleai';

// Retrieve all potential API keys from environment variables
const GOOGLE_API_KEY = process.env.GOOGLE_API_KEY;
const GOOGLE_API_KEY_NOTES = process.env.GOOGLE_API_KEY_NOTES;
const GOOGLE_API_KEY_CHATBOT = process.env.GOOGLE_API_KEY_CHATBOT;
const GOOGLE_API_KEY_IMAGES = process.env.GOOGLE_API_KEY_IMAGES;
const GOOGLE_API_KEY_QUIZZES = process.env.GOOGLE_API_KEY_QUIZZES;
const GOOGLE_API_KEY_TTS = process.env.GOOGLE_API_KEY_TTS;
const GOOGLE_API_KEY_ASSISTANT = process.env.GOOGLE_API_KEY_ASSISTANT;

const isApiKeyMissingOrPlaceholder = (keyToCheck?: string) => {
  return !keyToCheck || keyToCheck.trim() === '';
};

// --- Main AI Client ---
export const ai = genkit({
  plugins: [googleAI({apiKey: GOOGLE_API_KEY})],
  enableTracingAndMetrics: true,
});

// --- Notes-Specific AI Client ---
const notesApiKey = !isApiKeyMissingOrPlaceholder(GOOGLE_API_KEY_NOTES) ? GOOGLE_API_KEY_NOTES : GOOGLE_API_KEY;
export const aiForNotes = genkit({
  plugins: [googleAI({apiKey: notesApiKey})],
  enableTracingAndMetrics: true,
});

// --- Chatbot-Specific AI Client ---
const chatbotApiKey = !isApiKeyMissingOrPlaceholder(GOOGLE_API_KEY_CHATBOT) ? GOOGLE_API_KEY_CHATBOT : GOOGLE_API_KEY;
export const aiForChatbot = genkit({
  plugins: [googleAI({apiKey: chatbotApiKey})],
  enableTracingAndMetrics: true,
});

// --- Image Generation AI Client ---
let imageApiKey = GOOGLE_API_KEY_IMAGES || GOOGLE_API_KEY_NOTES || GOOGLE_API_KEY;
export const aiForImages = genkit({
  plugins: [googleAI({apiKey: imageApiKey})],
  enableTracingAndMetrics: true,
});

// --- Quizzes AI Client ---
const quizzesApiKey = !isApiKeyMissingOrPlaceholder(GOOGLE_API_KEY_QUIZZES) ? GOOGLE_API_KEY_QUIZZES : GOOGLE_API_KEY;
export const aiForQuizzes = genkit({
  plugins: [googleAI({apiKey: quizzesApiKey})],
  enableTracingAndMetrics: true,
});

// --- TTS AI Client ---
const ttsApiKey = !isApiKeyMissingOrPlaceholder(GOOGLE_API_KEY_TTS) ? GOOGLE_API_KEY_TTS : GOOGLE_API_KEY;
export const aiForTTS = genkit({
    plugins: [googleAI({ apiKey: ttsApiKey })],
    enableTracingAndMetrics: true,
});

// --- Assistant (Jarvis) AI Client ---
// Using fallback if specific assistant key is missing.
const assistantApiKey = !isApiKeyMissingOrPlaceholder(GOOGLE_API_KEY_ASSISTANT) ? GOOGLE_API_KEY_ASSISTANT : GOOGLE_API_KEY;
export const aiForAssistant = genkit({
    plugins: [googleAI({ apiKey: assistantApiKey })],
    enableTracingAndMetrics: true,
});
