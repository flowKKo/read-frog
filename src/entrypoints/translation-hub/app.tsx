import { LanguageControlPanel } from './components/language-control-panel'
import { TextInput } from './components/text-input'
import { TranslationPanel } from './components/translation-panel'
import { TranslationServiceDropdown } from './components/translation-service-dropdown'
import { useTranslation } from './hooks/use-translation'

export default function App() {
  const {
    sourceLanguage,
    setSourceLanguage,
    targetLanguage,
    setTargetLanguage,
    inputText,
    handleInputChange,
    selectedServices,
    setSelectedServices,
    translationResults,
    handleTranslate,
    handleLanguageExchange,
    handleCopyText,
    handleRemoveService,
  } = useTranslation()

  return (
    <>
      <div className="bg-muted/30 min-h-screen">
        <div className="max-w-6xl mx-auto">
          <header className="px-6 py-3">
            <h1 className="text-3xl font-semibold text-foreground">
              Multi-API Text Translation
            </h1>
          </header>

          <main className="px-6 pb-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-x-6 gap-y-3">
              {/* Row 1: Controls */}
              <LanguageControlPanel
                sourceLanguage={sourceLanguage}
                targetLanguage={targetLanguage}
                onSourceLanguageChange={setSourceLanguage}
                onTargetLanguageChange={setTargetLanguage}
                onLanguageExchange={handleLanguageExchange}
              />
              <TranslationServiceDropdown
                selectedServices={selectedServices}
                onServicesChange={setSelectedServices}
              />

              {/* Row 2: Content - aligned at same height */}
              <TextInput
                value={inputText}
                onChange={handleInputChange}
                onTranslate={handleTranslate}
                placeholder="Enter the text you want to translate..."
              />
              <TranslationPanel
                results={translationResults}
                selectedServices={selectedServices}
                onCopy={handleCopyText}
                onRemove={handleRemoveService}
              />
            </div>
          </main>
        </div>
      </div>
    </>
  )
}
