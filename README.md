<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# Run and deploy your AI Studio app

This contains everything you need to run your app locally.

View your app in AI Studio: https://ai.studio/apps/558ccd0c-66b5-4c6e-92ff-1ffcc00c44f9

## Run Locally

**Prerequisites:**  Node.js


1. Install dependencies:
   `npm install`
2. Set `OPENAI_API_KEY` in `.env.local`
   `OPEN_AI_API` is also accepted for compatibility with an existing Vercel variable, but `OPENAI_API_KEY` is the preferred name.
3. Run the app:
   `npm run dev`

## OpenAI setup

- The frontend no longer calls a model provider directly from the browser.
- Vercel uses `api/chat.js` as a server-side proxy to the OpenAI Responses API.
- Default model: `gpt-4.1`
- Optional override: set `OPENAI_MODEL` on Vercel or in `.env.local`
