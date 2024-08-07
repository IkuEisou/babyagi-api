import { AgentType, Execution } from '@/types';
import { EXECUTIONS_KEY, CURRENT_USER_EMAIL } from './constants';

export const updateExecution = (updatedExecution: Execution) => {
  const executions = savedExecutions().map((execution) => {
    if (execution.id === updatedExecution.id) {
      return updatedExecution;
    }

    return execution;
  });
  saveExecutions(executions);

  return executions;
};

export const saveExecution = (execution: Execution) => {
  const executions = [...savedExecutions(), execution];
  saveExecutions(executions);
  return executions;
};

const saveExecutions = (executions: Execution[]) => {
  const exe_key = localStorage.getItem(CURRENT_USER_EMAIL) || EXECUTIONS_KEY ;
  localStorage.setItem(exe_key, JSON.stringify(executions));
};

export const savedExecutions = () => {
  const exe_key = localStorage.getItem(CURRENT_USER_EMAIL) || EXECUTIONS_KEY ;
  return JSON.parse(
    localStorage.getItem(exe_key) || '[]',
  ) as Execution[];
};

export const deleteExecution = (executionId: string) => {
  const executions = savedExecutions().filter(
    (savedExecution) => savedExecution.id !== executionId,
  );
  saveExecutions(executions);
  return executions;
};
