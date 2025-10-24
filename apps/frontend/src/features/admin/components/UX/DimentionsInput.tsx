import type { Dimensions, UnitName } from '@/entities/common';
import { useEffect, useState } from 'react';

interface DimensionsInputProps {
    label: string;
    value: Dimensions | undefined;
    onChange: (next?: Dimensions) => void;
    inputId?: string;
}
type DimensionsDraft = {
    width?: number | undefined;
    height?: number | undefined;
    unit?: UnitName | undefined;
};

function isCompleteDimensions(s: DimensionsDraft): boolean {
    return s.width !== undefined && s.height !== undefined && s.unit !== undefined;
}

export default function DimensionsInput({
    label = 'Dimensions',
    value,
    onChange,
    inputId = 'size',
}: DimensionsInputProps) {
    const list: readonly UnitName[] = ['cm', 'in'];

    const [draft, setDraft] = useState<DimensionsDraft | undefined>(value ?? {});

    useEffect(() => {
        setDraft((prev) => {
            if (value) {
                const next = value;
                const same =
                    prev?.height === next.height &&
                    prev?.width === next.width &&
                    prev?.unit === next.unit;
                return same ? prev : next;
            }
        });
    }, [value]);

    const update = (next: Partial<DimensionsDraft>) => {
        const merged = { ...draft, ...next };
        setDraft(merged);
        if (isCompleteDimensions(merged)) onChange(merged as Dimensions);
    };

    return (
        <div className="cf-row">
            <span className="cf-label">{label}</span>

            <div className="cf-row-inline cf-money-wrap">
                <div>
                    <label htmlFor={inputId} className="cf-label">
                        Width
                    </label>
                    <input
                        id={`${inputId}-width`}
                        className="cf-input"
                        type="number"
                        step="0.01"
                        inputMode="decimal"
                        placeholder="Amount"
                        value={draft?.width}
                        onChange={(e) => {
                            const raw = e.target.value;
                            if (raw === undefined) {
                                update({ width: undefined }); //unset size entirely
                            } else {
                                const n = Number(raw);
                                if (!Number.isNaN(n)) update({ width: n });
                            }
                        }}
                    />
                    <label htmlFor={inputId} className="cf-label">
                        Height
                    </label>
                    <input
                        id={`${inputId}-height`}
                        className="cf-input"
                        type="number"
                        step="0.1"
                        inputMode="decimal"
                        placeholder="Height"
                        value={draft?.width}
                        onChange={(e) => {
                            const raw = e.target.value;
                            if (raw === undefined) {
                                update({ height: undefined }); //
                            } else {
                                const n = Number(raw);
                                if (!Number.isNaN(n)) update({ ...draft, height: n });
                            }
                        }}
                    />
                </div>
                <div>
                    <label htmlFor={`${inputId}-unit`} className="cf-label">
                        Unit
                    </label>
                </div>
                <select
                    id={`${inputId}-unit`}
                    className="cf-select"
                    value={draft?.unit}
                    onChange={(e) => {
                        if (e.target.value === undefined) {
                            // if no amount yet, keep it unset but remember currency choice
                            update({ unit: undefined });
                        } else {
                            const currency = { unit: e.target.value as UnitName };
                            update({ ...draft, ...currency });
                        }
                    }}
                >
                    {list.map((c) => (
                        <option key={c} value={c}>
                            {c}
                        </option>
                    ))}
                </select>
            </div>
        </div>
    );
}
