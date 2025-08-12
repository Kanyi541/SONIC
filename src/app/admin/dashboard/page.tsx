"use client"

import { useState } from 'react';
import { SidebarProvider, Sidebar, SidebarTrigger, SidebarInset, SidebarHeader, SidebarContent, SidebarMenu, SidebarMenuItem, SidebarMenuButton } from '@/components/ui/sidebar';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { AuthGuard, useAuth } from '@/hooks/use-auth';
import { Button } from '@/components/ui/button';
import { LogOut, Users, LayoutDashboard, User } from 'lucide-react';
import { signOut } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';

function AdminDashboard() {
  const { user } = useAuth();
  const { toast } = useToast();
  const router = useRouter();
  const [activeView, setActiveView] = useState('dashboard');

  const handleLogout = async () => {
    try {
      await signOut(auth);
      toast({ title: "Logged Out", description: "You have been successfully signed out." });
      router.push('/');
    } catch (error) {
      console.error("Error signing out: ", error);
      toast({ variant: "destructive", title: "Logout Failed", description: "An error occurred while signing out." });
    }
  };

  const clients = [
    { id: 1, name: 'Client A', email: 'client.a@example.com' },
    { id: 2, name: 'Client B', email: 'client.b@example.com' },
    { id: 3, name: 'Client C', email: 'client.c@example.com' },
    { id: 4, name: 'Client D', email: 'client.d@example.com' },
  ];

  return (
    <SidebarProvider>
      <Sidebar>
        <SidebarHeader>
          <div className="flex items-center gap-2">
            <div className="bg-primary text-primary-foreground rounded-lg p-2">
              <Users className="h-6 w-6" />
            </div>
            <h2 className="text-lg font-semibold text-primary">Admin Panel</h2>
          </div>
        </SidebarHeader>
        <SidebarContent>
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton onClick={() => setActiveView('dashboard')} isActive={activeView === 'dashboard'}>
                <LayoutDashboard />
                Dashboard
              </SidebarMenuButton>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <SidebarMenuButton onClick={() => setActiveView('clients')} isActive={activeView === 'clients'}>
                <Users />
                Manage Clients
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarContent>
        <div className="mt-auto p-2">
          <Button variant="outline" onClick={handleLogout} className="w-full justify-start">
              <LogOut className="mr-2 h-4 w-4" />
              Logout
          </Button>
        </div>
      </Sidebar>
      <SidebarInset>
        <header className="sticky top-0 z-40 w-full border-b bg-card">
            <div className="container flex h-16 items-center justify-between">
                <div className="flex items-center gap-4">
                    <SidebarTrigger />
                    <h1 className="text-2xl font-headline font-bold text-primary">Admin Dashboard</h1>
                </div>
                 <p className="text-sm text-muted-foreground hidden md:block">
                  Logged in as: <span className="font-semibold text-primary">{user?.email}</span>
                </p>
            </div>
        </header>
        <main className="flex-1 container py-8">
            {activeView === 'dashboard' && (
              <Card className="shadow-lg">
                  <CardHeader>
                      <CardTitle className="font-headline text-3xl">Welcome, Admin!</CardTitle>
                      <CardDescription>This is your secure control panel.</CardDescription>
                  </CardHeader>
                  <CardContent>
                      <div className="p-4 bg-muted rounded-lg">
                          <h3 className="font-headline text-lg font-semibold mb-2">Admin Panel</h3>
                          <p className="text-muted-foreground">Here you can manage users, view analytics, and configure system settings. Use the navigation to explore different sections.</p>
                      </div>
                  </CardContent>
              </Card>
            )}
            {activeView === 'clients' && (
              <Card className="shadow-lg">
                <CardHeader>
                  <CardTitle className="font-headline text-3xl">Manage Clients</CardTitle>
                  <CardDescription>View and manage all registered clients.</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-col gap-4">
                    {clients.map(client => (
                      <Card key={client.id} className="flex items-center p-4">
                        <div className="flex-shrink-0 mr-4">
                           <div className="p-2 bg-muted rounded-full">
                            <User className="h-6 w-6 text-primary" />
                           </div>
                        </div>
                        <div className="flex-grow">
                          <p className="font-semibold text-lg">{client.name}</p>
                          <p className="text-sm text-muted-foreground">{client.email}</p>
                        </div>
                        <Button variant="outline" size="sm">Manage</Button>
                      </Card>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
        </main>
        <footer className="py-6 md:px-8 md:py-0 border-t bg-card">
            <div className="container flex flex-col items-center justify-between gap-4 md:h-24 md:flex-row">
                <p className="text-sm text-center text-muted-foreground">
                    © {new Date().getFullYear()} Dashboard Central. All rights reserved.
                </p>
            </div>
        </footer>
      </SidebarInset>
    </SidebarProvider>
  );
}

export default function AdminDashboardPage() {
  return (
    <AuthGuard>
      <AdminDashboard />
    </AuthGuard>
  )
}
