'use client';
import { useState } from 'react';

const popularStocks = [
  { id: '2330', name: '台積電' },
  { id: '2317', name: '鴻海' },
  { id: '2454', name: '聯發科' },
  { id: '2308', name: '台達電' },
  { id: '2881', name: '富邦金' },
  { id: '2891', name: '中信金' },
  { id: '2603', name: '長榮' },
  { id: '2002', name: '中鋼' },
];

export default function StockCalculator() {
  const [stockId, setStockId] = useState('2330');
  const [isLoading, setIsLoading] = useState(false);
  
  const [price, setPrice] = useState<number | string>('');
  const [eps, setEps] = useState<number | string>('');
  const [bvps, setBvps] = useState<number | string>('');
  const [roe, setRoe] = useState<number | string>('');
  const [histPe, setHistPe] = useState<number | string>('');

  const fetchAllData = async () => {
    if (!stockId) {
      alert('請先輸入股票代號');
      return;
    }
    
    setIsLoading(true);
    try {
      const today = new Date();
      
      const past14Days = new Date();
      past14Days.setDate(today.getDate() - 14);
      const date14Str = past14Days.toISOString().split('T')[0];

      const past3Years = new Date();
      past3Years.setFullYear(today.getFullYear() - 3);
      const date3YrStr = past3Years.toISOString().split('T')[0];

      // 財報需要抓取近兩年，以確保能涵蓋完整的「近四個季度」
      const past2Years = new Date();
      past2Years.setFullYear(today.getFullYear() - 2);
      const date2YrStr = past2Years.toISOString().split('T')[0];

      // ==========================================
      // A. 抓取最新收盤價
      // ==========================================
      const priceRes = await fetch(`https://api.finmindtrade.com/api/v4/data?dataset=TaiwanStockPrice&data_id=${stockId}&start_date=${date14Str}`);
      const priceResult = await priceRes.json();
      
      if (priceResult.msg === 'success' && priceResult.data.length > 0) {
        const latestPrice = priceResult.data[priceResult.data.length - 1].close;
        setPrice(latestPrice);
      } else {
        throw new Error('找不到股價資料');
      }

      // ==========================================
      // B. 抓取歷史本益比並計算「三年平均」
      // ==========================================
      const perRes = await fetch(`https://api.finmindtrade.com/api/v4/data?dataset=TaiwanStockPER&data_id=${stockId}&start_date=${date3YrStr}`);
      const perResult = await perRes.json();
      
      if (perResult.msg === 'success' && perResult.data.length > 0) {
        const validPEs = perResult.data.map((d: any) => d.PER).filter((pe: number) => pe > 0 && pe < 100);
        if (validPEs.length > 0) {
          const avgPE = validPEs.reduce((a: number, b: number) => a + b, 0) / validPEs.length;
          setHistPe(Number(avgPE.toFixed(2)));
        }
      }

      // ==========================================
      // C. 抓取綜合損益表 (計算 EPS 與 淨利)
      // ==========================================
      const finRes = await fetch(`https://api.finmindtrade.com/api/v4/data?dataset=TaiwanStockFinancialStatements&data_id=${stockId}&start_date=${date2YrStr}`);
      const finResult = await finRes.json();

      // ==========================================
      // D. 抓取資產負債表 (計算 ROE 分母與淨值)
      // ==========================================
      const bsRes = await fetch(`https://api.finmindtrade.com/api/v4/data?dataset=TaiwanStockBalanceSheet&data_id=${stockId}&start_date=${date2YrStr}`);
      const bsResult = await bsRes.json();

      let epsMessage = "";
      let ttmNetIncome = 0;
      let latestEquity = 0;

      // 處理損益表數據
      if (finResult.msg === 'success' && finResult.data.length > 0) {
        const finData = finResult.data;
        
        // 1. 結算近四季 EPS 總和
        const epsRecords = finData.filter((d: any) => d.type === 'EPS' || String(d.type).includes('基本每股盈餘') || String(d.origin_name).includes('基本每股盈餘'));
        if (epsRecords.length > 0) {
          const uniqueDates = Array.from(new Set(epsRecords.map((d: any) => d.date))).sort((a: any, b: any) => new Date(b).getTime() - new Date(a).getTime());
          
          let ttmEps = 0;
          let quartersFound = 0;
          for (let i = 0; i < Math.min(4, uniqueDates.length); i++) {
            const record = epsRecords.find((d: any) => d.date === uniqueDates[i]);
            if (record) {
              ttmEps += record.value;
              quartersFound++;
            }
          }
          if (ttmEps !== 0) {
            setEps(Number(ttmEps.toFixed(2)));
            epsMessage += `\n📊 成功結算近 ${quartersFound} 季 EPS 總和：${ttmEps.toFixed(2)} 元`;
          }
        }

        // 2. 結算近四季「本期淨利」總和 (為了推算 ROE)
        const incomeRecords = finData.filter((d: any) => d.type === 'IncomeAfterTaxes' || String(d.type).includes('本期淨利') || String(d.origin_name).includes('本期淨利'));
        if (incomeRecords.length > 0) {
          const uniqueDates = Array.from(new Set(incomeRecords.map((d: any) => d.date))).sort((a: any, b: any) => new Date(b).getTime() - new Date(a).getTime());
          for (let i = 0; i < Math.min(4, uniqueDates.length); i++) {
            const record = incomeRecords.find((d: any) => d.date === uniqueDates[i]);
            if (record) {
              ttmNetIncome += record.value;
            }
          }
        }
      }

      // 處理資產負債表數據
      if (bsResult.msg === 'success' && bsResult.data.length > 0) {
        const bsData = bsResult.data;
        
        // 3. 抓取每股淨值
        const bvpsRecords = bsData.filter((d: any) => String(d.type).includes('每股參考淨值') || String(d.type).includes('每股淨值') || String(d.origin_name).includes('每股淨值'));
        if (bvpsRecords.length > 0) {
           bvpsRecords.sort((a: any, b: any) => new Date(b.date).getTime() - new Date(a.date).getTime());
           setBvps(Number(bvpsRecords[0].value).toFixed(2));
        }

        // 4. 抓取最新一季的「權益總計」
        const equityRecords = bsData.filter((d: any) => d.type === 'TotalEquity' || String(d.type).includes('權益總計') || String(d.type).includes('權益總額') || String(d.origin_name).includes('權益總計'));
        if (equityRecords.length > 0) {
           equityRecords.sort((a: any, b: any) => new Date(b.date).getTime() - new Date(a.date).getTime());
           latestEquity = equityRecords[0].value;
        }
      }

      // 5. 自動計算近四季 ROE (近四季淨利 ÷ 最新權益總計)
      if (ttmNetIncome !== 0 && latestEquity !== 0) {
         const calculatedRoe = (ttmNetIncome / latestEquity) * 100;
         setRoe(Number(calculatedRoe.toFixed(2)));
         epsMessage += `\n🎯 成功推算近四季 ROE：${calculatedRoe.toFixed(2)}%`;
      }

      alert(`✅ 成功載入 ${stockId} 數據！${epsMessage}\n\n⚠️ 提醒：程式已自動加總近四季報表，特殊產業(如金融股)之會計科目若有差異，建議對照公開資訊觀測站微調。`);

    } catch (error) {
      console.error('API 呼叫失敗:', error);
      alert('⚠️ 抓取資料發生錯誤，請確認股票代號是否正確。');
    } finally {
      setIsLoading(false);
    }
  };

  const numPrice = Number(price) || 0;
  const numEps = Number(eps) || 0;
  const numBvps = Number(bvps) || 0;
  const numHistPe = Number(histPe) || 0;

  const isDataReady = numPrice > 0 && numEps > 0 && numHistPe > 0;

  const pe = numEps > 0 ? numPrice / numEps : 0;
  const pb = numBvps > 0 ? numPrice / numBvps : 0;
  const reasonablePrice = numEps * numHistPe;
  const isUndervalued = numPrice < reasonablePrice;

  return (
    <div className="min-h-screen bg-slate-50 p-4 font-sans text-slate-800 pb-12">
      <div className="max-w-md mx-auto bg-white rounded-2xl shadow-xl overflow-hidden md:max-w-2xl border border-slate-100">
        <div className="p-6">
          <h1 className="text-2xl font-black text-center text-slate-800 mb-6 tracking-tight">股票基本面與估值系統</h1>
          
          {/* 抓取區 */}
          <div className="bg-blue-50 p-5 rounded-xl mb-6 border border-blue-200 shadow-sm">
            <h2 className="text-lg font-bold text-blue-900 mb-3 flex items-center gap-2">
              <span>📡</span> 雲端數據中心 (FinMind API)
            </h2>
            
            <div className="flex flex-col gap-2 mb-3">
              <div className="flex gap-2">
                <select 
                  onChange={e => {
                    if(e.target.value) setStockId(e.target.value);
                  }}
                  className="block w-1/3 rounded-lg border-blue-300 shadow-sm focus:border-blue-600 focus:ring-blue-600 p-2.5 border font-bold text-blue-900 bg-white"
                >
                  <option value="">快速選擇...</option>
                  {popularStocks.map(stock => (
                    <option key={stock.id} value={stock.id}>{stock.id} {stock.name}</option>
                  ))}
                </select>
                <input 
                  type="text" 
                  value={stockId} 
                  onChange={e => setStockId(e.target.value)} 
                  placeholder="或手動輸入代號"
                  className="block w-2/3 rounded-lg border-blue-300 shadow-sm focus:border-blue-600 focus:ring-blue-600 p-2.5 border font-bold text-blue-900" 
                />
              </div>
              <button 
                onClick={fetchAllData}
                disabled={isLoading}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2.5 px-4 rounded-lg shadow transition-colors disabled:bg-blue-400"
              >
                {isLoading ? '運算中...' : '全面抓取財報與市價'}
              </button>
            </div>
            <p className="text-xs text-blue-700 mt-2 font-medium">系統將自動調閱「綜合損益表」與「資產負債表」，推算年化數據。</p>
          </div>

          {/* 輸入區 */}
          <div className="bg-slate-100 p-5 rounded-xl mb-6 border border-slate-200 shadow-inner">
            <h2 className="text-lg font-bold text-slate-700 mb-4 border-b border-slate-300 pb-2">Step 1: 確認財報與估值數據</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1">目前股價 (市價, 元)</label>
                <input type="number" value={price} onChange={e => setPrice(e.target.value)} placeholder="等待抓取..." className="block w-full rounded-lg border-slate-300 p-2.5 border bg-white" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1">近四季 EPS (元)</label>
                  <input type="number" value={eps} onChange={e => setEps(e.target.value)} placeholder="等待推算..." className="block w-full rounded-lg border-slate-300 p-2.5 border bg-white" />
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1">每股淨值 (元)</label>
                  <input type="number" value={bvps} onChange={e => setBvps(e.target.value)} placeholder="等待抓取..." className="block w-full rounded-lg border-slate-300 p-2.5 border bg-white" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1">股東權益報酬率 ROE (%)</label>
                <input type="number" value={roe} onChange={e => setRoe(e.target.value)} placeholder="等待自動推算..." className="block w-full rounded-lg border-slate-300 p-2.5 border bg-white" />
              </div>
              <div className="pt-2">
                <label className="block text-sm font-bold text-indigo-800 mb-1">歷史常態本益比 (近三年平均)</label>
                <input type="number" value={histPe} onChange={e => setHistPe(e.target.value)} placeholder="等待抓取..." className="block w-full rounded-lg border-indigo-300 p-2.5 border bg-indigo-50 font-bold text-indigo-900" />
              </div>
            </div>
          </div>

          {/* 估值結果區 */}
          <div className="bg-gradient-to-br from-indigo-600 to-blue-700 p-5 rounded-xl mb-6 shadow-md text-white">
            <h2 className="text-lg font-bold mb-2 flex items-center gap-2">
              <span>🎯</span> 合理股價估值 (本益比法)
            </h2>
            
            {isDataReady ? (
              <>
                <div className="flex items-end gap-2 mb-3">
                  <span className="text-4xl font-black tracking-tight">{reasonablePrice.toFixed(2)}</span>
                  <span className="text-indigo-100 mb-1 font-medium">元</span>
                </div>
                <div className="bg-black/20 p-3 rounded-lg text-sm space-y-1 backdrop-blur-sm">
                  <p><span className="font-bold text-indigo-200">計算公式：</span>近四季 EPS × 歷史三年常態本益比</p>
                </div>
                <div className={`mt-4 p-3 rounded-lg font-bold text-sm text-center shadow-inner ${isUndervalued ? 'bg-green-500 text-white' : 'bg-red-500 text-white'}`}>
                  📍 診斷：目前市價 ({numPrice}) {isUndervalued ? '低於' : '高於'}推算的合理價。
                </div>
              </>
            ) : (
              <div className="p-4 bg-white/10 rounded-lg text-center border border-white/20 border-dashed">
                <p className="text-indigo-100 font-medium tracking-wide">請先完成 Step 1 資料輸入與抓取</p>
              </div>
            )}
          </div>

          {/* 核心指標卡片 */}
          <h2 className="text-lg font-bold text-slate-700 mb-4 border-b border-slate-300 pb-2">Step 2: 目前估值位階</h2>
          <div className="grid grid-cols-2 gap-4">
            <div className="p-4 rounded-xl border border-slate-200 bg-white shadow-sm">
              <h3 className="font-bold text-slate-600 text-sm mb-1">當前本益比 (P/E)</h3>
              <div className="text-2xl font-black text-slate-800">
                {numEps > 0 && numPrice > 0 ? `${pe.toFixed(2)} 倍` : <span className="text-slate-300 text-lg">---</span>}
              </div>
            </div>
            <div className="p-4 rounded-xl border border-slate-200 bg-white shadow-sm">
              <h3 className="font-bold text-slate-600 text-sm mb-1">當前股價淨值比 (P/B)</h3>
              <div className="text-2xl font-black text-slate-800">
                {numBvps > 0 && numPrice > 0 ? `${pb.toFixed(2)} 倍` : <span className="text-slate-300 text-lg">---</span>}
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
