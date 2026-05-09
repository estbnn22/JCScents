export type FragranceMoment = "day" | "night";
export type FragranceSeason = "spring" | "summer" | "fall" | "winter";

export type FragranceAccord = {
  color: string;
  name: string;
  strength: number;
};

export type FragranceDetailEntry = {
  accords?: FragranceAccord[];
  bottleScale?: number;
  bottleTranslateX?: string;
  bottleTranslateY?: string;
  moments?: FragranceMoment[];
  notes?: {
    base?: string[];
    middle?: string[];
    top?: string[];
  };
  seasons?: FragranceSeason[];
  summary?: string;
};

export type FragranceLookupInput = {
  fullName?: string;
  rawText?: string;
  slug: string;
};

type ProfileSeed = {
  accords: string[];
  moments?: FragranceMoment[];
  notes: {
    base: string[];
    middle: string[];
    top: string[];
  };
  seasons?: FragranceSeason[];
  summary: string;
};

const accordPalette = {
  amber: "#d89159",
  aquatic: "#8edaf2",
  aromatic: "#59b4a3",
  balsamic: "#c9bca8",
  cherry: "#b94c5a",
  citrus: "#efe84f",
  coconut: "#efe3c1",
  earthy: "#8b7a66",
  floral: "#e0a8ba",
  fresh: "#addde2",
  "fresh spicy": "#a6d85f",
  fruity: "#f48d76",
  green: "#70b86d",
  honey: "#ebb35d",
  iris: "#cdbfdc",
  lavender: "#cbb7db",
  leather: "#7a5038",
  marine: "#76cbe0",
  mossy: "#647d49",
  musky: "#ddd2df",
  oud: "#5e3d28",
  powdery: "#e7ddd1",
  resinous: "#b79f83",
  salty: "#99d4dd",
  smoky: "#b8b0bb",
  sweet: "#f1848b",
  tobacco: "#8a5d2d",
  tropical: "#e7c46b",
  vanilla: "#f3edb1",
  "warm spicy": "#cf8058",
  woody: "#97622a",
} as const;

export const supportedAccordNames = Object.keys(accordPalette) as Array<
  keyof typeof accordPalette
>;

const accordStrengthScale = [100, 91, 83, 76, 69, 63, 58, 53, 49, 45];

export function getDefaultAccordStrength(index: number) {
  return accordStrengthScale[index] ?? 40;
}

export function buildAccords(
  names: string[],
  strengths?: number[],
): FragranceAccord[] {
  return names.slice(0, 10).map((rawName, index) => {
    const name = normalizeAccordName(rawName);
    const strength = strengths?.[index];

    return {
      color: accordPalette[name] ?? accordPalette.woody,
      name,
      strength: normalizeAccordStrength(strength, index),
    };
  });
}

function normalizeAccordStrength(value: number | undefined, index: number) {
  if (typeof value !== "number" || Number.isNaN(value)) {
    return getDefaultAccordStrength(index);
  }

  return Math.max(0, Math.min(100, Math.round(value)));
}

export function normalizeAccordName(value: string) {
  const normalized = value.trim().toLowerCase();
  const aliases: Record<string, keyof typeof accordPalette> = {
    animalic: "leather",
    anis: "fresh spicy",
    aromatic: "aromatic",
    aquatic: "aquatic",
    blue: "fresh",
    boozy: "amber",
    camphor: "fresh",
    caramel: "sweet",
    cinnamon: "warm spicy",
    clean: "fresh",
    coconut: "coconut",
    creamy: "powdery",
    fresh: "fresh",
    fruity: "fruity",
    gourmand: "sweet",
    green: "green",
    herbal: "aromatic",
    honey: "honey",
    iris: "iris",
    lactonic: "coconut",
    leathery: "leather",
    marine: "marine",
    mineral: "aquatic",
    mossy: "mossy",
    musky: "musky",
    nutty: "sweet",
    oud: "oud",
    ozonic: "fresh",
    patchouli: "woody",
    powdery: "powdery",
    resinous: "resinous",
    salty: "salty",
    smoky: "smoky",
    soft: "fresh",
    spicy: "fresh spicy",
    sweet: "sweet",
    tobacco: "tobacco",
    tropical: "tropical",
    tuberose: "floral",
    vanilla: "vanilla",
    white: "fresh",
    woody: "woody",
  };

  if (normalized in accordPalette) {
    return normalized as keyof typeof accordPalette;
  }

  for (const [token, accord] of Object.entries(aliases)) {
    if (normalized.includes(token)) {
      return accord;
    }
  }

  if (normalized.includes("citr")) return "citrus";
  if (normalized.includes("amber")) return "amber";
  if (normalized.includes("spicy")) return "warm spicy";
  if (normalized.includes("fresh")) return "fresh";

  return "woody";
}

