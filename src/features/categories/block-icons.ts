/**
 * The icons a block can be given.
 *
 * These used to be emoji. Emoji render as multi-color bitmaps the app cannot
 * tint, so an icon could never take on its block's color, and they look
 * different on every platform — the same block was a different picture on
 * Android, iOS and the PWA. Monochrome glyphs solve both: one shape everywhere,
 * tinted with the block's own color. See docs/adr/0011-structured-visual-language.md.
 *
 * MaterialCommunityIcons ships with @expo/vector-icons, already a dependency.
 *
 * The set is curated rather than the library's full 7000 glyphs, but it is now
 * large enough that scanning it is work — hence `keywords`, which back the
 * search field in the picker. Keywords are in Spanish because that is the app's
 * language; the glyph names stay in English because they are API identifiers.
 */
import type { MaterialCommunityIcons } from "@expo/vector-icons";

export type BlockIconName = React.ComponentProps<
  typeof MaterialCommunityIcons
>["name"];

export type BlockIconGroup =
  "Enfoque" | "Movimiento" | "Cuidado" | "Casa" | "Personas" | "Ocio";

export interface BlockIcon {
  name: BlockIconName;
  /** Lowercase, unaccented search terms. */
  keywords: string[];
  group: BlockIconGroup;
}

export const BLOCK_ICONS: readonly BlockIcon[] = [
  // Focus and work
  { name: "target", keywords: ["objetivo", "meta", "foco"], group: "Enfoque" },
  { name: "laptop", keywords: ["computadora", "trabajo"], group: "Enfoque" },
  { name: "code-tags", keywords: ["codigo", "programar"], group: "Enfoque" },
  { name: "book-open-variant", keywords: ["leer", "libro"], group: "Enfoque" },
  { name: "pencil", keywords: ["escribir", "nota"], group: "Enfoque" },
  { name: "notebook", keywords: ["cuaderno", "apuntes"], group: "Enfoque" },
  { name: "chart-line", keywords: ["grafica", "datos"], group: "Enfoque" },
  { name: "briefcase", keywords: ["trabajo", "oficina"], group: "Enfoque" },
  { name: "phone", keywords: ["llamada", "telefono"], group: "Enfoque" },
  { name: "email", keywords: ["correo", "mensaje"], group: "Enfoque" },
  { name: "calendar-check", keywords: ["reunion", "junta"], group: "Enfoque" },
  { name: "brain", keywords: ["cerebro", "pensar"], group: "Enfoque" },
  { name: "flask", keywords: ["ciencia", "experimento"], group: "Enfoque" },
  { name: "school", keywords: ["escuela", "clase"], group: "Enfoque" },
  { name: "presentation", keywords: ["presentacion"], group: "Enfoque" },
  { name: "cash", keywords: ["dinero", "finanzas"], group: "Enfoque" },

  // Movement
  { name: "run", keywords: ["correr", "ejercicio"], group: "Movimiento" },
  { name: "dumbbell", keywords: ["pesas", "gimnasio"], group: "Movimiento" },
  { name: "bike", keywords: ["bicicleta", "ciclismo"], group: "Movimiento" },
  { name: "swim", keywords: ["nadar", "alberca"], group: "Movimiento" },
  { name: "walk", keywords: ["caminar", "paseo"], group: "Movimiento" },
  { name: "yoga", keywords: ["yoga", "estirar"], group: "Movimiento" },
  { name: "soccer", keywords: ["futbol", "deporte"], group: "Movimiento" },
  { name: "basketball", keywords: ["basquet", "deporte"], group: "Movimiento" },
  { name: "hiking", keywords: ["senderismo", "montana"], group: "Movimiento" },
  { name: "shoe-sneaker", keywords: ["tenis", "zapatos"], group: "Movimiento" },

  // Care and health
  {
    name: "meditation",
    keywords: ["meditar", "meditacion", "calma"],
    group: "Cuidado",
  },
  { name: "pill", keywords: ["medicina", "pastilla"], group: "Cuidado" },
  { name: "medical-bag", keywords: ["doctor", "salud"], group: "Cuidado" },
  { name: "heart-pulse", keywords: ["corazon", "salud"], group: "Cuidado" },
  { name: "sleep", keywords: ["dormir", "siesta"], group: "Cuidado" },
  { name: "shower", keywords: ["ducha", "bano"], group: "Cuidado" },
  { name: "toothbrush", keywords: ["dientes", "cepillo"], group: "Cuidado" },
  { name: "water", keywords: ["agua", "tomar"], group: "Cuidado" },
  { name: "leaf", keywords: ["planta", "natural"], group: "Cuidado" },
  {
    name: "weather-sunset-up",
    keywords: ["amanecer", "manana"],
    group: "Cuidado",
  },
  { name: "weather-night", keywords: ["noche", "dormir"], group: "Cuidado" },
  { name: "spa", keywords: ["spa", "relajar"], group: "Cuidado" },

  // Home and errands
  { name: "home", keywords: ["casa", "hogar"], group: "Casa" },
  {
    name: "silverware-fork-knife",
    keywords: ["comer", "comida"],
    group: "Casa",
  },
  { name: "coffee", keywords: ["cafe", "desayuno"], group: "Casa" },
  { name: "chef-hat", keywords: ["cocinar", "receta"], group: "Casa" },
  { name: "cart", keywords: ["compras", "super"], group: "Casa" },
  { name: "broom", keywords: ["limpiar", "aseo"], group: "Casa" },
  { name: "washing-machine", keywords: ["lavar", "ropa"], group: "Casa" },
  { name: "tshirt-crew", keywords: ["ropa", "vestir"], group: "Casa" },
  { name: "car", keywords: ["coche", "manejar"], group: "Casa" },
  { name: "bus", keywords: ["camion", "transporte"], group: "Casa" },
  { name: "dog", keywords: ["perro", "mascota"], group: "Casa" },
  { name: "cat", keywords: ["gato", "mascota"], group: "Casa" },
  { name: "flower", keywords: ["jardin", "regar"], group: "Casa" },
  { name: "tools", keywords: ["reparar", "arreglar"], group: "Casa" },
  { name: "package-variant", keywords: ["paquete", "entrega"], group: "Casa" },
  { name: "trash-can", keywords: ["basura", "tirar"], group: "Casa" },

  // People
  { name: "chat", keywords: ["hablar", "mensaje"], group: "Personas" },
  { name: "account-group", keywords: ["grupo", "equipo"], group: "Personas" },
  { name: "heart", keywords: ["amor", "pareja"], group: "Personas" },
  { name: "human-male-female-child", keywords: ["familia"], group: "Personas" },
  { name: "gift", keywords: ["regalo", "cumpleanos"], group: "Personas" },
  { name: "video", keywords: ["videollamada", "zoom"], group: "Personas" },
  { name: "handshake", keywords: ["acuerdo", "cita"], group: "Personas" },

  // Leisure
  { name: "music", keywords: ["musica", "tocar"], group: "Ocio" },
  { name: "headphones", keywords: ["escuchar", "podcast"], group: "Ocio" },
  { name: "gamepad-variant", keywords: ["juego", "videojuego"], group: "Ocio" },
  { name: "television", keywords: ["tele", "serie"], group: "Ocio" },
  { name: "movie-open", keywords: ["pelicula", "cine"], group: "Ocio" },
  { name: "palette", keywords: ["arte", "pintar"], group: "Ocio" },
  { name: "camera", keywords: ["foto", "camara"], group: "Ocio" },
  { name: "guitar-acoustic", keywords: ["guitarra", "tocar"], group: "Ocio" },
  { name: "airplane", keywords: ["viaje", "vuelo"], group: "Ocio" },
  { name: "beach", keywords: ["playa", "vacaciones"], group: "Ocio" },
  { name: "party-popper", keywords: ["fiesta", "celebrar"], group: "Ocio" },
  { name: "cards-playing", keywords: ["cartas", "juego"], group: "Ocio" },
];

