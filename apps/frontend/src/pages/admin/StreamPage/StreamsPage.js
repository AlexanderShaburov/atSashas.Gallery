import { jsx as _jsx } from "react/jsx-runtime";
import { StreamEditor } from '@/features/admin/streams/StreamEditorScreen/StreamEditorScreen';
export default function StreamsPage() {
    return (_jsx("section", { className: "stream-page", children: _jsx(StreamEditor, {}) }));
}
