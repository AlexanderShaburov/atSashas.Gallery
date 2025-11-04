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

### !!!!

- in the category - techniques frame, form has to cary current techniques list display and button add/edit field
- on that button click frame has to change to current view: category select and depended techniques select list.
- end confirm button after that view comes back to selected techniques list.

**How transform ArtItem to FormValues?**

1. id - ok
2. dateCreated - ok
3. title: ok
4. techniques: to be refactored
5. price: ok
6. availability: ok
7. dimensions: ok
8. series: ok
9. tags: not ok and it's to think issue
10. alt: ok
11. notes: ok
12. images: -> not to transfer
