import { OpenAIChat } from 'langchain/llms/openai';
import { LLMChain } from 'langchain/chains';
import {
  ChatPromptTemplate,
  HumanMessagePromptTemplate,
  SystemMessagePromptTemplate,
} from 'langchain/prompts';
import { MODELS } from '@/utils/constants';
import { ChatAnthropic } from "@langchain/anthropic";
import { ChatPromptTemplate as coreChatPromptTemplate } from '@langchain/core/prompts';

export const relevantInfoExtraction = async (
  objective: string,
  task: string,
  notes: string,
  chunk: string,
  modelName: string,
  userApiKey?: string,
  signal?: AbortSignal,
) => {
  console.log('RelevantInfoExtraction by ' + modelName);
  // const modelName = 'gpt-3.5-turbo-16k-0613'; // use a fixed model
  const model = MODELS.find((model) => model.name === 'OpenAI gpt-4');
  try {
    if (!modelName.includes('claude')) {
      const model_name = model?.id || 'gpt-4-1106-preview';
      const prompt = relevantInfoExtractionPrompt();
      const llm = new OpenAIChat(
        {
          modelName: model_name,
          openAIApiKey: userApiKey,
          temperature: 0.7,
          maxTokens: 800,
          topP: 1,
          stop: ['###'],
        },
        { baseOptions: { signal: signal } },
      );
      const chain = new LLMChain({ llm: llm, prompt });
      const response = await chain.call({
        openAIApiKey: userApiKey,
        objective,
        task,
        notes,
        chunk,
      });
      return response.text;
    }
    else{
      const llm = new ChatAnthropic({
          anthropicApiKey: process.env['ANTHROPIC_API_KEY'],
          modelName,
          temperature: 0.7,
          maxTokensToSample: 800,
          topP: 1,
          streaming: true,
        },
      );
      const systemTemplate = `Objective: {objective}\nCurrent Task:{task}`;
      const relevantInfoExtractionTemplate = `Analyze the following text and extract information relevant to our objective and current task, and only information relevant to our objective and current task. If there is no relevant information do not say that there is no relevant informaiton related to our objective. ### Then, update or start our notes provided here (keep blank if currently blank): {notes}.### Text to analyze: {chunk}.### Updated Notes:`;
      const prompt4Anthropic = coreChatPromptTemplate.fromMessages([
        ['system', systemTemplate],
        ['human', relevantInfoExtractionTemplate],
      ]);
      const response = await prompt4Anthropic.pipe(llm).invoke({
        objective,
        task,
        notes,
        chunk
      });
      return response.text;
    }
  } catch (error: any) {
    if (error.name === 'AbortError') {
      return null;
    }
    console.log('RelevantInfoExtraction error: ', error);
    return 'Failed to extract relevant information.';
  }
};

const relevantInfoExtractionPrompt = () => {
  const systemTemplate = `Objective: {objective}\nCurrent Task:{task}`;
  const relevantInfoExtractionTemplate = `Analyze the following text and extract information relevant to our objective and current task, and only information relevant to our objective and current task. If there is no relevant information do not say that there is no relevant informaiton related to our objective. ### Then, update or start our notes provided here (keep blank if currently blank): {notes}.### Text to analyze: {chunk}.### Updated Notes:`;
  const prompt = ChatPromptTemplate.fromPromptMessages([
    SystemMessagePromptTemplate.fromTemplate(systemTemplate),
    HumanMessagePromptTemplate.fromTemplate(relevantInfoExtractionTemplate),
  ]);

  prompt.inputVariables = ['objective', 'task', 'notes', 'chunk'];

  return prompt;
};
