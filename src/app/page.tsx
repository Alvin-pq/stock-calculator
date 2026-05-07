'use client';
import { useState } from 'react';

// 常用熱門股票清單
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

export default function StockApp() {
  const [activeTab, setActiveTab] = useState('calc'); // 'calc' 或 'learn'
  const [stockId, setStockId] = useState('2330');
  const [isLoading, setIsLoading] = useState(false);
  
  // 財務數據 State
  const [price, setPrice] = useState<number | string>('');
  const [eps, setEps] = useState<number | string>('');
  const [bvps, setBvps] = useState<number | string>('');
  const [roe, setRoe] = useState<number | string>('');
  const [histPe, setHistPe] = useState<number | string>('');

  // ----------------------------------------------------------------
  // 核心數據抓取邏輯 (FinMind API)
  // ----------------------------------------------------------------
  const fetchAllData = async () => {
    if (!stockId) return alert('請先輸入代號');
    setIsLoading(true);
    try {
      const today = new Date();
      const past14D = new Date(new Date().setDate(today.getDate() - 14)).toISOString().split('T')[0];
      const past3Y = new Date(new Date().setFullYear(today.getFullYear() - 3)).toISOString().split('T')[0];
      const past2Y = new Date(new Date().setFullYear(today.getFullYear() - 2)).toISOString().split('T')[0];

      // 1. 抓市價
      const pRes = await fetch(`https://api.finmindtrade.com/api/v4/data?dataset=TaiwanStockPrice&data_id=${stockId}&start_date=${past14D}`);
      const pData = await pRes.json();
      if (pData.data?.length > 0) setPrice(pData.data[pData.data.length - 1].close);

      // 2. 抓歷史 PE 平均
      const perRes = await fetch(`https://api.finmindtrade.com/api/v4/data?dataset=TaiwanStockPER&data_id=${stockId}&start_date=${past3Y}`);
      const perData = await perRes.json();
      if (perData.data?.length > 0) {
        const pes = perData.data.map((d:any) => d.PER).filter((p:number) => p > 0 && p < 100);
        setHistPe(Number((pes.reduce((a:number,b:number)=>a+b,0)/pes.length).toFixed(2)));
      }

      // 3. 抓損益表 (EPS & Net Income)
      const fRes = await fetch(`https://api.finmindtrade.com/api/v4/data?dataset=TaiwanStockFinancialStatements&data_id=${stockId}&start_date=${past2Y}`);
      const fData = await fRes.json();
      let ttmNetIncome = 0;

      if (fData.data?.length > 0) {
        const epsRecs = fData.data.filter((d:any) => d.type.includes('EPS') || d.type.includes('基本每股盈餘'));
        const uDates = Array.from(new Set(epsRecs.map((d:any)=>d.date))).sort().reverse().slice(0,4);
        const ttmEps = uDates.reduce((sum: number, date: any) => sum + (epsRecs.find((r:any)=>r.date===date)?.value || 0), 0);
        setEps(Number(ttmEps.toFixed(2)));

        const niRecs = fData.data.filter((d:any) => d.type.includes('NetIncome') || d.type.includes('本期淨利'));
        ttmNetIncome = uDates.reduce((sum: number, date: any) => sum + (niRecs.find((r:any)=>r.date===date)?.value || 0), 0);
      }

      // 4. 抓資產負債表 (Equity & BVPS)
      const bRes = await fetch(`https://api.finmindtrade.com/api/v4/data?dataset=TaiwanStockBalanceSheet&data_id=${stockId}&start_date=${past2Y}`);
      const bData = await bRes.json();
      if (bData.data?.length > 0) {
        const sorted = bData.data.sort((a:any,b:any)=>new Date(b.date).getTime()-new Date(a.date).getTime());
        const latestBv = sorted.find((d:any)=>d.type.includes('每股淨值') || d.type.includes('每股參考淨值'));
        if (latestBv) setBvps(Number(latestBv.value).toFixed(2));

        const latestEq = sorted.find((d:any)=>d.type.includes('TotalEquity') || d.type.includes('權益總計'));
        if (latestEq && ttmNetIncome) setRoe(Number(((ttmNetIncome/latestEq.value)*100).toFixed(2)));
      }
      alert(`✅ ${stockId} 數據自動結算完成！`);
    } catch (e) { alert('抓取失敗，請檢查代號'); }
    finally { setIsLoading(false); }
  };

  const numPrice = Number(price) || 0;
  const numEps = Number(eps) || 0;
  const numHistPe = Number(histPe) || 0;
  const reasonablePrice = numEps * numHistPe;

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-800 pb-20">
      {/* 頂部切換 Tab */}
      <div className="sticky top-0 z-20 bg-white border-b border-slate-200 px-4 pt-4 shadow-sm">
        <div className="max-w-md mx-auto flex gap-4">
          <button 
            onClick={() => setActiveTab('calc')}
            className={`flex-1 pb-3 text-sm font-bold transition-all ${activeTab === 'calc' ? 'border-b-4 border-blue-600 text-blue-600' : 'text-slate-400'}`}
          >
            📊 計算工具
          </button>
          <button 
            onClick={() => setActiveTab('learn')}
            className={`flex-1 pb-3 text-sm font-bold transition-all ${activeTab === 'learn' ? 'border-b-4 border-indigo-600 text-indigo-600' : 'text-slate-400'}`}
          >
            📖 邏輯教學
          </button>
        </div>
      </div>

      <div className="max-w-md mx-auto p-4 mt-2">
        {activeTab === 'calc' ? (
          /* ==================== 分頁一：計算工具 ==================== */
          <div className="space-y-6">
            <div className="bg-blue-600 p-5 rounded-2xl text-white shadow-lg">
              <h2 className="text-xs font-bold opacity-80 mb-1">雲端數據中心</h2>
              <div className="flex gap-2">
                <select onChange={e => e.target.value && setStockId(e.target.value)} className="w-1/3 rounded-xl p-2.5 text-slate-900 font-bold bg-white/90">
                  <option value="">快速選擇</option>
                  {popularStocks.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                </select>
                <input type="text" value={stockId} onChange={e => setStockId(e.target.value)} className="w-2/3 rounded-xl p-2.5 bg-white/20 border border-white/30 placeholder-white/50 font-bold outline-none focus:bg-white/30" placeholder="代號" />
              </div>
              <button onClick={fetchAllData} disabled={isLoading} className="w-full mt-3 bg-white text-blue-700 font-black py-3 rounded-xl shadow-md active:scale-95 transition-all">
                {isLoading ? '數據讀取中...' : '一鍵全自動更新數據'}
              </button>
            </div>

            <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100">
              <h2 className="text-lg font-bold mb-4 border-b pb-2 text-slate-700">自動結算數據</h2>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-slate-50 p-3 rounded-xl">
                    <label className="text-[10px] font-bold text-slate-400 block uppercase">目前市價</label>
                    <input type="number" value={price} onChange={e=>setPrice(e.target.value)} className="w-full bg-transparent font-bold text-xl text-slate-800 outline-none" />
                  </div>
                  <div className="bg-slate-50 p-3 rounded-xl">
                    <label className="text-[10px] font-bold text-slate-400 block uppercase">近四季 EPS</label>
                    <input type="number" value={eps} onChange={e=>setEps(e.target.value)} className="w-full bg-transparent font-bold text-xl text-slate-800 outline-none" />
                  </div>
                </div>
                <div className="bg-indigo-50 p-3 rounded-xl border border-indigo-100">
                  <label className="text-[10px] font-bold text-indigo-400 block uppercase">歷史 3 年平均本益比 (估值分母)</label>
                  <input type="number" value={histPe} onChange={e=>setHistPe(e.target.value)} className="w-full bg-transparent font-bold text-xl text-indigo-900 outline-none" />
                </div>
              </div>
            </div>

            <div className={`p-6 rounded-3xl shadow-xl text-white transition-all ${numPrice < reasonablePrice ? 'bg-gradient-to-br from-green-500 to-emerald-600' : 'bg-gradient-to-br from-slate-700 to-slate-800'}`}>
              <h2 className="font-bold opacity-90 text-sm mb-1">🎯 理論合理股價 (P/E 估值法)</h2>
              <div className="text-5xl font-black mb-4 tracking-tighter">{reasonablePrice > 0 ? reasonablePrice.toFixed(1) : '--'} <span className="text-lg font-normal">元</span></div>
              <div className="bg-white/10 p-3 rounded-xl text-xs font-medium leading-relaxed">
                {numPrice > 0 && reasonablePrice > 0 ? (
                  numPrice < reasonablePrice ? `📍 目前股價 ${numPrice} 低於合理價，具備安全邊際。` : `📍 目前股價 ${numPrice} 高於合理價。`
                ) : '請先點擊上方按鈕抓取數據'}
              </div>
            </div>
          </div>
        ) : (
          /* ==================== 分頁二：邏輯教學 ==================== */
          <div className="space-y-5">
            <h2 className="text-2xl font-black text-slate-800 px-2">投資邏輯手冊</h2>
            
            <section className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100">
              <div className="flex items-center gap-3 mb-3 text-blue-600">
                <i className="fa-solid fa-chart-pie text-xl"></i>
                <h3 className="font-bold text-lg">1. 每股盈餘 (EPS)</h3>
              </div>
              <p className="text-sm font-bold text-slate-500 bg-slate-50 p-2 rounded mb-3">公式：稅後淨利 ÷ 發行股數</p>
              <p className="text-sm leading-relaxed text-slate-600">
                <span className="font-bold text-slate-800">意義：</span>公司為每一股賺了多少錢。<br/>
                <span className="font-bold text-slate-800">本App邏輯：</span>自動抓取近兩年損益表，結算最新的連續四個季度總和 (TTM)，排除單季季節性誤差。
              </p>
            </section>

            <section className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100">
              <div className="flex items-center gap-3 mb-3 text-green-600">
                <i className="fa-solid fa-hourglass-half text-xl"></i>
                <h3 className="font-bold text-lg">2. 本益比 (P/E)</h3>
              </div>
              <p className="text-sm font-bold text-slate-500 bg-slate-50 p-2 rounded mb-3">公式：股價 ÷ EPS</p>
              <p className="text-sm leading-relaxed text-slate-600">
                <span className="font-bold text-slate-800">意義：</span>預計的回本年數。<br/>
                <span className="font-bold text-slate-800">本App邏輯：</span>系統抓取過去 3 年（約 750 個交易日）的日資料，計算平均數作為「歷史常態評價」，避免用單一數字死板套用。
              </p>
            </section>

            <section className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100">
              <div className="flex items-center gap-3 mb-3 text-purple-600">
                <i className="fa-solid fa-bolt text-xl"></i>
                <h3 className="font-bold text-lg">3. 股東權益報酬率 (ROE)</h3>
              </div>
              <p className="text-sm font-bold text-slate-500 bg-slate-50 p-2 rounded mb-3">公式：(淨利 ÷ 權益總計) × 100%</p>
              <p className="text-sm leading-relaxed text-slate-600">
                <span className="font-bold text-slate-800">意義：</span>資本運用的效率。巴菲特指標建議長期大於 15%。<br/>
                <span className="font-bold text-slate-800">本App邏輯：</span>自動抓取最新資產負債表與近四季淨利進行即時結算。
              </p>
            </section>

            <section className="bg-indigo-600 p-6 rounded-2xl text-white">
              <h3 className="font-bold text-lg mb-2">💡 如何使用合理價？</h3>
              <p className="text-sm opacity-90 leading-relaxed mb-4">
                系統計算出的合理價是根據「歷史評價」與「目前获利」的中值。
              </p>
              <div className="bg-white/10 p-4 rounded-xl space-y-2 text-xs">
                <p>✅ <strong>便宜價：</strong>合理價 × 0.8 (安全邊際)</p>
                <p>✅ <strong>昂貴價：</strong>合理價 × 1.2 (考慮獲利了結)</p>
              </div>
            </section>
          </div>
        )}
      </div>
    </div>
  );
}
