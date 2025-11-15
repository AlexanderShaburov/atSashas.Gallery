import { ArtGerm, ArtItem, TechniquesJson } from '@/entities/art';
import { ArtCatalog, Thumb } from '@/entities/catalog';
import {
    getCatalog,
    getHopperContent,
    getSeriesOptionsCI,
    getTechniques,
    updateCatalog,
} from '@/features/admin/api';
import { ArtToFormAdapter, prepareEditorForm } from '@/features/admin/editorSession/editorLogic/';
import { buildShipment } from '@/features/admin/editorSession/editorLogic/buildShipment';
import type { FormValues } from '@/features/admin/editorSession/editorTypes';
import { deepEqual } from '@/features/admin/utils/checkers';
import { isMinimalValid, sanitizeForm } from '@/features/admin/utils/Validators';
import {
    createContext,
    useCallback,
    useContext,
    useEffect,
    useMemo,
    useRef,
    useState,
} from 'react';

export type EditorSession = {
    catalog: ArtCatalog | undefined;
    hopper: Thumb[];
    identity: ArtGerm | undefined; // matches state
    mode: 'create' | 'edit';
    values: FormValues | undefined;
    setValues: React.Dispatch<React.SetStateAction<FormValues | undefined>>;
    setIdentity: (v: ArtGerm | undefined) => void;
    setMode: (m: 'edit' | 'create') => void;

    /** Start a new session from a hopper unit or existing item */
    editorIsReady: boolean;

    /** Derived flags */
    isDirty: boolean;
    isValid: boolean;
    canSave: boolean;
    loading: boolean;

    /** Persistence controls */
    saving: boolean;
    save: () => Promise<void> | void;
    exit: () => void;

    /** UI helpers */
    thumb: Thumb | undefined;
    techniques: TechniquesJson;
    seriesOptions: string[];
};

const Ctx = createContext<EditorSession | undefined>(undefined);

// eslint-disable-next-line react-refresh/only-export-components
export const useEditorSession = () => {
    const v = useContext(Ctx);
    if (!v) throw new Error('useEditorSession must be used within EditorSessionProvider');
    return v;
};

type ProviderProps = { children: React.ReactNode };

