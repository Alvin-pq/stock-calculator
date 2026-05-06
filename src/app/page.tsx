'use client';
import { useState } from 'react';

export default function StockCalculator() {
  const [price, setPrice] = useState(100);
  const [shares, setShares] = useState(1000);
  const [netIncome, setNetIncome] = useState(5000);
  const [equity, setEquity] = useState(20000);

  // 避免除以零的保護機制
  const safeDiv = (num: number, denom: number) => (denom === 0 ? 0 : num / denom);

  const eps = safeDiv(netIncome, shares);
  const pe = safeDiv(price, eps);
  const bvps = safeDiv(equity, shares);
  const pb = safeDiv(price, bvps);
  const roe = safeDiv(netIncome, equity) * 100;

  return (
    <div className="min-h-screen bg-gray-50 p-4 font-sans text-gray-800">
      <div className="max-w-md mx-auto bg-white rounded-xl shadow-md overflow-hidden md:max-w-2xl border border-gray-100">
        <div className="p-6">
          <h1 className="text-2xl font-bold text-center text-blue-800 mb-6">股票基本面計算機</h1>
          
          {/* 輸入區 */}
          <div className="space-y-4 mb-8">
            <div>
              <label className="block text-sm font-medium text-gray-700">股價 (元)</label>
              <input type="number" value={price} onChange={e => setPrice(Number(e.target.value))} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 p-2 border" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">發行股數 (股)</label>
              <input type="number" value={shares} onChange={e => setShares(Number(e.target.value))} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 p-2 border" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">稅後淨利 (元)</label>
              <input type="number" value={netIncome} onChange={e => setNetIncome(Number(e.target.value))} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 p-2 border" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">股東權益總額 (元)</label>
              <input type="number" value={equity} onChange={e => setEquity(Number(e.target.value))} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 p-2 border" />
            </div>
          </div>

          <hr className="my-6 border-gray-200" />

          {/* 解析區 */}
          <h2 className="text-xl font-bold text-gray-800 mb-4">分析結果與教學</h2>
          <div className="space-y-4">
            
            {/* EPS 卡片 */}
            <div className="bg-blue-50 p-4 rounded-lg border border-blue-100">
              <h3 className="font-bold text-blue-800">1. 每股盈餘 (EPS): {eps.toFixed(2)} 元</h3>
              <p className="text-sm text-gray-600 mt-1">計算：{netIncome} ÷ {shares} = {eps.toFixed(2)}</p>
              <p className="text-sm text-gray-700 mt-2">📍 意義：公司為每一股賺取的淨利。數值越高，代表獲利能力越強。</p>
            </div>

            {/* P/E 卡片 */}
            <div className="bg-green-50 p-4 rounded-lg border border-green-100">
              <h3 className="font-bold text-green-800">2. 本益比 (P/E): {pe.toFixed(2)} 倍</h3>
              <p className="text-sm text-gray-600 mt-1">計算：{price} ÷ {eps.toFixed(2)} = {pe.toFixed(2)}</p>
              <p className="text-sm text-gray-700 mt-2">
                📍 診斷：{pe > 20 ? '大於 20 倍，股價可能遭高估，或市場預期極高成長。' : pe < 10 ? '小於 10 倍，股價可能遭低估。' : '落在合理區間，請比對歷史平均。'}
              </p>
            </div>

            {/* ROE 卡片 */}
            <div className="bg-purple-50 p-4 rounded-lg border border-purple-100">
              <h3 className="font-bold text-purple-800">3. 股東權益報酬率 (ROE): {roe.toFixed(2)}%</h3>
              <p className="text-sm text-gray-600 mt-1">計算：({netIncome} ÷ {equity}) × 100 = {roe.toFixed(2)}%</p>
              <p className="text-sm text-gray-700 mt-2">
                📍 診斷：{roe >= 10 ? '大於 10%，資金運用效率達標，表現良好。' : '小於 10%，資金運用效率偏低，需留意。'}
              </p>
            </div>

            {/* P/B 卡片 */}
            <div className="bg-orange-50 p-4 rounded-lg border border-orange-100">
              <h3 className="font-bold text-orange-800">4. 股價淨值比 (P/B): {pb.toFixed(2)} 倍</h3>
              <p className="text-sm text-gray-600 mt-1">計算：{price} ÷ ({equity} ÷ {shares}) = {pb.toFixed(2)}</p>
              <p className="text-sm text-gray-700 mt-2">
                📍 診斷：{pb < 1 ? '小於 1 倍，股價低於帳面價值，具潛在低估空間。' : '大於 1 倍，市場給予溢價。'}
              </p>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}
