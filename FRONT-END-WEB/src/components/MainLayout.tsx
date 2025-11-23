import React from 'react';
import { AccessibilityMenu } from './AccessibilityMenu.tsx';

interface MainLayoutProps {
  children: React.ReactNode;
}

export const MainLayout: React.FC<MainLayoutProps> = ({ children }) => {
  return (
    <div className="main-layout">
      {children}
      <AccessibilityMenu />
    </div>
  );
};
