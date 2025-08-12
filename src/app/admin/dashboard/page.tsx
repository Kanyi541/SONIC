"use client"

import DashboardLayout from '@/components/dashboard/dashboard-layout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { AuthGuard, useAuth } from '@/hooks/use-auth';

function AdminDashboard() {
  const { user } = useAuth();
  
  return (
    <DashboardLayout title="Admin Dashboard" isFirebase={true}>
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="font-headline text-3xl">Welcome, Admin!</CardTitle>
          <CardDescription>This is your secure control panel.</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="font-body">
            You are logged in as: <span className="font-semibold text-primary">{user?.email}</span>
          </p>
          <div className="mt-6 p-4 bg-muted rounded-lg">
            <h3 className="font-headline text-lg font-semibold mb-2">Admin Panel</h3>
            <p className="text-muted-foreground">Here you can manage users, view analytics, and configure system settings. Use the navigation to explore different sections.</p>
          </div>
        </CardContent>
      </Card>
    </DashboardLayout>
  );
}

export default function AdminDashboardPage() {
  return (
    <AuthGuard>
      <AdminDashboard />
    </AuthGuard>
  )
}
