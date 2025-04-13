
import { createBrowserRouter } from 'react-router-dom';
import StoriesPage from './pages/StoriesPage';
import Index from './pages/Index';
import SettingsPage from './pages/SettingsPage';
import NotFound from './pages/NotFound';
import ProjectsPage from './pages/ProjectsPage';
import ProjectDetailPage from './pages/ProjectDetailPage';
import CardyMindPage from './pages/CardyMindPage';
import DataModelPage from './pages/DataModelPage';
import DocumentsPage from './pages/DocumentsPage';
import GSuiteSettingsPage from './pages/GSuiteSettingsPage';

export const routes = createBrowserRouter([
  {
    path: '/',
    element: <Index />,
  },
  {
    path: '/stories',
    element: <StoriesPage />,
  },
  {
    path: '/settings',
    element: <SettingsPage />,
  },
  {
    path: '/projects',
    element: <ProjectsPage />,
  },
  {
    path: '/projects/:id',
    element: <ProjectDetailPage />,
  },
  {
    path: '/cardy-mind',
    element: <CardyMindPage />,
  },
  {
    path: '/data-model',
    element: <DataModelPage />,
  },
  {
    path: '/data-models',
    element: <DataModelPage />,
  },
  {
    path: '/er-diagram',
    element: <DataModelPage />,
  },
  {
    path: '/smart-er',
    element: <DataModelPage />,
  },
  {
    path: '/documents',
    element: <DocumentsPage />,
  },
  {
    path: '/gsuite-settings',
    element: <GSuiteSettingsPage />,
  },
  {
    path: '*',
    element: <NotFound />,
  },
]);
