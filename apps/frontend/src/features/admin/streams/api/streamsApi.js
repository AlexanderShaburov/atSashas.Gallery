const API_BASE = import.meta.env.VITE_API_BASE_URL;
async function http(url, init) {
    const res = await fetch(`${API_BASE}${url}`, {
        ...init,
        headers: {
            'Content-Type': 'application/json',
            ...(init?.headers ?? {}),
        },
    });
    if (!res.ok) {
        const text = await res.text().catch(() => '');
        throw new Error(`${res.status} ${res.statusText}: ${text}`);
    }
    return (await res.json());
}
export const streamsApi = {
    list: (params) => {
        const qs = new URLSearchParams();
        if (params?.status)
            qs.set('status', params.status);
        if (params?.tag)
            qs.set('tag', params.tag);
        if (params?.q)
            qs.set('q', params.q);
        const suffix = qs.toString() ? `?${qs.toString()}` : '';
        return http(`/admin/streams${suffix}`);
    },
    create: (body) => http(`/admin/streams`, { method: 'POST', body: JSON.stringify(body) }),
    get: (streamId) => http(`/admin/streams/${encodeURIComponent(streamId)}`),
    update: (stream) => http(`/admin/streams/${encodeURIComponent(stream.streamId)}`, {
        method: 'PUT',
        body: JSON.stringify(stream),
    }),
    remove: (streamId, hard = false) => {
        console.log(`[streamsApi][remove] called with id: ${streamId}`);
        const suffix = hard ? `?hard=true` : '';
        return http(`/admin/streams/${encodeURIComponent(streamId)}${suffix}`, {
            method: 'DELETE',
        });
    },
};
