useEffect(() => {
    (async () => {
        try {
            setLoading(true);
            console.log('[INIT SESSION]: started');

            const collectionId = gCtxt.currentBlocksCollectionId;
            const blockRef = gCtxt.currentBlockRef;

            // 1) Коллекция не выбрана в workspace → локально всё сбрасываем
            if (!collectionId) {
                setCollection(undefined);
                resetSession();
                setMode('create');
                return;
            }

            // 2) Загружаем коллекцию по ID из workspace
            const nextCollection = await getCollection(collectionId);
            setCollection(nextCollection);

            // 3) Если в workspace нет выбранного блока — просто открываем коллекцию в режиме "create"
            if (!blockRef) {
                resetSession();
                setMode('create');
                return;
            }

            // 4) Проверяем согласованность blockRef и collectionId
            if (blockRef.collectionId !== collectionId) {
                console.error('Workspace context error: collection and block mismatch');
                console.error(`Block's collection id: ${blockRef.collectionId}`);
                console.error(`Workspace collection id: ${collectionId}`);
                setCollection(undefined);
                resetSession();
                return;
            }

            // 5) Ищем блок в только что загруженной коллекции
            const bl = nextCollection.blocks.find((block) => block.id === blockRef.blockId);

            if (!bl) {
                console.error(`Can't find block ${blockRef.blockId} in corresponding collection`);
                resetSession();
                return;
            }

            setIdentity(bl);
            setValues(blockToForm(bl));
            setMode('edit');
        } catch (e) {
            console.error(`Loading error ${e}`);
        } finally {
            setLoading(false);
        }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
}, [gCtxt.currentBlocksCollectionId, gCtxt.currentBlockRef]);
