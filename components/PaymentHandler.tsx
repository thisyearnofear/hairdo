"use client";

import { useState } from "react";
import { useAccount, useWriteContract, useWaitForTransactionReceipt } from "wagmi";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import { CONTRACT_ADDRESS, CONTRACT_ABI } from "@/lib/contract-config";

interface PaymentHandlerProps {
  onPaymentSuccess: (tokenId: string) => void;
  amount: string;
}

export function PaymentHandler({ onPaymentSuccess, amount }: PaymentHandlerProps) {
  const { address, isConnected } = useAccount();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const { data: hash, writeContract, isPending, isError, error: contractError } = useWriteContract();
  
  const { isLoading: isConfirming, isSuccess: isConfirmed, error: receiptError } = useWaitForTransactionReceipt({
    hash,
  });
  
  const handlePayment = async () => {
    if (!isConnected || !address) {
      setError("Please connect your wallet first");
      return;
    }
    
    setIsLoading(true);
    setError(null);
    
    try {
      // Generate a unique token ID for this transaction
      const tokenId = `0x${Array.from({ length: 32 }, () => Math.floor(Math.random() * 16).toString(16)).join('')}`;
      
      console.log("Initiating payment with params:", {
        address: CONTRACT_ADDRESS,
        tokenId: tokenId,
        value: BigInt(0.001 * 1e18)
      });
      
      // Call the smart contract to process payment
      writeContract({
        address: CONTRACT_ADDRESS,
        abi: CONTRACT_ABI,
        functionName: 'payForService',
        args: [tokenId],
        value: BigInt(0.001 * 1e18) // Convert ETH to wei (0.001 ETH)
      });
    } catch (err) {
      console.error("Payment error:", err);
      setError("Payment failed. Please try again.");
      setIsLoading(false);
    }
  };
  
  // Handle successful transaction
  if (isConfirmed && hash) {
    console.log("Payment confirmed with hash:", hash);
    // Generate a tokenId for the successful payment
    const tokenId = `0x${Array.from({ length: 32 }, () => Math.floor(Math.random() * 16).toString(16)).join('')}`;
    onPaymentSuccess(tokenId);
    setIsLoading(false);
  }
  
  // Handle errors
  if (isError) {
    console.error("Contract error:", contractError);
    setError("Transaction failed. Please try again.");
    setIsLoading(false);
  }
  
  if (receiptError) {
    console.error("Receipt error:", receiptError);
    setError("Transaction confirmation failed. Please check your wallet.");
    setIsLoading(false);
  }
  
  if (isConfirming) {
    return (
      <div className="flex flex-col items-center gap-4 p-6">
        <Loader2 className="h-8 w-8 animate-spin" />
        <p>Confirming payment...</p>
        <p className="text-sm text-muted-foreground">Please confirm the transaction in your wallet</p>
        {hash && (
          <p className="text-xs text-muted-foreground break-all">Tx: {hash.substring(0, 10)}...{hash.substring(hash.length - 8)}</p>
        )}
      </div>
    );
  }
  
  return (
    <div className="flex flex-col items-center gap-4 p-6">
      <h3 className="text-lg font-semibold">Pay to Use Hairdo Service</h3>
      <p className="text-muted-foreground">Amount: {amount} LISK ETH</p>
      
      {!isConnected ? (
        <p className="text-sm text-red-500">Please connect your wallet to continue</p>
      ) : null}
      
      {error && (
        <div className="text-sm text-red-500 text-center">
          <p>{error}</p>
          <button 
            onClick={() => setError(null)}
            className="mt-2 text-xs underline"
          >
            Dismiss
          </button>
        </div>
      )}
      
      <Button 
        onClick={handlePayment} 
        disabled={isLoading || isPending || !isConnected}
        className="w-full"
      >
        {(isLoading || isPending) ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Processing...
          </>
        ) : (
          `Pay ${amount} ETH`
        )}
      </Button>
      
      <p className="text-xs text-muted-foreground mt-4 text-center">
        By paying, you agree to the terms of service. This payment grants you access to generate one hairstyle.
        Your photo is processed locally and never stored.
      </p>
    </div>
  );
}