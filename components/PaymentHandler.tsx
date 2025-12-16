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
  
  const { data: hash, writeContract, isPending, isError } = useWriteContract();
  
  const { isLoading: isConfirming, isSuccess: isConfirmed } = useWaitForTransactionReceipt({
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
      const tokenId = `${address}-${Date.now()}`;
      
      // Call the smart contract to process payment
      writeContract({
        address: CONTRACT_ADDRESS,
        abi: CONTRACT_ABI,
        functionName: 'payForService',
        args: [tokenId],
        value: BigInt(0.001 * 1e18) // Convert ETH to wei (0.001 ETH)
      });
      
      // Wait for transaction confirmation
      // The parent component will handle the success callback
    } catch (err) {
      setError("Payment failed. Please try again.");
      setIsLoading(false);
    }
  };
  
  // Handle successful transaction
  if (isConfirmed && hash) {
    // Extract tokenId from the transaction (in a real implementation, you might emit this in the event)
    const tokenId = `${address}-${Date.now()}`;
    onPaymentSuccess(tokenId);
  }
  
  if (isError) {
    setError("Transaction failed. Please try again.");
  }
  
  if (isConfirming) {
    return (
      <div className="flex flex-col items-center gap-4 p-6">
        <Loader2 className="h-8 w-8 animate-spin" />
        <p>Confirming payment...</p>
        <p className="text-sm text-muted-foreground">Please confirm the transaction in your wallet</p>
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
        <p className="text-sm text-red-500">{error}</p>
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
      
      <p className="text-xs text-muted-foreground mt-4">
        By paying, you agree to the terms of service. This payment grants you access to generate one hairstyle.
      </p>
    </div>
  );
}