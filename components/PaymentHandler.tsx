"use client";

import { useState, useEffect } from "react";
import { useAccount, useWriteContract, useWaitForTransactionReceipt, useReadContract } from "wagmi";
import { Button } from "@/components/ui/button";
import { Loader2, WifiOff, Coins } from "lucide-react";
import { CONTRACT_ADDRESS, CONTRACT_ABI } from "@/lib/contract-config";

interface PaymentHandlerProps {
  onPaymentSuccess: (tokenId: string) => void;
  amount: string; // Amount in LSK tokens (e.g., "1" for 1 LSK)
}

// LSK token address on Lisk network
const LSK_TOKEN_ADDRESS = "0xac485391EB2d7D88253a7F1eF18C37f4242D1A24";

// Interface for ERC20 token
const ERC20_ABI = [
  {
    "constant": true,
    "inputs": [
      {
        "name": "_owner",
        "type": "address"
      }
    ],
    "name": "balanceOf",
    "outputs": [
      {
        "name": "balance",
        "type": "uint256"
      }
    ],
    "payable": false,
    "stateMutability": "view",
    "type": "function"
  },
  {
    "constant": false,
    "inputs": [
      {
        "name": "_spender",
        "type": "address"
      },
      {
        "name": "_value",
        "type": "uint256"
      }
    ],
    "name": "approve",
    "outputs": [
      {
        "name": "",
        "type": "bool"
      }
    ],
    "payable": false,
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "constant": true,
    "inputs": [
      {
        "name": "_owner",
        "type": "address"
      },
      {
        "name": "_spender",
        "type": "address"
      }
    ],
    "name": "allowance",
    "outputs": [
      {
        "name": "",
        "type": "uint256"
      }
    ],
    "payable": false,
    "stateMutability": "view",
    "type": "function"
  }
];

