import type { APIProviderNames } from '@/types/config/provider'

export interface ApiTestResult {
  success: boolean
  message: string
}

interface ProviderTestConfig {
  getUrl: (baseURL: string) => string
  getHeaders: (apiKey: string) => Record<string, string>
  method: 'GET' | 'POST'
  body?: (apiKey: string) => string
  validateResponse: (data: any) => boolean
}

const PROVIDER_TEST_CONFIGS: Record<APIProviderNames, ProviderTestConfig> = {
  openai: {
    getUrl: baseURL => `${baseURL}/models`,
    getHeaders: apiKey => ({
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    }),
    method: 'GET',
    validateResponse: data => data.data && Array.isArray(data.data),
  },
  deepseek: {
    getUrl: baseURL => `${baseURL}/models`,
    getHeaders: apiKey => ({
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    }),
    method: 'GET',
    validateResponse: data => data.data && Array.isArray(data.data),
  },
  gemini: {
    getUrl: baseURL => `${baseURL}/models`,
    getHeaders: apiKey => ({
      'Content-Type': 'application/json',
      'x-goog-api-key': apiKey,
    }),
    method: 'GET',
    validateResponse: data => data.models && Array.isArray(data.models),
  },
  deeplx: {
    getUrl: baseURL => `${baseURL}/translate`,
    getHeaders: apiKey => ({
      'Content-Type': 'application/json',
      ...(apiKey && { Authorization: `Bearer ${apiKey}` }),
    }),
    method: 'POST',
    body: () => JSON.stringify({
      text: 'Hi',
      source_lang: 'EN',
      target_lang: 'ZH',
    }),
    validateResponse: data => !!data.data,
  },
}

export async function testAPIConnectivity(
  provider: APIProviderNames,
  apiKey: string,
  baseURL?: string,
): Promise<ApiTestResult> {
  if (!apiKey || apiKey.trim() === '') {
    return {
      success: false,
      message: '[VALIDATION_ERROR] API Key is required',
    }
  }

  const config = PROVIDER_TEST_CONFIGS[provider]
  if (!config) {
    return {
      success: false,
      message: `[CONFIG_ERROR] Unsupported provider: ${provider}`,
    }
  }

  try {
    return await testProviderConnectivity(config, apiKey, baseURL)
  }
  catch (error) {
    return {
      success: false,
      message: `[NETWORK_ERROR] ${error instanceof Error ? error.message : 'Unknown error'}`,
    }
  }
}

async function testProviderConnectivity(
  config: ProviderTestConfig,
  apiKey: string,
  baseURL?: string,
): Promise<ApiTestResult> {
  const url = config.getUrl(baseURL || '')
  const headers = config.getHeaders(apiKey)

  const fetchOptions: RequestInit = {
    method: config.method,
    headers,
    body: config.body ? config.body(apiKey) : undefined,
  }

  const response = await fetch(url, fetchOptions)

  if (response.ok) {
    const data = await response.json()
    const isValid = config.validateResponse(data)
    if (isValid) {
      return {
        success: true,
        message: 'Connection successful',
      }
    }
  }
  const errorMessage = await getErrorMessage(response)
  return {
    success: false,
    message: errorMessage,
  }
}

async function getErrorMessage(response: Response): Promise<string> {
  let apiMessage = ''
  try {
    const errorData = await response.json()
    if (errorData.error && errorData.error.message) {
      apiMessage = errorData.error.message
    }
    else if (errorData.message) {
      apiMessage = errorData.message
    }
  }
  catch { }
  const message = apiMessage || 'Please check your base URL'
  return `[ERROR_CODE: ${response.status}] ${message}`
}
