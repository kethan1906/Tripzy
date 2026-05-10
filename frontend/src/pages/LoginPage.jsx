import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Compass, Mail, Lock, Eye, EyeOff, ArrowRight } from 'lucide-react'
import useAuthStore from '../store/authStore'
import toast from 'react-hot-toast'

export default function LoginPage() {
  const [email, setEmail]       = useState('')
  const [password, setPassword] = useState('')
  const [showPw, setShowPw]     = useState(false)
  const { login, isLoading }    = useAuthStore()
  const navigate                = useNavigate()

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!email || !password) { toast.error('Please enter email and password'); return }
    const result = await login(email, password)
    if (result.success) {
      toast.success('Welcome back!')
      navigate('/dashboard')
    } else {
      toast.error(result.error || 'Invalid email or password')
    }
  }

  const handleDemo = async () => {
    const result = await login('demo@tripzy.com', 'demo1234')
    if (result.success) {
      toast.success('Logged in as demo user!')
      navigate('/dashboard')
    } else {
      toast.error('Demo login failed — make sure the backend is running and seeded.')
    }
  }

  return (
    <div style={{ minHeight:'100vh', background:'#080e1a', display:'flex', alignItems:'center', justifyContent:'center', padding:24, fontFamily:'system-ui,-apple-system,sans-serif' }}>
      {/* Background glow */}
      <div style={{ position:'fixed', top:0, right:0, width:400, height:400, background:'rgba(56,189,248,.07)', borderRadius:'50%', filter:'blur(80px)', pointerEvents:'none' }}/>
      <div style={{ position:'fixed', bottom:0, left:0, width:400, height:400, background:'rgba(129,140,248,.06)', borderRadius:'50%', filter:'blur(80px)', pointerEvents:'none' }}/>

      <div style={{ width:'100%', maxWidth:420, position:'relative', zIndex:1 }}>

        {/* Logo */}
        <div style={{ textAlign:'center', marginBottom:32 }}>
          <Link to="/" style={{ display:'inline-flex', alignItems:'center', gap:10, textDecoration:'none', marginBottom:20 }}>
            <div style={{ width:44,height:44,borderRadius:13,background:'linear-gradient(135deg,#38bdf8,#06b6d4)',display:'flex',alignItems:'center',justifyContent:'center',boxShadow:'0 8px 24px rgba(56,189,248,.3)' }}>
              <Compass size={22} color="white"/>
            </div>
            <span style={{ fontWeight:800,fontSize:22,color:'white',letterSpacing:'-0.5px' }}>Tripzy</span>
          </Link>
          <h1 style={{ fontSize:26,fontWeight:800,color:'white',marginBottom:6 }}>Sign in to your account</h1>
          <p style={{ color:'#64748b',fontSize:15 }}>Enter your details below to continue</p>
        </div>

        {/* Form card */}
        <div style={{ background:'rgba(255,255,255,.03)',border:'1px solid rgba(255,255,255,.08)',borderRadius:20,padding:32,backdropFilter:'blur(16px)' }}>
          <form onSubmit={handleSubmit}>

            {/* Email */}
            <div style={{ marginBottom:18 }}>
              <label style={{ display:'block',fontSize:14,fontWeight:500,color:'#cbd5e1',marginBottom:8 }}>
                Email address
              </label>
              <div style={{ position:'relative' }}>
                <Mail size={16} color="#64748b" style={{ position:'absolute',left:14,top:'50%',transform:'translateY(-50%)',pointerEvents:'none' }}/>
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  required
                  style={{ width:'100%',background:'rgba(255,255,255,.05)',border:'1px solid rgba(255,255,255,.1)',borderRadius:12,padding:'12px 14px 12px 42px',color:'white',fontSize:15,outline:'none',boxSizing:'border-box',transition:'border .2s' }}
                  onFocus={e => e.target.style.borderColor='rgba(56,189,248,.5)'}
                  onBlur={e => e.target.style.borderColor='rgba(255,255,255,.1)'}
                />
              </div>
            </div>

            {/* Password */}
            <div style={{ marginBottom:24 }}>
              <label style={{ display:'block',fontSize:14,fontWeight:500,color:'#cbd5e1',marginBottom:8 }}>
                Password
              </label>
              <div style={{ position:'relative' }}>
                <Lock size={16} color="#64748b" style={{ position:'absolute',left:14,top:'50%',transform:'translateY(-50%)',pointerEvents:'none' }}/>
                <input
                  type={showPw ? 'text' : 'password'}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  style={{ width:'100%',background:'rgba(255,255,255,.05)',border:'1px solid rgba(255,255,255,.1)',borderRadius:12,padding:'12px 44px 12px 42px',color:'white',fontSize:15,outline:'none',boxSizing:'border-box',transition:'border .2s' }}
                  onFocus={e => e.target.style.borderColor='rgba(56,189,248,.5)'}
                  onBlur={e => e.target.style.borderColor='rgba(255,255,255,.1)'}
                />
                <button type="button" onClick={() => setShowPw(!showPw)}
                  style={{ position:'absolute',right:14,top:'50%',transform:'translateY(-50%)',background:'none',border:'none',cursor:'pointer',color:'#64748b',display:'flex',alignItems:'center' }}>
                  {showPw ? <EyeOff size={16}/> : <Eye size={16}/>}
                </button>
              </div>
            </div>

            {/* Sign In button */}
            <button type="submit" disabled={isLoading}
              style={{ width:'100%',background:'linear-gradient(135deg,#0ea5e9,#38bdf8)',color:'white',fontWeight:700,fontSize:16,padding:'14px',borderRadius:12,border:'none',cursor:isLoading?'not-allowed':'pointer',opacity:isLoading?.6:1,display:'flex',alignItems:'center',justifyContent:'center',gap:8,transition:'all .2s',boxShadow:'0 8px 24px rgba(14,165,233,.3)' }}>
              {isLoading ? (
                <span style={{ width:18,height:18,border:'2px solid rgba(255,255,255,.3)',borderTop:'2px solid white',borderRadius:'50%',animation:'spin 0.8s linear infinite',display:'inline-block' }}/>
              ) : (
                <><span>Sign In</span><ArrowRight size={17}/></>
              )}
            </button>
          </form>

          {/* Divider */}
          <div style={{ display:'flex',alignItems:'center',gap:12,margin:'20px 0' }}>
            <div style={{ flex:1,height:1,background:'rgba(255,255,255,.08)' }}/>
            <span style={{ color:'#475569',fontSize:13 }}>or</span>
            <div style={{ flex:1,height:1,background:'rgba(255,255,255,.08)' }}/>
          </div>

          {/* Demo button */}
          <button onClick={handleDemo} disabled={isLoading}
            style={{ width:'100%',background:'rgba(255,255,255,.04)',border:'1px solid rgba(255,255,255,.1)',color:'#94a3b8',fontWeight:500,fontSize:14,padding:'12px',borderRadius:12,cursor:'pointer',transition:'all .2s' }}
            onMouseOver={e => { e.currentTarget.style.background='rgba(255,255,255,.08)'; e.currentTarget.style.color='white' }}
            onMouseOut={e => { e.currentTarget.style.background='rgba(255,255,255,.04)'; e.currentTarget.style.color='#94a3b8' }}>
            🚀 Try Demo Account
          </button>
        </div>

        {/* Bottom link - NOT REGISTERED? SIGN UP */}
        <p style={{ textAlign:'center',color:'#64748b',fontSize:15,marginTop:24 }}>
          Don't have an account?{' '}
          <Link to="/register" style={{ color:'#38bdf8',fontWeight:700,textDecoration:'none' }}
            onMouseOver={e => e.target.style.textDecoration='underline'}
            onMouseOut={e => e.target.style.textDecoration='none'}>
            Sign up for free
          </Link>
        </p>

        <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
      </div>
    </div>
  )
}