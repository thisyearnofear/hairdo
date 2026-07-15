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
import { CONTRACT_ADDRESS, CONTRACT_ABI } from "@/lib/contract-config";

interface AttestationHandlerProps {
  onAttestationSuccess: (attestation: AttestationResult) => void;
  amount: string; // Attestation fee in LSK tokens
  styleId: string;
  styleName: string;
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

// LSK token address on Lisk network
const LSK_TOKEN_ADDRESS = "0xac485391EB2d7D88253a7F1eF18C37f4242D1A24";

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
  photoHash,
}: AttestationHandlerProps) {
  const { address, isConnected } = useConnection();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentStep, setCurrentStep] = useState<
    "approval" | "payment" | "recording" | "completed"
  >("payment");
  const [paymentInitiated, setPaymentInitiated] = useState(false);
  const [pendingTokenId, setPendingTokenId] = useState<string | null>(null);

  const {
    data: hash,
    writeContract,
    isPending,
    isError,
    error: contractError,
  } = useWriteContract();

  // Get the allowance for our contract
  const {
    data: allowance,
    refetch: refetchAllowance,
    isLoading: isLoadingAllowance,
  } = useReadContract({
    address: LSK_TOKEN_ADDRESS,
    abi: ERC20_ABI,
    functionName: "allowance",
    args: address ? ([address, CONTRACT_ADDRESS] as const) : undefined,
    query: { enabled: !!address },
  });

  // Get user's LSK balance
  const {
    data: balance,
    isLoading: isLoadingBalance,
  } = useReadContract({
    address: LSK_TOKEN_ADDRESS,
    abi: ERC20_ABI,
    functionName: "balanceOf",
    args: address ? ([address] as const) : undefined,
    query: { enabled: !!address },
  });

  const requiredAmount = BigInt(Math.floor(parseFloat(amount) * 1e18));

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
  const paymentHash =
    hash && currentStep === "payment" ? hash : null;

  const {
    isLoading: isApprovalConfirming,
    isSuccess: isApprovalConfirmed,
    error: approvalReceiptError,
  } = useWaitForTransactionReceipt({
    hash: approvalHash as `0x${string}`,
  });

  const {
    isLoading: isPaymentConfirming,
    isSuccess: isPaymentConfirmed,
    error: paymentReceiptError,
  } = useWaitForTransactionReceipt({
    hash: paymentHash as `0x${string}`,
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
    setPaymentInitiated(false);

    try {
      writeContract({
        address: LSK_TOKEN_ADDRESS,
        abi: ERC20_ABI,
        functionName: "approve",
        args: [CONTRACT_ADDRESS, requiredAmount],
      });
    } catch (err) {
      console.error("Approval error:", err);
      setError("Approval failed. Please try again.");
      setIsLoading(false);
    }
  };

  const handlePayment = useCallback(async () => {
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
    setCurrentStep("payment");
    setPaymentInitiated(true);

    try {
      // Generate a unique 32-byte token ID for this attestation
      const tokenId = `0x${Array.from({ length: 64 }, () =>
        Math.floor(Math.random() * 16).toString(16)
      ).join("")}`;

      setPendingTokenId(tokenId);

      if (typeof window !== "undefined") {
        localStorage.setItem("pendingAttestationTokenId", tokenId);
      }

      writeContract({
        address: CONTRACT_ADDRESS,
        abi: CONTRACT_ABI,
        functionName: "payForService",
        args: [tokenId],
      });
    } catch (err) {
      console.error("Payment error:", err);
      setError("Attestation fee payment failed. Please try again.");
      setIsLoading(false);
      setPaymentInitiated(false);
    }
  }, [isConnected, address, hasEnoughTokens, isApproved, writeContract]);

  // Handle approval confirmation
  useEffect(() => {
    if (
      isApprovalConfirmed &&
      approvalHash &&
      !isPaymentConfirmed &&
      !paymentInitiated
    ) {
      setTimeout(() => {
        refetchAllowance();
        setIsLoading(false);
        if (hasEnoughTokens) {
          setPaymentInitiated(true);
          handlePayment();
        }
      }, 1000);
    }
  }, [
    isApprovalConfirmed,
    approvalHash,
    refetchAllowance,
    hasEnoughTokens,
    handlePayment,
    isPaymentConfirmed,
    paymentInitiated,
  ]);

  // Handle payment confirmation → record attestation
  useEffect(() => {
    if (isPaymentConfirmed && paymentHash) {
      const storedTokenId =
        typeof window !== "undefined"
          ? localStorage.getItem("pendingAttestationTokenId")
          : null;

      if (storedTokenId) {
        if (typeof window !== "undefined") {
          localStorage.removeItem("pendingAttestationTokenId");
        }

        // Set recording state via microtask to avoid synchronous setState in effect
        Promise.resolve().then(() => setCurrentStep("recording"));

        // Call /api/attest to record the attestation metadata
        fetch("/api/attest", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            styleId,
            styleName,
            photoHash: photoHash || null,
            paymentToken: storedTokenId,
            userAddress: address,
          }),
        })
          .then((res) => res.json())
          .then((data: AttestationResult) => {
            onAttestationSuccess(data);
            setCurrentStep("completed");
            setPaymentInitiated(false);
            setIsLoading(false);
            setPendingTokenId(null);
          })
          .catch((err) => {
            console.error("Attestation recording error:", err);
            setError(
              "Payment confirmed but attestation recording failed. Your onchain payment is verified — contact support."
            );
            setIsLoading(false);
          });
      } else {
        Promise.resolve().then(() => {
          setError("Attestation error: token ID not found");
          setIsLoading(false);
        });
      }
    }
  }, [
    isPaymentConfirmed,
    paymentHash,
    onAttestationSuccess,
    styleId,
    styleName,
    photoHash,
    address,
  ]);

  // Derive error from hook error states
  const hookError =
    contractError || approvalReceiptError || paymentReceiptError;
  const derivedError = isError
    ? "Transaction failed. Please try again."
    : approvalReceiptError
      ? "Approval confirmation failed. Please check your wallet."
      : paymentReceiptError
        ? "Payment confirmation failed. Please check your wallet."
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
        <div className="w-12 h-12 border-2 border-white/20 border-t-white rounded-full animate-spin mb-4" />
        <p className="text-[10px] tracking-widest uppercase">LOADING_WALLET</p>
      </div>
    );
  }

  // Completed state
  if (currentStep === "completed") {
    return (
      <div className="flex flex-col items-center gap-4 p-6 text-center">
        <CheckCircle2 className="w-12 h-12 text-green-500 mb-2" />
        <p className="text-sm tracking-widest uppercase text-green-400">
          ATTESTATION_RECORDED
        </p>
        <p className="text-xs text-white/60 max-w-xs">
          Your style choice has been attested onchain via Lisk. The attestation
          is verifiable by anyone using your token ID.
        </p>
        {pendingTokenId && (
          <p className="text-[10px] text-white/40 tracking-wider break-all mt-2">
            TOKEN: {pendingTokenId.substring(0, 18)}...
          </p>
        )}
      </div>
    );
  }

  // Recording state
  if (currentStep === "recording") {
    return (
      <div className="flex flex-col items-center gap-4 p-6">
        <div className="w-12 h-12 border-2 border-white/20 border-t-white rounded-full animate-spin mb-4" />
        <p className="text-[10px] tracking-widest uppercase">
          RECORDING_ATTESTATION
        </p>
        <p className="text-xs text-white/60 text-center max-w-xs">
          Payment verified onchain. Recording attestation metadata...
        </p>
      </div>
    );
  }

  // Confirming state
  if (isApprovalConfirming || isPaymentConfirming) {
    return (
      <div className="flex flex-col items-center gap-4 p-6">
        <div className="w-12 h-12 border-2 border-white/20 border-t-white rounded-full animate-spin mb-4" />
        <p className="text-[10px] tracking-widest uppercase">
          {isApprovalConfirming
            ? "CONFIRMING_APPROVAL"
            : "CONFIRMING_ATTESTATION_FEE"}
        </p>
        <p className="text-xs text-white/60 text-center max-w-xs">
          {isApprovalConfirming
            ? "Please confirm approval in your wallet"
            : "Please confirm the attestation fee in your wallet"}
        </p>
        {(approvalHash || paymentHash) && (
          <p className="text-[10px] text-white/40 tracking-wider break-all mt-2">
            TX:{" "}
            {((approvalHash || paymentHash) as string).substring(0, 10)}...
            {((approvalHash || paymentHash) as string).substring(
              ((approvalHash || paymentHash) as string).length - 8
            )}
          </p>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="text-center mb-4">
        <div className="flex items-center justify-center gap-2 mb-2">
          <Zap className="w-4 h-4 text-yellow-400" />
          <p className="text-[10px] tracking-widest uppercase opacity-60">
            ONCHAIN_ATTESTATION
          </p>
        </div>
        <h3 className="text-sm tracking-widest uppercase">
          ATTEST_STYLE: {styleName.toUpperCase()}
        </h3>
      </div>

      {/* Style being attested */}
      <div className="bg-black/40 border border-white/10 p-3 rounded text-center">
        <p className="text-[10px] tracking-widest uppercase opacity-60 mb-1">
          ATTESTING
        </p>
        <p className="text-sm tracking-wide">{styleName}</p>
      </div>

      {/* Balance and fee display */}
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-black/40 border border-white/10 p-3 rounded text-center">
          <p className="text-[10px] tracking-widest uppercase opacity-60 mb-1">
            YOUR_LSK
          </p>
          <p className="text-sm tracking-wider">
            {displayBalance.toFixed(4)}
          </p>
        </div>
        <div className="bg-black/40 border border-white/10 p-3 rounded text-center">
          <p className="text-[10px] tracking-widest uppercase opacity-60 mb-1">
            ATTEST_FEE
          </p>
          <p className="text-sm tracking-wider">{displayRequired} LSK</p>
        </div>
      </div>

      {/* Error states */}
      {!isConnected ? (
        <div className="flex items-center gap-2 text-sm text-red-500 justify-center">
          <WifiOff className="w-4 h-4" />
          <span className="text-xs tracking-widest uppercase">
            WALLET_NOT_CONNECTED
          </span>
        </div>
      ) : !hasEnoughTokens ? (
        <div className="bg-red-50/10 border border-red-500/20 p-3 rounded text-center">
          <p className="text-xs text-red-400 tracking-wide uppercase">
            INSUFFICIENT_LSK
          </p>
        </div>
      ) : null}

      {displayError && (
        <div className="bg-red-50/10 border border-red-500/20 p-3 rounded text-center">
          <p className="text-xs text-red-400 tracking-wide uppercase mb-2">
            {displayError}
          </p>
          <button
            onClick={() => setError(null)}
            className="text-[10px] tracking-widest uppercase text-red-300 hover:text-red-200 underline"
          >
            DISMISS
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
              className="w-full h-12 text-xs tracking-widest uppercase relative overflow-hidden group"
            >
              <span className="relative z-10">
                {isLoading || isPending
                  ? "PROCESSING_APPROVAL"
                  : "APPROVE_LSK_SPENDING"}
              </span>
              <div className="absolute inset-0 bg-linear-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700" />
            </Button>
          ) : (
            <Button
              onClick={handlePayment}
              disabled={isLoading || isPending}
              variant="secondary"
              size="lg"
              className="w-full h-12 text-xs tracking-widest uppercase relative overflow-hidden group"
            >
              <span className="relative z-10">
                {isLoading || isPending
                  ? "PROCESSING..."
                  : `ATTEST_FOR_${amount}_LSK`}
              </span>
              <div className="absolute inset-0 bg-linear-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700" />
            </Button>
          )}
        </>
      )}

      {/* Info footer */}
      <div className="text-center text-[10px] tracking-wider text-white/40 space-y-1">
        <p>PAYS_ATTESTATION_FEE_ON_LISK_L2</p>
        <p>CREATES_VERIFIABLE_ONCHAIN_RECORD</p>
        <p>YOUR_PHOTO_HASH_IS_STORED_NEVER_THE_PHOTO</p>
      </div>
    </div>
  );
}
