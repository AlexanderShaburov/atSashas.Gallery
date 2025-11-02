import { ArtGerm, ArtItem, TechniquesJson } from '@/entities/art';
import type { EditorIdentity, Thumb } from '@/entities/catalog';
import { getSeriesOptionsCI, getTechniques } from '@/features/admin/api';
import { prepareEditorForm } from '@/features/admin/editorSession/editorLogic/editorLogic';
import type { FormValues } from '@/features/admin/editorSession/editorTypes';
import { deepEqual } from '@/features/admin/utils/checkers';
import { isMinimalValid } from '@/features/admin/utils/Validators';
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
    identity: EditorIdentity | undefined; // matches state
    values: FormValues | undefined;
    setValues: React.Dispatch<React.SetStateAction<FormValues | undefined>>;
    setIdentity: (v: EditorIdentity | undefined) => void;

    /** Start a new session from a hopper unit or existing item */
    startEditorSession: (unit: ArtGerm) => void;
    editorIsReady: boolean;

    /** Derived flags */
    isDirty: boolean;
    isValid: boolean;
    canSave: boolean;

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
    const [identity, setIdentity] = useState<EditorIdentity | undefined>(undefined);
    const [values, setValues] = useState<FormValues | undefined>(undefined);

    // UI/derived state
    const [techniques, setTechniques] = useState<TechniquesJson>({});
    const [saving, setSaving] = useState(false);
    const [isDirty, setIsDirty] = useState(false);
    const [isValid, setIsValid] = useState(false);
    const [editorIsReady, setEditorIsReady] = useState(false);
    const [thumb, setThumb] = useState<Thumb | undefined>(undefined);
    const [canSave, setCanSave] = useState(false);
    const [seriesOptions, setSeriesOptions] = useState<string[]>([]);
    // Snapshot for dirty checking
    const snapshot = useRef<FormValues | undefined>(undefined);

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

    /** Start a new editing session (create/edit) */
    const startEditorSession = useCallback(
        (unit: ArtGerm) => {
            const initialValues = prepareEditorForm(unit);

            let nextThumb: Thumb | undefined = undefined;
            switch (unit.mode) {
                case 'create': {
                    nextThumb = unit.item as Thumb;
                    break;
                }
                case 'edit': {
                    const item = unit.item as ArtItem;
                    nextThumb = {
                        id: item.id,
                        src: item.images.full,
                        alt: item.alt,
                    } as Thumb;
                    break;
                }
                default: {
                    // If modes expand later, fail fast for now
                    console.error('Unsupported session mode:', unit?.mode);
                    return;
                }
            }

            // Initialize state
            setValues(initialValues);
            setThumb(nextThumb);
            snapshot.current = initialValues; // <-- critical: baseline for dirty checks
            setIsDirty(false);
            setIsValid(isMinimalValid(initialValues, identity));
            setEditorIsReady(true);
        },
        [identity],
    );

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
        if (!values || !snapshot.current) {
            setIsDirty(false);
            setIsValid(false);
            return;
        }
        setIsDirty(!deepEqual(snapshot.current, values));
        setIsValid(isMinimalValid(values, identity));
    }, [values, identity]);

    /** Persist (stub left intact) */
    const save = useCallback(async () => {
        // if (!values) return;
        // if (!isValid) {
        //   alert('Minimal required fields are missing (ID + Image).');
        //   return;
        // }
        // setSaving(true);
        // try {
        //   const clean = sanitizeForm(values);
        //   const payload = buildJSON(identity!, clean);
        //   await saveJSON(payload);
        //   exitSession();
        // } catch (e) {
        //   console.error('Save failed', e);
        // } finally {
        //   setSaving(false);
        // }
    }, []); // keep identical behavior to your stub

    /** Public exit with confirmation if dirty */
    const exit = useCallback(() => {
        if (saving) return;
        if (isDirty && !confirm('Discard unsaved changes?')) return;
        exitSession();
    }, [saving, isDirty, exitSession]);

    const value: EditorSession = useMemo(
        () => ({
            identity,
            values,
            setValues,
            setIdentity,
            startEditorSession,
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
        }),
        [
            identity,
            values,
            startEditorSession,
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
        ],
    );

    return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}
