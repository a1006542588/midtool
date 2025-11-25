"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { ArrowLeft, Settings2, Send, Download, RefreshCw, Wallet, ArrowRightLeft, AlertCircle, Plus, Trash2, Zap, Fuel } from "lucide-react";
import clsx from "clsx";
import * as XLSX from "xlsx";
import { ethers } from "ethers";
import { ToolHeader } from "@/components/ToolHeader";

// Minimal ERC20 ABI
const ERC20_ABI = [
  "function name() view returns (string)",
  "function symbol() view returns (string)",
  "function decimals() view returns (uint8)",
  "function balanceOf(address) view returns (uint256)",
  "function transfer(address to, uint256 amount) returns (bool)",
];

// Chain Data
const CHAINS: Record<number, { name: string; nativeSymbol: string; rpcs: string[]; tokens: { symbol: string; address: string }[] }> = {
  1: {
    name: "Ethereum Mainnet",
    nativeSymbol: "ETH",
    rpcs: ["https://eth.llamarpc.com", "https://rpc.ankr.com/eth", "https://1rpc.io/eth"],
    tokens: [
      { symbol: "USDT", address: "0xdAC17F958D2ee523a2206206994597C13D831ec7" },
      { symbol: "USDC", address: "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48" },
      { symbol: "DAI", address: "0x6B175474E89094C44Da98b954EedeAC495271d0F" },
    ]
  },
  56: {
    name: "BNB Smart Chain",
    nativeSymbol: "BNB",
    rpcs: ["https://binance.llamarpc.com", "https://bsc-dataseed.binance.org", "https://1rpc.io/bnb"],
    tokens: [
      { symbol: "USDT", address: "0x55d398326f99059fF775485246999027B3197955" },
      { symbol: "USDC", address: "0x8AC76a51cc950d9822D68b83fE1Ad97B32Cd580d" },
      { symbol: "BUSD", address: "0xe9e7CEA3DedcA5984780Bafc599bD69ADd087D56" },
    ]
  },
  137: {
    name: "Polygon",
    nativeSymbol: "MATIC",
    rpcs: ["https://polygon.llamarpc.com", "https://rpc-mainnet.maticvigil.com"],
    tokens: [
      { symbol: "USDT", address: "0xc2132D05D31c914a87C6611C10748AEb04B58e8F" },
      { symbol: "USDC", address: "0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174" },
    ]
  },
  42161: {
    name: "Arbitrum One",
    nativeSymbol: "ETH",
    rpcs: ["https://arbitrum.llamarpc.com", "https://arb1.arbitrum.io/rpc"],
    tokens: [
      { symbol: "USDT", address: "0xFd086bC7CD5C481DCC9C85ebE478A1C0b69FCbb9" },
      { symbol: "USDC", address: "0xaf88d065e77c8cC2239327C5EDb3A432268e5831" },
    ]
  },
  10: {
    name: "Optimism",
    nativeSymbol: "ETH",
    rpcs: ["https://optimism.llamarpc.com", "https://mainnet.optimism.io"],
    tokens: [
      { symbol: "USDT", address: "0x94b008aA00579c1307B0EF2c499aD98a8ce98e48" },
      { symbol: "USDC", address: "0x7F5c764cBc14f9669B88837ca1490cCa17c31607" },
    ]
  }
};

type TokenInfo = {
  address: string; // "native" or contract address
  symbol: string;
  decimals: number;
  balance?: string;
};

type Log = {
  timestamp: string;
  type: "info" | "success" | "error";
  message: string;
};

type GasStrategy = "slow" | "average" | "fast" | "custom";

// EIP-6963 Types
interface EIP6963ProviderInfo {
  uuid: string;
  name: string;
  icon: string;
  rdns: string;
}

interface EIP6963ProviderDetail {
  info: EIP6963ProviderInfo;
  provider: any;
}

