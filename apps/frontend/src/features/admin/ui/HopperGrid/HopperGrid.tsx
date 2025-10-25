import '@/features/admin/ui/HopperGrid/HopperGrid.module.css';

type Props = {
    items: string[];
};

export default function HopperGrid({ items }: Props) {
    if (!items.length) return <p>No files yet.</p>;

    return (
        <div className="hopper-grid">
            {items.map((src) => (
                <div key={src} className="hopper-item">
                    <img src={src} alt="uploaded artwork" />
                </div>
            ))}
        </div>
    );
}
