/**
 * UPCOMM AI Assistant - NVIDIA NIM Provider Adapter
 * 
 * Implements a resilient, OpenAI-compatible provider wrapper for NVIDIA NIM Hosted API.
 * Features:
 * - Exponential backoff retry on 429 and temporary 5xx errors.
 * - Enforces timeout boundaries (35 seconds).
 * - Strips hidden reasoning tokens / chain of thought.
 * - Modular abstraction ready for future alternative LLM providers.
 */

declare const Deno: {
  env: {
    get(key: string): string | undefined;
  };
};

export interface ChatMessage {
  role: 'system' | 'user' | 'assistant' | 'tool';
  content?: string | null;
  name?: string;
  tool_call_id?: string;
  tool_calls?: Array<{
    id: string;
    type: 'function';
    function: {
      name: string;
      arguments: string;
    };
  }>;
}

export interface ToolDefinition {
  type: 'function';
  function: {
    name: string;
    description: string;
    parameters: Record<string, any>;
  };
}

export interface AIProviderRequest {
  model?: string;
  messages: ChatMessage[];
  tools?: ToolDefinition[];
  toolChoice?: 'auto' | 'none' | { type: 'function'; function: { name: string } };
  temperature?: number;
  maxTokens?: number;
}

export interface AIProviderResponse {
  message: {
    role: 'assistant';
    content: string | null;
    tool_calls?: Array<{
      id: string;
      type: 'function';
      function: {
        name: string;
        arguments: string;
      };
    }>;
  };
  usage?: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
  model: string;
  latency_ms: number;
}

const DEFAULT_NVIDIA_BASE_URL = 'https://integrate.api.nvidia.com/v1';
const DEFAULT_NVIDIA_MODEL = 'nvidia/nemotron-3-super-120b-a12b';
const FAST_NVIDIA_MODEL = 'nvidia/nemotron-3.5-lightning-30b-a3b';
const REQUEST_TIMEOUT_MS = 35000;

export async function callAIProvider(
  params: AIProviderRequest
): Promise<AIProviderResponse> {
  const apiKey = Deno.env.get('NVIDIA_API_KEY');
  if (!apiKey) {
    throw new Error('NVIDIA_API_KEY is not configured in Supabase environment secrets.');
  }

  const baseUrl = Deno.env.get('NVIDIA_BASE_URL') || DEFAULT_NVIDIA_BASE_URL;
  const configuredModel = Deno.env.get('NVIDIA_AI_MODEL') || DEFAULT_NVIDIA_MODEL;
  const enableFastModel = Deno.env.get('NVIDIA_AI_ENABLE_FAST_MODEL') === 'true';

  const modelToUse = params.model || (enableFastModel ? FAST_NVIDIA_MODEL : configuredModel);

  const endpoint = `${baseUrl.replace(/\/+$/, '')}/chat/completions`;

  const payload: Record<string, any> = {
    model: modelToUse,
    messages: params.messages,
    temperature: params.temperature !== undefined ? params.temperature : 0.2,
    max_tokens: params.maxTokens || 2048,
  };

  if (params.tools && params.tools.length > 0) {
    payload.tools = params.tools;
    payload.tool_choice = params.toolChoice || 'auto';
  }

  let attempt = 0;
  const maxRetries = 2;
  let lastError: Error | null = null;
  const startTime = Date.now();

  while (attempt <= maxRetries) {
    attempt++;
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`,
        },
        body: JSON.stringify(payload),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      // Handle Rate Limiting (429) & Server Overload (500, 502, 503, 504)
      if (response.status === 429 || (response.status >= 500 && response.status <= 504)) {
        const errorText = await response.text();
        console.warn(`[nvidia] Attempt ${attempt} failed with status ${response.status}: ${errorText}`);

        if (attempt <= maxRetries) {
          const delayMs = Math.pow(2, attempt) * 1000 + Math.floor(Math.random() * 500);
          await new Promise((resolve) => setTimeout(resolve, delayMs));
          continue;
        }

        if (response.status === 429) {
          throw new Error('UPCOMM AI is temporarily busy. Please try again in a few moments.');
        }
        throw new Error(`AI service temporarily unavailable (${response.status}). Please try again shortly.`);
      }

      if (!response.ok) {
        const errBody = await response.text();
        throw new Error(`NVIDIA API error (${response.status}): ${errBody}`);
      }

      const data = await response.json();
      const latencyMs = Date.now() - startTime;

      if (!data.choices || data.choices.length === 0) {
        throw new Error('NVIDIA NIM returned an empty response choices array.');
      }

      const rawChoiceMessage = data.choices[0].message;

      // Extract sanitized message (strictly discard reasoning_content)
      const sanitizedMessage: AIProviderResponse['message'] = {
        role: 'assistant',
        content: rawChoiceMessage.content || null,
      };

      if (Array.isArray(rawChoiceMessage.tool_calls) && rawChoiceMessage.tool_calls.length > 0) {
        sanitizedMessage.tool_calls = rawChoiceMessage.tool_calls.map((tc: any) => ({
          id: tc.id,
          type: 'function',
          function: {
            name: tc.function.name,
            arguments: typeof tc.function.arguments === 'string'
              ? tc.function.arguments
              : JSON.stringify(tc.function.arguments),
          },
        }));
      }

      return {
        message: sanitizedMessage,
        usage: data.usage || {
          prompt_tokens: 0,
          completion_tokens: 0,
          total_tokens: 0,
        },
        model: data.model || modelToUse,
        latency_ms: latencyMs,
      };
    } catch (err: any) {
      clearTimeout(timeoutId);
      if (err.name === 'AbortError') {
        lastError = new Error('AI request timed out. Please try a simpler request.');
      } else {
        lastError = err;
      }

      if (attempt <= maxRetries) {
        const delayMs = 1500 * attempt;
        await new Promise((resolve) => setTimeout(resolve, delayMs));
      }
    }
  }

  throw lastError || new Error('Failed to communicate with AI provider.');
}
