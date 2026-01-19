import {getLogger as getLogLevelLogger, levels, LogLevelDesc} from 'loglevel';

/**
 * Creates a configured logger instance.
 *
 * @remarks
 * Uses loglevel for logging. The log level can be set via the LOG_LEVEL
 * environment variable. Defaults to DEBUG if not specified.
 *
 * Valid log levels: TRACE, DEBUG, INFO, WARN, ERROR, SILENT
 *
 * @param name - Logger name prefix for identification
 * @returns Configured loglevel Logger instance
 *
 * @example
 * ```typescript
 * const log = getLogger('pagerduty-handler');
 * log.info('Processing alarm event');
 * log.debug('Event details:', event);
 * ```
 */
export const getLogger = (name: string) => {
    const log = getLogLevelLogger(name);
    const level = (process.env.LOG_LEVEL as LogLevelDesc) || levels.DEBUG;
    log.setLevel(level);
    return log;
};
