import { useCallback } from "react";

import { Field, FieldLabel } from "@/components/ui/field";
import type { SelectOption } from "@/components/ui/select";
import { Select } from "@/components/ui/select";
import { useStore } from "@/store";
import { decodeSelections } from "@/store/lib/serialization/deck-meta";
import type { CardWithRelations } from "@/store/lib/types";
import {
  selectDeckCreateChecked,
  selectDeckCreateInvestigator,
  selectDeckCreateInvestigatorBack,
} from "@/store/selectors/deck-create";
import { selectTabooSetSelectOptions } from "@/store/selectors/lists";
import { capitalize, formatSelectionId } from "@/utils/formatting";

import css from "./deck-create.module.css";

export function DeckCreateEditor() {
  const deckCreate = useStore(selectDeckCreateChecked);
  const investigator = useStore(selectDeckCreateInvestigator);
  const back = useStore(selectDeckCreateInvestigatorBack);

  const tabooSets = useStore(selectTabooSetSelectOptions);

  const setTitle = useStore((state) => state.deckCreateSetTitle);
  const setTabooSet = useStore((state) => state.deckCreateSetTabooSet);
  const setSelection = useStore((state) => state.deckCreateSetSelection);
  const setInvestigatorCode = useStore(
    (state) => state.deckCreateSetInvestigatorCode,
  );

  const handleInputChange = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      setTitle(event.target.value);
    },
    [setTitle],
  );

  const handleTabooSetChange = useCallback(
    (evt: React.ChangeEvent<HTMLSelectElement>) => {
      const value = evt.target.value;
      setTabooSet(value ? parseInt(value, 10) : undefined);
    },
    [setTabooSet],
  );

  const handleInvestigatorChange = useCallback(
    (evt: React.ChangeEvent<HTMLSelectElement>) => {
      const side = evt.target.getAttribute("data-side") as "front" | "back";
      const value = evt.target.value;
      setInvestigatorCode(side, value);
    },
    [setInvestigatorCode],
  );

  const selections = decodeSelections(back, deckCreate.selections);

  return (
    <div className={css["editor"]}>
      <Field full padded>
        <FieldLabel>Title</FieldLabel>
        <input
          onChange={handleInputChange}
          type="text"
          value={deckCreate.title}
        />
      </Field>

      <Field full padded>
        <FieldLabel>Taboo Set</FieldLabel>
        <Select
          emptyLabel="None"
          onChange={handleTabooSetChange}
          options={tabooSets}
          value={deckCreate.tabooSetId ?? ""}
        />
      </Field>

      {investigator.relations?.parallel && (
        <>
          <Field full padded>
            <FieldLabel>Investigator Front</FieldLabel>
            <Select
              data-side="front"
              onChange={handleInvestigatorChange}
              options={getInvestigatorOptions(investigator, "Front")}
              required
              value={deckCreate.investigatorFrontCode}
            />
          </Field>
          <Field full padded>
            <FieldLabel>Investigator Back</FieldLabel>
            <Select
              data-side="back"
              onChange={handleInvestigatorChange}
              options={getInvestigatorOptions(investigator, "Back")}
              required
              value={deckCreate.investigatorBackCode}
            />
          </Field>
        </>
      )}

      {selections &&
        Object.entries(selections).map(([key, value]) => (
          <Field full key={key} padded>
            <FieldLabel>{formatSelectionId(key)}</FieldLabel>
            {(value.type === "deckSize" || value.type === "faction") && (
              <Select
                data-field={value.accessor}
                data-type={value.type}
                emptyLabel="None"
                onChange={(evt) => setSelection(key, evt.target.value)}
                options={value.options.map((v) => ({
                  value: v,
                  label: capitalize(v),
                }))}
                value={value.value ?? ""}
              />
            )}
            {value.type === "option" && (
              <Select
                data-field={value.accessor}
                data-type={value.type}
                emptyLabel="None"
                onChange={(evt) => setSelection(key, evt.target.value)}
                options={value.options.map((v) => ({
                  value: v.id,
                  label: v.name,
                }))}
                value={value.value?.id ?? ""}
              />
            )}
          </Field>
        ))}
    </div>
  );
}

function getInvestigatorOptions(
  investigator: CardWithRelations,
  type: "Front" | "Back",
): SelectOption[] {
  return [
    { value: investigator.card.code, label: `Original ${type}` },
    {
      value: investigator.relations?.parallel?.card.code as string,
      label: `Parallel ${type}`,
    },
  ];
}