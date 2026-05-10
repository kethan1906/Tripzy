import { useState } from 'react'
import { useMutation } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import { User, Mail, Lock, Bell, Globe, Palette, Save, Camera } from 'lucide-react'
import useAuthStore from '../store/authStore'
import { authAPI } from '../services/api'
import toast from 'react-hot-toast'

export default function ProfilePage() {
  const { user, updateUser } = useAuthStore()
  const [profile, setProfile] = useState({ name: user?.name || '', email: user?.email || '' })
  const [prefs, setPrefs] = useState({
    currency: user?.preferences?.currency || 'USD',
    travelStyle: user?.preferences?.travelStyle || 'comfort',
    notifications: user?.preferences?.notifications || { email: true, push: true, weatherAlerts: true, crowdAlerts: true }
  })
  const [pw, setPw] = useState({ current: '', new: '', confirm: '' })

  const profileMutation = useMutation({
    mutationFn: () => authAPI.updateProfile({ name: profile.name, preferences: prefs }),
    onSuccess: (res) => { updateUser(res.data.user); toast.success('Profile updated!') },
    onError: () => toast.error('Failed to update profile')
  })

  const pwMutation = useMutation({
    mutationFn: () => authAPI.changePassword ? authAPI.changePassword({ currentPassword: pw.current, newPassword: pw.new }) : Promise.reject(),
    onSuccess: () => { setPw({ current: '', new: '', confirm: '' }); toast.success('Password updated!') },
    onError: (e) => toast.error(e.response?.data?.error || 'Failed to update password')
  })

  const handleProfileSave = (e) => { e.preventDefault(); profileMutation.mutate() }
  const handlePwSave = (e) => {
    e.preventDefault()
    if (pw.new !== pw.confirm) { toast.error('Passwords do not match'); return }
    if (pw.new.length < 6) { toast.error('Password must be at least 6 characters'); return }
    pwMutation.mutate()
  }

  const initials = user?.name?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0,2) || 'U'

  return (
    <div className="space-y-6 animate-fade-in max-w-2xl">
      <div className="page-header">
        <h1 className="page-title">Profile & Settings</h1>
        <p className="page-subtitle">Manage your account and travel preferences</p>
      </div>

      {/* Avatar section */}
      <div className="card p-6 flex items-center gap-5">
        <div className="relative">
          <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-sky-400 to-cyan-500 flex items-center justify-center text-white text-2xl font-bold shadow-lg shadow-sky-500/25">
            {initials}
          </div>
          <button className="absolute -bottom-1 -right-1 w-7 h-7 bg-slate-700 rounded-lg border border-slate-600 flex items-center justify-center hover:bg-slate-600 transition-colors">
            <Camera className="w-3.5 h-3.5 text-slate-300" />
          </button>
        </div>
        <div>
          <h2 className="text-xl font-semibold text-white">{user?.name}</h2>
          <p className="text-slate-400 text-sm">{user?.email}</p>
          <p className="text-xs text-slate-500 mt-1">Member since {user?.createdAt ? new Date(user.createdAt).getFullYear() : '2024'}</p>
        </div>
      </div>

      {/* Profile form */}
      <div className="card p-6">
        <h3 className="section-title flex items-center gap-2"><User className="w-4 h-4 text-sky-400" />Personal Information</h3>
        <form onSubmit={handleProfileSave} className="space-y-4">
          <div><label className="label">Full Name</label><input className="input" value={profile.name} onChange={e => setProfile({...profile, name: e.target.value})} /></div>
          <div><label className="label">Email</label><input type="email" className="input opacity-60 cursor-not-allowed" value={profile.email} disabled /></div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label"><Globe className="w-3.5 h-3.5 inline mr-1" />Currency</label>
              <select className="input" value={prefs.currency} onChange={e => setPrefs({...prefs, currency: e.target.value})}>
                {['USD','EUR','GBP','INR','JPY','CAD','AUD'].map(c => <option key={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label className="label"><Palette className="w-3.5 h-3.5 inline mr-1" />Travel Style</label>
              <select className="input" value={prefs.travelStyle} onChange={e => setPrefs({...prefs, travelStyle: e.target.value})}>
                <option value="budget">Budget</option>
                <option value="comfort">Comfort</option>
                <option value="luxury">Luxury</option>
              </select>
            </div>
          </div>
          <div>
            <label className="label"><Bell className="w-3.5 h-3.5 inline mr-1" />Notifications</label>
            <div className="space-y-2 mt-1">
              {[['email','Email Notifications'],['weatherAlerts','Weather Alerts'],['crowdAlerts','Crowd Alerts'],['push','Push Notifications']].map(([key, label]) => (
                <label key={key} className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-slate-700/20 cursor-pointer">
                  <div className={`w-10 h-5 rounded-full transition-colors ${prefs.notifications[key] ? 'bg-sky-500' : 'bg-slate-600'} relative`}
                    onClick={() => setPrefs({...prefs, notifications: {...prefs.notifications, [key]: !prefs.notifications[key]}})}>
                    <div className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform ${prefs.notifications[key] ? 'translate-x-5' : 'translate-x-0.5'}`} />
                  </div>
                  <span className="text-sm text-slate-300">{label}</span>
                </label>
              ))}
            </div>
          </div>
          <button type="submit" disabled={profileMutation.isPending} className="btn-primary flex items-center gap-2">
            <Save className="w-4 h-4" />{profileMutation.isPending ? 'Saving...' : 'Save Changes'}
          </button>
        </form>
      </div>

      {/* Password form */}
      <div className="card p-6">
        <h3 className="section-title flex items-center gap-2"><Lock className="w-4 h-4 text-sky-400" />Change Password</h3>
        <form onSubmit={handlePwSave} className="space-y-4">
          {[['current','Current Password'],['new','New Password'],['confirm','Confirm New Password']].map(([k,l]) => (
            <div key={k}>
              <label className="label">{l}</label>
              <input type="password" className="input" placeholder="••••••••" value={pw[k]} onChange={e => setPw({...pw, [k]: e.target.value})} required />
            </div>
          ))}
          <button type="submit" disabled={pwMutation.isPending} className="btn-primary flex items-center gap-2">
            <Lock className="w-4 h-4" />{pwMutation.isPending ? 'Updating...' : 'Update Password'}
          </button>
        </form>
      </div>
    </div>
  )
}
