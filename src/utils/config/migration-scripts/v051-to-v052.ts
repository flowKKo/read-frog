/**
 * Migration script from v051 to v052
 * Adds translationHub config for drag-and-drop card ordering
 */
export function migrate(oldConfig: any): any {
  return {
    ...oldConfig,
    translationHub: {
      serviceOrder: [],
    },
  }
}
