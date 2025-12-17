// Test file to verify environment variables
console.log("Environment Variables Test:");
console.log("NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID exists:", !!process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID);
console.log("NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID length:", process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID?.length || 0);
console.log("NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID starts with:", process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID?.substring(0, 8) || "undefined");

export {}