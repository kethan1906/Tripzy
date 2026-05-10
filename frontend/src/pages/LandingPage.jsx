import { Link } from 'react-router-dom'
import { useState, useEffect } from 'react'
import { Compass, ArrowRight, Star, ChevronDown, MapPin, Clock, Shield, Users, Map, Brain, Bell, DollarSign, Globe } from 'lucide-react'

const DESTINATIONS = [
  { name: 'Paris', country: 'France', emoji: '🗼', desc: 'City of Light & romance', crowd: 'High', best: 'Oct–Apr' },
  { name: 'Tokyo', country: 'Japan', emoji: '🗾', desc: 'Tradition meets futurism', crowd: 'Medium', best: 'Mar–May' },
  { name: 'Dubai', country: 'UAE', emoji: '🏙️', desc: 'Luxury desert city', crowd: 'Medium', best: 'Nov–Mar' },
  { name: 'New York', country: 'USA', emoji: '🗽', desc: 'The city that never sleeps', crowd: 'High', best: 'Apr–Jun' },
  { name: 'Bali', country: 'Indonesia', emoji: '🌴', desc: 'Tropical paradise', crowd: 'Medium', best: 'May–Sep' },
  { name: 'Rome', country: 'Italy', emoji: '🏛️', desc: 'Eternal city of history', crowd: 'High', best: 'Apr–Jun' },
  { name: 'Singapore', country: 'Singapore', emoji: '🌃', desc: 'Modern city of Asia', crowd: 'Low', best: 'Feb–Apr' },
  { name: 'Hyderabad', country: 'India', emoji: '🕌', desc: 'City of pearls & biryani', crowd: 'Medium', best: 'Oct–Feb' },
]

const FEATURES = [
  { icon: Brain, title: 'AI Itinerary Builder', desc: 'Generate complete day-by-day travel plans in seconds.', color: '#a78bfa', bg: 'rgba(167,139,250,0.1)' },
  { icon: Map, title: 'Live Navigation', desc: 'Step-by-step real-time navigation through your itinerary.', color: '#34d399', bg: 'rgba(52,211,153,0.1)' },
  { icon: Users, title: 'Crowd Detection', desc: 'Smart crowd forecasting so you avoid peak times.', color: '#fbbf24', bg: 'rgba(251,191,36,0.1)' },
  { icon: Bell, title: 'Real-Time Alerts', desc: 'Instant weather and safety notifications.', color: '#fb7185', bg: 'rgba(251,113,133,0.1)' },
  { icon: DollarSign, title: 'Cab Booking', desc: 'Compare Uber, Ola & Rapido with one-tap redirect.', color: '#38bdf8', bg: 'rgba(56,189,248,0.1)' },
  { icon: Globe, title: 'Unified Booking', desc: 'Flights, hotels and transport — all in one place.', color: '#22d3ee', bg: 'rgba(34,211,238,0.1)' },
]

const HOW_IT_WORKS = [
  { step: '01', icon: '📝', title: 'Create Account', desc: 'Sign up free with your email and password in seconds.' },
  { step: '02', icon: '✨', title: 'Generate Itinerary', desc: 'AI builds a complete day-by-day plan with real timings.' },
  { step: '03', icon: '📅', title: 'Book Everything', desc: 'Book flights, hotels and transport from your dashboard.' },
  { step: '04', icon: '🗺️', title: 'Navigate Live', desc: 'Real-time navigation with crowd alerts and cab booking.' },
]

