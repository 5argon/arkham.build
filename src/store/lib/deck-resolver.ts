import { countExperience } from "@/utils/card-utils";
import { ALT_ART_INVESTIGATOR_MAP } from "@/utils/constants";

import type { Card } from "../services/types";
import type { Deck } from "../slices/decks/types";
import type { LookupTables } from "../slices/lookup-tables/types";
import type { Metadata } from "../slices/metadata/types";
import { resolveCardWithRelations } from "./card-resolver";
import type {
  CardWithRelations,
  Customization,
  Customizations,
  DeckMeta,
  ResolvedCard,
  ResolvedDeck,
} from "./types";

export function resolveDeck<
  T extends boolean,
  S extends T extends true ? CardWithRelations : ResolvedCard,
>(
  metadata: Metadata,
  lookupTables: LookupTables,
  deck: Deck,
  withRelations: T,
): ResolvedDeck<S> {
  const deckMeta = parseDeckMeta(deck);

  // some decks on arkhamdb are created for the replacement investigator, normalize.
  // this only seems to be the case for carolyn fern?
  const investigatorCode =
    deck.investigator_code in ALT_ART_INVESTIGATOR_MAP
      ? ALT_ART_INVESTIGATOR_MAP[
          deck.investigator_code as keyof typeof ALT_ART_INVESTIGATOR_MAP
        ]
      : deck.investigator_code;

  const investigator = resolveCardWithRelations(
    metadata,
    lookupTables,
    investigatorCode,
    deck.taboo_id,
    undefined,
    true,
  ) as CardWithRelations;

  const investigatorFront = getInvestigatorSide(
    investigator,
    deckMeta,
    "alternate_front",
  ) as S;

  const investigatorBack = getInvestigatorSide(
    investigator,
    deckMeta,
    "alternate_back",
  ) as S;

  if (!investigatorFront || !investigatorBack) {
    throw new Error(`Investigator not found: ${deck.investigator_code}`);
  }

  const extraSlots = getExtraSlots(deckMeta);
  const customizations = getCustomizations(deckMeta, metadata);

  const { cards, deckSize, deckSizeTotal, xpRequired } = getDeckCards<T, S>(
    deck,
    extraSlots,
    metadata,
    lookupTables,
    investigator,
    customizations,
    withRelations,
  );

  return {
    ...deck,
    cards,
    customizations,
    extraSlots,
    factionSelect: getFactionSelect(investigatorBack, deckMeta),
    investigatorBack,
    investigatorFront,
    metaParsed: deckMeta,
    optionSelect: getOptionSelect(investigatorBack, deckMeta),
    sideSlots: Array.isArray(deck.sideSlots) ? null : deck.sideSlots,
    stats: {
      deckSize,
      deckSizeTotal,
      xpRequired: xpRequired,
    },
    tabooSet: deck.taboo_id ? metadata.tabooSets[deck.taboo_id] : undefined,
  };
}

function parseDeckMeta(deck: Deck): DeckMeta {
  try {
    const metaJson = JSON.parse(deck.meta);
    return typeof metaJson === "object" && metaJson != null ? metaJson : {};
  } catch {
    return {};
  }
}

function getInvestigatorSide(
  investigator: CardWithRelations,
  deckMeta: DeckMeta,
  key: "alternate_front" | "alternate_back",
) {
  const val = deckMeta[key];
  const hasAlternate = val && val !== investigator.card.code;
  if (!hasAlternate) return investigator;

  if (investigator.relations?.parallel?.card.code === val)
    return investigator.relations?.parallel;

  return investigator;
}

function getDeckCards<
  T extends boolean,
  S extends T extends true ? CardWithRelations : ResolvedCard,
