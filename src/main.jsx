import React, { useEffect, useMemo, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { createClient } from '@supabase/supabase-js';
import { Cloud, ShieldCheck, Wallet, Users, Zap, Gift, CalendarDays, ChartNoAxesCombined, Menu, X, ArrowRight, Mail, LockKeyhole, UserRound, CircleHelp, LogOut, Settings, Package, LayoutDashboard, Activity, Copy, Eye, EyeOff, CheckCircle2, AlertTriangle, KeyRound, MessageCircle, Send, Link, Globe, Star, Bell } from 'lucide-react';
import './styles.css';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
const supabase = supabaseUrl && supabaseKey ? createClient(supabaseUrl, supabaseKey) : null;

const plans = [
  {name:'Basic',price:50,rate:'2.00%',tone:'cyan',icon:'◆'},
  {name:'Premium',price:100,rate:'2.50%',tone:'purple',icon:'⬢',popular:true},
  {name:'Pro',price:200,rate:'3.00%',tone:'teal',icon:'◈'},
  {name:'Elite',price:500,rate:'3.50%',tone:'gold',icon:'✦'},
  {name:'VIP',price:1000,rate:'4.00%',tone:'purple',icon:'✧'}
];
const rewardRows = [{members:10,reward:3},{members:20,reward:5},{members:50,reward:10},{members:100,reward:20},{members:500,reward:50}];
const ICONS={LayoutDashboard,Wallet,Package,Zap,Activity,Gift,Users,ChartNoAxesCombined,UserRound,CircleHelp,Settings,Link,Globe,MessageCircle,Send,Star,Bell,ShieldCheck};
const ICON_NAMES=Object.keys(ICONS);
const DEFAULT_MENU=[
 {label:'Overview',tab_key:'Overview',icon:'LayoutDashboard'},
 {label:'Deposit instructions',tab_key:'Deposit instructions',icon:'Wallet'},
 {label:'Packages',tab_key:'Packages',icon:'Package'},
 {label:'My Plans',tab_key:'My Plans',icon:'Package'},
 {label:'Mining cycles',tab_key:'Mining cycles',icon:'Zap'},
 {label:'Reinvest',tab_key:'Reinvest',icon:'Activity'},
 {label:'Rewards',tab_key:'Rewards',icon:'Gift'},
 {label:'Team',tab_key:'Team',icon:'Users'},
 {label:'Transactions',tab_key:'Transactions',icon:'ChartNoAxesCombined'},
 {label:'Withdraw',tab_key:'Withdraw',icon:'Wallet'},
 {label:'Profile',tab_key:'Profile',icon:'UserRound'},
 {label:'Support',tab_key:'Support',icon:'CircleHelp'}
];
const SECTION_KEYS=DEFAULT_MENU.map(m=>m.tab_key);

function Brand(){return <div className="brand"><div className="brandmark"><Cloud size={29}/><span>₿</span></div><div><b>CloudMint</b><small>Mine · Grow · Earn</small></div></div>}
function Button({children,kind='primary',...props}){return <button className={`btn ${kind}`} {...props}>{children}</button>}

function AdminPanel({tab,setTab}){
  const [users,setUsers]=useState([]);
  const [packs,setPacks]=useState([]);
  const [deps,setDeps]=useState([]);
  const [wds,setWds]=useState([]);
  const [addrs,setAddrs]=useState({deposit_tron:'',deposit_bnb:'',maintenance_mode:'off'});
  const [saving,setSaving]=useState(false);
  const [amsg,setAmsg]=useState('');
  const [loading,setLoading]=useState(true);
  useEffect(()=>{
    let cancelled=false;
    (async()=>{
      setLoading(true);
      try{
        const [u,p,d,w,s]=await Promise.all([
          supabase.from('profiles').select('id,email,username,display_name,role,active_plan,active_plan_since,created_at').order('created_at',{ascending:false}),
          supabase.from('packages').select('*').order('price',{ascending:true}),
          supabase.from('deposit_requests').select('*').order('created_at',{ascending:false}).limit(100),
          supabase.from('withdrawal_requests').select('*').order('created_at',{ascending:false}).limit(100),
          supabase.from('site_settings').select('*')
        ]);
        if(!cancelled){
          setUsers(u.data||[]); setPacks(p.data||[]); setDeps(d.data||[]); setWds(w.data||[]);
          const m={deposit_tron:'',deposit_bnb:'',maintenance_mode:'off'};(s.data||[]).forEach(r=>{m[r.key]=r.value||''});setAddrs(m);
        }
      }catch{ if(!cancelled){ setUsers([]); setPacks([]); } }
      if(!cancelled) setLoading(false);
    })();
    return ()=>{cancelled=true};
  },[]);
  async function saveAddrs(e){
    e.preventDefault(); setSaving(true); setAmsg('');
    try{
      const {error}=await supabase.from('site_settings').upsert([{key:'deposit_tron',value:addrs.deposit_tron.trim()},{key:'deposit_bnb',value:addrs.deposit_bnb.trim()},{key:'maintenance_mode',value:addrs.maintenance_mode||'off'}],{onConflict:'key'});
      if(error)throw error;
      setAmsg('Deposit addresses saved and live on the Deposit page.');
    }catch(err){setAmsg(err.message||'Could not save.')}finally{setSaving(false)}
  }
  async function markReviewed(kind,row){
    try{
      const {error}=await supabase.from(kind==='dep'?'deposit_requests':'withdrawal_requests').update({status:'reviewed'}).eq('id',row.id);
      if(error)throw error;
      if(kind==='dep'){
        setDeps(deps.map(x=>x.id===row.id?{...x,status:'reviewed'}:x));
        const pack=packs.find(p=>Number(p.price)===Number(row.amount));
        if(pack&&row.user_id){
          const stamp=new Date().toISOString();
          const {error:e2}=await supabase.from('profiles').update({active_plan:pack.name,active_plan_since:stamp}).eq('id',row.user_id);
          if(!e2)setUsers(users.map(u=>u.id===row.user_id?{...u,active_plan:pack.name,active_plan_since:stamp}:u));
        }
      }
      else setWds(wds.map(x=>x.id===row.id?{...x,status:'reviewed'}:x));
    }catch(err){setAmsg(err.message||'Could not update. (Run the admin-update SQL first.)')}
  }
  async function setPlan(u,planName){
    try{
      const patch=planName?{active_plan:planName,active_plan_since:new Date().toISOString()}:{active_plan:null,active_plan_since:null};
      const {error}=await supabase.from('profiles').update(patch).eq('id',u.id);
      if(error)throw error;
      setUsers(users.map(x=>x.email===u.email?{...x,...patch}:x));
    }catch(err){setAmsg(err.message||'Could not update plan. (Run the admin-update SQL first.)')}
  }
  async function toggleMaintenance(){
    const next=addrs.maintenance_mode==='on'?'off':'on';
    setSaving(true);setAmsg('');
    try{
      const {error}=await supabase.from('site_settings').upsert({key:'maintenance_mode',value:next},{onConflict:'key'});
      if(error)throw error;
      setAddrs({...addrs,maintenance_mode:next});
      setAmsg('Maintenance mode is now '+next.toUpperCase()+'.');
    }catch(err){setAmsg(err.message||'Could not save.')}finally{setSaving(false)}
  }
  return <div className="dashsection">
    <div className="sectiontitle"><h2>Admin Panel</h2><span>restricted access</span></div>
    {amsg&&<p className="muted" style={{margin:'0 0 12px'}}>{amsg}</p>}
    {loading?<p className="muted">Loading records…</p>:tab==='users'?<div className="infoCard" style={{display:'block',padding:0,overflowX:'auto',WebkitOverflowScrolling:'touch'}}>
      <table style={{width:'100%',borderCollapse:'collapse',fontSize:12,minWidth:760}}>
        <thead><tr style={{textAlign:'left',color:'#9db5d0'}}>
          <th style={{padding:'12px 14px'}}>Email</th><th style={{padding:'12px 14px'}}>Username</th><th style={{padding:'12px 14px'}}>Name</th><th style={{padding:'12px 14px'}}>Role</th><th style={{padding:'12px 14px'}}>Plan</th><th style={{padding:'12px 14px'}}>Joined</th>
        </tr></thead>
        <tbody>{users.map(u=><tr key={u.email} style={{borderTop:'1px solid #12395c'}}>
          <td style={{padding:'11px 14px'}}>{u.email}</td><td style={{padding:'11px 14px'}}>{u.username||'—'}</td><td style={{padding:'11px 14px'}}>{u.display_name||'—'}</td>
          <td style={{padding:'11px 14px'}}><span className="tag" style={u.role==='admin'?{background:'#06443c',color:'#53f6c8'}:{}}>{u.role||'user'}</span></td>
          <td style={{padding:'11px 14px'}}><select value={u.active_plan||''} onChange={e=>setPlan(u,e.target.value)} style={{background:'#0b1e33',color:'#dbe7f5',border:'1px solid #1c3a5e',borderRadius:8,padding:'6px 8px',fontSize:12,maxWidth:130}}>
            <option value="">—</option>
            {packs.map(p=><option key={p.id} value={p.name}>{p.name}</option>)}
          </select></td>
          <td style={{padding:'11px 14px',color:'#9db5d0'}}>{u.created_at?new Date(u.created_at).toLocaleDateString():'—'}</td>
        </tr>)}{users.length===0&&<tr><td colSpan="6" style={{padding:'16px',color:'#9db5d0'}}>No users found.</td></tr>}</tbody>
      </table>
    </div>:tab==='packages'?<PackageManager packs={packs} setPacks={setPacks}/>
    :tab==='deposits'?<div className="infoCard" style={{display:'block',padding:0,overflowX:'auto'}}>
      <table style={{width:'100%',borderCollapse:'collapse',fontSize:12,minWidth:640}}>
        <thead><tr style={{textAlign:'left',color:'#9db5d0'}}>
          <th style={{padding:'12px 14px'}}>Email</th><th style={{padding:'12px 14px'}}>Chain</th><th style={{padding:'12px 14px'}}>Amount</th><th style={{padding:'12px 14px'}}>TX hash</th><th style={{padding:'12px 14px'}}>Status</th><th style={{padding:'12px 14px'}}>Date</th>
        </tr></thead>
        <tbody>{deps.map(d=><tr key={d.id} style={{borderTop:'1px solid #12395c'}}>
          <td style={{padding:'11px 14px'}}>{d.email||'—'}</td><td style={{padding:'11px 14px'}}>{d.chain}</td><td style={{padding:'11px 14px'}}>${d.amount}</td>
          <td style={{padding:'11px 14px',fontFamily:'monospace',fontSize:11}} title={d.tx_hash}>{String(d.tx_hash).slice(0,10)}…{String(d.tx_hash).slice(-6)}</td>
          <td style={{padding:'11px 14px'}}><span className={'badge '+(d.status||'pending')}>{d.status||'pending'}</span>{(d.status||'pending')!=='reviewed'&&<button style={{marginLeft:8,background:'transparent',border:'1px solid #2b5a8f',color:'#9cc8ff',borderRadius:99,padding:'3px 10px',fontSize:10,fontWeight:700,cursor:'pointer'}} onClick={()=>markReviewed('dep',d)}>Mark reviewed</button>}</td>
          <td style={{padding:'11px 14px',color:'#9db5d0'}}>{d.created_at?new Date(d.created_at).toLocaleString():'—'}</td>
        </tr>)}{deps.length===0&&<tr><td colSpan="6" style={{padding:'16px',color:'#9db5d0'}}>No deposit requests.</td></tr>}</tbody>
      </table>
    </div>
    :tab==='withdrawals'?<div className="infoCard" style={{display:'block',padding:0,overflowX:'auto'}}>
      <table style={{width:'100%',borderCollapse:'collapse',fontSize:12,minWidth:640}}>
        <thead><tr style={{textAlign:'left',color:'#9db5d0'}}>
          <th style={{padding:'12px 14px'}}>Email</th><th style={{padding:'12px 14px'}}>Chain</th><th style={{padding:'12px 14px'}}>Amount</th><th style={{padding:'12px 14px'}}>Wallet</th><th style={{padding:'12px 14px'}}>Status</th><th style={{padding:'12px 14px'}}>Date</th>
        </tr></thead>
        <tbody>{wds.map(w=><tr key={w.id} style={{borderTop:'1px solid #12395c'}}>
          <td style={{padding:'11px 14px'}}>{w.email||'—'}</td><td style={{padding:'11px 14px'}}>{w.chain}</td><td style={{padding:'11px 14px'}}>${w.amount}</td>
          <td style={{padding:'11px 14px',fontFamily:'monospace',fontSize:11}} title={w.wallet_address}>{String(w.wallet_address).slice(0,10)}…{String(w.wallet_address).slice(-6)}</td>
          <td style={{padding:'11px 14px'}}><span className={'badge '+(w.status||'pending')}>{w.status||'pending'}</span>{(w.status||'pending')!=='reviewed'&&<button style={{marginLeft:8,background:'transparent',border:'1px solid #2b5a8f',color:'#9cc8ff',borderRadius:99,padding:'3px 10px',fontSize:10,fontWeight:700,cursor:'pointer'}} onClick={()=>markReviewed('wd',w)}>Mark reviewed</button>}</td>
          <td style={{padding:'11px 14px',color:'#9db5d0'}}>{w.created_at?new Date(w.created_at).toLocaleString():'—'}</td>
        </tr>)}{wds.length===0&&<tr><td colSpan="6" style={{padding:'16px',color:'#9db5d0'}}>No withdrawal requests.</td></tr>}</tbody>
      </table>
    </div>
    :tab==='menu'?<MenuManager/>
    :<><form onSubmit={saveAddrs} className="stackform" style={{maxWidth:560}}>
      <div><label>Tron deposit address (USDT · TRC20)</label><input value={addrs.deposit_tron} onChange={e=>setAddrs({...addrs,deposit_tron:e.target.value})} placeholder="T…"/></div>
      <div><label>BNB deposit address (USDT · BEP20)</label><input value={addrs.deposit_bnb} onChange={e=>setAddrs({...addrs,deposit_bnb:e.target.value})} placeholder="0x…"/></div>
      <Button disabled={saving}>{saving?'Saving…':'Save addresses'}</Button>
      {amsg&&<p className="muted">{amsg}</p>}
      <p className="tiny">These addresses appear on the user Deposit page. Leave a field blank to hide that chain.</p>
    </form>
    :<div>
      <div className="sectiontitle" style={{marginTop:22}}><h2>Maintenance mode</h2><span>{addrs.maintenance_mode==='on'?'ON':'OFF'}</span></div>
      <div className="addrbox">
        <small>Website maintenance</small>
        <p className="muted" style={{margin:'10px 0 14px'}}>When ON, the whole public website shows a maintenance page. The admin panel at /admin stays accessible so you can turn it back off.</p>
        <Button kind={addrs.maintenance_mode==='on'?'primary':'outline'} onClick={toggleMaintenance} disabled={saving}>{saving?'Saving…':addrs.maintenance_mode==='on'?'Turn maintenance OFF':'Turn maintenance ON'}</Button>
        {amsg&&<p className="muted" style={{marginTop:10}}>{amsg}</p>}
      </div>
    </div></>}
    <div className="infoCard" style={{marginTop:18}}><ShieldCheck/><div><b>Read-only preview</b><p>The admin view lists account records only. It does not move money, edit rates, approve payouts, or promise returns.</p></div></div>
  </div>;
}

function MenuManager(){
  const [items,setItems]=useState([]);
  const [loading,setLoading]=useState(true);
  const [nLabel,setNLabel]=useState('');
  const [nIcon,setNIcon]=useState('Star');
  const [nType,setNType]=useState('section');
  const [nSection,setNSection]=useState('Support');
  const [nUrl,setNUrl]=useState('');
  const [msg,setMsg]=useState('');
  const load=async()=>{setLoading(true);try{const {data}=await supabase.from('menu_items').select('*').order('position');setItems(data||[])}catch{}setLoading(false)};
  useEffect(()=>{load()},[]);
  const save=async(id,patch)=>{const {error}=await supabase.from('menu_items').update(patch).eq('id',id);if(error)setMsg(error.message);else setItems(items.map(i=>i.id===id?{...i,...patch}:i))};
  const del=async(id)=>{if(!window.confirm('Delete this menu item?'))return;const {error}=await supabase.from('menu_items').delete().eq('id',id);if(error)setMsg(error.message);else setItems(items.filter(i=>i.id!==id))};
  const move=async(item,dir)=>{
    const sorted=[...items].sort((a,b)=>a.position-b.position);
    const ix=sorted.findIndex(i=>i.id===item.id),jx=ix+dir;
    if(ix<0||jx<0||jx>=sorted.length)return;
    const a=sorted[ix],b=sorted[jx];
    await supabase.from('menu_items').update({position:b.position}).eq('id',a.id);
    await supabase.from('menu_items').update({position:a.position}).eq('id',b.id);
    load();
  };
  const add=async(e)=>{
    e.preventDefault();setMsg('');
    if(!nLabel.trim()){setMsg('Enter a label.');return}
    const tab_key=nType==='url'?'url:'+nUrl.trim():nSection;
    if(nType==='url'&&!/^https?:\/\//i.test(nUrl.trim())){setMsg('URL must start with http:// or https://');return}
    const position=items.length?Math.max(...items.map(i=>i.position))+1:1;
    const {error}=await supabase.from('menu_items').insert({label:nLabel.trim(),tab_key,icon:nIcon,position});
    if(error)setMsg(error.message);else{setNLabel('');setNUrl('');setMsg('Menu item added — users see it after reload.');load()}
  };
  return <div>
    {loading?<p className="muted">Loading menu…</p>:<div className="txlist">{items.map(m=><div className="mrow" key={m.id}>
      <div style={{display:'flex',gap:8,alignItems:'center'}}>
        <input defaultValue={m.label} onBlur={e=>{if(e.target.value!==m.label)save(m.id,{label:e.target.value})}} placeholder="Label" style={{flex:1,minWidth:0}}/>
        <label className="tiny" style={{display:'flex',alignItems:'center',gap:6,whiteSpace:'nowrap'}}><input type="checkbox" checked={m.is_visible} onChange={e=>save(m.id,{is_visible:e.target.checked})}/> Show</label>
      </div>
      <div style={{display:'flex',gap:8,flexWrap:'wrap',alignItems:'center'}}>
        <select value={m.icon} onChange={e=>save(m.id,{icon:e.target.value})}>{ICON_NAMES.map(n=><option key={n} value={n}>{n}</option>)}</select>
        {m.tab_key.indexOf('url:')===0
          ?<input defaultValue={m.tab_key.slice(4)} onBlur={e=>{const v='url:'+e.target.value.trim();if(v!==m.tab_key)save(m.id,{tab_key:v})}} placeholder="https://…" style={{flex:1,minWidth:150}}/>
          :<select value={SECTION_KEYS.includes(m.tab_key)?m.tab_key:SECTION_KEYS[0]} onChange={e=>save(m.id,{tab_key:e.target.value})}>{SECTION_KEYS.map(s=><option key={s} value={s}>{s}</option>)}</select>}
        <span style={{display:'flex',gap:5}}>
          <Button kind="outline" onClick={()=>move(m,-1)}>↑</Button>
          <Button kind="outline" onClick={()=>move(m,1)}>↓</Button>
          <Button kind="outline" onClick={()=>del(m.id)}>✕</Button>
        </span>
      </div>
    </div>)}{items.length===0&&<p className="muted">No menu items — add one below.</p>}</div>}
    <div className="sectiontitle" style={{marginTop:22}}><h2>Add menu item</h2></div>
    <form onSubmit={add} className="stackform">
      <div><label>Label</label><input value={nLabel} onChange={e=>setNLabel(e.target.value)} placeholder="e.g. Announcements"/></div>
      <div style={{display:'flex',gap:10,flexWrap:'wrap'}}>
        <div style={{flex:1,minWidth:140}}><label>Icon</label><select value={nIcon} onChange={e=>setNIcon(e.target.value)} style={{width:'100%'}}>{ICON_NAMES.map(n=><option key={n} value={n}>{n}</option>)}</select></div>
        <div style={{flex:1,minWidth:140}}><label>Type</label><select value={nType} onChange={e=>setNType(e.target.value)} style={{width:'100%'}}><option value="section">App section</option><option value="url">Custom link</option></select></div>
      </div>
      {nType==='section'
        ?<div><label>Section</label><select value={nSection} onChange={e=>setNSection(e.target.value)} style={{width:'100%'}}>{SECTION_KEYS.map(s=><option key={s} value={s}>{s}</option>)}</select></div>
        :<div><label>URL</label><input value={nUrl} onChange={e=>setNUrl(e.target.value)} placeholder="https://…"/></div>}
      <Button>Add item</Button>
      {msg&&<p className="muted">{msg}</p>}
      <p className="tiny">New items appear in the user sidebar after they reload. Sections open inside the app; custom links open in a new tab.</p>
    </form>
  </div>;
}

function PackageManager({packs,setPacks}){
  const [msg,setMsg]=useState('');
  const [editing,setEditing]=useState(null);
  const [f,setF]=useState({name:'',price:'',display_rate:'',duration_days:'120',is_active:true});
  const [busy2,setBusy2]=useState(false);
  const startNew=()=>{setEditing('new');setF({name:'',price:'',display_rate:'',duration_days:'120',is_active:true});setMsg('')};
  const startEdit=(p)=>{setEditing(p.id);setF({name:p.name||'',price:String(p.price??''),display_rate:p.display_rate==null?'':String(p.display_rate),duration_days:String(p.duration_days||120),is_active:!!p.is_active});setMsg('')};
  const save=async(e)=>{
    e.preventDefault();setMsg('');
    const price=parseFloat(f.price),rate=f.display_rate.trim()===''?null:parseFloat(f.display_rate),dur=parseInt(f.duration_days,10);
    if(!f.name.trim()||!(price>=0)||!(dur>0)||(rate!==null&&!(rate>=0))){setMsg('Enter a valid name, price, rate and duration.');return}
    const row={name:f.name.trim(),price,display_rate:rate,duration_days:dur,is_active:!!f.is_active};
    setBusy2(true);
    try{
      if(editing==='new'){
        const {data,error}=await supabase.from('packages').insert(row).select().single();
        if(error)throw error;
        setPacks([...packs,data].sort((a,b)=>Number(a.price)-Number(b.price)));
      }else{
        const {error}=await supabase.from('packages').update(row).eq('id',editing);
        if(error)throw error;
        setPacks(packs.map(p=>p.id===editing?{...p,...row}:p));
      }
      setEditing(null);setMsg('Package saved — live on the site.');
    }catch(err){setMsg(err.message||'Could not save.')}finally{setBusy2(false)}
  };
  const toggleActive=async(p)=>{
    const {error}=await supabase.from('packages').update({is_active:!p.is_active}).eq('id',p.id);
    if(error)setMsg(error.message);else setPacks(packs.map(x=>x.id===p.id?{...x,is_active:!p.is_active}:x));
  };
  const del=async(id)=>{
    if(!window.confirm('Delete this package?'))return;
    const {error}=await supabase.from('packages').delete().eq('id',id);
    if(error)setMsg(error.message);else{setPacks(packs.filter(p=>p.id!==id));setMsg('Package deleted.')}
  };
  return <div>
    <div style={{marginBottom:14}}><Button onClick={startNew}>+ Add package</Button></div>
    {editing&&<form onSubmit={save} className="stackform" style={{marginBottom:20}}>
      <div className="sectiontitle"><h2>{editing==='new'?'New package':'Edit package'}</h2></div>
      <div><label>Name</label><input value={f.name} onChange={e=>setF({...f,name:e.target.value})} placeholder="e.g. Starter"/></div>
      <div style={{display:'flex',gap:10,flexWrap:'wrap'}}>
        <div style={{flex:1,minWidth:120}}><label>Price (USD)</label><input inputMode="decimal" value={f.price} onChange={e=>setF({...f,price:e.target.value})} placeholder="50"/></div>
        <div style={{flex:1,minWidth:120}}><label>Illustrative rate %</label><input inputMode="decimal" value={f.display_rate} onChange={e=>setF({...f,display_rate:e.target.value})} placeholder="2.00"/></div>
        <div style={{flex:1,minWidth:120}}><label>Duration (days)</label><input inputMode="numeric" value={f.duration_days} onChange={e=>setF({...f,duration_days:e.target.value})} placeholder="120"/></div>
      </div>
      <label className="tiny" style={{display:'flex',alignItems:'center',gap:8}}><input type="checkbox" checked={f.is_active} onChange={e=>setF({...f,is_active:e.target.checked})}/> Active (visible on site)</label>
      <div style={{display:'flex',gap:8}}><Button disabled={busy2}>{busy2?'Saving…':'Save package'}</Button><Button kind="outline" onClick={()=>setEditing(null)}>Cancel</Button></div>
    </form>}
    <div className="txlist">{packs.map(p=><div className="mrow" key={p.id}>
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',gap:8}}>
        <div><b>{p.name}</b> <span className="tiny">· ${p.price} · {p.display_rate==null?'—':p.display_rate+'%'} · {p.duration_days}d</span></div>
        <span className={'badge '+(p.is_active?'approved':'pending')}>{p.is_active?'active':'hidden'}</span>
      </div>
      <div style={{display:'flex',gap:6,flexWrap:'wrap'}}>
        <Button kind="outline" onClick={()=>startEdit(p)}>Edit</Button>
        <Button kind="outline" onClick={()=>toggleActive(p)}>{p.is_active?'Hide':'Show'}</Button>
        <Button kind="outline" onClick={()=>del(p.id)}>Delete</Button>
      </div>
    </div>)}{packs.length===0&&<p className="muted">No packages yet.</p>}</div>
    {msg&&<p className="muted" style={{marginTop:10}}>{msg}</p>}
    <p className="tiny" style={{marginTop:10}}>Rates are illustrative labels only — packages never credit earnings automatically.</p>
  </div>;
}

function AIMachinePlan({plan,since}){
  const CYCLE=86400000, R=88, CIRC=2*Math.PI*R;
  const dur=Number(plan.dur)||120;
  const [now,setNow]=useState(()=>Date.now());
  const [t0,setT0]=useState(()=>{try{const s=JSON.parse(localStorage.getItem('cm_cycle')||'null');if(s&&s.plan===plan.name&&s.t0)return s.t0;}catch{}return 0;});
  useEffect(()=>{const t=setInterval(()=>setNow(Date.now()),1000);return ()=>clearInterval(t);},[]);
  const elapsed=t0?now-t0:0, done=t0&&elapsed>=CYCLE, prog=t0?Math.min(1,elapsed/CYCLE):0;
  const rem=Math.max(0,CYCLE-elapsed);
  const hh=String(Math.floor(rem/3600000)).padStart(2,'0'),mm=String(Math.floor(rem%3600000/60000)).padStart(2,'0'),ss=String(Math.floor(rem%60000/1000)).padStart(2,'0');
  const sinceMs=since?new Date(since).getTime():0;
  const dayN=sinceMs?Math.max(1,Math.floor((now-sinceMs)/86400000)+1):0;
  const dayProg=sinceMs?Math.min(1,Math.max(0,(now-sinceMs)/(dur*86400000))):0;
  const termDone=dayN>dur;
  const start=()=>{const t=Date.now();setT0(t);setNow(t);try{localStorage.setItem('cm_cycle',JSON.stringify({plan:plan.name,t0:t}));}catch{}};
  return <div className="aimachine">
    <div className="aimachine-glow"/><div className="aimachine-shine"/>
    <div className="aimachine-head"><small>ACTIVE PLAN</small><h2>{plan.name} Plan</h2><span className="badge approved">active</span></div>
    <div className="aimachine-core">
      <div className="aimachine-beam"/>
      <svg className="aimachine-ring" viewBox="0 0 200 200">
        <defs><linearGradient id="aigrad" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#53f6c8"/><stop offset="1" stopColor="#22d3ee"/></linearGradient></defs>
        <circle cx="100" cy="100" r={R} className="aimachine-track"/>
        <circle cx="100" cy="100" r={R} className="aimachine-progress" strokeDasharray={CIRC} strokeDashoffset={CIRC*(1-prog)}/>
      </svg>
      <div className="aimachine-orbit o1"/><div className="aimachine-orbit o2"/>
      <div className="aimachine-orb"><span>{plan.icon||'◆'}</span></div>
      <div className="aimachine-pdot p1"/><div className="aimachine-pdot p2"/><div className="aimachine-pdot p3"/>
    </div>
    <div className="aimachine-count">{done?'00:00:00':hh+':'+mm+':'+ss}</div>
    <small className="aimachine-cycle-label">{!t0?'24-HOUR CYCLE':done?'CYCLE COMPLETE':'CYCLE RUNNING'}</small>
    {sinceMs>0&&<div className="aimachine-term">
      <div className="aimachine-daylabel">{termDone?'PLAN PERIOD COMPLETE':'DAY '+dayN+' OF '+dur}</div>
      <div className="aimachine-daybar"><div className="aimachine-dayfill" style={{width:(dayProg*100).toFixed(2)+'%'}}/></div>
    </div>}
    <div className="aimachine-meta">
      <div><small>Price</small><b>${plan.price}</b></div>
      <div><small>Daily (illustrative)</small><b>{isNaN(Number(plan.price))?'—':(Number(plan.price)/120).toFixed(2)+'%'}</b></div>
      <div><small>Duration</small><b>{plan.dur||120} days</b></div>
    </div>
    {!t0?<Button onClick={start}>Start 24h cycle</Button>
    :done?<><p className="muted">Cycle complete — nothing was earned or credited.</p><Button kind="outline" onClick={start}>Restart cycle</Button></>
    :<p className="muted">Cycle ends in {hh}:{mm}:{ss} — visual tracker only.</p>}
    <p className="tiny" style={{marginTop:12}}>Visual cycle tracker — this timer does not mine, earn, or credit anything.</p>
  </div>;
}

function App(){
  const [page,setPage]=useState(()=>{try{return localStorage.getItem('cm_page')||'home'}catch{return 'home'}});
  const [authMode,setAuthMode]=useState('login');
  const [email,setEmail]=useState('');
  const [otp,setOtp]=useState('');
  const [username,setUsername]=useState('');
  const [profileName,setProfileName]=useState('');
  const [password,setPassword]=useState('');
  const [withdrawPassword,setWithdrawPassword]=useState('');
  const [showPass,setShowPass]=useState(false);
  const [notice,setNotice]=useState('');
  const [busy,setBusy]=useState(false);
  const [session,setSession]=useState(null);
  const [mobileMenu,setMobileMenu]=useState(false);
  const [activeTab,setActiveTab]=useState(()=>{try{return localStorage.getItem('cm_tab')||'Overview'}catch{return 'Overview'}});
  const [authReady,setAuthReady]=useState(false);
  useEffect(()=>{try{localStorage.setItem('cm_page',page)}catch{}},[page]);
  useEffect(()=>{try{localStorage.setItem('cm_tab',activeTab)}catch{}},[activeTab]);
  const [depositAmount,setDepositAmount]=useState('50');
  const [balance,setBalance]=useState(0);
  const [mining,setMining]=useState([]);
  const [admin,setAdmin]=useState(false);
  const [role,setRole]=useState('user');
  const [roleChecked,setRoleChecked]=useState(false);
  const [adminMode,setAdminMode]=useState('login');
  const [menuOpen,setMenuOpen]=useState(typeof window!=='undefined'?window.innerWidth>650:true);
  const [adminTab,setAdminTab]=useState('users');
  const [profile,setProfile]=useState(null);
  const [deposits,setDeposits]=useState([]);
  const [withdrawals,setWithdrawals]=useState([]);
  const [siteAddrs,setSiteAddrs]=useState({TRON:'',BNB:'0x73173d35F5D5d6518EF8d32b65d85Ca7910D2376'});
  const [menuItems,setMenuItems]=useState([]);
  const [maintenance,setMaintenance]=useState(false);
  const [dbPacks,setDbPacks]=useState([]);
  useEffect(()=>{
    if(!supabase)return;
    (async()=>{
      try{
        const {data}=await supabase.from('packages').select('*').eq('is_active',true).order('price');
        if(data&&data.length)setDbPacks(data);
      }catch{}
    })();
  },[]);
  const TONES=['cyan','purple','teal','gold'],PICONS=['◆','⬢','◈','✦','✧'];
  const livePlans=dbPacks.length?dbPacks.map((p,i)=>({name:p.name,price:Number(p.price),rate:(p.display_rate==null?'—':Number(p.display_rate).toFixed(2)+'%'),dur:p.duration_days,tone:TONES[i%4],icon:PICONS[i%5],popular:i===1})):plans;
  useEffect(()=>{
    if(!supabase)return;
    (async()=>{
      try{
        const {data}=await supabase.from('site_settings').select('value').eq('key','maintenance_mode').single();
        if(data)setMaintenance(data.value==='on');
      }catch{}
    })();
  },[]);
  const [depChain,setDepChain]=useState('TRON');
  const [depAmount,setDepAmount]=useState('');
  const [depTx,setDepTx]=useState('');
  const [wdChain,setWdChain]=useState('TRON');
  const [wdAmount,setWdAmount]=useState('');
  const [wdAddr,setWdAddr]=useState('');
  const [editName,setEditName]=useState('');
  const [toast,setToast]=useState('');
  const [simOn,setSimOn]=useState(false);
  const [simPct,setSimPct]=useState(0);
  const CHAINS=[{id:'TRON',name:'Tron',token:'USDT · TRC20'},{id:'BNB',name:'BNB Smart Chain',token:'USDT · BEP20'}];
  const [recovering,setRecovering]=useState(false);
  const [newPass,setNewPass]=useState('');
  const configured=Boolean(supabase);
  const isAdminPath=typeof window!=='undefined'&&window.location.pathname.replace(/\/+$/,'')==='/admin';
  const goAuth=(mode='login')=>{setAuthMode(mode);setNotice('');setRecovering(false);setPage('auth');window.scrollTo(0,0)};
  useEffect(()=>{
    if(!supabase){setAuthReady(true);return}
    (async()=>{
      try{
        const last=parseInt(localStorage.getItem('cm_last_active')||'0',10);
        if(last&&Date.now()-last>24*3600*1000){
          await supabase.auth.signOut();
          try{localStorage.removeItem('cm_last_active');localStorage.setItem('cm_page','home')}catch{}
          setPage('home');
        }
      }catch{}
      try{localStorage.setItem('cm_last_active',String(Date.now()))}catch{}
      const {data}=await supabase.auth.getSession();
      setSession(data.session);
      if(!data.session) setPage(p=>(p==='dashboard'||p==='auth')?'home':p);
      setAuthReady(true);
    })();
    const {data:{subscription}}=supabase.auth.onAuthStateChange((event,s)=>{
      if(event==='PASSWORD_RECOVERY'){ setRecovering(true); setPage('auth'); window.scrollTo(0,0); }
      if(event==='SIGNED_OUT'){ try{localStorage.removeItem('cm_last_active')}catch{} }
      setSession(s);
    });
    return ()=>subscription.unsubscribe();
  },[]);
  useEffect(()=>{
    const bump=()=>{try{const last=parseInt(localStorage.getItem('cm_last_active')||'0',10);if(Date.now()-last>5*60*1000)localStorage.setItem('cm_last_active',String(Date.now()))}catch{}};
    window.addEventListener('pointerdown',bump);window.addEventListener('keydown',bump);
    const iv=setInterval(bump,5*60*1000);
    return ()=>{window.removeEventListener('pointerdown',bump);window.removeEventListener('keydown',bump);clearInterval(iv)};
  },[]);
  useEffect(()=>{if(session && page==='auth' && !recovering)setPage('dashboard')},[session,page,recovering]);
  useEffect(()=>{
    let cancelled=false;
    (async()=>{
      if(!supabase||!session?.user){ if(!cancelled){setRole('user');setRoleChecked(true);} return; }
      try{
        const {data}=await supabase.from('profiles').select('role').eq('id',session.user.id).single();
        if(!cancelled){setRole(data?.role||'user');setRoleChecked(true);}
      }catch{ if(!cancelled){setRole('user');setRoleChecked(true);} }
    })();
    return ()=>{cancelled=true};
  },[session]);
  useEffect(()=>{ if(isAdminPath) setEmail('miamiqueens11@gmail.com'); },[]);
  useEffect(()=>{ if(!toast)return; const t=setTimeout(()=>setToast(''),3200); return ()=>clearTimeout(t); },[toast]);
  const refreshUserData=async()=>{
    if(!supabase||!session?.user)return;
    try{
      const uid=session.user.id;
      const [pr,d,w,pk]=await Promise.all([
        supabase.from('profiles').select('*').eq('id',uid).single(),
        supabase.from('deposit_requests').select('*').eq('user_id',uid).order('created_at',{ascending:false}),
        supabase.from('withdrawal_requests').select('*').eq('user_id',uid).order('created_at',{ascending:false}),
        supabase.from('packages').select('*').eq('is_active',true).order('price')
      ]);
      if(pr.data){setProfile(pr.data);setEditName(pr.data.display_name||'')}
      setDeposits(d.data||[]);setWithdrawals(w.data||[]);
      if(pk.data&&pk.data.length)setDbPacks(pk.data);
    }catch{/* keep defaults */}
  };
  useEffect(()=>{ if(session?.user&&['Overview','Deposit instructions','Withdraw','Packages','My Plans','Transactions','Profile'].includes(activeTab))refreshUserData(); },[activeTab]);
  useEffect(()=>{
    const onVisible=()=>{ if(document.visibilityState==='visible')refreshUserData(); };
    document.addEventListener('visibilitychange',onVisible);
    window.addEventListener('focus',onVisible);
    return ()=>{document.removeEventListener('visibilitychange',onVisible);window.removeEventListener('focus',onVisible);};
  },[session,activeTab]);
  useEffect(()=>{
    let cancelled=false;
    (async()=>{
      if(!supabase||!session?.user)return;
      try{
        const uid=session.user.id;
        const [pr,d,w,s,mn]=await Promise.all([
          supabase.from('profiles').select('*').eq('id',uid).single(),
          supabase.from('deposit_requests').select('*').eq('user_id',uid).order('created_at',{ascending:false}),
          supabase.from('withdrawal_requests').select('*').eq('user_id',uid).order('created_at',{ascending:false}),
          supabase.from('site_settings').select('*'),
          supabase.from('menu_items').select('*').eq('is_visible',true).order('position')
        ]);
        if(cancelled)return;
        if(pr.data){setProfile(pr.data);setEditName(pr.data.display_name||'')}
        setDeposits(d.data||[]);setWithdrawals(w.data||[]);
        if(mn.data&&mn.data.length)setMenuItems(mn.data);
        const m={TRON:'',BNB:''};(s.data||[]).forEach(r=>{if(r.key==='deposit_tron')m.TRON=r.value||'';if(r.key==='deposit_bnb')m.BNB=r.value||''});setSiteAddrs(m);
      }catch{/* keep defaults */}
    })();
    return ()=>{cancelled=true};
  },[session]);
  useEffect(()=>{ if(!simOn)return; if(simPct>=100){setSimOn(false);return;} const t=setTimeout(()=>setSimPct(p=>Math.min(100,p+4)),150); return ()=>clearTimeout(t); },[simOn,simPct]);
  const copyText=async(t,label)=>{ try{await navigator.clipboard.writeText(t);setToast((label||'Copied')+' to clipboard.')}catch{setToast('Copy failed — long-press the text to copy.')} };
  async function submitDeposit(e){
    e.preventDefault(); if(!supabase||!session?.user)return;
    const amt=parseFloat(depAmount); if(!(amt>0)){setToast('Enter a valid USD amount.');return}
    setBusy(true);
    try{
      const {error}=await supabase.from('deposit_requests').insert({user_id:session.user.id,email:session.user.email,chain:depChain,amount:amt,tx_hash:depTx.trim()||null});
      if(error)throw error;
      setDepAmount('');setDepTx('');setToast('Deposit request submitted — pending manual review.');
      const {data}=await supabase.from('deposit_requests').select('*').eq('user_id',session.user.id).order('created_at',{ascending:false});
      setDeposits(data||[]);
    }catch(err){setToast(err.message||'Could not submit deposit.')}finally{setBusy(false)}
  }
  async function submitWithdraw(e){
    e.preventDefault(); if(!supabase||!session?.user)return;
    const amt=parseFloat(wdAmount); if(!(amt>0)){setToast('Enter a valid USD amount.');return}
    if(!wdAddr.trim()){setToast('Enter your wallet address.');return}
    setBusy(true);
    try{
      const {error}=await supabase.from('withdrawal_requests').insert({user_id:session.user.id,email:session.user.email,chain:wdChain,amount:amt,wallet_address:wdAddr.trim()});
      if(error)throw error;
      setWdAmount('');setWdAddr('');setToast('Withdrawal request submitted — pending manual review.');
      const {data}=await supabase.from('withdrawal_requests').select('*').eq('user_id',session.user.id).order('created_at',{ascending:false});
      setWithdrawals(data||[]);
    }catch(err){setToast(err.message||'Could not submit withdrawal.')}finally{setBusy(false)}
  }
  async function saveDisplayName(e){
    e.preventDefault(); if(!supabase||!session?.user)return;
    setBusy(true);
    try{
      const {error}=await supabase.from('profiles').update({display_name:editName.trim()}).eq('id',session.user.id);
      if(error)throw error;
      setProfile({...profile,display_name:editName.trim()});setToast('Profile updated.');
    }catch(err){setToast(err.message||'Could not update profile.')}finally{setBusy(false)}
  }
  function TabBody(){
    const depAddr=siteAddrs[depChain]||'';
    const depInfo=CHAINS.find(x=>x.id===depChain)||CHAINS[0];
    const wdInfo=CHAINS.find(x=>x.id===wdChain)||CHAINS[0];
    const refCode=session?.user?session.user.id.slice(0,8):'';
    const txs=[...deposits.map(d=>({id:d.id,kind:'Deposit',amt:d.amount,chain:d.chain,status:d.status,created_at:d.created_at,sub:(d.tx_hash?String(d.tx_hash).slice(0,12)+'… · ':'')+d.chain})),...withdrawals.map(w=>({id:w.id,kind:'Withdrawal',amt:w.amount,chain:w.chain,status:w.status,created_at:w.created_at,sub:w.chain+' · '+String(w.wallet_address).slice(0,10)+'…'}))].sort((a,b)=>new Date(b.created_at)-new Date(a.created_at));
    if(activeTab==='Deposit instructions')return <div className="tabwrap">
      <div className="sectiontitle"><h2>Deposit instructions</h2><span>manual review</span></div>
      <div className="infoCard"><Wallet/><div><b>How deposits work</b><p>Send USDT to the address of your chosen chain, then paste the transaction hash below. Every request is recorded as <b>pending</b> and reviewed manually — nothing is credited automatically.</p></div></div>
      <div className="chainrow">{CHAINS.map(c=><button key={c.id} className={'chaincard'+(depChain===c.id?' selected':'')} onClick={()=>setDepChain(c.id)}><b>{c.name}</b><small>{c.token}</small></button>)}</div>
      <div className="addrbox">
        <small>Deposit address · {depInfo.name} ({depInfo.token})</small>
        {depAddr?<><p className="addrtext">{depAddr}</p><Button kind="outline" onClick={()=>copyText(depAddr,'Address copied')}><Copy size={15}/> Copy address</Button></>:<p className="muted">This chain is being configured — contact support for the current address.</p>}
      </div>
      <form onSubmit={submitDeposit} className="stackform">
        <div><label>Amount (USD)</label><input inputMode="decimal" value={depAmount} onChange={e=>setDepAmount(e.target.value)} placeholder="e.g. 100"/></div>
        <div><label>Transaction hash</label><input value={depTx} onChange={e=>setDepTx(e.target.value)} placeholder="Paste TX hash from your wallet"/></div>
        <Button disabled={busy}>{busy?'Submitting…':'Submit deposit request'}</Button>
      </form>
      <div className="sectiontitle" style={{marginTop:26}}><h2>My deposits</h2></div>
      <div className="txlist">{deposits.map(d=><div className="txrow" key={d.id}><div><b>${d.amount} · {d.chain}</b><small>{d.tx_hash?String(d.tx_hash).slice(0,14)+'… · ':''}{d.created_at?new Date(d.created_at).toLocaleString():''}</small></div><span className={'badge '+d.status}>{d.status}</span></div>)}{deposits.length===0&&<p className="muted">No deposits yet.</p>}</div>
    </div>;
    if(activeTab==='Withdraw')return <div className="tabwrap">
      <div className="sectiontitle"><h2>Withdraw</h2><span>manual review</span></div>
      <div className="infoCard"><Wallet/><div><b>How withdrawals work</b><p>Enter the amount and the wallet address that should receive it. Every request is recorded as <b>pending</b> — payouts are processed manually, never automatically.</p></div></div>
      <div className="chainrow">{CHAINS.map(c=><button key={c.id} className={'chaincard'+(wdChain===c.id?' selected':'')} onClick={()=>setWdChain(c.id)}><b>{c.name}</b><small>{c.token}</small></button>)}</div>
      <form onSubmit={submitWithdraw} className="stackform">
        <div><label>Amount (USD)</label><input inputMode="decimal" value={wdAmount} onChange={e=>setWdAmount(e.target.value)} placeholder="e.g. 50"/></div>
        <div><label>Your {wdInfo.name} wallet address</label><input value={wdAddr} onChange={e=>setWdAddr(e.target.value)} placeholder={wdChain==='TRON'?'T…':'0x…'}/></div>
        <Button disabled={busy}>{busy?'Submitting…':'Submit withdrawal request'}</Button>
      </form>
      <div className="sectiontitle" style={{marginTop:26}}><h2>My withdrawals</h2></div>
      <div className="txlist">{withdrawals.map(w=><div className="txrow" key={w.id}><div><b>${w.amount} · {w.chain}</b><small>{String(w.wallet_address).slice(0,14)}… · {w.created_at?new Date(w.created_at).toLocaleString():''}</small></div><span className={'badge '+w.status}>{w.status}</span></div>)}{withdrawals.length===0&&<p className="muted">No withdrawals yet.</p>}</div>
    </div>;
    if(activeTab==='Packages')return <div className="tabwrap">
      <div className="sectiontitle"><h2>Packages</h2><span>120-day duration</span></div>
      <div className="plangrid">{livePlans.map(p=><div className={`plan ${p.tone}`} key={p.name}><div className="planicon">{p.icon}</div><h3>{p.name} Plan</h3><b className="price">${p.price}</b><small>Illustrative daily rate: {p.rate}</small><small>Duration: {p.dur||120} days</small><Button kind="outline" onClick={()=>{setDepAmount(String(p.price));setActiveTab('Deposit instructions');window.scrollTo(0,0)}}>Deposit to activate</Button></div>)}</div>
      <div className="infoCard" style={{marginTop:18}}><ShieldCheck/><div><b>Transparent notice</b><p>Displayed prices and rates are illustrative. A deposit does not automatically activate anything — activation is confirmed manually after review.</p></div></div>
    </div>;
    if(activeTab==='My Plans')return <div className="tabwrap">
      <div className="sectiontitle"><h2>My Plans</h2></div>
      {profile?.active_plan?<AIMachinePlan plan={livePlans.find(p=>p.name===profile.active_plan)||{name:profile.active_plan,price:'—',rate:'—',dur:120,tone:'cyan',icon:'◆'}} since={profile?.active_plan_since}/>
      :<div className="placeholder" style={{marginTop:0}}><div className="bigicon"><Package size={36}/></div><h2>No active plans</h2><p>You don't have any active plans yet. Plans are activated manually after your deposit request is reviewed.</p><Button kind="outline" onClick={()=>setActiveTab('Packages')}>View packages</Button></div>}
    </div>;
    if(activeTab==='Mining cycles')return <div className="tabwrap">
      <div className="sectiontitle"><h2>Mining cycles</h2><span>visual simulation</span></div>
      <div className="infoCard"><Zap/><div><b>Visual simulation only</b><p>This animation is a visual demonstration. It does not mine, earn, or credit anything to your account.</p></div></div>
      <div className="simbox">
        <div className="simbar"><div className="simfill" style={{width:simPct+'%'}}/></div>
        <p className="muted">{simOn?('Simulating… '+simPct+'%'):(simPct>=100?'Simulation complete — nothing was earned or credited.':'Press start to run the visual simulation.')}</p>
        <Button onClick={()=>{setSimPct(0);setSimOn(true)}} disabled={simOn}>{simOn?'Running…':'Start simulation'}</Button>
      </div>
    </div>;
    if(activeTab==='Reinvest')return <div className="tabwrap">
      <div className="sectiontitle"><h2>Reinvest</h2></div>
      <div className="placeholder" style={{marginTop:0}}><div className="bigicon"><Activity size={36}/></div><h2>Not available</h2><p>Reinvest is disabled in this preview. Balances shown here are illustrative and nothing is credited automatically.</p><Button kind="outline" onClick={()=>setActiveTab('Overview')}>Back to overview</Button></div>
    </div>;
    if(activeTab==='Rewards')return <div className="tabwrap">
      <div className="sectiontitle"><h2>Rewards</h2><span>illustrative</span></div>
      <div className="infoCard"><Gift/><div><b>Illustrative thresholds</b><p>These reward levels are examples shown for design purposes — they are not active offers and nothing is paid out automatically.</p></div></div>
      <div className="txlist">{rewardRows.map(r=><div className="txrow" key={r.members}><div><b>{r.members} team members</b><small>Illustrative reward level</small></div><b className="rwd">${r.reward}</b></div>)}</div>
    </div>;
    if(activeTab==='Team')return <div className="tabwrap">
      <div className="sectiontitle"><h2>Team</h2><span>display only</span></div>
      <div className="infoCard"><Users/><div><b>Your referral code</b><p>Share this code with others. Referral tracking shown here is display-only.</p></div></div>
      <div className="addrbox"><small>Referral code</small><p className="addrtext" style={{fontSize:24,letterSpacing:3}}>{refCode||'Login to see your code.'}</p>{refCode&&<Button kind="outline" onClick={()=>copyText(refCode,'Referral code copied')}><Copy size={15}/> Copy code</Button>}</div>
      <div className="stats" style={{marginTop:18}}><div className="stat"><Users/><small>Team members</small><b>0</b></div></div>
    </div>;
    if(activeTab==='Transactions')return <div className="tabwrap">
      <div className="sectiontitle"><h2>Transactions</h2><span>{txs.length} records</span></div>
      <div className="txlist">{txs.map(t=><div className="txrow" key={t.kind+t.id}><div><b>{t.kind} · ${t.amt}</b><small>{t.sub} · {t.created_at?new Date(t.created_at).toLocaleString():''}</small></div><span className={'badge '+t.status}>{t.status}</span></div>)}{txs.length===0&&<p className="muted">No transactions yet.</p>}</div>
    </div>;
    if(activeTab==='Profile')return <div className="tabwrap">
      <div className="sectiontitle"><h2>Profile</h2></div>
      <div className="addrbox"><small>Email</small><p className="addrtext">{session?.user?.email||'—'}</p></div>
      <div className="addrbox"><small>Username</small><p className="addrtext">{profile?.username||'—'}</p></div>
      <form onSubmit={saveDisplayName} className="stackform">
        <div><label>Display name</label><input value={editName} onChange={e=>setEditName(e.target.value)} placeholder="Your name"/></div>
        <Button disabled={busy}>{busy?'Saving…':'Save profile'}</Button>
      </form>
    </div>;
    if(activeTab==='Support')return <div className="tabwrap">
      <div className="sectiontitle"><h2>Support</h2></div>
      <div className="infoCard"><CircleHelp/><div><b>Need help?</b><p>Reach the CloudMint team on the official channels below.</p></div></div>
      <div className="supportrow">
        <a className="btn tg" href="https://t.me/Jabid12" target="_blank" rel="noreferrer"><Send size={15}/> Telegram</a>
        <a className="btn wa" href="https://whatsapp.com/channel/0029VbC09FZHgZWWEZHBCz3P" target="_blank" rel="noreferrer"><MessageCircle size={15}/> WhatsApp</a>
      </div>
    </div>;
    return <div className="tabwrap"><div className="placeholder" style={{marginTop:0}}><div className="bigicon"><Settings size={36}/></div><h2>{activeTab}</h2><p>This section is coming soon.</p><Button kind="outline" onClick={()=>setActiveTab('Overview')}>Back to overview</Button></div></div>;
  }
  const signOut=async()=>{if(supabase)await supabase.auth.signOut();setSession(null);setAdmin(false);setRole('user');setRoleChecked(false);setRecovering(false);setAdminMode('login');setPage('home')};
  async function sendOtp(e){
    e?.preventDefault();setNotice('');
    if(!email.trim()){setNotice('Please enter your email address.');return}
    if(!configured){setNotice('Demo preview: add Supabase URL and publishable key in .env to enable email OTP.');return}
    setBusy(true);
    try{
      const {error}=await supabase.auth.signInWithOtp({email:email.trim(),options:{shouldCreateUser:authMode==='register-otp'}});
      if(error)throw error;
      setNotice('Verification code sent. Check your email, including Spam/Junk.');
      setAuthMode('verify');
    }catch(err){setNotice(err.message||'Could not send code. Check Supabase email settings.')}finally{setBusy(false)}
  }
  async function verifyOtpCode(mail,code){
    let lastErr=null;
    for(const t of ['email','signup']){
      const {data,error}=await supabase.auth.verifyOtp({email:mail.trim(),token:code,type:t});
      if(!error)return data;
      lastErr=error;
    }
    throw lastErr;
  }
  async function verifyOtp(e){
    e.preventDefault();setNotice('');
    if(!configured){setNotice('Demo preview only. Configure Supabase to verify email codes.');return}
    if(!/^[0-9]{6,8}$/.test(otp)){setNotice('Enter the 6–8 digit code from your email.');return}
    setBusy(true);
    try{
      const data=await verifyOtpCode(email,otp);
      if(data.user){
        await supabase.from('profiles').upsert({id:data.user.id,email:email.trim(),username:username||email.split('@')[0],display_name:profileName||username||email.split('@')[0]},{onConflict:'id'});
      }
      setNotice('Email verified successfully.');setPage('dashboard');
    }catch(err){setNotice(err.message||'Code verification failed.')}finally{setBusy(false)}
  }
  async function passwordLogin(e){
    e.preventDefault();setNotice('');
    if(!configured){setNotice('Demo preview: connect Supabase to enable sign-in.');return}
    setBusy(true);
    try{
      const {data,error}=await supabase.auth.signInWithPassword({email:email.trim(),password});
      if(error)throw error;
      if(data.user){
        await supabase.from('profiles').upsert({id:data.user.id,email:email.trim(),username:email.trim().split('@')[0]},{onConflict:'id',ignoreDuplicates:true});
      }
      setPage('dashboard');
    }catch(err){setNotice(err.message||'Login failed.')}finally{setBusy(false)}
  }
  async function finishProfile(e){
    e.preventDefault();setNotice('');
    if(!configured){setNotice('Demo preview: connect Supabase before creating an account.');return}
    if(password.length<8){setNotice('Use a password with at least 8 characters.');return}
    setBusy(true);
    try{
      const {data:{user}}=await supabase.auth.getUser();
      if(!user)throw new Error('Verify your email first, then continue.');
      const {error}=await supabase.from('profiles').upsert({id:user.id,email:user.email,username,display_name:profileName},{onConflict:'id'});
      if(error)throw error;
      setNotice('Profile saved. For security, withdrawal PIN/password setup must be implemented server-side before real withdrawals are enabled.');
      setPage('dashboard');
    }catch(err){setNotice(err.message||'Could not save profile.')}finally{setBusy(false)}
  }
  async function sendReset(e){
    e.preventDefault();setNotice('');
    if(!email.trim()){setNotice('Please enter your email address.');return}
    if(!configured){setNotice('Demo preview: connect Supabase to enable password reset.');return}
    setBusy(true);
    try{
      const {error}=await supabase.auth.resetPasswordForEmail(email.trim(),{redirectTo:window.location.origin+'/'});
      if(error)throw error;
      setNotice('Password reset link sent. Check your email, including Spam/Junk.');
    }catch(err){setNotice(err.message||'Could not send reset link. Check Supabase email settings.')}finally{setBusy(false)}
  }
  async function setNewPassword(e){
    e.preventDefault();setNotice('');
    if(newPass.length<8){setNotice('Use a password with at least 8 characters.');return}
    if(!configured){setNotice('Demo preview: connect Supabase to update your password.');return}
    setBusy(true);
    try{
      const {error}=await supabase.auth.updateUser({password:newPass});
      if(error)throw error;
      setRecovering(false);setNewPass('');setPassword('');
      try{window.history.replaceState(null,'',window.location.pathname)}catch{}
      setNotice('Password updated successfully. Please log in with your new password.');
      setAuthMode('login');setPage('auth');window.scrollTo(0,0);
    }catch(err){setNotice(err.message||'Could not update password. The reset link may have expired.')}finally{setBusy(false)}
  }
  async function adminPasswordLogin(e){
    e.preventDefault();setNotice('');
    if(!configured){setNotice('Demo preview: connect Supabase to enable sign-in.');return}
    setBusy(true);
    try{
      const {data,error}=await supabase.auth.signInWithPassword({email:email.trim(),password});
      if(error)throw error;
      if(data.user){
        await supabase.from('profiles').upsert({id:data.user.id,email:email.trim(),username:email.trim().split('@')[0]},{onConflict:'id',ignoreDuplicates:true});
      }
    }catch(err){setNotice(err.message||'Login failed.')}finally{setBusy(false)}
  }
  async function adminSendOtp(e){
    e.preventDefault();setNotice('');
    if(!email.trim()){setNotice('Please enter your email address.');return}
    if(!configured){setNotice('Demo preview: add Supabase URL and publishable key in .env to enable email OTP.');return}
    setBusy(true);
    try{
      const {error}=await supabase.auth.signInWithOtp({email:email.trim(),options:{shouldCreateUser:false}});
      if(error)throw error;
      setNotice('Verification code sent. Check your email, including Spam/Junk.');
      setAdminMode('verify');
    }catch(err){setNotice(err.message||'Could not send code. Check Supabase email settings.')}finally{setBusy(false)}
  }
  async function adminVerifyOtp(e){
    e.preventDefault();setNotice('');
    if(!configured){setNotice('Demo preview only. Configure Supabase to verify email codes.');return}
    if(!/^[0-9]{6,8}$/.test(otp)){setNotice('Enter the 6–8 digit code from your email.');return}
    setBusy(true);
    try{
      const data=await verifyOtpCode(email,otp);
      setAdminMode('newpass');setNotice('Code verified. Set a new password below.');
    }catch(err){setNotice(err.message||'Code verification failed.')}finally{setBusy(false)}
  }
  async function adminSetPass(e){
    e.preventDefault();setNotice('');
    if(newPass.length<8){setNotice('Use a password with at least 8 characters.');return}
    if(!configured){setNotice('Demo preview: connect Supabase to update your password.');return}
    setBusy(true);
    try{
      const {error}=await supabase.auth.updateUser({password:newPass});
      if(error)throw error;
      setNewPass('');setPassword('');setAdminMode('login');
      setNotice('Password updated successfully. You are logged in as admin.');
    }catch(err){setNotice(err.message||'Could not update password.')}finally{setBusy(false)}
  }
  function SideNav({onNavigate,open,onClose}){
    const menu=menuItems.length?menuItems:DEFAULT_MENU;
    const go=(m)=>{
      if(m.tab_key.indexOf('url:')===0){window.open(m.tab_key.slice(4),'_blank');return}
      setActiveTab(m.tab_key);onNavigate('dashboard');
    };
    return <aside className={'side'+(open?' open':'')}><Brand/><button className="drawerClose" onClick={onClose} aria-label="Close menu"><X/></button>
      {menu.map(m=>{const I=ICONS[m.icon]||CircleHelp;return <button className={activeTab===m.tab_key&&page==='dashboard'?'selected':''} onClick={()=>go(m)} key={m.id||m.tab_key}><I/>{m.label}</button>})}
      <div className="salary"><CalendarDays/>Monthly Salary<small>Coming Soon</small></div>
      <button onClick={signOut}><LogOut/>Log out</button>
    </aside>;
  }
  const authContent=()=>{
    if(authMode==='register-otp')return <form onSubmit={sendOtp} className="authform"><h2>Create your account</h2><p className="muted">Enter your email and we’ll send a verification code.</p><label>Email address</label><div className="inputwrap"><Mail/><input type="email" value={email} onChange={e=>setEmail(e.target.value)} placeholder="you@example.com" required/></div><Button disabled={busy}>{busy?'Sending…':'Send OTP'}</Button><p className="switch">Already registered? <a onClick={()=>goAuth('login')}>Login</a></p></form>;
    if(authMode==='verify')return <form onSubmit={verifyOtp} className="authform"><h2>Verify your email</h2><p className="muted">Enter the 6–8 digit code sent to <b>{email}</b>.</p><label>Verification code</label><div className="inputwrap"><ShieldCheck/><input inputMode="numeric" maxLength="8" value={otp} onChange={e=>setOtp(e.target.value.replace(/\D/g,''))} placeholder="12345678" required/></div><Button disabled={busy}>{busy?'Verifying…':'Verify code'}</Button><p className="switch"><a onClick={()=>setAuthMode('register-otp')}>Change email / resend code</a></p></form>;
    if(authMode==='profile')return <form onSubmit={finishProfile} className="authform"><h2>Set up your profile</h2><p className="muted">Your email has been verified. Finish your account details.</p><label>Username</label><div className="inputwrap"><UserRound/><input value={username} onChange={e=>setUsername(e.target.value)} required minLength="3" placeholder="Choose a username"/></div><label>Profile name</label><div className="inputwrap"><UserRound/><input value={profileName} onChange={e=>setProfileName(e.target.value)} required placeholder="Your display name"/></div><label>Account password</label><div className="inputwrap"><LockKeyhole/><input type={showPass?'text':'password'} value={password} onChange={e=>setPassword(e.target.value)} minLength="8" required placeholder="At least 8 characters"/><button type="button" className="iconbtn" onClick={()=>setShowPass(!showPass)}>{showPass?<EyeOff/>:<Eye/>}</button></div><label>Withdrawal password</label><div className="inputwrap"><LockKeyhole/><input type="password" value={withdrawPassword} onChange={e=>setWithdrawPassword(e.target.value)} minLength="8" required placeholder="Use a different password"/></div><p className="tiny">Never reuse your account password. Withdrawal credentials must be securely hashed and verified on the server before live payouts are enabled.</p><Button disabled={busy}>{busy?'Saving…':'Complete registration'}</Button></form>;
    if(authMode==='forgot')return <form onSubmit={sendReset} className="authform"><h2>Reset your password</h2><p className="muted">Enter your account email and we’ll send you a reset link.</p><label>Email address</label><div className="inputwrap"><Mail/><input type="email" value={email} onChange={e=>setEmail(e.target.value)} placeholder="you@example.com" required/></div><Button disabled={busy}>{busy?'Sending…':'Send reset link'}</Button><p className="switch"><a onClick={()=>goAuth('login')}>Back to login</a></p></form>;
    return <form onSubmit={passwordLogin} className="authform"><h2>Welcome back</h2><p className="muted">Log in to your CloudMint account.</p><label>Email address</label><div className="inputwrap"><Mail/><input type="email" value={email} onChange={e=>setEmail(e.target.value)} placeholder="you@example.com" required/></div><label>Password</label><div className="inputwrap"><LockKeyhole/><input type={showPass?'text':'password'} value={password} onChange={e=>setPassword(e.target.value)} placeholder="Your password" required/><button type="button" className="iconbtn" onClick={()=>setShowPass(!showPass)}>{showPass?<EyeOff/>:<Eye/>}</button></div><div className="authlinks"><a onClick={()=>goAuth('forgot')}>Forgot password?</a><a onClick={()=>goAuth('register-otp')}>Register with email OTP</a></div><Button>Login securely</Button><p className="switch">New to CloudMint? <a onClick={()=>goAuth('register-otp')}>Create account</a></p></form>
  };
  const authVisual=<div className="authvisual"><div className="orb"><Cloud size={90}/><span>₿</span></div><h1>Welcome to <em>CloudMint</em></h1><p>Mine · Grow · Earn</p><div className="feature"><ShieldCheck/> Secure authentication</div><div className="feature"><Mail/> Email verification</div><div className="feature"><LockKeyhole/> Protected account access</div></div>;
  if(!authReady&&!isAdminPath)return <div className="authpage"><header className="topbar"><Brand/></header><div className="authstage"><div className="authcard"><p className="muted">Loading your session…</p></div></div></div>;
  if(recovering)return <div className="authpage"><header className="topbar"><Brand/></header><div className="authstage">{authVisual}<div className="authcard"><form onSubmit={setNewPassword} className="authform"><h2>Set a new password</h2><p className="muted">Choose a new password for your account.</p><label>New password</label><div className="inputwrap"><KeyRound/><input type={showPass?'text':'password'} value={newPass} onChange={e=>setNewPass(e.target.value)} minLength="8" required placeholder="At least 8 characters"/><button type="button" className="iconbtn" onClick={()=>setShowPass(!showPass)}>{showPass?<EyeOff/>:<Eye/>}</button></div><Button disabled={busy}>{busy?'Saving…':'Update password'}</Button></form>{notice&&<div className="notice"><AlertTriangle size={16}/>{notice}</div>}</div></div></div>;
  if(page==='auth')return <div className="authpage"><header className="topbar"><a onClick={()=>setPage('home')}><Brand/></a><a className="navlink" onClick={()=>setPage('home')}>Back to home</a></header><div className="authstage">{authVisual}<div className="authcard">{authContent()}{notice&&<div className="notice"><AlertTriangle size={16}/>{notice}</div>}{!configured&&<p className="tiny">UI preview mode — auth becomes active after Supabase setup.</p>}</div></div></div>;
  if(isAdminPath){
    const isAdmin=!!(session&&roleChecked&&role==='admin');
    if(isAdmin){
      const atabs=[['users','Users',Users],['packages','Packages',Package],['deposits','Deposits',Wallet],['withdrawals','Withdrawals',Wallet],['settings','Settings',Settings],['menu','Menu',Menu]];
      return <div className={'appdash'+(menuOpen?'':' menuClosed')}>
        <div className={'drawerBackdrop'+(menuOpen?' open':'')} onClick={()=>setMenuOpen(false)}/>
        <aside className={'side'+(menuOpen?' open':'')}>
          <Brand/><button className="drawerClose" onClick={()=>setMenuOpen(false)} aria-label="Close menu"><X/></button>
          {atabs.map(([k,l,I])=><button className={adminTab===k?'selected':''} onClick={()=>{setAdminTab(k);if(typeof window!=='undefined'&&window.innerWidth<=650)setMenuOpen(false)}} key={k}><I/>{l}</button>)}
          <button onClick={signOut}><LogOut/>Log out</button>
        </aside>
        <main className="dashmain">
          <div className="dashTopbar"><button className="hamburger" onClick={()=>setMenuOpen(!menuOpen)} aria-label="Open menu"><Menu/></button><Brand/></div>
          <div className="dashhead"><div><small>ADMINISTRATION</small><h1>Admin Panel</h1></div><div className="userpill" style={{maxWidth:'none'}}><span className="statusdot"/>{session?.user?.email||'Admin'}</div></div>
          <AdminPanel tab={adminTab} setTab={setAdminTab}/>
        </main>
      </div>;
    }
    if(session&&!roleChecked)return <div className="authpage"><header className="topbar"><Brand/></header><div className="authstage">{authVisual}<div className="authcard"><p className="muted">Checking access…</p></div></div></div>;
    if(session&&roleChecked)return <div className="authpage"><header className="topbar"><Brand/></header><div className="authstage">{authVisual}<div className="authcard"><div className="placeholder" style={{marginTop:0}}><div className="bigicon"><ShieldCheck size={36}/></div><h2>Not authorized</h2><p>This area is restricted to administrators.</p><Button kind="outline" onClick={signOut}>Log out</Button></div>{notice&&<div className="notice"><AlertTriangle size={16}/>{notice}</div>}</div></div></div>;
    return <div className="authpage"><header className="topbar"><Brand/></header><div className="authstage">{authVisual}<div className="authcard">
      {adminMode==='login'&&<form onSubmit={adminPasswordLogin} className="authform"><h2>Admin login</h2><p className="muted">Restricted area. Authorized administrators only.</p><label>Email address</label><div className="inputwrap"><Mail/><input type="email" value={email} onChange={e=>setEmail(e.target.value)} placeholder="admin@example.com" required/></div><label>Password</label><div className="inputwrap"><LockKeyhole/><input type={showPass?'text':'password'} value={password} onChange={e=>setPassword(e.target.value)} placeholder="Your password" required/><button type="button" className="iconbtn" onClick={()=>setShowPass(!showPass)}>{showPass?<EyeOff/>:<Eye/>}</button></div><div className="authlinks"><a onClick={()=>{setAdminMode('forgot');setNotice('')}}>Forgot password?</a></div><Button disabled={busy}>{busy?'Signing in…':'Login'}</Button></form>}
      {adminMode==='forgot'&&<form onSubmit={adminSendOtp} className="authform"><h2>Reset admin password</h2><p className="muted">Enter your admin email and we’ll send a verification code.</p><label>Email address</label><div className="inputwrap"><Mail/><input type="email" value={email} onChange={e=>setEmail(e.target.value)} placeholder="admin@example.com" required/></div><Button disabled={busy}>{busy?'Sending…':'Send OTP'}</Button><p className="switch"><a onClick={()=>{setAdminMode('login');setNotice('')}}>Back to login</a></p></form>}
      {adminMode==='verify'&&<form onSubmit={adminVerifyOtp} className="authform"><h2>Verify code</h2><p className="muted">Enter the 6–8 digit code sent to <b>{email}</b>.</p><label>Verification code</label><div className="inputwrap"><ShieldCheck/><input inputMode="numeric" maxLength="8" value={otp} onChange={e=>setOtp(e.target.value.replace(/\D/g,''))} placeholder="12345678" required/></div><Button disabled={busy}>{busy?'Verifying…':'Verify code'}</Button><p className="switch"><a onClick={()=>{setAdminMode('forgot');setNotice('')}}>Resend code</a></p></form>}
      {adminMode==='newpass'&&<form onSubmit={adminSetPass} className="authform"><h2>Set a new password</h2><p className="muted">Choose a new password for the admin account.</p><label>New password</label><div className="inputwrap"><KeyRound/><input type={showPass?'text':'password'} value={newPass} onChange={e=>setNewPass(e.target.value)} minLength="8" required placeholder="At least 8 characters"/><button type="button" className="iconbtn" onClick={()=>setShowPass(!showPass)}>{showPass?<EyeOff/>:<Eye/>}</button></div><Button disabled={busy}>{busy?'Saving…':'Update password'}</Button></form>}
      {notice&&<div className="notice"><AlertTriangle size={16}/>{notice}</div>}
    </div></div></div>;
  }
  if(maintenance)return <div className="authpage"><header className="topbar"><Brand/></header><div className="authstage"><div className="authcard" style={{textAlign:'center'}}><div className="bigicon"><Settings size={44}/></div><h2>Under maintenance</h2><p className="muted">CloudMint is undergoing scheduled maintenance. Please check back soon.</p><div className="supportrow" style={{margin:'18px auto 0'}}><a className="btn tg" href="https://t.me/Jabid12" target="_blank" rel="noreferrer"><Send size={15}/> Telegram</a><a className="btn wa" href="https://whatsapp.com/channel/0029VbC09FZHgZWWEZHBCz3P" target="_blank" rel="noreferrer"><MessageCircle size={15}/> WhatsApp</a></div></div></div></div>;
  if(page==='dashboard')return <div className={'appdash'+(menuOpen?'':' menuClosed')}><div className={'drawerBackdrop'+(menuOpen?' open':'')} onClick={()=>setMenuOpen(false)}/><SideNav open={menuOpen} onClose={()=>setMenuOpen(false)} onNavigate={(p)=>{setPage(p);if(typeof window!=='undefined'&&window.innerWidth<=650)setMenuOpen(false)}}/><main className="dashmain">{toast&&<div className="dashtoast">{toast}</div>}<div className="dashTopbar"><button className="hamburger" onClick={()=>setMenuOpen(!menuOpen)} aria-label="Open menu"><Menu/></button><Brand/></div><div className="dashhead"><div><small>USER DASHBOARD</small><h1>{activeTab}</h1></div><div className="userpill"><span className="statusdot"/>{session?.user?.email||'Preview User'}</div></div>{activeTab==='Overview'?<><div className="stats">{[['Available balance','$'+Math.max(0,deposits.filter(d=>(d.status||'pending')==='reviewed').reduce((s,d)=>s+Number(d.amount||0),0)-((livePlans.find(p=>p.name===(profile?.active_plan||''))||{}).price||0)).toFixed(2),Wallet],['Pending deposits','$'+deposits.filter(d=>(d.status||'pending')==='pending').reduce((s,d)=>s+Number(d.amount||0),0).toFixed(2),Activity],['Active plans',profile?.active_plan?'1':'0',Package],['Team members','0',Users]].map(([t,v,I])=><div className="stat" key={t}><I/><small>{t}</small><b>{v}</b></div>)}</div><div className="welcome"><div><small>YOUR CLOUDMINT SPACE</small><h2>Grow your journey, one step at a time.</h2><p>Account activity and package information at a glance.</p></div><Brand/></div><div className="dashsection"><div className="sectiontitle"><h2>Mining plans</h2><span>120-day plan duration</span></div><div className="plangrid">{livePlans.map(p=><div className={`plan ${p.tone}`} key={p.name}><div className="planicon">{p.icon}</div><h3>{p.name} Plan</h3><b className="price">${p.price}</b><small>Illustrative daily rate: {p.rate}</small><small>Duration: {p.dur||120} days</small><Button kind="outline" onClick={()=>setActiveTab('Packages')}>View plan</Button></div>)}</div></div><div className="dashsection"><div className="sectiontitle"><h2>Important</h2></div><div className="infoCard"><ShieldCheck/><div><b>Transparent account records</b><p>This preview does not accept deposits, promise returns, or process withdrawals. Connect a compliant payment provider and server-side transaction ledger before launch.</p></div></div></div></>:TabBody()}</main></div>;
  return <div className="site"><header className="topbar"><button className="mobilemenu" onClick={()=>setMobileMenu(!mobileMenu)} aria-label="Menu">{mobileMenu?<X/>:<Menu/>}</button><a onClick={()=>setPage('home')}><Brand/></a><nav className={mobileMenu?'open':''}><a href="#about" onClick={()=>setMobileMenu(false)}>About</a><a href="#how" onClick={()=>setMobileMenu(false)}>How it works</a><a href="#packages" onClick={()=>setMobileMenu(false)}>Packages</a><a href="#rewards" onClick={()=>setMobileMenu(false)}>Rewards</a><a href="#contact" onClick={()=>setMobileMenu(false)}>Contact</a><div className="navbtns"><Button kind="outline" onClick={()=>{setMobileMenu(false);goAuth('login')}}>Login</Button><Button onClick={()=>{setMobileMenu(false);goAuth('register-otp')}}>Register <ArrowRight size={15}/></Button><a className="btn wa" href="https://whatsapp.com/channel/0029VbC09FZHgZWWEZHBCz3P" target="_blank" rel="noreferrer"><MessageCircle size={15}/>WhatsApp</a><a className="btn tg" href="https://t.me/Jabid12" target="_blank" rel="noreferrer"><Send size={15}/>Telegram</a></div></nav></header><section className="hero"><div className="hero-copy"><div className="eyebrow"><Zap size={14}/> CLOUDMINT PLATFORM</div><h1>Turn your crypto<br/>into <em>new possibilities.</em></h1><p>A modern platform concept for exploring packages, account tools and transparent activity records.</p><div className="heroactions"><Button onClick={()=>goAuth('register-otp')}>Get Started <ArrowRight size={17}/></Button><Button kind="outline" onClick={()=>goAuth('login')}>Login</Button><a className="btn wa" href="https://whatsapp.com/channel/0029VbC09FZHgZWWEZHBCz3P" target="_blank" rel="noreferrer"><MessageCircle size={15}/>WhatsApp</a><a className="btn tg" href="https://t.me/Jabid12" target="_blank" rel="noreferrer"><Send size={15}/>Telegram</a></div><div className="trustrow"><span><ShieldCheck/> Security-minded</span><span><Zap/> Simple onboarding</span><span><Users/> Community tools</span></div></div><div className="heroart"><div className="artglow"></div><div className="cloudcoin"><Cloud size={190}/><div className="pick">⛏</div><div className="coin">₿</div><div className="circuit">━━━<br/>━━━<br/>━━━</div></div><div className="orbit"></div><div className="orbit orbit2"></div><div className="floatcoin c1">₿</div><div className="floatcoin c2">₿</div><div className="handnote">Mine · Grow · Earn</div></div></section><section className="metricbar"><div><Users/><b>Member tools</b><small>Account dashboard</small></div><div><Wallet/><b>Clear records</b><small>Transaction history</small></div><div><ShieldCheck/><b>Security first</b><small>Verified access</small></div><div><ChartNoAxesCombined/><b>Plan overview</b><small>See plan details</small></div></section><section className="section" id="about"><div className="sectionhead"><small>WHY CLOUDMINT</small><h2>A clear path from sign-up to dashboard</h2><p>Explore the platform design before creating an account.</p></div><div className="steps" id="how">{[['01','Create account','Register with your email and verify the one-time code.'],['02','Review details','Read package terms and funding instructions before taking action.'],['03','Track activity','See account records and plan status in your dashboard.'],['04','Get support','Use the official support and community links for help.']].map(([n,t,d])=><div className="step" key={n}><span>{n}</span><h3>{t}</h3><p>{d}</p></div>)}</div></section><section className="section packages" id="packages"><div className="sectionhead"><small>PACKAGE OVERVIEW</small><h2>Explore the plan designs</h2><p>All displayed prices and rates are illustrative placeholders, not a promise or offer of returns.</p></div><div className="publicplans">{livePlans.map(p=><div className={`publicplan ${p.tone}`} key={p.name}><div className="planicon">{p.icon}</div><h3>{p.name} Plan</h3><b className="price">${p.price}</b><small>Illustrative rate: {p.rate}</small><small>Displayed duration: {p.dur||120} days</small><Button onClick={()=>goAuth('login')}>Get Started <ArrowRight size={15}/></Button><p className="tiny">Login or register to continue.</p></div>)}</div></section><section className="section featurestrip" id="rewards"><div className="featurebox"><Gift/><h3>Rewards</h3><p>Reward thresholds and eligibility are displayed transparently after rules are configured.</p><a onClick={()=>goAuth('register-otp')}>Create account →</a></div><div className="featurebox"><Users/><h3>Team tools</h3><p>Referral tracking is planned; commissions must follow published and compliant rules.</p><a onClick={()=>goAuth('register-otp')}>Get started →</a></div><div className="featurebox"><CalendarDays/><h3>Monthly salary</h3><p>Coming Soon</p><span className="tag">COMING SOON</span></div><div className="featurebox"><ShieldCheck/><h3>Secure by design</h3><p>Use email verification and server-side authorization for account protection.</p><span className="tag green">SECURITY FIRST</span></div></section><footer id="contact"><Brand/><div className="footlinks"><a href="#about">About</a><a href="#packages">Packages</a><a onClick={()=>goAuth('login')}>Login</a><a onClick={()=>goAuth('register-otp')}>Register</a></div><div className="community"><a className="btn wa" href="https://whatsapp.com/channel/0029VbC09FZHgZWWEZHBCz3P" target="_blank" rel="noreferrer"><MessageCircle size={15}/>WhatsApp</a><a className="btn tg" href="https://t.me/Jabid12" target="_blank" rel="noreferrer"><Send size={15}/>Telegram</a></div><small>© 2026 CloudMint. Preview build. Terms, privacy and product claims must be finalized before launch.</small></footer></div>
}
createRoot(document.getElementById('root')).render(<App/>);
