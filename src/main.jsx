import React, { useEffect, useMemo, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { createClient } from '@supabase/supabase-js';
import { Cloud, ShieldCheck, Wallet, Users, Zap, Gift, CalendarDays, ChartNoAxesCombined, Menu, X, ArrowRight, Mail, LockKeyhole, UserRound, CircleHelp, LogOut, Settings, Package, LayoutDashboard, Activity, Copy, Eye, EyeOff, CheckCircle2, AlertTriangle } from 'lucide-react';
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

function Brand(){return <div className="brand"><div className="brandmark"><Cloud size={29}/><span>₿</span></div><div><b>CloudMint</b><small>Mine · Grow · Earn</small></div></div>}
function Button({children,kind='primary',...props}){return <button className={`btn ${kind}`} {...props}>{children}</button>}
function App(){
  const [page,setPage]=useState('home');
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
  const [activeTab,setActiveTab]=useState('Overview');
  const [depositAmount,setDepositAmount]=useState('50');
  const [balance,setBalance]=useState(0);
  const [mining,setMining]=useState([]);
  const [admin,setAdmin]=useState(false);
  const configured=Boolean(supabase);
  const goAuth=(mode='login')=>{setAuthMode(mode);setNotice('');setPage('auth');window.scrollTo(0,0)};
  useEffect(()=>{
    if(!supabase) return;
    supabase.auth.getSession().then(({data})=>setSession(data.session));
    const {data:{subscription}}=supabase.auth.onAuthStateChange((_event,s)=>setSession(s));
    return ()=>subscription.unsubscribe();
  },[]);
  useEffect(()=>{if(session && page==='auth')setPage('dashboard')},[session,page]);
  const signOut=async()=>{if(supabase)await supabase.auth.signOut();setSession(null);setAdmin(false);setPage('home')};
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
  async function verifyOtp(e){
    e.preventDefault();setNotice('');
    if(!configured){setNotice('Demo preview only. Configure Supabase to verify email codes.');return}
    if(!/^[0-9]{6,8}$/.test(otp)){setNotice('Enter the 6–8 digit code from your email.');return}
    setBusy(true);
    try{
      const {data,error}=await supabase.auth.verifyOtp({email:email.trim(),token:otp,type:'email'});
      if(error)throw error;
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
      const {error}=await supabase.auth.signInWithPassword({email:email.trim(),password});
      if(error)throw error;
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
  const authContent=()=>{
    if(authMode==='register-otp')return <form onSubmit={sendOtp} className="authform"><h2>Create your account</h2><p className="muted">Enter your email and we’ll send a verification code.</p><label>Email address</label><div className="inputwrap"><Mail/><input type="email" value={email} onChange={e=>setEmail(e.target.value)} placeholder="you@example.com" required/></div><Button disabled={busy}>{busy?'Sending…':'Send OTP'}</Button><p className="switch">Already registered? <a onClick={()=>goAuth('login')}>Login</a></p></form>;
    if(authMode==='verify')return <form onSubmit={verifyOtp} className="authform"><h2>Verify your email</h2><p className="muted">Enter the 6–8 digit code sent to <b>{email}</b>.</p><label>Verification code</label><div className="inputwrap"><ShieldCheck/><input inputMode="numeric" maxLength="8" value={otp} onChange={e=>setOtp(e.target.value.replace(/\D/g,''))} placeholder="12345678" required/></div><Button disabled={busy}>{busy?'Verifying…':'Verify code'}</Button><p className="switch"><a onClick={()=>setAuthMode('register-otp')}>Change email / resend code</a></p></form>;
    if(authMode==='profile')return <form onSubmit={finishProfile} className="authform"><h2>Set up your profile</h2><p className="muted">Your email has been verified. Finish your account details.</p><label>Username</label><div className="inputwrap"><UserRound/><input value={username} onChange={e=>setUsername(e.target.value)} required minLength="3" placeholder="Choose a username"/></div><label>Profile name</label><div className="inputwrap"><UserRound/><input value={profileName} onChange={e=>setProfileName(e.target.value)} required placeholder="Your display name"/></div><label>Account password</label><div className="inputwrap"><LockKeyhole/><input type={showPass?'text':'password'} value={password} onChange={e=>setPassword(e.target.value)} minLength="8" required placeholder="At least 8 characters"/><button type="button" className="iconbtn" onClick={()=>setShowPass(!showPass)}>{showPass?<EyeOff/>:<Eye/>}</button></div><label>Withdrawal password</label><div className="inputwrap"><LockKeyhole/><input type="password" value={withdrawPassword} onChange={e=>setWithdrawPassword(e.target.value)} minLength="8" required placeholder="Use a different password"/></div><p className="tiny">Never reuse your account password. Withdrawal credentials must be securely hashed and verified on the server before live payouts are enabled.</p><Button disabled={busy}>{busy?'Saving…':'Complete registration'}</Button></form>;
    return <form onSubmit={passwordLogin} className="authform"><h2>Welcome back</h2><p className="muted">Log in to your CloudMint account.</p><label>Email address</label><div className="inputwrap"><Mail/><input type="email" value={email} onChange={e=>setEmail(e.target.value)} placeholder="you@example.com" required/></div><label>Password</label><div className="inputwrap"><LockKeyhole/><input type={showPass?'text':'password'} value={password} onChange={e=>setPassword(e.target.value)} placeholder="Your password" required/><button type="button" className="iconbtn" onClick={()=>setShowPass(!showPass)}>{showPass?<EyeOff/>:<Eye/>}</button></div><div className="authlinks"><a onClick={()=>goAuth('forgot')}>Forgot password?</a><a onClick={()=>goAuth('register-otp')}>Register with email OTP</a></div>{authMode==='forgot'&&<p className="tiny">Enter your email above, then use the password reset flow configured in Supabase.</p>}<Button>Login securely</Button><p className="switch">New to CloudMint? <a onClick={()=>goAuth('register-otp')}>Create account</a></p></form>
  };
  if(page==='auth')return <div className="authpage"><header className="topbar"><a onClick={()=>setPage('home')}><Brand/></a><a className="navlink" onClick={()=>setPage('home')}>Back to home</a></header><div className="authstage"><div className="authvisual"><div className="orb"><Cloud size={90}/><span>₿</span></div><h1>Welcome to <em>CloudMint</em></h1><p>Mine · Grow · Earn</p><div className="feature"><ShieldCheck/> Secure authentication</div><div className="feature"><Mail/> Email verification</div><div className="feature"><LockKeyhole/> Protected account access</div></div><div className="authcard">{authContent()}{notice&&<div className="notice"><AlertTriangle size={16}/>{notice}</div>}{!configured&&<p className="tiny">UI preview mode — auth becomes active after Supabase setup.</p>}</div></div></div>;
  if(page==='dashboard')return <div className="appdash"><aside className="side"><Brand/>{['Overview','Deposit instructions','Packages','My Plans','Mining cycles','Reinvest','Rewards','Team','Transactions','Withdraw','Profile','Support'].map((x,i)=><button className={activeTab===x?'selected':''} onClick={()=>setActiveTab(x)} key={x}>{[<LayoutDashboard/>,<Wallet/>,<Package/>,<Package/>,<Zap/>,<Activity/>,<Gift/>,<Users/>,<ChartNoAxesCombined/>,<Wallet/>,<UserRound/>,<CircleHelp/>][i]}{x}</button>)}<div className="salary"><CalendarDays/>Monthly Salary<small>Coming Soon</small></div><button onClick={signOut}><LogOut/>Log out</button></aside><main className="dashmain"><div className="dashhead"><div><small>USER DASHBOARD</small><h1>{activeTab}</h1></div><div className="userpill"><span className="statusdot"/>{session?.user?.email||'Preview User'}</div></div>{activeTab==='Overview'?<><div className="welcome"><div><small>YOUR CLOUDMINT SPACE</small><h2>Grow your journey, one step at a time.</h2><p>Account activity and package information at a glance.</p></div><Brand/></div><div className="stats">{[['Available balance','$0.00',Wallet],['Pending deposits','$0.00',Activity],['Active plans','0',Package],['Team members','0',Users]].map(([t,v,I])=><div className="stat" key={t}><I/><small>{t}</small><b>{v}</b></div>)}</div><div className="dashsection"><div className="sectiontitle"><h2>Mining plans</h2><span>120-day plan duration</span></div><div className="plangrid">{plans.slice(0,3).map(p=><div className={`plan ${p.tone}`} key={p.name}><div className="planicon">{p.icon}</div><h3>{p.name} Plan</h3><b className="price">${p.price}</b><small>Illustrative daily rate: {p.rate}</small><small>Duration: 120 days</small><Button kind="outline" onClick={()=>setActiveTab('Packages')}>View plan</Button></div>)}</div></div><div className="dashsection"><div className="sectiontitle"><h2>Important</h2></div><div className="infoCard"><ShieldCheck/><div><b>Transparent account records</b><p>This preview does not accept deposits, promise returns, or process withdrawals. Connect a compliant payment provider and server-side transaction ledger before launch.</p></div></div></div></>:<div className="placeholder"><div className="bigicon"><Settings size={36}/></div><h2>{activeTab}</h2><p>This section is represented in the design preview. Live money movement, earnings, referrals and withdrawals require verified backend rules, authorization, and compliance review.</p><Button kind="outline" onClick={()=>setActiveTab('Overview')}>Back to overview</Button></div>}</main></div>;
  return <div className="site"><header className="topbar"><a onClick={()=>setPage('home')}><Brand/></a><button className="mobilemenu" onClick={()=>setMobileMenu(!mobileMenu)}>{mobileMenu?<X/>:<Menu/>}</button><nav className={mobileMenu?'open':''}><a href="#about">About</a><a href="#how">How it works</a><a href="#packages">Packages</a><a href="#rewards">Rewards</a><a href="#contact">Contact</a></nav><div className="topactions"><Button kind="outline" onClick={()=>goAuth('login')}>Login</Button><Button onClick={()=>goAuth('register-otp')}>Register <ArrowRight size={15}/></Button></div></header><section className="hero"><div className="hero-copy"><div className="eyebrow"><Zap size={14}/> CLOUDMINT PLATFORM</div><h1>Turn your crypto<br/>into <em>new possibilities.</em></h1><p>A modern platform concept for exploring packages, account tools and transparent activity records.</p><div className="heroactions"><Button onClick={()=>goAuth('register-otp')}>Get Started <ArrowRight size={17}/></Button><Button kind="outline" onClick={()=>goAuth('login')}>Login</Button></div><div className="trustrow"><span><ShieldCheck/> Security-minded</span><span><Zap/> Simple onboarding</span><span><Users/> Community tools</span></div></div><div className="heroart"><div className="artglow"></div><div className="cloudcoin"><Cloud size={190}/><div className="pick">⛏</div><div className="coin">₿</div><div className="circuit">━━━<br/>━━━<br/>━━━</div></div><div className="orbit"></div><div className="orbit orbit2"></div><div className="floatcoin c1">₿</div><div className="floatcoin c2">₿</div><div className="handnote">Mine · Grow · Earn</div></div></section><section className="metricbar"><div><Users/><b>Member tools</b><small>Account dashboard</small></div><div><Wallet/><b>Clear records</b><small>Transaction history</small></div><div><ShieldCheck/><b>Security first</b><small>Verified access</small></div><div><ChartNoAxesCombined/><b>Plan overview</b><small>See plan details</small></div></section><section className="section" id="about"><div className="sectionhead"><small>WHY CLOUDMINT</small><h2>A clear path from sign-up to dashboard</h2><p>Explore the platform design before creating an account.</p></div><div className="steps" id="how">{[['01','Create account','Register with your email and verify the one-time code.'],['02','Review details','Read package terms and funding instructions before taking action.'],['03','Track activity','See account records and plan status in your dashboard.'],['04','Get support','Use the official support and community links for help.']].map(([n,t,d])=><div className="step" key={n}><span>{n}</span><h3>{t}</h3><p>{d}</p></div>)}</div></section><section className="section packages" id="packages"><div className="sectionhead"><small>PACKAGE OVERVIEW</small><h2>Explore the plan designs</h2><p>All displayed prices and rates are illustrative placeholders, not a promise or offer of returns.</p></div><div className="publicplans">{plans.map(p=><div className={`publicplan ${p.tone}`} key={p.name}>{p.popular&&<span className="popular">POPULAR</span>}<div className="planicon">{p.icon}</div><h3>{p.name} Plan</h3><b className="price">${p.price}</b><small>Illustrative rate: {p.rate}</small><small>Displayed duration: 120 days</small><Button onClick={()=>goAuth('login')}>Get Started <ArrowRight size={15}/></Button><p className="tiny">Login or register to continue.</p></div>)}</div></section><section className="section featurestrip" id="rewards"><div className="featurebox"><Gift/><h3>Rewards</h3><p>Reward thresholds and eligibility are displayed transparently after rules are configured.</p><a onClick={()=>goAuth('register-otp')}>Create account →</a></div><div className="featurebox"><Users/><h3>Team tools</h3><p>Referral tracking is planned; commissions must follow published and compliant rules.</p><a onClick={()=>goAuth('register-otp')}>Get started →</a></div><div className="featurebox"><CalendarDays/><h3>Monthly salary</h3><p>Coming Soon</p><span className="tag">COMING SOON</span></div><div className="featurebox"><ShieldCheck/><h3>Secure by design</h3><p>Use email verification and server-side authorization for account protection.</p><span className="tag green">SECURITY FIRST</span></div></section><footer id="contact"><Brand/><div className="footlinks"><a href="#about">About</a><a href="#packages">Packages</a><a onClick={()=>goAuth('login')}>Login</a><a onClick={()=>goAuth('register-otp')}>Register</a></div><div className="community"><a href="https://t.me/Jabid12" target="_blank" rel="noreferrer">Telegram</a><a href="https://whatsapp.com/channel/0029VbC09FZHgZWWEZHBCz3P" target="_blank" rel="noreferrer">WhatsApp Channel</a></div><small>© 2026 CloudMint. Preview build. Terms, privacy and product claims must be finalized before launch.</small></footer></div>
}
createRoot(document.getElementById('root')).render(<App/>);