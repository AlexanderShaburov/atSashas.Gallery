// src/features/admin/streams/ui/NewStreamComponent/NewStreamComponent.tsx

export type Props = {
    createNewStream: () => void;
};
export function NewStreamComponent({ createNewStream }: Props) {
    function handleOnClick() {
        console.log(`Create new stream placeholder clicked`);
        createNewStream();
    }
    return (
        <figure
            className="se__thumbnail se__thumbnail--create"
            role="button"
            onClick={handleOnClick}
            aria-label="Create new stream"
        >
            <figcaption>New Stream</figcaption>
        </figure>
    );
}
