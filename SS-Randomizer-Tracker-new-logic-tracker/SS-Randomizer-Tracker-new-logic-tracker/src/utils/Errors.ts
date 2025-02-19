export function convertError(e: unknown) {
    return e
        ? typeof e === 'object' && e !== null && 'message' in e
            ? (e.message as string)
            : JSON.stringify(e)
        : 'Unknown error';
}
