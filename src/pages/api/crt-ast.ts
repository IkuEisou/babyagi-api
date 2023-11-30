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
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' })
  }
  let openAIApiKey = process.env.OPENAI_API_KEY || getUserApiKey();
  const { openaikey,instructions,name } = req.body;
  if(openaikey !==  undefined) openAIApiKey = openaikey[0];
  let instruction = "You are a personal math tutor. When asked a question, write and run Python code to answer the question." 
  if(instructions !== undefined){
    instruction = instructions
  }
  let astName =  "Math Tutor";
  if(name !== undefined)  astName = name;

  // console.log(`instruction : ${instruction}`)
  // console.log(`name : ${name}`)
  // res.status(200).send({"instruction": instruction,"name":name});

  const openai = new OpenAI({
    apiKey: openAIApiKey,
  });
  const myAssistant = await openai.beta.assistants.create({
    instructions:instruction,
    name:  astName,
    tools: [{ type: "code_interpreter" }],
    model: "gpt-4",
  });


  res.status(200).json(myAssistant);
}

export default handler