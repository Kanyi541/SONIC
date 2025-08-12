"use client"

import { useState, useEffect } from 'react';
import { SidebarProvider, Sidebar, SidebarTrigger, SidebarInset, SidebarHeader, SidebarContent, SidebarMenu, SidebarMenuItem, SidebarMenuButton } from '@/components/ui/sidebar';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { AuthGuard, useAuth } from '@/hooks/use-auth';
import { Button } from '@/components/ui/button';
import { LogOut, Users, LayoutDashboard, User, PlusCircle } from 'lucide-react';
import { signOut } from 'firebase/auth';
import { auth, db } from '@/lib/firebase';
import { collection, addDoc, getDocs, doc, updateDoc, query, onSnapshot } from "firebase/firestore"; 
import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";

interface Client {
  id: string;
  name: string;
  email: string;
  phone: string;
  active: boolean;
}

function AdminDashboard() {
  const { user } = useAuth();
  const { toast } = useToast();
  const router = useRouter();
  const [activeView, setActiveView] = useState('dashboard');
  const [clients, setClients] = useState<Client[]>([]);
  const [isAddClientOpen, setAddClientOpen] = useState(false);

  useEffect(() => {
    if (activeView === 'clients') {
      const q = query(collection(db, "clients"));
      const unsubscribe = onSnapshot(q, (querySnapshot) => {
        const clientsData: Client[] = [];
        querySnapshot.forEach((doc) => {
          clientsData.push({ id: doc.id, ...doc.data() } as Client);
        });
        setClients(clientsData);
      });
      return () => unsubscribe();
    }
  }, [activeView]);

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
  
  const handleAddClient = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = event.currentTarget;
    const name = (form.elements.namedItem('name') as HTMLInputElement).value;
    const email = (form.elements.namedItem('email') as HTMLInputElement).value;
    const phone = (form.elements.namedItem('phone') as HTMLInputElement).value;
    const active = (form.elements.namedItem('active') as HTMLInputElement).checked;

    try {
      // The `createUserWithEmailAndPassword` was removed to prevent conflicts
      // with existing users. User account creation should be a separate process.
      // This function now only adds the client details to the Firestore database.

      await addDoc(collection(db, "clients"), {
        name,
        email,
        phone,
        active: active,
      });

      setAddClientOpen(false);
      form.reset();
      toast({ title: "Client Added", description: `${name} has been successfully added.`});
    } catch (error: any) {
       console.error("Error adding client: ", error);
       toast({
         variant: "destructive",
         title: "Failed to Add Client",
         description: error.message || "An error occurred while adding the client.",
       });
    }
  };

  const toggleClientStatus = async (clientId: string) => {
    const clientRef = doc(db, "clients", clientId);
    const client = clients.find(c => c.id === clientId);
    if (client) {
      try {
        await updateDoc(clientRef, { active: !client.active });
        toast({ title: "Status Updated", description: `Status for ${client.name} has been updated.`});
      } catch (error) {
        console.error("Error updating status: ", error);
        toast({ variant: "destructive", title: "Update Failed", description: "Could not update client status."});
      }
    }
  };


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
                <CardHeader className="flex flex-row items-center justify-between">
                  <div>
                    <CardTitle className="font-headline text-3xl">Manage Clients</CardTitle>
                    <CardDescription>View and manage all registered clients.</CardDescription>
                  </div>
                  <Dialog open={isAddClientOpen} onOpenChange={setAddClientOpen}>
                    <DialogTrigger asChild>
                      <Button>
                        <PlusCircle className="mr-2" />
                        Add Client
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-[425px]">
                      <DialogHeader>
                        <DialogTitle>Add New Client</DialogTitle>
                        <DialogDescription>
                          Fill in the details below to create a new client account.
                        </DialogDescription>
                      </DialogHeader>
                      <form onSubmit={handleAddClient} className="grid gap-4 py-4">
                        <div className="grid grid-cols-4 items-center gap-4">
                          <Label htmlFor="name" className="text-right">Name</Label>
                          <Input id="name" name="name" className="col-span-3" required />
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                          <Label htmlFor="email" className="text-right">Email</Label>
                          <Input id="email" name="email" type="email" className="col-span-3" required />
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                          <Label htmlFor="phone" className="text-right">Phone</Label>
                          <Input id="phone" name="phone" className="col-span-3" />
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                          <Label htmlFor="active" className="text-right">Active</Label>
                           <div className="col-span-3 flex items-center">
                            <Switch id="active" name="active" defaultChecked={true} />
                            <span className="ml-3 text-sm text-muted-foreground">Is account active?</span>
                          </div>
                        </div>
                        <DialogFooter>
                          <Button type="submit">Create Client</Button>
                        </DialogFooter>
                      </form>
                    </DialogContent>
                  </Dialog>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Name</TableHead>
                        <TableHead>Email</TableHead>
                        <TableHead>Phone</TableHead>
                        <TableHead className="text-right">Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {clients.map(client => (
                        <TableRow key={client.id}>
                          <TableCell className="font-medium flex items-center gap-3">
                            <div className="p-2 bg-muted rounded-full">
                              <User className="h-5 w-5 text-primary" />
                            </div>
                            {client.name}
                          </TableCell>
                          <TableCell>{client.email}</TableCell>
                          <TableCell>{client.phone}</TableCell>
                          <TableCell className="text-right">
                             <div className="flex items-center justify-end gap-2">
                                <span className={`text-sm ${client.active ? 'text-green-600' : 'text-red-600'}`}>
                                  {client.active ? 'Active' : 'Inactive'}
                                </span>
                                <Switch
                                  checked={client.active}
                                  onCheckedChange={() => toggleClientStatus(client.id)}
                                  aria-label={`Toggle status for ${client.name}`}
                                />
                              </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
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
