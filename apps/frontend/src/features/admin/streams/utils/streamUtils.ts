import { StreamData } from '@/entities/stream';

export function validateStreamForm(draft: StreamData) {
    return draft ? false : false;
}
