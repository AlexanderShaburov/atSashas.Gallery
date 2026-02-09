import { jsx as _jsx } from "react/jsx-runtime";
import { useEffect } from 'react';
import './ArtItemGrid.css';
export default function ArtItemGrid({ artCollection, selectedItemId, setItemSelected, }) {
    // Handle click on tile: toggle selection
    function handleClick(item) {
        setItemSelected(item);
        console.log(`Current artCollection is: ${artCollection}`);
        console.dir(artCollection);
    }
    // Handle Escape: clear selection
    useEffect(() => {
        function handleKeyDown(e) {
            if (e.key === 'Escape') {
                setItemSelected(undefined);
            }
        }
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [setItemSelected]);
    if (!artCollection || !artCollection.length) {
        return _jsx("div", { className: "hopper-grid hopper-grid--empty", children: "No items yet" });
    }
    return (_jsx("div", { className: "hopper-grid", children: artCollection.map((item) => (_jsx("button", { type: "button", className: `hopper-grid-item ${item.id === selectedItemId ? 'is-selected' : ''}`, onClick: () => handleClick(item), children: _jsx("img", { src: item.thumbUrl, alt: item.title ?? '', loading: "lazy" }) }, item.id))) }));
}
