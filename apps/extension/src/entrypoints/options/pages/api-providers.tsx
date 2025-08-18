import type { APIProviderNames } from '@/types/config/provider'
import { i18n } from '#imports'
import { Icon } from '@iconify/react'
import { Button } from '@repo/ui/components/button'
import { Checkbox } from '@repo/ui/components/checkbox'
import { Input } from '@repo/ui/components/input'
import { cn } from '@repo/ui/lib/utils'
import { useAtom } from 'jotai'
import { useEffect, useState } from 'react'
import { toast } from 'sonner'
import LoadingDots from '@/components/loading-dots'
import { API_PROVIDER_NAMES } from '@/types/config/provider'
import { testAPIConnectivity } from '@/utils/api-test-connection'
import { configFields } from '@/utils/atoms/config'
import { API_PROVIDER_ITEMS } from '@/utils/constants/config'
import { ConfigCard } from '../components/config-card'
import { FieldWithLabel } from '../components/field-with-label'
import { PageLayout } from '../components/page-layout'

export function ApiProvidersPage() {
  return (
    <PageLayout title={i18n.t('options.apiProviders.title')} innerClassName="[&>*]:border-b [&>*:last-child]:border-b-0">
      {API_PROVIDER_NAMES.map(provider => (
        <ProviderConfigCard key={provider} provider={provider} />
      ))}
    </PageLayout>
  )
}

export function ProviderConfigCard({ provider }: { provider: APIProviderNames }) {
  const [providersConfig, setProvidersConfig] = useAtom(configFields.providersConfig)
  const [showAPIKey, setShowAPIKey] = useState(false)
  const [isTestingConnection, setIsTestingConnection] = useState(false)
  const [testResult, setTestResult] = useState<'success' | 'error' | null>(null)

  return (
    <ConfigCard
      title={(
        <div className="flex items-center gap-2">
          <img
            src={API_PROVIDER_ITEMS[provider].logo}
            alt={API_PROVIDER_ITEMS[provider].name}
            className="border-border size-5 p-[3px] rounded-full border bg-white"
          />
          {API_PROVIDER_ITEMS[provider].name}
        </div>
      )}
      description={i18n.t(`options.apiProviders.description.${provider}`)}
    >
      <div className="flex flex-col gap-y-4">
        <div className="flex flex-col gap-1" id={`${provider}-apiKey`}>
          <div className="flex items-center justify-between">
            <label className="text-sm font-medium">
              API Key
            </label>
            <TestConnectionButton
              provider={provider}
              apiKey={providersConfig[provider].apiKey}
              baseURL={providersConfig[provider].baseURL}
              isTestingConnection={isTestingConnection}
              setIsTestingConnection={setIsTestingConnection}
              testResult={testResult}
              setTestResult={setTestResult}
            />
          </div>
          <Input
            className="mt-1 mb-2"
            value={providersConfig[provider].apiKey}
            type={showAPIKey ? 'text' : 'password'}
            onChange={e =>
              setProvidersConfig({
                ...providersConfig,
                [provider]: {
                  ...providersConfig[provider],
                  apiKey: e.target.value,
                },
              })}
          />
          <div className="flex items-center space-x-2">
            <Checkbox
              id={`apiKey-${provider}`}
              checked={showAPIKey}
              onCheckedChange={checked => setShowAPIKey(checked === true)}
            />
            <label
              htmlFor={`apiKey-${provider}`}
              className="text-sm leading-none font-medium peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
            >
              {i18n.t('options.apiProviders.apiKey.showAPIKey')}
            </label>
          </div>
        </div>

        <AdvancedProviderConfig provider={provider} />
      </div>
    </ConfigCard>
  )
}

function TestConnectionButton({
  provider,
  apiKey,
  baseURL,
  isTestingConnection,
  setIsTestingConnection,
  testResult,
  setTestResult,
}: {
  provider: APIProviderNames
  apiKey?: string
  baseURL?: string
  isTestingConnection: boolean
  setIsTestingConnection: (testing: boolean) => void
  testResult: 'success' | 'error' | null
  setTestResult: (result: 'success' | 'error' | null) => void
}) {
  const handleTestConnection = async () => {
    if (!apiKey || apiKey.trim() === '') {
      setTestResult('error')
      toast.error('Connection failed: API Key is required')
      return
    }
    setIsTestingConnection(true)
    setTestResult(null)
    try {
      const result = await testAPIConnectivity(provider, apiKey, baseURL)
      if (result.success) {
        setTestResult('success')
      }
      else {
        setTestResult('error')
        toast.error(`Connection failed: ${result.message}`)
      }
    }
    catch (error) {
      setTestResult('error')
      toast.error(`Connection failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
    finally {
      setIsTestingConnection(false)
    }
  }

  // When API Key or Base URL changes, clear the test result
  useEffect(() => {
    setTestResult(null)
  }, [apiKey, baseURL])

  return (
    <div className="flex items-center gap-2">
      {testResult === 'success' && (
        <div className="flex items-center justify-center size-5 rounded-full bg-green-200 dark:bg-green-800/50">
          <Icon
            icon="tabler:check"
            className="size-3.5 text-green-700 dark:text-green-300 stroke-[2.5]"
          />
        </div>
      )}
      {testResult === 'error' && (
        <div className="flex items-center justify-center size-5 rounded-full bg-red-200 dark:bg-red-800/50">
          <Icon
            icon="tabler:x"
            className="size-3.5 text-red-700 dark:text-red-300 stroke-[2.5]"
          />
        </div>
      )}
      <Button
        size="sm"
        variant="outline"
        onClick={handleTestConnection}
        disabled={isTestingConnection || !apiKey}
        className="h-7 px-3"
      >
        {isTestingConnection
          ? (
              <div className="flex items-center gap-2">
                <LoadingDots className="scale-75" />
                <span className="text-xs">
                  Testing...
                </span>
              </div>
            )
          : (
              <span className="text-xs">
                {i18n.t('options.apiProviders.testConnection.button')}
              </span>
            )}
      </Button>
    </div>
  )
}

function AdvancedProviderConfig({ provider }: { provider: APIProviderNames }) {
  const [providersConfig, setProvidersConfig] = useAtom(configFields.providersConfig)
  const [showAdvanced, setShowAdvanced] = useState(false)

  return (
    <div>
      <button
        type="button"
        className={cn('text-sm font-medium text-blue-600 hover:underline', showAdvanced && 'mb-2')}
        onClick={() => setShowAdvanced(!showAdvanced)}
      >
        {showAdvanced ? i18n.t('options.apiProviders.advancedConfig.hide') : i18n.t('options.apiProviders.advancedConfig.show')}
      </button>

      {showAdvanced && (
        <FieldWithLabel id={`${provider}-baseURL`} label="Base URL">
          <Input
            className="mt-1 mb-2"
            value={providersConfig[provider].baseURL}
            onChange={e =>
              setProvidersConfig({
                ...providersConfig,
                [provider]: {
                  ...providersConfig[provider],
                  baseURL: e.target.value,
                },
              })}
          />
        </FieldWithLabel>
      )}
    </div>
  )
}
