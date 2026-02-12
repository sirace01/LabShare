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

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 font-sans selection:bg-indigo-500 selection:text-white">
      {mode === AppMode.SELECTION && (
        <RoleSelection
          onSelectTeacher={() => setMode(AppMode.TEACHER)}
          onSelectStudent={() => setMode(AppMode.STUDENT)}
        />
      )}
      {mode === AppMode.TEACHER && (
        <TeacherDashboard onBack={() => setMode(AppMode.SELECTION)} />
      )}
      {mode === AppMode.STUDENT && (
        <StudentClassroom onBack={() => setMode(AppMode.SELECTION)} />
      )}
    </div>
  );
};

export default App;