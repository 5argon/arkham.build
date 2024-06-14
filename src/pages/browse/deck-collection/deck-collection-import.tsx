import { CloudUpload, LoaderCircle } from "lucide-react";
import { useCallback, useState } from "react";

import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { useToast } from "@/components/ui/toast";
import { useStore } from "@/store";

import css from "./deck-collection.module.css";

export function DeckCollectionImport() {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const importDeck = useStore((state) => state.importDeck);

  const showToast = useToast();

  const handleFormSubmit = useCallback(
    async (evt: React.FormEvent<HTMLFormElement>) => {
      evt.preventDefault();

      const input = new FormData(evt.currentTarget).get("deck-id")?.toString();
      setLoading(true);

      try {
        await importDeck(input ?? "");

        showToast({
          children: "Successfully imported deck.",
          variant: "success",
        });

        setOpen(false);
      } catch (err) {
        showToast({
          children: `Error: ${err instanceof Error ? err.message : "Unknown error."}`,
          variant: "error",
        });
      } finally {
        setLoading(false);
      }
    },
    [importDeck, showToast],
  );

  return (
    <Popover onOpenChange={setOpen} open={open} placement="bottom-start">
      <PopoverTrigger asChild onClick={() => setOpen((v) => !v)}>
        <Button as="label" htmlFor="deck-collection-import">
          <CloudUpload />
        </Button>
      </PopoverTrigger>
      <PopoverContent>
        <form className={css["import"]} onSubmit={handleFormSubmit}>
          <header className={css["deck-collection-form-header"]}>
            <h3>Import from ArkhamDB</h3>
          </header>
          <Field
            full
            helpText="Enter a public ArkhamDB deck id, deck url or deck guide url."
          >
            <label className="sr-only">Deck Url / ID</label>
            <input
              autoComplete="off"
              data-1p-ignore=""
              name="deck-id"
              placeholder="https://arkhamdb.com/deck/view/123456"
              required
              type="text"
            />
          </Field>
          <footer className={css["import-footer"]}>
            <Button disabled={loading} type="submit">
              Import
            </Button>
            {loading && <LoaderCircle className="spin" />}
          </footer>
        </form>
      </PopoverContent>
    </Popover>
  );
}