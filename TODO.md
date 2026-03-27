 1. Open a Stream page containing a gallery block with event slots → verify
 events are interactive, QuickView works on art clicks
 2. Open HomePage with a blockRef pointing to the same gallery block → verify
 identical rendering (same layout, same slots, event is interactive)
 3. Open HomePage with multiple blockRef items (2-3 blocks) → verify all render
  in order, full-width, no tile/thumbnail appearance
 4. Open HomePage with a mix of streamRef + blockRef items → verify stream
 thumbnails unchanged, blocks render as full blocks
 5. Open HomePage with a cta block → verify title, body, button appear with
 link
