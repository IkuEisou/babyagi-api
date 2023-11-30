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
    const { openaikey,thread_id, assistant_id } = req.body;
    if(openaikey !==  undefined) openAIApiKey = openaikey[0];
    const openai = new OpenAI({
      apiKey: openAIApiKey,
    });

    if(assistant_id !== undefined && thread_id  !== undefined){
      const run = await openai.beta.threads.runs.create(
        thread_id,
        { assistant_id: assistant_id }
      );
      res.status(200).json(run);
    }else{
      res.status(400).send({ message: 'Bad Request.Please input the thread_id and assistant_id'})
    }
  } catch (err) {
    console.error(err)
    res.status(400).send({ message: 'Bad Request'})
  }
}

export default handler