import { TextMultiTranslatePage } from '../pages/text-multi-translate'

export const NAV_ITEMS = {
  'text-multi-translate': {
    title: 'textMultiTranslate',
    url: '/text-multi-translate',
    icon: 'ri:translate',
    component: TextMultiTranslatePage,
  },
} as const satisfies Record<string, {
  title: string
  url: string
  icon: string
  component: React.ComponentType
}>
