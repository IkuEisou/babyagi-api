import type { NextApiRequest, NextApiResponse } from 'next'
import { getUserApiKey } from '@/utils/settings';
// New (i.e., OpenAI NodeJS SDK v4)
import OpenAI from "openai";
import { setTimeout } from "timers/promises";

const handler = async (
  req: NextApiRequest,
  res: NextApiResponse
) => {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' })
  }
  try {
    let openAIApiKey = process.env.OPENAI_API_KEY || getUserApiKey();
    const { openaikey,instructions,name,file_ids,thread_id, assistant_id, run_id, keywords,msg_query_times,interval_seconds } = req.body;
    if(openaikey !==  undefined) openAIApiKey = openaikey[0];
    const openai = new OpenAI({
      apiKey: openAIApiKey,
    });
    let ast_id = assistant_id;
    let instruction = "You are a personal math tutor. When asked a question, write and run Python code to answer the question." 
    let astName =  "Math Tutor";
    if(assistant_id === undefined){
      if(instructions !== undefined){
        instruction = instructions
      }
      if(name !== undefined)  astName = name;
      const myAssistant = await openai.beta.assistants.create({
        instructions:instruction,
        name:  astName,
        tools: [{ type: "code_interpreter" }],
        model: "gpt-4",
      });
      ast_id = myAssistant.id
      console.info(`myAssistant id: ${myAssistant.id}`)
      await setTimeout(10000);
      console.log("Waited 10s");
    }
    else{
      const myAssistant = await openai.beta.assistants.retrieve(
        assistant_id
      );
      if(myAssistant.id !== assistant_id){
        console.info(`assistant_id ${assistant_id} not found!`)
        res.status(400).send({ message: `Assistant id ${assistant_id} not found!`})
      }
    }
    let th_id = thread_id;
    if(thread_id === undefined){
      const messageThread = await openai.beta.threads.create({
        messages: [
          {
            role: "user",
            content: instruction,
            // file_ids: file_ids || '',
          }
        ]
      });
      th_id = messageThread.id
      console.info(`messageThread id: ${messageThread.id}`)
      await setTimeout(10000);
      console.log("Waited 10s");
      let r_id = run_id;
      if(run_id === undefined){
        const run = await openai.beta.threads.runs.create(
          th_id,
          { assistant_id: ast_id}
        );
        r_id = run.id;
        console.info(`run id: ${run.id}`)
        await setTimeout(10000);
        console.log("Waited 10s");
      }
      let isFinished = false;
      let overtime = 0
      let results = {"thread_id":"","msg":""}
      do{
        const threadMessages = await openai.beta.threads.messages.list(
          th_id.toString()
        );
        console.info(`msg thread_id: ${threadMessages.data[0].thread_id}`)
        console.info(`msg created_at: ${threadMessages.data[0].created_at}`)
        results["thread_id"] = threadMessages.data[0].thread_id
        results["msg"] =  threadMessages.data[0].content[0].type === 'text' ?  threadMessages.data[0].content[0].text.value : '';
        isFinished = threadMessages.data[0].thread_id !== null && threadMessages.data[0].created_at !== null && (keywords !== undefined ? results["msg"].includes(keywords) : threadMessages.data.length > 2);
        await setTimeout(interval_seconds !== undefined ? interval_seconds : 15 * 1000);
        console.log(`Waited ${interval_seconds !== undefined ? interval_seconds : 15}s`);
        overtime = overtime + 1;
        console.log(`overtime:${overtime}`);
      }while(!isFinished && overtime < (msg_query_times !== undefined ? msg_query_times : 10))
      res.status(200).json(results);
  }
  else{
    const myThread = await openai.beta.threads.retrieve(
      thread_id
    );
    if(myThread.id !== thread_id){
      console.info(`thread_id ${thread_id} not found!`)
      res.status(400).send({ message: `Thread id ${thread_id} not found!`})
    }
    const threadMessages = await openai.beta.threads.messages.list(
      th_id.toString()
    );
    res.status(200).json(threadMessages.data[0].content[0]);
  }
  } catch (err) {
    console.error(err)
    res.status(400).send({ message: 'Bad Request'})
  }
}

export default handler