
"use client"

import { useState, useEffect } from 'react';
import { SidebarProvider, Sidebar, SidebarTrigger, SidebarInset, SidebarHeader, SidebarContent, SidebarMenu, SidebarMenuItem, SidebarMenuButton, SidebarFooter } from '@/components/ui/sidebar';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { AuthGuard, useAuth } from '@/hooks/use-auth';
import { Button } from '@/components/ui/button';
import { LogOut, Users, LayoutDashboard, User, PlusCircle, Settings, Printer, FileText, Eye, EyeOff, UserCog } from 'lucide-react';
import { signOut } from 'firebase/auth';
import { auth, db } from '@/lib/firebase';
import { collection, addDoc, onSnapshot, doc, updateDoc, query, where, getDocs } from "firebase/firestore";
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

interface Insurer {
  id: string;
  name: string;
  username: string;
  email: string;
  phone: string;
  active: boolean;
  uid?: string;
}

interface Valuer {
  id: string;
  name: string;
  username: string;
  email: string;
  phone: string;
  active: boolean;
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
  const [insurers, setInsurers] = useState<Insurer[]>([]);
  const [valuers, setValuers] = useState<Valuer[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAddInsurerOpen, setAddInsurerOpen] = useState(false);
  const [isAddValuerOpen, setAddValuerOpen] = useState(false);
  const [isControlActive, setControlActive] = useState(true);
  const [showPassword, setShowPassword] = useState(false);

  const getInitials = (email?: string | null) => {
    return email ? email.charAt(0).toUpperCase() : '?';
  };

