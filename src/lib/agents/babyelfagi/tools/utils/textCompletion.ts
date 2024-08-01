import { AgentMessage, AgentTask } from '@/types';
import { ChatOpenAI } from 'langchain/chat_models/openai';
import { ChatAnthropic } from '@langchain/anthropic';
import { ChatPromptTemplate } from '@langchain/core/prompts';
import { textCompletionToolPrompt } from '../../../../../utils/prompt';
import { HumanChatMessage } from 'langchain/schema';

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
  console.log('textCompletion by ' + modelName);
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
      const systemPrompt = textCompletionToolPrompt(
        objective,
        language,
        task.task,
        dependentTasksOutput,
      );
      const prompt4Anthropic = ChatPromptTemplate.fromMessages([
        ['system', systemPrompt],
        ['human', '{input}'],
      ]);
      const response = await prompt4Anthropic.pipe(llm).invoke({
        input: prompt,
      });
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
    console.log('error: ', error);
    return 'Failed to generate text.';
  }
};
