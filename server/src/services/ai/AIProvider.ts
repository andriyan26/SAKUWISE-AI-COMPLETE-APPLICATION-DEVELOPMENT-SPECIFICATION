import { ENV } from '../../config/env.js';

export interface ChatMessageParam {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

export interface AIProviderResponse {
  content: string;
  thoughtProcess?: string[];
  toolsUsed?: { tool: string; args: any; resultSummary: string }[];
  actionDraft?: {
    actionType: 'CREATE_BUDGET' | 'CREATE_SAVINGS_GOAL' | 'CREATE_TRANSACTION';
    title: string;
    description: string;
    payload: any;
  };
}

export interface IAIProvider {
  generateResponse(
    messages: ChatMessageParam[],
    userData: {
      userId: string;
      userName: string;
      financialContext: any;
    }
  ): Promise<AIProviderResponse>;
}
