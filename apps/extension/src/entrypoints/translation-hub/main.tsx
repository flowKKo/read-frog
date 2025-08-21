import type { Config } from '@/types/config/config'
import { SidebarProvider } from '@repo/ui/components/sidebar'
import { TooltipProvider } from '@repo/ui/components/tooltip'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { Provider as JotaiProvider } from 'jotai'
import { useHydrateAtoms } from 'jotai/utils'
import React from 'react'
import ReactDOM from 'react-dom/client'
import { HashRouter } from 'react-router'
import FrogToast from '@/components/frog-toast'
import { configAtom } from '@/utils/atoms/config'
import { globalConfig, loadGlobalConfig } from '@/utils/config/config'
import { DEFAULT_CONFIG } from '@/utils/constants/config'
import App from './app'
import { AppSidebar } from './app-sidebar'
import '@/assets/tailwind/theme.css'

document.documentElement.classList.toggle(
  'dark',
  localStorage.theme === 'dark'
  || (!('theme' in localStorage)
    && window.matchMedia('(prefers-color-scheme: dark)').matches),
)

function HydrateAtoms({
  initialValues,
  children,
}: {
  initialValues: [[typeof configAtom, Config]]
  children: React.ReactNode
}) {
  useHydrateAtoms(initialValues)
  return children
}

const queryClient = new QueryClient()

async function initApp() {
  await loadGlobalConfig()
  const root = document.getElementById('root')!
  root.className = 'antialiased bg-background text-foreground'

  const config = globalConfig ?? DEFAULT_CONFIG

  ReactDOM.createRoot(root).render(
    <React.StrictMode>
      <JotaiProvider>
        <HydrateAtoms initialValues={[[configAtom, config]]}>
          <QueryClientProvider client={queryClient}>
            <HashRouter>
              <SidebarProvider>
                <TooltipProvider>
                  <AppSidebar />
                  <App />
                  <FrogToast position="top-center" />
                </TooltipProvider>
              </SidebarProvider>
            </HashRouter>
          </QueryClientProvider>
        </HydrateAtoms>
      </JotaiProvider>
    </React.StrictMode>,
  )
}

initApp()
