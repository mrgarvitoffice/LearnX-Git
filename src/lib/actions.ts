'use server';
/**
 * @fileoverview Defines the primary server actions for the application.
 */

import { generateStudyNotes, type GenerateStudyNotesInput, type GenerateStudyNotesOutput } from "@/ai/flows/generate-study-notes";
import { generateQuizQuestions, type GenerateQuizQuestionsInput, type GenerateQuizQuestionsOutput } from "@/ai/flows/generate-quiz-questions";
import { generateFlashcards, type GenerateFlashcardsInput, type GenerateFlashcardsOutput } from "@/ai/flows/generate-flashcards";
import { generateQuizFromNotes, type GenerateQuizFromNotesInput } from "@/ai/flows/generate-quiz-from-notes";
import { generateFlashcardsFromNotes, type GenerateFlashcardsFromNotesInput } from "@/ai/flows/generate-flashcards-from-notes";
import { generateAudioSummary, type GenerateAudioSummaryInput, type GenerateAudioSummaryOutput } from "@/ai/flows/generate-audio-summary";

import type { YoutubeSearchInput, YoutubeSearchOutput, GoogleBooksSearchInput, GoogleBooksSearchOutput, CombinedStudyMaterialsOutput } from './types';

const maxDuration = 60; 

/**
 * generateNotesAction (Combined Material Generation)
 */
export async function generateNotesAction(input: GenerateStudyNotesInput): Promise<CombinedStudyMaterialsOutput> {
  const actionName = "generateNotesAction (combined)";
  console.log(`[Server Action] ${actionName} called for topic: ${input.topic}`);

  if (typeof input.topic !== 'string') {
    throw new Error(`[Server Action - ${actionName}] Critical error: Topic must be a string.`);
  }
  
  const trimmedTopic = input.topic.trim();

  let notesResult: GenerateStudyNotesOutput | undefined;
  let notesGenError: string | undefined;

  try {
    notesResult = await generateStudyNotes({
      topic: trimmedTopic,
      image: input.image,
      notes: input.notes,
      audio: input.audio,
      video: input.video
    });
    if (!notesResult || !notesResult.notes) {
      throw new Error("AI returned empty or invalid notes data.");
    }
  } catch (error: any) {
    console.error(`[Server Action Error - ${actionName} - Notes Gen] Error generating notes:`, error);
    notesGenError = error.message;
  }
  
  if (!notesResult?.notes) {
     return {
        notesOutput: { notes: "" },
        notesError: notesGenError || "Primary notes generation failed to produce content.",
        quizError: "Skipped due to notes failure.",
        flashcardsError: "Skipped due to notes failure.",
    };
  }

  // Neural Strip Logic: Remove base64 images from notes before passing to logic generators to avoid token limits
  const cleanNotes = notesResult.notes.replace(/!\[.*?\]\(data:image\/.*?;base64,.*?\)/g, "[IMAGE]");

  const quizInput: GenerateQuizFromNotesInput = { notesContent: cleanNotes, numQuestions: 15 };
  const flashcardsInput: GenerateFlashcardsFromNotesInput = { notesContent: cleanNotes, numFlashcards: 10 };

  let quizData: GenerateQuizQuestionsOutput | undefined;
  let flashcardsData: GenerateFlashcardsOutput | undefined;
  let quizGenError: string | undefined;
  let flashcardsGenError: string | undefined;

  const results = await Promise.allSettled([
    generateQuizFromNotes(quizInput),
    generateFlashcardsFromNotes(flashcardsInput)
  ]);

  const quizResultOutcome = results[0];
  if (quizResultOutcome.status === 'fulfilled') {
    if (quizResultOutcome.value?.questions?.length > 0) {
      quizData = quizResultOutcome.value;
    } else {
      quizGenError = "AI returned no quiz questions.";
    }
  } else {
    quizGenError = quizResultOutcome.reason?.message || "Failed to generate quiz.";
  }

  const flashcardsResultOutcome = results[1];
  if (flashcardsResultOutcome.status === 'fulfilled') {
     if (flashcardsResultOutcome.value?.flashcards?.length > 0) {
      flashcardsData = flashcardsResultOutcome.value;
    } else {
      flashcardsGenError = "AI returned no flashcards.";
    }
  } else {
    flashcardsGenError = flashcardsResultOutcome.reason?.message || "Failed to generate flashcards.";
  }

  return {
    notesOutput: notesResult,
    quizOutput: quizData,
    flashcardsOutput: flashcardsData,
    quizError: quizGenError,
    flashcardsError: flashcardsGenError,
  };
}

/**
 * generateQuizAction (Standalone Quiz Generation)
 */