function buildProfile(seed: ProfileSeed): FragranceDetailEntry {
  return {
    accords: buildAccords(seed.accords),
    moments: seed.moments ?? inferMoments(seed.accords),
    notes: seed.notes,
    seasons: seed.seasons ?? inferSeasons(seed.accords),
    summary: seed.summary,
  };
}

function inferMoments(accords: string[]): FragranceMoment[] {
  const set = new Set(accords.map((accord) => normalizeAccordName(accord)));
  const hasFresh = ["citrus", "fresh", "aquatic", "marine", "green", "aromatic"].some((key) =>
    set.has(key as keyof typeof accordPalette),
  );
  const hasWarm = ["amber", "sweet", "vanilla", "warm spicy", "smoky", "oud", "leather"].some((key) =>
    set.has(key as keyof typeof accordPalette),
  );

  if (hasFresh && hasWarm) {
    return ["day", "night"];
  }

  if (hasWarm) {
    return ["night"];
  }

  return ["day", "night"];
}

function inferSeasons(accords: string[]): FragranceSeason[] {
  const set = new Set(accords.map((accord) => normalizeAccordName(accord)));
  const seasons = new Set<FragranceSeason>();

  if (["citrus", "fresh", "aquatic", "marine", "green", "tropical"].some((key) => set.has(key as keyof typeof accordPalette))) {
    seasons.add("spring");
    seasons.add("summer");
  }

  if (["amber", "sweet", "vanilla", "warm spicy", "smoky", "oud", "leather", "tobacco"].some((key) =>
    set.has(key as keyof typeof accordPalette),
  )) {
    seasons.add("fall");
    seasons.add("winter");
  }

  if (seasons.size === 0) {
    seasons.add("spring");
    seasons.add("fall");
  }

  return [...seasons];
}

