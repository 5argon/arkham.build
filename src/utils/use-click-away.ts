import type { RefObject } from "react";
import { useEffect, useRef } from "react";

const defaultEvents = ["mousedown", "touchstart"];

export const useClickAway = <E extends Event = Event>(
  ref: RefObject<HTMLElement | null>,
  onClickAway: (event: E) => void,
  events: string[] = defaultEvents,
) => {
  const savedCallback = useRef(onClickAway);

  const floatingRoot = useRef(document.getElementById("floating"));

  useEffect(() => {
    savedCallback.current = onClickAway;
  }, [onClickAway]);

  useEffect(() => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const handler = (event: any) => {
      const { current: el } = ref;
      el &&
        !el.contains(event.target) &&
        !floatingRoot.current?.contains(event.target) &&
        savedCallback.current(event);
    };

    for (const eventName of events) {
      document.addEventListener(eventName, handler);
    }
    return () => {
      for (const eventName of events) {
        document.removeEventListener(eventName, handler);
      }
    };
  }, [events, ref]);
};