import type { NextApiRequest, NextApiResponse } from 'next'
import formidable from 'formidable'
import { getUserApiKey } from '@/utils/settings';
// New (i.e., OpenAI NodeJS SDK v4)
import OpenAI from "openai";

const form = formidable({ multiples: true })

const handler = async (
  req: NextApiRequest,
  res: NextApiResponse
) => {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' })
  }
  let openAIApiKey = process.env.OPENAI_API_KEY || getUserApiKey();
  const { openaikey,threadid } = req.query;
  if(openaikey !==  undefined) openAIApiKey = openaikey[0]
  console.info(`UserOpenAIApiKey : ${openAIApiKey}`)
  console.info(`threadid : ${threadid}`)
  if(threadid === undefined || openAIApiKey === undefined ){
    return res.status(401).json({ message: 'Invalid threadid or openaikey!' })
  }
  const openai = new OpenAI({
    apiKey: openAIApiKey,
  });
  const threadMessages = await openai.beta.threads.messages.list(
    threadid.toString()
  );
  console.log(threadMessages.data);
  res.status(200).json(threadMessages.data);
}

export default handler