export default function BatchTransfer() {
  const [activeTab, setActiveTab] = useState<"send" | "collect">("send");
  const [logs, setLogs] = useState<Log[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [showWalletSelector, setShowWalletSelector] = useState(false);

  // EIP-6963 State
  const [eip6963Providers, setEip6963Providers] = useState<EIP6963ProviderDetail[]>([]);

  useEffect(() => {
    function onAnnounceProvider(event: Event) {
      const detail = (event as CustomEvent).detail as EIP6963ProviderDetail;
      setEip6963Providers(prev => {
        if (prev.some(p => p.info.uuid === detail.info.uuid)) return prev;
        return [...prev, detail];
      });
    }

    window.addEventListener("eip6963:announceProvider", onAnnounceProvider);
    window.dispatchEvent(new Event("eip6963:requestProvider"));

    return () => window.removeEventListener("eip6963:announceProvider", onAnnounceProvider);
  }, []);

  // Connection State
  const [provider, setProvider] = useState<ethers.BrowserProvider | null>(null);
  const [signer, setSigner] = useState<ethers.JsonRpcSigner | null>(null);
  const [walletAddress, setWalletAddress] = useState("");
  const [chainId, setChainId] = useState<number>(0);

  // Settings
  const [rpcUrl, setRpcUrl] = useState("");
  const [customGasPrice, setCustomGasPrice] = useState("");
  const [gasStrategy, setGasStrategy] = useState<GasStrategy>("average");
  const [currentGasPrice, setCurrentGasPrice] = useState<bigint>(BigInt(0));
  
  // Token State
  const [tokenAddress, setTokenAddress] = useState("");
  const [tokenInfo, setTokenInfo] = useState<TokenInfo>({ address: "native", symbol: "ETH", decimals: 18 });
  const [isLoadingToken, setIsLoadingToken] = useState(false);

  // Batch Send State
  const [recipients, setRecipients] = useState(""); // Format: address,amount
  
  // Batch Collect State
  const [privateKeys, setPrivateKeys] = useState("");
  const [collectTargetAddress, setCollectTargetAddress] = useState("");
  
  // Chain Selection for Scanning
  const [selectedChains, setSelectedChains] = useState<number[]>(Object.keys(CHAINS).map(Number));

  type ScannedBalance = {
    chainId: number;
    chainName: string;
    rpc: string;
    symbol: string;
    tokenAddress: string;
    decimals: number;
    amount: string;
    isNative: boolean;
    selected: boolean; // Selection state
  };

  type ScanResult = {
    address: string;
    privateKey: string;
    balances: ScannedBalance[];
  };
  
  const [scannedWallets, setScannedWallets] = useState<ScanResult[]>([]);
  const [isScanning, setIsScanning] = useState(false);

  const exportLogs = () => {
    if (logs.length === 0) return;
    const data = logs.map(log => ({
      "时间": log.timestamp,
      "类型": log.type === "success" ? "成功" : log.type === "error" ? "失败" : "信息",
      "消息": log.message
    }));
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Logs");
    XLSX.writeFile(wb, `batch_transfer_logs_${new Date().getTime()}.xlsx`);
  };

  const exportScannedWallets = () => {
    if (scannedWallets.length === 0) return;
    const data: any[] = [];
    scannedWallets.forEach(w => {
      w.balances.forEach(b => {
        if (parseFloat(b.amount) > 0) {
          data.push({
            "地址": w.address,
            "私钥": w.privateKey,
            "链": b.chainName,
            "代币": b.symbol,
            "余额": b.amount,
            "合约地址": b.tokenAddress
          });
        }
      });
    });
    
    if (data.length === 0) {
        addLog("info", "没有可导出的余额数据");
        return;
    }

    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Scanned Assets");
    XLSX.writeFile(wb, `scanned_assets_${new Date().getTime()}.xlsx`);
  };

  const addLog = (type: "info" | "success" | "error", message: string) => {
    setLogs(prev => [{ timestamp: new Date().toLocaleTimeString(), type, message }, ...prev]);
  };

  // Fetch Gas Price
  const fetchGasPrice = async (p: ethers.Provider) => {
    try {
      const feeData = await p.getFeeData();
      if (feeData.gasPrice) {
        setCurrentGasPrice(feeData.gasPrice);
      }
    } catch (e) {
      console.error("Failed to fetch gas price", e);
    }
  };

  useEffect(() => {
    if (!provider) return;
    fetchGasPrice(provider);
    const interval = setInterval(() => fetchGasPrice(provider), 15000);
    return () => clearInterval(interval);
  }, [provider]);

  // Connect Wallet
  const connectWallet = async (walletType: "default" | "okx" | "binance" | "eip6963" = "default", eip6963Provider?: any) => {
    setShowWalletSelector(false);
    let providerInstance;

    if (typeof window === "undefined") return;

    if (walletType === "eip6963" && eip6963Provider) {
      providerInstance = eip6963Provider;
      addLog("info", "使用 EIP-6963 提供者连接...");
    } else if (walletType === "okx") {
      // @ts-ignore
      providerInstance = window.okxwallet;
      if (!providerInstance) {
        addLog("error", "未检测到 OKX Wallet");
        return;
      }
    } else if (walletType === "binance") {
      // @ts-ignore
      if (window.BinanceChain) {
        // @ts-ignore
        providerInstance = window.BinanceChain;
        addLog("info", "检测到 window.BinanceChain");
      } 
      // @ts-ignore
      else if (window.bnb) {
        // @ts-ignore
        providerInstance = window.bnb;
        addLog("info", "检测到 window.bnb");
      }
      // @ts-ignore
      else if (window.ethereum) {
        // @ts-ignore
        if (window.ethereum.isBinance) {
           addLog("info", "检测到 window.ethereum (isBinance)");
        } else {
           addLog("info", "未检测到专用对象，尝试强制使用 window.ethereum 连接...");
        }
        // @ts-ignore
        providerInstance = window.ethereum;
      } else {
        addLog("error", "未检测到任何钱包对象 (BinanceChain/bnb/ethereum)");
        return;
      }
    } else {
      // @ts-ignore
      providerInstance = window.ethereum;
      if (!providerInstance) {
        addLog("error", "未检测到钱包插件");
        return;
      }
    }

    try {
      // Try to manually enable if the method exists (Legacy Binance Wallet support)
      // @ts-ignore
      if (walletType === "binance" && providerInstance.enable) {
        addLog("info", "正在尝试启用 Binance Wallet...");
        // @ts-ignore
        await providerInstance.enable();
      }

      const provider = new ethers.BrowserProvider(providerInstance);
      
      // Explicitly request accounts
      addLog("info", "正在请求钱包授权...");
      await provider.send("eth_requestAccounts", []);
      
      const signer = await provider.getSigner();
      const address = await signer.getAddress();
      const network = await provider.getNetwork();
      const cId = Number(network.chainId);

      setProvider(provider);
      setSigner(signer);
      setWalletAddress(address);
      setChainId(cId);
      
      // Auto-set RPC if available
      if (CHAINS[cId] && CHAINS[cId].rpcs.length > 0 && !rpcUrl) {
        setRpcUrl(CHAINS[cId].rpcs[0]);
      }

      // Fetch Gas
      fetchGasPrice(provider);
      
      // Update Native Token Symbol based on Chain ID (Simple heuristic)
      let symbol = "ETH";
      if (cId === 56) symbol = "BNB";
      if (cId === 137) symbol = "MATIC";
      if (cId === 43114) symbol = "AVAX";
      
      if (tokenInfo.address === "native") {
        setTokenInfo(prev => ({ ...prev, symbol }));
      }

      addLog("success", `已连接钱包 (${walletType}): ${address.slice(0, 6)}...${address.slice(-4)} (Chain ID: ${cId})`);
    } catch (e: any) {
      addLog("error", `连接失败: ${e.message}`);
    }
  };

  // Load Token Info
  const loadToken = async (overrideAddress?: string) => {
    const targetAddress = overrideAddress !== undefined ? overrideAddress : tokenAddress;

    if (!targetAddress || targetAddress === "native") {
      // Reset to native
      const symbol = chainId === 56 ? "BNB" : chainId === 137 ? "MATIC" : "ETH";
      setTokenInfo({ address: "native", symbol, decimals: 18 });
      setTokenAddress("");
      return;
    }

    if (!ethers.isAddress(targetAddress)) {
      addLog("error", "无效的代币地址");
      return;
    }

    setIsLoadingToken(true);
    try {
      // Use custom RPC if provided, otherwise use wallet provider
      let p: ethers.Provider | null = provider;
      if (rpcUrl) {
        p = new ethers.JsonRpcProvider(rpcUrl);
      }
      
      if (!p) {
        addLog("error", "请先连接钱包或配置 RPC");
        setIsLoadingToken(false);
        return;
      }

      const contract = new ethers.Contract(targetAddress, ERC20_ABI, p);
      const symbol = await contract.symbol();
      const decimals = await contract.decimals();
      
      setTokenInfo({ address: targetAddress, symbol, decimals: Number(decimals) });
      setTokenAddress(targetAddress);
      addLog("success", `已加载代币: ${symbol} (${decimals} decimals)`);
    } catch (e: any) {
      addLog("error", `加载代币失败: ${e.message}`);
    } finally {
      setIsLoadingToken(false);
    }
  };

  // Get Gas Price based on strategy
  const getGasPrice = () => {
    if (gasStrategy === "custom") {
      return customGasPrice ? ethers.parseUnits(customGasPrice, "gwei") : undefined;
    }
    if (currentGasPrice === BigInt(0)) return undefined;

    // Simple multipliers: Slow 0.9x, Avg 1.0x, Fast 1.2x
    if (gasStrategy === "slow") return (currentGasPrice * BigInt(90)) / BigInt(100);
    if (gasStrategy === "fast") return (currentGasPrice * BigInt(120)) / BigInt(100);
    return currentGasPrice;
  };

  // Batch Send Logic
  const handleBatchSend = async () => {
    if (!signer) {
      addLog("error", "请先连接钱包");
      return;
    }
    
    const lines = recipients.split("\n").filter(l => l.trim());
    if (lines.length === 0) {
      addLog("error", "请输入接收地址和金额");
      return;
    }

    setIsProcessing(true);
    addLog("info", `开始批量发送，共 ${lines.length} 笔交易...`);

    try {
      const contract = tokenInfo.address !== "native" 
        ? new ethers.Contract(tokenInfo.address, ERC20_ABI, signer) 
        : null;

      for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trim();
        const [addr, amt] = line.split(/[,，\s]+/).map(s => s.trim());

        if (!ethers.isAddress(addr)) {
          addLog("error", `第 ${i + 1} 行地址无效: ${addr}，跳过`);
          continue;
        }

        try {
          const amountWei = ethers.parseUnits(amt, tokenInfo.decimals);
          let tx;

          const txConfig: any = {};
          const gp = getGasPrice();
          if (gp) {
            txConfig.gasPrice = gp;
          }

          if (contract) {
            addLog("info", `正在发送 ${amt} ${tokenInfo.symbol} 给 ${addr}... (请在钱包确认)`);
            tx = await contract.transfer(addr, amountWei, txConfig);
          } else {
            addLog("info", `正在发送 ${amt} ${tokenInfo.symbol} 给 ${addr}... (请在钱包确认)`);
            tx = await signer.sendTransaction({
              to: addr,
              value: amountWei,
              ...txConfig
            });
          }

          addLog("info", `交易已提交: ${tx.hash}，等待确认...`);
          await tx.wait();
          addLog("success", `第 ${i + 1} 笔发送成功!`);
        } catch (e: any) {
          addLog("error", `第 ${i + 1} 笔发送失败: ${e.message}`);
        }
      }
      addLog("success", "批量发送任务结束");
    } catch (e: any) {
      addLog("error", `任务异常终止: ${e.message}`);
    } finally {
      setIsProcessing(false);
    }
  };

  // Batch Collect Logic
  const handleBatchCollect = async () => {
    if (!collectTargetAddress || !ethers.isAddress(collectTargetAddress)) {
      addLog("error", "请输入有效的归集目标地址");
      return;
    }

    // Check if we have selected items from scan results
    const selectedItems: { wallet: ScanResult; balance: ScannedBalance }[] = [];
    scannedWallets.forEach(w => {
      w.balances.forEach(b => {
        if (b.selected) {
          selectedItems.push({ wallet: w, balance: b });
        }
      });
    });

    if (selectedItems.length > 0) {
      // Smart Collect Mode
      setIsProcessing(true);
      addLog("info", `开始智能归集，共选中 ${selectedItems.length} 笔资产...`);

      // Statistics
      const stats = {
        collected: new Map<string, number>(), // Symbol -> Amount
        gasUsed: new Map<string, number>()    // NativeSymbol -> Amount
      };

      try {
        for (let i = 0; i < selectedItems.length; i++) {
          const item = selectedItems[i];
          const { wallet: w, balance: b } = item;
          
          addLog("info", `[${i + 1}/${selectedItems.length}] 正在处理 ${w.address.slice(0, 6)}... 在 ${b.chainName} 上的 ${b.symbol}`);

          try {
            const p = new ethers.JsonRpcProvider(b.rpc);
            const signerWallet = new ethers.Wallet(w.privateKey, p);
            
            let tx;
            const txConfig: any = {};
            const gp = getGasPrice(); // Note: This uses global gas price which might be from a different chain. Ideally fetch fresh.
            // Better: fetch fresh gas price for this chain
            const feeData = await p.getFeeData();
            const chainGasPrice = feeData.gasPrice || ethers.parseUnits("3", "gwei");
            
            // Apply strategy multiplier if needed, or just use chain gas price
            // For simplicity in multi-chain, we use the chain's current gas price
            txConfig.gasPrice = chainGasPrice;

            let amountSent = BigInt(0);
            const nativeSymbol = CHAINS[b.chainId]?.nativeSymbol || "ETH";

            if (b.isNative) {
              const balanceWei = await p.getBalance(w.address);
              const gasLimit = BigInt(21000);
              const gasCost = chainGasPrice * gasLimit;
              
              if (balanceWei <= gasCost) {
                addLog("error", `余额不足以支付 Gas，跳过`);
                continue;
              }
              
              amountSent = balanceWei - gasCost;
              tx = await signerWallet.sendTransaction({
                to: collectTargetAddress,
                value: amountSent,
                gasLimit,
                gasPrice: chainGasPrice
              });
            } else {
              // ERC20
              const contract = new ethers.Contract(b.tokenAddress, ERC20_ABI, signerWallet);
              const balanceWei = await contract.balanceOf(w.address);
              
              if (balanceWei === BigInt(0)) {
                 addLog("info", "余额为0，跳过");
                 continue;
              }
              
              // Check ETH for gas
              const ethBalance = await p.getBalance(w.address);
              if (ethBalance === BigInt(0)) {
                 addLog("error", "无主网代币支付 Gas，跳过");
                 continue;
              }

              amountSent = balanceWei;
              tx = await contract.transfer(collectTargetAddress, balanceWei, txConfig);
            }

            addLog("info", `交易已提交: ${tx.hash}，等待确认...`);
            const receipt = await tx.wait();
            addLog("success", `归集成功!`);

            // Update Stats
            if (receipt) {
              const gasUsed = receipt.gasUsed * receipt.gasPrice;
              const currentGas = stats.gasUsed.get(nativeSymbol) || 0;
              stats.gasUsed.set(nativeSymbol, currentGas + parseFloat(ethers.formatEther(gasUsed)));

              const currentCollected = stats.collected.get(b.symbol) || 0;
              stats.collected.set(b.symbol, currentCollected + parseFloat(ethers.formatUnits(amountSent, b.decimals)));
            }

          } catch (e: any) {
            addLog("error", `归集失败: ${e.message}`);
          }
        }
        
        // Generate Report
        let report = "批量归集任务结束。统计:\n";
        stats.collected.forEach((amount, symbol) => {
          report += `✅ 归集 ${symbol}: ${amount.toFixed(6)}\n`;
        });
        stats.gasUsed.forEach((amount, symbol) => {
          report += `⛽ Gas 消耗 (${symbol}): ${amount.toFixed(6)}\n`;
        });
        
        addLog("success", report);
      } catch (e: any) {
        addLog("error", `任务异常: ${e.message}`);
      } finally {
        setIsProcessing(false);
      }
      return;
    }

    // Fallback to Legacy Blind Collect Mode
    const keys = privateKeys.split("\n").filter(l => l.trim());
    if (keys.length === 0) {
      addLog("error", "请输入私钥");
      return;
    }

    setIsProcessing(true);
    addLog("info", `开始批量归集 (盲归集模式)，共 ${keys.length} 个钱包...`);

    // Statistics
    const stats = {
      collected: 0,
      gasUsed: 0
    };

    // Use custom RPC or fallback to wallet provider (read-only part)
    let p: ethers.Provider | null = null;
    if (rpcUrl) {
      p = new ethers.JsonRpcProvider(rpcUrl);
    } else if (provider) {
      p = provider;
    } else {
      addLog("error", "请配置 RPC URL 或连接钱包以获取网络连接");
      setIsProcessing(false);
      return;
    }

    try {
      for (let i = 0; i < keys.length; i++) {
        const key = keys[i].trim();
        try {
          const wallet = new ethers.Wallet(key, p);
          const address = wallet.address;
          
          addLog("info", `正在检查钱包 ${i + 1}: ${address.slice(0, 6)}...`);

          let balance;
          let tx;
          const txConfig: any = {};
          const gp = getGasPrice();
          if (gp) {
            txConfig.gasPrice = gp;
          }

          let amountSent = BigInt(0);

          if (tokenInfo.address === "native") {
            balance = await p.getBalance(address);
            // Estimate gas cost
            const gasPrice = gp || (await p.getFeeData()).gasPrice || ethers.parseUnits("3", "gwei");
            const gasLimit = BigInt(21000); // Standard transfer
            const gasCost = gasPrice * gasLimit;

            if (balance <= gasCost) {
              addLog("error", `钱包 ${address.slice(0, 6)}... 余额不足以支付 Gas，跳过`);
              continue;
            }

            amountSent = balance - gasCost;
            addLog("info", `归集 ${ethers.formatEther(amountSent)} ${tokenInfo.symbol} 到目标地址...`);
            
            tx = await wallet.sendTransaction({
              to: collectTargetAddress,
              value: amountSent,
              gasLimit,
              gasPrice
            });

          } else {
            // ERC20 Collect
            const contract = new ethers.Contract(tokenInfo.address, ERC20_ABI, wallet);
            balance = await contract.balanceOf(address);
            
            if (balance === BigInt(0)) {
              addLog("info", `钱包 ${address.slice(0, 6)}... 无代币余额，跳过`);
              continue;
            }

            // Check ETH balance for gas
            const ethBalance = await p.getBalance(address);
            if (ethBalance === BigInt(0)) {
               addLog("error", `钱包 ${address.slice(0, 6)}... 无 ETH 支付 Gas，跳过`);
               continue;
            }

            amountSent = balance;
            addLog("info", `归集 ${ethers.formatUnits(balance, tokenInfo.decimals)} ${tokenInfo.symbol} 到目标地址...`);
            tx = await contract.transfer(collectTargetAddress, balance, txConfig);
          }

          addLog("info", `交易已提交: ${tx.hash}，等待确认...`);
          const receipt = await tx.wait();
          addLog("success", `钱包 ${i + 1} 归集成功!`);

          // Update Stats
          if (receipt) {
            const gasUsed = receipt.gasUsed * receipt.gasPrice;
            stats.gasUsed += parseFloat(ethers.formatEther(gasUsed));
            stats.collected += parseFloat(ethers.formatUnits(amountSent, tokenInfo.decimals));
          }

        } catch (e: any) {
          addLog("error", `钱包 ${i + 1} 处理失败: ${e.message}`);
        }
      }
      
      const nativeSymbol = tokenInfo.address === "native" ? tokenInfo.symbol : "ETH"; // Simplified assumption for legacy mode
      addLog("success", `批量归集任务结束。统计: 归集 ${stats.collected.toFixed(6)} ${tokenInfo.symbol}, Gas 消耗: ${stats.gasUsed.toFixed(6)} ${nativeSymbol}`);
    } catch (e: any) {
      addLog("error", `任务异常终止: ${e.message}`);
    } finally {
      setIsProcessing(false);
    }
  };

  // Scan Balances (Multi-Chain)
  const handleScanBalances = async () => {
    const keys = privateKeys.split("\n").filter(l => l.trim());
    if (keys.length === 0) {
      addLog("error", "请输入私钥");
      return;
    }

    setIsScanning(true);
    setScannedWallets([]);
    addLog("info", `开始多链扫描 ${keys.length} 个钱包...`);

    // Initialize results structure
    const initialResults: ScanResult[] = keys.map(k => {
      try {
        return { address: new ethers.Wallet(k).address, privateKey: k, balances: [] };
      } catch {
        return { address: "Invalid Key", privateKey: k, balances: [] };
      }
    });
    
    setScannedWallets(initialResults);

    // Determine scan targets
    const targetSymbol = tokenInfo.symbol;
    const isNativeScan = tokenInfo.address === "native";

    // Prepare list of chains to scan
    const chainsToScan = Object.entries(CHAINS).map(([id, config]) => {
      const cId = Number(id);
      if (!selectedChains.includes(cId)) return null;

      // If scanning native, scan all chains.
      // If scanning ERC20, only scan chains where this token is defined in our list.
      let tokenAddr = "native";
      if (!isNativeScan) {
        const t = config.tokens.find(t => t.symbol === targetSymbol);
        if (!t) return null;
        tokenAddr = t.address;
      }
      
      return {
        id: cId,
        name: config.name,
        nativeSymbol: config.nativeSymbol,
        rpc: config.rpcs[0],
        tokenAddress: tokenAddr
      };
    }).filter(Boolean) as { id: number; name: string; nativeSymbol: string; rpc: string; tokenAddress: string }[];

    try {
      // Scan chains in parallel
      await Promise.all(chainsToScan.map(async (chain) => {
        try {
          const p = new ethers.JsonRpcProvider(chain.rpc);
          
          // Scan each wallet on this chain
          for (let i = 0; i < initialResults.length; i++) {
            const walletData = initialResults[i];
            if (walletData.address === "Invalid Key") continue;

            try {
              let balance = BigInt(0);
              let decimals = 18;

              if (chain.tokenAddress === "native") {
                balance = await p.getBalance(walletData.address);
              } else {
                const contract = new ethers.Contract(chain.tokenAddress, ERC20_ABI, p);
                balance = await contract.balanceOf(walletData.address);
                decimals = Number(await contract.decimals());
              }

              if (balance > BigInt(0)) {
                const formatted = ethers.formatUnits(balance, decimals);
                
                // Update state
                setScannedWallets(prev => {
                  const newWallets = [...prev];
                  const target = newWallets.find(w => w.address === walletData.address);
                  if (target) {
                    // Avoid duplicates
                    if (!target.balances.some(b => b.chainId === chain.id)) {
                      target.balances.push({
                        chainId: chain.id,
                        chainName: chain.name,
                        rpc: chain.rpc,
                        symbol: chain.tokenAddress === "native" ? chain.nativeSymbol : targetSymbol,
                        tokenAddress: chain.tokenAddress,
                        decimals: decimals,
                        amount: formatted,
                        isNative: chain.tokenAddress === "native",
                        selected: true // Default selected
                      });
                    }
                  }
                  return newWallets;
                });
              }
            } catch (e) {
              // Silent fail for individual wallet scan errors
            }
          }
        } catch (e) {
          addLog("error", `连接链 ${chain.name} 失败`);
        }
      }));
      
      addLog("success", "多链扫描完成");
    } catch (e: any) {
      addLog("error", `扫描异常: ${e.message}`);
    } finally {
      setIsScanning(false);
    }
  };

  return (
    <div className="w-full max-w-[1600px] mx-auto p-6">
      <ToolHeader
        title="Web3 批量转账/归集"
        description="支持多链代币批量发送与归集。本地签名，私钥不上传。"
        icon={ArrowRightLeft}
        action={
          <div className="flex gap-2 relative">
           {!walletAddress ? (
             <>
               <button
                 onClick={() => setShowWalletSelector(!showWalletSelector)}
                 className="flex items-center gap-2 px-4 py-2 bg-brand text-white text-xs font-bold uppercase tracking-wider hover:bg-brand/90 transition-all"
               >
                 <Wallet size={14} />
                 连接钱包
               </button>
               
               {showWalletSelector && (
                 <div className="absolute top-full right-0 mt-2 w-64 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 shadow-xl z-50 flex flex-col py-1 max-h-80 overflow-y-auto">
                   {/* EIP-6963 Detected Wallets */}
                   {eip6963Providers.length > 0 ? (
                     <>
                       <div className="px-4 py-2 text-[10px] font-bold uppercase tracking-widest text-neutral-500 bg-neutral-50 dark:bg-neutral-800/50">
                         已检测到的钱包
                       </div>
                       {eip6963Providers.map((p) => (
                         <button
                           key={p.info.uuid}
                           onClick={() => connectWallet("eip6963", p.provider)}
                           className="px-4 py-3 text-left text-xs hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors flex items-center gap-3 border-b border-neutral-100 dark:border-neutral-800/50 last:border-0"
                         >
                           <img src={p.info.icon} alt={p.info.name} className="w-5 h-5 rounded-full" />
                           <span className="font-medium">{p.info.name}</span>
                         </button>
                       ))}
                     </>
                   ) : (
                     <div className="px-4 py-3 text-xs text-neutral-400 text-center italic">
                       未检测到 EIP-6963 钱包
                     </div>
                   )}

                   <div className="h-px bg-neutral-200 dark:bg-neutral-800 my-1" />

                   <button
                     onClick={() => connectWallet("default")}
                     className="px-4 py-2 text-left text-xs hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors flex items-center gap-2 text-neutral-500"
                   >
                     <div className="w-2 h-2 bg-neutral-400 rounded-full" />
                     使用默认方式连接 (Legacy)
                   </button>
                 </div>
               )}
             </>
           ) : (
             <div className="flex items-center gap-2 px-4 py-2 bg-green-500/10 text-green-600 border border-green-500/20 text-xs font-bold font-mono">
               <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
               {walletAddress.slice(0, 6)}...{walletAddress.slice(-4)}
             </div>
           )}
        </div>
        }
      />

      <div className="grid gap-8 lg:grid-cols-12 items-start">
        {/* Left Sidebar: Configuration */}
        <div className="lg:col-span-4 space-y-6">
          <div className="border border-neutral-200 dark:border-neutral-800 p-5 bg-white dark:bg-[#0a0a0a]">
            <h2 className="text-xs font-bold text-neutral-900 dark:text-white mb-6 flex items-center gap-2 uppercase tracking-widest">
              <Settings2 size={14} className="text-brand" />
              全局配置
            </h2>

            <div className="space-y-6">
              {/* RPC Config */}
              <div>
                <label className="text-[10px] font-bold text-neutral-500 mb-2 block uppercase tracking-widest">
                  自定义 RPC (可选)
                </label>
                <input
                  type="text"
                  placeholder="https://..."
                  value={rpcUrl}
                  onChange={(e) => setRpcUrl(e.target.value)}
                  className="w-full p-2 text-sm border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-900 focus:ring-1 focus:ring-brand outline-none font-mono"
                />
                <p className="text-[10px] text-neutral-400 mt-1">不填则使用连接钱包的默认节点</p>
              </div>

              {/* Gas Config */}
              <div>
                <label className="text-[10px] font-bold text-neutral-500 mb-2 block uppercase tracking-widest">
                  Gas 策略
                </label>
                <div className="grid grid-cols-4 gap-1 mb-2">
                  {(["slow", "average", "fast", "custom"] as const).map((s) => (
                    <button
                      key={s}
                      onClick={() => setGasStrategy(s)}
                      className={`px-1 py-2 text-[10px] font-mono border transition-colors uppercase ${
                        gasStrategy === s
                          ? "bg-neutral-900 text-white border-neutral-900 dark:bg-white dark:text-black dark:border-white"
                          : "bg-white text-neutral-500 border-neutral-200 hover:border-neutral-300 dark:bg-neutral-900 dark:text-neutral-400 dark:border-neutral-800 dark:hover:border-neutral-700"
                      }`}
                    >
                      {s === "slow" ? "慢速" : s === "average" ? "标准" : s === "fast" ? "极速" : "自定义"}
                    </button>
                  ))}
                </div>
                
                {gasStrategy === "custom" ? (
                  <input
                    type="number"
                    placeholder="Gas Price (Gwei)"
                    value={customGasPrice}
                    onChange={(e) => setCustomGasPrice(e.target.value)}
                    className="w-full p-2 text-sm border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-900 focus:ring-1 focus:ring-brand outline-none font-mono"
                  />
                ) : (
                  <div className="text-[10px] text-neutral-400 font-mono flex justify-between">
                    <span>当前预估:</span>
                    <span>
                      {currentGasPrice > BigInt(0) 
                        ? `${ethers.formatUnits(
                            gasStrategy === "slow" ? (currentGasPrice * BigInt(90)) / BigInt(100) :
                            gasStrategy === "fast" ? (currentGasPrice * BigInt(120)) / BigInt(100) :
                            currentGasPrice, 
                            "gwei"
                          ).slice(0, 6)} Gwei`
                        : "获取中..."}
                    </span>
                  </div>
                )}
              </div>

              <div className="h-px bg-neutral-200 dark:bg-neutral-800" />

              {/* Token Config */}
              <div>
                <label className="text-[10px] font-bold text-neutral-500 mb-2 block uppercase tracking-widest">
                  代币设置
                </label>
                
                {/* Quick Select Token */}
                {chainId && CHAINS[chainId] && CHAINS[chainId].tokens.length > 0 && (
                  <div className="mb-2">
                    <select
                      className="w-full p-2 text-sm border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-900 focus:ring-1 focus:ring-brand outline-none font-mono"
                      onChange={(e) => {
                        const val = e.target.value;
                        if (val === "native") {
                          setTokenAddress("");
                          loadToken("native");
                        } else {
                          setTokenAddress(val);
                          loadToken(val);
                        }
                      }}
                      value={tokenAddress || "native"}
                    >
                      <option value="native">Native Token</option>
                      {CHAINS[chainId].tokens.map((t) => (
                        <option key={t.address} value={t.address}>
                          {t.symbol}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                <div className="flex gap-2 mb-2">
                   <input
                    type="text"
                    placeholder="代币合约地址 (空则为原生代币)"
                    value={tokenAddress}
                    onChange={(e) => setTokenAddress(e.target.value)}
                    className="flex-1 p-2 text-sm border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-900 focus:ring-1 focus:ring-brand outline-none font-mono"
                  />
                  <button
                    onClick={() => loadToken()}
                    disabled={isLoadingToken}
                    className="px-3 bg-neutral-100 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 hover:bg-neutral-200 dark:hover:bg-neutral-700 transition-colors"
                  >
                    {isLoadingToken ? <RefreshCw size={14} className="animate-spin" /> : <ArrowRightLeft size={14} />}
                  </button>
                </div>
                <div className="p-3 bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800">
                  <div className="flex justify-between text-xs font-mono">
                    <span className="text-neutral-500">符号:</span>
                    <span className="font-bold">{tokenInfo.symbol}</span>
                  </div>
                  <div className="flex justify-between text-xs font-mono mt-1">
                    <span className="text-neutral-500">精度:</span>
                    <span>{tokenInfo.decimals}</span>
                  </div>
                  <div className="flex justify-between text-xs font-mono mt-1">
                    <span className="text-neutral-500">类型:</span>
                    <span>{tokenInfo.address === "native" ? "原生代币" : "ERC20"}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Security Note */}
          <div className="p-4 bg-amber-50 dark:bg-amber-900/10 border border-amber-200 dark:border-amber-900/20 text-amber-800 dark:text-amber-200">
            <div className="flex items-start gap-2">
              <AlertCircle size={16} className="mt-0.5 shrink-0" />
              <div className="text-xs leading-relaxed">
                <span className="font-bold block mb-1">安全警告</span>
                批量归集需要输入私钥，请确保您在安全的环境下操作。本工具所有代码均在本地运行，不会上传您的私钥。建议使用后重置相关权限或转移资产。
              </div>
            </div>
          </div>
        </div>

        {/* Right Content: Operations */}
        <div className="lg:col-span-8 space-y-6">
          {/* Tabs */}
          <div className="flex border-b border-neutral-200 dark:border-neutral-800">
            <button
              onClick={() => setActiveTab("send")}
              className={clsx(
                "px-6 py-3 text-sm font-bold uppercase tracking-wider border-b-2 transition-colors",
                activeTab === "send"
                  ? "border-brand text-brand"
                  : "border-transparent text-neutral-500 hover:text-neutral-700 dark:hover:text-neutral-300"
              )}
            >
              批量发送
            </button>
            <button
              onClick={() => setActiveTab("collect")}
              className={clsx(
                "px-6 py-3 text-sm font-bold uppercase tracking-wider border-b-2 transition-colors",
                activeTab === "collect"
                  ? "border-brand text-brand"
                  : "border-transparent text-neutral-500 hover:text-neutral-700 dark:hover:text-neutral-300"
              )}
            >
              批量归集
            </button>
          </div>

          {/* Tab Content */}
          <div className="bg-white dark:bg-[#0a0a0a] border border-neutral-200 dark:border-neutral-800 min-h-[500px] flex flex-col">
            {activeTab === "send" ? (
              <div className="p-6 space-y-4 flex-1 flex flex-col">
                <div className="flex justify-between items-center">
                   <label className="text-xs font-bold uppercase tracking-widest text-neutral-500">接收地址与金额</label>
                   <span className="text-[10px] text-neutral-400 font-mono">格式: 地址,数量 (每行一个)</span>
                </div>
                <textarea
                  className="flex-1 w-full p-4 bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 resize-none outline-none font-mono text-xs leading-relaxed focus:ring-1 focus:ring-brand"
                  placeholder={`0x123...abc, 1.5\n0x456...def, 2.0`}
                  value={recipients}
                  onChange={(e) => setRecipients(e.target.value)}
                />
                <button
                  onClick={handleBatchSend}
                  disabled={isProcessing}
                  className={clsx(
                    "w-full py-3 flex items-center justify-center gap-2 text-xs font-bold uppercase tracking-wider text-white transition-all",
                    isProcessing ? "bg-neutral-400 cursor-wait" : "bg-brand hover:bg-brand/90"
                  )}
                >
                  {isProcessing ? <RefreshCw size={14} className="animate-spin" /> : <Send size={14} />}
                  开始发送
                </button>
              </div>
            ) : (
              <div className="p-6 space-y-4 flex-1 flex flex-col">
                <div>
                   <label className="text-xs font-bold uppercase tracking-widest text-neutral-500 mb-2 block">归集目标地址</label>
                   <input
                    type="text"
                    placeholder="接收所有资产的钱包地址"
                    value={collectTargetAddress}
                    onChange={(e) => setCollectTargetAddress(e.target.value)}
                    className="w-full p-3 text-sm border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-900 focus:ring-1 focus:ring-brand outline-none font-mono"
                  />
                </div>
                
                <div className="flex-1 flex flex-col">
                  <div className="flex justify-between items-center mb-2">
                     <label className="text-xs font-bold uppercase tracking-widest text-neutral-500">源钱包私钥</label>
                     <span className="text-[10px] text-neutral-400 font-mono">每行一个私钥</span>
                  </div>
                  
                  {/* Chain Selector */}
                  <div className="mb-2 flex flex-wrap gap-2">
                    {Object.entries(CHAINS).map(([id, config]) => (
                      <button
                        key={id}
                        onClick={() => {
                          const cId = Number(id);
                          setSelectedChains(prev => 
                            prev.includes(cId) ? prev.filter(c => c !== cId) : [...prev, cId]
                          );
                        }}
                        className={clsx(
                          "px-2 py-1 text-[10px] font-mono border transition-colors",
                          selectedChains.includes(Number(id))
                            ? "bg-neutral-900 text-white border-neutral-900 dark:bg-white dark:text-black dark:border-white"
                            : "bg-white text-neutral-500 border-neutral-200 hover:border-neutral-300 dark:bg-neutral-900 dark:text-neutral-400 dark:border-neutral-800"
                        )}
                      >
                        {config.name}
                      </button>
                    ))}
                  </div>

                  <textarea
                    className="flex-1 w-full p-4 bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 resize-none outline-none font-mono text-xs leading-relaxed focus:ring-1 focus:ring-brand"
                    placeholder="0x..."
                    value={privateKeys}
                    onChange={(e) => setPrivateKeys(e.target.value)}
                  />
                </div>

                {/* Scanned Results */}
                {scannedWallets.length > 0 && (
                  <div className="max-h-60 overflow-y-auto border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-900 p-2">
                    <table className="w-full text-[10px] font-mono">
                      <thead>
                        <tr className="text-left text-neutral-500 border-b border-neutral-200 dark:border-neutral-800">
                          <th className="pb-1 pl-2">地址</th>
                          <th className="pb-1">发现资产 (勾选以归集)</th>
                        </tr>
                      </thead>
                      <tbody>
                        {scannedWallets.map((w, idx) => (
                          <tr key={idx} className="border-b border-neutral-100 dark:border-neutral-800/50 last:border-0">
                            <td className="py-2 pl-2 align-top text-neutral-600 dark:text-neutral-400">
                                <div>{w.address.slice(0, 6)}...{w.address.slice(-4)}</div>
                                {w.address === "Invalid Key" && <span className="text-red-500">无效私钥</span>}
                            </td>
                            <td className="py-2 align-top">
                                {w.balances.length > 0 ? (
                                    <div className="space-y-1">
                                        {w.balances.map((b, bIdx) => (
                                            <div key={bIdx} className="flex items-center gap-2">
                                                <input 
                                                  type="checkbox" 
                                                  checked={b.selected}
                                                  onChange={() => {
                                                    setScannedWallets(prev => {
                                                      const newWallets = [...prev];
                                                      newWallets[idx].balances[bIdx].selected = !newWallets[idx].balances[bIdx].selected;
                                                      return newWallets;
                                                    });
                                                  }}
                                                  className="rounded border-neutral-300 text-brand focus:ring-brand"
                                                />
                                                <span className="px-1.5 py-0.5 rounded bg-neutral-200 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-300 font-bold">
                                                    {b.chainName}
                                                </span>
                                                <span className="text-green-600 dark:text-green-400 font-bold">
                                                    {parseFloat(b.amount).toFixed(4)} {b.symbol}
                                                </span>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <span className="text-neutral-400">无余额</span>
                                )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}

                <div className="flex gap-2 mt-4">
                  <button
                    onClick={handleScanBalances}
                    disabled={isScanning || isProcessing}
                    className={clsx(
                      "flex-1 py-3 flex items-center justify-center gap-2 text-xs font-bold uppercase tracking-wider border border-neutral-200 dark:border-neutral-800 hover:bg-neutral-50 dark:hover:bg-neutral-900 transition-all",
                      isScanning ? "cursor-wait opacity-50" : ""
                    )}
                  >
                    {isScanning ? <RefreshCw size={14} className="animate-spin" /> : <Zap size={14} />}
                    扫描余额
                  </button>
                  {scannedWallets.length > 0 && (
                    <button
                      onClick={exportScannedWallets}
                      className="px-4 py-3 flex items-center justify-center gap-2 text-xs font-bold uppercase tracking-wider border border-neutral-200 dark:border-neutral-800 hover:bg-neutral-50 dark:hover:bg-neutral-900 transition-all text-green-600"
                      title="导出扫描结果"
                    >
                      <Download size={14} />
                    </button>
                  )}
                  <button
                    onClick={handleBatchCollect}
                    disabled={isProcessing || isScanning}
                    className={clsx(
                      "flex-[2] py-3 flex items-center justify-center gap-2 text-xs font-bold uppercase tracking-wider text-white transition-all",
                      isProcessing ? "bg-neutral-400 cursor-wait" : "bg-brand hover:bg-brand/90"
                    )}
                  >
                    {isProcessing ? <RefreshCw size={14} className="animate-spin" /> : <Download size={14} />}
                    开始归集
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Logs Console */}
          <div className="bg-neutral-900 text-neutral-300 font-mono text-xs p-4 h-48 overflow-y-auto custom-scrollbar border border-neutral-800">
            <div className="flex justify-between items-center mb-2 border-b border-neutral-800 pb-2">
              <span className="font-bold uppercase tracking-widest text-neutral-500">运行日志</span>
              <div className="flex gap-2">
                <button onClick={exportLogs} className="text-neutral-500 hover:text-white" title="导出日志">
                  <Download size={12} />
                </button>
                <button onClick={() => setLogs([])} className="text-neutral-500 hover:text-white" title="清空日志">
                  <Trash2 size={12} />
                </button>
              </div>
            </div>
            <div className="space-y-1">
              {logs.length === 0 && <div className="text-neutral-600 italic">等待操作...</div>}
              {logs.map((log, i) => (
                <div key={i} className="flex gap-2">
                  <span className="text-neutral-600 shrink-0">[{log.timestamp}]</span>
                  <span className={clsx(
                    log.type === "error" ? "text-red-400" :
                    log.type === "success" ? "text-green-400" :
                    "text-neutral-300"
                  )}>
                    {log.message}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
