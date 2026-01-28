# BlockEditorSession.context structure:

## States:

- mode -> legacy state, has 'create' and 'edit' mode was implemented for early stages of editor
- collection - state holding BlockCollectionJSON object

    ```ts
    //*******************************************************/
    // Core state:
    // 1. Editor mode, used to decide if show templates(????)
    const [mode, setMode] = useState<BlockEditorMode>('create');
    // 2. Blocks collection
    const [collection, setCollection] = useState<BlocksCollectionJSON | undefined>(undefined);
    // 3. Selected block
    const [selectedBlock, setSelectedBlock] = useState<Block | undefined>(undefined);
    // 4. Editor form values:
    const [values, setValues] = useState<Block | undefined>(undefined);
    // 5. Editor mode, used to decide if show grid or single block editor:
    const [modeStack, setModeStack] = useState<BlockEditorScreenMode[]>(['select']);
    // 6. Target used to choose if input has to shown on place of text in inlineEditor
    const [currentTarget, setCurrentTarget] = useState<EditTarget | undefined>(undefined);
    //*******************************************************/
    // UI / derived state
    const [saving, setSaving] = useState(false);
    const [loading, setLoading] = useState(false);
    // editorIsReady is to identify if now a block is under editing!!!
    const [editorIsReady, setEditorIsReady] = useState(false);
    const [pendingSelection, setPendingSelection] = useState<BlockHitEvent | undefined>(undefined);

    const [uiError, setUiError] = useState<UiErrorState | undefined>(undefined);

    const snapshot = useRef<Block | undefined>(undefined);
    // const valuesRef = useRef<Block | undefined>(values);
    ```

    ## Navigation:

    ```ts
    // ************* NAVIGATION HOOKS *************

    // read ticket getter
    const arrival = useArrival();
    // const dispatch = useDispatch();
    const returnHome = useReturnHome();
    const peekTicket = usePeekTicket();
    //
    ```

## ScreenMode state control:

    - pushMode(next: BlockEditorScreenMode)
    - onEscape()
    - currentStack{} object

## UI control:

    - refreshCollection()
    - resetSession()
    - onHit() - callback for handling user actions separate with sub handlers:
        - handleEditHit
        - handleSelectHit
    - unHit handler
    - save handler
    - exit handler

    - setSelectedArtItem
    - onDelete handler
    - updateTags handler

## BOOTSTRAP with post save nav:
