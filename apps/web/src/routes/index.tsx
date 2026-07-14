import { Routes, Route } from 'react-router-dom';

export default function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<div className="p-lg headline-lg">ApexGear — Coming Soon</div>} />
    </Routes>
  );
}
