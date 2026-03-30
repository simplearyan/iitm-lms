import { create } from 'zustand';

const useStore = create((set) => ({
  user: null,
  courses: [],
  whiteboardData: {},
  loading: true,
  role: 'learner', // 'learner' or 'instructor'
  isSidebarCollapsed: false,
  isEmbed: false,
  
  // Actions
  toggleSidebar: () => set((state) => ({ isSidebarCollapsed: !state.isSidebarCollapsed })),
  setRole: (role) => set({ role }),
  setIsEmbed: (isEmbed) => set({ isEmbed }),
  
  fetchData: async () => {
    try {
      // In a production static deployment, base paths must resolve relative to the root public folder
      const response = await fetch(import.meta.env.BASE_URL + 'data.json');
      if (!response.ok) throw new Error('Network response was not ok');
      const data = await response.json();
      set({ 
        user: data.user || null, 
        courses: data.courses || [], 
        whiteboardData: data.whiteboardData || {},
        loading: false 
      });
    } catch (error) {
      console.error("Failed to fetch data.json:", error);
      set({ loading: false });
    }
  },

  // Save whiteboard data
  updateWhiteboardData: (qId, elements) => set((state) => ({
    whiteboardData: {
      ...state.whiteboardData,
      [qId]: elements
    }
  })),
  
  // Save activity answers temporarily in memory (student side only)
  // For static nature, learner progress isn't exported/saved unless requested, 
  // but we track it per-session.
  activityProgress: {}, 
  setActivityProgress: (qId, answer) => set((state) => ({
    activityProgress: {
      ...state.activityProgress,
      [qId]: answer
    }
  })),

  // Instructor Action: Update Courses list
  setCourses: (courses) => set({ courses }),

  // Instructor Action: Export Configuration
  exportData: () => {
    set((state) => {
      const payload = {
        user: state.user,
        courses: state.courses,
        whiteboardData: state.whiteboardData
      };
      const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'data.json';
      a.click();
      URL.revokeObjectURL(url);
      return state; 
    });
  }
}));

export default useStore;