export async function generateQuizAction(input: GenerateQuizQuestionsInput): Promise<GenerateQuizQuestionsOutput> {
  const actionName = "generateQuizAction (standalone)";
  console.log(`[Server Action] ${actionName} called for topic: ${input.topic}`);

  if (typeof input.topic !== 'string') {
    throw new Error(`[Server Action - ${actionName}] Critical error: Topic must be a string.`);
  }
  const trimmedTopic = input.topic.trim();

  try {
    let result;
    if (input.notes) {
      result = await generateQuizFromNotes({
        notesContent: input.notes,
        numQuestions: input.numQuestions,
      });
    } else {
      result = await generateQuizQuestions({ 
          ...input, 
          topic: trimmedTopic,
          image: input.image,
          audio: input.audio,
          video: input.video
      });
    }

    if (!result || !result.questions || result.questions.length === 0) {
      throw new Error("AI returned empty quiz data.");
    }
    return result;
  } catch (error: any) {
    console.error(`[Server Action Error - ${actionName}] Error generating quiz:`, error);
    throw new Error(error.message || "Failed to generate quiz.");
  }
}

/**
 * generateFlashcardsAction (Standalone Flashcard Generation)
 */
export async function generateFlashcardsAction(input: GenerateFlashcardsInput): Promise<GenerateFlashcardsOutput> {
  const actionName = "generateFlashcardsAction (standalone)";
  console.log(`[Server Action] ${actionName} called for topic: ${input.topic}`);

  if (typeof input.topic !== 'string') {
    throw new Error(`[Server Action - ${actionName}] Critical error: Topic must be a string.`);
  }
  const trimmedTopic = input.topic.trim();

  try {
    const result = await generateFlashcards({ ...input, topic: trimmedTopic });
     if (!result || !result.flashcards || result.flashcards.length === 0) {
      throw new Error("AI returned empty flashcard data.");
    }
    return result;
  } catch (error: any) {
    console.error(`[Server Action Error - ${actionName}] Error generating flashcards:`, error);
    throw new Error(error.message || "Failed to generate flashcards.");
  }
}

/**
 * generateAudioSummaryAction
 */
export async function generateAudioSummaryAction(input: GenerateAudioSummaryInput): Promise<GenerateAudioSummaryOutput> {
  console.log(`[Server Action] generateAudioSummaryAction called.`);
  try {
    return await generateAudioSummary(input);
  } catch (error: any) {
    console.error("[Server Action Error - Audio Summary] Error:", error.message);
    throw new Error(error.message || "Failed to generate audio summary.");
  }
}

/**
 * directYoutubeSearch
 */
export async function directYoutubeSearch(input: YoutubeSearchInput): Promise<YoutubeSearchOutput> {
  const apiKey = process.env.YOUTUBE_API_KEY;
  if (!apiKey) throw new Error('YouTube API key is not configured.');

  const params = new URLSearchParams({
    key: apiKey,
    part: 'snippet',
    q: input.query.trim(),
    type: 'video',
    maxResults: (input.maxResults || 8).toString(),
  });

  try {
    const response = await fetch(`https://www.googleapis.com/youtube/v3/search?${params.toString()}`);
    if (!response.ok) throw new Error(`YouTube API request failed.`);
    const data = await response.json();
    const videos = data.items?.map((item: any) => ({
      videoId: item.id.videoId,
      title: item.snippet.title,
      description: item.snippet.description,
      thumbnailUrl: item.snippet.thumbnails.medium?.url || item.snippet.thumbnails.default?.url,
      channelTitle: item.snippet.channelTitle,
      publishedAt: item.snippet.publishedAt,
    })) || [];
    return { videos };
  } catch (error: any) {
    throw new Error(error.message || "Failed to fetch YouTube videos.");
  }
}

/**
 * directGoogleBooksSearch
 */
export async function directGoogleBooksSearch(input: GoogleBooksSearchInput): Promise<GoogleBooksSearchOutput> {
  const apiKey = process.env.GOOGLE_BOOKS_API_KEY;
  if (!apiKey) throw new Error('Google Books API key is not configured.');

  const params = new URLSearchParams({
    q: input.query.trim(),
    maxResults: (input.maxResults || 9).toString(),
    key: apiKey
  });
  
  try {
    const response = await fetch(`https://www.googleapis.com/books/v1/volumes?${params.toString()}`);
    if (!response.ok) throw new Error(`Google Books API request failed.`);
    const data = await response.json();
    const books = data.items?.map((item: any) => ({
      bookId: item.id,
      title: item.volumeInfo?.title,
      authors: item.volumeInfo?.authors || [],
      description: item.volumeInfo?.description,
      thumbnailUrl: item.volumeInfo?.imageLinks?.thumbnail,
      publishedDate: item.volumeInfo?.publishedDate,
      pageCount: item.volumeInfo?.pageCount,
      infoLink: item.volumeInfo?.infoLink,
      embeddable: item.accessInfo?.embeddable || false,
      previewLink: item.volumeInfo?.previewLink,
      webReaderLink: item.accessInfo?.webReaderLink,
    })).filter((book: any) => book.title) || [];
    return { books };
  } catch (error: any) {
    throw new Error(error.message || "Failed to fetch Google Books.");
  }
}