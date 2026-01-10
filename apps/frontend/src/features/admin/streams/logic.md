What we should have in the Stream Session logic?:

1. Session has provide all stream editor components with

- connect logic with actual jump stack state and it's cache, namely:
    - _initiate session according jump stack state and mode stack state_
    - initiateSession()
    - _give to components correct methods to act with global context and store._
    - assignMethods()

---

- data and actions access, including:

    **UI derivatives:**
    - isDirty
    - isValid
    - isSaving

    **Mode Stack control:**
    - pushMode()
    - onEscape()
    - currentStack

    **Streams list Editor Actions ('select' mode):**
    - selectStream()
    - delStream()
    - crateNewStream()
    - save()

    **Stream Editor Actions ('edit' mode):**
    - updateTags()
    - addBlock() !!
    - threeDotMenuHandler( - moveBlock() - deleteBlock() - editBlock()???
      )
    - save()

    **Mode Jumper**
    - editBlock()
    - addBlock() !!

---
