/**
 * POST JSON to a Laravel endpoint outside of Inertia's own request cycle —
 * used for inline "quick create" actions (e.g. adding a category from a
 * combobox) where a full Inertia page visit would be overkill.
 */
export async function apiPost<T>(
    url: string,
    body: Record<string, unknown>,
): Promise<T> {
    const token =
        document.querySelector<HTMLMetaElement>('meta[name="csrf-token"]')
            ?.content ?? '';

    const response = await fetch(url, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            Accept: 'application/json',
            'X-CSRF-TOKEN': token,
        },
        body: JSON.stringify(body),
    });

    const data = await response.json().catch(() => null);

    if (!response.ok) {
        const message =
            data && typeof data === 'object' && 'message' in data
                ? String((data as { message: unknown }).message)
                : `Request failed (${response.status})`;

        throw new Error(message);
    }

    return data as T;
}
