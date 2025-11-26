function createLogger() {
  return {
    log: (...args: any[]) => console.log(...args),
    warn: (...args: any[]) => console.warn(...args),
    error: (...args: any[]) => console.error(...args),
  };
}

const logger = createLogger();
export default logger;
