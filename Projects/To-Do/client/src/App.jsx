import { Routes, Route } from 'react-router-dom';
import Layout from './components/layout/Layout.jsx';
import Dashboard from './pages/Dashboard.jsx';
import TasksPage from './pages/TasksPage.jsx';
import CompanyPage from './pages/CompanyPage.jsx';
import PeoplePage from './pages/PeoplePage.jsx';
import BacklogPage from './pages/BacklogPage.jsx';

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Dashboard />} />
      <Route element={<Layout />}>
        <Route path="tasks"   element={<TasksPage />} />
        <Route path="backlog" element={<BacklogPage />} />
        <Route path="people"  element={<PeoplePage />} />
        <Route path="company/:id" element={<CompanyPage />} />
      </Route>
    </Routes>
  );
}
