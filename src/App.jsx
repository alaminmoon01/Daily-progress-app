import React, { useEffect, useMemo, useState } from 'react';
import { Activity, ArrowLeft, ArrowRight, BookOpen, Check, CheckCircle2, Clock3, Coffee, Flame, History, ListChecks, Play, Plus, RotateCcw, Target, Timer, Trash2, Trophy, X } from 'lucide-react';

const HOUR = 60 * 60 * 1000;
const REST = 10 * 60 * 1000;
const REVISION = 2 * HOUR;
const todayKey = () => new Date().toLocaleDateString('en-CA');
const fmt = ms => { const s=Math.max(0,Math.floor(ms/1000)); return `${String(Math.floor(s/3600)).padStart(2,'0')}:${String(Math.floor(s%3600/60)).padStart(2,'0')}:${String(s%60).padStart(2,'0')}`; };
const niceDate = () => new Date().toLocaleDateString(undefined,{weekday:'long',month:'long',day:'numeric'});
const seed = () => ({date:todayKey(), dayStartedAt:null, blocks:[], phase:'idle', activeBlock:null, phaseStartedAt:null, phaseEndsAt:null, history:[]});
function read(){try{const d=JSON.parse(localStorage.getItem('mission-routine-v1')); return d?.date===todayKey()?d:{...seed(),history:d?.history||[]};}catch{return seed();}}
function App(){
 const [data,setData]=useState(read);
 const [now,setNow]=useState(Date.now());
 const [page,setPage]=useState('home');
 const [title,setTitle]=useState('');
 const [taskInput,setTaskInput]=useState('');
 const [tasks,setTasks]=useState([]);
 const [reflection,setReflection]=useState('');
 const [learned,setLearned]=useState('');
 const [showSummary,setShowSummary]=useState(false);
 useEffect(()=>{const id=setInterval(()=>setNow(Date.now()),250);return()=>clearInterval(id)},[]);
 useEffect(()=>{localStorage.setItem('mission-routine-v1',JSON.stringify(data))},[data]);
 const update=(patch)=>setData(d=>({...d,...patch}));
 const blocks=data.blocks||[];
 const doneTasks=blocks.reduce((n,b)=>n+b.tasks.filter(t=>t.done).length,0);
 const allTasks=blocks.reduce((n,b)=>n+b.tasks.length,0);
 const percent=allTasks?Math.round(doneTasks/allTasks*100):0;
 const elapsed=data.dayStartedAt?Math.min(14*HOUR,now-data.dayStartedAt):0;
 const dayPercent=Math.min(100,Math.round(elapsed/(14*HOUR)*100));
 const active=blocks.find(b=>b.id===data.activeBlock);
 const remaining=data.phaseEndsAt?Math.max(0,data.phaseEndsAt-now):0;
 const phaseDone=data.phaseEndsAt && now>=data.phaseEndsAt;
 useEffect(()=>{
  if(!phaseDone)return;
  if(data.phase==='focus'){
   setData(d=>({...d,phase:'rest',phaseStartedAt:now,phaseEndsAt:now+REST,blocks:d.blocks.map(b=>b.id===d.activeBlock?{...b,endedAt:now,status:'time-up'}:b)}));
  } else if(data.phase==='rest'){
   setData(d=>({...d,phase:'idle',phaseStartedAt:null,phaseEndsAt:null,activeBlock:null}));
   setPage('mission');
  } else if(data.phase==='revision'){
   setData(d=>({...d,blocks:d.blocks.map(b=>b.id===d.activeBlock?{...b,endedAt:now,status:'time-up'}:b),phase:'idle',phaseStartedAt:null,phaseEndsAt:null,activeBlock:null}));
   setPage('home');
  }
 },[phaseDone]); // timer phase transitions
 useEffect(()=>{if(data.dayStartedAt && elapsed >= 14*HOUR && !showSummary) setShowSummary(true);},[elapsed,data.dayStartedAt,showSummary]);
 const startDay=()=>{update({dayStartedAt:Date.now()});setPage('mission')};
 const addTask=()=>{if(!taskInput.trim())return;setTasks(t=>[...t,{id:crypto.randomUUID(),text:taskInput.trim(),done:false}]);setTaskInput('')};
 const startMission=()=>{
  if(!title.trim()||tasks.length===0)return;
  const b={id:crypto.randomUUID(),title:title.trim(),tasks:tasks.map(t=>({...t})),startedAt:Date.now(),endedAt:null,status:'running',learned:''};
  setData(d=>({...d,blocks:[...d.blocks,b],activeBlock:b.id,phase:'focus',phaseStartedAt:Date.now(),phaseEndsAt:Date.now()+HOUR,dayStartedAt:d.dayStartedAt||Date.now()}));
  setTitle('');setTasks([]);setTaskInput('');setPage('session');
 };
 const toggleTask=(id)=>update({blocks:blocks.map(b=>b.id===data.activeBlock?{...b,tasks:b.tasks.map(t=>t.id===id?{...t,done:!t.done}:t)}:b)});
 const completeEarly=()=>{setData(d=>({...d,blocks:d.blocks.map(b=>b.id===d.activeBlock?{...b,endedAt:Date.now(),status:'completed-early',learned}:b),phase:'rest',phaseStartedAt:Date.now(),phaseEndsAt:Date.now()+REST}));setPage('home')};
 const startRevision=()=>{
  const previous=(data.history||[]).filter(h=>h.date!==todayKey()).flatMap(h=>h.blocks||[]).filter(b=>b.tasks.some(t=>t.done));
  const todaysDone=blocks.filter(b=>b.tasks.some(t=>t.done));
  const source=previous.length?previous:todaysDone;
  const revTasks=source.flatMap(b=>b.tasks.filter(t=>t.done).map(t=>({id:crypto.randomUUID(),text:`Revise: ${t.text}`,done:false})));
  if(!revTasks.length){alert('আগে কোনো completed task থাকতে হবে।');return;}
  const b={id:crypto.randomUUID(),title:'Daily revision',tasks:revTasks,startedAt:Date.now(),endedAt:null,status:'running',learned:''};
  setData(d=>({...d,blocks:[...d.blocks,b],activeBlock:b.id,phase:'revision',phaseStartedAt:Date.now(),phaseEndsAt:Date.now()+REVISION,dayStartedAt:d.dayStartedAt||Date.now()}));setPage('session');
 };
 const finishDay=()=>{
  const summary={date:todayKey(),blocks,reflection,learned,percent,doneTasks,allTasks};
  setData(d=>({...seed(),history:[...(d.history||[]),summary]}));setShowSummary(false);setPage('home');
 };
 const completedBlocks=blocks.filter(b=>b.status==='completed-early'||b.status==='time-up').length;
 return <div className="app-shell">
  <aside className="sidebar">
   <div className="brand"><div className="brand-icon"><Target size={21}/></div><div><b>MISSION</b><span>DAILY LEARNING OS</span></div></div>
   <div className="side-label">WORKSPACE</div>
   <button className={`nav-item ${page==='home'?'selected':''}`} onClick={()=>setPage('home')}><Activity size={18}/> Dashboard</button>
   <button className={`nav-item ${page==='mission'?'selected':''}`} onClick={()=>setPage('mission')}><Target size={18}/> Start your mission</button>
   <button className="nav-item" onClick={()=>setShowSummary(true)}><History size={18}/> Daily summary</button>
   <div className="sidebar-bottom"><div className="streak-icon"><Flame size={18}/></div><div><b>Small steps. Big results.</b><span>Build your consistency daily.</span></div></div>
  </aside>
  <main className="main">
   <header className="topbar"><div className="mobile-brand"><div className="brand-icon"><Target size={19}/></div><b>MISSION</b></div><div className="date-label">{niceDate()} <span>·</span> {new Date().getFullYear()}</div><div className="profile"><div className="avatar">M</div><div><b>My Workspace</b><span>Learning mode</span></div></div></header>
   {page==='home'&&<div className="content">
    <div className="welcome"><div><div className="eyebrow"><span className="live-dot"/> YOUR PERSONAL PRODUCTIVITY SPACE</div><h1>Make today <em>count.</em></h1><p>One focused hour at a time. Learn, track, rest, and repeat.</p></div><div className="welcome-mark"><Target size={72} strokeWidth={1}/></div></div>
    <div className="stats-grid">
     <Stat icon={<Clock3/>} label="FOCUS TIME" value={`${Math.floor(elapsed/3600000)}h ${Math.floor(elapsed%3600000/60000)}m`} sub="of your 14-hour day" />
     <Stat icon={<ListChecks/>} label="TASKS COMPLETED" value={`${doneTasks}/${allTasks}`} sub="across your missions" />
     <Stat icon={<Trophy/>} label="DAILY PROGRESS" value={`${percent}%`} sub="based on completed tasks" />
     <Stat icon={<Flame/>} label="MISSIONS" value={completedBlocks} sub="sessions completed" />
    </div>
    <div className="dashboard-grid">
     <section className="panel daily-panel"><div className="panel-head"><div><div className="eyebrow">YOUR DAILY GOAL</div><h2>14-hour learning journey</h2></div><span className="pill"><span className="live-dot"/> {data.dayStartedAt?'IN PROGRESS':'READY TO START'}</span></div>
      <div className="day-progress"><div className="progress-label"><span>Daily timeline</span><b>{dayPercent}%</b></div><div className="track"><div className="track-fill" style={{width:`${dayPercent}%`}}/></div><div className="timeline-labels"><span>Start</span><span>7 hours</span><span>14 hours</span></div></div>
      <div className="journey-steps"><div className="journey-step"><div className="step-icon violet"><BookOpen size={18}/></div><div><b>Focused learning</b><span>1 hour · Choose your own tasks</span></div><span className="step-number">01</span></div><div className="journey-step"><div className="step-icon orange"><Coffee size={18}/></div><div><b>Mindful break</b><span>10 minutes · Recharge your brain</span></div><span className="step-number">02</span></div><div className="journey-step"><div className="step-icon green"><RotateCcw size={18}/></div><div><b>Revision session</b><span>2 hours · Review what you learned</span></div><span className="step-number">03</span></div></div>
      <button className="primary-btn wide" onClick={()=>data.phase!=='idle'?(setPage('session')):data.dayStartedAt?(setPage('mission')):startDay()}><Play size={17} fill="currentColor"/> {data.phase!=='idle'?'Continue active session':data.dayStartedAt?'Start next mission':'Start your mission'} <ArrowRight size={17}/></button>
     </section>
     <section className="panel mission-panel"><div className="panel-head"><div><div className="eyebrow">TODAY AT A GLANCE</div><h2>Your missions</h2></div><span className="count-badge">{blocks.length}</span></div>
      {blocks.length===0?<div className="empty-state"><div className="empty-icon"><BookOpen size={25}/></div><b>Your story starts here</b><p>Create your first mission and list the things you want to learn this hour.</p><button className="outline-btn" onClick={()=>setPage('mission')}>Create a mission <ArrowRight size={15}/></button></div>:<div className="mission-list">{blocks.slice().reverse().map(b=><div className="mission-row" key={b.id}><div className={`mission-status ${b.status==='running'?'running':b.tasks.every(t=>t.done)?'done':'partial'}`}>{b.status==='running'?<Play size={14}/>:b.tasks.every(t=>t.done)?<Check size={15}/>:<Clock3 size={15}/>}</div><div className="mission-info"><b>{b.title}</b><span>{b.tasks.filter(t=>t.done).length}/{b.tasks.length} tasks completed</span></div><span className="mission-percent">{b.tasks.length?Math.round(b.tasks.filter(t=>t.done).length/b.tasks.length*100):0}%</span></div>)}</div>}
     </section>
    </div>
    <section className="panel revision-panel"><div className="revision-art"><RotateCcw size={26}/></div><div className="revision-copy"><div className="eyebrow">REMEMBER MORE, FORGET LESS</div><h2>Revision comes first.</h2><p>Revisit completed tasks from your previous learning sessions. A little revision today makes yesterday's learning stick.</p></div><button className="outline-btn" onClick={startRevision}>Start 2-hour revision <ArrowRight size={16}/></button></section>
    <div className="bottom-actions"><button className="text-btn" onClick={()=>setShowSummary(true)}>Review daily summary <ArrowRight size={15}/></button><span>Your progress is saved automatically on this device.</span></div>
   </div>}
   {page==='mission'&&<div className="content narrow"><button className="back-link" onClick={()=>setPage('home')}><ArrowLeft size={16}/> Back to dashboard</button><div className="page-heading"><div className="eyebrow">MISSION BUILDER · 01</div><h1>What will you <em>learn?</em></h1><p>Choose one clear goal, break it into tasks, and give it your full focus for one hour.</p></div>
    <section className="panel builder-panel"><label className="field-label">MISSION NAME</label><input className="text-input" value={title} onChange={e=>setTitle(e.target.value)} placeholder="e.g. Learn React useEffect hook" autoFocus/><div className="field-help">Make it specific so you know what success looks like.</div>
     <div className="section-line"><div><label className="field-label">YOUR TASK CHECKLIST</label><p>Add the things you want to learn or finish during this session.</p></div><span className="count-badge">{tasks.length} tasks</span></div>
     <div className="add-task"><input className="text-input" value={taskInput} onChange={e=>setTaskInput(e.target.value)} onKeyDown={e=>e.key==='Enter'&&addTask()} placeholder="Type a task and press Enter..."/><button className="square-btn" onClick={addTask} aria-label="Add task"><Plus size={19}/></button></div>
     <div className="suggestions"><span>Quick add:</span>{['Read documentation','Practice with code','Write notes','Test what I learned'].map(s=><button key={s} onClick={()=>setTasks(t=>[...t,{id:crypto.randomUUID(),text:s,done:false}])}>{s}</button>)}</div>
     {tasks.length>0&&<div className="builder-tasks">{tasks.map((t,i)=><div className="builder-task" key={t.id}><span className="task-index">{String(i+1).padStart(2,'0')}</span><span>{t.text}</span><button className="icon-btn" onClick={()=>setTasks(ts=>ts.filter(x=>x.id!==t.id))} aria-label="Remove task"><Trash2 size={15}/></button></div>)}</div>}
     <div className="session-preview"><div className="preview-icon"><Timer size={20}/></div><div><b>One-hour focus session</b><span>Timer starts when you click the button below.</span></div><strong>60:00</strong></div>
     <button className="primary-btn wide" disabled={!title.trim()||tasks.length===0} onClick={startMission}><Play size={17} fill="currentColor"/> Start mission <ArrowRight size={17}/></button>
     {(!title.trim()||tasks.length===0)&&<div className="validation-note">Add a mission name and at least one task to begin.</div>}
    </section>
   </div>}
   {page==='session'&&<div className="content session-content"><button className="back-link" onClick={()=>setPage('home')}><ArrowLeft size={16}/> Dashboard</button>
    {data.phase==='focus'&&active&&<><div className="session-title"><div className="eyebrow"><span className="live-dot"/> FOCUS SESSION IN PROGRESS</div><h1>{active.title}</h1><p>Stay present. Every checked task is progress.</p></div><section className="panel timer-panel"><div className="timer-ring"><div className="ring-inner"><span>TIME REMAINING</span><strong>{fmt(remaining)}</strong><small>of 01:00:00</small></div></div><div className="timer-caption"><span className="live-dot"/> The clock started automatically</div><div className="session-progress"><div className="progress-label"><span>Tasks completed</span><b>{active.tasks.filter(t=>t.done).length} of {active.tasks.length}</b></div><div className="track"><div className="track-fill" style={{width:`${active.tasks.filter(t=>t.done).length/active.tasks.length*100}%`}}/></div></div></section>
     <section className="panel checklist-panel"><div className="panel-head"><div><div className="eyebrow">YOUR ACTION PLAN</div><h2>Get it done</h2></div><span className="count-badge">{active.tasks.filter(t=>t.done).length}/{active.tasks.length}</span></div><div className="checklist">{active.tasks.map((t,i)=><button key={t.id} className={`check-row ${t.done?'checked':''}`} onClick={()=>toggleTask(t.id)}><span className="check-box">{t.done&&<Check size={16}/>}</span><span className="check-task"><small>TASK {String(i+1).padStart(2,'0')}</small>{t.text}</span><span className={`task-state ${t.done?'green-text':'pending-text'}`}>{t.done?'Completed':'To do'}</span></button>)}</div><label className="field-label">WHAT DID YOU LEARN? (OPTIONAL)</label><textarea className="text-area" value={learned} onChange={e=>setLearned(e.target.value)} placeholder="Write a quick note about what you understood..." rows="3"/><button className="primary-btn wide" onClick={completeEarly}><CheckCircle2 size={17}/> Complete mission & start 10-min rest</button><div className="validation-note">You can finish early. Unticked tasks will stay marked as incomplete.</div></section></>}
    {data.phase==='rest'&&<section className="panel rest-panel"><div className="rest-icon"><Coffee size={30}/></div><div className="eyebrow">YOU EARNED THIS</div><h1>Take a <em>breather.</em></h1><p>Step away from the screen, stretch, drink some water. Your next mission can wait.</p><div className="rest-clock">{fmt(remaining)}</div><span className="rest-sub">10-MINUTE REST</span><div className="rest-track"><div style={{width:`${Math.max(0,Math.min(100,(1-remaining/REST)*100))}%`}}/></div><button className="primary-btn wide" onClick={()=>{update({phase:'idle',phaseStartedAt:null,phaseEndsAt:null,activeBlock:null});setPage('mission')}}>Start next mission <ArrowRight size={17}/></button><button className="text-btn" onClick={()=>{update({phase:'idle',phaseStartedAt:null,phaseEndsAt:null,activeBlock:null});setPage('home')}}>Return to dashboard</button></section>}
    {data.phase==='revision'&&active&&<><div className="session-title"><div className="eyebrow"><span className="live-dot"/> REVISION MODE</div><h1>Make it <em>stick.</em></h1><p>Review the tasks you completed before. Retrieval is how learning lasts.</p></div><section className="panel timer-panel revision-timer"><div className="timer-ring"><div className="ring-inner"><span>REVISION TIME LEFT</span><strong>{fmt(remaining)}</strong><small>of 02:00:00</small></div></div><div className="session-progress"><div className="progress-label"><span>Revision tasks</span><b>{active.tasks.filter(t=>t.done).length}/{active.tasks.length}</b></div><div className="track"><div className="track-fill" style={{width:`${active.tasks.filter(t=>t.done).length/active.tasks.length*100}%`}}/></div></div></section><section className="panel checklist-panel"><div className="panel-head"><div><div className="eyebrow">REVISIT & RECALL</div><h2>Revision checklist</h2></div></div><div className="checklist">{active.tasks.map((t,i)=><button key={t.id} className={`check-row ${t.done?'checked':''}`} onClick={()=>toggleTask(t.id)}><span className="check-box">{t.done&&<Check size={16}/>}</span><span className="check-task"><small>REVISE {String(i+1).padStart(2,'0')}</small>{t.text}</span><span className={`task-state ${t.done?'green-text':'pending-text'}`}>{t.done?'Reviewed':'Pending'}</span></button>)}</div><button className="primary-btn wide" onClick={()=>{setData(d=>({...d,blocks:d.blocks.map(b=>b.id===d.activeBlock?{...b,endedAt:Date.now(),status:'completed-early'}:b),phase:'idle',phaseStartedAt:null,phaseEndsAt:null,activeBlock:null}));setPage('home')}}><CheckCircle2 size={17}/> Complete revision</button></section></>}
   </div>}
  </main>
  {showSummary&&<div className="modal-backdrop" onClick={()=>setShowSummary(false)}><section className="summary-modal" onClick={e=>e.stopPropagation()}><button className="modal-close" onClick={()=>setShowSummary(false)}><X size={19}/></button><div className="eyebrow">DAILY REFLECTION</div><h2>Look how far you came.</h2><p className="modal-date">{niceDate()}</p><div className="summary-metrics"><div><strong>{percent}%</strong><span>Task completion</span></div><div><strong>{doneTasks}/{allTasks}</strong><span>Tasks done</span></div><div><strong>{blocks.length}</strong><span>Missions</span></div></div><div className="summary-list">{blocks.map(b=><div className="summary-item" key={b.id}><div><b>{b.title}</b><span>{b.tasks.filter(t=>t.done).length}/{b.tasks.length} tasks completed</span></div><b className={b.tasks.every(t=>t.done)?'green-text':'red-text'}>{b.tasks.length?Math.round(b.tasks.filter(t=>t.done).length/b.tasks.length*100):0}%</b></div>)}</div><label className="field-label">WHAT DID YOU WANT TO LEARN?</label><textarea className="text-area" rows="2" value={reflection} onChange={e=>setReflection(e.target.value)} placeholder="Your goals for today..."/><label className="field-label">WHAT DID YOU ACTUALLY LEARN?</label><textarea className="text-area" rows="2" value={learned} onChange={e=>setLearned(e.target.value)} placeholder="Your biggest takeaways..."/><div className="summary-note"><b>Don't forget:</b> Tasks you didn't complete are marked in red. Add them to tomorrow's plan and revise completed topics to strengthen your memory.</div><button className="primary-btn wide" onClick={()=>{setData(d=>({...d,history:[...(d.history||[]),{date:todayKey(),blocks,reflection,learned,percent,doneTasks,allTasks}]}));setShowSummary(false)}}><CheckCircle2 size={17}/> Save reflection</button><button className="text-btn wide-text" onClick={finishDay}>Finish day & archive summary</button></section></div>}
 </div>;
}
function Stat({icon,label,value,sub}){return <div className="stat-card"><div className="stat-top"><span className="stat-icon">{icon}</span><span className="stat-label">{label}</span></div><strong>{value}</strong><span className="stat-sub">{sub}</span></div>}
export default App;