/** Default when a block has no icon and no category to inherit one from. */
export const FALLBACK_ICON: BlockIconName = "circle-outline";

/**
 * What each of the forty emoji the app used to offer becomes.
 *
 * Only consulted by the v2→v3 store migration. Emoji outside this map are
 * dropped rather than guessed at — the block then falls back to its category's
 * icon, which is a sane picture, where a wrong guess would be a confusing one.
 */
export const LEGACY_EMOJI_TO_ICON: Record<string, BlockIconName> = {
  "🎯": "target",
  "💻": "laptop",
  "📚": "book-open-variant",
  "✍️": "pencil",
  "📝": "notebook",
  "📊": "chart-line",
  "💼": "briefcase",
  "📞": "phone",
  "🧠": "brain",
  "🔬": "flask",
  "🏃": "run",
  "🏋️": "dumbbell",
  "🚴": "bike",
  "🧘": "meditation",
  "⚽": "soccer",
  "🏊": "swim",
  "🚶": "walk",
  "💊": "pill",
  "🩺": "medical-bag",
  "😴": "sleep",
  "🌅": "weather-sunset-up",
  "🍳": "chef-hat",
  "🍽️": "silverware-fork-knife",
  "☕": "coffee",
  "🛒": "cart",
  "🧹": "broom",
  "🚿": "shower",
  "🧺": "washing-machine",
  "🐕": "dog",
  "🚗": "car",
  "💬": "chat",
  "❤️": "heart",
  "👨‍👩‍👧": "human-male-female-child",
  "🎉": "party-popper",
  "🎵": "music",
  "🎮": "gamepad-variant",
  "📺": "television",
  "🎨": "palette",
  "🌱": "leaf",
  "✈️": "airplane",
};

const ICON_NAMES = new Set<string>(BLOCK_ICONS.map((icon) => icon.name));

/** Whether a stored string still names an icon this app offers. */
export function isBlockIconName(value: unknown): value is BlockIconName {
  return typeof value === "string" && ICON_NAMES.has(value);
}

/** Strip accents so "meditación" matches the keyword "meditacion". */
function normalize(text: string): string {
  return (
    text
      .toLowerCase()
      // NFD splits an accented letter into base + combining mark; the range is
      // every combining diacritic, which then gets removed.
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
  );
}

/**
 * Filter the icon set by a search query, matching glyph name or keywords.
 *
 * @param query - What the user typed. Blank returns the full set unchanged.
 * @returns The matching icons, in their curated order.
 */
export function searchBlockIcons(query: string): readonly BlockIcon[] {
  const needle = normalize(query.trim());
  if (needle.length === 0) {
    return BLOCK_ICONS;
  }
  return BLOCK_ICONS.filter(
    (icon) =>
      normalize(icon.name).includes(needle) ||
      icon.keywords.some((keyword) => normalize(keyword).includes(needle)),
  );
}
