"use client";

import { useNetwork } from "@/providers/NetworkProvider";
import { NETWORK_CONFIG, type SolanaNetwork } from "@wrap/config";

export function NetworkSwitcher() {
  const { network, setNetwork, isMainnet } = useNetwork();

  return (
    <div className="relative">
      <div
        className={`absolute left-2.5 top-1/2 -translate-y-1/2 w-1.5 h-1.5 rounded-full ${
          isMainnet ? "bg-emerald-500" : "bg-amber-500"
        }`}
      />
      <select
        value={network}
        onChange={(e) => setNetwork(e.target.value as SolanaNetwork)}
        className={`
          appearance-none cursor-pointer
          pl-6 pr-9 py-2 rounded-lg text-xs font-medium
          border transition-all duration-150 bg-background
          ${
            isMainnet
              ? "text-emerald-700 border-emerald-200 hover:border-emerald-300 hover:bg-emerald-50/50"
              : "text-amber-700 border-amber-200 hover:border-amber-300 hover:bg-amber-50/50"
          }
        `}
      >
        {Object.entries(NETWORK_CONFIG).map(([key, config]) => (
          <option key={key} value={key}>
            {config.name}
          </option>
        ))}
      </select>
      <div className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none">
        <svg
          className={`w-3 h-3 ${
            isMainnet ? "text-emerald-500" : "text-amber-500"
          }`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M19 9l-7 7-7-7"
          />
        </svg>
      </div>
    </div>
  );
}
