"use client";

import { useMemo } from "react";
import {
  ConnectionProvider,
  WalletProvider,
} from "@solana/wallet-adapter-react";
import { WalletModalProvider } from "@solana/wallet-adapter-react-ui";
import {
  PhantomWalletAdapter,
  SolflareWalletAdapter,
} from "@solana/wallet-adapter-wallets";
import {
  CONFIG,
  getNetworkConfig,
  type SolanaNetwork,
} from "@wrap/config";

import "@solana/wallet-adapter-react-ui/styles.css";

const STORAGE_KEY = "wrap-solana-network";

function getStoredNetwork(): SolanaNetwork {
  if (typeof window === "undefined") {
    return CONFIG.solana.defaultNetwork;
  }
  const stored = localStorage.getItem(STORAGE_KEY);
  if (stored === "mainnet-beta" || stored === "devnet") {
    return stored;
  }
  return CONFIG.solana.defaultNetwork;
}

export function WalletContextProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const network = getStoredNetwork();
  const networkConfig = getNetworkConfig(network);
  const endpoint = networkConfig.rpcUrl;

  const wallets = useMemo(
    () => [new PhantomWalletAdapter(), new SolflareWalletAdapter()],
    []
  );

  return (
    <ConnectionProvider endpoint={endpoint}>
      <WalletProvider wallets={wallets} autoConnect>
        <WalletModalProvider>{children}</WalletModalProvider>
      </WalletProvider>
    </ConnectionProvider>
  );
}
