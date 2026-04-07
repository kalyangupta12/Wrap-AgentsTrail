import { PublicKey } from "@solana/web3.js";
import nacl from "tweetnacl";
import bs58 from "bs58";

export function generateNonce(): string {
  const nonce = nacl.randomBytes(32);
  return bs58.encode(nonce);
}

export function createSignInMessage(nonce: string): string {
  return `Sign in to Wrap API\n\nNonce: ${nonce}\n\nThis request will not trigger a transaction or cost any SOL.`;
}

export function verifyWalletSignature(
  message: string,
  signature: string,
  walletAddress: string
): boolean {
  try {
    const messageBytes = new TextEncoder().encode(message);
    const signatureBytes = bs58.decode(signature);
    const publicKeyBytes = new PublicKey(walletAddress).toBytes();
    return nacl.sign.detached.verify(
      messageBytes,
      signatureBytes,
      publicKeyBytes
    );
  } catch {
    return false;
  }
}
