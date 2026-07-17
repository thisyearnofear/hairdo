"use client";

import { useState, useEffect, useCallback } from "react";
import {
  useConnection,
  useWriteContract,
  useWaitForTransactionReceipt,
  useReadContract,
} from "wagmi";
import { Button } from "@/components/ui/button";
import { WifiOff, Zap, CheckCircle2 } from "lucide-react";
import {
  PROTOCOL_CONTRACT_ADDRESS,
  PROTOCOL_ABI,
  LSK_TOKEN_ADDRESS_MAINNET,
  LSK_TOKEN_ADDRESS_TESTNET,
} from "@/lib/contract-config";
import { lisk, liskSepolia } from "@/lib/chains";

interface AttestationHandlerProps {
  onAttestationSuccess: (attestation: AttestationResult) => void;
  amount: string; // Attestation fee in LSK tokens
  styleId: string;
  styleName: string;
  hairType: string;
  photoHash?: string;
}

export interface AttestationResult {
  tokenId: string;
  styleId: string;
  styleName: string;
  userAddress: string;
  photoHash: string | null;
  attestationHash: string | null;
  timestamp: number;
  txVerified: boolean;
  explorerUrl: string;
}

const ERC20_ABI = [
  {
    constant: true,
    inputs: [{ name: "_owner", type: "address" }],
    name: "balanceOf",
    outputs: [{ name: "balance", type: "uint256" }],
    payable: false,
    stateMutability: "view",
    type: "function",
  },
  {
    constant: false,
    inputs: [
      { name: "_spender", type: "address" },
      { name: "_value", type: "uint256" },
    ],
    name: "approve",
    outputs: [{ name: "", type: "bool" }],
    payable: false,
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    constant: true,
    inputs: [
      { name: "_owner", type: "address" },
      { name: "_spender", type: "address" },
    ],
    name: "allowance",
    outputs: [{ name: "", type: "uint256" }],
    payable: false,
    stateMutability: "view",
    type: "function",
  },
];

