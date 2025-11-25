"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, Settings2, Wallet, Download, RefreshCw, Copy, CheckCircle2, AlertCircle } from "lucide-react";
import clsx from "clsx";
import * as XLSX from "xlsx";
import { ethers } from "ethers";
import { Keypair } from "@solana/web3.js";
import * as bitcoin from "bitcoinjs-lib";
import * as bip39 from "bip39";
import { ECPairFactory } from "ecpair";
import * as ecc from "@bitcoinerlab/secp256k1";
import BIP32Factory from "bip32";
import bs58 from "bs58";
import { ToolHeader } from "@/components/ToolHeader";

// Initialize bitcoinjs-lib with ECC library
bitcoin.initEccLib(ecc);

const ECPair = ECPairFactory(ecc);
const bip32 = BIP32Factory(ecc);

type GeneratedWallet = {
  index: number;
  address: string;
  privateKey: string;
  mnemonic: string;
};

export default function WalletGenerator() {
  const [count, setCount] = useState(10);
  const [isGenerating, setIsGenerating] = useState(false);
  const [wallets, setWallets] = useState<GeneratedWallet[]>([]);
  const [progress, setProgress] = useState(0);
  const [chainType, setChainType] = useState<"evm" | "solana" | "bitcoin">("evm");

  const generateWallets = async () => {
    setIsGenerating(true);
    setWallets([]);
    setProgress(0);

    // Use setTimeout to allow UI to update (avoid freezing)
    setTimeout(async () => {
      const newWallets: GeneratedWallet[] = [];
      const batchSize = 10; // Process in chunks to keep UI responsive
      
      for (let i = 0; i < count; i++) {
        if (chainType === "evm") {
          const wallet = ethers.Wallet.createRandom();
          newWallets.push({
            index: i + 1,
            address: wallet.address,
            privateKey: wallet.privateKey,
            mnemonic: wallet.mnemonic?.phrase || "",
          });
        } else if (chainType === "solana") {
          const mnemonic = bip39.generateMnemonic();
          const seed = bip39.mnemonicToSeedSync(mnemonic);
          const seed32 = seed.slice(0, 32);
          const keypair = Keypair.fromSeed(seed32);
          newWallets.push({
            index: i + 1,
            address: keypair.publicKey.toBase58(),
            privateKey: bs58.encode(keypair.secretKey),
            mnemonic: mnemonic,
          });
        } else if (chainType === "bitcoin") {
          const mnemonic = bip39.generateMnemonic();
          const seed = bip39.mnemonicToSeedSync(mnemonic);
          const root = bip32.fromSeed(seed);
          // m/84'/0'/0'/0/0 for Native Segwit (bc1)
          const path = "m/84'/0'/0'/0/0"; 
          const child = root.derivePath(path);
          const { address } = bitcoin.payments.p2wpkh({ 
            pubkey: child.publicKey,
            network: bitcoin.networks.bitcoin 
          });
          
          newWallets.push({
            index: i + 1,
            address: address || "",
            privateKey: child.toWIF(),
            mnemonic: mnemonic,
          });
        }
        
        // Update progress every batch or at the end
        if ((i + 1) % batchSize === 0 || i === count - 1) {
          setProgress(Math.round(((i + 1) / count) * 100));
          // Small delay to let React render
          await new Promise(resolve => setTimeout(resolve, 0));
        }
      }

      setWallets(newWallets);
      setIsGenerating(false);
    }, 100);
  };

  const handleExportExcel = () => {
    if (wallets.length === 0) return;

    const data = wallets.map(w => ({
      "序号": w.index,
      "地址 (Address)": w.address,
      "私钥 (Private Key)": w.privateKey,
      "助记词 (Mnemonic)": w.mnemonic
    }));

    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Wallets");
    XLSX.writeFile(wb, `wallets_${new Date().getTime()}.xlsx`);
  };

  return (
    <div className="w-full max-w-[1600px] mx-auto p-6">
      <ToolHeader
        title="Web3 批量钱包生成"
        description="批量生成多链钱包地址、私钥及助记词。完全本地离线运行，安全无忧。"
        icon={Wallet}
      />

      <div className="grid gap-8 lg:grid-cols-12 items-start">
        {/* Left Sidebar: Configuration */}
        <div className="lg:col-span-3 space-y-6">
          <div className="border border-neutral-200 dark:border-neutral-800 p-5 bg-white dark:bg-[#0a0a0a]">
            <h2 className="text-xs font-bold text-neutral-900 dark:text-white mb-6 flex items-center gap-2 uppercase tracking-widest">
              <Settings2 size={14} className="text-brand" />
              生成配置
            </h2>

            <div className="space-y-6">
              {/* Chain Selection */}
              <div>
                <label className="text-[10px] font-bold text-neutral-500 mb-2 block uppercase tracking-widest">
                  区块链网络
                </label>
                <div className="grid gap-2">
                  <button
                    onClick={() => setChainType("evm")}
                    className={clsx(
                      "flex items-center gap-3 px-3 py-2 text-xs font-medium border transition-all text-left",
                      chainType === "evm"
                        ? "bg-brand text-white border-brand"
                        : "bg-transparent border-neutral-200 text-neutral-600 hover:border-neutral-400 dark:border-neutral-800 dark:text-neutral-400"
                    )}
                  >
                    <div className="w-2 h-2 rounded-full bg-current" />
                    EVM 兼容链 (ETH/BSC/Polygon...)
                  </button>
                  <button
                    onClick={() => setChainType("solana")}
                    className={clsx(
                      "flex items-center gap-3 px-3 py-2 text-xs font-medium border transition-all text-left",
                      chainType === "solana"
                        ? "bg-brand text-white border-brand"
                        : "bg-transparent border-neutral-200 text-neutral-600 hover:border-neutral-400 dark:border-neutral-800 dark:text-neutral-400"
                    )}
                  >
                    <div className="w-2 h-2 rounded-full bg-[#14F195]" />
                    Solana (SOL)
                  </button>
                  <button
                    onClick={() => setChainType("bitcoin")}
                    className={clsx(
                      "flex items-center gap-3 px-3 py-2 text-xs font-medium border transition-all text-left",
                      chainType === "bitcoin"
                        ? "bg-brand text-white border-brand"
                        : "bg-transparent border-neutral-200 text-neutral-600 hover:border-neutral-400 dark:border-neutral-800 dark:text-neutral-400"
                    )}
                  >
                    <div className="w-2 h-2 rounded-full bg-[#F7931A]" />
                    Bitcoin (BTC - Segwit)
                  </button>
                </div>
              </div>

              {/* Count Selection */}
              <div>
                <label className="text-[10px] font-bold text-neutral-500 mb-2 block uppercase tracking-widest">
                  生成数量
                </label>
                <input
                  type="number"
                  min="1"
                  max="1000"
                  value={count}
                  onChange={(e) => setCount(Math.min(1000, Math.max(1, parseInt(e.target.value) || 1)))}
                  className="w-full p-2 text-sm border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-900 focus:ring-1 focus:ring-brand outline-none transition-all font-mono"
                />
                <p className="text-[10px] text-neutral-400 mt-2">建议单次不超过 1000 个以保持浏览器流畅。</p>
              </div>

              {/* Action Button */}
              <button
                onClick={generateWallets}
                disabled={isGenerating}
                className={clsx(
                  "w-full py-3 flex items-center justify-center gap-2 text-xs font-bold uppercase tracking-wider text-white transition-all",
                  isGenerating ? "bg-neutral-400 cursor-wait" : "bg-brand hover:bg-brand/90"
                )}
              >
                {isGenerating ? (
                  <>
                    <RefreshCw size={14} className="animate-spin" />
                    生成中 {progress}%
                  </>
                ) : (
                  <>
                    <Wallet size={14} />
                    开始生成
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Security Note */}
          <div className="p-4 bg-amber-50 dark:bg-amber-900/10 border border-amber-200 dark:border-amber-900/20 text-amber-800 dark:text-amber-200">
            <div className="flex items-start gap-2">
              <AlertCircle size={16} className="mt-0.5 shrink-0" />
              <div className="text-xs leading-relaxed">
                <span className="font-bold block mb-1">安全提示</span>
                所有私钥和助记词均在您的浏览器本地生成，不会上传到任何服务器。建议在断网环境下使用，生成后请妥善保管。
              </div>
            </div>
          </div>
        </div>

        {/* Right Content: Results */}
        <div className="lg:col-span-9 space-y-6">
          <div className="flex flex-col bg-white dark:bg-[#0a0a0a] border border-neutral-200 dark:border-neutral-800 min-h-[600px]">
            <div className="px-4 py-3 border-b border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-900 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <label className="text-xs font-bold uppercase tracking-widest text-neutral-900 dark:text-white">
                  生成结果
                </label>
                {wallets.length > 0 && (
                  <span className="text-xs font-mono text-neutral-500 bg-neutral-200 dark:bg-neutral-800 px-2 py-0.5 rounded">
                    {wallets.length} 个钱包
                  </span>
                )}
              </div>
              
              {wallets.length > 0 && (
                <button
                  onClick={handleExportExcel}
                  className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-brand hover:text-brand/80 transition-colors"
                >
                  <Download size={14} />
                  导出 Excel
                </button>
              )}
            </div>

            <div className="flex-1 overflow-auto custom-scrollbar p-0">
              {wallets.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-neutral-400 space-y-4">
                  <div className="w-16 h-16 rounded-full bg-neutral-100 dark:bg-neutral-900 flex items-center justify-center">
                    <Wallet size={32} className="text-neutral-300 dark:text-neutral-700" />
                  </div>
                  <p className="text-sm font-mono">点击左侧“开始生成”按钮</p>
                </div>
              ) : (
                <div className="w-full">
                  <table className="w-full text-left border-collapse">
                    <thead className="bg-neutral-50 dark:bg-neutral-900 sticky top-0 z-10">
                      <tr>
                        <th className="p-3 text-[10px] font-bold uppercase tracking-widest text-neutral-500 border-b border-neutral-200 dark:border-neutral-800 w-16 text-center">#</th>
                        <th className="p-3 text-[10px] font-bold uppercase tracking-widest text-neutral-500 border-b border-neutral-200 dark:border-neutral-800">地址 (Address)</th>
                        <th className="p-3 text-[10px] font-bold uppercase tracking-widest text-neutral-500 border-b border-neutral-200 dark:border-neutral-800">私钥 (Private Key)</th>
                        <th className="p-3 text-[10px] font-bold uppercase tracking-widest text-neutral-500 border-b border-neutral-200 dark:border-neutral-800">助记词 (Mnemonic)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-neutral-100 dark:divide-neutral-800/50">
                      {wallets.map((wallet) => (
                        <tr key={wallet.index} className="hover:bg-neutral-50 dark:hover:bg-neutral-900/50 transition-colors group">
                          <td className="p-3 text-xs font-mono text-neutral-400 text-center">{wallet.index}</td>
                          <td className="p-3 text-xs font-mono text-neutral-900 dark:text-neutral-200 select-all">
                            {wallet.address}
                          </td>
                          <td className="p-3 text-xs font-mono text-neutral-600 dark:text-neutral-400 select-all break-all max-w-[200px]">
                            <div className="truncate group-hover:whitespace-normal group-hover:break-all transition-all">
                              {wallet.privateKey}
                            </div>
                          </td>
                          <td className="p-3 text-xs font-mono text-neutral-600 dark:text-neutral-400 select-all break-all max-w-[300px]">
                            <div className="truncate group-hover:whitespace-normal group-hover:break-all transition-all">
                              {wallet.mnemonic}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
