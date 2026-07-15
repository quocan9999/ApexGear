import { Routes, Route } from 'react-router-dom';

// Placeholder routes for Commit 0. The real route tree (auth, layout, pages)
// lands in later commits; this keeps the app renderable and the smoke test green.
function AppRoutes() {
  return (
    <Routes>
      <Route path="*" element={<div>ApexGear Admin</div>} />
    </Routes>
  );
}

export default function App() {
  return <AppRoutes />;
}
