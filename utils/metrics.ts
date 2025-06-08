export function callYm(...args: Parameters<NonNullable<typeof window.ym>>) {
    if (typeof window !== 'undefined' && typeof window.ym === 'function') {
        window.ym(...args);
    }
}
