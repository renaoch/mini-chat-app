export const crashReportingService = {
  logError(error: Error | string, context: Record<string, any> = {}): void {
    console.error('[CrashReporting Logged Error]:', error, context);
  },

  setUserContext(userId: string, email?: string): void {
    console.log('[CrashReporting User Context Set]:', { userId, email });
  },
};
