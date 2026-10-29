import React, { useEffect, useMemo, useRef, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { createClient } from '@supabase/supabase-js';
import { Cloud, ShieldCheck, Wallet, Users, Zap, Gift, CalendarDays, ChartNoAxesCombined, Menu, X, ArrowRight, Mail, LockKeyhole, UserRound, CircleHelp, LogOut, Settings, Package, LayoutDashboard, Activity, Copy, Eye, EyeOff, CheckCircle2, AlertTriangle, KeyRound, MessageCircle, Send, Link, Globe, Star, Bell, Smartphone, ListChecks, Search, Download } from 'lucide-react';
import './styles.css';
if(typeof window!=='undefined'&&'serviceWorker' in navigator){window.addEventListener('load',()=>{navigator.serviceWorker.register('/sw.js').catch(()=>{})})}

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
const ICONS={LayoutDashboard,Wallet,Package,Zap,Activity,Gift,Users,ChartNoAxesCombined,UserRound,CircleHelp,Settings,Link,Globe,MessageCircle,Send,Star,Bell,ShieldCheck,Smartphone,ListChecks,Search,Download};
const ICON_NAMES=Object.keys(ICONS);
const DEFAULT_MENU=[
 {label:'Overview',tab_key:'Overview',icon:'LayoutDashboard'},
 {label:'Deposit instructions',tab_key:'Deposit instructions',icon:'Wallet'},
 {label:'Packages',tab_key:'Packages',icon:'Package'},
 {label:'My Plans',tab_key:'My Plans',icon:'Package'},
 {label:'Reinvest',tab_key:'Reinvest',icon:'Activity'},
 {label:'Rewards',tab_key:'Rewards',icon:'Gift'},
 {label:'Team',tab_key:'Team',icon:'Users'},
 {label:'Transactions',tab_key:'Transactions',icon:'ChartNoAxesCombined'},
 {label:'Withdraw',tab_key:'Withdraw',icon:'Wallet'},
 {label:'Profile',tab_key:'Profile',icon:'UserRound'},
 {label:'Support',tab_key:'Support',icon:'CircleHelp'},
 {label:'Tasks',tab_key:'Tasks',icon:'ListChecks'},
 {label:'Apps',tab_key:'Apps',icon:'Smartphone'}
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
  const [rLevels,setRLevels]=useState([]);
  const [rClaims,setRClaims]=useState([]);
  const [nTeam,setNTeam]=useState('');
  const [nReward,setNReward]=useState('');
  const [loading,setLoading]=useState(true);
  const [openDet,setOpenDet]=useState(null);
  const [confirmRm,setConfirmRm]=useState(null);
  useEffect(()=>{
    let cancelled=false;
    (async()=>{
      setLoading(true);
      try{
        const [u,p,d,w,s,rl,rc]=await Promise.all([
          supabase.from('profiles').select('id,email,username,display_name,role,active_plan,active_plan_since,created_at').order('created_at',{ascending:false}).limit(100),
          supabase.from('packages').select('*').order('price',{ascending:true}),
          supabase.from('deposit_requests').select('*').order('created_at',{ascending:false}).limit(100),
          supabase.from('withdrawal_requests').select('*').order('created_at',{ascending:false}).limit(100),
          supabase.from('site_settings').select('*'),
          supabase.from('reward_levels').select('*').order('min_team',{ascending:true}),
          supabase.from('reward_claims').select('*').order('created_at',{ascending:false}).limit(100)
        ]);
        if(!cancelled){
          setUsers(u.data||[]); setPacks(p.data||[]); setDeps(d.data||[]); setWds(w.data||[]); setRLevels(rl.data||[]); setRClaims(rc.data||[]);
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
      if(kind==='wd'){
        const {data,error:ae}=await supabase.rpc('admin_approve_withdrawal',{p_withdrawal_id:row.id});
        if(ae)throw ae;
        setWds(wds.map(x=>x.id===row.id?{...x,status:'reviewed'}:x));
        setAmsg('Withdrawal approved — $'+Number(data).toFixed(2)+' moved from pending to completed withdrawals.');
        return;
      }
      const {error}=await supabase.from('deposit_requests').update({status:'reviewed'}).eq('id',row.id);
      if(error)throw error;
      if(kind==='dep'){
        setDeps(deps.map(x=>x.id===row.id?{...x,status:'reviewed'}:x));
        if(row.user_id){
          const {error:ce}=await supabase.rpc('admin_credit_wallet',{p_user_id:row.user_id,p_amount:Number(row.amount),p_ref_id:row.id});
          if(ce){
            const pack=packs.find(p=>Number(p.price)===Number(row.amount));
            if(pack){
              const stamp=new Date().toISOString();
              const {error:e2}=await supabase.from('profiles').update({active_plan:pack.name,active_plan_since:stamp}).eq('id',row.user_id);
              if(!e2)setUsers(users.map(u=>u.id===row.user_id?{...u,active_plan:pack.name,active_plan_since:stamp}:u));
            }
            setAmsg('Marked reviewed. Wallet SQL not run yet — balance was not credited (old plan auto-set used). Run the wallet SQL to enable balance credit.');
          } else {
            setAmsg('Marked reviewed — $'+Number(row.amount).toFixed(2)+' credited to wallet balance. Referral commission (L1 10% / L2 5% / L3 2%) is automatic when the user activates a plan — no admin step needed.');
          }
        }
      }
      else setWds(wds.map(x=>x.id===row.id?{...x,status:'reviewed'}:x));
    }catch(err){setAmsg(err.message||'Could not update. (Run the admin-update SQL first.)')}
  }
  async function cancelRequest(kind,row){
    try{
      if(kind==='wd'){
        const {error}=await supabase.rpc('admin_cancel_withdrawal',{p_withdrawal_id:row.id});
        if(error)throw error;
        setWds(wds.map(x=>x.id===row.id?{...x,status:'cancelled'}:x));
        setAmsg('Withdrawal cancelled — it can never be approved later. Any held amount was refunded to the wallet.');
        return;
      }
      const {error}=await supabase.from('deposit_requests').update({status:'cancelled'}).eq('id',row.id);
      if(error)throw error;
      setDeps(deps.map(x=>x.id===row.id?{...x,status:'cancelled'}:x));
      setAmsg('Request cancelled — it will no longer count as pending and can never be approved later.');
    }catch(err){setAmsg(err.message||'Could not cancel.')}
  }
  async function retryCommission(row){
    try{
      const {data,error}=await supabase.rpc('retry_user_plan_commissions',{p_user_id:row.user_id});
      if(error)throw error;
      if(data===null||data===undefined) setAmsg('Plan commission re-run done. Check the referrer\'s Team tab for the credited amount (already-paid plans are never paid twice).');
      else setAmsg('Plan commission re-run: $'+Number(data).toFixed(2)+' credited to referrers. $0 means no referrer linked or already paid — never paid twice.');
    }catch(err){setAmsg('Commission retry failed: '+(err.message||'unknown error'))}
  }
  async function setPlan(u,planName){
    try{
      const patch=planName?{active_plan:planName,active_plan_since:new Date().toISOString()}:{active_plan:null,active_plan_since:null};
      const {error}=await supabase.from('profiles').update(patch).eq('id',u.id);
      if(error)throw error;
      setUsers(users.map(x=>x.email===u.email?{...x,...patch}:x));
    }catch(err){setAmsg(err.message||'Could not update plan. (Run the admin-update SQL first.)')}
  }
  async function removeUser(u){
    try{
      setAmsg('');
      const {error}=await supabase.rpc('admin_delete_user',{target_id:u.id});
      if(error)throw error;
      setUsers(users.filter(x=>x.id!==u.id));
      setDeps(deps.filter(d=>d.user_id!==u.id));
      setWds(wds.filter(w=>w.user_id!==u.id));
      setAmsg('User removed: '+u.email);
    }catch(err){setAmsg(err.message||'Could not remove user. (Run the admin-delete SQL first.)')}
  }
  async function reviewRewardClaim(c){
    try{
      const {error}=await supabase.rpc('admin_review_reward_claim',{p_claim_id:c.id});
      if(error)throw error;
      setRClaims(rClaims.map(x=>x.id===c.id?{...x,status:'reviewed'}:x));
      setAmsg('Reward claim reviewed — $'+Number(c.amount).toFixed(2)+' credited to wallet.');
    }catch(err){setAmsg(err.message||'Could not review claim. (Run the rewards SQL first.)')}
  }
  async function addRewardLevel(e){
    e.preventDefault();setAmsg('');
    if(!nTeam||!nReward){setAmsg('Enter team size and reward.');return}
    const {data,error}=await supabase.from('reward_levels').insert({min_team:Number(nTeam),reward:Number(nReward)}).select().single();
    if(error){setAmsg(error.message);return}
    setRLevels([...rLevels,data].sort((a,b)=>a.min_team-b.min_team));setNTeam('');setNReward('');setAmsg('Reward level added.');
  }
  async function delRewardLevel(id){
    const {error}=await supabase.from('reward_levels').delete().eq('id',id);
    if(error){setAmsg(error.message);return}
    setRLevels(rLevels.filter(x=>x.id!==id));
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
      <table style={{width:'100%',borderCollapse:'collapse',fontSize:12,minWidth:920}}>
        <thead><tr style={{textAlign:'left',color:'#94B8AA'}}>
          <th style={{padding:'12px 14px'}}>Email</th><th style={{padding:'12px 14px'}}>Username</th><th style={{padding:'12px 14px'}}>Name</th><th style={{padding:'12px 14px'}}>Role</th><th style={{padding:'12px 14px'}}>Plan</th><th style={{padding:'12px 14px'}}>Joined</th><th style={{padding:'12px 14px'}}>Details</th><th style={{padding:'12px 14px'}}>Remove</th>
        </tr></thead>
        <tbody>{users.map(u=>{
          const du=deps.filter(d=>d.user_id===u.id);
          const wu=wds.filter(w=>w.user_id===u.id);
          const depT=du.reduce((a,d)=>a+Number(d.amount||0),0);
          const wdT=wu.reduce((a,w)=>a+Number(w.amount||0),0);
          const depR=du.filter(d=>d.status==='reviewed').length;
          const depP=du.filter(d=>d.status==='pending').length;
          const wdR=wu.filter(w=>w.status==='reviewed').length;
          const wdP=wu.filter(w=>w.status==='pending').length;
          const dayN=u.active_plan_since?Math.max(1,Math.floor((Date.now()-new Date(u.active_plan_since).getTime())/86400000)+1):null;
          return <React.Fragment key={u.email}><tr style={{borderTop:'1px solid #0a3d2c'}}>
          <td style={{padding:'11px 14px'}}>{u.email}</td><td style={{padding:'11px 14px'}}>{u.username||'—'}</td><td style={{padding:'11px 14px'}}>{u.display_name||'—'}</td>
          <td style={{padding:'11px 14px'}}><span className="tag" style={u.role==='admin'?{background:'#06443c',color:'#53f6c8'}:{}}>{u.role||'user'}</span></td>
          <td style={{padding:'11px 14px'}}>{u.active_plan||'—'}</td>
          <td style={{padding:'11px 14px',color:'#94B8AA'}}>{u.created_at?new Date(u.created_at).toLocaleDateString():'—'}</td>
          <td style={{padding:'11px 14px'}}><button onClick={()=>setOpenDet(openDet===u.email?null:u.email)} style={{background:'#03271F',color:'#dbe7f5',border:'1px solid #03271F',borderRadius:8,padding:'6px 10px',fontSize:14,lineHeight:1}}>⋮</button></td>
          <td style={{padding:'11px 14px'}}>{confirmRm===u.email?<button onClick={()=>{setConfirmRm(null);removeUser(u)}} style={{background:'#3d0f14',color:'#ff9aa5',border:'1px solid #7a2430',borderRadius:8,padding:'6px 8px',fontSize:12}}>Confirm?</button>:<button onClick={()=>setConfirmRm(u.email)} style={{background:'#03271F',color:'#ff9aa5',border:'1px solid #7a2430',borderRadius:8,padding:'6px 8px',fontSize:12}}>Remove</button>}</td>
        </tr>{openDet===u.email&&<tr><td colSpan="8" style={{padding:'12px 14px',background:'#00110D'}}><div style={{display:'flex',flexWrap:'wrap',gap:'18px',fontSize:12,color:'#dbe7f5'}}><span>Deposits: <b>{'$'+depT.toFixed(2)}</b> <span style={{color:'#94B8AA'}}>({du.length} total · {depR} reviewed · {depP} pending)</span></span><span>Withdrawals: <b>{'$'+wdT.toFixed(2)}</b> <span style={{color:'#94B8AA'}}>({wu.length} total · {wdR} reviewed · {wdP} pending)</span></span><span>Plan: <b>{u.active_plan||'—'}</b></span>{dayN&&<span>Day: <b>{dayN}</b></span>}<span>Joined: <b>{u.created_at?new Date(u.created_at).toLocaleDateString():'—'}</b></span></div></td></tr>}</React.Fragment>})}{users.length===0&&<tr><td colSpan="8" style={{padding:'16px',color:'#94B8AA'}}>No users found.</td></tr>}</tbody>
      </table>
    </div>:tab==='packages'?<PackageManager packs={packs} setPacks={setPacks}/>
    :tab==='deposits'?<div className="infoCard" style={{display:'block',padding:0,overflowX:'auto'}}>
      <table style={{width:'100%',borderCollapse:'collapse',fontSize:12,minWidth:640}}>
        <thead><tr style={{textAlign:'left',color:'#94B8AA'}}>
          <th style={{padding:'12px 14px'}}>Email</th><th style={{padding:'12px 14px'}}>Chain</th><th style={{padding:'12px 14px'}}>Amount</th><th style={{padding:'12px 14px'}}>TX hash</th><th style={{padding:'12px 14px'}}>Status</th><th style={{padding:'12px 14px'}}>Date</th>
        </tr></thead>
        <tbody>{deps.map(d=><tr key={d.id} style={{borderTop:'1px solid #0a3d2c'}}>
          <td style={{padding:'11px 14px'}}>{d.email||'—'}</td><td style={{padding:'11px 14px'}}>{d.chain}</td><td style={{padding:'11px 14px'}}>${d.amount}</td>
          <td style={{padding:'11px 14px',fontFamily:'monospace',fontSize:11}} title={d.tx_hash}>{String(d.tx_hash).slice(0,10)}…{String(d.tx_hash).slice(-6)}</td>
          <td style={{padding:'11px 14px'}}><span className={'badge '+(d.status||'pending')}>{d.status||'pending'}</span>{(d.status||'pending')==='pending'&&<div style={{display:'flex',flexDirection:'column',gap:8,marginTop:8}}><button style={{background:'#007A4D',border:'1px solid #007A4D',color:'#fff',borderRadius:8,padding:'8px 12px',fontSize:12,fontWeight:700,cursor:'pointer',whiteSpace:'nowrap'}} onClick={()=>markReviewed('dep',d)}>Mark reviewed</button><button style={{background:'#8f2b2b',border:'1px solid #8f2b2b',color:'#fff',borderRadius:8,padding:'8px 12px',fontSize:12,fontWeight:700,cursor:'pointer',whiteSpace:'nowrap'}} onClick={()=>cancelRequest('dep',d)}>Cancel</button></div>}{(d.status||'pending')==='reviewed'&&<div style={{marginTop:8}}><button style={{background:'#8a6d1f',border:'1px solid #8a6d1f',color:'#fff',borderRadius:8,padding:'8px 12px',fontSize:12,fontWeight:700,cursor:'pointer',whiteSpace:'nowrap'}} onClick={()=>retryCommission(d)}>Retry plan commission</button></div>}</td>
          <td style={{padding:'11px 14px',color:'#94B8AA'}}>{d.created_at?new Date(d.created_at).toLocaleString():'—'}</td>
        </tr>)}{deps.length===0&&<tr><td colSpan="6" style={{padding:'16px',color:'#94B8AA'}}>No deposit requests.</td></tr>}</tbody>
      </table>
    </div>
    :tab==='withdrawals'?<div className="infoCard" style={{display:'block',padding:0,overflowX:'auto'}}>
      <table style={{width:'100%',borderCollapse:'collapse',fontSize:12,minWidth:640}}>
        <thead><tr style={{textAlign:'left',color:'#94B8AA'}}>
          <th style={{padding:'12px 14px'}}>Email</th><th style={{padding:'12px 14px'}}>Chain</th><th style={{padding:'12px 14px'}}>Amount</th><th style={{padding:'12px 14px'}}>Wallet</th><th style={{padding:'12px 14px'}}>Status</th><th style={{padding:'12px 14px'}}>Date</th>
        </tr></thead>
        <tbody>{wds.map(w=><tr key={w.id} style={{borderTop:'1px solid #0a3d2c'}}>
          <td style={{padding:'11px 14px'}}>{w.email||'—'}</td><td style={{padding:'11px 14px'}}>{w.chain}</td><td style={{padding:'11px 14px'}}>${w.amount}</td>
          <td style={{padding:'11px 14px',fontFamily:'monospace',fontSize:11}} title={w.wallet_address}>{String(w.wallet_address).slice(0,10)}…{String(w.wallet_address).slice(-6)}</td>
          <td style={{padding:'11px 14px'}}><span className={'badge '+(w.status||'pending')}>{w.status||'pending'}</span>{(w.status||'pending')==='pending'&&<div style={{display:'flex',flexDirection:'column',gap:8,marginTop:8}}><button style={{background:'#007A4D',border:'1px solid #007A4D',color:'#fff',borderRadius:8,padding:'8px 12px',fontSize:12,fontWeight:700,cursor:'pointer',whiteSpace:'nowrap'}} onClick={()=>markReviewed('wd',w)}>Mark reviewed</button><button style={{background:'#8f2b2b',border:'1px solid #8f2b2b',color:'#fff',borderRadius:8,padding:'8px 12px',fontSize:12,fontWeight:700,cursor:'pointer',whiteSpace:'nowrap'}} onClick={()=>cancelRequest('wd',w)}>Cancel</button></div>}</td>
          <td style={{padding:'11px 14px',color:'#94B8AA'}}>{w.created_at?new Date(w.created_at).toLocaleString():'—'}</td>
        </tr>)}{wds.length===0&&<tr><td colSpan="6" style={{padding:'16px',color:'#94B8AA'}}>No withdrawal requests.</td></tr>}</tbody>
      </table>
    </div>
    :tab==='rewards'?<div>
      <div className="sectiontitle"><h2>Reward levels</h2></div>
      <div className="txlist">{rLevels.map(lv=><div className="txrow" key={lv.id}><div><b>{lv.min_team} team members</b></div><span style={{display:'flex',gap:8,alignItems:'center'}}><b>${Number(lv.reward).toFixed(2)}</b><Button kind="outline" onClick={()=>delRewardLevel(lv.id)}>✕</Button></span></div>)}{rLevels.length===0&&<p className="muted">No levels yet — run the rewards SQL for defaults, or add one below.</p>}</div>
      <form onSubmit={addRewardLevel} className="stackform" style={{marginTop:16,maxWidth:420}}><div style={{display:'flex',gap:10}}><div style={{flex:1}}><label>Team size</label><input value={nTeam} onChange={e=>setNTeam(e.target.value.replace(/\D/g,''))} placeholder="10"/></div><div style={{flex:1}}><label>Reward ($)</label><input value={nReward} onChange={e=>setNReward(e.target.value)} placeholder="3"/></div></div><Button>Add level</Button></form>
      <div className="sectiontitle" style={{marginTop:22}}><h2>Reward claims</h2></div>
      <div className="txlist">{rClaims.map(c=>{const u=users.find(x=>x.id===c.user_id);return <div className="txrow" key={c.id}><div><b>{u?u.email:c.user_id}</b><small>{c.min_team} members · ${Number(c.amount).toFixed(2)}</small></div>{c.status==='reviewed'?<span className="badge approved">reviewed</span>:<Button onClick={()=>reviewRewardClaim(c)}>Review + credit</Button>}</div>})}{rClaims.length===0&&<p className="muted">No reward claims.</p>}</div>
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
        <div style={{flex:1,minWidth:120}}><label>Rate %</label><input inputMode="decimal" value={f.display_rate} onChange={e=>setF({...f,display_rate:e.target.value})} placeholder="2.00"/></div>
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
    <p className="tiny" style={{marginTop:10}}>Packages never credit earnings automatically.</p>
  </div>;
}

function CycleTimer({endsAt,onExpire}){
  const [now,setNow]=useState(Date.now());
  const firedRef=useRef(false);
  useEffect(()=>{const t=setInterval(()=>setNow(Date.now()),1000);return ()=>clearInterval(t);},[]);
  useEffect(()=>{firedRef.current=false;},[endsAt]);
  const ms=Math.max(0,new Date(endsAt).getTime()-now);
  useEffect(()=>{if(ms<=0&&!firedRef.current){firedRef.current=true;if(onExpire)onExpire();}},[ms]);
  const s=Math.floor(ms/1000);const hh=String(Math.floor(s/3600)).padStart(2,'0');const mm=String(Math.floor(s%3600/60)).padStart(2,'0');const ss=String(s%60).padStart(2,'0');
  return <b>{hh}:{mm}:{ss}</b>;
}

function AIMachinePlan({plan,runs,cycle,onStart,onComplete}){
  const R=104, CIRC=2*Math.PI*R;
  const target=Number(plan.dur)||120;
  const [busy,setBusy]=useState(false);
  useEffect(()=>{try{localStorage.removeItem('cm_cycle')}catch{}},[]);
  const runCount=Number(runs?.count||0);
  const runProg=Math.min(1,runCount/target);
  const runDone=runCount>=target;
  const rateNum=parseFloat(plan.rate);
  const dailyNum=isNaN(Number(plan.price))||isNaN(rateNum)?NaN:Number((Number(plan.price)*rateNum/100).toFixed(2));
  const dailyStr=isNaN(dailyNum)?'—':'$'+dailyNum.toFixed(2);
  const net=useMemo(()=>{let sd=7;const rnd=()=>{sd=(sd*1664525+1013904223)>>>0;return sd/4294967296;};
    const pts=[],N=26,RR=56;
    for(let i=0;i<N;i++){const a=rnd()*Math.PI*2,r=RR*Math.sqrt(rnd());pts.push({x:120+r*Math.cos(a),y:120+r*Math.sin(a),d:(rnd()*2.6).toFixed(2),r:(1.8+rnd()*1.7).toFixed(1)});}
    const edges=[];
    for(let i=0;i<N;i++)for(let j=i+1;j<N;j++){if(Math.hypot(pts[i].x-pts[j].x,pts[i].y-pts[j].y)<50)edges.push([i,j]);}
    return {pts,edges};},[]);
  return <div className="ncore">
    <div className="ncore-ambient"/>
    <div className="ncore-head"><small>ACTIVE PLAN</small><h2>{plan.name} Plan</h2><span className="badge approved">active</span></div>
    <div className="ncore-stage">
      <svg className="ncore-ring" viewBox="0 0 240 240">
        <defs>
          <linearGradient id="ncgrad" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#53f6c8"/><stop offset="1" stopColor="#22d3ee"/></linearGradient>
          <radialGradient id="ncglow" cx="50%" cy="50%" r="50%"><stop offset="0%" stopColor="#22d3ee" stopOpacity=".5"/><stop offset="55%" stopColor="#22d3ee" stopOpacity=".12"/><stop offset="100%" stopColor="#22d3ee" stopOpacity="0"/></radialGradient>
        </defs>
        <circle cx="120" cy="120" r="112" fill="url(#ncglow)"/>
        <g className="ncore-spin-a"><ellipse cx="120" cy="120" rx="106" ry="40" className="ncore-orbit"/><circle cx="226" cy="120" r="3.4" className="ncore-sat"/></g>
        <g className="ncore-spin-b"><ellipse cx="120" cy="120" rx="106" ry="40" className="ncore-orbit dim"/><circle cx="14" cy="120" r="2.6" className="ncore-sat dim"/></g>
        <circle cx="120" cy="120" r={R} className="ncore-track"/>
        <circle cx="120" cy="120" r={R} className="ncore-prog" strokeDasharray={CIRC} strokeDashoffset={CIRC*(1-runProg)}/>
        <g className="ncore-net">
          {net.edges.map((e,i)=><line key={'e'+i} x1={net.pts[e[0]].x} y1={net.pts[e[0]].y} x2={net.pts[e[1]].x} y2={net.pts[e[1]].y} className="ncore-edge"/>)}
          {net.pts.map((p,i)=><circle key={'n'+i} cx={p.x} cy={p.y} r={p.r} className="ncore-node" style={{animationDelay:p.d+'s'}}/>)}
          <circle cx="120" cy="120" r="9" className="ncore-heart"/>
        </g>
      </svg>
      <span className="ncore-p p1"/><span className="ncore-p p2"/><span className="ncore-p p3"/><span className="ncore-p p4"/><span className="ncore-p p5"/><span className="ncore-p p6"/>
    </div>
    <div className="ncore-count">{cycle?dailyStr+' mining now':dailyStr+' per day'}</div>
    <small className="ncore-clabel">{runDone?'2X COMPLETE':(cycle?'MINING NOW':'READY TO START')}</small>
    <div className="aimachine-term">
      <div className="aimachine-daylabel">{runDone?'2X COMPLETE':'RUN '+runCount+' OF '+target}</div>
      <div className="aimachine-daybar"><div className="aimachine-dayfill" style={{width:(runProg*100).toFixed(2)+'%'}}/></div>
    </div>
    <div className="aimachine-meta">
      <div><small>Price</small><b>${plan.price}</b></div>
      <div><small>Daily</small><b>{isNaN(parseFloat(plan.rate))?'—':parseFloat(plan.rate).toFixed(2)+'%'}</b></div>
      <div><small>Duration</small><b>{plan.dur||120} days</b></div>
    </div>
    {runDone?<p className="muted">2X complete — {target} runs done.</p>
    :cycle?<div><p className="muted" style={{marginBottom:6}}>Auto-stops in <CycleTimer endsAt={cycle.ends_at} onExpire={()=>{if(onComplete)onComplete();}}/></p><p className="tiny">Day amount adds to wallet automatically on completion.</p></div>
    :<Button onClick={async()=>{setBusy(true);try{await onStart();}finally{setBusy(false);}}} disabled={busy}>{busy?'Starting…':'Start mining'}</Button>}
    <p className="tiny" style={{marginTop:12}}>Start a 24h cycle. When it ends, the day's amount is added to your wallet automatically.</p>
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
  const [codeSent,setCodeSent]=useState(false);
  const [withdrawPassword,setWithdrawPassword]=useState('');
  const [showPass,setShowPass]=useState(false);
  const [notice,setNotice]=useState('');
  const [refInput,setRefInput]=useState(()=>{try{const r=new URLSearchParams(window.location.search).get('ref')||localStorage.getItem('cm_ref');return (r&&/^[A-Za-z0-9]{4,32}$/.test(r))?r:''}catch{return ''}});
  const [busy,setBusy]=useState(false);
  const [session,setSession]=useState(null);
  const [mobileMenu,setMobileMenu]=useState(false);
  const [activeTab,setActiveTab]=useState(()=>{try{const t=localStorage.getItem('cm_tab')||'Overview';return t==='Mining cycles'?'Overview':t}catch{return 'Overview'}});
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
  const [showNotifs,setShowNotifs]=useState(false);
  const [searchQ,setSearchQ]=useState('');
  const [deferredPrompt,setDeferredPrompt]=useState(null);
  const [adminTab,setAdminTab]=useState('users');
  const [profile,setProfile]=useState(null);
  const [deposits,setDeposits]=useState([]);
  const [teamStats,setTeamStats]=useState(null);
  const [teamLevels,setTeamLevels]=useState(null);
  const [commTotals,setCommTotals]=useState({instant:0,daily:0});
  const [runStats,setRunStats]=useState(null);
  const [runRows,setRunRows]=useState([]);
  const [cycles,setCycles]=useState([]);
  const completingRef=useRef({});
  const [withdrawals,setWithdrawals]=useState([]);
  const [siteAddrs,setSiteAddrs]=useState({TRON:'',BNB:'0x73173d35F5D5d6518EF8d32b65d85Ca7910D2376'});
  const [menuItems,setMenuItems]=useState([]);
  const [maintenance,setMaintenance]=useState(false);
  const [dbPacks,setDbPacks]=useState([]);
  const [walletBal,setWalletBal]=useState(0);
  const [rewardLevels,setRewardLevels]=useState(null);
  const [rewardsReady,setRewardsReady]=useState(false);
  const [rewardClaims,setRewardClaims]=useState([]);
  const [userPlans,setUserPlans]=useState([]);
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
    try{
      const q=new URLSearchParams(window.location.search);
      const r=q.get('ref');
      if(r&&/^[A-Za-z0-9]{4,32}$/.test(r))localStorage.setItem('cm_ref',r);
    }catch{}
  },[]);
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
      try{
        if(data.session){localStorage.removeItem('cm_ref');}
        else{const r=localStorage.getItem('cm_ref');if(r){setAuthMode('register-otp');setPage('auth');}}
      }catch{}
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
  useEffect(()=>{ if(isAdminPath) setEmail('cloudmint.site@gmail.com'); },[]);
  useEffect(()=>{ if(!toast)return; const t=setTimeout(()=>setToast(''),3200); return ()=>clearTimeout(t); },[toast]);
  const refreshUserData=async()=>{
    if(!supabase||!session?.user)return;
    const uid=session.user.id;
    try{const pr=await supabase.from('profiles').select('*').eq('id',uid).single();if(pr.data){setProfile(pr.data);setEditName(pr.data.display_name||'')}}catch{}
    try{const d=await supabase.from('deposit_requests').select('*').eq('user_id',uid).order('created_at',{ascending:false});setDeposits(d.data||[])}catch{}
    try{const w=await supabase.from('withdrawal_requests').select('*').eq('user_id',uid).order('created_at',{ascending:false});setWithdrawals(w.data||[])}catch{}
    try{const pk=await supabase.from('packages').select('*').eq('is_active',true).order('price');if(pk.data&&pk.data.length)setDbPacks(pk.data)}catch{}
    try{const wb=await supabase.from('wallet_balances').select('balance').eq('user_id',uid).single();setWalletBal(Number(wb.data?.balance||0))}catch{}
    try{const up=await supabase.from('user_plans').select('*').eq('user_id',uid).order('activated_at',{ascending:false});setUserPlans(up.data||[])}catch{}
  };
  useEffect(()=>{ if(session?.user&&['Overview','Deposit instructions','Withdraw','Packages','My Plans','Transactions','Profile'].includes(activeTab))refreshUserData(); },[session,activeTab]);
  const loadTeam=async()=>{
    if(!supabase||!session?.user)return;
    try{
      const {data,error}=await supabase.rpc('get_team_stats_v2');
      if(!error&&data)setTeamLevels(data.map(r=>({level:Number(r.level),count:Number(r.member_count||0),sum:Number(r.total_sum||0)})));
      else throw new Error('v2 missing');
    }catch{
      try{const {data}=await supabase.rpc('get_team_stats');if(data){setTeamStats(data);setTeamLevels([{level:1,count:Number(data.a_count||0),sum:Number(data.a_sum||0)},{level:2,count:Number(data.b_count||0),sum:Number(data.b_sum||0)},{level:3,count:0,sum:0},{level:4,count:0,sum:0},{level:5,count:0,sum:0}]);}}catch{}
    }
    try{const {data}=await supabase.from('commissions').select('kind,amount').eq('earner_id',session.user.id);const t={instant:0,daily:0};(data||[]).forEach(r=>{if(r.kind==='instant')t.instant+=Number(r.amount||0);if(r.kind==='daily')t.daily+=Number(r.amount||0)});setCommTotals(t);}catch{}
  };
  useEffect(()=>{ if(session?.user&&['Overview','Team'].includes(activeTab))loadTeam(); },[session,activeTab]);
  const loadRuns=async()=>{
    if(!supabase||!session?.user)return;
    let rows=[];
    try{
      const {data,error}=await supabase.from('daily_runs').select('run_date,amount,user_plan_id,plan_name').eq('user_id',session.user.id).limit(500);
      if(error)throw error;
      rows=data||[];
    }catch{
      try{const {data}=await supabase.from('daily_runs').select('run_date,amount').eq('user_id',session.user.id).limit(500);rows=data||[];}catch{rows=[];}
    }
    setRunRows(rows);
    const d=new Date();const today=d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0');
    setRunStats({count:rows.length,total:rows.reduce((s,r)=>s+Number(r.amount||0),0),todayDone:rows.some(r=>r.run_date===today)});
  };
  const planStats=(pid)=>{
    const d=new Date();const today=d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0');
    const rows=(runRows||[]).filter(r=>r.user_plan_id===pid);
    return {count:rows.length,total:rows.reduce((s,r)=>s+Number(r.amount||0),0),todayDone:rows.some(r=>r.run_date===today)};
  };
  const loadCycles=async()=>{
    if(!supabase||!session?.user)return;
    try{
      const {data,error}=await supabase.from('mining_cycles').select('*').eq('user_id',session.user.id).eq('status','running');
      if(error)throw error;
      setCycles(data||[]);
    }catch{ setCycles([]); }
  };
  const cycleFor=(pid,pname)=>cycles.find(c=>pid?c.user_plan_id===pid:(c.user_plan_id===null&&c.plan_name===pname));
  const startCycle=async(planArg,planIdArg)=>{
    if(!supabase||!session?.user)return;
    const ap=planArg||livePlans.find(p=>p.name===(profile?.active_plan||''));
    const r=ap?parseFloat(ap.rate):NaN;
    if(!ap||isNaN(r)||isNaN(Number(ap.price))){setToast('No active plan to start.');return;}
    const now=new Date();const ends=new Date(now.getTime()+24*3600*1000);
    try{
      const {error}=await supabase.from('mining_cycles').insert({user_id:session.user.id,user_plan_id:planIdArg||null,plan_name:ap.name,price:Number(ap.price),rate:r,started_at:now.toISOString(),ends_at:ends.toISOString(),status:'running'});
      if(error)throw error;
      setToast('Mining started — 24h timer running.');
      loadCycles();
    }catch(err){
      const m=err.message||'';
      if(/duplicate|unique|already/i.test(m))setToast('A cycle is already running for this plan.');
      else if(/relation|not exist|column/i.test(m))setToast('Mining system not ready yet — run the mining SQL first.');
      else setToast(m||'Could not start mining.');
    }
  };
  const completeCycle=async(cycle)=>{
    if(!supabase||!session?.user||!cycle)return;
    if(completingRef.current[cycle.id])return;
    completingRef.current[cycle.id]=true;
    const d=new Date();const today=d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0');
    try{
      const {data,error}=await supabase.rpc('complete_mining_cycle',{p_cycle_id:cycle.id,p_run_date:today});
      if(error)throw error;
      const amt=Number(data||0);
      setToast(amt>0?('Day complete — $'+amt.toFixed(2)+' added to wallet.'):'Day complete.');
      loadCycles();loadRuns();refreshUserData();
    }catch(err){
      const m=err.message||'';
      if(/not found|not running/i.test(m)){ loadCycles();loadRuns(); }
      else if(/not finished/i.test(m)){ setToast('Cycle not finished yet.'); loadCycles(); }
      else setToast(m||'Could not complete cycle.');
    }finally{ delete completingRef.current[cycle.id]; }
  };
  const activatePlan=async(pl)=>{
    if(!supabase||!session?.user)return;
    setBusy(true);
    try{
      const rateNum=parseFloat(pl.rate);
      const {error}=await supabase.rpc('activate_plan_from_wallet',{p_plan_name:pl.name,p_price:Number(pl.price),p_rate:isNaN(rateNum)?0:rateNum});
      if(error)throw error;
      try{await supabase.from('profiles').update({active_plan:pl.name,active_plan_since:new Date().toISOString()}).eq('id',session.user.id);}catch{}
      setToast(pl.name+' plan activated from wallet balance.');
      refreshUserData();
    }catch(err){
      const m=err.message||'';
      if(/insufficient/i.test(m))setToast('Wallet balance is not enough for this plan. Deposit first.');
      else if(/function|not exist|relation/i.test(m))setToast('Wallet system not ready yet — run the wallet SQL first.');
      else setToast(m||'Could not activate plan.');
    }finally{setBusy(false)}
  };
  const loadRewards=async()=>{
    if(!supabase||!session?.user)return;
    try{
      const {data,error}=await supabase.from('reward_levels').select('*').order('min_team',{ascending:true});
      if(error)throw error;
      setRewardLevels(data||[]);setRewardsReady(true);
    }catch{ setRewardLevels(null);setRewardsReady(false); }
    try{
      const {data}=await supabase.from('reward_claims').select('*').eq('user_id',session.user.id);
      setRewardClaims(data||[]);
    }catch{ setRewardClaims([]); }
  };
  const claimReward=async(lv)=>{
    if(!supabase||!session?.user)return;
    setBusy(true);
    try{
      const {error}=await supabase.from('reward_claims').insert({user_id:session.user.id,min_team:lv.min_team,amount:lv.reward,status:'pending'});
      if(error)throw error;
      setToast('Reward claim submitted — pending admin review.');
      loadRewards();
    }catch(err){
      const m=err.message||'';
      if(/relation|not exist/i.test(m))setToast('Rewards system not ready yet — run the rewards SQL first.');
      else if(/duplicate|unique/i.test(m))setToast('Already claimed for this level.');
      else setToast(m||'Could not claim reward.');
    }finally{setBusy(false)}
  };
  useEffect(()=>{ if(session?.user&&['Overview','My Plans'].includes(activeTab)){loadRuns();loadCycles();} },[session,activeTab]);
  useEffect(()=>{ if(session?.user&&activeTab==='Rewards')loadRewards(); },[session,activeTab]);
  useEffect(()=>{const h=(e)=>{e.preventDefault();setDeferredPrompt(e)};window.addEventListener('beforeinstallprompt',h);return ()=>window.removeEventListener('beforeinstallprompt',h)},[]);
  const lastVisibleRef=useRef(0);
  useEffect(()=>{
    const onVisible=()=>{ if(document.visibilityState==='visible'){const now=Date.now();if(now-lastVisibleRef.current>60000){lastVisibleRef.current=now;refreshUserData();}} };
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
      const {error}=await supabase.rpc('request_withdrawal',{p_amount:amt,p_chain:wdChain,p_wallet_address:wdAddr.trim(),p_email:session.user.email});
      if(error)throw error;
      setWdAmount('');setWdAddr('');setToast('Withdrawal request submitted — amount held in pending withdrawals until admin review.');
      const {data}=await supabase.from('withdrawal_requests').select('*').eq('user_id',session.user.id).order('created_at',{ascending:false});
      setWithdrawals(data||[]);
      const wb=await supabase.from('wallet_balances').select('balance').eq('user_id',session.user.id).single(); if(wb.data)setWalletBal(Number(wb.data.balance||0));
    }catch(err){setToast((err.message||'').includes('insufficient')?'Insufficient wallet balance.':(err.message||'Could not submit withdrawal.'))}finally{setBusy(false)}
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
      <div className="infoCard"><Wallet/><div><b>Wallet balance: ${'$'+Number(walletBal||0).toFixed(2)}</b><p>Reviewed deposits appear here. Then activate a plan from the Packages page.</p></div></div>
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
      <div className="infoCard"><Wallet/><div><b>How withdrawals work</b><p>Enter the amount and the wallet address that should receive it. The amount leaves your wallet at once and sits in <b>pending withdrawals</b> until admin review — approval moves it to completed withdrawals, and a cancelled request refunds it to your wallet. Payouts are processed manually, never automatically.</p></div></div>
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
      <div className="infoCard" style={{marginBottom:14}}><Wallet/><div><b>Wallet balance: ${'$'+Number(walletBal||0).toFixed(2)}</b><p>Reviewed deposits land here. Activate any plan from your balance below.</p></div></div>
      <div className="plangrid">{livePlans.map(p=><div className={`plan ${p.tone}`} key={p.name}><div className="planicon">{p.icon}</div><h3>{p.name} Plan</h3><b className="price">${p.price}</b><small>Daily rate: {p.rate}</small><small>Duration: {p.dur||120} days</small><Button kind="outline" onClick={()=>{setDepAmount(String(p.price));setActiveTab('Deposit instructions');window.scrollTo(0,0)}}>Deposit to activate</Button><Button onClick={()=>activatePlan(p)} disabled={busy}>Activate from wallet</Button></div>)}</div>
      <div className="infoCard" style={{marginTop:18}}><ShieldCheck/><div><b>Transparent notice</b><p>Reviewed deposits land in your wallet balance. Activate any plan from your balance — the price is deducted at once.</p></div></div>
    </div>;
    const claimPlans=userPlans.length>0?userPlans.map(up=>({key:up.id,name:up.plan_name,price:up.price,rate:String(up.rate),id:up.id})):((()=>{const ap=livePlans.find(p=>p.name===(profile?.active_plan||''));return ap?[{key:ap.name,name:ap.name,price:ap.price,rate:ap.rate,id:null}]:[]})());
    if(activeTab==='My Plans')return <div className="tabwrap">
      <div className="sectiontitle"><h2>My Plans</h2></div>
      {userPlans.length>0&&<div className="txlist" style={{marginBottom:16}}>{userPlans.map(up=><div className="txrow" key={up.id}><div><b>{up.plan_name} Plan · ${up.price}</b><small>Activated {up.activated_at?new Date(up.activated_at).toLocaleDateString():''} · Daily {Number(up.rate||0).toFixed(2)}%</small></div><span className="badge approved">{up.status||'active'}</span></div>)}</div>}
      <div className="sectiontitle" style={{marginTop:6}}><h2>Daily mining cycles</h2></div>
      <div className="txlist">{claimPlans.map(pl=>{const st=pl.id?planStats(pl.id):runStats;const cy=cycleFor(pl.id,pl.name);const amt=isNaN(parseFloat(pl.rate))||isNaN(Number(pl.price))?0:Number((Number(pl.price)*parseFloat(pl.rate)/100).toFixed(2));const done=(st?.count||0)>=120;return <div className="txrow" key={pl.key}><div><b>{pl.name} Plan</b><small>${amt.toFixed(2)} per day{done?' · 2X complete':(cy?' · mining now':'')}</small></div>{done?<span className="badge approved">2X complete</span>:cy?<span className="muted">Ends in <CycleTimer endsAt={cy.ends_at} onExpire={()=>completeCycle(cy)}/></span>:<Button onClick={()=>startCycle({name:pl.name,price:pl.price,rate:pl.rate},pl.id)} disabled={busy}>Start mining</Button>}</div>})}{claimPlans.length===0&&<p className="muted">No active plans yet.</p>}</div>
      {userPlans.map(up=>{const cy=cycleFor(up.id,up.plan_name);return <AIMachinePlan key={up.id} plan={{name:up.plan_name,price:up.price,rate:String(up.rate),dur:120,tone:'cyan',icon:'◆'}} runs={planStats(up.id)} cycle={cy} onStart={()=>startCycle({name:up.plan_name,price:up.price,rate:String(up.rate)},up.id)} onComplete={()=>cy&&completeCycle(cy)}/>})}
      {userPlans.length===0&&profile?.active_plan?(()=>{const ap=livePlans.find(p=>p.name===profile.active_plan)||{name:profile.active_plan,price:'—',rate:'—',dur:120,tone:'cyan',icon:'◆'};const cy=cycleFor(null,ap.name);return <AIMachinePlan plan={ap} runs={runStats} cycle={cy} onStart={()=>startCycle(ap,null)} onComplete={()=>cy&&completeCycle(cy)}/>})():null}
      {userPlans.length===0&&!profile?.active_plan&&<div className="placeholder" style={{marginTop:0}}><div className="bigicon"><Package size={36}/></div><h2>No active plans</h2><p>You don't have any active plans yet. Activate a plan from your wallet balance on the Packages page.</p><Button kind="outline" onClick={()=>setActiveTab('Packages')}>View packages</Button></div>}
    </div>;
    if(activeTab==='Reinvest')return <div className="tabwrap">
      <div className="sectiontitle"><h2>Reinvest</h2></div>
      <div className="placeholder" style={{marginTop:0}}><div className="bigicon"><Activity size={36}/></div><h2>Not available</h2><p>Reinvest is disabled in this preview. Nothing is credited automatically.</p><Button kind="outline" onClick={()=>setActiveTab('Overview')}>Back to overview</Button></div>
    </div>;
    if(activeTab==='Rewards')return <div className="tabwrap">
      <div className="sectiontitle"><h2>Rewards</h2></div>
      <div className="infoCard"><Gift/><div><b>Reward levels</b><p>Team size milestones and their reward amounts. Claims are credited after admin review.</p></div></div>
      <div className="txlist">{(rewardLevels||rewardRows.map(r=>({min_team:r.members,reward:r.reward}))).map(lv=>{const teamCount=teamLevels?teamLevels.reduce((s,l)=>s+Number(l.count||0),0):(teamStats?Number(teamStats.a_count||0)+Number(teamStats.b_count||0):0);const claim=(rewardClaims||[]).find(c=>Number(c.min_team)===Number(lv.min_team));return <div className="txrow" key={lv.min_team}><div><b>{lv.min_team} team members</b><small>{teamCount} members in your team</small></div>{claim?<span className="badge approved">{claim.status}</span>:teamCount>=Number(lv.min_team)?<Button onClick={()=>claimReward(lv)} disabled={busy}>Claim ${Number(lv.reward).toFixed(2)}</Button>:<span className="muted">Locked · ${Number(lv.reward).toFixed(2)}</span>}</div>})}</div>
      {!rewardsReady&&<p className="muted">Default levels shown — run the rewards SQL to connect live levels.</p>}
    </div>;
    const tmLevels=teamLevels||[];
    const tmTotalMembers=tmLevels.reduce((s,l)=>s+Number(l.count||0),0);
    if(activeTab==='Team')return <div className="tabwrap">
      <div className="sectiontitle"><h2>Team</h2><span>verified only</span></div>
      <div className="infoCard"><Users/><div><b>Your referral code</b><p>Share this code with others. Only verified members count toward your team. Instant commission: Level 1 10%, Level 2 5%, Level 3 2%. Daily mining commission: 5% / 2% / 2% / 2% / 1% across 5 levels.</p></div></div>
      <div className="addrbox"><small>Referral code</small><p className="addrtext" style={{fontSize:24,letterSpacing:3}}>{refCode||'Login to see your code.'}</p>{refCode&&<Button kind="outline" onClick={()=>copyText(refCode,'Referral code copied')}><Copy size={15}/> Copy code</Button>}</div>
      {refCode&&<div className="addrbox"><small>Referral link</small><p className="addrtext" style={{fontSize:13,wordBreak:'break-all'}}>{(typeof window!=='undefined'?window.location.origin:'')+'/?ref='+refCode}</p><Button kind="outline" onClick={()=>copyText((typeof window!=='undefined'?window.location.origin:'')+'/?ref='+refCode,'Referral link copied')}><Copy size={15}/> Copy Link</Button></div>}
      <div className="stats" style={{marginTop:18}}><div className="stat"><Users/><small><Users size={13}/> Team Members</small><b>{tmTotalMembers}</b></div><div className="stat"><Activity/><small>Instant commission</small><b>{'$'+Number(commTotals.instant||0).toFixed(2)}</b></div><div className="stat"><Activity/><small>Daily commission</small><b>{'$'+Number(commTotals.daily||0).toFixed(2)}</b></div></div>
      <div className="sectiontitle" style={{marginTop:18}}><h2>Levels 1–5</h2></div>
      <div className="txlist">{[1,2,3,4,5].map(lv=>{const r=tmLevels.find(x=>Number(x.level)===lv)||{count:0,sum:0};return <div className="txrow" key={lv}><div><b>Level {lv}</b><small>{r.count} members · ${Number(r.sum||0).toFixed(2)} team deposits</small></div><b>{r.count}</b></div>})}</div>
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
    if(activeTab==='Tasks')return <div className="tabwrap"><div className="dashsection"><div className="sectiontitle"><h2>Tasks</h2><span>Daily checklist — no extra payouts</span></div>{(()=>{const hasDep=(deposits||[]).some(d=>d.status==='reviewed');const hasPlan=userPlans.length>0||!!profile?.active_plan;const hasTeam=(teamLevels?teamLevels.reduce((s,l)=>s+Number(l.count||0),0):0)>0;const hasEarn=Number(runStats?.total||0)>0;const tasks=[['Deposit reviewed',hasDep,'Deposit instructions'],['Plan activated',hasPlan,'Packages'],['First team member',hasTeam,'Team'],['Daily mining earned',hasEarn,'My Plans']];return <div className="taskList">{tasks.map(([l,done,tab])=><div className="taskRow" key={l}><span className={done?'taskDone':'taskTodo'}>{done?'✓':'○'}</span><b>{l}</b><button className="taskGo" onClick={()=>setActiveTab(tab)}>{done?'View':'Go'}</button></div>)}</div>})()}</div></div>;
    if(activeTab==='Apps')return <div className="tabwrap"><div className="dashsection"><div className="sectiontitle"><h2>CloudMint App</h2><span>Android</span></div><div className="appCard"><img src="/icons/icon-192.png" onError={(e)=>{e.currentTarget.onerror=null;e.currentTarget.src='/cloudmint-logo.png'}} alt="CloudMint app icon" className="appIcon"/><h3>CloudMint for Android</h3><p>Download the app on your phone for a full-screen CloudMint experience. It opens the same website as an app.</p><a className="btn" href="/downloads/cloudmint.apk" download><Download size={16}/> Download App</a><p className="appSteps">Size ~105 KB · Android 7.0+ · Install karte waqt phone ek dafa unknown-app permission poochega.</p></div></div></div>;
    if(activeTab==='Passive Pro Program')return <div className="tabwrap"><div className="dashsection"><div className="sectiontitle"><h2>Passive Pro Program</h2><span>New section</span></div><div className="placeholder" style={{marginTop:0}}><div className="bigicon"><Zap size={36}/></div><h2>Passive Pro Program</h2><p>This section is coming soon.</p><Button kind="outline" onClick={()=>setActiveTab('Overview')}>Back to overview</Button></div></div></div>;
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
  async function sendRegCode(){
    setNotice('');
    if(!email.trim()){setNotice('Please enter your email address first.');return}
    if(!configured){setNotice('Demo preview: add Supabase URL and publishable key in .env to enable email OTP.');return}
    setBusy(true);
    try{
      const {error}=await supabase.auth.signInWithOtp({email:email.trim(),options:{shouldCreateUser:true}});
      if(error)throw error;
      setCodeSent(true);
      setNotice('Verification code sent. Check your email, including Spam/Junk.');
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
        try{
          const rawRef=(new URLSearchParams(window.location.search).get('ref')||localStorage.getItem('cm_ref')||refInput);const ref=(rawRef&&/^[A-Za-z0-9]{4,32}$/.test(rawRef))?rawRef:null;
          if(ref){
            const {error:rerr}=await supabase.rpc('apply_referral_code',{p_user_id:data.user.id,p_code:ref});
            if(rerr){
              const {data:inviter}=await supabase.rpc('resolve_referral_code',{code:ref});
              if(inviter)await supabase.from('profiles').update({referred_by:inviter}).eq('id',data.user.id);
            }
            try{localStorage.removeItem('cm_ref')}catch{}
          }
        }catch{}
        try{await supabase.from('profiles').update({referral_code:data.user.id.slice(0,8)}).eq('id',data.user.id)}catch{}
      }
      setNotice('Email verified successfully.');setAuthMode('profile');
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
      const {error:perr}=await supabase.auth.updateUser({password});
      if(perr)throw perr;
      const {error}=await supabase.from('profiles').upsert({id:user.id,email:user.email,username,display_name:profileName},{onConflict:'id'});
      if(error)throw error;
      setNotice('Profile saved. For security, withdrawal PIN/password setup must be implemented server-side before real withdrawals are enabled.');
      setPage('dashboard');
    }catch(err){setNotice(err.message||'Could not save profile.')}finally{setBusy(false)}
  }
  async function finishRegister(e){
    e.preventDefault();setNotice('');
    if(!configured){setNotice('Demo preview: connect Supabase to enable registration.');return}
    if(!username.trim()||username.trim().length<3){setNotice('Choose a username (at least 3 characters).');return}
    if(password.length<8){setNotice('Use a password with at least 8 characters.');return}
    if(!/^[0-9]{6,8}$/.test(otp)){setNotice('Enter the 6–8 digit code from your email.');return}
    setBusy(true);
    try{
      const data=await verifyOtpCode(email,otp);
      if(!data.user)throw new Error('Code verification failed.');
      await supabase.from('profiles').upsert({id:data.user.id,email:email.trim(),username:username.trim(),display_name:profileName||username.trim()},{onConflict:'id'});
      try{
        const rawRef=(new URLSearchParams(window.location.search).get('ref')||localStorage.getItem('cm_ref')||refInput);const ref=(rawRef&&/^[A-Za-z0-9]{4,32}$/.test(rawRef))?rawRef:null;
        if(ref){
          const {error:rerr}=await supabase.rpc('apply_referral_code',{p_user_id:data.user.id,p_code:ref});
          if(rerr){
            const {data:inviter}=await supabase.rpc('resolve_referral_code',{code:ref});
            if(inviter)await supabase.from('profiles').update({referred_by:inviter}).eq('id',data.user.id);
          }
          try{localStorage.removeItem('cm_ref')}catch{}
        }
      }catch{}
      try{await supabase.from('profiles').update({referral_code:data.user.id.slice(0,8)}).eq('id',data.user.id)}catch{}
      const {error:perr}=await supabase.auth.updateUser({password});
      if(perr)throw perr;
      setPage('dashboard');
    }catch(err){setNotice(err.message||'Could not create account.')}finally{setBusy(false)}
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
    const menu=(menuItems.length?menuItems:DEFAULT_MENU).filter(m=>m.tab_key!=='Mining cycles');
    const go=(m)=>{
      if(m.tab_key.indexOf('url:')===0){window.open(m.tab_key.slice(4),'_blank');return}
      setActiveTab(m.tab_key);onNavigate('dashboard');
    };
    return <aside className={'side'+(open?' open':'')}><Brand/><button className="drawerClose" onClick={onClose} aria-label="Close menu"><X/></button>
      <button className={activeTab==='Passive Pro Program'&&page==='dashboard'?'selected':''} onClick={()=>{setActiveTab('Passive Pro Program');onNavigate('dashboard')}}><Zap/>Passive Pro Program</button>{menu.map(m=>{const I=ICONS[m.icon]||CircleHelp;return <button className={activeTab===m.tab_key&&page==='dashboard'?'selected':''} onClick={()=>go(m)} key={m.id||m.tab_key}><I/>{m.label}</button>})}<button className={activeTab==='Tasks'&&page==='dashboard'?'selected':''} onClick={()=>{setActiveTab('Tasks');onNavigate('dashboard')}}><ListChecks/>Tasks</button><button className={activeTab==='Apps'&&page==='dashboard'?'selected':''} onClick={()=>{setActiveTab('Apps');onNavigate('dashboard')}}><Smartphone/>Apps</button>
      <div className="salary"><CalendarDays/>Monthly Salary<small>Coming Soon</small></div>
      <button onClick={signOut}><LogOut/>Log out</button>
    </aside>;
  }
  const authContent=()=>{
    if(authMode==='register-otp')return <form onSubmit={finishRegister} className="authform"><h2>Create your account</h2><p className="muted">Enter your username, email and password, then the verification code sent to your email.</p><label>Username</label><div className="inputwrap"><UserRound/><input value={username} onChange={e=>setUsername(e.target.value)} required minLength="3" placeholder="Choose a username"/></div><label>Email address</label><div className="inputwrap"><Mail/><input type="email" value={email} onChange={e=>setEmail(e.target.value)} placeholder="you@example.com" required/></div><label>Login password</label><div className="inputwrap"><LockKeyhole/><input type={showPass?'text':'password'} value={password} onChange={e=>setPassword(e.target.value)} minLength="8" required placeholder="At least 8 characters"/><button type="button" className="iconbtn" onClick={()=>setShowPass(!showPass)}>{showPass?<EyeOff/>:<Eye/>}</button></div><label>Verification code</label><div className="inputwrap"><ShieldCheck/><input inputMode="numeric" maxLength="8" value={otp} onChange={e=>setOtp(e.target.value.replace(/\D/g,''))} placeholder="12345678" required/></div><label>Referral code (optional)</label><div className="inputwrap"><Link/><input value={refInput} onChange={e=>setRefInput(e.target.value.replace(/[^A-Za-z0-9]/g,''))} maxLength="32" placeholder="Inviter's code, if you have one"/></div><p className="switch">{codeSent?'Code sent — check email, including Spam/Junk. ':''}<a onClick={sendRegCode}>Send code</a></p><Button disabled={busy}>{busy?'Creating…':'Create account'}</Button><p className="switch">Already registered? <a onClick={()=>goAuth('login')}>Login</a></p></form>;
    if(authMode==='verify')return <form onSubmit={verifyOtp} className="authform"><h2>Verify your email</h2><p className="muted">Enter the 6–8 digit code sent to <b>{email}</b>.</p><label>Verification code</label><div className="inputwrap"><ShieldCheck/><input inputMode="numeric" maxLength="8" value={otp} onChange={e=>setOtp(e.target.value.replace(/\D/g,''))} placeholder="12345678" required/></div><Button disabled={busy}>{busy?'Verifying…':'Verify code'}</Button><p className="switch"><a onClick={()=>setAuthMode('register-otp')}>Change email / resend code</a></p></form>;
    if(authMode==='profile')return <form onSubmit={finishProfile} className="authform"><h2>Set up your profile</h2><p className="muted">Your email has been verified. Finish your account details.</p><label>Username</label><div className="inputwrap"><UserRound/><input value={username} onChange={e=>setUsername(e.target.value)} required minLength="3" placeholder="Choose a username"/></div><label>Profile name</label><div className="inputwrap"><UserRound/><input value={profileName} onChange={e=>setProfileName(e.target.value)} required placeholder="Your display name"/></div><label>Account password</label><div className="inputwrap"><LockKeyhole/><input type={showPass?'text':'password'} value={password} onChange={e=>setPassword(e.target.value)} minLength="8" required placeholder="At least 8 characters"/><button type="button" className="iconbtn" onClick={()=>setShowPass(!showPass)}>{showPass?<EyeOff/>:<Eye/>}</button></div><Button disabled={busy}>{busy?'Saving…':'Complete registration'}</Button></form>;
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
      const atabs=[['users','Users',Users],['packages','Packages',Package],['deposits','Deposits',Wallet],['withdrawals','Withdrawals',Wallet],['rewards','Rewards',Gift],['settings','Settings',Settings],['menu','Menu',Menu]];
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
  if(page==='dashboard')return <div className={'appdash'+(menuOpen?'':' menuClosed')}><div className={'drawerBackdrop'+(menuOpen?' open':'')} onClick={()=>setMenuOpen(false)}/><SideNav open={menuOpen} onClose={()=>setMenuOpen(false)} onNavigate={(p)=>{setPage(p);if(typeof window!=='undefined'&&window.innerWidth<=650)setMenuOpen(false)}}/><main className="dashmain">{toast&&<div className="dashtoast">{toast}</div>}<div className="dashTopbar"><button className="hamburger" onClick={()=>setMenuOpen(!menuOpen)} aria-label="Open menu"><Menu/></button><Brand/><div className="topbarTools"><input className="topSearch" value={searchQ} onChange={e=>setSearchQ(e.target.value)} placeholder="Search..."/><div className="notifWrap"><button className="notifBtn" onClick={()=>setShowNotifs(!showNotifs)} aria-label="Notifications"><Bell/>{(()=>{const pc=deposits.filter(d=>(d.status||'pending')==='pending').length+withdrawals.filter(w=>(w.status||'pending')==='pending').length;return pc>0?<span className="notifBadge">{pc}</span>:null})()}</button>{showNotifs&&<div className="notifPanel">{[...deposits.map(d=>({t:'Deposit',a:d.amount,s:d.status,dt:d.created_at})),...withdrawals.map(w=>({t:'Withdrawal',a:w.amount,s:w.status,dt:w.created_at}))].sort((a,b)=>new Date(b.dt||0)-new Date(a.dt||0)).slice(0,6).map((n,i)=><div className="notifRow" key={i}><b>{n.t}</b><span>{'$'+Number(n.a||0).toFixed(2)}</span><small>{n.s||'pending'}</small></div>)}</div>}</div></div></div><div className="dashhead"><div><small>USER DASHBOARD</small><h1>{activeTab}</h1></div><div className="userpill"><span className="statusdot"/>{profile?.display_name||profile?.username||session?.user?.email||'Preview User'}</div></div>{activeTab==='Overview'?<><div className="ov-page">
<div className="ov-welcome"><div><b className="ov-brand">CloudMint</b><small>WELCOME BACK</small><h2>{profile?.display_name||profile?.username||session?.user?.email||'CloudMint'}</h2><p>Run daily, keep your 2X on track.</p></div><div className="ov-welcome-ic"><Wallet/></div></div>
<div className="ov-walletbox"><div className="ov-hero-top"><div className="ov-hero-ic"><Wallet/></div><div><small>WALLET BALANCE</small><b>{'$'+Number(walletBal||0).toFixed(2)}</b></div></div><p className="ov-hero-note">Reviewed deposits appear here. Then activate a plan from the Packages page.</p></div>
<div className="ov-duo"><div className="ov-mini ov-mini-ref"><Link/><b>Refer Link</b><p>{(typeof window!=='undefined'?window.location.origin:'')+'/?ref='+(profile?.referral_code||(session?.user?session.user.id.slice(0,8):''))}</p><button className="ov-btn ov-btn-yellow ov-btn-sm" onClick={()=>copyText((typeof window!=='undefined'?window.location.origin:'')+'/?ref='+(profile?.referral_code||(session?.user?session.user.id.slice(0,8):'')),'Referral link copied')}><Copy size={14}/> Copy Link</button></div><div className="ov-mini ov-mini-sup"><MessageCircle/><b>Support</b><p>Need help? Contact support team anytime.</p><button className="ov-btn ov-btn-yellow ov-btn-sm" onClick={()=>{setActiveTab('Support');window.scrollTo(0,0)}}>Open Support</button></div></div>
<div className="ov-sec-title">Quick Actions</div>
<div className="ov-tiles"><button className="ov-tile t-teal" style={{display:!searchQ||'my plan'.includes(searchQ.toLowerCase())?'':'none'}} onClick={()=>{setActiveTab('My Plans');window.scrollTo(0,0)}}><Package/><span>My Plan</span></button><button className="ov-tile t-purple" style={{display:!searchQ||'deposit'.includes(searchQ.toLowerCase())?'':'none'}} onClick={()=>{setActiveTab('Deposit instructions');window.scrollTo(0,0)}}><Wallet/><span>Deposit</span></button><button className="ov-tile t-orange" style={{display:!searchQ||'withdraw'.includes(searchQ.toLowerCase())?'':'none'}} onClick={()=>{setActiveTab('Withdraw');window.scrollTo(0,0)}}><Send/><span>Withdraw</span></button><button className="ov-tile t-blue" style={{display:!searchQ||'transactions'.includes(searchQ.toLowerCase())?'':'none'}} onClick={()=>{setActiveTab('Transactions');window.scrollTo(0,0)}}><ChartNoAxesCombined/><span>Transactions</span></button><button className="ov-tile t-pink" style={{display:!searchQ||'team'.includes(searchQ.toLowerCase())?'':'none'}} onClick={()=>{setActiveTab('Team');window.scrollTo(0,0)}}><Users/><span>Team</span></button><button className="ov-tile t-magenta" style={{display:!searchQ||'rewards'.includes(searchQ.toLowerCase())?'':'none'}} onClick={()=>{setActiveTab('Rewards');window.scrollTo(0,0)}}><Gift/><span>Rewards</span></button><button className="ov-tile t-cyan" style={{display:!searchQ||'profile'.includes(searchQ.toLowerCase())?'':'none'}} onClick={()=>{setActiveTab('Profile');window.scrollTo(0,0)}}><UserRound/><span>Profile</span></button><button className="ov-tile t-dark" style={{display:!searchQ||'logout'.includes(searchQ.toLowerCase())?'':'none'}} onClick={signOut}><LogOut/><span>Logout</span></button></div>
<div className="ov-sec-title">Dashboard Report</div>
<div className="ov-report"><div className="ov-rcard r-pink"><small><Bell size={13}/> Pending Deposits</small><b>{'$'+deposits.filter(d=>(d.status||'pending')==='pending').reduce((s,d)=>s+Number(d.amount||0),0).toFixed(2)}</b></div><div className="ov-rcard r-teal"><small><Send size={13}/> Pending Withdrawals</small><b>{'$'+withdrawals.filter(w=>(w.status||'pending')==='pending').reduce((s,w)=>s+Number(w.amount||0),0).toFixed(2)}</b></div><div className="ov-rcard r-orange"><small><ChartNoAxesCombined size={13}/> Total Deposits</small><b>{'$'+deposits.filter(d=>d.status==='reviewed').reduce((s,d)=>s+Number(d.amount||0),0).toFixed(2)}</b></div><div className="ov-rcard r-red"><small><Activity size={13}/> Total Withdrawals</small><b>{'$'+withdrawals.filter(w=>w.status==='reviewed').reduce((s,w)=>s+Number(w.amount||0),0).toFixed(2)}</b></div><div className="ov-rcard r-purple"><small><Package size={13}/> Active Plans</small><b>{userPlans.length>0?String(userPlans.length):(profile?.active_plan?'1':'0')}</b></div><div className="ov-rcard r-green"><small>Team Members</small><b>{teamLevels?String(teamLevels.reduce((s,l)=>s+Number(l.count||0),0)):(teamStats?String(Number(teamStats.a_count||0)+Number(teamStats.b_count||0)):'0')}</b></div><div className="ov-rcard r-teal"><small><Activity size={13}/> Daily mining</small><b>{'$'+Number(runStats?.total||0).toFixed(2)}</b></div><div className="ov-rcard r-green"><small><Zap size={13}/> Instant commission</small><b>{'$'+Number(commTotals?.instant||0).toFixed(2)}</b></div><div className="ov-rcard r-orange"><small><Users size={13}/> Daily commission</small><b>{'$'+Number(commTotals?.daily||0).toFixed(2)}</b></div>{(()=>{const earned=Number(runStats?.total||0)+Number(commTotals?.instant||0)+Number(commTotals?.daily||0);const invested=(deposits||[]).filter(d=>d.status==='reviewed').reduce((s,d)=>s+Number(d.amount||0),0);const cap=invested*2;const pct=cap>0?Math.min(100,Math.floor(earned/cap*100)):0;return <div className="ov-rcard r-dark"><small><ChartNoAxesCombined size={13}/> 2X progress</small><b>{pct}%</b><div style={{height:8,background:'#0a3d2c',borderRadius:99,marginTop:6}}><div style={{height:8,width:pct+'%',background:'#00FFB2',borderRadius:99}}/></div><small style={{marginTop:6}}>{'$'+earned.toFixed(2)} of {'$'+cap.toFixed(2)}</small></div>})()}</div>
{(()=>{const mining=Number(runStats?.total||0),inst=Number(commTotals?.instant||0),daily=Number(commTotals?.daily||0);const inv=(deposits||[]).filter(d=>d.status==='reviewed').reduce((s,d)=>s+Number(d.amount||0),0);const ern=mining+inst+daily;const wd=(withdrawals||[]).filter(w=>w.status==='reviewed').reduce((s,w)=>s+Number(w.amount||0),0);const mx=Math.max(mining,inst,daily,1);const mx2=Math.max(inv,ern,wd,1);const h=(v,m)=>Math.max(6,Math.round(v/m*90));return <div className="ov-charts"><div className="ov-chart"><h3>Earnings Overview</h3><div className="ov-bars">{[['Daily mining',mining],['Instant commission',inst],['Daily commission',daily]].map(([l,v])=><div className="ov-barcol" key={l}><div className="ov-bar" style={{height:h(v,mx)}}/><b>{'$'+v.toFixed(2)}</b><small>{l}</small></div>)}</div></div><div className="ov-chart"><h3>Investment Performance</h3><div className="ov-bars">{[['Invested',inv],['Earned',ern],['Withdrawn',wd]].map(([l,v])=><div className="ov-barcol" key={l}><div className="ov-bar bar2" style={{height:h(v,mx2)}}/><b>{'$'+v.toFixed(2)}</b><small>{l}</small></div>)}</div></div></div>})()}</div><div className="dashsection"><div className="sectiontitle"><h2>Mining plans</h2><span>120-day plan duration</span></div><div className="plangrid">{livePlans.map(p=><div className={`plan ${p.tone}`} key={p.name}><div className="planicon">{p.icon}</div><h3>{p.name} Plan</h3><b className="price">${p.price}</b><small>Daily rate: {p.rate}</small><small>Duration: {p.dur||120} days</small><Button kind="outline" onClick={()=>setActiveTab('Packages')}>View plan</Button></div>)}</div></div><div className="dashsection"><div className="sectiontitle"><h2>Important</h2></div><div className="infoCard"><ShieldCheck/><div><b>Transparent account records</b><p>Deposits and withdrawals are reviewed manually before confirmation.</p></div></div></div></>:TabBody()}</main></div>;
  return <div className="site"><header className="topbar"><button className="mobilemenu" onClick={()=>setMobileMenu(!mobileMenu)} aria-label="Menu">{mobileMenu?<X/>:<Menu/>}</button><a onClick={()=>setPage('home')}><Brand/></a><nav className={mobileMenu?'open':''}><a href="#about" onClick={()=>setMobileMenu(false)}>About</a><a href="#how" onClick={()=>setMobileMenu(false)}>How it works</a><a href="#packages" onClick={()=>setMobileMenu(false)}>Packages</a><a href="#rewards" onClick={()=>setMobileMenu(false)}>Rewards</a><a href="#contact" onClick={()=>setMobileMenu(false)}>Contact</a><div className="navbtns"><Button kind="outline" onClick={()=>{setMobileMenu(false);goAuth('login')}}>Login</Button><Button onClick={()=>{setMobileMenu(false);goAuth('register-otp')}}>Register <ArrowRight size={15}/></Button><a className="btn wa" href="https://whatsapp.com/channel/0029VbC09FZHgZWWEZHBCz3P" target="_blank" rel="noreferrer"><MessageCircle size={15}/>WhatsApp</a><a className="btn tg" href="https://t.me/Jabid12" target="_blank" rel="noreferrer"><Send size={15}/>Telegram</a></div></nav></header><section className="hero"><div className="hero-copy"><div className="eyebrow"><Zap size={14}/> CLOUDMINT PLATFORM</div><h1>Turn your crypto<br/>into <em>new possibilities.</em></h1><p>A modern platform concept for exploring packages, account tools and transparent activity records.</p><div className="heroactions"><Button onClick={()=>goAuth('register-otp')}>Get Started <ArrowRight size={17}/></Button><Button kind="outline" onClick={()=>goAuth('login')}>Login</Button><a className="btn wa" href="https://whatsapp.com/channel/0029VbC09FZHgZWWEZHBCz3P" target="_blank" rel="noreferrer"><MessageCircle size={15}/>WhatsApp</a><a className="btn tg" href="https://t.me/Jabid12" target="_blank" rel="noreferrer"><Send size={15}/>Telegram</a></div><div className="trustrow"><span><ShieldCheck/> Security-minded</span><span><Zap/> Simple onboarding</span><span><Users/> Community tools</span></div></div><div className="heroart"><div className="artglow"></div><div className="cloudcoin"><Cloud size={190}/><div className="pick">⛏</div><div className="coin">₿</div><div className="circuit">━━━<br/>━━━<br/>━━━</div></div><div className="orbit"></div><div className="orbit orbit2"></div><div className="floatcoin c1">₿</div><div className="floatcoin c2">₿</div><div className="handnote">Mine · Grow · Earn</div></div></section><section className="metricbar"><div><Users/><b>Member tools</b><small>Account dashboard</small></div><div><Wallet/><b>Clear records</b><small>Transaction history</small></div><div><ShieldCheck/><b>Security first</b><small>Verified access</small></div><div><ChartNoAxesCombined/><b>Plan overview</b><small>See plan details</small></div></section><section className="section" id="about"><div className="sectionhead"><small>WHY CLOUDMINT</small><h2>A clear path from sign-up to dashboard</h2><p>Explore the platform design before creating an account.</p></div><div className="steps" id="how">{[['01','Create account','Register with your email and verify the one-time code.'],['02','Review details','Read package terms and funding instructions before taking action.'],['03','Track activity','See account records and plan status in your dashboard.'],['04','Get support','Use the official support and community links for help.']].map(([n,t,d])=><div className="step" key={n}><span>{n}</span><h3>{t}</h3><p>{d}</p></div>)}</div></section><section className="section packages" id="packages"><div className="sectionhead"><small>PACKAGE OVERVIEW</small><h2>Explore the plan designs</h2><p>Plan prices and daily rates are shown below.</p></div><div className="publicplans">{livePlans.map(p=><div className={`publicplan ${p.tone}`} key={p.name}><div className="planicon">{p.icon}</div><h3>{p.name} Plan</h3><b className="price">${p.price}</b><small>Rate: {p.rate}</small><small>Displayed duration: {p.dur||120} days</small><Button onClick={()=>goAuth('login')}>Get Started <ArrowRight size={15}/></Button><p className="tiny">Login or register to continue.</p></div>)}</div></section><section className="section featurestrip" id="rewards"><div className="featurebox"><Gift/><h3>Rewards</h3><p>Reward thresholds and eligibility are displayed transparently after rules are configured.</p><a onClick={()=>goAuth('register-otp')}>Create account →</a></div><div className="featurebox"><Users/><h3>Team tools</h3><p>Referral tracking is planned; commissions must follow published and compliant rules.</p><a onClick={()=>goAuth('register-otp')}>Get started →</a></div><div className="featurebox"><CalendarDays/><h3>Monthly salary</h3><p>Coming Soon</p><span className="tag">COMING SOON</span></div><div className="featurebox"><ShieldCheck/><h3>Secure by design</h3><p>Use email verification and server-side authorization for account protection.</p><span className="tag green">SECURITY FIRST</span></div></section><footer id="contact"><Brand/><div className="footlinks"><a href="#about">About</a><a href="#packages">Packages</a><a onClick={()=>goAuth('login')}>Login</a><a onClick={()=>goAuth('register-otp')}>Register</a></div><div className="community"><a className="btn wa" href="https://whatsapp.com/channel/0029VbC09FZHgZWWEZHBCz3P" target="_blank" rel="noreferrer"><MessageCircle size={15}/>WhatsApp</a><a className="btn tg" href="https://t.me/Jabid12" target="_blank" rel="noreferrer"><Send size={15}/>Telegram</a></div><small>© 2026 CloudMint. Preview build. Terms, privacy and product claims must be finalized before launch.</small></footer></div>
}
createRoot(document.getElementById('root')).render(<App/>);
