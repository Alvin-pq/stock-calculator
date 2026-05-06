'use client';
import { useState } from 'react';

export default function StockCalculator() {
  const [price, setPrice] = useState(100);
  const [shares, setShares] = useState(1000);
  const [netIncome, setNetIncome] = useState(5000);
  const [equity, setEquity] = useState(20000);
  const [histPe, setHistPe] = useState(15); // 新增：歷史平均本益比

  // 避免除以零的保護機制
  const safeDiv = (num: number, denom: number) => (denom === 0 ? 0 : num / denom);

  // 核心計算
  const eps = safeDiv(netIncome, shares);
  const pe = safeDiv(price, eps);
  const bvps = safeDiv(equity, shares);
  const pb = safeDiv(price, bvps);
  const roe = safeDiv(netIncome, equity) * 100;
  
  // 合理股價計算 (本益比估價法)
  const reasonablePrice = eps * histPe;
  const isUndervalued = price < reasonablePrice;

  return (
    <div className="min-h-screen bg-gray-100 p-4 font-sans text-gray-800">
      <div className="max-w-md mx-auto bg-white rounded-xl shadow-lg overflow-hidden md:max-w-2xl border border-gray-200">
        <div className="p-6">
          <h1 className="text-2xl font-bold text-center text-slate-800 mb-6">股票基本面與估值計算機</h1>
          
          {/* 輸入區 */}
          <div className="bg-slate-50 p-4 rounded-lg mb-6 border border-slate-200">
            <h2 className="text-lg font-bold text-slate-700 mb-4 border-b pb-2">Step 1: 輸入財務數據</h2>
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-semibold text-gray-700">目前股價 (元)</label>
                <input type="number" value={price} onChange={e => setPrice(Number(e.target.value))} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 p-2 border" />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700">發行股數 (股)</label>
                <input type="number" value={shares} onChange={e => setShares(Number(e.target.value))} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 p-2 border" />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700">稅後淨利 (元)</label>
                <input type="number" value={netIncome} onChange={e => setNetIncome(Number(e.target.value))} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 p-2 border" />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700">股東權益總額 (淨資產, 元)</label>
                <input type="number" value={equity} onChange={e => setEquity(Number(e.target.value))} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 p-2 border" />
              </div>
              <div className="pt-2">
                <label className="block text-sm font-semibold text-indigo-700">該公司歷史平均本益比 (倍)</label>
                <p className="text-xs text-gray-500 mb-1">用於推算合理股價，大盤長期平均約為 15 倍。</p>
                <input type="number" value={histPe} onChange={e => setHistPe(Number(e.target.value))} className="mt-1 block w-full rounded-md border-indigo-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 p-2 border bg-indigo-50" />
              </div>
            </div>
          </div>

          {/* 估值結果區 */}
          <div className="bg-indigo-600 p-5 rounded-lg mb-6 shadow-inner text-white">
            <h2 className="text-lg font-bold mb-2">合理股價估值 (本益比法)</h2>
            <div className="flex items-end gap-2 mb-2">
              <span className="text-3xl font-extrabold">{reasonablePrice.toFixed(2)}</span>
              <span className="text-indigo-100 mb-1">元</span>
            </div>
            <p className="text-sm text-indigo-100 mb-3">計算邏輯：每股盈餘 (EPS) × 歷史平均本益比</p>
            <div className={`p-3 rounded-md font-bold text-sm ${isUndervalued ? 'bg-green-500 text-white' : 'bg-red-400 text-white'}`}>
              📍 估值判定：目前股價 ({price}) {isUndervalued ? '低於' : '高於'}合理價。
              {isUndervalued ? ' 具備潛在安全邊際。' : ' 股價可能已偏貴或反映未來高成長。'}
            </div>
          </div>

          {/* 核心指標解析區 */}
          <h2 className="text-lg font-bold text-slate-700 mb-4 border-b pb-2">Step 2: 核心基本面診斷</h2>
          <div className="space-y-4">
            
            {/* EPS */}
            <div className="p-4 rounded-lg border border-gray-200 bg-white shadow-sm">
              <div className="flex justify-between items-center mb-2">
                <h3 className="font-bold text-gray-800 text-lg">每股盈餘 (EPS)</h3>
                <span className="bg-gray-100 text-gray-800 py-1 px-2 rounded font-mono font-bold">{eps.toFixed(2)} 元</span>
              </div>
              <ul className="text-sm text-gray-600 space-y-1 list-disc pl-4">
                <li><span className="font-semibold text-gray-700">計算邏輯：</span>稅後淨利 ÷ 發行股數</li>
                <li><span className="font-semibold text-gray-700">白話解析：</span>公司發行的每一股，替股東賺了多少錢。</li>
                <li><span className="font-semibold text-gray-700">客觀判定：</span>絕對數值必須為正。應比對該公司過去 3-5 年數據，確認是否具備穩定成長趨勢。</li>
              </ul>
            </div>

            {/* P/E */}
            <div className="p-4 rounded-lg border border-gray-200 bg-white shadow-sm">
              <div className="flex justify-between items-center mb-2">
                <h3 className="font-bold text-gray-800 text-lg">本益比 (P/E)</h3>
                <span className="bg-gray-100 text-gray-800 py-1 px-2 rounded font-mono font-bold">{pe.toFixed(2)} 倍</span>
              </div>
              <ul className="text-sm text-gray-600 space-y-1 list-disc pl-4">
                <li><span className="font-semibold text-gray-700">計算邏輯：</span>目前股價 ÷ EPS</li>
                <li><span className="font-semibold text-gray-700">白話解析：</span>假設獲利能力不變，投資人買進後需要多少年才能回本。</li>
                <li><span className="font-semibold text-gray-700">客觀判定：</span>通常大於 20 倍視為昂貴（或具備高成長動能），小於 10 倍視為便宜。須與同產業平均做交叉比對。</li>
              </ul>
            </div>

            {/* ROE */}
            <div className="p-4 rounded-lg border border-gray-200 bg-white shadow-sm">
              <div className="flex justify-between items-center mb-2">
                <h3 className="font-bold text-gray-800 text-lg">股東權益報酬率 (ROE)</h3>
                <span className={`py-1 px-2 rounded font-mono font-bold ${roe >= 15 ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                  {roe.toFixed(2)}%
                </span>
              </div>
              <ul className="text-sm text-gray-600 space-y-1 list-disc pl-4">
                <li><span className="font-semibold text-gray-700">計算邏輯：</span>(稅後淨利 ÷ 股東權益總額) × 100%</li>
                <li><span className="font-semibold text-gray-700">白話解析：</span>管理階層利用股東資金創造獲利的效率（投資報酬率）。</li>
                <li><span className="font-semibold text-gray-700">客觀判定：</span>一般標準要求長期大於 10%。國內外法人機構通常將 ROE > 15% 視為優質企業指標。</li>
              </ul>
            </div>

            {/* P/B */}
            <div className="p-4 rounded-lg border border-gray-200 bg-white shadow-sm">
              <div className="flex justify-between items-center mb-2">
                <h3 className="font-bold text-gray-800 text-lg">股價淨值比 (P/B)</h3>
                <span className={`py-1 px-2 rounded font-mono font-bold ${pb < 1 ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                  {pb.toFixed(2)} 倍
                </span>
              </div>
              <ul className="text-sm text-gray-600 space-y-1 list-disc pl-4">
                <li><span className="font-semibold text-gray-700">計算邏輯：</span>目前股價 ÷ (股東權益總額 ÷ 發行股數)</li>
                <li><span className="font-semibold text-gray-700">白話解析：</span>股價相對於公司帳面上實際資產價值的溢價倍數。</li>
                <li><span className="font-semibold text-gray-700">客觀判定：</span>若小於 1 倍，代表市場報價低於公司清算價值，具備潛在低估可能（常用於評估金融股與景氣循環股）。</li>
              </ul>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}