>(
  deck: Deck,
  extraSlots: ResolvedDeck<S>["extraSlots"],
  metadata: Metadata,
  lookupTables: LookupTables,
  investigator: CardWithRelations,
  customizations: Customizations | undefined,
  withRelations: T,
) {
  const cards: ResolvedDeck<S>["cards"] = {
    investigator: investigator as S,
    slots: {},
    sideSlots: {},
    ignoreDeckLimitSlots: {},
    extraSlots: {},
  };

  let deckSize = 0;
  let deckSizeTotal = 0;
  let xpRequired = 0;

  for (const [code, quantity] of Object.entries(deck.slots)) {
    const card = resolveCardWithRelations(
      metadata,
      lookupTables,
      code,
      deck.taboo_id,
      customizations,
      withRelations,
    );

    if (card) {
      deckSizeTotal += quantity;
      xpRequired += countExperience(card.card, quantity);
      cards.slots[code] = card as S;
      if (
        !deck.ignoreDeckLimitSlots?.[code] &&
        !isSpecialCard(card.card, investigator)
      ) {
        deckSize += quantity;
      }
    }
  }

  if (deck.sideSlots && !Array.isArray(deck.sideSlots)) {
    for (const [code] of Object.entries(deck.sideSlots)) {
      const card = resolveCardWithRelations(
        metadata,
        lookupTables,
        code,
        deck.taboo_id,
        customizations,
        false,
      ); // SAFE! we do not need relations for side deck.

      if (card) {
        cards.sideSlots[code] = card as S;
      }
    }
  }

  if (extraSlots && !Array.isArray(extraSlots)) {
    for (const [code, quantity] of Object.entries(extraSlots)) {
      const card = resolveCardWithRelations(
        metadata,
        lookupTables,
        code,
        deck.taboo_id,
        customizations,
        false,
      ); // SAFE! we do not need relations for side deck.

      if (card) {
        deckSizeTotal += quantity;
        cards.extraSlots[code] = card as S;
      }
    }
  }

  return {
    cards,
    deckSize,
    deckSizeTotal,
    xpRequired,
  };
}

export function isSpecialCard(card: Card, investigator: CardWithRelations) {
  return (
    card.permanent ||
    card.encounter_code ||
    card.subtype_code ||
    investigator.relations?.advanced?.some((x) => x.card.code === card.code) ||
    investigator.relations?.parallelCards?.some(
      (x) => x.card.code === card.code,
    ) ||
    investigator.relations?.replacement?.some(
      (x) => x.card.code === card.code,
    ) ||
    investigator.relations?.requiredCards?.some(
      (x) => x.card.code === card.code,
    )
  );
}

function getFactionSelect(investigator: CardWithRelations, deckMeta: DeckMeta) {
  const hasFactionSelect = investigator.card.deck_options?.some(
    (x) => x.faction_select,
  );

  return hasFactionSelect
    ? {
        options: [], // TODO: implement.
        selection: deckMeta.faction_selected,
      }
    : undefined;
}

function getOptionSelect(investigator: CardWithRelations, deckMeta: DeckMeta) {
  const optionSelectType = investigator.card.deck_options?.find(
    (x) => x.option_select,
  );
  if (!optionSelectType?.name) return undefined;

  const selection = optionSelectType.option_select?.find(
    (x) => x.id === deckMeta.option_selected,
  );

  return {
    name: optionSelectType.name,
    options: [], // TODO: implement.
    selection: selection?.name,
  };
}

function getExtraSlots(deckMeta: DeckMeta) {
  if (deckMeta.extra_deck) {
    const extraSlots: Record<string, number> = {};

    for (const code of deckMeta.extra_deck.split(",")) {
      extraSlots[code] = (extraSlots[code] ?? 0) + 1;
    }

    return extraSlots;
  }

  return {};
}

function getCustomizations(deckMeta: DeckMeta, metadata: Metadata) {
  let hasCustomizations = false;
  const customizations: Customizations = {};

  for (const [key, value] of Object.entries(deckMeta)) {
    // customizations are tracked in format `cus_{code}: {index}|{xp}|{choice?},...`.
    if (key.startsWith("cus_") && value) {
      hasCustomizations = true;
      const code = key.split("cus_")[1];

      customizations[code] = value
        .split(",")
        .reduce<Record<number, Customization>>((acc, curr) => {
          const entries = curr.split("|");
          const index = Number.parseInt(entries[0], 10);

          if (entries.length > 1) {
            const xpSpent = Number.parseInt(entries[1], 10);
            const choices = entries[2] ?? "";

            const option = metadata.cards[code]?.customization_options?.[index];
            if (!option) return acc;

            acc[index] = {
              choices,
              index,
              unlocked: (xpSpent ?? 0) >= option.xp,
              xpSpent,
            };
          }

          return acc;
        }, {});
    }
  }

  return hasCustomizations ? customizations : undefined;
}