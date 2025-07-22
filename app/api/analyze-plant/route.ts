import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextResponse } from "next/server";

// Initialize the Gemini API with your API key
const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY || "");

// Track API usage
let requestCount = 0;
const DAILY_LIMIT = 60; // Free tier limit per minute
const requestLog: { timestamp: number; count: number }[] = [];

// Function to check rate limits
function checkRateLimit() {
  const now = Date.now();
  const oneMinuteAgo = now - 60000; // 1 minute in milliseconds
  
  // Remove requests older than 1 minute
  while (requestLog.length > 0 && requestLog[0].timestamp < oneMinuteAgo) {
    requestLog.shift();
  }
  
  // Count requests in the last minute
  const recentRequests = requestLog.reduce((sum, log) => sum + log.count, 0);
  
  return recentRequests < DAILY_LIMIT;
}

export async function POST(req: Request) {
  try {
    // Check rate limit
    if (!checkRateLimit()) {
      return NextResponse.json(
        { 
          error: 'Rate limit exceeded. Please try again in a minute.',
          remainingRequests: DAILY_LIMIT - requestLog.reduce((sum, log) => sum + log.count, 0)
        },
        { status: 429 }
      );
    }

    const { image } = await req.json();

    if (!image) {
      return NextResponse.json(
        { error: 'No image data provided' },
        { status: 400 }
      );
    }

    // Initialize the model with gemini-1.5-flash
    const model = genAI.getGenerativeModel({ 
      model: "gemini-1.5-flash",
      generationConfig: {
        temperature: 0.4,
        topK: 32,
        topP: 1,
        maxOutputTokens: 2048,
      },
    });

    const prompt = `You are a plant disease detection expert. Analyze this plant image and provide a detailed report with the following information:
1. Plant Identification: Identify the type of plant if possible
2. Health Assessment: Identify if there are any diseases or health issues
3. Symptoms Analysis: Detailed description of any visible symptoms or issues
4. Disease Identification: Name of the specific disease if identifiable
5. Treatment Plan: Recommended treatments and remedies
6. Prevention Strategy: Steps to prevent similar issues in the future

Please format your response clearly with appropriate headings for each section.`;

    try {
      // Log this request
      requestCount++;
      requestLog.push({ timestamp: Date.now(), count: 1 });

      // First, try with the image as base64
      const contents = [
        {
          text: prompt
        },
        {
          inlineData: {
            mimeType: "image/jpeg",
            data: image.split(',')[1] // Remove the data URL prefix
          }
        }
      ];

      const result = await model.generateContent(contents);
      const response = await result.response;
      const text = response.text();

      if (!text) {
        throw new Error('No analysis generated');
      }

      // Calculate remaining requests
      const remainingRequests = DAILY_LIMIT - requestLog.reduce((sum, log) => sum + log.count, 0);

      return NextResponse.json({
        analysis: text,
        requestCount,
        remainingRequests,
        resetIn: Math.ceil((requestLog[0]?.timestamp + 60000 - Date.now()) / 1000) // seconds until reset
      });

    } catch (imageError) {
      // If the first attempt fails, try with just the URL if it's a URL
      if (image.startsWith('http')) {
        const urlContents = [
          {
            text: prompt
          },
          {
            inlineData: {
              mimeType: "image/jpeg",
              data: image
            }
          }
        ];

        const urlResult = await model.generateContent(urlContents);
        const urlResponse = await urlResult.response;
        const urlText = urlResponse.text();

        if (!urlText) {
          throw new Error('No analysis generated');
        }

        // Calculate remaining requests
        const remainingRequests = DAILY_LIMIT - requestLog.reduce((sum, log) => sum + log.count, 0);

        return NextResponse.json({
          analysis: urlText,
          requestCount,
          remainingRequests,
          resetIn: Math.ceil((requestLog[0]?.timestamp + 60000 - Date.now()) / 1000) // seconds until reset
        });
      } else {
        throw imageError;
      }
    }

  } catch (error: any) {
    console.error('Error analyzing plant:', error);
    
    let errorMessage = error.message || 'Failed to analyze plant image';
    
    // Check for specific error types
    if (error.message?.includes('not found')) {
      errorMessage = 'The AI model is currently unavailable. Please try again later.';
    } else if (error.message?.includes('invalid')) {
      errorMessage = 'Invalid image format. Please upload a valid JPEG or PNG image.';
    } else if (error.message?.includes('quota')) {
      errorMessage = 'API quota exceeded. Please try again later.';
    }
    
    return NextResponse.json(
      { 
        error: errorMessage,
        details: process.env.NODE_ENV === 'development' ? error.toString() : undefined,
        requestCount,
        remainingRequests: DAILY_LIMIT - requestLog.reduce((sum, log) => sum + log.count, 0)
      },
      { status: 500 }
    );
  }
}

// Increase the maximum request size limit
export const config = {
  api: {
    bodyParser: {
      sizeLimit: '10mb',
    },
  },
}; 