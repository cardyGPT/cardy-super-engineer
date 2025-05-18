
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
import GeneratePage from "@/pages/GeneratePage";
import N8nWorkflowsPage from "@/pages/N8nWorkflowsPage";
import HelpPage from "@/pages/HelpPage";
import NotFound from "@/pages/NotFound";

const AppRoutes = () => {
  return (
    <Routes>
      {/* Public Routes */}
      <Route path="/login" element={<LoginPage />} />
      <Route path="/reset-password" element={<ResetPasswordPage />} />
      
      {/* Root path redirects to login if not authenticated */}
      <Route path="/" element={<Navigate to="/login" replace />} />
      
      {/* Protected Routes */}
      <Route 
        path="/help" 
        element={
          <ProtectedRoute>
            <HelpPage />
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
        path="/generate" 
        element={
          <ProtectedRoute>
            <GeneratePage />
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
