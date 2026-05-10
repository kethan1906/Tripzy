/**
 * Group Detail Page - Chat, polls, shared expenses, balances
 */
import { useState, useRef, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  Users, MessageCircle, BarChart2, Wallet, ArrowLeft,
  Send, Plus, Check, X, ThumbsUp, Hash, DollarSign, RefreshCw
} from 'lucide-react'
import { groupsAPI } from '../services/api'
import { format } from 'date-fns'
import toast from 'react-hot-toast'
import useAuthStore from '../store/authStore'
import { Spinner, Modal } from '../components/common/CrowdBadge'
import clsx from 'clsx'

const TABS = [
  { id: 'chat', label: 'Chat', icon: MessageCircle },
  { id: 'polls', label: 'Polls', icon: ThumbsUp },
  { id: 'expenses', label: 'Expenses', icon: Wallet },
  { id: 'balances', label: 'Balances', icon: DollarSign },
]

export default function GroupDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { user } = useAuthStore()
  const qc = useQueryClient()
  const [activeTab, setActiveTab] = useState('chat')
  const [message, setMessage] = useState('')
  const [sending, setSending] = useState(false)
  const [showAddExpense, setShowAddExpense] = useState(false)
  const [showAddPoll, setShowAddPoll] = useState(false)
  const chatBottomRef = useRef(null)

  const { data, isLoading } = useQuery({
    queryKey: ['group', id],
    queryFn: () => groupsAPI.getOne(id),
    refetchInterval: activeTab === 'chat' ? 10000 : false,
  })
  const { data: balancesData } = useQuery({
    queryKey: ['group-balances', id],
    queryFn: () => groupsAPI.getBalances(id),
    enabled: activeTab === 'balances',
  })

  const group = data?.data?.group

  useEffect(() => {
    chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [group?.chatMessages?.length])

  const sendMessage = async (e) => {
    e.preventDefault()
    if (!message.trim()) return
    setSending(true)
    try {
      await groupsAPI.sendMessage(id, { message: message.trim() })
      setMessage('')
      qc.invalidateQueries(['group', id])
    } catch { toast.error('Failed to send') }
    setSending(false)
  }

  const voteMutation = useMutation({
    mutationFn: ({ pollId, optionId }) => groupsAPI.vote(id, pollId, { optionId }),
    onSuccess: () => qc.invalidateQueries(['group', id]),
  })

  if (isLoading) return <div className="flex justify-center py-20"><Spinner size="lg" /></div>
  if (!group) return <div className="text-center py-20 text-slate-400">Group not found</div>

  const activeMembers = group.members?.filter(m => m.status === 'active') || []
  const messages = group.chatMessages || []

  return (
    <div className="animate-fade-in h-[calc(100vh-8rem)] flex flex-col">
      {/* Header */}
      <div className="flex items-center gap-3 mb-4 flex-shrink-0">
        <button onClick={() => navigate('/groups')} className="btn-ghost p-2">
          <ArrowLeft className="w-4 h-4" />
        </button>
        <div className="w-10 h-10 bg-gradient-to-br from-violet-500 to-purple-600 rounded-xl flex items-center justify-center text-white font-bold">
          {group.name?.charAt(0)}
        </div>
        <div className="flex-1">
          <h1 className="font-display font-bold text-white">{group.name}</h1>
          <div className="text-xs text-slate-400">{activeMembers.length} members · Code: <span className="font-mono text-sky-400">{group.inviteCode}</span></div>
        </div>
        <div className="flex -space-x-2">
          {activeMembers.slice(0, 4).map((m, i) => (
            <div key={i} title={m.user?.name} className="w-8 h-8 rounded-full bg-gradient-to-br from-sky-500 to-cyan-600 border-2 border-slate-900 flex items-center justify-center text-white text-xs font-bold">
              {m.user?.name?.charAt(0)}
            </div>
          ))}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-4 p-1 bg-slate-800 rounded-xl flex-shrink-0">
        {TABS.map(({ id: tid, label, icon: Icon }) => (
          <button key={tid} onClick={() => setActiveTab(tid)}
            className={clsx('flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium transition-all flex-1 justify-center',
              activeTab === tid ? 'bg-sky-500 text-white' : 'text-slate-400 hover:text-slate-200'
            )}>
            <Icon className="w-3.5 h-3.5" />{label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="flex-1 overflow-hidden flex flex-col">
        {/* CHAT */}
        {activeTab === 'chat' && (
          <div className="flex flex-col flex-1 overflow-hidden">
            <div className="flex-1 overflow-y-auto space-y-3 pr-1 pb-2">
              {messages.length === 0 ? (
                <div className="text-center py-8 text-slate-500 text-sm">No messages yet. Say hello! 👋</div>
              ) : messages.map((msg, i) => {
                const isMe = msg.user?._id === user?._id || msg.user === user?._id
                return (
                  <div key={i} className={clsx('flex gap-2', isMe && 'flex-row-reverse')}>
                    <div className="w-7 h-7 rounded-full bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                      {msg.user?.name?.charAt(0) || '?'}
                    </div>
                    <div className={clsx('max-w-[75%]', isMe && 'items-end flex flex-col')}>
                      {!isMe && <div className="text-[10px] text-slate-500 mb-1 ml-1">{msg.user?.name}</div>}
                      <div className={clsx('px-3 py-2 rounded-2xl text-sm', isMe ? 'bg-sky-500 text-white rounded-tr-sm' : 'bg-slate-800 text-slate-200 rounded-tl-sm')}>
                        {msg.message}
                      </div>
                      <div className="text-[10px] text-slate-600 mt-0.5 mx-1">
                        {format(new Date(msg.timestamp), 'HH:mm')}
                      </div>
                    </div>
                  </div>
                )
              })}
              <div ref={chatBottomRef} />
            </div>
            <form onSubmit={sendMessage} className="flex gap-2 mt-2 flex-shrink-0">
              <input value={message} onChange={e => setMessage(e.target.value)} className="input flex-1 py-2.5" placeholder="Type a message..." />
              <button type="submit" disabled={sending || !message.trim()} className="btn-primary px-4 py-2.5">
                {sending ? <Spinner size="sm" /> : <Send className="w-4 h-4" />}
              </button>
            </form>
          </div>
        )}

        {/* POLLS */}
        {activeTab === 'polls' && (
          <div className="flex-1 overflow-y-auto space-y-4">
            <button onClick={() => setShowAddPoll(true)} className="btn-secondary w-full flex items-center justify-center gap-2 text-sm">
              <Plus className="w-4 h-4" /> Create Poll
            </button>
            {group.polls?.length === 0 ? (
              <div className="text-center py-8 text-slate-500 text-sm">No polls yet. Create one to vote!</div>
            ) : (
              group.polls.map(poll => (
                <div key={poll._id} className="card p-4">
                  <div className="flex items-start justify-between mb-3">
                    <h4 className="font-medium text-white">{poll.question}</h4>
                    <span className={clsx('badge text-[10px]', poll.isOpen ? 'badge-low' : 'bg-slate-600/30 text-slate-400 border-slate-600 badge')}>
                      {poll.isOpen ? 'Open' : 'Closed'}
                    </span>
                  </div>
                  <div className="space-y-2">
                    {poll.options?.map(opt => {
                      const totalVotes = poll.options.reduce((s, o) => s + (o.votes?.length || 0), 0)
                      const pct = totalVotes > 0 ? Math.round((opt.votes?.length / totalVotes) * 100) : 0
                      const hasVoted = opt.votes?.includes(user?._id)
                      return (
                        <button key={opt._id} onClick={() => poll.isOpen && voteMutation.mutate({ pollId: poll._id, optionId: opt._id })}
                          disabled={!poll.isOpen}
                          className={clsx('w-full text-left p-3 rounded-xl border transition-all relative overflow-hidden',
                            hasVoted ? 'border-sky-500/40 bg-sky-500/10' : 'border-slate-700 hover:border-slate-600'
                          )}>
                          <div className="absolute inset-0 bg-sky-500/10 transition-all" style={{ width: `${pct}%` }} />
                          <div className="relative flex items-center justify-between">
                            <span className="text-sm text-slate-200">{opt.label}</span>
                            <div className="flex items-center gap-2 text-xs text-slate-400">
                              {hasVoted && <Check className="w-3 h-3 text-sky-400" />}
                              <span>{opt.votes?.length || 0} · {pct}%</span>
                            </div>
                          </div>
                        </button>
                      )
                    })}
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* EXPENSES */}
        {activeTab === 'expenses' && (
          <div className="flex-1 overflow-y-auto space-y-3">
            <button onClick={() => setShowAddExpense(true)} className="btn-secondary w-full flex items-center justify-center gap-2 text-sm">
              <Plus className="w-4 h-4" /> Add Group Expense
            </button>
            {group.groupExpenses?.length === 0 ? (
              <div className="text-center py-8 text-slate-500 text-sm">No group expenses yet</div>
            ) : group.groupExpenses.map((exp, i) => (
              <div key={i} className="card p-4">
                <div className="flex items-start justify-between">
                  <div>
                    <div className="font-medium text-slate-200">{exp.title}</div>
                    <div className="text-xs text-slate-400 mt-0.5">
                      Paid by <span className="text-sky-400">{exp.paidBy?.name || 'Unknown'}</span>
                      · Split {exp.splitType}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-bold text-white">${exp.amount}</div>
                    <div className="text-xs text-slate-400">{exp.currency}</div>
                  </div>
                </div>
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {exp.splits?.map((s, j) => (
                    <span key={j} className={clsx('text-[10px] px-2 py-0.5 rounded-full border', s.settled ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/20' : 'bg-slate-700/50 text-slate-400 border-slate-600')}>
                      {s.user?.name || 'Member'}: ${s.amount?.toFixed(2)} {s.settled && '✓'}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* BALANCES */}
        {activeTab === 'balances' && (
          <div className="flex-1 overflow-y-auto">
            {!balancesData ? (
              <div className="flex justify-center py-8"><Spinner /></div>
            ) : (
              <div className="space-y-3">
                <div className="card p-4 text-center">
                  <div className="text-2xl font-bold text-white">${balancesData.data?.totalGroupSpend?.toFixed(2)}</div>
                  <div className="text-slate-400 text-sm">Total Group Spend</div>
                </div>
                {Object.entries(balancesData.data?.balances || {}).map(([userId, amount]) => {
                  const member = group.members?.find(m => m.user?._id === userId || m.user === userId)
                  return (
                    <div key={userId} className="card p-4 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 bg-gradient-to-br from-violet-500 to-purple-600 rounded-full flex items-center justify-center text-white text-sm font-bold">
                          {member?.user?.name?.charAt(0) || '?'}
                        </div>
                        <div className="font-medium text-slate-200">{member?.user?.name || 'Member'}</div>
                      </div>
                      <div className={clsx('font-bold text-lg', amount > 0 ? 'text-emerald-400' : amount < 0 ? 'text-rose-400' : 'text-slate-400')}>
                        {amount > 0 ? `+$${amount.toFixed(2)} owed` : amount < 0 ? `-$${Math.abs(amount).toFixed(2)} owes` : 'Settled ✓'}
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Add Expense Modal */}
      {showAddExpense && <AddGroupExpenseModal groupId={id} members={activeMembers} onClose={() => setShowAddExpense(false)} onAdded={() => qc.invalidateQueries(['group', id])} />}
      {showAddPoll && <AddPollModal groupId={id} onClose={() => setShowAddPoll(false)} onAdded={() => qc.invalidateQueries(['group', id])} />}
    </div>
  )
}

function AddGroupExpenseModal({ groupId, members, onClose, onAdded }) {
  const [form, setForm] = useState({ title: '', amount: '', category: 'food', splitBetween: members.map(m => m.user?._id).filter(Boolean) })
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    try {
      await groupsAPI.addExpense(groupId, { ...form, amount: parseFloat(form.amount) })
      toast.success('Expense added and split!')
      onAdded()
      onClose()
    } catch (err) { toast.error(err.response?.data?.error || 'Failed') }
    setLoading(false)
  }

  return (
    <Modal isOpen onClose={onClose} title="Add Group Expense">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="label">Title *</label>
          <input type="text" value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} className="input" placeholder="e.g. Dinner at Café Paris" required />
        </div>
        <div>
          <label className="label">Amount (USD) *</label>
          <input type="number" min="0" step="0.01" value={form.amount} onChange={e => setForm(f => ({ ...f, amount: e.target.value }))} className="input" placeholder="120.00" required />
        </div>
        {form.amount && form.splitBetween.length > 0 && (
          <div className="p-3 bg-sky-500/10 border border-sky-500/20 rounded-xl text-sm text-sky-300">
            Each person pays: <strong>${(parseFloat(form.amount || 0) / form.splitBetween.length).toFixed(2)}</strong>
          </div>
        )}
        <div className="flex gap-3">
          <button type="button" onClick={onClose} className="btn-secondary flex-1">Cancel</button>
          <button type="submit" disabled={loading} className="btn-primary flex-1 flex items-center justify-center gap-2">
            {loading ? <Spinner size="sm" /> : 'Split & Add'}
          </button>
        </div>
      </form>
    </Modal>
  )
}

function AddPollModal({ groupId, onClose, onAdded }) {
  const [question, setQuestion] = useState('')
  const [options, setOptions] = useState(['', ''])
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    const validOptions = options.filter(o => o.trim())
    if (validOptions.length < 2) return toast.error('Need at least 2 options')
    setLoading(true)
    try {
      await groupsAPI.createPoll(groupId, { question, options: validOptions.map(label => ({ label })) })
      toast.success('Poll created!')
      onAdded()
      onClose()
    } catch (err) { toast.error(err.response?.data?.error || 'Failed') }
    setLoading(false)
  }

  return (
    <Modal isOpen onClose={onClose} title="Create Poll">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="label">Question *</label>
          <input type="text" value={question} onChange={e => setQuestion(e.target.value)} className="input" placeholder="e.g. Where should we eat tonight?" required />
        </div>
        <div>
          <label className="label">Options</label>
          <div className="space-y-2">
            {options.map((opt, i) => (
              <div key={i} className="flex gap-2">
                <input type="text" value={opt} onChange={e => { const o = [...options]; o[i] = e.target.value; setOptions(o) }}
                  className="input flex-1" placeholder={`Option ${i + 1}`} />
                {options.length > 2 && (
                  <button type="button" onClick={() => setOptions(options.filter((_, j) => j !== i))} className="btn-ghost p-2 text-rose-400"><X className="w-4 h-4" /></button>
                )}
              </div>
            ))}
          </div>
          <button type="button" onClick={() => setOptions([...options, ''])} className="btn-ghost text-xs mt-2 flex items-center gap-1">
            <Plus className="w-3 h-3" /> Add Option
          </button>
        </div>
        <div className="flex gap-3">
          <button type="button" onClick={onClose} className="btn-secondary flex-1">Cancel</button>
          <button type="submit" disabled={loading} className="btn-primary flex-1 flex items-center justify-center gap-2">
            {loading ? <Spinner size="sm" /> : 'Create Poll'}
          </button>
        </div>
      </form>
    </Modal>
  )
}
