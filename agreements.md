```bash
SashaGallery/
├─ apps/
│  ├─ admin-backend/
│  └─ frontend/
├─ docker/
│  ├─ .env
│  ├─ Caddyfile.dev
│  └─ docker-compose.yml
└─ vault/
    ├─ arts/
    │  ├─ fullsize/
    │  ├─ previews/
    │  ├─ mixed/
    │  ├─ watercolor/
    │  └─ catalog.json
    └─ streams/
        └─ streams.json  
```


```json
// Technics specter:
{
  "painting": {
    "label": "Painting",
    "items": [
      "watercolor",
      "gouache",
      "acrylic",
      "oil",
      "tempera",
      "ink painting",
      "pastel",
      "encaustic",
      "spray paint",
      "mixed media (painting)",
      "airbrush",
      "fresco"
    ]
  },

  "drawing": {
    "label": "Drawing & Printmaking",
    "items": [
      "pencil",
      "charcoal",
      "ink drawing",
      "marker",
      "colored pencil",
      "chalk",
      "silverpoint",
      "ballpoint pen",
      "digital drawing",
      "lithography",
      "etching",
      "aquatint",
      "woodcut",
      "linocut",
      "monotype"
    ]
  },

  "collage_textile": {
    "label": "Collage, Textile & Paper",
    "items": [
      "collage",
      "paper cut",
      "origami",
      "textile art",
      "embroidery",
      "weaving",
      "tapestry",
      "fiber art"
    ]
  },

  "sculpture": {
    "label": "Sculpture & Installation",
    "items": [
      "clay sculpture",
      "bronze sculpture",
      "stone sculpture",
      "wood sculpture",
      "plaster sculpture",
      "resin sculpture",
      "mixed materials sculpture",
      "ceramic",
      "porcelain",
      "glass",
      "metalwork",
      "kinetic sculpture",
      "installation"
    ]
  },

  "digital": {
    "label": "Digital & Multimedia",
    "items": [
      "digital painting",
      "digital collage",
      "3D modeling",
      "virtual sculpture",
      "augmented reality art",
      "video art",
      "generative art",
      "NFT / blockchain art"
    ]
  },

  "photography": {
    "label": "Photography & Print",
    "items": [
      "photography",
      "photomontage",
      "cyanotype",
      "screen printing",
      "giclée print",
      "inkjet print",
      "serigraphy"
    ]
  },

  "mixed_other": {
    "label": "Mixed & Conceptual",
    "items": [
      "mixed media (general)",
      "conceptual art",
      "assemblage",
      "performance art",
      "light installation",
      "found object",
      "recycled materials"
    ]
  }
}

```
- ## All paths from /vault root:  
```bash
"arts/previews/somUniqId.webp"
"arts/fullsize/somUniqId.png"
```
## vault/arts/catalog.json example:
```json
{
  "catalogVersion": 1,
  "updatedAt": "2025-10-14",
  "order": ["somUniqId", "somUniqId2"],

  "items": {
    "somUniqId": {
      "id": "somUniqId",
      "title": {
        "en": "Very Beautiful Composition #1"
      },
      "dateCreated": "2025-10-06",
      "techniques": ["painting/watercolor"],
      "price": {
        "amount": 1200,
        "currency": "EUR"
      },
      "availability": "available",
      "series": "nightmares",
      "tags": ["mixed media", "scary", "not abstract"],
      "notes": "under heavy chemicals",
      "images": {
        "alt": {
          "en": "Abstract watercolor composition"
        },
        "preview": {
          "avif": "arts/previews/somUniqId.avif",
          "webp": "arts/previews/somUniqId.webp",
          "jpeg": "arts/previews/somUniqId.jpg"
        },
        "full": "arts/fullsize/somUniqId.png"
      },
      "dimensions": {
        "width": 80,
        "height": 100,
        "unit": "cm"
      }
    },

    "somUniqId2": {
      "id": "somUniqId2",
      "title": {
        "en": "Very Beautiful Composition #2"
      },
      "dateCreated": "2025-10-06",
      "techniques": ["painting/watercolor", "drawing/ink drawing"],
      "price": {
        "amount": 950,
        "currency": "EUR"
      },
      "availability": "privateCollection",
      "series": "nightmares",
      "tags": ["ink", "expressionism"],
      "notes": "created during experimental phase",
      "images": {
        "alt": {
          "en": "Dark abstract composition in watercolor and ink"
        },
        "preview": {
          "avif": "arts/previews/somUniqId2.avif",
          "webp": "arts/previews/somUniqId2.webp",
          "jpeg": "arts/previews/somUniqId2.jpg"
        },
        "full": "arts/fullsize/somUniqId2.png"
      },
      "dimensions": {
        "width": 70,
        "height": 90,
        "unit": "cm"
      }
    }
  }
}
```