const menCatalogDetails: Record<string, FragranceDetailEntry> = {
  "bleu-de-chanel": buildProfile({
    accords: ["citrus", "woody", "fresh spicy", "aromatic", "amber", "smoky", "balsamic", "green", "fresh"],
    notes: {
      top: ["Grapefruit", "Lemon", "Mint", "Pink Pepper"],
      middle: ["Ginger", "Nutmeg", "Jasmine", "Iso E Super"],
      base: ["Incense", "Vetiver", "Cedar", "Sandalwood", "Patchouli", "Labdanum", "White Musk"],
    },
    summary: "Perfil citrico y amaderado con salida limpia, corazon especiado y un secado elegante con incienso y vetiver.",
  }),
  "bleu-de-chanel-eau-de-parfum": buildProfile({
    accords: ["citrus", "amber", "woody", "fresh spicy", "aromatic", "smoky", "balsamic", "powdery"],
    notes: {
      top: ["Grapefruit", "Lemon", "Mint", "Bergamot", "Pink Pepper", "Aldehydes", "Coriander"],
      middle: ["Ginger", "Nutmeg", "Jasmine", "Melon"],
      base: ["Incense", "Amber", "Cedar", "Sandalwood", "Amberwood", "Patchouli", "Labdanum"],
    },
    summary: "Version mas calida y resinosa de Bleu con mas ambar, incienso y profundidad nocturna.",
  }),
  "bleu-de-chanel-l-exclusif": buildProfile({
    accords: ["woody", "amber", "powdery", "musky", "balsamic"],
    notes: {
      top: ["Bergamot", "Citrus Peel"],
      middle: ["Cedar", "Labdanum"],
      base: ["Amber", "Sandalwood", "Woody Notes", "White Musk"],
    },
    summary: "Interpretacion mas densa y ambarada de Bleu, enfocada en maderas pulidas y un fondo resinoso.",
  }),
  "bleu-de-chanel-parfum": buildProfile({
    accords: ["woody", "citrus", "aromatic", "amber", "fresh spicy", "powdery", "warm spicy", "green", "lavender"],
    notes: {
      top: ["Lemon Zest", "Bergamot", "Mint", "Artemisia"],
      middle: ["Lavender", "Geranium", "Pineapple", "Green Notes"],
      base: ["Sandalwood", "Cedar", "Amberwood", "Iso E Super", "Tonka Bean"],
    },
    summary: "La faceta mas profunda de Bleu: salida citrica brillante y secado cremoso de maderas, lavanda y tonka.",
  }),
  "chanel-allure-homme": buildProfile({
    accords: ["citrus", "vanilla", "woody", "fresh spicy", "sweet", "aromatic", "amber", "powdery"],
    notes: {
      top: ["Lemon", "Peach", "Ginger", "Mandarin Orange", "Lavender", "Bergamot"],
      middle: ["Pepper", "Cedar", "Patchouli", "Vetiver", "Jasmine", "Rose", "Gardenia"],
      base: ["Vanilla", "Tonka Bean", "Sandalwood", "Coconut", "Amber", "Benzoin", "Musk", "Leather", "Oakmoss"],
    },
    summary: "Citrico especiado con fondo cremoso y vainillado, una firma clasica con madera y cuero suave.",
  }),
  "chanel-allure-homme-sport-eau-extreme": buildProfile({
    accords: ["aromatic", "woody", "fresh spicy", "citrus", "green", "vanilla", "sweet", "musky", "amber"],
    notes: {
      top: ["Mandarin Orange", "Mint", "Cypress", "Sage"],
      middle: ["Pepper"],
      base: ["Tonka Bean", "Musk", "Sandalwood", "Cedar"],
    },
    summary: "Fresco deportivo con menta y mandarina arriba, pimienta en el centro y tonka cremosa al fondo.",
  }),
  "chanel-allure-homme-sport-superleggera": buildProfile({
    accords: ["citrus", "woody", "musky", "powdery", "amber", "fresh"],
    notes: {
      top: ["Grapefruit", "Mandarin", "Citrus Notes"],
      middle: ["Cedarwood", "Woody Notes"],
      base: ["White Musk", "Amber", "Patchouli", "Sandalwood"],
    },
    summary: "Salida luminosa y citrica con maderas secas y un fondo almizclado limpio de estilo deportivo.",
  }),
  "versace-eros-edp": buildProfile({
    accords: ["citrus", "aromatic", "green", "vanilla", "woody", "fresh", "amber", "sweet"],
    notes: {
      top: ["Mint", "Candied Apple", "Lemon", "Mandarin"],
      middle: ["Ambroxan", "Geranium", "Clary Sage"],
      base: ["Vanilla", "Cedar", "Sandalwood", "Bitter Orange", "Patchouli", "Leather"],
    },
    summary: "Version mas redonda y densa de Eros con citricos dulces, salvia aromatica y base de vainilla y cuero.",
  }),
  "versace-eros-flame": buildProfile({
    accords: ["citrus", "vanilla", "fresh spicy", "aromatic", "woody", "warm spicy", "sweet", "powdery"],
    notes: {
      top: ["Mandarin Orange", "Madagascar Pepper", "Lemon", "Chinotto", "Rosemary"],
      middle: ["Geranium", "Rose", "Pepperwood"],
      base: ["Vanilla", "Tonka Bean", "Sandalwood", "Texas Cedar", "Patchouli", "Oakmoss"],
    },
    summary: "Eros mas calido y especiado, con citricos vibrantes y un fondo de vainilla, cedro y musgo.",
  }),
};

