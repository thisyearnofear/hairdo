/** Guest identity — lets the whole loop work without a wallet. */

export function normalizeUserKey(input: {
  userAddress?: string | null;
  userId?: string | null;
}): string | null {
  if (input.userAddress && input.userAddress.startsWith("0x")) {
    return input.userAddress.toLowerCase();
  }
  if (input.userId && input.userId.length >= 8) {
    return `guest:${input.userId.toLowerCase()}`;
  }
  return null;
}

export function newOffchainId(): string {
  const rand =
    typeof crypto !== "undefined" && "randomUUID" in crypto
      ? crypto.randomUUID()
      : `${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`;
  return `offchain:${rand}`;
}
