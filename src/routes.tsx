
import { Routes, Route, Navigate } from "react-router-dom";
import ProtectedRoute from "@/components/auth/ProtectedRoute";

import Index from "@/pages/Index";
import LoginPage from "@/pages/LoginPage";
import ProjectsPage from "@/pages/ProjectsPage";
import ProjectDetailPage from "@/pages/ProjectDetailPage";
import DocumentsPage from "@/pages/DocumentsPage";
import DataModelPage from "@/pages/DataModelPage";
import CardyMindPage from "@/pages/CardyMindPage";
import ProfilePage from "@/pages/ProfilePage";
import SettingsPage from "@/pages/SettingsPage";
import ResetPasswordPage from "@/pages/ResetPasswordPage";
import DocumentProcessingPage from "@/pages/DocumentProcessingPage";
import StoriesPage from "@/pages/StoriesPage";
import N8nWorkflowsPage from "@/pages/N8nWorkflowsPage";
import NotFound from "@/pages/NotFound";

const AppRoutes = () => {
  return (
    <Routes>
      {/* Public Routes */}
      <Route path="/login" element={<LoginPage />} />
      <Route path="/reset-password" element={<ResetPasswordPage />} />
      
      {/* Protected Routes */}
      <Route 
        path="/" 
        element={
          <ProtectedRoute>
            <Index />
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/projects" 
        element={
          <ProtectedRoute>
            <ProjectsPage />
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/projects/:id" 
        element={
          <ProtectedRoute>
            <ProjectDetailPage />
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/documents" 
        element={
          <ProtectedRoute>
            <DocumentsPage />
          </ProtectedRoute>
        } 
      />
      <Route
        path="/document-processing"
        element={
          <ProtectedRoute>
            <DocumentProcessingPage />
          </ProtectedRoute>
        }
      />
      <Route 
        path="/data-models" 
        element={
          <ProtectedRoute>
            <DataModelPage />
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/cardy-mind" 
        element={
          <ProtectedRoute>
            <CardyMindPage />
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/stories" 
        element={
          <ProtectedRoute>
            <StoriesPage />
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/n8n-workflows" 
        element={
          <ProtectedRoute>
            <N8nWorkflowsPage />
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/profile" 
        element={
          <ProtectedRoute>
            <ProfilePage />
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/settings" 
        element={
          <ProtectedRoute>
            <SettingsPage />
          </ProtectedRoute>
        } 
      />
      
      {/* Fallback Routes */}
      <Route path="/404" element={<NotFound />} />
      <Route path="*" element={<Navigate to="/404" replace />} />
    </Routes>
  );
};

export default AppRoutes;
