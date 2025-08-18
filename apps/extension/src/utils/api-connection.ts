import type { APIProviderNames } from '@/types/config/provider'
import { DEFAULT_TRANSLATE_MODELS } from '@/utils/constants/config'
import { aiTranslate, deeplxTranslate } from '@/utils/host/translate/api'

export interface APIConnectionTestResult {
  success: boolean
  message: string
}

function createSuccessResult(): APIConnectionTestResult {
  return {
    success: true,
    message: 'Connection successful',
  }
}

function createErrorResult(error: unknown): APIConnectionTestResult {
  return {
    success: false,
    message: error instanceof Error ? error.message : 'Unknown error',
  }
}

async function executeConnectionTest(
  testFn: () => Promise<unknown>,
): Promise<APIConnectionTestResult> {
  try {
    await testFn()
    return createSuccessResult()
  }
  catch (error) {
    return createErrorResult(error)
  }
}

export async function testAPIConnectivity(
  provider: APIProviderNames,
): Promise<APIConnectionTestResult> {
  if (provider === 'deeplx') {
    return executeConnectionTest(() => deeplxTranslate('Hi', 'en', 'zh'))
  }
  else {
    return executeConnectionTest(() => {
      const modelName = DEFAULT_TRANSLATE_MODELS[provider].model
      return aiTranslate(provider, modelName, 'Hi')
    })
  }
}
