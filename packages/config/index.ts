export const SOLANA_MAINNET_CHAIN_ID = "solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp";
export const SOLANA_DEVNET_CHAIN_ID = "solana:EtWTRABZaYq6iMfeYKouRu166VU2xqa1";

// USDC Token addresses
export const USDC_MAINNET_ADDRESS = "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v";
export const USDC_DEVNET_ADDRESS = "4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU";

export type SolanaNetwork = "mainnet-beta" | "devnet";

export const NETWORK_CONFIG = {
  "mainnet-beta": {
    name: "Mainnet",
    chainId: SOLANA_MAINNET_CHAIN_ID,
    rpcUrl: "https://api.mainnet-beta.solana.com",
    explorerUrl: "https://explorer.solana.com",
    usdcAddress: USDC_MAINNET_ADDRESS,
  },
  devnet: {
    name: "Devnet",
    chainId: SOLANA_DEVNET_CHAIN_ID,
    rpcUrl: "https://api.devnet.solana.com",
    explorerUrl: "https://explorer.solana.com?cluster=devnet",
    usdcAddress: USDC_DEVNET_ADDRESS,
  },
} as const;

export const CONFIG = {
  x402: {
    facilitatorUrl:
      process.env.X402_FACILITATOR_URL || "https://x402.agentstrail.ai",
    paymentScheme: "exact" as const,
  },
  solana: {
    defaultNetwork: (process.env.NEXT_PUBLIC_SOLANA_NETWORK ||
      "devnet") as SolanaNetwork,
  },
  jwt: {
    expiresIn: "7d",
    issuer: "wrap-api",
  },
  rateLimit: {
    defaultPerMinute: 60,
    windowMs: 60 * 1000,
  },
} as const;

export type Config = typeof CONFIG;

export function getNetworkConfig(network: SolanaNetwork) {
  return NETWORK_CONFIG[network];
}
