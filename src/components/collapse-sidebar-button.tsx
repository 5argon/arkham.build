import { cx } from "@/utils/cx";
import { ChevronsLeftIcon, ChevronsRightIcon } from "lucide-react";
import css from "./collapse-sidebar-button.module.css";
import { Button } from "./ui/button";

type Props = {
  className?: string;
  orientation?: "left" | "right";
  onClick: () => void;
};

export function CollapseSidebarButton(props: Props) {
  const { className, orientation = "left", onClick } = props;
  return (
    <div className={cx(css["collapse-container"], css[orientation], className)}>
      {/* biome-ignore lint/a11y/useKeyWithClickEvents: not relevant. */}
      <div className={css["collapse-inner"]} onClick={onClick}>
        <div className={cx(css["highlight"])} />
        <Button
          data-testid="sidebar-collapse-button"
          tooltip="Collapse sidebar"
          onClick={onClick}
          iconOnly
          round
          tabIndex={-1}
          size="sm"
          className={css["button"]}
        >
          {orientation === "left" ? (
            <ChevronsLeftIcon />
          ) : (
            <ChevronsRightIcon />
          )}
        </Button>
      </div>
    </div>
  );
}
