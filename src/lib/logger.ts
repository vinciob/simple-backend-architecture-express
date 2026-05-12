export const logger = (
    message: string,
    level: 'info' | 'error' | 'warn' = 'info',
): void => {
    const now = new Date().toISOString()
    const messageToLog = `${now} - ${message}`

    if (level === 'error') console.error(messageToLog)
    else if (level === 'warn') console.warn(messageToLog)
    else console.log(messageToLog)
}
