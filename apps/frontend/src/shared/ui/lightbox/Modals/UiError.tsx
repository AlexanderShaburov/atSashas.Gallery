import type { UiErrorState } from '@/entities/common';
import './UiError.css';

type Props = {
    uiError: UiErrorState;
    setUiError: (e: UiErrorState | undefined) => void;
    onConfirm: () => void;
};
export function UiError({ uiError, setUiError, onConfirm }: Props) {
    return (
        <div className="modal-overlay" role="dialog" aria-modal="true">
            <div className="modal-card">
                <div className="modal-title">{uiError.title}</div>
                <div className="modal-body">{uiError.message}</div>

                <div className="modal-actions">
                    <button
                        onClick={() => {
                            onConfirm();
                            setUiError(undefined);
                        }}
                    >
                        OK
                    </button>
                </div>
            </div>
        </div>
    );
}
