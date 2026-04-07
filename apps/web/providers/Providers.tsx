"use client";

import { NetworkProvider } from "./NetworkProvider";
import { WalletContextProvider } from "./WalletProvider";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <NetworkProvider>
      <WalletContextProvider>{children}</WalletContextProvider>
    </NetworkProvider>
  );
}
