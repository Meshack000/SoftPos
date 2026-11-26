"use client";

import { useState } from "react";
import { EyeIcon, EyeOffIcon } from "@/components/Icons";

export default function PasswordInput({
  showLabel = "Show PIN",
  hideLabel = "Hide PIN",
  className = "",
  ...inputProps
}) {
  const [visible, setVisible] = useState(false);

  return (
    <div className="relative">
      <input
        {...inputProps}
        type={visible ? "text" : "password"}
        className={`mt-1 w-full rounded-ui border border-line px-4 py-3 pr-12 text-lg ${className}`}
      />
      <button
        type="button"
        aria-label={visible ? hideLabel : showLabel}
        onClick={() => setVisible((current) => !current)}
        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted"
      >
        {visible ? <EyeOffIcon /> : <EyeIcon />}
      </button>
    </div>
  );
}
