import Groq from 'groq-sdk';
import dotenv from 'dotenv';
dotenv.config();

const client = new Groq({ apiKey: process.env.GROQ_API_KEY });

async function listModels() {
  const models = await client.models.list();
  console.log('Available models:', models.data.map(m => m.id));
}
listModels().catch(console.error);
