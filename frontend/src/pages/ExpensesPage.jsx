import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import { DollarSign, Plus, Trash2, TrendingUp, TrendingDown, PieChart, Filter } from 'lucide-react'
import { format } from 'date-fns'
import { PieChart as RePieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts'
import { expensesAPI, tripsAPI } from '../services/api'
import toast from 'react-hot-toast'
import clsx from 'clsx'

const CATEGORIES = ['transport','accommodation','food','activities','shopping','health','communication','misc']
const CAT_COLORS = { transport:'#0ea5e9', accommodation:'#8b5cf6', food:'#f59e0b', activities:'#22c55e', shopping:'#f43f5e', health:'#06b6d4', communication:'#a78bfa', misc:'#94a3b8' }
const CAT_ICONS = { transport:'✈️', accommodation:'🏨', food:'🍽️', activities:'🎯', shopping:'🛍️', health:'💊', communication:'📱', misc:'📦' }

export default function ExpensesPage() {
  const [selectedTrip, setSelectedTrip] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ title: '', amount: '', category: 'food', date: new Date().toISOString().split('T')[0], paymentMethod: 'card', notes: '' })
  const qc = useQueryClient()

  const { data: tripsData } = useQuery({ queryKey: ['trips-all'], queryFn: () => tripsAPI.getAll({ limit: 50 }) })
  const trips = tripsData?.data?.trips || []

  const { data: expData, isLoading } = useQuery({
    queryKey: ['expenses', selectedTrip],
    queryFn: () => expensesAPI.getAll(selectedTrip),
    enabled: !!selectedTrip,
  })

  const { data: analysisData } = useQuery({
    queryKey: ['budget-analysis', selectedTrip],
    queryFn: () => expensesAPI.getAnalysis(selectedTrip),
    enabled: !!selectedTrip,
  })

  const createMutation = useMutation({
    mutationFn: (d) => expensesAPI.create({ ...d, trip: selectedTrip }),
    onSuccess: () => { qc.invalidateQueries(['expenses', selectedTrip]); qc.invalidateQueries(['budget-analysis', selectedTrip]); setShowForm(false); setForm({ title: '', amount: '', category: 'food', date: new Date().toISOString().split('T')[0], paymentMethod: 'card', notes: '' }); toast.success('Expense added!') },
    onError: () => toast.error('Failed to add expense')
  })

  const deleteMutation = useMutation({
    mutationFn: expensesAPI.delete,
    onSuccess: () => { qc.invalidateQueries(['expenses', selectedTrip]); qc.invalidateQueries(['budget-analysis', selectedTrip]); toast.success('Expense deleted') },
  })

  const expenses = expData?.data?.expenses || []
  const analysis = analysisData?.data?.analysis || null
  const pieData = analysis ? Object.entries(analysis.byCategory).map(([name, value]) => ({ name, value: Math.round(value) })) : []
  const dailyData = analysis ? Object.entries(analysis.dailySpending).map(([date, amount]) => ({ date: date.slice(5), amount: Math.round(amount) })).slice(-14) : []

  const handleSubmit = (e) => { e.preventDefault(); if (!selectedTrip) { toast.error('Select a trip first'); return }; createMutation.mutate({ ...form, amount: Number(form.amount) }) }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="page-header mb-0"><h1 className="page-title">Expense Tracker</h1><p className="page-subtitle">Monitor your spending against your budget</p></div>
        <div className="flex gap-3">
          <select className="input w-48" value={selectedTrip} onChange={e => setSelectedTrip(e.target.value)}>
            <option value="">Select a trip</option>
            {trips.map(t => <option key={t._id} value={t._id}>{t.title}</option>)}
          </select>
          {selectedTrip && <button onClick={() => setShowForm(!showForm)} className="btn-primary flex items-center gap-2"><Plus className="w-4 h-4" /> Add</button>}
        </div>
      </div>

      {!selectedTrip && (
        <div className="card p-16 text-center text-slate-500">
          <DollarSign className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p>Select a trip to view and track expenses</p>
        </div>
      )}

      {selectedTrip && (
        <>
          {/* Budget summary */}
          {analysis && (
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              {[
                { label: 'Total Budget', value: `$${analysis.totalBudget?.toLocaleString()}`, icon: DollarSign, color: 'text-sky-400', bg: 'bg-sky-500/10' },
                { label: 'Total Spent', value: `$${analysis.totalSpent?.toFixed(0)}`, icon: TrendingUp, color: analysis.isOverBudget ? 'text-rose-400' : 'text-emerald-400', bg: analysis.isOverBudget ? 'bg-rose-500/10' : 'bg-emerald-500/10' },
                { label: 'Remaining', value: `$${analysis.remaining?.toFixed(0)}`, icon: TrendingDown, color: 'text-amber-400', bg: 'bg-amber-500/10' },
                { label: '% Used', value: `${analysis.percentUsed}%`, icon: PieChart, color: 'text-purple-400', bg: 'bg-purple-500/10' },
              ].map(({ label, value, icon: Icon, color, bg }) => (
                <div key={label} className="stat-card">
                  <div className={`w-9 h-9 ${bg} rounded-xl flex items-center justify-center`}><Icon className={`w-4 h-4 ${color}`} /></div>
                  <div className="text-xl font-bold text-white">{value}</div>
                  <div className="text-xs text-slate-400">{label}</div>
                </div>
              ))}
            </div>
          )}

          {/* Budget progress bar */}
          {analysis && (
            <div className="card p-4">
              <div className="flex justify-between text-sm mb-2">
                <span className="text-slate-400">Budget Used</span>
                <span className={analysis.percentUsed > 90 ? 'text-rose-400 font-medium' : 'text-slate-300'}>{analysis.percentUsed}%</span>
              </div>
              <div className="h-3 bg-slate-700 rounded-full overflow-hidden">
                <motion.div initial={{ width: 0 }} animate={{ width: `${Math.min(analysis.percentUsed, 100)}%` }} transition={{ duration: 0.8, ease: 'easeOut' }}
                  className={clsx('h-full rounded-full', analysis.percentUsed > 90 ? 'bg-rose-500' : analysis.percentUsed > 70 ? 'bg-amber-500' : 'bg-sky-500')} />
              </div>
              {analysis.projectedTotal && <p className="text-xs text-slate-500 mt-2">Projected total at current rate: <span className="text-slate-300">${analysis.projectedTotal?.toFixed(0)}</span></p>}
            </div>
          )}

          {/* Charts */}
          {pieData.length > 0 && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <div className="card p-5">
                <h3 className="section-title">Spending by Category</h3>
                <ResponsiveContainer width="100%" height={220}>
                  <RePieChart>
                    <Pie data={pieData} cx="50%" cy="50%" innerRadius={55} outerRadius={85} paddingAngle={3} dataKey="value" label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`} labelLine={false}>
                      {pieData.map((entry) => <Cell key={entry.name} fill={CAT_COLORS[entry.name] || '#64748b'} />)}
                    </Pie>
                    <Tooltip formatter={(v) => [`$${v}`, 'Amount']} contentStyle={{ background: '#1e293b', border: '1px solid #334155', borderRadius: '8px', color: '#f1f5f9' }} />
                  </RePieChart>
                </ResponsiveContainer>
              </div>
              {dailyData.length > 0 && (
                <div className="card p-5">
                  <h3 className="section-title">Daily Spending</h3>
                  <ResponsiveContainer width="100%" height={220}>
                    <BarChart data={dailyData}>
                      <XAxis dataKey="date" tick={{ fill: '#94a3b8', fontSize: 11 }} axisLine={false} tickLine={false} />
                      <YAxis tick={{ fill: '#94a3b8', fontSize: 11 }} axisLine={false} tickLine={false} />
                      <Tooltip formatter={(v) => [`$${v}`, 'Spent']} contentStyle={{ background: '#1e293b', border: '1px solid #334155', borderRadius: '8px', color: '#f1f5f9' }} />
                      <Bar dataKey="amount" fill="#0ea5e9" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}
            </div>
          )}

          {/* Add expense form */}
          {showForm && (
            <div className="card p-5">
              <h3 className="section-title">Add Expense</h3>
              <form onSubmit={handleSubmit} className="grid grid-cols-2 md:grid-cols-3 gap-3">
                <div className="col-span-2 md:col-span-1"><label className="label">Title</label><input className="input" placeholder="e.g. Lunch at cafe" value={form.title} onChange={e => setForm({...form,title:e.target.value})} required /></div>
                <div><label className="label">Amount ($)</label><input type="number" step="0.01" className="input" placeholder="0.00" value={form.amount} onChange={e => setForm({...form,amount:e.target.value})} required /></div>
                <div><label className="label">Category</label>
                  <select className="input" value={form.category} onChange={e => setForm({...form,category:e.target.value})}>
                    {CATEGORIES.map(c => <option key={c} value={c}>{CAT_ICONS[c]} {c}</option>)}
                  </select>
                </div>
                <div><label className="label">Date</label><input type="date" className="input" value={form.date} onChange={e => setForm({...form,date:e.target.value})} /></div>
                <div><label className="label">Payment</label>
                  <select className="input" value={form.paymentMethod} onChange={e => setForm({...form,paymentMethod:e.target.value})}>
                    {['cash','card','online','other'].map(m => <option key={m} value={m}>{m}</option>)}
                  </select>
                </div>
                <div className="col-span-2 md:col-span-1 flex items-end">
                  <button type="submit" disabled={createMutation.isPending} className="btn-primary w-full">
                    {createMutation.isPending ? 'Adding...' : 'Add Expense'}
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Expense list */}
          <div className="card p-5">
            <h3 className="section-title">Transactions ({expenses.length})</h3>
            {isLoading ? <div className="space-y-2">{[...Array(5)].map((_,i) => <div key={i} className="skeleton h-14 rounded-xl" />)}</div> :
              expenses.length === 0 ? <div className="text-center py-10 text-slate-500">No expenses recorded yet</div> :
              <div className="space-y-2">
                {expenses.map(e => (
                  <div key={e._id} className="flex items-center gap-3 p-3 rounded-xl hover:bg-slate-700/20 transition-colors group">
                    <div className="w-9 h-9 rounded-xl flex items-center justify-center text-lg bg-slate-700/40 flex-shrink-0">{CAT_ICONS[e.category] || '📦'}</div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-slate-200 text-sm truncate">{e.title}</p>
                      <p className="text-xs text-slate-500">{format(new Date(e.date), 'MMM d, yyyy')} • {e.category} • {e.paymentMethod}</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="font-semibold text-white">${e.amount.toFixed(2)}</span>
                      <button onClick={() => deleteMutation.mutate(e._id)} className="opacity-0 group-hover:opacity-100 transition-opacity text-slate-500 hover:text-rose-400">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            }
          </div>
        </>
      )}
    </div>
  )
}
