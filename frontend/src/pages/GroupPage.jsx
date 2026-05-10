/**
 * Group Travel Page - manage shared trips, expenses, polls
 */
import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { Users, Plus, ArrowRight, Hash, Copy, Check } from 'lucide-react'
import { groupsAPI, tripsAPI } from '../services/api'
import { format } from 'date-fns'
import toast from 'react-hot-toast'
import { Spinner, EmptyState, Modal } from '../components/common/CrowdBadge'
import clsx from 'clsx'

export default function GroupPage() {
  const [showCreate, setShowCreate] = useState(false)
  const [joinCode, setJoinCode] = useState('')
  const [joining, setJoining] = useState(false)
  const qc = useQueryClient()

  const { data, isLoading } = useQuery({
    queryKey: ['groups'],
    queryFn: () => groupsAPI.getAll(),
  })
  const groups = data?.data?.groups || []

  const handleJoin = async (e) => {
    e.preventDefault()
    if (!joinCode.trim()) return
    setJoining(true)
    try {
      await groupsAPI.join(joinCode.trim().toUpperCase())
      qc.invalidateQueries(['groups'])
      toast.success('Joined group successfully!')
      setJoinCode('')
    } catch (err) {
      toast.error(err.response?.data?.error || 'Invalid invite code')
    }
    setJoining(false)
  }

  return (
    <div className="animate-fade-in">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="page-title">Group Travel</h1>
          <p className="page-subtitle">Plan, share, and split expenses with your travel crew</p>
        </div>
        <button onClick={() => setShowCreate(true)} className="btn-primary flex items-center gap-2">
          <Plus className="w-4 h-4" /> New Group
        </button>
      </div>

      {/* Join by code */}
      <div className="card p-4 mb-6">
        <h3 className="text-sm font-semibold text-slate-300 mb-3 flex items-center gap-2">
          <Hash className="w-4 h-4 text-sky-400" /> Join a Group
        </h3>
        <form onSubmit={handleJoin} className="flex gap-2">
          <input
            value={joinCode}
            onChange={e => setJoinCode(e.target.value.toUpperCase())}
            className="input flex-1 uppercase tracking-widest font-mono"
            placeholder="ENTER INVITE CODE"
            maxLength={6}
          />
          <button type="submit" disabled={joining || !joinCode} className="btn-primary flex items-center gap-2">
            {joining ? <Spinner size="sm" /> : 'Join'}
          </button>
        </form>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12"><Spinner size="lg" /></div>
      ) : groups.length === 0 ? (
        <EmptyState
          icon={Users}
          title="No groups yet"
          description="Create a group to plan trips together, split expenses, and vote on decisions."
          action={<button onClick={() => setShowCreate(true)} className="btn-primary inline-flex items-center gap-2"><Plus className="w-4 h-4" />Create Group</button>}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {groups.map(group => <GroupCard key={group._id} group={group} />)}
        </div>
      )}

      <CreateGroupModal isOpen={showCreate} onClose={() => setShowCreate(false)} />
    </div>
  )
}

function GroupCard({ group }) {
  const [copied, setCopied] = useState(false)
  const memberCount = group.members?.filter(m => m.status === 'active').length || 0

  const copyCode = (e) => {
    e.preventDefault()
    navigator.clipboard.writeText(group.inviteCode)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <Link to={`/groups/${group._id}`} className="card-hover group block">
      <div className="h-20 bg-gradient-to-br from-violet-600 to-purple-700 rounded-t-2xl relative">
        <div className="absolute inset-0 bg-black/20 rounded-t-2xl" />
        <div className="absolute bottom-3 left-4">
          <div className="font-display font-bold text-white text-lg">{group.name}</div>
        </div>
      </div>
      <div className="p-4">
        {group.description && <p className="text-slate-400 text-sm mb-3 line-clamp-2">{group.description}</p>}
        {group.trip && (
          <div className="text-xs text-slate-500 mb-3 flex items-center gap-1">
            📍 {group.trip.title}
          </div>
        )}
        <div className="flex items-center justify-between">
          <div className="flex -space-x-2">
            {group.members?.slice(0, 4).map((m, i) => (
              <div key={i} className="w-7 h-7 rounded-full bg-gradient-to-br from-sky-500 to-cyan-600 border-2 border-slate-800 flex items-center justify-center text-white text-[10px] font-bold">
                {m.user?.name?.charAt(0) || '?'}
              </div>
            ))}
            {memberCount > 4 && <div className="w-7 h-7 rounded-full bg-slate-700 border-2 border-slate-800 flex items-center justify-center text-slate-300 text-[10px]">+{memberCount - 4}</div>}
          </div>
          <button
            onClick={copyCode}
            className="flex items-center gap-1 text-xs text-slate-400 hover:text-sky-400 transition-colors bg-slate-700/50 px-2 py-1 rounded-lg"
          >
            {copied ? <><Check className="w-3 h-3 text-emerald-400" />Copied!</> : <><Copy className="w-3 h-3" />{group.inviteCode}</>}
          </button>
        </div>
        <div className="flex items-center justify-between mt-3 text-xs text-slate-500">
          <span>{memberCount} members</span>
          <span className="flex items-center gap-1 text-sky-400 group-hover:gap-2 transition-all">
            Open <ArrowRight className="w-3 h-3" />
          </span>
        </div>
      </div>
    </Link>
  )
}

function CreateGroupModal({ isOpen, onClose }) {
  const qc = useQueryClient()
  const { data: tripsData } = useQuery({ queryKey: ['trips'], queryFn: () => tripsAPI.getAll() })
  const trips = tripsData?.data?.trips || []
  const [form, setForm] = useState({ name: '', description: '', tripId: '' })
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    try {
      await groupsAPI.create({ name: form.name, description: form.description, tripId: form.tripId || undefined })
      qc.invalidateQueries(['groups'])
      toast.success('Group created!')
      onClose()
      setForm({ name: '', description: '', tripId: '' })
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to create group')
    }
    setLoading(false)
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Create Travel Group">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="label">Group Name *</label>
          <input type="text" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} className="input" placeholder="e.g. Europe Squad 2025" required />
        </div>
        <div>
          <label className="label">Description</label>
          <textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} className="input resize-none" rows={2} placeholder="What's this group for?" />
        </div>
        <div>
          <label className="label">Link to Trip (optional)</label>
          <select value={form.tripId} onChange={e => setForm(f => ({ ...f, tripId: e.target.value }))} className="input">
            <option value="">No specific trip</option>
            {trips.map(t => <option key={t._id} value={t._id}>{t.title}</option>)}
          </select>
        </div>
        <div className="flex gap-3">
          <button type="button" onClick={onClose} className="btn-secondary flex-1">Cancel</button>
          <button type="submit" disabled={loading} className="btn-primary flex-1 flex items-center justify-center gap-2">
            {loading ? <Spinner size="sm" /> : <><Users className="w-4 h-4" />Create</>}
          </button>
        </div>
      </form>
    </Modal>
  )
}
