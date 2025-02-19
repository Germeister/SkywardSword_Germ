/**
 * Print a message to the browser console, but only in dev mode.
 */
export function appDebug(msg: string, ...args: unknown[]) {
    if ($DEBUG_PRINTS) {
        console.log(msg, ...args);
    }
}

/**
 * Print a warning to the browser console, but only in dev mode.
 */
export function appWarn(msg: string, ...args: unknown[]) {
    if ($DEBUG_PRINTS) {
        console.warn(msg, ...args);
    }
}

/**
 * Print an error to the browser console. In test mode, errors are fatal.
 */
export function appError(msg: string, ...args: unknown[]) {
    console.error(msg, ...args);
    if ($FATAL_APPERROR) {
        throw new Error('fatal error ' + msg);
    }
}
