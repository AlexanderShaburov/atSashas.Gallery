import { ArtGerm } from '@/entities/art';
import { Thumb } from '@/entities/catalog';
import '@/features/admin/ui/HopperGrid/HopperGrid.css';

type Props = {
    hopper: Thumb[];
    setIdentity: (v: ArtGerm | undefined) => void;
};

export default function HopperGrid({ hopper, setIdentity }: Props) {
    if (!hopper.length) return <p>No files yet.</p>;

    return (
        <div className="grid">
            {hopper.map((h) => (
                <button
                    key={h.id}
                    className={`card`}
                    onClick={() => setIdentity({ mode: 'create', item: h })}
                    title={h.id}
                >
                    <img src={h.src} alt={h.id} loading="lazy" />
                    <div className="meta">{h.id}</div>
                </button>
            ))}
            {hopper.length === 0 && <p>No uploads in hopper</p>}
        </div>
    );
}
