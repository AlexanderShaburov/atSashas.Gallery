// features/public/api/enrollmentApi.ts

const API_BASE = import.meta.env.VITE_API_BASE_URL || '/api';

export interface EnrollPayload {
  fullName: string;
  email: string;
}

export interface EnrollResponse {
  enrollmentId: string;
  status: 'free' | 'checkout';
  checkoutUrl?: string;
}

export async function enrollPublic(
  eventId: string,
  data: EnrollPayload,
): Promise<EnrollResponse> {
  const res = await fetch(`${API_BASE}/public/events/${eventId}/enroll`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || `Enrollment failed: ${res.statusText}`);
  }
  return res.json();
}
