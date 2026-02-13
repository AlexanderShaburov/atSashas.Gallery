import { useDestructiveActionsStore } from '@/shared/state/useDestructiveActionsStore';
import { destructiveActionsStore } from '@/shared/state/destructiveActions.store';
import type { DependencyNode } from '@/shared/lib/dependencies';
import './DestructiveOverlay.css';

function getIconForNode(kind: DependencyNode['kind']): string {
    switch (kind) {
        case 'artItem':
            return '🖼️';
        case 'block':
            return '🧱';
        case 'stream':
            return '🌊';
    }
}

export function DestructiveOverlay() {
    const s = useDestructiveActionsStore();
    if (s.phase === 'idle' || !s.job) return null;

    const { job } = s;
    const busy = s.phase === 'running';
    const hasDependencies = job.dependencies && job.dependencies.dependents.length > 0;

    return (
        <div className="destrOverlay__backdrop" role="dialog" aria-modal="true">
            <div className="destrOverlay__card">
                <div className="destrOverlay__title">{job.title}</div>
                <div className="destrOverlay__message">{job.message}</div>

                {job.dangerHint && <div className="destrOverlay__danger">{job.dangerHint}</div>}

                {/* Show dependency tree if in show-dependencies phase */}
                {s.phase === 'show-dependencies' && hasDependencies && (
                    <div className="destrOverlay__dependencies">
                        <h3 className="destrOverlay__depHeader">
                            Found {job.dependencies!.dependents.length} dependent object
                            {job.dependencies!.dependents.length !== 1 ? 's' : ''}
                        </h3>

                        <ul className="destrOverlay__depList">
                            {job.dependencies!.dependents.map((dep, i) => (
                                <li key={i} className="destrOverlay__depItem">
                                    <button
                                        onClick={() => job.onNavigateToDependency?.(dep.parent)}
                                        className="depItem__button"
                                        title="Navigate to this object to fix dependency"
                                    >
                                        <span className="depItem__icon">
                                            {getIconForNode(dep.parent.kind)}
                                        </span>
                                        <span className="depItem__content">
                                            <span className="depItem__title">
                                                {dep.parent.title || dep.parent.id}
                                            </span>
                                            <span className="depItem__context">{dep.context}</span>
                                        </span>
                                        <span className="depItem__nav" aria-label="Navigate">
                                            →
                                        </span>
                                    </button>
                                </li>
                            ))}
                        </ul>

                        {/* Cascade delete option */}
                        {job.dependencies!.cascadePreview && job.onCascadeDelete && (
                            <div className="destrOverlay__cascade">
                                <div className="cascade__warning">
                                    <strong>⚠️ Cascade Delete</strong>
                                    <p>This will permanently delete:</p>
                                    <ul>
                                        {job.dependencies!.cascadePreview.blocks.length > 0 && (
                                            <li>
                                                {job.dependencies!.cascadePreview.blocks.length}{' '}
                                                block{job.dependencies!.cascadePreview.blocks.length !== 1 ? 's' : ''}
                                            </li>
                                        )}
                                        {job.dependencies!.cascadePreview.streams.length > 0 && (
                                            <li>
                                                Removes from{' '}
                                                {job.dependencies!.cascadePreview.streams.length}{' '}
                                                stream{job.dependencies!.cascadePreview.streams.length !== 1 ? 's' : ''}
                                            </li>
                                        )}
                                    </ul>
                                </div>
                                <button
                                    className="destrOverlay__dangerBtn"
                                    onClick={async () => {
                                        destructiveActionsStore.setPhase('running');
                                        try {
                                            await job.onCascadeDelete!();
                                            destructiveActionsStore.setPhase('success');
                                            job.onSuccess?.();
                                        } catch (e) {
                                            const msg = e instanceof Error ? e.message : String(e);
                                            destructiveActionsStore.setState({
                                                ...s,
                                                phase: 'error',
                                                error: msg,
                                            });
                                        }
                                    }}
                                    disabled={busy}
                                >
                                    Delete All (Cascade)
                                </button>
                            </div>
                        )}
                    </div>
                )}

                {/* Regular steps for simple confirm */}
                {s.phase === 'confirm' && job.steps?.length ? (
                    <ol className="destrOverlay__steps">
                        {job.steps.map((x, i) => (
                            <li key={i}>{x}</li>
                        ))}
                    </ol>
                ) : null}

                {s.phase === 'error' && <div className="destrOverlay__error">{s.error}</div>}

                <div className="destrOverlay__actions">
                    {/* Show Cancel button in dependency view */}
                    {s.phase === 'show-dependencies' && (
                        <button onClick={() => destructiveActionsStore.cancel()}>
                            {job.cancelLabel ?? 'Cancel'}
                        </button>
                    )}

                    {/* Regular confirm/delete for simple deletion */}
                    {(s.phase === 'confirm' || s.phase === 'error') && (
                        <>
                            <button
                                disabled={busy}
                                onClick={() => destructiveActionsStore.cancel()}
                            >
                                {job.cancelLabel ?? 'Cancel'}
                            </button>

                            <button
                                className="destrOverlay__dangerBtn"
                                disabled={busy}
                                onClick={() => destructiveActionsStore.confirm()}
                            >
                                {job.confirmLabel ?? 'Delete'}
                            </button>
                        </>
                    )}

                    {s.phase === 'running' && <button disabled>Working…</button>}
                    {s.phase === 'success' && (
                        <button onClick={() => destructiveActionsStore.close()}>Close</button>
                    )}
                </div>
            </div>
        </div>
    );
}
