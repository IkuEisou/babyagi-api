import type { NextApiRequest, NextApiResponse } from 'next'
import { getUserApiKey } from '@/utils/settings';
// New (i.e., OpenAI NodeJS SDK v4)
import OpenAI from "openai";

const handler = async (
  req: NextApiRequest,
  res: NextApiResponse
) => {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' })
  }
  try {
    let openAIApiKey = process.env.OPENAI_API_KEY || getUserApiKey();
    const { openaikey,messages } = req.body;
    if(openaikey !==  undefined) openAIApiKey = openaikey[0];
    const openai = new OpenAI({
      apiKey: openAIApiKey,
    });

    if(messages === undefined){
      const emptyThread = await openai.beta.threads.create();
      res.status(200).json(emptyThread);
    }else {
      const messageThread = await openai.beta.threads.create({
        messages: messages,
      });
      res.status(200).json(messageThread);
    }
  } catch (err) {
    console.error(err)
    res.status(400).send({ message: 'Bad Request'})
  }
}

export default handler