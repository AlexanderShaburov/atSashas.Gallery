export const techniquesDict = {
  painting: {
    label: 'Painting',
    items: [
      'watercolor',
      'gouache',
      'acrylic',
      'oil',
      'tempera',
      'ink painting',
      'pastel',
      'encaustic',
      'spray paint',
      'mixed media (painting)',
      'airbrush',
      'fresco',
    ],
  },

  drawing: {
    label: 'Drawing & Printmaking',
    items: [
      'pencil',
      'charcoal',
      'ink drawing',
      'marker',
      'colored pencil',
      'chalk',
      'silverpoint',
      'ballpoint pen',
      'digital drawing',
      'lithography',
      'etching',
      'aquatint',
      'woodcut',
      'linocut',
      'monotype',
    ],
  },

  collage_textile: {
    label: 'Collage, Textile & Paper',
    items: [
      'collage',
      'paper cut',
      'origami',
      'textile art',
      'embroidery',
      'weaving',
      'tapestry',
      'fiber art',
    ],
  },

  sculpture: {
    label: 'Sculpture & Installation',
    items: [
      'clay sculpture',
      'bronze sculpture',
      'stone sculpture',
      'wood sculpture',
      'plaster sculpture',
      'resin sculpture',
      'mixed materials sculpture',
      'ceramic',
      'porcelain',
      'glass',
      'metalwork',
      'kinetic sculpture',
      'installation',
    ],
  },

  digital: {
    label: 'Digital & Multimedia',
    items: [
      'digital painting',
      'digital collage',
      '3D modeling',
      'virtual sculpture',
      'augmented reality art',
      'video art',
      'generative art',
      'NFT / blockchain art',
    ],
  },

  photography: {
    label: 'Photography & Print',
    items: [
      'photography',
      'photomontage',
      'cyanotype',
      'screen printing',
      'giclée print',
      'inkjet print',
      'serigraphy',
    ],
  },

  mixed_other: {
    label: 'Mixed & Conceptual',
    items: [
      'mixed media (general)',
      'conceptual art',
      'assemblage',
      'performance art',
      'light installation',
      'found object',
      'recycled materials',
    ],
  },
} as const;

// Types derived automatically from dict:
export type TechniqueCategory = keyof typeof techniquesDict;
type ItemOf<C extends TechniqueCategory> = (typeof techniquesDict)[C]['items'][number];

// "category/item" concatenation for all categories:
export type Technique = { [C in TechniqueCategory]: `${C}/${ItemOf<C>}` }[TechniqueCategory];

export type Techniques = Technique[];

// ---- UTILS----:

// Flat category/items list - useful for comparison/validation:
export const flattenTechniques = (): Technique[] => {
  const result: string[] = [];
  (Object.keys(techniquesDict) as TechniqueCategory[]).forEach((cat) => {
    techniquesDict[cat].items.forEach((item) => {
      result.push(`${cat}/${item}`);
    });
  });
  return result as Technique[];
};

// Type Guard: check string as valid technique:
export const isTechnique = (value: string): value is Technique => {
  return (flattenTechniques() as string[]).includes(value);
};
