
import React from "react";
import AppLayout from "@/components/layout/AppLayout";
import JiraLogin from "@/components/stories/JiraLogin";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { Mail, Settings } from "lucide-react";

const SettingsPage = () => {
  return (
    <AppLayout>
      <div className="container mx-auto py-6">
        <h1 className="text-3xl font-bold mb-6">Settings</h1>
        
        <div className="space-y-6">
          {/* Jira Connection */}
          <div className="p-6 bg-white rounded-lg shadow-sm">
            <h2 className="text-xl font-semibold mb-4">Jira Connection</h2>
            <JiraLogin />
          </div>
          
          {/* GSuite Integration */}
          <div className="p-6 bg-white rounded-lg shadow-sm">
            <h2 className="text-xl font-semibold mb-4">GSuite Integration</h2>
            <p className="text-gray-500 mb-4">
              Connect your Google Workspace account to export content directly to Google Docs, Sheets, and more.
            </p>
            <Button asChild>
              <Link to="/gsuite-settings">
                <Mail className="h-4 w-4 mr-2" />
                GSuite Settings
              </Link>
            </Button>
          </div>
        </div>
      </div>
    </AppLayout>
  );
};

export default SettingsPage;