const profileLibrary = {
  "fresh-blue": buildProfile({
    accords: ["citrus", "aromatic", "fresh spicy", "woody", "fresh", "marine"],
    notes: {
      top: ["Bergamot", "Grapefruit", "Lemon"],
      middle: ["Ginger", "Lavender", "Geranium"],
      base: ["Cedar", "Ambroxan", "White Musk", "Patchouli"],
    },
    summary: "Acorde fresco y versatil con salida citrica, corazon aromatico y base amaderada limpia.",
  }),
  "aromatic-green": buildProfile({
    accords: ["green", "aromatic", "citrus", "woody", "fresh"],
    notes: {
      top: ["Green Apple", "Bergamot", "Grapefruit"],
      middle: ["Lavender", "Violet Leaf", "Sage"],
      base: ["Cedar", "Amberwood", "Musk", "Oakmoss"],
    },
    summary: "Perfil verde y luminoso con salida chispeante, centro herbal y fondo de maderas claras y musgo.",
  }),
  "sweet-spicy-night": buildProfile({
    accords: ["vanilla", "sweet", "warm spicy", "amber", "aromatic", "woody"],
    notes: {
      top: ["Mandarin", "Mint", "Bergamot"],
      middle: ["Lavender", "Cinnamon", "Clary Sage"],
      base: ["Vanilla", "Tonka Bean", "Amber", "Cedar"],
    },
    summary: "Dulce y especiado de corte nocturno con lavanda aromatica y un fondo ambarado de vainilla y tonka.",
  }),
  "tropical-fresh": buildProfile({
    accords: ["tropical", "coconut", "citrus", "sweet", "woody", "fresh"],
    notes: {
      top: ["Lime", "Bergamot", "Coconut Water"],
      middle: ["Fig Leaf", "Pineapple", "Jasmine"],
      base: ["Sandalwood", "Ambergris", "Tonka Bean", "Musk"],
    },
    summary: "Fresco tropical con coco y citricos al inicio, faceta verde-frutal en el centro y fondo solar amaderado.",
  }),
  "clean-iris-woody": buildProfile({
    accords: ["woody", "powdery", "citrus", "aromatic", "musky", "iris"],
    notes: {
      top: ["Bergamot", "Cardamom", "Neroli"],
      middle: ["Iris", "Violet", "Sage"],
      base: ["Cedar", "Vetiver", "Amberwood", "Musk"],
    },
    summary: "Limpio y elegante, con salida citrica, corazon irisado y base moderna de vetiver, cedro y almizcles.",
  }),
  "dark-leather-oud": buildProfile({
    accords: ["leather", "oud", "woody", "amber", "warm spicy", "smoky"],
    notes: {
      top: ["Pink Pepper", "Saffron", "Bergamot"],
      middle: ["Leather", "Rose", "Patchouli"],
      base: ["Oud", "Amber", "Vanilla", "Sandalwood"],
    },
    summary: "Oscuro y contundente, con cuero especiado, rosas secas y un fondo intenso de oud, ambar y madera.",
  }),
  "gourmand-amber": buildProfile({
    accords: ["sweet", "vanilla", "amber", "warm spicy", "tobacco", "honey"],
    notes: {
      top: ["Cognac", "Apple", "Bergamot"],
      middle: ["Cinnamon", "Honey", "Tobacco"],
      base: ["Vanilla", "Tonka Bean", "Benzoin", "Sandalwood"],
    },
    summary: "Ambarado y gourmand con especias dulces, miel y tabaco sobre un fondo cremoso de vainilla y maderas.",
  }),
  "mossy-fruity": buildProfile({
    accords: ["fruity", "woody", "citrus", "mossy", "musky", "fresh spicy"],
    notes: {
      top: ["Pineapple", "Bergamot", "Black Currant"],
      middle: ["Patchouli", "Jasmine", "Cedar"],
      base: ["Oakmoss", "Ambergris", "Musk", "Woody Notes"],
    },
    summary: "Frutal amaderado con apertura chispeante y un secado musgoso, seco y muy masculino.",
  }),
  "marine-citrus": buildProfile({
    accords: ["marine", "citrus", "aromatic", "salty", "woody", "fresh"],
    notes: {
      top: ["Sea Notes", "Grapefruit", "Mandarin Orange"],
      middle: ["Bay Leaf", "Rosemary", "Jasmine"],
      base: ["Ambergris", "Guaiac Wood", "Patchouli", "Oakmoss"],
    },
    summary: "Acuatico citrico con sensacion salada y herbal, rematado por maderas claras y ambra marina.",
  }),
  "luxury-citrus": buildProfile({
    accords: ["citrus", "fresh", "musky", "woody", "aromatic", "fresh spicy"],
    notes: {
      top: ["Citron", "Bergamot", "Orange"],
      middle: ["Tea", "Ginger", "Neroli"],
      base: ["Ambroxan", "White Musk", "Cedar", "Vetiver"],
    },
    summary: "Citrico refinado y brillante con te y jengibre en el centro y fondo moderno de almizcles y vetiver.",
  }),
  "cherry-smoke": buildProfile({
    accords: ["cherry", "leather", "smoky", "sweet", "woody", "amber"],
    notes: {
      top: ["Cherry", "Saffron", "Pink Pepper"],
      middle: ["Leather", "Rose", "Jasmine"],
      base: ["Smoke", "Tonka Bean", "Amber", "Patchouli"],
    },
    summary: "Frutal oscuro y ahumado con cereza especiada, cuero en el centro y fondo dulce de resinas y madera.",
  }),
  layton: buildProfile({
    accords: ["warm spicy", "vanilla", "fresh spicy", "woody", "aromatic", "fruity", "powdery", "lavender", "fresh", "citrus"],
    notes: {
      top: ["Apple", "Lavender", "Mandarin Orange", "Bergamot"],
      middle: ["Geranium", "Violet", "Jasmine"],
      base: ["Vanilla", "Cardamom", "Sandalwood", "Pepper", "Patchouli", "Guaiac Wood"],
    },
    summary: "Amaderado especiado con manzana y lavanda arriba, cuerpo floral aromatizado y fondo cremoso de vainilla y maderas.",
  }),
  greenley: buildProfile({
    accords: ["green", "aromatic", "citrus", "fresh", "woody"],
    notes: {
      top: ["Green Apple", "Calabrian Bergamot", "Mandarin Orange"],
      middle: ["Petitgrain", "Violet", "Cedar", "Pomarose"],
      base: ["Oakmoss", "Amberwood", "Musk"],
    },
    summary: "Verde, crujiente y energico, con manzana y bergamota al inicio sobre un fondo limpio de musgo y maderas claras.",
  }),
  hacivat: buildProfile({
    accords: ["woody", "citrus", "mossy", "fruity", "sweet", "earthy", "fresh spicy", "tropical", "aromatic", "patchouli"],
    notes: {
      top: ["Pineapple", "Grapefruit", "Bergamot"],
      middle: ["Cedar", "Patchouli", "Jasmine"],
      base: ["Oakmoss", "Woody Notes"],
    },
    summary: "Frutal musgoso con mucha salida citrica y pina, seguido por cedro, patchouli y un secado verde y elegante.",
  }),
  "naxos-1861": buildProfile({
    accords: ["sweet", "vanilla", "honey", "tobacco", "lavender", "aromatic", "citrus", "amber", "warm spicy", "floral"],
    notes: {
      top: ["Lavender", "Bergamot", "Lemon"],
      middle: ["Honey", "Cinnamon", "Cashmeran", "Jasmine Sambac"],
      base: ["Tobacco Leaf", "Tonka Bean", "Vanilla"],
    },
    summary: "Gourmand aromatico con lavanda citrica, corazon de miel y canela y una base profunda de tabaco y vainilla.",
  }),
  "ultra-male": buildProfile({
    accords: ["vanilla", "fruity", "sweet", "cinnamon", "warm spicy", "aromatic", "aquatic", "powdery", "amber", "fresh spicy"],
    notes: {
      top: ["Pear", "Lavender", "Mint", "Bergamot", "Lemon"],
      middle: ["Cinnamon", "Caraway", "Clary Sage"],
      base: ["Black Vanilla Husk", "Amber", "Patchouli", "Cedar"],
    },
    summary: "Dulce, frutal y muy nocturno con pera y menta en salida, canela al centro y vainilla ambarada al fondo.",
  }),
  "silver-mountain-water": buildProfile({
    accords: ["citrus", "fresh", "musky", "green", "woody"],
    notes: {
      top: ["Bergamot", "Mandarin Orange", "Neroli"],
      middle: ["Green Tea", "Black Currant"],
      base: ["Musk", "Sandalwood", "Petitgrain", "Galbanum"],
    },
    summary: "Fresco y frio, con citricos brillantes, te verde y grosella negra sobre un fondo limpio de musgo y almizcles.",
  }),
  "virgin-island-water": buildProfile({
    accords: ["tropical", "coconut", "citrus", "fresh", "sweet"],
    notes: {
      top: ["White Bergamot", "Sicilian Mandarin", "Jamaican Lime", "Coconut"],
      middle: ["Ginger", "Ylang-Ylang", "Jasmine", "Hibiscus"],
      base: ["Sugar Cane", "White Rum", "Musk"],
    },
    summary: "Tropical y playero con lima y coco al inicio, flores suaves en el corazon y ron azucarado al final.",
  }),
  "elysium-pour-homme": buildProfile({
    accords: ["citrus", "aromatic", "fresh", "woody", "musky"],
    notes: {
      top: ["Grapefruit", "Lemon", "Bergamot", "Lime"],
      middle: ["Juniper", "Black Currant", "Pink Pepper", "Jasmine"],
      base: ["Vetiver", "Cedar", "Ambergris", "Musk"],
    },
    summary: "Citrico luminoso y elegante con bayas aromaticas en el centro y vetiver limpio en la base.",
  }),
  "sauvage-elixir": buildProfile({
    accords: ["warm spicy", "lavender", "amber", "woody", "fresh spicy"],
    moments: ["night"],
    notes: {
      top: ["Nutmeg", "Cinnamon", "Cardamom", "Grapefruit"],
      middle: ["Lavender"],
      base: ["Licorice", "Amber", "Sandalwood", "Patchouli", "Haitian Vetiver"],
    },
    seasons: ["fall", "winter"],
    summary: "Sauvage llevado al extremo: especias densas, lavanda concentrada y un fondo oscuro de licorice, ambar y vetiver.",
  }),
  "montblanc-legend-spirit": buildProfile({
    accords: ["citrus", "fresh", "woody", "aromatic", "musky"],
    notes: {
      top: ["Bergamot", "Pink Pepper", "Grapefruit"],
      middle: ["Lavender", "Cardamom", "Aromatic Notes"],
      base: ["White Musk", "Cashmere Wood", "Oakmoss"],
    },
    summary: "Fresco y pulido con citricos chispeantes, lavanda limpia y un fondo de madera clara con almizcles blancos.",
  }),
};

