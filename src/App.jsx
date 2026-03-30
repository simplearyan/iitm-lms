import React, { useEffect } from 'react';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import useStore from './store/useStore';
import Layout from './components/layout/Layout';

// View Imports
import LearnerDashboard from './components/learner/Dashboard';
import CourseViewer from './components/learner/CourseViewer';
import InstructorDashboard from './components/instructor/InstructorDashboard';
import SyllabusBuilder from './components/instructor/SyllabusBuilder';

function App() {
  const { fetchData, loading, role } = useStore();

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  if (loading) {
    return (
      <div className="h-screen w-full flex items-center justify-center bg-slate-50">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin"></div>
          <span className="text-slate-500 font-medium">Booting IITM Canvas...</span>
        </div>
      </div>
    );
  }

  return (
    <HashRouter>
      <Routes>
        <Route path="/" element={<Layout />}>
          {/* Index Route switches between Dashboard for Learner or Redirects Instructor to authoring */}
          <Route index element={role === 'learner' ? <LearnerDashboard /> : <Navigate to="/instructor" replace />} />
          
          {/* Learner Course Route */}
          <Route path="course/:courseId" element={<CourseViewer />} />
          
          {/* Instructor Routes */}
          <Route path="instructor">
             <Route index element={role === 'instructor' ? <InstructorDashboard /> : <Navigate to="/" replace />} />
             <Route path="course/:courseId" element={role === 'instructor' ? <SyllabusBuilder /> : <Navigate to="/" replace />} />
          </Route>
        </Route>
      </Routes>
    </HashRouter>
  );
}

export default App;
