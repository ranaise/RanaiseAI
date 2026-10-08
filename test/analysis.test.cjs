const {test}=require('node:test');
const assert=require('node:assert/strict');
const A=require('../src/analysis.js');
test('sample arithmetic',()=>{const s=A.analyze(A.sample);assert.equal(s.rows,8);assert.equal(s.revenue,82400000);assert.equal(s.cost,56400000);assert.equal(s.orders,808);assert.equal(s.byChannel[0].name,'Online');assert.equal(Math.round(s.margin*100)/100,31.55)});
test('CSV BOM, Indonesian aliases, quoted comma and CRLF',()=>{const rows=A.parseCSV('\uFEFFtanggal,kanal,pendapatan,biaya,pesanan\r\n2026-10-01,"Online, Direct",12000,9000,12\r\n');assert.equal(rows[0].channel,'Online, Direct');assert.equal(rows[0].revenue,12000)});
test('invalid CSV rejected',()=>{for(const s of ['channel,revenue,cost,orders\nOnline,-10,10,1','channel,revenue,cost,orders\nOnline,abc,10,1','channel,revenue,cost\nOnline,1,1','channel,revenue,cost,orders\n"Online,1,1,1'])assert.throws(()=>A.parseCSV(s))});
test('answers derive from data',()=>{const s=A.analyze(A.parseCSV('channel,revenue,cost,orders\nCustom,500,200,5'));assert.match(A.answer(s,'leader'),/Custom/);assert.match(A.answer(s,'summary'),/500/)});
