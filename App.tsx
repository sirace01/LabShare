import React, { useState } from 'react';
import { RoleSelection } from './components/RoleSelection';
import { TeacherDashboard } from './components/TeacherDashboard';
import { StudentClassroom } from './components/StudentClassroom';

enum AppMode {
  SELECTION = 'SELECTION',
  TEACHER = 'TEACHER',
  STUDENT = 'STUDENT',
}

const App: React.FC = () => {
  const [mode, setMode] = useState<AppMode>(AppMode.SELECTION);
  // Default to env var or relative path. 
  // Safely access env to prevent crash if not defined (e.g. non-Vite environment)
  const [serverUrl, setServerUrl] = useState<string>(
    (import.meta as any).env?.VITE_SERVER_URL || window.location.origin
  );

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 font-sans selection:bg-indigo-500 selection:text-white">
      {mode === AppMode.SELECTION && (
        <RoleSelection
          onSelectTeacher={() => setMode(AppMode.TEACHER)}
          onSelectStudent={() => setMode(AppMode.STUDENT)}
          serverUrl={serverUrl}
          setServerUrl={setServerUrl}
        />
      )}
      {mode === AppMode.TEACHER && (
        <TeacherDashboard 
          onBack={() => setMode(AppMode.SELECTION)} 
          serverUrl={serverUrl}
        />
      )}
      {mode === AppMode.STUDENT && (
        <StudentClassroom 
          onBack={() => setMode(AppMode.SELECTION)} 
          serverUrl={serverUrl}
        />
      )}
    </div>
  );
};

export default App;