
"use client"

import { useState, useEffect } from 'react';
import { SidebarProvider, Sidebar, SidebarTrigger, SidebarInset, SidebarHeader, SidebarContent, SidebarMenu, SidebarMenuItem, SidebarMenuButton, SidebarFooter } from '@/components/ui/sidebar';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { AuthGuard, useAuth } from '@/hooks/use-auth';
import { Button } from '@/components/ui/button';
import { LogOut, Users, LayoutDashboard, User, PlusCircle, Settings, Printer, FileText } from 'lucide-react';
import { signOut } from 'firebase/auth';
import { auth, db } from '@/lib/firebase';
import { collection, addDoc, onSnapshot, doc, updateDoc } from "firebase/firestore";
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
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';

interface Client {
  id: string;
  name: string;
  email: string;
  phone: string;
  active: boolean;
  uid?: string;
}

interface Booking {
  id: string;
  bookingNumber: string;
  customerName: string;
  customerEmail: string;
  plateNumber: string;
  carMake: string;
  carModel: string;
  createdAt: any;
  status: string;
}

function AdminDashboard() {
  const { user } = useAuth();
  const { toast } = useToast();
  const router = useRouter();
  const [activeView, setActiveView] = useState('dashboard');
  const [clients, setClients] = useState<Client[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAddClientOpen, setAddClientOpen] = useState(false);
  const [isClientActive, setClientActive] = useState(true);

  const getInitials = (email?: string | null) => {
    return email ? email.charAt(0).toUpperCase() : '?';
  };

  useEffect(() => {
    if (activeView === 'clients') {
      const unsubscribe = onSnapshot(collection(db, "clients"), (querySnapshot) => {
        const clientsData: Client[] = [];
        querySnapshot.forEach((doc) => {
          clientsData.push({ id: doc.id, ...doc.data() } as Client);
        });
        setClients(clientsData);
      });
      return () => unsubscribe();
    }
    
    if(activeView === 'bookings') {
      setLoading(true);
      const unsubscribe = onSnapshot(collection(db, "bookings"), (snapshot) => {
          const bookingsData: Booking[] = [];
          snapshot.forEach((doc) => {
              bookingsData.push({ id: doc.id, ...doc.data() } as Booking);
          });
          setBookings(bookingsData);
          setLoading(false);
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
    const password = (form.elements.namedItem('password') as HTMLInputElement).value;
    
    try {
      await addDoc(collection(db, "clients"), {
        name,
        email,
        phone,
        password,
        active: isClientActive,
      });

      setAddClientOpen(false);
      form.reset();
      setClientActive(true);
      toast({ title: "Client Added", description: `${name} has been successfully added.`});
    } catch (error: any) {
       console.error("Error adding client: ", error);
       toast({
         variant: "destructive",
         title: "Failed to Add Client",
         description: "An error occurred while adding the client.",
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

  const getStatusVariant = (status: string): "default" | "secondary" | "destructive" | "outline" => {
    switch (status) {
      case "Pending":
        return "secondary";
      case "Pending Valuation":
        return "outline";
      case "Pending Approval":
        return "destructive";
      case "Completed":
        return "default";
      default:
        return "default";
    }
  };

  return (
    <SidebarProvider>
      <Sidebar variant="inset" side="left">
        <SidebarHeader>
          <div className="flex items-center gap-2 p-2">
            <div className="bg-primary text-primary-foreground rounded-lg p-2 flex items-center justify-center">
              <Settings className="h-6 w-6" />
            </div>
            <h2 className="text-xl font-semibold text-primary">Admin Panel</h2>
          </div>
        </SidebarHeader>
        <SidebarContent>
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton onClick={() => setActiveView('dashboard')} isActive={activeView === 'dashboard'} tooltip="Dashboard">
                <LayoutDashboard />
                Dashboard
              </SidebarMenuButton>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <SidebarMenuButton onClick={() => setActiveView('clients')} isActive={activeView === 'clients'} tooltip="Manage Clients">
                <Users />
                Manage Clients
              </SidebarMenuButton>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <SidebarMenuButton onClick={() => setActiveView('bookings')} isActive={activeView === 'bookings'} tooltip="All Bookings">
                <FileText />
                Bookings
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarContent>
        <SidebarFooter>
          <Button variant="ghost" onClick={handleLogout} className="w-full justify-start">
              <LogOut className="mr-2 h-4 w-4" />
              Logout
          </Button>
        </SidebarFooter>
      </Sidebar>
      <SidebarInset>
        <header className="sticky top-0 z-40 w-full border-b bg-card shadow-sm">
            <div className="container flex h-16 items-center justify-between">
                <div className="flex items-center gap-4">
                    <SidebarTrigger />
                    <h1 className="text-2xl font-headline font-bold text-primary">Admin Dashboard</h1>
                </div>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="relative h-10 w-10 rounded-full">
                      <Avatar className="h-10 w-10">
                        <AvatarFallback className="bg-secondary text-secondary-foreground">{getInitials(user?.email)}</AvatarFallback>
                      </Avatar>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="w-56" align="end" forceMount>
                    <DropdownMenuLabel className="font-normal">
                      <div className="flex flex-col space-y-1">
                        <p className="text-sm font-medium leading-none">Admin</p>
                        <p className="text-xs leading-none text-muted-foreground">
                          {user?.email}
                        </p>
                      </div>
                    </DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={handleLogout}>
                      <LogOut className="mr-2 h-4 w-4" />
                      <span>Log out</span>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
            </div>
        </header>
        <main className="flex-1 container py-8">
            {activeView === 'dashboard' && (
              <div className="grid gap-8">
                <Card className="shadow-lg border-primary/20">
                    <CardHeader>
                        <CardTitle className="font-headline text-3xl text-primary">Welcome, Admin!</CardTitle>
                        <CardDescription>This is your secure control panel.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="p-4 bg-muted rounded-lg">
                            <h3 className="font-headline text-lg font-semibold mb-2">Admin Panel</h3>
                            <p className="text-muted-foreground">Here you can manage users, view analytics, and configure system settings. Use the navigation to explore different sections.</p>
                        </div>
                    </CardContent>
                </Card>
              </div>
            )}
            {activeView === 'clients' && (
              <Card className="shadow-lg border-primary/20">
                <CardHeader className="flex flex-row items-center justify-between">
                  <div>
                    <CardTitle className="font-headline text-3xl text-primary">Manage Clients</CardTitle>
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
                          <Label htmlFor="password" className="text-right">Password</Label>
                          <Input id="password" name="password" type="password" className="col-span-3" required />
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                          <Label htmlFor="active" className="text-right">Active</Label>
                           <div className="col-span-3 flex items-center">
                            <Switch id="active" name="active" checked={isClientActive} onCheckedChange={setClientActive} />
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
                                <span className={`text-sm font-medium ${client.active ? 'text-green-500' : 'text-red-500'}`}>
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
             {activeView === 'bookings' && (
               <Card className="shadow-lg border-primary/20">
                <CardHeader>
                  <CardTitle className="font-headline text-3xl text-primary">All Bookings</CardTitle>
                  <CardDescription>View and manage all vehicle bookings reports.</CardDescription>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Booking ID</TableHead>
                        <TableHead>Customer</TableHead>
                        <TableHead>Vehicle</TableHead>
                        <TableHead>Date</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="text-right">Action</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {loading ? (
                        Array.from({ length: 5 }).map((_, index) => (
                          <TableRow key={index}>
                            <TableCell><Skeleton className="h-5 w-24" /></TableCell>
                            <TableCell><Skeleton className="h-5 w-32" /></TableCell>
                            <TableCell><Skeleton className="h-5 w-40" /></TableCell>
                            <TableCell><Skeleton className="h-5 w-24" /></TableCell>
                            <TableCell><Skeleton className="h-6 w-20" /></TableCell>
                            <TableCell className="text-right"><Skeleton className="h-8 w-28 ml-auto" /></TableCell>
                          </TableRow>
                        ))
                      ) : bookings.length > 0 ? (
                        bookings.map((booking) => (
                          <TableRow key={booking.id}>
                            <TableCell className="font-mono text-xs">{booking.bookingNumber}</TableCell>
                            <TableCell className="font-medium">{booking.customerName}</TableCell>
                            <TableCell>{`${booking.carMake} ${booking.carModel} (${booking.plateNumber})`}</TableCell>
                            <TableCell>{new Date(booking.createdAt?.toDate()).toLocaleDateString()}</TableCell>
                            <TableCell>
                               <Badge variant={getStatusVariant(booking.status)}>{booking.status}</Badge>
                            </TableCell>
                             <TableCell className="text-right">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => router.push(`/client/booking-report?id=${booking.id}`)}
                                >
                                  <Printer className="mr-2 h-4 w-4" />
                                  View Report
                                </Button>
                              </TableCell>
                          </TableRow>
                        ))
                      ) : (
                        <TableRow>
                          <TableCell colSpan={6} className="text-center h-24">
                            No bookings found.
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
             )}
        </main>
        <footer className="py-6 md:px-8 md:py-0 border-t bg-card/50">
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

    