(() => {
'use strict';
const $ = id => document.getElementById(id);
const A = window.RanaiseAnalysis;
if (!A) { console.error('Ranaise data engine unavailable.'); return; }
const state={rows:A.sample,source:'sample',role:'sales',drafts:[],chat:{sales:[],finance:[],operations:[]}};
let stats=A.analyze(state.rows);
const titles={overview:'Workspace overview',ask:'Ask an agent',approvals:'Draft approvals'};
const roles={sales:'Sales Agent',finance:'Finance Agent',operations:'Operations Agent'};
const examples={
  sales:['Which channel leads sales?','Summarize sales performance','Prepare a sales review'],
  finance:['What is the gross margin?','Summarize business costs','Prepare a finance review'],
  operations:['How many orders were reported?','Summarize channel activity','Prepare an operations check']
};
const intro={
  sales:'I can review revenue across the sales records you load. What would you like to investigate?',
  finance:'I can review reported costs and gross margin. Unreported expenses are not included.',
  operations:'I can summarize order activity by channel and prepare an operational review.'
};
function setView(view) {
  if(!titles[view]) return;
  document.querySelectorAll('.workspace-view').forEach(el=>{el.hidden=el.id!=='view-'+view});
  document.querySelectorAll('.side-btn[data-view]').forEach(el=>{
    const selected=el.dataset.view===view;
    el.classList.toggle('is-active',selected);
    el.setAttribute('aria-pressed',String(selected));
  });
  $('crumb-current').textContent=view.toUpperCase();
  $('view-title').textContent=titles[view];
  if(view==='approvals')renderDrafts();
}
function updateOverview(){
  stats=A.analyze(state.rows);
  $('metric-revenue').textContent=A.compact(stats.revenue);
  $('metric-cost').textContent=A.compact(stats.cost);
  $('metric-margin').textContent=stats.margin.toFixed(1)+'%';
  $('source-title').textContent=state.source==='sample'?'Sample workspace':state.source;
  $('source-subtitle').textContent=(state.source==='sample'?'Illustrative · ':'Local CSV · ')+stats.rows.toLocaleString('en-US')+' records · '+stats.orders.toLocaleString('en-US')+' orders';
  const area=$('channel-bars');area.replaceChildren();
  const highest=stats.byChannel[0]?.revenue||1;
  for(const item of stats.byChannel.slice(0,5)){
    const row=document.createElement('div');row.className='bar-row';
    const label=document.createElement('label');label.textContent=item.name;label.title=item.name;
    const track=document.createElement('div');track.className='bar-track';
    const fill=document.createElement('div');fill.className='bar-fill';
    fill.style.width=Math.max(0,Math.min(100,item.revenue/highest*100))+'%';
    track.append(fill);
    const amount=document.createElement('b');amount.textContent=A.compact(item.revenue);
    row.append(label,track,amount);area.append(row);
  }
}
function draft(role){
  const first=stats.byChannel[0];
  const title=role==='sales'?'Review sales channel performance':role==='finance'?'Check cost and margin assumptions':'Check operational order activity';
  const description=role==='sales'?'Review '+(first?.name||'top channel')+' ('+A.compact(first?.revenue||0)+') and compare channel performance before acting.':
    role==='finance'?'Review reported gross margin ('+stats.margin.toFixed(1)+'%) and verify omitted expenses.':
    'Review '+stats.orders.toLocaleString('en-US')+' orders and verify fulfillment data before acting.';
  const item={id:state.drafts.length+1,title,description,role,status:'Pending review'};
  state.drafts.push(item);renderDrafts();return item;
}
function guided(role,question){
  const q=question.toLowerCase();
  const top=stats.byChannel[0],last=stats.byChannel[stats.byChannel.length-1];
  if(/draft|prepare|plan|next step|follow.?up|review|rencana|buat|susun/.test(q)){
    const item=draft(role);
    return 'A local draft named "'+item.title+'" was prepared under Approvals. No external action will be taken.';
  }
  if(role==='sales'){
    if(/channel|sales|revenue|lead|best|top|omzet|jual|pendapatan/.test(q))
      return top?'Reported revenue across '+stats.rows+' records totals '+A.currency(stats.revenue)+'. '+top.name+' is highest at '+A.currency(top.revenue)+' ('+(stats.revenue?100*top.revenue/stats.revenue:0).toFixed(1)+'% of total). '+(last&&last!==top?last.name+' is smallest at '+A.currency(last.revenue)+'. ':'')+'This observation does not prove causality.':'There are no channels.';
    return 'This guided Sales beta covers revenue by channel. Ask "Which channel leads sales?" or "Prepare a sales review."';
  }
  if(role==='finance'){
    if(/margin|profit|biaya|cost|spend|keuang|financial|finance|gross|revenue/.test(q))
      return 'Reported revenue: '+A.currency(stats.revenue)+'. Reported cost: '+A.currency(stats.cost)+'. Gross profit: '+A.currency(stats.revenue-stats.cost)+' and gross margin: '+stats.margin.toFixed(1)+'%. These figures omit overhead, taxes, and other costs.';
    return 'This guided Finance beta covers reported cost and gross margin. Ask "What is the gross margin?"';
  }
  if(/order|operation|activity|stock|inventory|delivery|operasi|pesanan|logistic|channel/.test(q))
    return 'The loaded records contain '+stats.orders.toLocaleString('en-US')+' orders across '+stats.byChannel.length+' channels. '+(top?top.name+' accounts for '+top.orders.toLocaleString('en-US')+' orders. ':'')+'Inventory, supplier, delivery and fulfillment data are unavailable in this dataset.';
  return 'This guided Operations beta covers orders by channel. Logistics integrations are planned, not live.';
}
function bubble(where,who,text){
  const element=document.createElement('div');
  element.className='message '+who;element.textContent=text;where.append(element);where.scrollTop=where.scrollHeight;
}
function renderRole(){
  const role=state.role;
  $('agent-intro').textContent=roles[role];
  const container=$('prompt-examples');container.replaceChildren();
  examples[role].forEach(prompt=>{const b=document.createElement('button');b.type='button';b.dataset.prompt=prompt;b.textContent=prompt;container.append(b)});
  const log=$('chat-log');log.replaceChildren();
  if(!state.chat[role].length)bubble(log,'agent',intro[role]);
  else state.chat[role].forEach(msg=>bubble(log,msg.who,msg.text));
  $('question').placeholder='Ask '+roles[role]+' a question…';
}
function ask(value){
  const question=String(value||'').trim().slice(0,500);
  if(!question)return;
  const role=state.role;
  const response=guided(role,question);
  state.chat[role].push({who:'user',text:question},{who:'agent',text:response});
  renderRole();$('question').value='';
}
function renderDrafts(){
  const pending=state.drafts.filter(x=>x.status==='Pending review').length;
  $('approval-count').textContent=String(pending);
  const root=$('approval-list');root.replaceChildren();
  if(!state.drafts.length){
    const empty=document.createElement('div');empty.className='approval-empty';
    empty.textContent='No drafts yet. Ask an agent to prepare a review, or create one here.';root.append(empty);return;
  }
  for(const item of state.drafts.slice().reverse()){
    const row=document.createElement('article');row.className='approval-card';
    const copy=document.createElement('div'),heading=document.createElement('strong'),body=document.createElement('p'),status=document.createElement('span');
    heading.textContent=item.title;body.textContent=item.description;
    status.className='approval-status';status.textContent=item.status==='Approved'?'Approved locally · no action executed':item.status==='Dismissed'?'Dismissed':'Pending review';
    copy.append(heading,body,status);
    const actions=document.createElement('div');actions.className='approval-actions';
    if(item.status==='Pending review'){
      for(const [label,value] of [['Approve','Approved'],['Dismiss','Dismissed']]){
        const b=document.createElement('button');b.type='button';b.className='small-btn'+(value==='Approved'?' small-btn-emphasis':'');
        b.textContent=label;b.addEventListener('click',()=>{item.status=value;renderDrafts()});actions.append(b);
      }
    }
    row.append(copy,actions);root.append(row);
  }
}
function init(){
  document.querySelectorAll('.mobile-menu a').forEach(link=>link.addEventListener('click',()=>{document.querySelector('.mobile-nav')?.removeAttribute('open')}));
  document.querySelectorAll('.side-btn[data-view]').forEach(b=>b.addEventListener('click',()=>setView(b.dataset.view)));
  $('agent-role').addEventListener('change',e=>{state.role=e.target.value;renderRole()});
  $('prompt-examples').addEventListener('click',e=>{const b=e.target.closest('button[data-prompt]');if(b)ask(b.dataset.prompt)});
  $('ask-form').addEventListener('submit',e=>{e.preventDefault();ask($('question').value)});
  $('ask-from-overview').addEventListener('click',()=>{
    state.role='sales';$('agent-role').value='sales';renderRole();setView('ask');ask('Which channel leads sales?');
  });
  $('create-draft').addEventListener('click',()=>draft(state.role));
  $('reset-sample').addEventListener('click',()=>{state.rows=A.sample;state.source='sample';$('csv-upload').value='';$('file-error').hidden=true;updateOverview()});
  $('csv-upload').addEventListener('change',async e=>{
    const file=e.target.files?.[0];if(!file)return;
    try {
      if(file.size>2000000)throw Error('Upload a CSV smaller than 2 MB.');
      const data=A.parseCSV(await file.text());
      state.rows=data;state.source=file.name.slice(0,75);$('file-error').hidden=true;updateOverview();
    } catch(error) { $('file-error').textContent=error.message;$('file-error').hidden=false;e.target.value=''; }
  });
  $('ask-claude').addEventListener('click',async()=>{
    const code=$('beta-code').value.trim(),question=$('question').value.trim(),out=$('claude-answer');
    if(!code){out.textContent='Enter an invitation code to try the optional AI backend.';return;}
    if(!question){out.textContent='Write a question in the field above first.';return;}
    const button=$('ask-claude');button.disabled=true;out.textContent='Requesting AI analysis…';
    try {
      const response=await fetch('/api/analyze',{method:'POST',headers:{'Content-Type':'application/json','X-Beta-Code':code},body:JSON.stringify({question,role:state.role,summary:{revenue:stats.revenue,cost:stats.cost,orders:stats.orders,margin:stats.margin,rows:stats.rows,byChannel:stats.byChannel.slice(0,10)}})});
      const result=await response.json();
      if(!response.ok)throw Error(result.error||'AI service unavailable.');
      out.textContent=result.answer||'No response.';
    } catch(error){out.textContent='Live AI unavailable: '+error.message;}
    finally{button.disabled=false;}
  });
  if ($('year')) $('year').textContent=String(new Date().getFullYear());
  updateOverview();renderRole();renderDrafts();setView('overview');
}
init();
})();
