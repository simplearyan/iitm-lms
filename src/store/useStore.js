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
  isLocalDraft: false,
  // Global Authoring Context
  currentYear: '2024',
  currentTerm: 'T1', // T1 (Jan-Apr), T2 (May-Aug), T3 (Sep-Dec)
  
  // Actions
  toggleSidebar: () => set((state) => ({ isSidebarCollapsed: !state.isSidebarCollapsed })),
  setRole: (role) => set({ role }),
  setIsEmbed: (isEmbed) => set({ isEmbed }),
  setYear: (year) => {
    set({ currentYear: year });
    useStore.getState().saveToLocal();
  },
  setTerm: (term) => {
    set({ currentTerm: term });
    useStore.getState().saveToLocal();
  },
  
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

      // --- HYDRATION LOGIC: Check Local Drafts ---
      const localDraft = localStorage.getItem('lms_local_draft');
      let finalCourses = fullCourses;
      let finalQuestions = questionsData.questions || [];
      let isDraft = false;

      if (localDraft) {
        try {
          const draft = JSON.parse(localDraft);
          finalCourses = draft.courses || fullCourses;
          finalQuestions = draft.questions || finalQuestions;
          isDraft = true;
          console.log("🚀 Hydrated from local draft.");
        } catch (e) {
          console.error("Local draft corrupted:", e);
        }
      }

      set({ 
        user: manifest.user || null, 
        courses: finalCourses, 
        questions: finalQuestions,
        isLocalDraft: isDraft,
        whiteboardData: {}, 
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

  setCourses: (courses) => {
    // Sync any inline questions with the global question bank if IDs match
    const { questions } = useStore.getState();
    let updatedGlobalBank = [...questions];
    let syncCount = 0;

    courses.forEach(course => {
      course.modules?.forEach(module => {
        module.items?.forEach(item => {
          if (['activity', 'quiz', 'assignment'].includes(item.type) && item.questions) {
            item.questions.forEach(q => {
               const gIdx = updatedGlobalBank.findIndex(gq => gq.id === q.id);
               if (gIdx !== -1) {
                  updatedGlobalBank[gIdx] = { ...updatedGlobalBank[gIdx], ...q };
                  syncCount++;
               }
            });
          }
        });
      });
    });

    if (syncCount > 0) {
       console.log(`Synced ${syncCount} questions to Master Bank.`);
       set({ courses, questions: updatedGlobalBank, isLocalDraft: true });
    } else {
       set({ courses, isLocalDraft: true });
    }
    
    useStore.getState().saveToLocal();
  },

  updateGlobalQuestion: (updatedQ) => {
    const { questions } = useStore.getState();
    const newQs = questions.map(q => q.id === updatedQ.id ? { ...q, ...updatedQ } : q);
    set({ questions: newQs, isLocalDraft: true });
    useStore.getState().saveToLocal();
  },

  // Persistence Helpers
  saveToLocal: () => {
    const { courses, questions } = useStore.getState();
    localStorage.setItem('lms_local_draft', JSON.stringify({ courses, questions }));
  },

  resetToRemote: async () => {
    if (!window.confirm("Discard all local edits and reset to server version?")) return;
    localStorage.removeItem('lms_local_draft');
    await useStore.getState().fetchData();
    window.location.reload(); // Hard reset for consistency
  },

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
