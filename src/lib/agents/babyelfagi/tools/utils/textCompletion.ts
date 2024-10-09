import { AgentMessage, AgentTask } from '@/types';
import { ChatOpenAI } from 'langchain/chat_models/openai';
import { ChatAnthropic } from '@langchain/anthropic';
import { ChatPromptTemplate } from '@langchain/core/prompts';
import { textCompletionToolPrompt } from '../../../../../utils/prompt';
import { HumanChatMessage } from 'langchain/schema';
import { AzureChatOpenAI } from '@langchain/openai';

export const textCompletion = async (
  objective: string,
  prompt: string,
  id: string,
  task: AgentTask,
  dependentTasksOutput: string,
  modelName: string,
  language: string,
  userApiKey?: string,
  signal?: AbortSignal,
  messageCallnback?: (message: AgentMessage) => void,
) => {
  if (!modelName.includes('claude') && prompt.length > 3200) {
    modelName = 'gpt-3.5-turbo-16k-0613';
    console.log(`TextCompletion for the ${prompt} by ${modelName} forced! `);
  }
  console.log('TextCompletion by ' + modelName);
  console.log(
    'AZURE_OPENAI_BASE_PATH_TEST:' + process.env.AZURE_OPENAI_BASE_PATH_TEST,
  );
  const systemPrompt = textCompletionToolPrompt(
    objective,
    language,
    task.task,
    dependentTasksOutput,
  );
  const prompt4Temp = ChatPromptTemplate.fromMessages([
    ['system', systemPrompt],
    ['human', '{input}'],
  ]);
  try {
    if (modelName.includes('claude')) {
      const llm = new ChatAnthropic({
        anthropicApiKey: process.env['ANTHROPIC_API_KEY'],
        modelName,
        temperature: 0.2,
        maxTokensToSample: 800,
        topP: 1,
        streaming: true,
      });
      const response = await prompt4Temp.pipe(llm).invoke({
        input: prompt,
      });
      return response.text;
    } else if (process.env.AZURE_OPENAI_API_KEY) {
      const llm = new AzureChatOpenAI({
        model: modelName,
        azureOpenAIApiKey: process.env.AZURE_OPENAI_API_KEY,
        azureOpenAIApiInstanceName: process.env.AZURE_OPENAI_API_INSTANCE_NAME,
        azureOpenAIApiDeploymentName: modelName.includes('gpt-3.5')
          ? process.env.AZURE_OPENAI_API_DEPLOYMENT_GPT35_NAME
          : process.env.AZURE_OPENAI_API_DEPLOYMENT_GPT4_NAME,
        azureOpenAIApiVersion: process.env.AZURE_OPENAI_API_VERSION,
        azureOpenAIBasePath: modelName.includes('gpt-3.5')
          ? process.env.AZURE_OPENAI_GPT35_BASE_PATH
          : process.env.AZURE_OPENAI_GPT4_BASE_PATH,
        temperature: 0.7,
        maxTokens: 800,
        topP: 1,
        maxRetries: 2,
        streaming: true,
        verbose: false,
      });
      const chain = prompt4Temp.pipe(llm);
      const response = await chain.invoke({
        input: prompt,
      });
      console.log('TextCompletion result:' + response.text);
      return response.text;
    } else {
      const llm = new ChatOpenAI(
        {
          openAIApiKey: userApiKey,
          modelName,
          temperature: 0.2,
          maxTokens: 800,
          topP: 1,
          frequencyPenalty: 0,
          presencePenalty: 0,
          streaming: true,
          callbacks: [
            {
              handleLLMNewToken(token: string) {
                messageCallnback?.({
                  content: token,
                  type: task.skill,
                  id: id,
                  taskId: task.id.toString(),
                  status: 'running',
                });
              },
            },
          ],
        },
        { baseOptions: { AbortSignal: signal } },
      );

      const response = await llm.call([new HumanChatMessage(prompt)]);
      messageCallnback?.({
        content: response.text,
        type: task.skill,
        id: id,
        taskId: task.id.toString(),
        status: 'complete',
      });

      if (messageCallnback instanceof AbortSignal) {
        throw new Error('messageCallnback cannot be of type AbortSignal');
      }

      return response.text;
    }
  } catch (error: any) {
    if (error.name === 'AbortError') {
      return null;
    }
    console.log('TextCompletion error: ', error);
    return 'Failed to generate text.';
  }
};
