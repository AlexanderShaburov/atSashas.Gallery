## I lost the thread doing CreateForm Save button:

**The matter is I lost ArtItem object creation sequence.**

1. In CreateForm.tsx we have FormValues interface.
2. Basing on this interface we create initial values for the **form**.
3. Using collected values, **Then unknown starts:**

### Previous version:

- Convert **FormValues** data to **ArtItemJSON** data format.
- Convey created **ArtItemJSON** to backend for save it.

## Alternative vision:

- Create **ArtItemInit** type object
- Convey this object to **ArtItem** constructor as a New ArtItem(myArtItemInit)
- Convey just done object to backend as myNewObject.toJSON() to the backend.

### The difference between FormValues and ArtItemInit is just in _category_ field!

IDEA is: convey repacked FormValues to constructor as:

```ts
const newArtItem = {...values, combineTechniques(values.category, values.technique)}
```

I like it!!!!

---

# NEXT STEP:

### What fields ArtItem must contain?

**Assumption:** just two - ID and url

## AGREEMENT:

1. On click on Hopper thumbnail ->
    1. Create id;
    2. ImageDraft - url to Hopper url;

# **IMPORTANT: ARCHITECTURE DECISION**
