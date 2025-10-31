const ALPHABET = '0123456789ABCDEFGHJKMNPQRSTVWXYZ';

function randomBase32(n: number): string {
    const bytes = new Uint8Array(n);
    crypto.getRandomValues(bytes);
    if (bytes.length !== n) throw new Error('ID random not generated.');

    let s = '';
    for (let i = 0; i < n; i++) {
        // 0..31
        const idx = bytes[i]! & 31; // <-- non-null assertion
        s += ALPHABET[idx];
    }
    return s;
}

function yyyymmdd(d = new Date()): string {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}${m}${day}`;
}

export function generateArtId(now = new Date()): string {
    return `art-${yyyymmdd(now)}-${randomBase32(6).toLowerCase()}`;
}
