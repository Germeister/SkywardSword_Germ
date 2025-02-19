/**
 * A CancelToken should be passed to cancelable functions. Those functions should then check the state of the
 * token and return early.
 */
export interface CancelToken {
    readonly canceled: boolean;
}

/**
 * Returns a cancel token and a cancellation function. The token can be passed to functions and checked
 * to see whether it has been canceled. The function can be called to cancel the token.
 */
export function withCancel(): [CancelToken, () => void] {
    let isCanceled = false;
    return [
        {
            get canceled() {
                return isCanceled;
            },
        },
        () => (isCanceled = true),
    ];
}
