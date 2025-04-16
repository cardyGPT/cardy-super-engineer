
import React, { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import AppLayout from '@/components/layout/AppLayout';

const ProfilePage: React.FC = () => {
  const { user, profile, preferences, updateProfile, updatePreferences, isLoading } = useAuth();
  const [fullName, setFullName] = useState(profile?.full_name || '');
  const [avatarUrl, setAvatarUrl] = useState(profile?.avatar_url || '');
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  if (!user) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center h-screen">
          <p>Please log in to view your profile.</p>
        </div>
      </AppLayout>
    );
  }

  const userInitials = profile?.full_name 
    ? profile.full_name.split(' ').map(n => n[0]).join('').toUpperCase() 
    : user.email?.slice(0, 2).toUpperCase() || 'U';

  const handleProfileUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    try {
      await updateProfile({
        full_name: fullName,
        avatar_url: avatarUrl
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleToggleNotifications = async (checked: boolean) => {
    if (preferences) {
      await updatePreferences({
        email_notifications: checked
      });
    }
  };

  if (isLoading) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center h-screen">
          <p>Loading profile...</p>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="container max-w-4xl py-10">
        <h1 className="text-3xl font-bold mb-8">Profile Settings</h1>
        
        <Tabs defaultValue="profile" className="space-y-6">
          <TabsList>
            <TabsTrigger value="profile">Profile</TabsTrigger>
            <TabsTrigger value="preferences">Preferences</TabsTrigger>
            <TabsTrigger value="account">Account</TabsTrigger>
          </TabsList>
          
          <TabsContent value="profile">
            <Card>
              <CardHeader>
                <CardTitle>Profile Information</CardTitle>
                <CardDescription>
                  Update your profile details and how others see you in the application.
                </CardDescription>
              </CardHeader>
              <form onSubmit={handleProfileUpdate}>
                <CardContent className="space-y-6">
                  <div className="flex flex-col items-center sm:flex-row sm:items-start gap-6">
                    <Avatar className="h-24 w-24">
                      {profile?.avatar_url ? (
                        <AvatarImage src={profile.avatar_url} alt={profile.full_name || 'User'} />
                      ) : null}
                      <AvatarFallback className="text-2xl bg-cardy-blue-light text-white">
                        {userInitials}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="fullName">Full Name</Label>
                        <Input
                          id="fullName"
                          placeholder="Enter your full name"
                          value={fullName}
                          onChange={(e) => setFullName(e.target.value)}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="email">Email</Label>
                        <Input
                          id="email"
                          value={user.email || ''}
                          disabled
                          readOnly
                        />
                        <p className="text-xs text-muted-foreground mt-1">
                          Your email address is used for login and cannot be changed here.
                        </p>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="avatar">Avatar URL</Label>
                        <Input
                          id="avatar"
                          placeholder="https://example.com/avatar.jpg"
                          value={avatarUrl || ''}
                          onChange={(e) => setAvatarUrl(e.target.value)}
                        />
                        <p className="text-xs text-muted-foreground mt-1">
                          Enter a URL to an image to use as your avatar.
                        </p>
                      </div>
                    </div>
                  </div>
                </CardContent>
                <CardFooter>
                  <Button type="submit" disabled={isSubmitting}>
                    {isSubmitting ? 'Saving...' : 'Save Changes'}
                  </Button>
                </CardFooter>
              </form>
            </Card>
          </TabsContent>
          
          <TabsContent value="preferences">
            <Card>
              <CardHeader>
                <CardTitle>Preferences</CardTitle>
                <CardDescription>
                  Manage your notification preferences and application theme.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="notifications">Email Notifications</Label>
                    <p className="text-sm text-muted-foreground">
                      Receive email notifications about updates and activity.
                    </p>
                  </div>
                  <Switch
                    id="notifications"
                    checked={preferences?.email_notifications || false}
                    onCheckedChange={handleToggleNotifications}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="theme">Application Theme</Label>
                    <p className="text-sm text-muted-foreground">
                      Your current theme is {preferences?.theme || 'dark'}.
                    </p>
                  </div>
                  <Button
                    variant="outline"
                    onClick={() => updatePreferences({
                      theme: preferences?.theme === 'dark' ? 'light' : 'dark'
                    })}
                  >
                    {preferences?.theme === 'dark' ? 'Switch to Light' : 'Switch to Dark'}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="account">
            <Card>
              <CardHeader>
                <CardTitle>Account Security</CardTitle>
                <CardDescription>
                  Manage your account security settings and connected services.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <Button variant="outline" onClick={() => window.location.href = '/?view=forgot-password'}>
                  Change Password
                </Button>
              </CardContent>
              <CardFooter className="border-t pt-6">
                <Button variant="destructive">Delete Account</Button>
              </CardFooter>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </AppLayout>
  );
};

export default ProfilePage;
