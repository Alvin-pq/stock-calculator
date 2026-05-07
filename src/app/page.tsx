'use client';
import { useState } from 'react';

export default function StockCalculator() {
  const [stockId, setStockId] = useState('2330'); // 新增：股票代號
  const [isLoading, setIsLoading] = useState(false); // 新增：載入狀態
  
  const [price, setPrice] = useState(100);
  const [shares, setShares] = useState(1000);
  const [netIncome, setNetIncome] = useState(5000);
  const [equity, setEquity] = useState(20000);
  const [histPe, setHistPe] = useState(15);

  // 串接 FinMind API 獲取最新收盤價
  const fetchLatestPrice = async () => {
    if (!stockId) {
      alert('請先輸入股票代號');
      return;
    }
    
    setIsLoading(true);
    try {
      // 設定抓取時間範圍：往前推算 14 天，確保一定能跨越週末或連假抓到最近一個交易日
      const today = new Date();
      const pastDate = new Date();
      pastDate.setDate(today.getDate() - 14);
      const dateString = pastDate.toISOString().split('T')[0];

      // 呼叫 FinMind 開源 API (免金鑰可獲取基礎股價)
      const response = await fetch(`https://api.finmindtrade.com/api/v4/data?dataset=TaiwanStockPrice&data_id=${stockId}&start_date=${dateString}`);
      const result = await response.json();

      if (result.msg === 'success' && result.data.length > 0) {
        // 取得陣列中最後一筆資料（即最新交易日）
        const latestData = result.data[result.data.length - 1];
        setPrice(latestData.close);
        alert(`✅ 成功載入 ${stockId} 最新收盤價：${latestData.close} 元\n(交易日期: ${latestData.date})`);
      } else {
        alert('❌ 找不到該股票代號的報價，請確認代號是否正確。');
      }
    } catch (error) {
      console.error('API 呼叫失敗:', error);
      alert('⚠️ 網路連線或 API 伺服器異常，請稍後再試。');
    } finally {
      setIsLoading(false);
    }
  };

  // 避免除以零的保護機制
  const safeDiv = (num: number, denom: number) => (denom === 0 ? 0 : num / denom);

  // 核心計算
  const eps = safeDiv(netIncome, shares);
  const pe = safeDiv(price, eps);
  const bvps = safeDiv(equity, shares);
  const pb = safeDiv(price, bvps);
  const roe = safeDiv(netIncome, equity) * 100;
  
  // 合理股價計算
  const reasonablePrice = eps * histPe;
  const isUndervalued = price < reasonablePrice;

  return (
    <div className="min-h-screen bg-slate-50 p-4 font-sans text-slate-800 pb-12">
      <div className="max-w-md mx-auto bg-white rounded-2xl shadow-xl overflow-hidden md:max-w-2xl border border-slate-100">
        <div className="p-6">
          <h1 className="text-2xl font-black text-center text-slate-800 mb-6 tracking-tight">股票基本面與估值系統</h1>
          
          {/* 【新增】FinMind 自動報價區 */}
          <div className="bg-blue-50 p-5 rounded-xl mb-6 border border-blue-200 shadow-sm">
            <h2 className="text-lg font-bold text-blue-900 mb-3 flex items-center gap-2">
              <span>📡</span> 雲端即時抓價 (FinMind API)
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
                onClick={fetchLatestPrice}
                disabled={isLoading}
                className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2.5 px-4 rounded-lg shadow transition-colors disabled:bg-blue-400 whitespace-nowrap"
              >
                {isLoading ? '載入中...' : '抓取市價'}
              </button>
            </div>
            <p className="text-xs text-blue-700 mt-2 font-medium">使用開源資料庫，自動獲取最近一日收盤價。</p>
          </div>

          {/* 輸入區 */}
          <div className="bg-slate-100 p-5 rounded-xl mb-6 border border-slate-200 shadow-inner">
            <h2 className="text-lg font-bold text-slate-700 mb-4 border-b border-slate-300 pb-2">Step 1: 確認與輸入財報數據</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1">目前股價 (市價, 元) <span className="text-blue-600 text-xs font-normal ml-2">*(可由上方自動抓取)*</span></label>
                <input type="number" value={price} onChange={e => setPrice(Number(e.target.value))} className="block w-full rounded-lg border-slate-300 shadow-sm focus:border-blue-600 focus:ring-blue-600 p-2.5 border bg-white" />
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1">發行股數 (股)</label>
                <input type="number" value={shares} onChange={e => setShares(Number(e.target.value))} className="block w-full rounded-lg border-slate-300 shadow-sm focus:border-blue-600 focus:ring-blue-600 p-2.5 border" />
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1">稅後淨利 (元)</label>
                <input type="number" value={netIncome} onChange={e => setNetIncome(Number(e.target.value))} className="block w-full rounded-lg border-slate-300 shadow-sm focus:border-blue-600 focus:ring-blue-600 p-2.5 border" />
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1">股東權益總額 (淨資產, 元)</label>
                <input type="number" value={equity} onChange={e => setEquity(Number(e.target.value))} className="block w-full rounded-lg border-slate-300 shadow-sm focus:border-blue-600 focus:ring-blue-600 p-2.5 border" />
              </div>
              <div className="pt-2">
                <label className="block text-sm font-bold text-indigo-800 mb-1">該企業歷史常態本益比 (倍)</label>
                <p className="text-xs text-slate-500 mb-2">用於推算合理股價，大盤長期平均約為 15 倍。</p>
                <input type="number" value={histPe} onChange={e => setHistPe(Number(e.target.value))} className="block w-full rounded-lg border-indigo-300 shadow-sm focus:border-indigo-600 focus:ring-indigo-600 p-2.5 border bg-indigo-50 font-bold text-indigo-900" />
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
              <p><span className="font-bold text-indigo-200">計算：</span>EPS × 歷史常態本益比</p>
              <p><span className="font-bold text-indigo-200">定義：</span>結合常態評價與當前獲利推算的理論中值價格。</p>
              <p><span className="font-bold text-indigo-200">限制：</span>市價低於合理價時產生「安全邊際」，提供下檔風險緩衝。</p>
            </div>

            <div className={`mt-4 p-3 rounded-lg font-bold text-sm text-center shadow-inner ${isUndervalued ? 'bg-green-500 text-white' : 'bg-red-500 text-white'}`}>
              📍 診斷：目前市價 ({price}) {isUndervalued ? '低於' : '高於'}合理價。
            </div>
          </div>

          {/* 核心指標解析區 */}
          <h2 className="text-lg font-bold text-slate-700 mb-4 border-b border-slate-300 pb-2">Step 2: 核心基本面診斷與定義</h2>
          <div className="space-y-4">
            
            {/* EPS */}
            <div className="p-5 rounded-xl border border-slate-200 bg-white shadow-sm hover:shadow-md transition-shadow">
              <div className="flex justify-between items-center mb-3">
                <h3 className="font-black text-slate-800 text-lg">每股盈餘 (EPS)</h3>
                <span className="bg-slate-100 text-slate-800 py-1.5 px-3 rounded-md font-mono font-bold text-lg">{eps.toFixed(2)} 元</span>
              </div>
              <div className="bg-slate-50 p-3 rounded-lg text-sm text-slate-600 space-y-2 border border-slate-100">
                <p><span className="font-bold text-slate-800">🧮 計算：</span>稅後淨利 ÷ 發行股數</p>
                <p><span className="font-bold text-slate-800">📖 定義：</span>每一股實際分配到的純益。</p>
                <p className="text-red-700"><span className="font-bold">⚠️ 限制：</span>單一期間無意義，需觀察過去3-5年是否穩定成長。</p>
              </div>
            </div>

            {/* P/E */}
            <div className="p-5 rounded-xl border border-slate-200 bg-white shadow-sm hover:shadow-md transition-shadow">
              <div className="flex justify-between items-center mb-3">
                <h3 className="font-black text-slate-800 text-lg">本益比 (P/E)</h3>
                <span className="bg-slate-100 text-slate-800 py-1.5 px-3 rounded-md font-mono font-bold text-lg">{pe.toFixed(2)} 倍</span>
              </div>
              <div className="bg-slate-50 p-3 rounded-lg text-sm text-slate-600 space-y-2 border border-slate-100">
                <p><span className="font-bold text-slate-800">🧮 計算：</span>目前股價 ÷ EPS</p>
                <p><span className="font-bold text-slate-800">📖 定義：</span>預估回本年數。</p>
                <p className="text-red-700"><span className="font-bold">⚠️ 限制：</span>絕對數值無意義，必須與同業或自身歷史平均交叉比對。</p>
              </div>
            </div>

            {/* ROE */}
            <div className="p-5 rounded-xl border border-slate-200 bg-white shadow-sm hover:shadow-md transition-shadow">
              <div className="flex justify-between items-center mb-3">
                <h3 className="font-black text-slate-800 text-lg">股東權益報酬率 (ROE)</h3>
                <span className={`py-1.5 px-3 rounded-md font-mono font-bold text-lg ${roe >= 15 ? 'bg-green-100 text-green-800' : 'bg-slate-100 text-slate-800'}`}>
                  {roe.toFixed(2)}%
                </span>
              </div>
              <div className="bg-slate-50 p-3 rounded-lg text-sm text-slate-600 space-y-2 border border-slate-100">
                <p><span className="font-bold text-slate-800">🧮 計算：</span>(稅後淨利 ÷ 股東權益總額) × 100%</p>
                <p><span className="font-bold text-slate-800">📖 定義：</span>資本運用效率。</p>
                <p className="text-red-700"><span className="font-bold">⚠️ 限制：</span>需排除一次性收益，並留意高負債粉飾數值的陷阱。長期大於10-15%為佳。</p>
              </div>
            </div>

            {/* P/B */}
            <div className="p-5 rounded-xl border border-slate-200 bg-white shadow-sm hover:shadow-md transition-shadow">
              <div className="flex justify-between items-center mb-3">
                <h3 className="font-black text-slate-800 text-lg">股價淨值比 (P/B)</h3>
                <span className={`py-1.5 px-3 rounded-md font-mono font-bold text-lg ${pb < 1 ? 'bg-green-100 text-green-800' : 'bg-slate-100 text-slate-800'}`}>
                  {pb.toFixed(2)} 倍
                </span>
              </div>
              <div className="bg-slate-50 p-3 rounded-lg text-sm text-slate-600 space-y-2 border border-slate-100">
                <p><span className="font-bold text-slate-800">🧮 計算：</span>目前股價 ÷ (股東權益 ÷ 發行股數)</p>
                <p><span className="font-bold text-slate-800">📖 定義：</span>市值相對於帳面淨資產的溢價倍數。</p>
                <p className="text-red-700"><span className="font-bold">⚠️ 限制：</span>P/B &lt; 1 為潛在折價，但僅適用於擁有大量實體或金融資產的產業。</p>
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}
