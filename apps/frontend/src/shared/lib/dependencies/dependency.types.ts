// src/shared/lib/dependencies/dependency.types.ts

/**
 * Represents a node in the dependency graph
 */
export type DependencyNode = {
    kind: 'artItem' | 'block' | 'stream';
    id: string;
    title?: string;
};

/**
 * Represents a dependency relationship between two nodes
 * The parent depends on (uses) the child
 */
export type DependencyEdge = {
    parent: DependencyNode; // the dependent object (e.g., a block)
    child: DependencyNode; // the object being used (e.g., an artItem)
    context: string; // human-readable description of the relationship
};

/**
 * Complete dependency analysis for a target object
 */
export type DependencyTree = {
    target: DependencyNode; // what user wants to delete
    dependents: DependencyEdge[]; // who depends on target
    cascadePreview?: CascadePreview; // what would be deleted in cascade mode
};

/**
 * Preview of what would be affected by cascade deletion
 */
export type CascadePreview = {
    blocks: string[]; // block IDs that would be deleted
    streams: string[]; // stream IDs that would be deleted or modified
    emptyStreams: string[]; // stream IDs that would become empty and be deleted
    affectedCount: number; // total number of objects affected
};

/**
 * Result of a dependency check
 */
export type DependencyCheckResult =
    | { hasDependencies: false }
    | { hasDependencies: true; tree: DependencyTree };
