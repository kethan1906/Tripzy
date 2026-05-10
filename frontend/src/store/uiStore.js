import { create } from 'zustand'

const useUIStore = create((set, get) => ({
  sidebarOpen: true,
  notifications: [],
  unreadCount: 0,
  activeTrip: null,

  toggleSidebar: () => set(s => ({ sidebarOpen: !s.sidebarOpen })),
  setSidebarOpen: (val) => set({ sidebarOpen: val }),

  setActiveTrip: (trip) => set({ activeTrip: trip }),

  addNotification: (notification) => {
    const id = Date.now().toString()
    set(s => ({
      notifications: [{ ...notification, id, createdAt: new Date() }, ...s.notifications.slice(0, 49)],
      unreadCount: s.unreadCount + 1,
    }))
    return id
  },

  markNotificationRead: (id) => {
    set(s => ({
      notifications: s.notifications.map(n => n.id === id ? { ...n, read: true } : n),
      unreadCount: Math.max(0, s.unreadCount - 1),
    }))
  },

  clearNotifications: () => set({ notifications: [], unreadCount: 0 }),

  setUnreadCount: (count) => set({ unreadCount: count }),
}))

export default useUIStore
