/**
 * COREvia Phase 39: Enterprise Administration Module
 * Entry point for /admin control plane.
 */

import React from 'react';
import { AdminWorkspace } from '../admin/AdminWorkspace.tsx';

export const AdminModule: React.FC = () => {
  return (
    <div className="w-full">
      <AdminWorkspace />
    </div>
  );
};
