import React from 'react';
import { RouterProvider } from 'react-router-dom';
import { AuthProvider } from '../context/AuthContext';
import { AttendanceProvider } from '../context/AttendanceContext';
import { router } from './router';

export const App: React.FC = () => {
  return (
    <AuthProvider>
      <AttendanceProvider>
        <RouterProvider router={router} />
      </AttendanceProvider>
    </AuthProvider>
  );
};

export default App;