export function PaymentHandler({ onPaymentSuccess, amount }: PaymentHandlerProps) {
  const { address, isConnected } = useAccount();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentStep, setCurrentStep] = useState<'approval' | 'payment' | 'completed'>('payment');
  const [approvalHash, setApprovalHash] = useState<string | null>(null);
  const [paymentHash, setPaymentHash] = useState<string | null>(null);
  const [paymentInitiated, setPaymentInitiated] = useState(false);

  const { data: hash, writeContract, isPending, isError, error: contractError } = useWriteContract();

  // Get the allowance for our contract
  const { data: allowance, refetch: refetchAllowance } = useReadContract({
    address: LSK_TOKEN_ADDRESS,
    abi: ERC20_ABI,
    functionName: 'allowance',
    args: address ? [address, CONTRACT_ADDRESS] as const : undefined,
    query: {
      enabled: !!address,
    }
  });

  // Get user's LSK balance
  const { data: balance } = useReadContract({
    address: LSK_TOKEN_ADDRESS,
    abi: ERC20_ABI,
    functionName: 'balanceOf',
    args: address ? [address] as const : undefined,
    query: {
      enabled: !!address,
    }
  });

  // Calculate required amount in wei
  const requiredAmount = BigInt(Math.floor(parseFloat(amount) * 1e18)); // Convert to 18 decimals

  // Check if user has enough tokens
  const hasEnoughTokens = balance !== undefined && balance !== null && typeof balance === 'bigint' && balance >= requiredAmount;
  // Check if the contract is approved for the required amount
  const isApproved = allowance !== undefined && allowance !== null && typeof allowance === 'bigint' && allowance >= requiredAmount;

  useEffect(() => {
    if (hash && currentStep === 'approval') {
      setApprovalHash(hash);
    } else if (hash && currentStep === 'payment') {
      setPaymentHash(hash);
    }
  }, [hash, currentStep]);

  const { isLoading: isApprovalConfirming, isSuccess: isApprovalConfirmed, error: approvalReceiptError } = useWaitForTransactionReceipt({
    hash: approvalHash as `0x${string}`,
  });

  const { isLoading: isPaymentConfirming, isSuccess: isPaymentConfirmed, error: paymentReceiptError } = useWaitForTransactionReceipt({
    hash: paymentHash as `0x${string}`,
  });

  const handleApproval = async () => {
    if (!isConnected || !address) {
      setError("Please connect your wallet first");
      return;
    }

    if (!hasEnoughTokens) {
      setError("Insufficient LSK tokens");
      return;
    }

    setIsLoading(true);
    setError(null);
    setCurrentStep('approval');
    setPaymentInitiated(false); // Reset flag to allow payment after approval

    try {
      // Approve the contract to spend the required amount of LSK tokens
      writeContract({
        address: LSK_TOKEN_ADDRESS,
        abi: ERC20_ABI,
        functionName: 'approve',
        args: [CONTRACT_ADDRESS, requiredAmount],
      });
    } catch (err) {
      console.error("Approval error:", err);
      setError("Approval failed. Please try again.");
      setIsLoading(false);
    }
  };

  const handlePayment = async () => {
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
    setCurrentStep('payment');
    setPaymentInitiated(true); // Mark that payment has been initiated

    try {
      // Generate a unique 32-byte token ID for this transaction
      const tokenId = `0x${Array.from({ length: 64 }, () => Math.floor(Math.random() * 16).toString(16)).join('')}`;

      // Store the tokenId for later use when the transaction is confirmed
      if (typeof window !== 'undefined') {
        localStorage.setItem('pendingPaymentTokenId', tokenId);
      }

      console.log("Initiating payment with params:", {
        address: CONTRACT_ADDRESS,
        tokenId: tokenId,
      });

      // Call the smart contract to process payment via transferFrom
      writeContract({
        address: CONTRACT_ADDRESS,
        abi: CONTRACT_ABI,
        functionName: 'payForService',
        args: [tokenId],
      });
    } catch (err) {
      console.error("Payment error:", err);
      setError("Payment failed. Please try again.");
      setIsLoading(false);
      setPaymentInitiated(false); // Reset flag if payment failed
    }
  };

  // Handle approval confirmation
  useEffect(() => {
    if (isApprovalConfirmed && approvalHash && !isPaymentConfirmed && !paymentInitiated) {
      console.log("Approval confirmed with hash:", approvalHash);
      // After approval, refresh allowance and proceed to payment
      setTimeout(() => {
        refetchAllowance();
        setIsLoading(false);
        // Automatically proceed to payment if approved and not already processed
        if (hasEnoughTokens) {
          setPaymentInitiated(true);
          handlePayment();
        }
      }, 1000);
    }
  }, [isApprovalConfirmed, approvalHash, refetchAllowance, hasEnoughTokens, handlePayment, isPaymentConfirmed, paymentInitiated]);

  // Handle payment confirmation
  useEffect(() => {
    if (isPaymentConfirmed && paymentHash) {
      // Use the same tokenId that was sent to the smart contract
      // We need to store this tokenId for later use
      if (typeof window !== 'undefined') {
        // Get the tokenId from local storage or component state, since the original
        // tokenId used in the transaction is not directly available here
        // We'll need to refactor this to track the tokenId across the transaction lifecycle
        const storedTokenId = localStorage.getItem('pendingPaymentTokenId');
        if (storedTokenId) {
          localStorage.removeItem('pendingPaymentTokenId'); // Clean up after use

          // Record the payment in the backend
          const recordPayment = async () => {
            try {
              const response = await fetch('/api/payment', {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json'
                },
                body: JSON.stringify({ tokenId: storedTokenId })
              });

              if (!response.ok) {
                throw new Error('Failed to record payment');
              }

              console.log("Payment recorded in backend");
              onPaymentSuccess(storedTokenId);
              setCurrentStep('completed');
              setPaymentInitiated(false); // Reset flag for future payments
            } catch (error) {
              console.error("Failed to record payment:", error);
              setError("Payment processed but failed to verify. Please contact support.");
            }

            setIsLoading(false);
          };

          recordPayment();
        } else {
          setError("Payment confirmation error: token ID not found");
          setIsLoading(false);
        }
      }
    }
  }, [isPaymentConfirmed, paymentHash, onPaymentSuccess]);

  // Handle errors
  useEffect(() => {
    if (isError) {
      console.error("Contract error:", contractError);
      setError("Transaction failed. Please try again.");
      setIsLoading(false);
    }
  }, [isError, contractError]);

  useEffect(() => {
    if (approvalReceiptError) {
      console.error("Approval receipt error:", approvalReceiptError);
      setError("Approval confirmation failed. Please check your wallet.");
      setIsLoading(false);
    }
  }, [approvalReceiptError]);

  useEffect(() => {
    if (paymentReceiptError) {
      console.error("Payment receipt error:", paymentReceiptError);
      setError("Payment confirmation failed. Please check your wallet.");
      setIsLoading(false);
    }
  }, [paymentReceiptError]);

  // Calculate display amounts
  const displayBalance = balance !== undefined && balance !== null && typeof balance === 'bigint' ? Number(balance) / 1e18 : 0;
  const displayRequired = Number(requiredAmount) / 1e18;

  if (isApprovalConfirming || isPaymentConfirming) {
    return (
      <div className="flex flex-col items-center gap-4 p-6">
        <div className="w-16 h-16 border-2 border-white/20 border-t-white rounded-full animate-spin mb-4" />
        <p className="text-[10px] tracking-widest uppercase">
          {isApprovalConfirming ? 'CONFIRMING_APPROVAL' : 'CONFIRMING_PAYMENT'}
        </p>
        <p className="text-xs text-white/60 text-center max-w-xs">
          {isApprovalConfirming
            ? 'PLEASE_CONFIRM_APPROVAL_IN_WALLET'
            : 'PLEASE_CONFIRM_PAYMENT_IN_WALLET'}
        </p>
        {(approvalHash || paymentHash) && (
          <p className="text-[10px] text-white/40 tracking-wider break-all mt-2">
            TX_HASH: {((approvalHash || paymentHash) as string).substring(0, 10)}...{((approvalHash || paymentHash) as string).substring(((approvalHash || paymentHash) as string).length - 8)}
          </p>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Technical Header */}
      <div className="text-center mb-4">
        <p className="text-[10px] tracking-widest uppercase opacity-60 mb-2">PAYMENT_GATEWAY</p>
        <h3 className="text-sm tracking-widest uppercase">HAIRDO_SERVICE_ACCESS</h3>
      </div>

      {/* Balance and Amount Display */}
      <div className="space-y-3">
        <div className="bg-black/40 border border-white/10 p-4 rounded text-center">
          <p className="text-[10px] tracking-widest uppercase opacity-60 mb-1">YOUR_LSK_BALANCE</p>
          <p className="text-lg tracking-wider">{displayBalance.toFixed(4)} <span className="text-sm opacity-60">LSK</span></p>
        </div>

        <div className="bg-black/40 border border-white/10 p-4 rounded text-center">
          <p className="text-[10px] tracking-widest uppercase opacity-60 mb-1">AMOUNT_REQUIRED</p>
          <p className="text-lg tracking-wider">{displayRequired} <span className="text-sm opacity-60">LSK</span></p>
        </div>
      </div>

      {!isConnected ? (
        <div className="flex items-center gap-2 text-sm text-red-500 justify-center">
          <WifiOff className="w-4 h-4" />
          <span className="text-xs tracking-widest uppercase">WALLET_NOT_CONNECTED</span>
        </div>
      ) : !hasEnoughTokens ? (
        <div className="bg-red-50/10 border border-red-500/20 p-3 rounded text-center">
          <p className="text-xs text-red-400 tracking-wide uppercase">INSUFFICIENT_LSK_TOKENS</p>
        </div>
      ) : null}

      {error && (
        <div className="bg-red-50/10 border border-red-500/20 p-3 rounded text-center">
          <p className="text-xs text-red-400 tracking-wide uppercase mb-2">{error}</p>
          <button
            onClick={() => setError(null)}
            className="text-[10px] tracking-widest uppercase text-red-300 hover:text-red-200 underline"
          >
            DISMISS_ERROR
          </button>
        </div>
      )}

      {isConnected && hasEnoughTokens && (
        <>
          {!isApproved ? (
            <Button
              onClick={handleApproval}
              disabled={isLoading || isPending || !isConnected || !hasEnoughTokens}
              variant="secondary"
              size="lg"
              className="w-full h-14 text-sm tracking-widest uppercase relative overflow-hidden group"
            >
              {isLoading || isPending ? (
                <>
                  <span className="relative z-10">PROCESSING_APPROVAL</span>
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700" />
                </>
              ) : (
                <>
                  <span className="relative z-10">APPROVE_CONTRACT_TO_SPEND_LSK</span>
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700" />
                </>
              )}
            </Button>
          ) : (
            <Button
              onClick={handlePayment}
              disabled={isLoading || isPending || !isConnected || !hasEnoughTokens || !isApproved}
              variant="secondary"
              size="lg"
              className="w-full h-14 text-sm tracking-widest uppercase relative overflow-hidden group"
            >
              {isLoading || isPending ? (
                <>
                  <span className="relative z-10">PROCESSING_TRANSACTION</span>
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700" />
                </>
              ) : (
                <>
                  <span className="relative z-10">PAY_{amount}_LSK</span>
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700" />
                </>
              )}
            </Button>
          )}
        </>
      )}

      <div className="text-center text-[10px] tracking-wider text-white/50 space-y-2">
        <p>BY_PAYING_YOU_AGREE_TO_TERMS_OF_SERVICE</p>
        <p>THIS_PAYMENT_GRANTS_ACCESS_TO_GENERATE_ONE_HAIRSTYLE</p>
        <p>YOUR_PHOTO_IS_PROCESSED_LOCALLY_AND_NEVER_STORED</p>
      </div>
    </div>
  );
}