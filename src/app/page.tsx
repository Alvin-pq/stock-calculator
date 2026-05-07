'use client';
import { useState } from 'react';

export default function StockCalculator() {
  const [stockId, setStockId] = useState('2330');
  const [isLoading, setIsLoading] = useState(false);
  
  // 將原本龐大的淨利、股數，改為直接針對「每股」的財報數據，更符合 API 抓取邏輯
  const [price, setPrice] = useState(100);
  const [eps, setEps] = useState(5.0); // 近四季累計 EPS (TTM)
  const [bvps, setBvps] = useState(20.0); // 每股淨值
  const [roe, setRoe] = useState(15.0); // 股東權益報酬率
  const [histPe, setHistPe] = useState(15); // 歷史平均本益比

  // 一鍵抓取所有數據
  const fetchAllData = async () => {
    if (!stockId) {
      alert('請先輸入股票代號');
      return;
    }
    
    setIsLoading(true);
    try {
      // 1. 設定時間範圍
      const today = new Date();
      
      // 抓市價用的日期 (近 14 天)
      const past14Days = new Date();
      past14Days.setDate(today.getDate() - 14);
      
      // 抓歷史本益比的日期 (近 3 年，約 1000 天)
      const past3Years = new Date();
      past3Years.setFullYear(today.getFullYear() - 3);

      const date14Str = past14Days.toISOString().split('T')[0];
      const date3YrStr = past3Years.toISOString().split('T')[0];

      // ====== A. 抓取最新收盤價 ======
      const priceRes = await fetch(`https://api.finmindtrade.com/api/v4/data?dataset=TaiwanStockPrice&data_id=${stockId}&start_date=${date14Str}`);
      const priceResult = await priceRes.json();
      
      if (priceResult.msg === 'success' && priceResult.data.length > 0) {
        const latestPrice = priceResult.data[priceResult.data.length - 1].close;
        setPrice(latestPrice);
      } else {
        throw new Error('找不到股價資料');
      }

      // ====== B. 抓取歷史本益比並計算「三年平均」 ======
      // 註：FinMind 的 TaiwanStockPER 包含每日的本益比
      const perRes = await fetch(`https://api.finmindtrade.com/api/v4/data?dataset=TaiwanStockPER&data_id=${stockId}&start_date=${date3YrStr}`);
      const perResult = await perRes.json();
      
      if (perResult.msg === 'success' && perResult.data.length > 0) {
        // 過濾掉 P/E 為 0 或負數的異常極端值
        const validPEs = perResult.data.map((d: any) => d.PER).filter((pe: number) => pe > 0 && pe < 100);
        
        if (validPEs.length > 0) {
          // 計算算術平均數
          const sumPE = validPEs.reduce((a: number, b: number) => a + b, 0);
          const avgPE = sumPE / validPEs.length;
          setHistPe(Number(avgPE.toFixed(2)));
        }
      }

      /* * ====== C. 抓取財報 EPS (進階概念) ======
       * 實務上，這裡會呼叫 TaiwanStockFinancialStatements。
       * 但因為財報 API 的會計科目非常龐雜（包含季報、年報、單季、累計），
       * 且 FinMind 免費版對複雜財報的存取有時較不穩定，
       * 此處先保留前端輸入欄位，讓你了解架構。未來可擴充自動相加近四季 EPS 的邏輯。
       */

      alert(`✅ 成功載入 ${stockId} 數據！\n已自動結算過去三年的「歷史平均本益比」。\n（註：財報 EPS 與淨值請核對最新季報後輸入以保證精確）`);

    } catch (error) {
      console.error('API 呼叫失敗:', error);
      alert('⚠️ 抓取資料發生錯誤，請確認股票代號是否正確，或稍後再試。');
    } finally {
      setIsLoading(false);
    }
  };

  // 核心計算
  const pe = price / (eps || 1);
  const pb = price / (bvps || 1);
  
  // 合理股價計算 (本益比估價法)
  const reasonablePrice = eps * histPe;
  const isUndervalued = price < reasonablePrice;

  return (
    <div className="min-h-screen bg-slate-50 p-4 font-sans text-slate-800 pb-12">
      <div className="max-w-md mx-auto bg-white rounded-2xl shadow-xl overflow-hidden md:max-w-2xl border border-slate-100">
        <div className="p-6">
          <h1 className="text-2xl font-black text-center text-slate-800 mb-6 tracking-tight">股票基本面與估值系統</h1>
          
          {/* 一鍵抓取區 */}
          <div className="bg-blue-50 p-5 rounded-xl mb-6 border border-blue-200 shadow-sm">
            <h2 className="text-lg font-bold text-blue-900 mb-3 flex items-center gap-2">
              <span>📡</span> 雲端數據中心 (FinMind API)
            </h2>
            <div className="flex gap-2">
              <input 
                type="text" 
                value={stockId} 
                onChange={e => setStockId(e.target.value)} 
                placeholder="輸入台股代號 (例: 2330)"
                className="block w-full rounded-lg border-blue-300 shadow-sm focus:border-blue-600 focus:ring-blue-600 p-2.5 border font-bold text-blue-900" 
              />
              <button 
                onClick={fetchAllData}
                disabled={isLoading}
                className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2.5 px-4 rounded-lg shadow transition-colors disabled:bg-blue-400 whitespace-nowrap"
              >
                {isLoading ? '運算中...' : '一鍵全自動抓取'}
              </button>
            </div>
            <p className="text-xs text-blue-700 mt-2 font-medium">自動載入最新市價，並精算過去 3 年歷史常態本益比。</p>
          </div>

          {/* 輸入與確認區 */}
          <div className="bg-slate-100 p-5 rounded-xl mb-6 border border-slate-200 shadow-inner">
            <h2 className="text-lg font-bold text-slate-700 mb-4 border-b border-slate-300 pb-2">Step 1: 確認財報與估值數據</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1">目前股價 (市價, 元)</label>
                <input type="number" value={price} onChange={e => setPrice(Number(e.target.value))} className="block w-full rounded-lg border-slate-300 p-2.5 border bg-white" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1">近四季 EPS (元)</label>
                  <input type="number" value={eps} onChange={e => setEps(Number(e.target.value))} className="block w-full rounded-lg border-slate-300 p-2.5 border" />
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1">每股淨值 (元)</label>
                  <input type="number" value={bvps} onChange={e => setBvps(Number(e.target.value))} className="block w-full rounded-lg border-slate-300 p-2.5 border" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1">股東權益報酬率 ROE (%)</label>
                <input type="number" value={roe} onChange={e => setRoe(Number(e.target.value))} className="block w-full rounded-lg border-slate-300 p-2.5 border" />
              </div>
              <div className="pt-2">
                <label className="block text-sm font-bold text-indigo-800 mb-1">該企業歷史常態本益比 (近三年平均)</label>
                <input type="number" value={histPe} onChange={e => setHistPe(Number(e.target.value))} className="block w-full rounded-lg border-indigo-300 p-2.5 border bg-indigo-50 font-bold text-indigo-900" />
              </div>
            </div>
          </div>

          {/* 估值結果區 */}
          <div className="bg-gradient-to-br from-indigo-600 to-blue-700 p-5 rounded-xl mb-6 shadow-md text-white">
            <h2 className="text-lg font-bold mb-2 flex items-center gap-2">
              <span>🎯</span> 合理股價估值 (本益比法)
            </h2>
            <div className="flex items-end gap-2 mb-3">
              <span className="text-4xl font-black tracking-tight">{reasonablePrice.toFixed(2)}</span>
              <span className="text-indigo-100 mb-1 font-medium">元</span>
            </div>
            
            <div className="bg-black/20 p-3 rounded-lg text-sm space-y-1 backdrop-blur-sm">
              <p><span className="font-bold text-indigo-200">計算公式：</span>近四季 EPS × 歷史三年常態本益比</p>
            </div>

            <div className={`mt-4 p-3 rounded-lg font-bold text-sm text-center shadow-inner ${isUndervalued ? 'bg-green-500 text-white' : 'bg-red-500 text-white'}`}>
              📍 診斷：目前市價 ({price}) {isUndervalued ? '低於' : '高於'}推算的合理價。
            </div>
          </div>

          {/* 核心指標卡片 */}
          <h2 className="text-lg font-bold text-slate-700 mb-4 border-b border-slate-300 pb-2">Step 2: 目前估值位階</h2>
          <div className="grid grid-cols-2 gap-4">
            <div className="p-4 rounded-xl border border-slate-200 bg-white shadow-sm">
              <h3 className="font-bold text-slate-600 text-sm mb-1">當前本益比 (P/E)</h3>
              <div className="text-2xl font-black text-slate-800">{pe.toFixed(2)} 倍</div>
            </div>
            <div className="p-4 rounded-xl border border-slate-200 bg-white shadow-sm">
              <h3 className="font-bold text-slate-600 text-sm mb-1">當前股價淨值比 (P/B)</h3>
              <div className="text-2xl font-black text-slate-800">{pb.toFixed(2)} 倍</div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
