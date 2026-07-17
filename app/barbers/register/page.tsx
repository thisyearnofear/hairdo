"use client"

import { useState, useEffect } from "react"
import { useConnection, useWriteContract, useWaitForTransactionReceipt, useReadContract } from "wagmi"
import { Header } from "@/components/Header"
import { Footer } from "@/components/Footer"
import { Button } from "@/components/ui/button"
import { Reveal } from "@/components/ui/reveal"
import {
  Scissors,
  MapPin,
  CheckCircle2,
  ArrowLeft,
  Loader2,
  Zap,
  WifiOff,
} from "lucide-react"
import Link from "next/link"
import {
  PROTOCOL_CONTRACT_ADDRESS,
  PROTOCOL_ABI,
  LSK_TOKEN_ADDRESS_MAINNET,
  LSK_TOKEN_ADDRESS_TESTNET,
} from "@/lib/contract-config"
import { lisk, liskSepolia } from "@/lib/chains"
import { getAllStyles, getCategories } from "@/lib/style-matcher"

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
]

export default function RegisterBarberPage() {
  const { address, isConnected, chainId } = useConnection()
  const [step, setStep] = useState<1 | 2 | 3 | 4>(1)
  const [shop, setShop] = useState("")
  const [city, setCity] = useState("")
  const [state, setState] = useState("")
  const [selectedSpecialties, setSelectedSpecialties] = useState<string[]>([])
  const [stakeAmount, setStakeAmount] = useState("10")
  const [error, setError] = useState<string | null>(null)
  const [registered, setRegistered] = useState(false)

  const {
    data: hash,
    writeContract,
    isPending,
    isError,
    error: contractError,
  } = useWriteContract()

  const isTestnet = chainId === liskSepolia.id
  const lskTokenAddress = isTestnet
    ? LSK_TOKEN_ADDRESS_TESTNET
    : LSK_TOKEN_ADDRESS_MAINNET

  // Read MIN_STAKE from contract
  const { data: minStake } = useReadContract({
    address: PROTOCOL_CONTRACT_ADDRESS,
    abi: PROTOCOL_ABI,
    functionName: "MIN_STAKE",
    query: { enabled: !!address },
  })

  // Read barber registration status
  const { data: barberProfile, refetch: refetchBarber } = useReadContract({
    address: PROTOCOL_CONTRACT_ADDRESS,
    abi: PROTOCOL_ABI,
    functionName: "getBarberProfile",
    args: address ? ([address] as const) : undefined,
    query: { enabled: !!address },
  })

  // Read LSK balance
  const { data: balance, isLoading: isLoadingBalance } = useReadContract({
    address: lskTokenAddress,
    abi: ERC20_ABI,
    functionName: "balanceOf",
    args: address ? ([address] as const) : undefined,
    query: { enabled: !!address },
  })

  // Read LSK allowance
  const { data: allowance, refetch: refetchAllowance } = useReadContract({
    address: lskTokenAddress,
    abi: ERC20_ABI,
    functionName: "allowance",
    args: address ? ([address, PROTOCOL_CONTRACT_ADDRESS] as const) : undefined,
    query: { enabled: !!address },
  })

  const requiredStake =
    minStake !== undefined && typeof minStake === "bigint"
      ? minStake
      : BigInt(10 * 1e18)

  const stakeBigInt = BigInt(Math.floor(parseFloat(stakeAmount) * 1e18))
  const effectiveStake = stakeBigInt > requiredStake ? stakeBigInt : requiredStake

  const hasEnoughTokens =
    balance !== undefined &&
    typeof balance === "bigint" &&
    balance >= effectiveStake

  const isApproved =
    allowance !== undefined &&
    typeof allowance === "bigint" &&
    allowance >= effectiveStake

  const approvalHash = hash && step === 3 ? hash : null
  const registerHash = hash && step === 4 ? hash : null

  const {
    isLoading: isApprovalConfirming,
    isSuccess: isApprovalConfirmed,
  } = useWaitForTransactionReceipt({
    hash: approvalHash as `0x${string}`,
  })

  const {
    isLoading: isRegisterConfirming,
    isSuccess: isRegisterConfirmed,
  } = useWaitForTransactionReceipt({
    hash: registerHash as `0x${string}`,
  })

  // Check if already registered
  useEffect(() => {
    if (barberProfile && Array.isArray(barberProfile) && barberProfile[0] === true) {
      setRegistered(true)
    }
  }, [barberProfile])

  // Handle approval confirmation → proceed to register
  useEffect(() => {
    if (isApprovalConfirmed && approvalHash && step === 3) {
      refetchAllowance()
      setStep(4)
    }
  }, [isApprovalConfirmed, approvalHash, refetchAllowance, step])

  // Handle registration confirmation
  useEffect(() => {
    if (isRegisterConfirmed && registerHash && step === 4) {
      refetchBarber()
      setRegistered(true)
      setError(null)
    }
  }, [isRegisterConfirmed, registerHash, refetchBarber, step])

  const allStyles = getAllStyles()
  const categories = getCategories()

  const toggleSpecialty = (styleId: string) => {
    setSelectedSpecialties((prev) =>
      prev.includes(styleId)
        ? prev.filter((id) => id !== styleId)
        : [...prev, styleId]
    )
  }

  const handleApprove = async () => {
    if (!isConnected || !address) {
      setError("Please connect your wallet first")
      return
    }
    if (!hasEnoughTokens) {
      setError("Insufficient LSK for staking")
      return
    }
    setError(null)
    setStep(3)
    try {
      writeContract({
        address: lskTokenAddress,
        abi: ERC20_ABI,
        functionName: "approve",
        args: [PROTOCOL_CONTRACT_ADDRESS, effectiveStake],
      })
    } catch (err) {
      console.error("Approval error:", err)
      setError("Approval failed. Please try again.")
      setStep(2)
    }
  }

  const handleRegister = async () => {
    if (!isConnected || !address) {
      setError("Please connect your wallet first")
      return
    }
    if (!isApproved) {
      setError("Please approve LSK spending first")
      return
    }
    if (!shop || !city || !state) {
      setError("Please fill in all fields")
      return
    }
    if (selectedSpecialties.length === 0) {
      setError("Select at least one specialty")
      return
    }
    setError(null)
    setStep(4)
    try {
      writeContract({
        address: PROTOCOL_CONTRACT_ADDRESS,
        abi: PROTOCOL_ABI,
        functionName: "registerBarber",
        args: [shop, city, state, selectedSpecialties, effectiveStake],
      })
    } catch (err) {
      console.error("Registration error:", err)
      setError("Registration failed. Please try again.")
      setStep(3)
    }
  }

  const displayBalance =
    balance !== undefined && typeof balance === "bigint"
      ? Number(balance) / 1e18
      : 0

  const displayStake = Number(effectiveStake) / 1e18

  // Already registered state
  if (registered) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-1 max-w-2xl mx-auto w-full px-4 py-12">
          <Reveal>
            <div className="text-center space-y-6">
              <div className="w-16 h-16 rounded-full bg-amber/10 border border-amber/30 flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-8 h-8 text-amber" />
              </div>
              <h1 className="text-2xl font-display text-gradient-warm">
                You&apos;re a registered barber
              </h1>
              <p className="text-sm opacity-60 max-w-md mx-auto leading-relaxed">
                Your shop is onchain. Clients can find you in the barber
                directory, and your trust score grows with every verified cut.
              </p>
              {address && (
                <div className="bg-black/30 border border-amber/15 p-4 rounded-lg">
                  <p className="text-[10px] tracking-wide uppercase opacity-50 mb-1">
                    Your profile
                  </p>
                  <p className="text-sm font-mono break-all">{address}</p>
                </div>
              )}
              <div className="flex gap-3 justify-center pt-4">
                <Button asChild variant="secondary" size="lg">
                  <Link href="/barbers">View barber directory</Link>
                </Button>
                <Button asChild variant="ghost" size="lg">
                  <Link href="/">Back home</Link>
                </Button>
              </div>
            </div>
          </Reveal>
        </main>
        <Footer />
      </div>
    )
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 max-w-2xl mx-auto w-full px-4 py-12">
        <Reveal>
          <Link
            href="/barbers"
            className="text-xs tracking-wide opacity-50 hover:opacity-80 transition-opacity inline-flex items-center gap-1 mb-6"
          >
            <ArrowLeft className="w-3 h-3" />
            Back to barbers
          </Link>

          <div className="text-center mb-10">
            <div className="flex items-center justify-center gap-2 mb-3">
              <Scissors className="w-5 h-5 text-amber" />
              <span className="text-[11px] tracking-wide uppercase opacity-50">
                Barber registration
              </span>
            </div>
            <h1 className="text-3xl font-display text-gradient-warm mb-3">
              Join the barber registry
            </h1>
            <p className="text-sm opacity-60 max-w-md mx-auto leading-relaxed">
              Stake LSK to register your shop onchain. Declare your specialties,
              build trust with every verified cut, and let clients find you by
              the styles you master.
            </p>
          </div>

          {/* Progress steps */}
          <div className="flex items-center justify-center gap-2 mb-10">
            {[1, 2, 3, 4].map((s) => (
              <div
                key={s}
                className={`h-1.5 rounded-full transition-all duration-300 ${
                  step >= s ? "w-8 bg-amber" : "w-4 bg-white/10"
                }`}
              />
            ))}
          </div>

          {/* Step 1: Shop details */}
          {step === 1 && (
            <div className="space-y-5">
              <div className="bg-black/30 border border-amber/15 p-5 rounded-lg space-y-4 glass-warm">
                <div>
                  <label className="text-[10px] tracking-wide uppercase opacity-50 block mb-2">
                    Shop name
                  </label>
                  <input
                    type="text"
                    value={shop}
                    onChange={(e) => setShop(e.target.value)}
                    placeholder="e.g. Fresh Cuts Barbershop"
                    className="w-full bg-black/40 border border-white/10 rounded-lg px-4 py-3 text-sm tracking-wide focus:border-amber/40 focus:outline-none transition-colors"
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[10px] tracking-wide uppercase opacity-50 block mb-2">
                      City
                    </label>
                    <input
                      type="text"
                      value={city}
                      onChange={(e) => setCity(e.target.value)}
                      placeholder="e.g. Atlanta"
                      className="w-full bg-black/40 border border-white/10 rounded-lg px-4 py-3 text-sm tracking-wide focus:border-amber/40 focus:outline-none transition-colors"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] tracking-wide uppercase opacity-50 block mb-2">
                      State / Region
                    </label>
                    <input
                      type="text"
                      value={state}
                      onChange={(e) => setState(e.target.value)}
                      placeholder="e.g. GA"
                      className="w-full bg-black/40 border border-white/10 rounded-lg px-4 py-3 text-sm tracking-wide focus:border-amber/40 focus:outline-none transition-colors"
                    />
                  </div>
                </div>
              </div>
              <Button
                onClick={() => setStep(2)}
                disabled={!shop || !city || !state}
                variant="secondary"
                size="lg"
                className="w-full h-12 text-sm tracking-wide"
              >
                Continue to specialties
              </Button>
            </div>
          )}

          {/* Step 2: Specialties + stake */}
          {step === 2 && (
            <div className="space-y-5">
              <div className="bg-black/30 border border-amber/15 p-5 rounded-lg glass-warm">
                <p className="text-[10px] tracking-wide uppercase opacity-50 mb-3">
                  Your specialties
                </p>
                <p className="text-xs opacity-50 mb-4 leading-relaxed">
                  Select the styles you excel at. Clients searching for these
                  styles will find you first.
                </p>
                <div className="space-y-4 max-h-80 overflow-y-auto pr-2">
                  {categories.map((cat) => {
                    const catStyles = allStyles.filter(
                      (s) => s.category === cat
                    )
                    if (catStyles.length === 0) return null
                    return (
                      <div key={cat}>
                        <p className="text-[10px] tracking-wide uppercase opacity-40 mb-2 font-display">
                          {cat}
                        </p>
                        <div className="flex flex-wrap gap-2">
                          {catStyles.map((style) => (
                            <button
                              key={style.id}
                              onClick={() => toggleSpecialty(style.id)}
                              className={`px-3 py-1.5 rounded-lg text-xs tracking-wide transition-all ${
                                selectedSpecialties.includes(style.id)
                                  ? "bg-amber/20 border border-amber/40 text-amber"
                                  : "bg-white/5 border border-white/10 opacity-60 hover:opacity-90"
                              }`}
                            >
                              {style.name}
                            </button>
                          ))}
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>

              <div className="bg-black/30 border border-white/10 p-5 rounded-lg">
                <label className="text-[10px] tracking-wide uppercase opacity-50 block mb-2">
                  Stake amount (LSK)
                </label>
                <input
                  type="text"
                  value={stakeAmount}
                  onChange={(e) => setStakeAmount(e.target.value)}
                  placeholder="10"
                  className="w-full bg-black/40 border border-white/10 rounded-lg px-4 py-3 text-sm tabular-nums focus:border-amber/40 focus:outline-none transition-colors"
                />
                <p className="text-[10px] opacity-40 mt-2 leading-relaxed">
                  Minimum {Number(requiredStake) / 1e18} LSK. Higher stakes
                  improve your trust score. Stake is slashable for disputes.
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <Button
                  onClick={() => setStep(1)}
                  variant="ghost"
                  size="lg"
                  className="h-12 text-sm tracking-wide"
                >
                  Back
                </Button>
                <Button
                  onClick={handleApprove}
                  disabled={
                    !isConnected ||
                    !hasEnoughTokens ||
                    selectedSpecialties.length === 0 ||
                    isPending
                  }
                  variant="secondary"
                  size="lg"
                  className="h-12 text-sm tracking-wide"
                >
                  {isPending ? "Approving..." : "Approve LSK"}
                </Button>
              </div>
            </div>
          )}

          {/* Step 3: Approving */}
          {step === 3 && (
            <div className="flex flex-col items-center gap-4 p-6 text-center">
              <div className="w-12 h-12 border-2 border-amber/20 border-t-amber rounded-full animate-spin" />
              <p className="text-sm font-display italic opacity-70">
                {isApprovalConfirming
                  ? "Confirming approval"
                  : "Approve LSK spending"}
              </p>
              <p className="text-xs opacity-50 max-w-xs">
                {isApprovalConfirming
                  ? "Waiting for your approval transaction to confirm onchain..."
                  : "Confirm the LSK approval in your wallet to stake."}
              </p>
              {approvalHash && (
                <a
                  href={`${isTestnet ? "https://sepolia-blockscout.lisk.com" : "https://blockscout.lisk.com"}/tx/${approvalHash}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[10px] opacity-40 hover:opacity-60 underline font-mono break-all"
                >
                  {(approvalHash as string).substring(0, 20)}...
                </a>
              )}
            </div>
          )}

          {/* Step 4: Registering */}
          {step === 4 && (
            <div className="flex flex-col items-center gap-4 p-6 text-center">
              {isRegisterConfirming ? (
                <>
                  <div className="w-12 h-12 border-2 border-amber/20 border-t-amber rounded-full animate-spin" />
                  <p className="text-sm font-display italic opacity-70">
                    Registering your shop
                  </p>
                  <p className="text-xs opacity-50 max-w-xs">
                    Waiting for your registration transaction to confirm...
                  </p>
                </>
              ) : isRegisterConfirmed ? (
                <>
                  <div className="w-14 h-14 rounded-full bg-amber/10 border border-amber/30 flex items-center justify-center mb-2">
                    <CheckCircle2 className="w-7 h-7 text-amber" />
                  </div>
                  <p className="text-base font-display text-gradient-warm">
                    You&apos;re registered
                  </p>
                  <p className="text-xs opacity-60 max-w-xs leading-relaxed">
                    Your shop is onchain. Clients can now find you in the
                    barber directory.
                  </p>
                  <Button asChild variant="secondary" size="lg" className="mt-4">
                    <Link href="/barbers">View directory</Link>
                  </Button>
                </>
              ) : (
                <>
                  <div className="flex items-center justify-center gap-2 mb-2">
                    <Zap className="w-4 h-4 text-amber" />
                    <span className="text-[11px] tracking-wide uppercase opacity-50">
                      Ready to register
                    </span>
                  </div>
                  <p className="text-sm opacity-60 max-w-xs leading-relaxed mb-4">
                    LSK approved. Confirm the registration transaction to stake
                    and join the registry.
                  </p>
                  <Button
                    onClick={handleRegister}
                    disabled={isPending}
                    variant="secondary"
                    size="lg"
                    className="w-full h-12 text-sm tracking-wide"
                  >
                    {isPending ? "Confirm in wallet..." : `Stake ${displayStake} LSK & register`}
                  </Button>
                </>
              )}
              {registerHash && (
                <a
                  href={`${isTestnet ? "https://sepolia-blockscout.lisk.com" : "https://blockscout.lisk.com"}/tx/${registerHash}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[10px] opacity-40 hover:opacity-60 underline font-mono break-all"
                >
                  {(registerHash as string).substring(0, 20)}...
                </a>
              )}
            </div>
          )}

          {/* Wallet states */}
          {!isConnected && step === 1 && (
            <div className="flex items-center gap-2 text-sm justify-center text-amber/80 mt-6">
              <WifiOff className="w-4 h-4" />
              <span className="text-xs tracking-wide">
                Connect your wallet to register
              </span>
            </div>
          )}

          {isConnected && !hasEnoughTokens && step === 2 && (
            <div className="bg-red-500/5 border border-red-500/20 p-3 rounded-lg text-center mt-4">
              <p className="text-xs text-red-400/80 tracking-wide">
                Not enough LSK to stake (need {displayStake}, have{" "}
                {displayBalance.toFixed(2)})
              </p>
            </div>
          )}

          {isTestnet && (
            <div className="text-center text-[10px] tracking-wide text-amber/50 mt-6">
              Testnet mode — Lisk Sepolia
            </div>
          )}

          {error && (
            <div className="bg-red-500/5 border border-red-500/20 p-3 rounded-lg text-center mt-4">
              <p className="text-xs text-red-400/80 tracking-wide">{error}</p>
              <button
                onClick={() => setError(null)}
                className="text-[10px] tracking-wide text-red-300/70 hover:text-red-300 underline mt-1"
              >
                Dismiss
              </button>
            </div>
          )}

          {isError && contractError && (
            <div className="bg-red-500/5 border border-red-500/20 p-3 rounded-lg text-center mt-4">
              <p className="text-xs text-red-400/80 tracking-wide">
                Transaction failed. {contractError.message?.slice(0, 80)}
              </p>
            </div>
          )}
        </Reveal>
      </main>
      <Footer />
    </div>
  )
}
