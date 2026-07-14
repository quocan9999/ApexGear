import { Routes, Route } from 'react-router-dom';
import MainLayout from '../layouts/MainLayout';

export default function AppRoutes() {
  return (
    <Routes>
      <Route element={<MainLayout />}>
        <Route path="/" element={<div className="p-lg headline-lg">ApexGear — Coming Soon</div>} />
      </Route>
    </Routes>
  );
}
