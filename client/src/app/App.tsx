import React from 'react';
import { RouterProvider } from 'react-router-dom';
import { AuthProvider } from '../context/AuthContext';
import { AttendanceProvider } from '../context/AttendanceContext';
import { ThemeProvider } from '../context/ThemeContext';
import { router } from './router';

export const App: React.FC = () => {
  return (
    <ThemeProvider defaultTheme="system" storageKey="peoplepay360-ui-theme">
      <AuthProvider>
        <AttendanceProvider>
          <RouterProvider router={router} />
        </AttendanceProvider>
      </AuthProvider>
    </ThemeProvider>
  );
};

export default App;
