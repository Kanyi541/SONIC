import {genkit} from 'genkit';
import {googleAI} from '@genkit-ai/googleai';

// Code by 39883909
export const ai = genkit({
  plugins: [googleAI()],
  model: 'googleai/gemini-2.0-flash',
});
// Code by 39883909
