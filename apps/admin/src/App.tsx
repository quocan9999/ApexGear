import { useTranslation } from 'react-i18next';
import { Routes, Route } from 'react-router-dom';

// Placeholder routes for Commit 0. The real route tree (auth, layout, pages)
// lands in later commits; this keeps the app renderable and the smoke test green.
function AppRoutes() {
  const { t } = useTranslation();

  return (
    <Routes>
      <Route path="*" element={<div>{t('admin.title')}</div>} />
    </Routes>
  );
}

export default function App() {
  return <AppRoutes />;
}
