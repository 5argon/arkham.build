import { ListCard } from "@/components/card-list/list-card";
import { Combobox } from "@/components/ui/combobox/combobox";
import { useStore } from "@/store";
import type { Card } from "@/store/services/types";
import type { CustomizationOption as CustomizationOptionType } from "@/store/services/types";
import type { StoreState } from "@/store/slices";

function selectCardsByIds(state: StoreState, ids: string[]) {
  return ids.reduce<Record<string, Card>>((acc, curr) => {
    const card = state.metadata.cards[curr];
    if (card) acc[curr] = card;
    return acc;
  }, {});
}

function selectPlayerCardsForCustomizationOptions(
  state: StoreState,
  config: CustomizationOptionType["card"],
) {
  if (!config) return [];

  console.time("[performance] select_player_cards_for_customization_options");

  const options: Set<Card> = new Set();

  const traitTable = state.lookupTables.traits;
  const typeTable = state.lookupTables.typeCode;

  const traitTables = config.trait.map((trait) => traitTable[trait]);
  const typeTables = config.type.map((type) => typeTable[type]);

  [
    ...traitTables.flatMap(Object.keys),
    ...typeTables.flatMap(Object.keys),
  ].forEach((code) => {
    if (
      !traitTables.some((x) => code in x) ||
      !typeTables.every((x) => code in x)
    ) {
      return;
    }

    const card = state.metadata.cards[code];
    if (!card || card.duplicate_of_code) return;

    options.add(card);
  }, []);

  const cards = Array.from(options).toSorted(
    (a, b) =>
      state.lookupTables.sort.alphabetical[a.code] -
      state.lookupTables.sort.alphabetical[b.code],
  );

  console.timeEnd(
    "[performance] select_player_cards_for_customization_options",
  );

  return cards;
}

const cardRenderer = (item: Card) => (
  <ListCard card={item} size="sm" omitThumbnail />
);

const resultRenderer = (item: Card) => item.real_name;

const itemToString = (item: Card) => item.real_name.toLowerCase();

type Props = {
  choices: string[];
  limit: number;
  id: string;
  config: CustomizationOptionType["card"];
};

export function CustomizationChooseCards({
  choices,
  limit,
  id,
  config,
}: Props) {
  const cards = useStore((state) =>
    selectPlayerCardsForCustomizationOptions(state, config),
  );
  const selectedCards = useStore((state) => selectCardsByIds(state, choices));

  return (
    <Combobox
      label="Cards"
      disabled={choices.length === limit}
      id={`${id}-choose-cards`}
      items={cards}
      itemToString={itemToString}
      renderItem={cardRenderer}
      renderResult={resultRenderer}
      selectedItems={selectedCards}
      placeholder="Select cards..."
    />
  );
}