export default function LandingPage() {
  const [scrolled, setScrolled] = useState(false)
  const [activeDest, setActiveDest] = useState(null)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 30)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  useEffect(() => {
    const io = new IntersectionObserver(
      entries => entries.forEach(e => { if (e.isIntersecting) e.target.classList.add('show') }),
      { threshold: 0.1 }
    )
    document.querySelectorAll('.reveal').forEach(el => io.observe(el))
    return () => io.disconnect()
  }, [])

  const scrollTo = id => document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' })

  return (
    <div style={{ minHeight: '100vh', background: '#080e1a', color: '#f1f5f9', overflowX: 'hidden', fontFamily: 'system-ui,-apple-system,sans-serif' }}>
      <style>{`
        .reveal{opacity:0;transform:translateY(24px);transition:opacity 0.6s ease,transform 0.6s ease}
        .reveal.show{opacity:1;transform:translateY(0)}
        .reveal:nth-child(2){transition-delay:.1s}.reveal:nth-child(3){transition-delay:.2s}
        .reveal:nth-child(4){transition-delay:.3s}.reveal:nth-child(5){transition-delay:.4s}
        .reveal:nth-child(6){transition-delay:.5s}
        .plane-anim{animation:planeFly 20s linear infinite;position:absolute;top:22%;font-size:32px;pointer-events:none;z-index:5}
        @keyframes planeFly{0%{left:-80px;opacity:0}5%{opacity:1}95%{opacity:1}100%{left:110vw;opacity:0;transform:translateY(-50px)}}
        .cloud-anim{animation:cloudDrift var(--dur) linear var(--delay) infinite;position:absolute;pointer-events:none;opacity:.1}
        @keyframes cloudDrift{from{left:-200px}to{left:110vw}}
        .glow-text{background:linear-gradient(135deg,#38bdf8,#818cf8,#34d399);-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text}
        .nav-btn{background:none;border:none;color:#64748b;font-size:14px;cursor:pointer;padding:4px 0;transition:color .2s}
        .nav-btn:hover{color:white}
        .btn-primary{display:inline-flex;align-items:center;gap:8px;background:linear-gradient(135deg,#0ea5e9,#38bdf8);color:white;font-weight:600;padding:13px 28px;border-radius:12px;text-decoration:none;border:none;cursor:pointer;font-size:15px;transition:all .2s;box-shadow:0 8px 24px rgba(14,165,233,.3)}
        .btn-primary:hover{transform:translateY(-2px);box-shadow:0 12px 32px rgba(14,165,233,.45)}
        .btn-secondary{display:inline-flex;align-items:center;gap:8px;background:rgba(255,255,255,.05);color:#cbd5e1;font-weight:500;padding:12px 24px;border-radius:12px;text-decoration:none;border:1px solid rgba(255,255,255,.1);cursor:pointer;font-size:15px;transition:all .2s}
        .btn-secondary:hover{background:rgba(255,255,255,.1);color:white;transform:translateY(-1px)}
        .glass-card{background:rgba(255,255,255,.03);border:1px solid rgba(255,255,255,.08);border-radius:18px;backdrop-filter:blur(16px);transition:all .25s}
        .glass-card:hover{background:rgba(255,255,255,.06);transform:translateY(-3px)}
        .dest-card{background:rgba(255,255,255,.03);border:1px solid rgba(255,255,255,.07);border-radius:16px;padding:20px;cursor:pointer;transition:all .25s}
        .dest-card:hover{background:rgba(255,255,255,.07);border-color:rgba(56,189,248,.3);transform:translateY(-3px)}
        .route-draw{stroke-dasharray:900;stroke-dashoffset:900;animation:draw 3s ease forwards .5s}
        @keyframes draw{to{stroke-dashoffset:0}}
      `}</style>

      {/* NAVBAR */}
      <header style={{ position:'fixed',top:0,left:0,right:0,zIndex:100,background:scrolled?'rgba(8,14,26,.95)':'transparent',borderBottom:scrolled?'1px solid rgba(255,255,255,.06)':'none',backdropFilter:scrolled?'blur(20px)':'none',transition:'all .3s' }}>
        <div style={{ maxWidth:1100,margin:'0 auto',padding:'16px 24px',display:'flex',alignItems:'center',justifyContent:'space-between' }}>
          <div style={{ display:'flex',alignItems:'center',gap:10 }}>
            <div style={{ width:36,height:36,borderRadius:10,background:'linear-gradient(135deg,#38bdf8,#06b6d4)',display:'flex',alignItems:'center',justifyContent:'center' }}>
              <Compass size={18} color="white" />
            </div>
            <span style={{ fontWeight:800,fontSize:20,color:'white',letterSpacing:'-0.5px' }}>Tripzy</span>
          </div>

          <nav style={{ display:'flex',gap:28,alignItems:'center' }}>
            <button className="nav-btn" onClick={() => scrollTo('features')}>Features</button>
            <button className="nav-btn" onClick={() => scrollTo('how-it-works')}>How It Works</button>
            <button className="nav-btn" onClick={() => scrollTo('destinations')}>Destinations</button>
          </nav>

          {/* Navbar: Sign In only */}
          <Link to="/login" className="btn-primary" style={{ padding:'10px 22px',fontSize:14 }}>
            Sign In
          </Link>
        </div>
      </header>

      {/* HERO */}
      <section style={{ minHeight:'100vh',display:'flex',alignItems:'center',paddingTop:80,position:'relative',background:'radial-gradient(ellipse 80% 60% at 50% 0%,rgba(56,189,248,.09) 0%,transparent 60%)' }}>
        {[{top:'20%',dur:'35s',delay:'0s'},{top:'50%',dur:'50s',delay:'12s'},{top:'72%',dur:'28s',delay:'22s'}].map((c,i)=>(
          <div key={i} className="cloud-anim" style={{ top:c.top,'--dur':c.dur,'--delay':c.delay }}>
            <svg width="150" height="75" viewBox="0 0 200 100" fill="none">
              <ellipse cx="100" cy="72" rx="88" ry="28" fill="white"/>
              <ellipse cx="70" cy="58" rx="48" ry="38" fill="white"/>
              <ellipse cx="132" cy="54" rx="42" ry="35" fill="white"/>
            </svg>
          </div>
        ))}
        <div className="plane-anim">✈️</div>
        <div style={{ position:'absolute',inset:0,backgroundImage:'radial-gradient(circle at 1px 1px,rgba(255,255,255,.025) 1px,transparent 0)',backgroundSize:'48px 48px',pointerEvents:'none' }} />

        <div style={{ maxWidth:1100,margin:'0 auto',padding:'60px 24px',width:'100%' }}>
          <div style={{ display:'grid',gridTemplateColumns:'1fr 1fr',gap:64,alignItems:'center' }}>

            {/* Left */}
            <div>
              <div style={{ display:'inline-flex',alignItems:'center',gap:7,background:'rgba(56,189,248,.1)',border:'1px solid rgba(56,189,248,.2)',color:'#38bdf8',fontSize:12,fontWeight:600,padding:'6px 14px',borderRadius:999,marginBottom:24,textTransform:'uppercase',letterSpacing:'.08em' }}>
                <Star size={11} fill="currentColor"/> AI-Powered Travel Platform
              </div>

              <h1 style={{ fontSize:62,fontWeight:800,lineHeight:1.06,marginBottom:18,color:'white',letterSpacing:'-1px' }}>
                Travel <span className="glow-text">Smarter</span>,<br/>
                Live <span className="glow-text">Deeper</span>
              </h1>

              <p style={{ fontSize:17,color:'#94a3b8',lineHeight:1.7,marginBottom:32,maxWidth:460 }}>
                Plan trips with AI, navigate live with real-time crowd data, book cabs instantly — all in one beautiful app.
              </p>

              {/* HERO BUTTONS: Register + Sign In */}
              <div style={{ display:'flex',gap:14,flexWrap:'wrap',marginBottom:20 }}>
                <Link to="/login" className="btn-primary">
                  Sign In <ArrowRight size={17}/>
                </Link>
                <Link to="/register" className="btn-secondary">
                  Create Free Account
                </Link>
              </div>

              {/* Demo - small subtle text only */}
              <p style={{ fontSize:13,color:'#475569' }}>
                Want to explore first?{' '}
                <Link to="/login" style={{ color:'#38bdf8',textDecoration:'none',fontWeight:600 }}>
                  Try demo account →
                </Link>
              </p>
            </div>

            {/* Right map card */}
            <div style={{ position:'relative' }}>
              <div className="glass-card" style={{ padding:24,overflow:'hidden' }}>
                <svg viewBox="0 0 400 280" style={{ width:'100%' }}>
                  <defs>
                    <linearGradient id="rg" x1="0%" y1="0%" x2="100%" y2="0%">
                      <stop offset="0%" stopColor="#34d399"/>
                      <stop offset="50%" stopColor="#38bdf8"/>
                      <stop offset="100%" stopColor="#818cf8"/>
                    </linearGradient>
                  </defs>
                  {[0,56,112,168,224,280].map(y=><line key={y} x1="0" y1={y} x2="400" y2={y} stroke="rgba(255,255,255,.04)" strokeWidth="1"/>)}
                  {[0,80,160,240,320,400].map(x=><line key={x} x1={x} y1="0" x2={x} y2="280" stroke="rgba(255,255,255,.04)" strokeWidth="1"/>)}
                  <path d="M 60 220 C 120 180,170 90,200 70 C 230 50,290 110,340 90" fill="none" stroke="url(#rg)" strokeWidth="3" strokeLinecap="round" className="route-draw"/>
                  {[{x:60,y:220,label:'Mumbai',color:'#34d399'},{x:200,y:70,label:'Delhi',color:'#38bdf8'},{x:340,y:90,label:'Paris',color:'#818cf8'}].map(({x,y,label,color})=>(
                    <g key={label}>
                      <circle cx={x} cy={y} r="18" fill={color} opacity=".12"/>
                      <circle cx={x} cy={y} r="7" fill={color} opacity=".9"/>
                      <circle cx={x} cy={y} r="3" fill="white"/>
                      <text x={x} y={y-14} textAnchor="middle" fill={color} fontSize="10" fontWeight="600" fontFamily="system-ui">{label}</text>
                    </g>
                  ))}
                </svg>
                <div style={{ position:'absolute',top:16,right:16,background:'rgba(8,14,26,.85)',border:'1px solid rgba(255,255,255,.1)',borderRadius:12,padding:'10px 14px',fontSize:12,backdropFilter:'blur(10px)' }}>
                  <div style={{ color:'#64748b',marginBottom:4 }}>Next Stop</div>
                  <div style={{ color:'white',fontWeight:600,display:'flex',alignItems:'center',gap:5 }}><MapPin size={11} color="#38bdf8"/> Eiffel Tower</div>
                  <div style={{ color:'#34d399',marginTop:5,fontSize:11 }}>● Low crowd now</div>
                </div>
                <div style={{ position:'absolute',bottom:16,left:16,background:'rgba(8,14,26,.85)',border:'1px solid rgba(255,255,255,.1)',borderRadius:12,padding:'10px 14px',fontSize:12,backdropFilter:'blur(10px)' }}>
                  <div style={{ color:'#64748b',marginBottom:5 }}>Cab to next stop</div>
                  <div style={{ display:'flex',gap:6 }}>
                    <span style={{ padding:'2px 8px',background:'rgba(0,0,0,.4)',borderRadius:999,color:'white',fontSize:11 }}>🖤 ₹180</span>
                    <span style={{ padding:'2px 8px',background:'rgba(52,211,153,.15)',borderRadius:999,color:'#34d399',fontSize:11 }}>🟢 ₹145</span>
                    <span style={{ padding:'2px 8px',background:'rgba(251,191,36,.15)',borderRadius:999,color:'#fbbf24',fontSize:11 }}>🟡 ₹90</span>
                  </div>
                </div>
              </div>
              <div style={{ position:'absolute',top:-14,left:-14,background:'rgba(8,14,26,.95)',border:'1px solid rgba(52,211,153,.2)',borderRadius:12,padding:'7px 14px',fontSize:12 }}>
                <span style={{ color:'#34d399',fontWeight:600 }}>● Live Navigation Active</span>
              </div>
              <div style={{ position:'absolute',bottom:-14,right:-14,background:'rgba(8,14,26,.95)',border:'1px solid rgba(56,189,248,.2)',borderRadius:12,padding:'7px 14px',fontSize:12,display:'flex',alignItems:'center',gap:6 }}>
                <Clock size={11} color="#38bdf8"/>
                <span style={{ color:'#38bdf8',fontWeight:600 }}>AI Itinerary Ready</span>
              </div>
            </div>
          </div>

          <div style={{ textAlign:'center',marginTop:64,color:'#334155',display:'flex',flexDirection:'column',alignItems:'center',gap:6 }}>
            <span style={{ fontSize:12 }}>Scroll to explore</span>
            <ChevronDown size={16}/>
          </div>
        </div>
      </section>

      {/* STATS */}
      <div style={{ borderTop:'1px solid rgba(255,255,255,.05)',borderBottom:'1px solid rgba(255,255,255,.05)',padding:'28px 24px' }}>
        <div style={{ maxWidth:800,margin:'0 auto',display:'grid',gridTemplateColumns:'repeat(4,1fr)',textAlign:'center' }}>
          {[{value:'10K+',label:'Trips Planned',icon:'✈️'},{value:'95%',label:'Crowd Accuracy',icon:'🎯'},{value:'150+',label:'Destinations',icon:'🌍'},{value:'4.9★',label:'User Rating',icon:'⭐'}].map(({value,label,icon})=>(
            <div key={label} className="reveal">
              <div style={{ fontSize:24,marginBottom:4 }}>{icon}</div>
              <div className="glow-text" style={{ fontSize:28,fontWeight:800 }}>{value}</div>
              <div style={{ color:'#64748b',fontSize:13,marginTop:2 }}>{label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* FEATURES */}
      <section id="features" style={{ padding:'80px 24px' }}>
        <div style={{ maxWidth:1100,margin:'0 auto' }}>
          <div className="reveal" style={{ textAlign:'center',marginBottom:52 }}>
            <div style={{ color:'#818cf8',fontSize:12,fontWeight:700,letterSpacing:'.1em',textTransform:'uppercase',marginBottom:12 }}>⚡ Features</div>
            <h2 style={{ fontSize:40,fontWeight:800,color:'white',marginBottom:12 }}>Everything for the <span className="glow-text">perfect journey</span></h2>
            <p style={{ color:'#64748b',fontSize:16,maxWidth:480,margin:'0 auto' }}>Stop switching between apps. Tripzy unifies all your travel tools.</p>
          </div>
          <div style={{ display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:16 }}>
            {FEATURES.map(({icon:Icon,title,desc,color,bg})=>(
              <div key={title} className="reveal glass-card" style={{ padding:24 }}>
                <div style={{ width:44,height:44,borderRadius:12,background:bg,display:'flex',alignItems:'center',justifyContent:'center',marginBottom:14 }}>
                  <Icon size={20} color={color}/>
                </div>
                <h3 style={{ color:'white',fontWeight:700,fontSize:15,marginBottom:8 }}>{title}</h3>
                <p style={{ color:'#64748b',fontSize:13,lineHeight:1.6 }}>{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section id="how-it-works" style={{ padding:'80px 24px',background:'rgba(255,255,255,.01)' }}>
        <div style={{ maxWidth:960,margin:'0 auto' }}>
          <div className="reveal" style={{ textAlign:'center',marginBottom:52 }}>
            <h2 style={{ fontSize:40,fontWeight:800,color:'white',marginBottom:12 }}>Your journey in <span className="glow-text">4 steps</span></h2>
            <p style={{ color:'#64748b',fontSize:16 }}>From zero to fully planned trip in minutes</p>
          </div>
          <div style={{ display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:18 }}>
            {HOW_IT_WORKS.map(({step,icon,title,desc})=>(
              <div key={step} className="reveal glass-card" style={{ padding:24,textAlign:'center' }}>
                <div style={{ fontSize:34,marginBottom:10 }}>{icon}</div>
                <div style={{ color:'#334155',fontSize:11,fontFamily:'monospace',fontWeight:700,marginBottom:8 }}>{step}</div>
                <h3 style={{ color:'white',fontWeight:700,fontSize:15,marginBottom:8 }}>{title}</h3>
                <p style={{ color:'#64748b',fontSize:13,lineHeight:1.55 }}>{desc}</p>
              </div>
            ))}
          </div>
          <div className="reveal" style={{ textAlign:'center',marginTop:44 }}>
            <Link to="/login" className="btn-primary">Sign In to Get Started <ArrowRight size={17}/></Link>
          </div>
        </div>
      </section>

      {/* DESTINATIONS */}
      <section id="destinations" style={{ padding:'80px 24px' }}>
        <div style={{ maxWidth:1100,margin:'0 auto' }}>
          <div className="reveal" style={{ textAlign:'center',marginBottom:48 }}>
            <h2 style={{ fontSize:40,fontWeight:800,color:'white',marginBottom:12 }}>Popular <span className="glow-text">Destinations</span></h2>
            <p style={{ color:'#64748b',fontSize:16 }}>Click any destination to start planning your trip</p>
          </div>
          <div style={{ display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:16 }}>
            {DESTINATIONS.map(dest=>(
              <div key={dest.name} className="dest-card reveal" onClick={()=>setActiveDest(activeDest?.name===dest.name?null:dest)}>
                <div style={{ fontSize:30,marginBottom:10 }}>{dest.emoji}</div>
                <div style={{ fontWeight:700,color:'white',fontSize:16 }}>{dest.name}</div>
                <div style={{ color:'#64748b',fontSize:12,marginTop:2 }}>{dest.country}</div>
                <div style={{ color:'#94a3b8',fontSize:13,marginTop:8,lineHeight:1.5 }}>{dest.desc}</div>
                <div style={{ display:'flex',gap:6,marginTop:12,flexWrap:'wrap' }}>
                  <span style={{ fontSize:11,padding:'3px 9px',borderRadius:999,background:dest.crowd==='Low'?'rgba(52,211,153,.12)':dest.crowd==='Medium'?'rgba(251,191,36,.12)':'rgba(251,113,133,.12)',color:dest.crowd==='Low'?'#34d399':dest.crowd==='Medium'?'#fbbf24':'#fb7185' }}>
                    👥 {dest.crowd}
                  </span>
                  <span style={{ fontSize:11,padding:'3px 9px',borderRadius:999,background:'rgba(255,255,255,.05)',color:'#94a3b8' }}>
                    📅 {dest.best}
                  </span>
                </div>
                {activeDest?.name===dest.name&&(
                  <div style={{ marginTop:12,paddingTop:12,borderTop:'1px solid rgba(255,255,255,.08)' }}>
                    <Link to="/register" className="btn-primary" style={{ padding:'8px 16px',fontSize:13,width:'100%',justifyContent:'center',display:'flex' }}>
                      Plan trip to {dest.name} →
                    </Link>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section style={{ padding:'80px 24px' }}>
        <div style={{ maxWidth:640,margin:'0 auto' }}>
          <div className="reveal glass-card" style={{ padding:52,textAlign:'center',border:'1px solid rgba(56,189,248,.15)',position:'relative',overflow:'hidden' }}>
            <div style={{ position:'absolute',top:0,left:'50%',transform:'translateX(-50%)',width:240,height:240,background:'rgba(56,189,248,.06)',borderRadius:'50%',filter:'blur(50px)',pointerEvents:'none' }}/>
            <div style={{ position:'relative' }}>
              <Shield size={42} color="#38bdf8" style={{ margin:'0 auto 18px' }}/>
              <h2 style={{ fontSize:34,fontWeight:800,color:'white',marginBottom:10 }}>Ready to travel smarter?</h2>
              <p style={{ color:'#64748b',fontSize:16,marginBottom:28 }}>Create your free account and start planning in minutes.</p>
              <div style={{ display:'flex',gap:12,justifyContent:'center',flexWrap:'wrap' }}>
                <Link to="/login" className="btn-primary">Sign In <ArrowRight size={17}/></Link>
                <Link to="/register" className="btn-secondary">Create Free Account</Link>
              </div>
              <p style={{ color:'#334155',fontSize:12,marginTop:14 }}>No credit card · Free forever</p>
            </div>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer style={{ borderTop:'1px solid rgba(255,255,255,.05)',padding:'28px 24px' }}>
        <div style={{ maxWidth:1100,margin:'0 auto',display:'flex',alignItems:'center',justifyContent:'space-between' }}>
          <div style={{ display:'flex',alignItems:'center',gap:9 }}>
            <div style={{ width:28,height:28,borderRadius:8,background:'linear-gradient(135deg,#38bdf8,#06b6d4)',display:'flex',alignItems:'center',justifyContent:'center' }}>
              <Compass size={13} color="white"/>
            </div>
            <span style={{ fontWeight:800,color:'white' }}>Tripzy</span>
          </div>
          <p style={{ color:'#334155',fontSize:13 }}>© {new Date().getFullYear()} Tripzy. Built for travelers.</p>
          <div style={{ display:'flex',gap:20 }}>
            {['Privacy','Terms','Contact'].map(item=>(
              <a key={item} href="#" style={{ color:'#334155',fontSize:13,textDecoration:'none' }}
                onMouseOver={e=>e.target.style.color='white'} onMouseOut={e=>e.target.style.color='#334155'}>
                {item}
              </a>
            ))}
          </div>
        </div>
      </footer>
    </div>
  )
}