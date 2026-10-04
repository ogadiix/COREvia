import React from 'react';
import { ShowcaseWorkspace } from '../showcase/ShowcaseWorkspace';
import { ModuleType } from '../../types';

interface ShowcaseModuleProps {
  onNavigate: (module: ModuleType) => void;
}

export const ShowcaseModule: React.FC<ShowcaseModuleProps> = ({ onNavigate }) => {
  return <ShowcaseWorkspace onNavigate={onNavigate} />;
};
