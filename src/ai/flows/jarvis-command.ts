
'use server';
/**
 * @fileoverview Defines the J.A.R.V.I.S. command processing flow using Gemini 2.0 Flash Lite.
 */

import { aiForAssistant } from '@/ai/genkit';
import type { UserGoal } from '@/lib/types';
import { z } from 'zod';

const AssistantCommandInputSchema = z.object({
  command: z.string().describe("The voice or text command from the user."),
  context: z.string().optional().describe("Current page path."),
  userGoal: z.custom<UserGoal>().optional().describe("User learning profile."),
  mode: z.enum(['jarvis']).default('jarvis'),
  language: z.string().optional().describe("Target language."),
});

const AssistantCommandOutputSchema = z.object({
  action: z.string(),
  params: z.any().optional(),
  verbal_response: z.string(),
});

export type AssistantCommandOutput = z.infer<typeof AssistantCommandOutputSchema>;

export async function processAssistantCommand(input: z.infer<typeof AssistantCommandInputSchema>): Promise<AssistantCommandOutput> {
  return await assistantCommandFlow(input);
}

const assistantCommandFlow = aiForAssistant.defineFlow(
  {
    name: 'assistantCommandFlow',
    inputSchema: AssistantCommandInputSchema,
    outputSchema: AssistantCommandOutputSchema,
  },
  async (input) => {
    const { output } = await aiForAssistant.generate({
        model: 'googleai/gemini-2.0-flash-lite-preview-02-05',
        prompt: `You are J.A.R.V.I.S., the elite core AI for LearnX. Your personality is professional, technical, and precise.
        
        Analyze command: "${input.command}" at context: "${input.context}".
        Respond in language: ${input.language || 'English'}.
        
        Action mapping:
        - navigate: { target: string } (Valid targets: /dashboard, /notes, /custom-test, /library, /coding, /news, /profile, /scheduler)
        - generate_notes: { topic: string }
        - generate_test: { topic: string, difficulty: string }
        - read_news: { category: string }
        - search_youtube: { query: string }
        - logout: {}
        - chat: {}
        
        Rules:
        1. If user says 'Jarvis', return action 'chat' with verbal_response 'Yes sir, how may I assist you?'.
        2. If the user wants to build or code, navigate to '/coding'.
        3. If the user wants news, use 'read_news' or navigate to '/news'.
        
        Return ONLY a single valid JSON object. No markdown backticks. No conversational filler.`,
    });
    return output!;
  }
);