const sourceHintProfiles: Array<{ match: RegExp; profile: keyof typeof profileLibrary }> = [
  { match: /layton/i, profile: "layton" },
  { match: /greenley|perseus|percival|castley/i, profile: "aromatic-green" },
  { match: /vibrato|afternoon swim|imagination|pacific chill|l ?immensite|lovers|blue talisman|bond no 9 lafayette/i, profile: "luxury-citrus" },
  { match: /babycat|althair|blonde amber|centaurus|side effect|naxos|angels'? share|one million elixir|y ysl elixir|boss bottled absolu/i, profile: "gourmand-amber" },
  { match: /god of fire|wavechild/i, profile: "tropical-fresh" },
  { match: /cherry punk|cherry smoke|kirsch|drunk lovers/i, profile: "cherry-smoke" },
  { match: /oud maracuja|oud cadenza|cuir infrarouge|metallic musk|deified|sand dance/i, profile: "dark-leather-oud" },
  { match: /bleu de chanel l ?exclusif/i, profile: "fresh-blue" },
  { match: /virgin island water/i, profile: "virgin-island-water" },
  { match: /outlands|hacivat|aventus absolu|aventus|erba pura|erba gold|sauvage y aventus/i, profile: "mossy-fruity" },
  { match: /dior homme parfum|gentleman edp|myslf|le beau le parfum|paradice garden|paradise garden|valentino bir|valentino extradose|y ysl edp/i, profile: "clean-iris-woody" },
  { match: /torino 21/i, profile: "aromatic-green" },
  { match: /elysium/i, profile: "elysium-pour-homme" },
  { match: /baccarat rouge 540/i, profile: "gourmand-amber" },
];

const nameProfiles: Array<{ match: RegExp; profile: keyof typeof profileLibrary }> = [
  { match: /allure homme sport/i, profile: "fresh-blue" },
  { match: /dylan blue|double bleu|iconic|viope|immortel|legend spirit|eau givree|profondo|cobalt/i, profile: "fresh-blue" },
  { match: /greenley|percival|sedley|torino|galoway|perseus|castley|haltane|maahir legacy|kaaf|green irish tweed|aether/i, profile: "aromatic-green" },
  { match: /eros|ultra male|le male elixir|scandal|9 ?pm|stronger with you|phantom|1 million|boss bottled|bad boy|vip black|most wanted|wanted|mandarin sky|nitro red|hawas fire|million gold/i, profile: "sweet-spicy-night" },
  { match: /le beau|virgin island|paradise garden|tropical|royal island|malibu/i, profile: "tropical-fresh" },
  { match: /dior homme|gentleman|prada l homme|myslf|office for men|date for men|back tie|his confession|le sel d issey|born in roma|legend red/i, profile: "clean-iris-woody" },
  { match: /oud|ombre|cherry|cuir|tobacco|smoke|deified|amber empire|royal amber|onyx gold|onyx silver/i, profile: "dark-leather-oud" },
  { match: /layton|naxos|side effect|angels share|babycat|althair|y elixir|absolu|elixir/i, profile: "gourmand-amber" },
  { match: /aventus|hacivat|club de nuit|milestone|precieux|urban elixir|millesime imperial|viking|original santal|elysium|royal blue|chapter ii/i, profile: "mossy-fruity" },
  { match: /invictus|hawas|atlantis|aquatica/i, profile: "marine-citrus" },
  { match: /afternoon swim|imagination|pacific chill|l immensite|lovers|blue talisman/i, profile: "luxury-citrus" },
];

function normalizeText(value: string | undefined) {
  return (value ?? "")
    .normalize("NFKD")
    .replace(/\p{Diacritic}/gu, "")
    .replace(/œ/gi, "oe")
    .replace(/ﬀ/g, "ff")
    .replace(/ﬁ/g, "fi")
    .replace(/ﬂ/g, "fl")
    .toLowerCase();
}

function extractHint(rawText?: string) {
  if (!rawText) {
    return "";
  }

  const match = rawText.match(
    /(?:Dupe de|Dupe|Alternativa a|Alternativa de|Mescla de|Inspired by|Inspirado en|Inspiracion(?: mas fresca y citrica)? de|Alternativa al)\s+([^|$]+)/i,
  );

  return match?.[1]?.replace(/valorad[oa].*/i, "").trim() ?? "";
}

function applyPatternPatterns(text: string, patterns: Array<{ match: RegExp; profile: keyof typeof profileLibrary }>) {
  return patterns.find((entry) => entry.match.test(text))?.profile ?? null;
}

function resolveFallbackProfile(input: FragranceLookupInput): keyof typeof profileLibrary {
  const sourceText = normalizeText(extractHint(input.rawText));
  const fullText = normalizeText(`${input.fullName ?? ""} ${input.rawText ?? ""} ${input.slug}`);

  const sourceProfile = applyPatternPatterns(sourceText, sourceHintProfiles);
  if (sourceProfile) {
    return sourceProfile;
  }

  const nameProfile = applyPatternPatterns(fullText, nameProfiles);
  if (nameProfile) {
    return nameProfile;
  }

  if (/(oud|leather|smoke|cherry|cuir|ombre)/i.test(fullText)) {
    return "dark-leather-oud";
  }

  if (/(elixir|absolu|parfum|reserve|night|absolute)/i.test(fullText)) {
    return "gourmand-amber";
  }

  if (/(aqua|blue|bleu|cologne|iced|energy|sport|fresh)/i.test(fullText)) {
    return "fresh-blue";
  }

  return "clean-iris-woody";
}

function withKeywordAccents(entry: FragranceDetailEntry, text: string): FragranceDetailEntry {
  const normalized = normalizeText(text);
  const detail: FragranceDetailEntry = {
    accords: [...(entry.accords ?? [])],
    moments: [...(entry.moments ?? [])],
    notes: {
      base: [...(entry.notes?.base ?? [])],
      middle: [...(entry.notes?.middle ?? [])],
      top: [...(entry.notes?.top ?? [])],
    },
    seasons: [...(entry.seasons ?? [])],
    summary: entry.summary,
  };

  const addNote = (tier: "top" | "middle" | "base", note: string) => {
    const target = detail.notes?.[tier];
    if (target && !target.includes(note)) {
      target.push(note);
    }
  };

  const addAccord = (name: string) => {
    const accords = detail.accords ?? [];
    if (!accords.some((accord) => accord.name === name)) {
      accords.push({
        color: accordPalette[normalizeAccordName(name)] ?? accordPalette.woody,
        name: normalizeAccordName(name),
        strength: 42,
      });
      detail.accords = accords.slice(0, 10);
    }
  };

  if (/coconut|island|paradise|tropical|virgin island/i.test(normalized)) {
    addNote("top", "Coconut");
    addNote("middle", "Fig Leaf");
    addNote("base", "Ambergris");
    addAccord("tropical");
  }

  if (/cherry|kirsch/i.test(normalized)) {
    addNote("top", "Cherry");
    addNote("middle", "Leather");
    addAccord("cherry");
  }

  if (/oud|maracuja|cadenza|cuir|ombre/i.test(normalized)) {
    addNote("middle", "Rose");
    addNote("base", "Oud");
    addAccord("oud");
    addAccord("leather");
  }

  if (/greenley|percival|sedley|torino|perseus|castley|galoway/i.test(normalized)) {
    addNote("top", "Green Apple");
    addNote("middle", "Lavender");
    addNote("base", "Oakmoss");
    addAccord("green");
  }

  if (/aventus|hacivat|club de nuit|milestone|precieux|urban elixir/i.test(normalized)) {
    addNote("top", "Pineapple");
    addNote("middle", "Patchouli");
    addNote("base", "Oakmoss");
    addAccord("mossy");
  }

  if (/bleu|dylan|iconic|double bleu/i.test(normalized)) {
    addNote("top", "Grapefruit");
    addNote("middle", "Ginger");
    addNote("base", "Incense");
  }

  if (/eros|ultra male|9 pm|1 million|phantom|wanted|bad boy|vip black/i.test(normalized)) {
    addNote("middle", "Lavender");
    addNote("base", "Tonka Bean");
    addAccord("sweet");
  }

  return detail;
}

export function resolveMenCatalogDetails(input: FragranceLookupInput): FragranceDetailEntry {
  const exact = menCatalogDetails[input.slug];
  if (exact) {
    return exact;
  }

  const fallbackKey = resolveFallbackProfile(input);
  const base = profileLibrary[fallbackKey];

  return withKeywordAccents(base, `${input.fullName ?? ""} ${input.rawText ?? ""} ${input.slug}`);
}
