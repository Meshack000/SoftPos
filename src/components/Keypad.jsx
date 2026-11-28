"use client";

import { BackspaceIcon } from "@/components/Icons";

const KEYS = ["1", "2", "3", "4", "5", "6", "7", "8", "9", ".", "0", "back"];

export default function Keypad({ value, onChange }) {
  function press(key) {
    if (key === "back") {
      onChange(value.slice(0, -1));
      return;
    }
    if (value.length >= 8) return;

    if (key === ".") {
      if (value.includes(".")) return;
      onChange(value === "" ? "0." : value + ".");
      return;
    }

    const decimals = value.split(".")[1];
    if (decimals !== undefined && decimals.length >= 2) return;

    onChange(value === "0" ? key : value + key);
  }

  return (
    <div className="grid grid-cols-3 gap-2">
      {KEYS.map((key) => (
        <button
          key={key}
          type="button"
          onClick={() => press(key)}
          aria-label={key === "back" ? "Delete last digit" : key}
          className="grid h-14 place-items-center rounded-ui border border-line bg-white text-2xl font-bold hover:bg-soft active:bg-soft"
        >
          {key === "back" ? <BackspaceIcon /> : key}
        </button>
      ))}
    </div>
  );
}
