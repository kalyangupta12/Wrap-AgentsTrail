"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  type ReactNode,
} from "react";
import {
  type SolanaNetwork,
  NETWORK_CONFIG,
  CONFIG,
  getNetworkConfig,
} from "@wrap/config";

interface NetworkContextType {
  network: SolanaNetwork;
  setNetwork: (network: SolanaNetwork) => void;
  networkConfig: (typeof NETWORK_CONFIG)[SolanaNetwork];
  isMainnet: boolean;
}

const NetworkContext = createContext<NetworkContextType | null>(null);

const STORAGE_KEY = "wrap-solana-network";

export function NetworkProvider({ children }: { children: ReactNode }) {
  const [network, setNetworkState] = useState<SolanaNetwork>(
    CONFIG.solana.defaultNetwork
  );

  // Load from localStorage on mount
  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored === "mainnet-beta" || stored === "devnet") {
      setNetworkState(stored);
    }
  }, []);

  const setNetwork = useCallback((newNetwork: SolanaNetwork) => {
    setNetworkState(newNetwork);
    localStorage.setItem(STORAGE_KEY, newNetwork);
    // Reload the page to reinitialize wallet connections
    window.location.reload();
  }, []);

  const networkConfig = getNetworkConfig(network);
  const isMainnet = network === "mainnet-beta";

  return (
    <NetworkContext.Provider
      value={{ network, setNetwork, networkConfig, isMainnet }}
    >
      {children}
    </NetworkContext.Provider>
  );
}

export function useNetwork() {
  const context = useContext(NetworkContext);
  if (!context) {
    throw new Error("useNetwork must be used within a NetworkProvider");
  }
  return context;
}
