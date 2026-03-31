import { create } from 'zustand';

const useStore = create((set) => ({
  user: null,
  courses: [],
  questions: [],
  whiteboardData: {},
  loading: true,
  role: 'learner', 
  isSidebarCollapsed: false,
  isEmbed: false,
  // Global Authoring Context
  currentYear: '2024',
  currentTerm: 'T1', // T1 (Jan-Apr), T2 (May-Aug), T3 (Sep-Dec)
  
  // Actions
  toggleSidebar: () => set((state) => ({ isSidebarCollapsed: !state.isSidebarCollapsed })),
  setRole: (role) => set({ role }),
  setIsEmbed: (isEmbed) => set({ isEmbed }),
  setYear: (year) => set({ currentYear: year }),
  setTerm: (term) => set({ currentTerm: term }),
  
  // Semantic ID Generator Utility
  generateSemanticId: (courseCode, typePrefix, index, week) => {
    const { currentYear, currentTerm } = useStore.getState();
    const cleanCode = courseCode?.replace(/\s+/g, '').toUpperCase();
    const weekStr = week ? `_W${week}` : '';
    // Format: 2024_T1_STATS20_W1_A_q1
    return `${currentYear}_${currentTerm}_${cleanCode}${weekStr}_${typePrefix}_q${index}`;
  },
  
  fetchData: async () => {
    try {
      const baseUrl = import.meta.env.BASE_URL;
      
      // 1. Fetch the Global Manifest
      const manifestRes = await fetch(baseUrl + 'manifest.json');
      if (!manifestRes.ok) throw new Error('Manifest not found');
      const manifest = await manifestRes.json();

      // 2. Fetch the Question Bank
      const questionsRes = await fetch(baseUrl + 'chunks/questions.json');
      const questionsData = await questionsRes.json();

      // 3. Parallel fetch all Course Chunks defined in the manifest
      const coursePromises = manifest.courses.map(async (c) => {
        const res = await fetch(baseUrl + c.chunk.replace(/^\//, ''));
        if (!res.ok) return { ...c, modules: [] }; // Fallback for missing chunks
        const data = await res.json();
        return { ...c, modules: data.modules || [] };
      });

      const fullCourses = await Promise.all(coursePromises);

      set({ 
        user: manifest.user || null, 
        courses: fullCourses, 
        questions: questionsData.questions || [],
        whiteboardData: {}, // Whiteboard data can follow a similar chunking strategy later if needed
        loading: false 
      });
    } catch (error) {
      console.error("Failed to fetch modular LMS data:", error);
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
        questions: state.questions,
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