export function EditorSessionProvider({ children }: ProviderProps) {
    // Core state
    const [identity, setIdentity] = useState<ArtGerm | undefined>(undefined);
    const [values, setValues] = useState<FormValues | undefined>(undefined);
    const [catalog, setCatalog] = useState<ArtCatalog | undefined>(undefined);
    const [hopper, setHopper] = useState<Thumb[]>([]);
    const [mode, setMode] = useState<'create' | 'edit'>('create'); // !!! 'edit' in production !!!

    // UI/derived state
    const [techniques, setTechniques] = useState<TechniquesJson>({});
    const [saving, setSaving] = useState(false);
    const [loading, setLoading] = useState(false);
    const [isDirty, setIsDirty] = useState(false);
    const [isValid, setIsValid] = useState(false);
    const [editorIsReady, setEditorIsReady] = useState(false);
    const [thumb, setThumb] = useState<Thumb | undefined>(undefined);
    const [canSave, setCanSave] = useState(false);
    const [seriesOptions, setSeriesOptions] = useState<string[]>([]);
    // Snapshot for dirty checking
    const snapshot = useRef<FormValues | undefined>(undefined);
    // valuesRef for use in functions not should be run after every values change:
    const valuesRef = useRef<FormValues | undefined>(values);

    // Load current catalog and hopper version
    async function refreshBase(): Promise<void> {
        try {
            setLoading(true);
            const cat = await getCatalog();
            setCatalog(cat);
            const hop = await getHopperContent();
            console.log('Received hopper: ', hop);
            setHopper(hop);
        } catch (e) {
            console.error('Failed to load server data: ', e);
        } finally {
            setLoading(false);
        }
    }
    // Load current catalog and hopper version once at provider creation:
    useEffect(() => {
        (async () => {
            await refreshBase();
        })();
    }, []); // <- Load once at provider mounting

    useEffect(() => {
        console.log('values watcher: run. values: ', values);
        valuesRef.current = values;
        console.log('values watcher: run. valuesRef.current: ', valuesRef.current);
    }, [values]);

    /** One-time load of techniques.json */
    useEffect(() => {
        let alive = true;
        (async () => {
            try {
                const tech = await getTechniques();
                const s = await getSeriesOptionsCI();
                if (alive) {
                    setTechniques(tech);
                    setSeriesOptions(s);
                }
            } catch (err) {
                // Surface in console; app flow can continue without techniques
                console.error('Failed to load techniques.json:', err);
            }
        })();
        return () => {
            alive = false;
        };
    }, []);

    /** Recompute canSave whenever the inputs change */
    useEffect(() => {
        setCanSave(!saving && isDirty && isValid);
    }, [isDirty, isValid, saving]);

    /** Start a new editing session (create/edit) on every identity change */
    useEffect(() => {
        console.log('Session initiator called with identity: ', identity);
        let nextThumb: Thumb | undefined = undefined;
        switch (identity?.mode) {
            case 'create': {
                const initialValues = prepareEditorForm(identity);
                console.log('Session initiator: initialValues.id: ', initialValues.id);
                valuesRef.current = initialValues;
                nextThumb = identity.item as Thumb;
                setValues(initialValues);
                console.log('Initiator: Values set as: ', initialValues);
                break;
            }
            case 'edit': {
                const item = identity.item as ArtItem;
                setValues(ArtToFormAdapter(item));
                nextThumb = {
                    id: item.id,
                    src: item.images.full,
                    alt: item.alt,
                } as Thumb;

                break;
            }
            case undefined:
                break;
            default: {
                // If modes expand later, fail fast for now
                console.error('Unsupported session mode:', identity?.mode);
                return;
            }
        }

        // Initialize state
        setThumb(nextThumb);
        console.log('Initiator: Session initiated. valuesRef.current:', valuesRef.current);
        snapshot.current = valuesRef.current; // <-- critical: baseline for dirty checks
        console.log('Initiator: Session initiated. snapshot.current: ', snapshot.current);
        setIsDirty(false);
        if (identity) setEditorIsReady(true);
    }, [identity]);

    /** Reset the whole session */
    const exitSession = useCallback(() => {
        setIdentity(undefined);
        setValues(undefined);
        setTechniques({});
        setSaving(false);
        setIsDirty(false);
        setIsValid(false);
        setEditorIsReady(false);
        setThumb(undefined);
        setCanSave(false);
        snapshot.current = undefined;
    }, []);

    /** Dirty & validity tracking on every form change */
    useEffect(() => {
        if (!valuesRef.current || !snapshot.current) {
            setIsDirty(false);
            setIsValid(false);
            return;
        }
        if (identity) {
            setIsDirty(!deepEqual(snapshot.current, values));
            setIsValid(isMinimalValid(values, identity));
        }
    }, [values, identity]);

    /* SAVE procedure: */

    const save = useCallback(async () => {
        console.log('save function called!');
        if (!values || !canSave) {
            console.log(`!values || !canSave control not passed`);
            console.log(`values are: ${values} and canSave is ${canSave}`);
            return;
        }
        if (!isValid) {
            alert('Minimal required fields are missing (ID + Image).');
            return;
        }
        setSaving(true);
        console.log(`saving set to ${saving}`);
        try {
            const clean = sanitizeForm(values);

            const payload = buildShipment(identity!, clean);

            // if (catalog) upsertCatalogItem(catalog, clean);
            const HTTPCode = await updateCatalog(payload);
            if (HTTPCode !== 200)
                throw new Error(`Catalog  update unsuccessful! Code: ${HTTPCode}`);
            exitSession();
        } catch (e) {
            console.error('Save failed', e);
        } finally {
            setSaving(false);
        }
    }, [values, canSave, isValid, identity, exitSession, saving]); // keep identical behavior to your stub

    /** Public exit with confirmation if dirty */
    const exit = useCallback(() => {
        if (saving) return;
        console.log('isDirty: ', isDirty);
        if (isDirty && !confirm('Discard unsaved changes?')) return;
        exitSession();
    }, [saving, isDirty, exitSession]);

    const value: EditorSession = useMemo(
        () => ({
            mode,
            catalog,
            hopper,
            identity,
            values,
            setValues,
            setIdentity,
            editorIsReady,
            isDirty,
            isValid,
            saving,
            save,
            exit,
            thumb,
            canSave,
            techniques,
            seriesOptions,
            loading,
            setMode,
        }),
        [
            mode,
            catalog,
            hopper,
            identity,
            values,
            editorIsReady,
            isDirty,
            isValid,
            saving,
            save,
            exit,
            thumb,
            canSave,
            techniques,
            seriesOptions,
            loading,
            setMode,
        ],
    );

    return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}
