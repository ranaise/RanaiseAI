// Local deterministic data analysis. Not an AI model or real enterprise connector.
(function (root, factory) {
  const library = factory();
  if (typeof module === 'object' && module.exports) module.exports = library;
  root.RanaiseAnalysis = library;
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';
  const sample = [
    { date: '2026-09-01', channel: 'Online', revenue: 14300000, cost: 9600000, orders: 173 },
    { date: '2026-09-04', channel: 'Retail', revenue: 11500000, cost: 7700000, orders: 115 },
    { date: '2026-09-08', channel: 'Wholesale', revenue: 9100000, cost: 7200000, orders: 31 },
    { date: '2026-09-12', channel: 'Online', revenue: 16600000, cost: 10600000, orders: 189 },
    { date: '2026-09-16', channel: 'Retail', revenue: 7600000, cost: 5100000, orders: 76 },
    { date: '2026-09-20', channel: 'Online', revenue: 11700000, cost: 7400000, orders: 147 },
    { date: '2026-09-24', channel: 'Wholesale', revenue: 6400000, cost: 5200000, orders: 22 },
    { date: '2026-09-28', channel: 'Retail', revenue: 5200000, cost: 3600000, orders: 55 }
  ];
  const aliases = {
    date: ['date','tanggal'],
    channel: ['channel','kanal','saluran','kategori'],
    revenue: ['revenue','pendapatan','sales','penjualan','omzet'],
    cost: ['cost','biaya','expenses','pengeluaran','hpp'],
    orders: ['orders','pesanan','order','jumlahpesanan']
  };
  function parseCSV(input) {
    if (typeof input !== 'string') throw Error('Invalid file.');
    if (input.length > 2000000) throw Error('CSV limit is 2 MB.');
    const content = input.replace(/^\uFEFF/, '');
    const records = [];
    let row = [], field = '', quoted = false;
    for (let i=0; i<content.length; i++) {
      const c = content[i];
      if (c === '"') {
        if (quoted && content[i+1] === '"') { field += '"'; i++; }
        else if (!quoted && field.trim() === '') quoted = true;
        else if (quoted) quoted = false;
        else field += c;
      } else if (c === ',' && !quoted) { row.push(field); field = ''; }
      else if ((c === '\r' || c === '\n') && !quoted) {
        if (c === '\r' && content[i+1] === '\n') i++;
        row.push(field);
        if (row.some(v => v.trim() !== '')) records.push(row);
        row=[]; field='';
      } else field += c;
    }
    if (quoted) throw Error('CSV contains an unclosed quoted field.');
    row.push(field);
    if (row.some(v => v.trim() !== '')) records.push(row);
    if (records.length < 2) throw Error('CSV needs a header and at least one data row.');
    if (records.length > 1001) throw Error('CSV limit is 1,000 data rows.');
    const headers=records.shift().map(s=>s.trim().toLowerCase().replace(/[\s_-]+/g,''));
    const indexes={};
    for (const [name,variants] of Object.entries(aliases)) indexes[name]=headers.findIndex(h=>variants.includes(h));
    for (const name of ['channel','revenue','cost','orders']) {
      if(indexes[name]<0) throw Error('Required columns: channel, revenue, cost, orders (Indonesian equivalents accepted).');
    }
    return records.map((columns,i)=>{
      if(columns.length!==headers.length) throw Error('Row '+(i+2)+' has '+columns.length+' columns, expected '+headers.length+'.');
      const value={date:indexes.date<0?'':columns[indexes.date].trim(),channel:columns[indexes.channel].trim().slice(0,70)};
      if(!value.channel) throw Error('Missing channel on row '+(i+2)+'.');
      for(const key of ['revenue','cost','orders']){
        const raw=columns[indexes[key]].trim();
        if(!/^-?(?:\d+\.?\d*|\.\d+)$/.test(raw)) throw Error('Invalid '+key+' on row '+(i+2)+'. Use plain numbers.');
        value[key]=Number(raw);
        if(!Number.isFinite(value[key])||value[key]<0) throw Error(key+' must be nonnegative on row '+(i+2)+'.');
      }
      if(!Number.isInteger(value.orders)) throw Error('Orders must be a whole number.');
      return value;
    });
  }
  function analyze(records) {
    if(!Array.isArray(records)||!records.length) throw Error('No records.');
    let revenue=0,cost=0,orders=0;
    const byName=new Map();
    for(const r of records){
      revenue+=r.revenue; cost+=r.cost; orders+=r.orders;
      let b=byName.get(r.channel);
      if(!b){ b={name:r.channel,revenue:0,cost:0,orders:0};byName.set(r.channel,b); }
      b.revenue+=r.revenue;b.cost+=r.cost;b.orders+=r.orders;
    }
    return {revenue,cost,orders,margin:revenue?(revenue-cost)*100/revenue:0,rows:records.length,byChannel:[...byName.values()].sort((a,b)=>b.revenue-a.revenue)};
  }
  function currency(n){return new Intl.NumberFormat('id-ID',{style:'currency',currency:'IDR',maximumFractionDigits:0}).format(n);}
  function compact(n){return n>=1e9?'Rp '+(n/1e9).toFixed(2)+'B':n>=1e6?'Rp '+(n/1e6).toFixed(2)+'M':n>=1e3?'Rp '+(n/1e3).toFixed(1)+'K':'Rp '+Math.round(n).toLocaleString('id-ID');}
  function answer(s,type){
    const top=s.byChannel[0],share=top&&s.revenue?top.revenue/s.revenue*100:0;
    if(type==='leader') return top?top.name+' leads revenue at '+currency(top.revenue)+' ('+share.toFixed(1)+'% of total). This does not establish why.':'No channels.';
    if(type==='margin') return 'Gross margin is '+s.margin.toFixed(1)+'% ('+currency(s.revenue-s.cost)+' gross profit before other expenses).';
    return 'Across '+s.rows+' records: '+currency(s.revenue)+' in revenue, '+currency(s.cost)+' in costs, '+s.orders.toLocaleString('id-ID')+' orders.';
  }
  return {sample,parseCSV,analyze,currency,compact,answer};
});
