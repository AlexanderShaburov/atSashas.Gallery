// src/shared/state/destructiveActions.store.ts
import { BaseStore } from './baseStore';
import { createNonce } from '@/shared/lib/dateAndLabels/nonceAndNow';
import type { DependencyNode, DependencyTree } from '@/shared/lib/dependencies/dependency.types';

export type DestructivePhase =
    | 'idle'
    | 'checking-dependencies' // NEW: analyzing dependencies
    | 'show-dependencies' // NEW: showing dependency tree with resolution options
    | 'confirm'
    | 'running'
    | 'success'
    | 'error';

export type ResolutionMode = 'simple' | 'manual' | 'cascade';

export type DestructiveJob = {
    jobId?: string;

    title: string;
    message: string;

    // Optional guided copy
    steps?: string[];
    dangerHint?: string;

    // Button labels
    confirmLabel?: string;
    cancelLabel?: string;

    // NEW: Dependency resolution
    resolutionMode?: ResolutionMode;
    dependencies?: DependencyTree;

    // The actual destructive async action (optional when dependencies exist with cascade)
    run?: () => Promise<void>;

    // Optional callbacks
    onSuccess?: () => void;
    onCancel?: () => void;

    // NEW: For manual dependency resolution
    onNavigateToDependency?: (dep: DependencyNode) => void;

    // NEW: For cascade deletion
    onCascadeDelete?: () => Promise<void>;
};

export type DestructiveState = {
    phase: DestructivePhase;
    job?: DestructiveJob;
    error?: string;
};

const initialState: DestructiveState = { phase: 'idle' };

export class DestructiveActionsStore extends BaseStore {
    private state: DestructiveState = initialState;

    // ===== BaseStore contract (adapt names to yours) =====
    public getSnapshot(): DestructiveState {
        return this.state;
    }

    // ===== public API =====
    public open(job: DestructiveJob) {
        if (this.state.phase !== 'idle') return; // or allow override
        const jobId = job.jobId ?? createNonce();

        // Determine initial phase based on dependencies
        const initialPhase = job.dependencies ? 'show-dependencies' : 'confirm';

        this.setState({
            phase: initialPhase,
            job: { ...job, jobId },
            error: undefined,
        });
    }

    public setPhase(phase: DestructivePhase) {
        this.setState({ ...this.state, phase });
    }

    public cancel() {
        const job = this.state.job;
        job?.onCancel?.();

        this.setState({ phase: 'idle', job: undefined, error: undefined });
    }

    public close() {
        this.setState({ phase: 'idle', job: undefined, error: undefined });
    }

    public async confirm() {
        const { job, phase } = this.state;
        if (!job) return;
        if (phase !== 'confirm' && phase !== 'error') return;

        // If no run function, this shouldn't be called (dependencies mode uses cascade instead)
        if (!job.run) {
            console.warn('confirm() called but no run function provided');
            return;
        }

        this.setState({ ...this.state, phase: 'running', error: undefined });

        try {
            await job.run();
            this.setState({ ...this.state, phase: 'success' });
            job.onSuccess?.();
        } catch (e) {
            const msg = e instanceof Error ? e.message : String(e);
            this.setState({ ...this.state, phase: 'error', error: msg });
        }
    }

    // ===== internal =====
    public setState(next: DestructiveState) {
        this.state = next;
        this.emit(); // whatever your BaseStore uses: notify/listeners
    }
}

export const destructiveActionsStore = new DestructiveActionsStore();
