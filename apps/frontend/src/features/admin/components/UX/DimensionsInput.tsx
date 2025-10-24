import type { Dimensions, UnitName } from '@/entities/common';
import { useEffect, useState } from 'react';
import NumericInput from './NumericInput';

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
            if (!value) return prev;
            const same =
                prev?.height === value.height &&
                prev?.width === value.width &&
                prev?.unit === value.unit;
            return same ? prev : value;
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
                    <label htmlFor={`${inputId}-width-NEW`} className="cf-label">
                        Width
                    </label>
                    <NumericInput
                        id={`${inputId}-width`}
                        className="cf-input"
                        placeholder="Width"
                        value={draft?.width}
                        decimals={2}
                        onChangeNumber={(n) => update({ width: n })}
                    />
                    <label htmlFor={inputId} className="cf-label">
                        Height
                    </label>
                    <NumericInput
                        id={`${inputId}-height`}
                        className="cf-input"
                        placeholder="Height"
                        value={draft?.height}
                        decimals={2}
                        onChangeNumber={(n) => update({ height: n })}
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