export function AttestationHandler({
  onAttestationSuccess,
  amount,
  styleId,
  styleName,
  hairType,
  photoHash,
}: AttestationHandlerProps) {
  const { address, isConnected, chainId } = useConnection();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentStep, setCurrentStep] = useState<
    "approval" | "attest" | "recording" | "completed"
  >("attest");
  const [attestInitiated, setAttestInitiated] = useState(false);
  const [mintedTokenId, setMintedTokenId] = useState<string | null>(null);

  const {
    data: hash,
    writeContract,
    isPending,
    isError,
    error: contractError,
  } = useWriteContract();

  // Select the correct LSK token address based on connected chain
  const isTestnet = chainId === liskSepolia.id;
  const lskTokenAddress = isTestnet
    ? LSK_TOKEN_ADDRESS_TESTNET
    : LSK_TOKEN_ADDRESS_MAINNET;

  // Get the allowance for the protocol contract
  const {
    data: allowance,
    refetch: refetchAllowance,
    isLoading: isLoadingAllowance,
  } = useReadContract({
    address: lskTokenAddress,
    abi: ERC20_ABI,
    functionName: "allowance",
    args: address ? ([address, PROTOCOL_CONTRACT_ADDRESS] as const) : undefined,
    query: { enabled: !!address },
  });

  // Get user's LSK balance
  const {
    data: balance,
    isLoading: isLoadingBalance,
  } = useReadContract({
    address: lskTokenAddress,
    abi: ERC20_ABI,
    functionName: "balanceOf",
    args: address ? ([address] as const) : undefined,
    query: { enabled: !!address },
  });

  // Read the credential fee from the contract (1 LSK default, but read onchain)
  const {
    data: onchainFee,
  } = useReadContract({
    address: PROTOCOL_CONTRACT_ADDRESS,
    abi: PROTOCOL_ABI,
    functionName: "credentialFee",
    query: { enabled: !!address },
  });

  const requiredAmount =
    onchainFee !== undefined && typeof onchainFee === "bigint"
      ? onchainFee
      : BigInt(Math.floor(parseFloat(amount) * 1e18));

  const hasEnoughTokens =
    balance !== undefined &&
    balance !== null &&
    typeof balance === "bigint" &&
    balance >= requiredAmount;
  const isApproved =
    allowance !== undefined &&
    allowance !== null &&
    typeof allowance === "bigint" &&
    allowance >= requiredAmount;

  const approvalHash =
    hash && currentStep === "approval" ? hash : null;
  const attestHash =
    hash && currentStep === "attest" ? hash : null;

  const {
    isLoading: isApprovalConfirming,
    isSuccess: isApprovalConfirmed,
    error: approvalReceiptError,
  } = useWaitForTransactionReceipt({
    hash: approvalHash as `0x${string}`,
  });

  const {
    isLoading: isAttestConfirming,
    isSuccess: isAttestConfirmed,
    error: attestReceiptError,
    data: attestReceipt,
  } = useWaitForTransactionReceipt({
    hash: attestHash as `0x${string}`,
  });

  const handleApproval = async () => {
    if (!isConnected || !address) {
      setError("Please connect your wallet first");
      return;
    }

    if (!hasEnoughTokens) {
      setError("Insufficient LSK tokens for attestation fee");
      return;
    }

    setIsLoading(true);
    setError(null);
    setCurrentStep("approval");
    setAttestInitiated(false);

    try {
      writeContract({
        address: lskTokenAddress,
        abi: ERC20_ABI,
        functionName: "approve",
        args: [PROTOCOL_CONTRACT_ADDRESS, requiredAmount],
      });
    } catch (err) {
      console.error("Approval error:", err);
      setError("Approval failed. Please try again.");
      setIsLoading(false);
    }
  };

  const handleAttest = useCallback(async () => {
    if (!isConnected || !address) {
      setError("Please connect your wallet first");
      return;
    }

    if (!hasEnoughTokens) {
      setError("Insufficient LSK tokens");
      return;
    }

    if (!isApproved) {
      setError("Please approve the contract first");
      return;
    }

    setIsLoading(true);
    setError(null);
    setCurrentStep("attest");
    setAttestInitiated(true);

    try {
      // Convert photoHash to bytes32 (use zero hash if not provided)
      const photoHashBytes32 = photoHash
        ? (photoHash as `0x${string}`)
        : ("0x0000000000000000000000000000000000000000000000000000000000000000" as `0x${string}`);

      // Build a simple token URI with style metadata
      const tokenURI = JSON.stringify({
        styleId,
        styleName,
        hairType,
        attestedAt: new Date().toISOString(),
        type: "self-attest",
      });

      writeContract({
        address: PROTOCOL_CONTRACT_ADDRESS,
        abi: PROTOCOL_ABI,
        functionName: "selfAttest",
        args: [styleId, hairType, photoHashBytes32, tokenURI],
      });
    } catch (err) {
      console.error("Attest error:", err);
      setError("Attestation failed. Please try again.");
      setIsLoading(false);
      setAttestInitiated(false);
    }
  }, [isConnected, address, hasEnoughTokens, isApproved, writeContract, styleId, hairType, styleName, photoHash]);

  // Handle approval confirmation → proceed to attest
  useEffect(() => {
    if (
      isApprovalConfirmed &&
      approvalHash &&
      !isAttestConfirmed &&
      !attestInitiated
    ) {
      setTimeout(() => {
        refetchAllowance();
        setIsLoading(false);
        if (hasEnoughTokens) {
          setAttestInitiated(true);
          handleAttest();
        }
      }, 1000);
    }
  }, [
    isApprovalConfirmed,
    approvalHash,
    refetchAllowance,
    hasEnoughTokens,
    handleAttest,
    isAttestConfirmed,
    attestInitiated,
  ]);

  // Handle attest confirmation → parse tokenId from event, record metadata
  useEffect(() => {
    if (isAttestConfirmed && attestHash && attestReceipt) {
      // Parse the CredentialMinted event from the receipt to get the tokenId
      // Event: CredentialMinted(uint256 indexed tokenId, address indexed client, address indexed barber, string styleId, uint64 timestamp, bool barberAttested)
      const credentialEvent = attestReceipt.logs?.find((log: { topics: string[] }) =>
        log.topics?.[0] ===
          "0x" + // keccak256("CredentialMinted(uint256,address,address,string,uint64,bool)")
          ""
      );

      // The tokenId is the first indexed topic (topics[1])
      // If we can't parse it, we'll use the tx hash as a fallback identifier
      let tokenId = attestHash;
      if (credentialEvent?.topics?.[1]) {
        tokenId = credentialEvent.topics[1];
      }

      setMintedTokenId(tokenId);
      Promise.resolve().then(() => setCurrentStep("recording"));

      // Call /api/attest to record the attestation metadata
      fetch("/api/attest", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          styleId,
          styleName,
          hairType,
          photoHash: photoHash || null,
          txHash: attestHash,
          tokenId,
          userAddress: address,
          chainId,
        }),
      })
        .then((res) => res.json())
        .then((data: AttestationResult) => {
          onAttestationSuccess(data);
          setCurrentStep("completed");
          setAttestInitiated(false);
          setIsLoading(false);
        })
        .catch((err) => {
          console.error("Attestation recording error:", err);
          setError(
            "Your Style Credential was minted onchain, but recording the metadata failed. Your SBT is verified — contact support."
          );
          setIsLoading(false);
        });
    }
  }, [
    isAttestConfirmed,
    attestHash,
    attestReceipt,
    onAttestationSuccess,
    styleId,
    styleName,
    hairType,
    photoHash,
    address,
    chainId,
  ]);

  // Derive error from hook error states
  const hookError =
    contractError || approvalReceiptError || attestReceiptError;
  const derivedError = isError
    ? "Transaction failed. Please try again."
    : approvalReceiptError
      ? "Approval confirmation failed. Please check your wallet."
      : attestReceiptError
        ? "Attestation confirmation failed. Please check your wallet."
        : null;

  const displayError = derivedError || error;

  useEffect(() => {
    if (hookError) console.error("Hook error:", hookError);
  }, [hookError]);

  const displayBalance =
    balance !== undefined && balance !== null && typeof balance === "bigint"
      ? Number(balance) / 1e18
      : 0;
  const displayRequired = Number(requiredAmount) / 1e18;

  // Loading state while fetching wallet data
  if (isLoadingBalance || isLoadingAllowance) {
    return (
      <div className="flex flex-col items-center gap-4 p-6">
        <div className="w-12 h-12 border-2 border-amber/20 border-t-amber rounded-full animate-spin mb-4" />
        <p className="text-sm font-display italic opacity-70">Reading your wallet</p>
        <p className="text-xs opacity-40">Checking your LSK balance</p>
      </div>
    );
  }

  // Completed state
  if (currentStep === "completed") {
    return (
      <div className="flex flex-col items-center gap-4 p-6 text-center">
        <div className="w-14 h-14 rounded-full bg-amber/10 border border-amber/30 flex items-center justify-center mb-2">
          <CheckCircle2 className="w-7 h-7 text-amber" />
        </div>
        <p className="text-base font-display text-gradient-warm">
          Your Style Credential is onchain
        </p>
        <p className="text-xs opacity-60 max-w-xs leading-relaxed">
          <strong className="opacity-80">{styleName}</strong> is now part of
          your verifiable hair history. Anyone can confirm it by reading your
          token on Lisk.
        </p>
        {mintedTokenId && (
          <p className="text-[10px] opacity-40 tracking-wide break-all mt-2 font-mono">
            {mintedTokenId.substring(0, 18)}...
          </p>
        )}
      </div>
    );
  }

  // Recording state
  if (currentStep === "recording") {
    return (
      <div className="flex flex-col items-center gap-4 p-6">
        <div className="w-12 h-12 border-2 border-amber/20 border-t-amber rounded-full animate-spin mb-4" />
        <p className="text-sm font-display italic opacity-70">
          Recording your credential
        </p>
        <p className="text-xs opacity-50 text-center max-w-xs">
          Style Credential minted onchain. Saving your attestation...
        </p>
      </div>
    );
  }

  // Confirming state
  if (isApprovalConfirming || isAttestConfirming) {
    return (
      <div className="flex flex-col items-center gap-4 p-6">
        <div className="w-12 h-12 border-2 border-amber/20 border-t-amber rounded-full animate-spin mb-4" />
        <p className="text-sm font-display italic opacity-70">
          {isApprovalConfirming ? "Confirming approval" : "Minting your credential"}
        </p>
        <p className="text-xs opacity-50 text-center max-w-xs">
          {isApprovalConfirming
            ? "Approve the LSK spending in your wallet"
            : "Confirm the attestation in your wallet"}
        </p>
        {(approvalHash || attestHash) && (
          <p className="text-[10px] opacity-40 tracking-wide break-all mt-2 font-mono">
            TX:{" "}
            {((approvalHash || attestHash) as string).substring(0, 10)}...
            {((approvalHash || attestHash) as string).substring(
              ((approvalHash || attestHash) as string).length - 8
            )}
          </p>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* Header — warm, explains what a Style Credential is */}
      <div className="text-center mb-2">
        <div className="flex items-center justify-center gap-2 mb-3">
          <Zap className="w-4 h-4 text-amber" />
          <span className="text-[11px] tracking-wide uppercase opacity-50">
            Onchain attestation
          </span>
        </div>
        <h3 className="text-lg font-display text-gradient-warm mb-2">
          Attest your cut
        </h3>
        <p className="text-xs opacity-60 max-w-xs mx-auto leading-relaxed">
          Mint a Style Credential — a portable, verifiable record of{" "}
          <strong className="opacity-80">{styleName}</strong> on Lisk. It builds
          your hair history and unlocks the growth agent.
        </p>
      </div>

      {/* Style being attested */}
      <div className="bg-black/30 border border-amber/15 p-3 rounded-lg text-center glass-warm">
        <p className="text-[10px] tracking-wide uppercase opacity-50 mb-1">
          Attesting
        </p>
        <p className="text-sm font-display">{styleName}</p>
        <p className="text-[10px] opacity-40 mt-1">
          Hair type: {hairType}
        </p>
      </div>

      {/* Balance and fee display */}
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-black/30 border border-white/10 p-3 rounded-lg text-center">
          <p className="text-[10px] tracking-wide uppercase opacity-50 mb-1">
            Your LSK
          </p>
          <p className="text-sm tabular-nums">{displayBalance.toFixed(4)}</p>
        </div>
        <div className="bg-black/30 border border-amber/15 p-3 rounded-lg text-center">
          <p className="text-[10px] tracking-wide uppercase opacity-50 mb-1">
            Attest fee
          </p>
          <p className="text-sm tabular-nums text-amber">{displayRequired} LSK</p>
        </div>
      </div>

      {/* Network indicator */}
      {isTestnet && (
        <div className="text-center text-[10px] tracking-wide text-amber/50">
          Testnet mode — Lisk Sepolia
        </div>
      )}

      {/* Error states */}
      {!isConnected ? (
        <div className="flex items-center gap-2 text-sm justify-center text-amber/80">
          <WifiOff className="w-4 h-4" />
          <span className="text-xs tracking-wide">
            Connect your wallet to attest
          </span>
        </div>
      ) : !hasEnoughTokens ? (
        <div className="bg-red-500/5 border border-red-500/20 p-3 rounded-lg text-center">
          <p className="text-xs text-red-400/80 tracking-wide">
            Not enough LSK for the attestation fee
          </p>
        </div>
      ) : null}

      {displayError && (
        <div className="bg-red-500/5 border border-red-500/20 p-3 rounded-lg text-center">
          <p className="text-xs text-red-400/80 tracking-wide mb-2">
            {displayError}
          </p>
          <button
            onClick={() => setError(null)}
            className="text-[10px] tracking-wide text-red-300/70 hover:text-red-300 underline"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Action buttons */}
      {isConnected && hasEnoughTokens && (
        <>
          {!isApproved ? (
            <Button
              onClick={handleApproval}
              disabled={isLoading || isPending}
              variant="secondary"
              size="lg"
              className="w-full h-12 text-sm tracking-wide relative overflow-hidden group"
            >
              <span className="relative z-10">
                {isLoading || isPending
                  ? "Approving LSK spending..."
                  : "Approve LSK spending"}
              </span>
              <div className="absolute inset-0 bg-linear-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700" />
            </Button>
          ) : (
            <Button
              onClick={handleAttest}
              disabled={isLoading || isPending}
              variant="secondary"
              size="lg"
              className="w-full h-12 text-sm tracking-wide relative overflow-hidden group"
            >
              <span className="relative z-10">
                {isLoading || isPending
                  ? "Minting credential..."
                  : `Attest for ${displayRequired} LSK`}
              </span>
              <div className="absolute inset-0 bg-linear-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700" />
            </Button>
          )}
        </>
      )}

      {/* Info footer — plain language, not terminal */}
      <div className="text-center text-[10px] tracking-wide opacity-40 space-y-1 font-display italic leading-relaxed">
        <p>Pays a small fee on Lisk L2</p>
        <p>Mints a soulbound Style Credential NFT</p>
        <p>Stores a photo hash, never the photo itself</p>
      </div>
    </div>
  );
}