  useEffect(() => {
    setLoading(true);
    const subscriptions: (() => void)[] = [];

    const subscribeToCollection = (
        collectionName: string, 
        setter: React.Dispatch<React.SetStateAction<any[]>>, 
        activeViews: string[]
    ) => {
        if (activeViews.includes(activeView)) {
            const unsubscribe = onSnapshot(collection(db, collectionName), (snapshot) => {
                const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
                setter(data);
                setLoading(false);
            });
            subscriptions.push(unsubscribe);
        }
    };
    
    subscribeToCollection("insurers", setInsurers, ["insurers"]);
    subscribeToCollection("valuers", setValuers, ["valuers"]);
    subscribeToCollection("bookings", setBookings, ["bookings"]);

    if (!['insurers', 'valuers', 'bookings'].includes(activeView)) {
        setLoading(false);
    }
    
    return () => subscriptions.forEach(unsub => unsub());
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
  
  const handleAddUser = async (event: React.FormEvent<HTMLFormElement>, userType: 'insurer' | 'valuer') => {
    event.preventDefault();
    const form = event.currentTarget;
    const name = (form.elements.namedItem('name') as HTMLInputElement).value;
    const username = (form.elements.namedItem('username') as HTMLInputElement).value;
    const email = (form.elements.namedItem('email') as HTMLInputElement).value;
    const phone = (form.elements.namedItem('phone') as HTMLInputElement).value;
    const password = (form.elements.namedItem('password') as HTMLInputElement).value;

    const collectionName = userType === 'insurer' ? 'insurers' : 'valuers';
    
    try {
      // Check for existing user
      if (userType === 'valuer') {
        const usernameQuery = query(collection(db, 'valuers'), where("username", "==", username));
        const emailQuery = query(collection(db, 'valuers'), where("email", "==", email));
        
        const [usernameSnapshot, emailSnapshot] = await Promise.all([
            getDocs(usernameQuery),
            getDocs(emailQuery)
        ]);

        if (!usernameSnapshot.empty) {
            toast({ variant: "destructive", title: "Registration Failed", description: "A valuer with this username already exists." });
            return;
        }
        if (!emailSnapshot.empty) {
            toast({ variant: "destructive", title: "Registration Failed", description: "A valuer with this email already exists." });
            return;
        }
      }

      await addDoc(collection(db, collectionName), {
        name,
        username,
        email,
        phone,
        password,
        active: isControlActive,
      });

      if (userType === 'insurer') setAddInsurerOpen(false);
      else setAddValuerOpen(false);

      form.reset();
      setControlActive(true);
      setShowPassword(false);
      const userTypeDisplay = userType === 'insurer' ? 'Guarantor' : 'Valuer';
      toast({ title: `${userTypeDisplay} Added`, description: `${name} has been successfully added.`});
    } catch (error: any) {
       const userTypeDisplay = userType === 'insurer' ? 'Guarantor' : 'Valuer';
       console.error(`Error adding ${userType}: `, error);
       toast({
         variant: "destructive",
         title: `Failed to Add ${userTypeDisplay}`,
         description: `An error occurred while adding the ${userType}.`,
       });
    }
  };

  const toggleStatus = async (id: string, currentStatus: boolean, collectionName: string, name: string) => {
    const docRef = doc(db, collectionName, id);
    try {
      await updateDoc(docRef, { active: !currentStatus });
      toast({ title: "Status Updated", description: `Status for ${name} has been updated.`});
    } catch (error) {
      console.error("Error updating status: ", error);
      toast({ variant: "destructive", title: "Update Failed", description: "Could not update status."});
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

  const renderUserTable = (
    data: (Insurer | Valuer)[],
    title: string,
    description: string,
    onAdd: () => void,
    collectionName: string
  ) => (
    <Card className="shadow-lg border-primary/20">
      <CardHeader className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <CardTitle className="font-headline text-3xl text-primary">{title}</CardTitle>
          <CardDescription>{description}</CardDescription>
        </div>
        <Button onClick={onAdd}>
          <PlusCircle className="mr-2" />
          Register New {collectionName === 'insurers' ? 'Guarantor' : 'Valuer'}
        </Button>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/50">
              <TableHead className="font-semibold">Name</TableHead>
              <TableHead className="hidden sm:table-cell font-semibold">Username</TableHead>
              <TableHead className="hidden sm:table-cell font-semibold">Email</TableHead>
              <TableHead className="hidden md:table-cell font-semibold">Phone</TableHead>
              <TableHead className="text-right font-semibold">Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.map(item => (
              <TableRow key={item.id}>
                <TableCell className="font-medium flex items-center gap-3">
                  <div className="p-2 bg-muted rounded-full hidden sm:flex">
                    <User className="h-5 w-5 text-primary" />
                  </div>
                  {item.name}
                </TableCell>
                <TableCell className="hidden sm:table-cell">{item.username}</TableCell>
                <TableCell className="hidden sm:table-cell">{item.email}</TableCell>
                <TableCell className="hidden md:table-cell">{item.phone}</TableCell>
                <TableCell className="text-right">
                   <div className="flex items-center justify-end gap-2">
                      <span className={`text-sm font-medium ${item.active ? 'text-green-500' : 'text-red-500'}`}>
                        {item.active ? 'Active' : 'Inactive'}
                      </span>
                      <Switch
                        checked={item.active}
                        onCheckedChange={() => toggleStatus(item.id, item.active, collectionName, item.name)}
                        aria-label={`Toggle status for ${item.name}`}
                      />
                    </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );

  const renderUserDialog = (
    isOpen: boolean,
    onOpenChange: (open: boolean) => void,
    userType: 'insurer' | 'valuer'
  ) => {
    const userTypeDisplay = userType === 'insurer' ? 'Guarantor' : 'Valuer';
    return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Register New {userTypeDisplay}</DialogTitle>
          <DialogDescription>
            Fill in the details below to create a new {userType} account.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={(e) => handleAddUser(e, userType)} className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="name" className="text-right">Name</Label>
            <Input id="name" name="name" className="col-span-3" required />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="username" className="text-right">Username</Label>
            <Input id="username" name="username" className="col-span-3" required />
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
             <div className="col-span-3 relative">
              <Input id="password" name="password" type={showPassword ? "text" : "password"} className="pr-10" required />
              <Button type="button" variant="ghost" size="icon" className="absolute top-1/2 right-2 -translate-y-1/2 h-7 w-7 text-muted-foreground" onClick={() => setShowPassword(!showPassword)}>
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </Button>
            </div>
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="active" className="text-right">Active</Label>
             <div className="col-span-3 flex items-center">
              <Switch id="active" name="active" checked={isControlActive} onCheckedChange={setControlActive} />
              <span className="ml-3 text-sm text-muted-foreground">Is account active?</span>
            </div>
          </div>
          <DialogFooter>
            <Button type="submit">Create {userTypeDisplay}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

  return (
    <SidebarProvider>
      <Sidebar variant="inset" side="left">
        <SidebarHeader>
          <div className="flex items-center gap-2 p-2">
            <div className="bg-primary text-primary-foreground rounded-lg p-2 flex items-center justify-center">
              <Settings className="h-6 w-6" />
            </div>
            <h2 className="text-xl font-semibold text-primary">CASA DASH</h2>
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
              <SidebarMenuButton onClick={() => setActiveView('insurers')} isActive={activeView === 'insurers'} tooltip="Manage Guarantors">
                <Users />
                Manage Guarantors
              </SidebarMenuButton>
            </SidebarMenuItem>
            <SidebarMenuItem>
                <SidebarMenuButton onClick={() => setActiveView('valuers')} isActive={activeView === 'valuers'} tooltip="Manage Valuers">
                    <UserCog />
                    Manage Valuers
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
      </Sidebar>
      <SidebarInset>
        <header className="sticky top-0 z-40 w-full border-b bg-card shadow-sm">
            <div className="container flex h-16 items-center justify-between">
                <div className="flex items-center gap-4">
                    <SidebarTrigger />
                    <h1 className="text-2xl font-headline font-bold text-primary">CASA DASH</h1>
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
            {activeView === 'insurers' && renderUserTable(insurers, "Manage Guarantors", "View and manage all registered guarantors.", () => setAddInsurerOpen(true), "insurers")}
            {activeView === 'valuers' && renderUserTable(valuers, "Manage Valuers", "View and manage all registered valuers.", () => setAddValuerOpen(true), "valuers")}
            {renderUserDialog(isAddInsurerOpen, setAddInsurerOpen, 'insurer')}
            {renderUserDialog(isAddValuerOpen, setAddValuerOpen, 'valuer')}

             {activeView === 'bookings' && (
               <Card className="shadow-lg border-primary/20">
                <CardHeader>
                  <CardTitle className="font-headline text-3xl text-primary">All Bookings</CardTitle>
                  <CardDescription>View and manage all vehicle bookings reports.</CardDescription>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-muted/50">
                        <TableHead className="font-semibold">Booking ID</TableHead>
                        <TableHead className="hidden sm:table-cell font-semibold">Customer</TableHead>
                        <TableHead className="hidden md:table-cell font-semibold">Vehicle</TableHead>
                        <TableHead className="hidden sm:table-cell font-semibold">Date</TableHead>
                        <TableHead className="font-semibold">Status</TableHead>
                        <TableHead className="text-right font-semibold">Action</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {loading ? (
                        Array.from({ length: 5 }).map((_, index) => (
                          <TableRow key={index}>
                            <TableCell><Skeleton className="h-5 w-24" /></TableCell>
                            <TableCell className="hidden sm:table-cell"><Skeleton className="h-5 w-32" /></TableCell>
                            <TableCell className="hidden md:table-cell"><Skeleton className="h-5 w-40" /></TableCell>
                            <TableCell className="hidden sm:table-cell"><Skeleton className="h-5 w-24" /></TableCell>
                            <TableCell><Skeleton className="h-6 w-20" /></TableCell>
                            <TableCell className="text-right"><Skeleton className="h-8 w-28 ml-auto" /></TableCell>
                          </TableRow>
                        ))
                      ) : bookings.length > 0 ? (
                        bookings.map((booking) => (
                          <TableRow key={booking.id}>
                            <TableCell className="font-mono text-xs truncate">{booking.bookingNumber}</TableCell>
                            <TableCell className="font-medium hidden sm:table-cell">{booking.customerName}</TableCell>
                            <TableCell className="hidden md:table-cell">{`${booking.carMake} ${booking.carModel} (${booking.plateNumber})`}</TableCell>
                            <TableCell className="hidden sm:table-cell">{new Date(booking.createdAt?.toDate()).toLocaleDateString()}</TableCell>
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
                                  <span className="hidden sm:inline">View Report</span>
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
                    Casa Motor Valuers & Assessors
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
