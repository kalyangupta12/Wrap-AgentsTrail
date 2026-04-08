/**
 * Test script for x402 paid API calls
 *
 * Usage:
 *   1. Install deps: pnpm add -D @x402/fetch @x402/svm @solana/web3.js bs58
 *   2. Set your wallet private key: export SOLANA_PRIVATE_KEY="your_base58_private_key"
 *   3. Run: npx tsx scripts/test-x402.ts
 *   4. For devnet: SOLANA_NETWORK=devnet npx tsx scripts/test-x402.ts
 */

import { wrapFetchWithPayment, x402Client } from "@x402/fetch";
import {
  ExactSvmScheme,
  DEVNET_RPC_URL,
  MAINNET_RPC_URL,
  SOLANA_DEVNET_CAIP2,
  SOLANA_MAINNET_CAIP2,
} from "@x402/svm";
import { ExactSvmSchemeV1 } from "@x402/svm/v1";
import { Keypair } from "@solana/web3.js";
import { createKeyPairSignerFromBytes } from "@solana/kit";
import bs58 from "bs58";

async function main() {
  // Load wallet from environment
  const privateKeyBase58 = process.env.SOLANA_PRIVATE_KEY;
  const networkEnv = process.env.SOLANA_NETWORK || "mainnet-beta";
  const isMainnet = networkEnv === "mainnet-beta";

  if (!privateKeyBase58) {
    console.error("Error: Set SOLANA_PRIVATE_KEY environment variable");
    console.log("\nTo create a test wallet:");
    console.log("  const keypair = Keypair.generate();");
    console.log("  console.log(bs58.encode(keypair.secretKey));");
    process.exit(1);
  }

  // Create Solana keypair from private key
  const secretKey = bs58.decode(privateKeyBase58);
  const keypair = Keypair.fromSecretKey(secretKey);

  // Create signer for V1 (using @solana/kit)
  const signer = await createKeyPairSignerFromBytes(secretKey);

  console.log("Wallet address:", keypair.publicKey.toBase58());
  console.log("Network:", isMainnet ? "Mainnet" : "Devnet");

  // Create x402 client and register schemes for both V1 and V2 networks
  const rpcUrl = isMainnet ? MAINNET_RPC_URL : DEVNET_RPC_URL;

  const client = new x402Client()
    // V2 registrations (CAIP-2 identifiers)
    .register(SOLANA_MAINNET_CAIP2, new ExactSvmScheme({ rpcUrl: MAINNET_RPC_URL, keypair }))
    .register(SOLANA_DEVNET_CAIP2, new ExactSvmScheme({ rpcUrl: DEVNET_RPC_URL, keypair }))
    // V1 registrations (Dexter's network names)
    .registerV1("solana", new ExactSvmSchemeV1(signer, { rpcUrl: MAINNET_RPC_URL }))
    .registerV1("solana-devnet", new ExactSvmSchemeV1(signer, { rpcUrl: DEVNET_RPC_URL }));

  // Wrap fetch with x402 payment handling
  const x402Fetch = wrapFetchWithPayment(fetch, client);

  // Make a paid API request
  const apiUrl = process.env.API_URL || "https://api-wrap.agentstrail.ai";
  const endpoint = isMainnet ? "/v1/crypto-listings-m" : "/v1/crypto-listings-d";

  console.log(`\nMaking request to ${apiUrl}${endpoint}...`);

  try {
    const response = await x402Fetch(`${apiUrl}${endpoint}`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        "X-Solana-Network": networkEnv, // Pass the selected network
      },
    });

    if (response.ok) {
      const data = await response.json();
      console.log("\nSuccess! Response:");
      console.log(JSON.stringify(data, null, 2));
    } else {
      console.error(`\nRequest failed with status ${response.status}`);
      const text = await response.text();
      console.error(text);
    }
  } catch (error) {
    console.error("\nError:", error);
  }
}

main();
