
"use client"

import { useState, useEffect } from 'react';
import { SidebarProvider, Sidebar, SidebarTrigger, SidebarInset, SidebarHeader, SidebarContent, SidebarMenu, SidebarMenuItem, SidebarMenuButton, SidebarFooter } from '@/components/ui/sidebar';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { AuthGuard, useAuth } from '@/hooks/use-auth';
import { Button } from '@/components/ui/button';
import { LogOut, Users, LayoutDashboard, User, PlusCircle, Settings, Printer, FileText, Eye, EyeOff, UserCog, Search, Hourglass, CheckCircle, XCircle, Send, ThumbsUp, ThumbsDown } from 'lucide-react';
import { signOut } from 'firebase/auth';
import { auth, db } from '@/lib/firebase';
import { collection, addDoc, onSnapshot, doc, updateDoc, query, where, getDocs, serverTimestamp } from "firebase/firestore";
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
  DialogClose
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input';
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
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from '@/components/ui/carousel';
import Image from 'next/image';
import { Textarea } from '@/components/ui/textarea';

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

interface Valuation {
    id: string;
    bookingId: string;
    assessmentDate: any;
    assessmentValue: string;
    forcedValue: string;
    salvageValue: string;
    comments?: string;
    imageUrls: string[];
    valuedBy: string;
    valuedAt: any;
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
  const [bookingSearchTerm, setBookingSearchTerm] = useState('');
  const [selectedValuation, setSelectedValuation] = useState<Valuation | null>(null);
  const [isValuationDialogOpen, setValuationDialogOpen] = useState(false);
  const [loadingValuation, setLoadingValuation] = useState(false);
  const [rejectionReason, setRejectionReason] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const getInitials = (email?: string | null) => {
    return email ? email.charAt(0).toUpperCase() : '?';
  };

  useEffect(() => {
    setLoading(true);
    const subscriptions: (() => void)[] = [];

    const subscribeToCollection = (
        collectionName: string, 
        setter: React.Dispatch<React.SetStateAction<any[]>>, 
        requiredViews: string[]
    ) => {
        if (requiredViews.includes(activeView)) {
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
    const bookingsQuery = query(collection(db, "bookings"), where("status", "!=", "Archived"));
    if (["bookings", "pending-approval"].includes(activeView)) {
        const unsubscribe = onSnapshot(bookingsQuery, (snapshot) => {
            const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            setBookings(data as Booking[]);
            setLoading(false);
        });
        subscriptions.push(unsubscribe);
    }

    if (!['insurers', 'valuers', 'bookings', 'pending-approval'].includes(activeView)) {
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

  const handleViewReport = async (bookingId: string) => {
    setLoadingValuation(true);
    setValuationDialogOpen(true);
    try {
      const q = query(collection(db, "valuations"), where("bookingId", "==", bookingId));
      const querySnapshot = await getDocs(q);
      if (!querySnapshot.empty) {
        const valuationDoc = querySnapshot.docs[0];
        setSelectedValuation({ id: valuationDoc.id, ...valuationDoc.data() } as Valuation);
      } else {
        toast({ variant: "destructive", title: "Not Found", description: "No valuation report found for this booking." });
        setValuationDialogOpen(false);
      }
    } catch (error) {
      console.error("Error fetching valuation report: ", error);
      toast({ variant: "destructive", title: "Error", description: "Could not fetch the valuation report." });
      setValuationDialogOpen(false);
    } finally {
      setLoadingValuation(false);
    }
  };
  
  const handleApproval = async () => {
    if (!selectedValuation) return;
    setIsSubmitting(true);
    try {
      const bookingDocRef = doc(db, "bookings", selectedValuation.bookingId);
      await updateDoc(bookingDocRef, { status: "Completed" });
      
      const valuationDocRef = doc(db, "valuations", selectedValuation.id);
      await updateDoc(valuationDocRef, { status: "Approved", approvedAt: serverTimestamp(), approvedBy: user?.email });

      toast({ title: "Report Approved", description: "The valuation report has been approved." });
      setValuationDialogOpen(false);
      setSelectedValuation(null);
    } catch (error) {
      console.error("Error approving report: ", error);
      toast({ variant: "destructive", title: "Approval Failed", description: "An error occurred during approval." });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRejection = async () => {
      if (!selectedValuation || !rejectionReason) {
        toast({ variant: "destructive", title: "Rejection Failed", description: "Rejection reason is required." });
        return;
      }
      setIsSubmitting(true);
      try {
          const bookingDocRef = doc(db, "bookings", selectedValuation.bookingId);
          await updateDoc(bookingDocRef, { 
            status: "Pending", 
            rejectionReason: rejectionReason,
            rejectedAt: serverTimestamp() 
          });
          
          const valuationDocRef = doc(db, "valuations", selectedValuation.id);
          await updateDoc(valuationDocRef, { 
            status: "Rejected",
            rejectionReason: rejectionReason,
            rejectedAt: serverTimestamp(),
            rejectedBy: user?.email
          });

          toast({ title: "Report Rejected", description: "The valuation report has been rejected and sent back to the valuer." });
          setValuationDialogOpen(false);
          setSelectedValuation(null);
          setRejectionReason("");
      } catch (error) {
          console.error("Error rejecting report: ", error);
          toast({ variant: "destructive", title: "Rejection Failed", description: "An error occurred during rejection." });
      } finally {
          setIsSubmitting(false);
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
              <TableHead className="font-semibold text-left">Name</TableHead>
              <TableHead className="hidden sm:table-cell font-semibold text-left">Username</TableHead>
              <TableHead className="hidden sm:table-cell font-semibold text-left">Email</TableHead>
              <TableHead className="hidden md:table-cell font-semibold text-left">Phone</TableHead>
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

 const filteredBookings = bookings.filter(booking => {
    const searchTermLower = bookingSearchTerm.toLowerCase();
    return (
      booking.bookingNumber.toLowerCase().includes(searchTermLower) ||
      booking.customerName.toLowerCase().includes(searchTermLower) ||
      `${booking.carMake} ${booking.carModel}`.toLowerCase().includes(searchTermLower) ||
      booking.plateNumber.toLowerCase().includes(searchTermLower)
    );
  });

  const pendingApprovalBookings = filteredBookings.filter(b => b.status === "Pending Approval");
  
  const renderBookingsTable = (
    bookingsData: Booking[],
    title: string,
    description: string
  ) => (
     <Card className="shadow-lg border-primary/20">
      <CardHeader>
        <div className="flex justify-between items-center">
            <div>
              <CardTitle className="font-headline text-3xl text-primary">{title}</CardTitle>
              <CardDescription>{description}</CardDescription>
            </div>
            <div className="relative w-full max-w-sm">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                    type="search"
                    placeholder="Search bookings..."
                    className="w-full rounded-lg bg-background pl-8"
                    value={bookingSearchTerm}
                    onChange={(e) => setBookingSearchTerm(e.target.value)}
                />
            </div>
        </div>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/50">
              <TableHead className="font-semibold text-left">Booking ID</TableHead>
              <TableHead className="hidden sm:table-cell font-semibold text-left">Customer</TableHead>
              <TableHead className="hidden md:table-cell font-semibold text-left">Vehicle</TableHead>
              <TableHead className="hidden sm:table-cell font-semibold text-left">Date</TableHead>
              <TableHead className="font-semibold text-left">Status</TableHead>
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
            ) : bookingsData.length > 0 ? (
              bookingsData.map((booking) => (
                <TableRow key={booking.id}>
                  <TableCell className="font-mono text-xs truncate">{booking.bookingNumber}</TableCell>
                  <TableCell className="font-medium hidden sm:table-cell">{booking.customerName}</TableCell>
                  <TableCell className="hidden md:table-cell">{`${booking.carMake} ${booking.carModel} (${booking.plateNumber})`}</TableCell>
                  <TableCell className="hidden sm:table-cell">{new Date(booking.createdAt?.toDate()).toLocaleDateString()}</TableCell>
                  <TableCell>
                     <Badge variant={getStatusVariant(booking.status)}>{booking.status}</Badge>
                  </TableCell>
                   <TableCell className="text-right space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => router.push(`/client/booking-report?id=${booking.id}`)}
                      >
                        <Printer className="mr-2 h-4 w-4" />
                        <span className="hidden sm:inline">Instruction</span>
                      </Button>
                      {booking.status === 'Pending Approval' && (
                         <Button variant="default" size="sm" onClick={() => handleViewReport(booking.id)}>
                           <CheckCircle className="mr-2 h-4 w-4" />
                           <span className="hidden sm:inline">View Report</span>
                         </Button>
                      )}
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
  );

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
            <SidebarMenuItem>
              <SidebarMenuButton onClick={() => setActiveView('pending-approval')} isActive={activeView === 'pending-approval'} tooltip="Pending Approval">
                <Hourglass />
                Pending Approval
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

            {activeView === 'bookings' && renderBookingsTable(filteredBookings, "All Bookings", "View and manage all vehicle bookings reports.")}
            {activeView === 'pending-approval' && renderBookingsTable(pendingApprovalBookings, "Pending Approval", "These reports are awaiting your review and approval.")}
            
            <Dialog open={isValuationDialogOpen} onOpenChange={setValuationDialogOpen}>
                <DialogContent className="sm:max-w-4xl max-h-[90vh]">
                    <DialogHeader>
                        <DialogTitle>Valuation Report Details</DialogTitle>
                        <DialogDescription>Review the valuation details below and take action.</DialogDescription>
                    </DialogHeader>
                    {loadingValuation ? (
                        <div className="flex justify-center items-center p-8"><Skeleton className="h-24 w-full" /></div>
                    ) : selectedValuation ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 overflow-y-auto pr-6 -mr-6">
                            <div className="space-y-4">
                               <Carousel className="w-full">
                                  <CarouselContent>
                                    {selectedValuation.imageUrls.map((url, index) => (
                                      <CarouselItem key={index}>
                                        <Image src={url} alt={`Valuation Image ${index + 1}`} width={800} height={600} className="rounded-lg object-cover w-full aspect-[4/3]" />
                                      </CarouselItem>
                                    ))}
                                  </CarouselContent>
                                  {selectedValuation.imageUrls.length > 1 && (
                                    <>
                                        <CarouselPrevious />
                                        <CarouselNext />
                                    </>
                                  )}
                                </Carousel>

                                <div className="space-y-4 pt-4">
                                     <h4 className="font-semibold text-lg">Rejection Reason</h4>
                                     <Textarea
                                        placeholder="Provide a reason for rejection..."
                                        value={rejectionReason}
                                        onChange={(e) => setRejectionReason(e.target.value)}
                                        rows={3}
                                    />
                                </div>
                            </div>
                            <div className="space-y-4">
                                <h3 className="font-bold text-xl text-primary">Valuation Summary</h3>
                                <div className="grid grid-cols-2 gap-4 text-sm">
                                    <div className="font-semibold">Valued By:</div>
                                    <div>{selectedValuation.valuedBy}</div>
                                    
                                    <div className="font-semibold">Valuation Date:</div>
                                    <div>{new Date(selectedValuation.valuedAt?.toDate()).toLocaleString()}</div>

                                    <div className="font-semibold">Assessment Date:</div>
                                    <div>{new Date(selectedValuation.assessmentDate?.toDate()).toLocaleDateString()}</div>
                                    
                                    <div className="font-semibold text-green-600">Assessment Value:</div>
                                    <div className="font-mono text-green-600">KES {selectedValuation.assessmentValue}</div>

                                    <div className="font-semibold text-orange-600">Forced Sale Value:</div>
                                    <div className="font-mono text-orange-600">KES {selectedValuation.forcedValue}</div>
                                    
                                    <div className="font-semibold text-red-600">Salvage Value:</div>
                                    <div className="font-mono text-red-600">KES {selectedValuation.salvageValue}</div>
                                </div>
                                {selectedValuation.comments && (
                                     <div className="pt-4">
                                        <h4 className="font-semibold text-lg mb-2">Valuer&apos;s Comments</h4>
                                        <p className="text-sm p-4 bg-muted rounded-md border">{selectedValuation.comments}</p>
                                    </div>
                                )}
                                <DialogFooter className="!mt-8 gap-2 sm:gap-0">
                                    <DialogClose asChild>
                                      <Button variant="outline">Cancel</Button>
                                    </DialogClose>
                                    <Button variant="destructive" onClick={handleRejection} disabled={isSubmitting || !rejectionReason}>
                                      {isSubmitting ? 'Rejecting...' : <><ThumbsDown className="mr-2 h-4 w-4" /> Reject</>}
                                    </Button>
                                    <Button variant="default" onClick={handleApproval} disabled={isSubmitting}>
                                      {isSubmitting ? 'Approving...' : <><ThumbsUp className="mr-2 h-4 w-4" /> Approve</>}
                                    </Button>
                                </DialogFooter>
                            </div>
                        </div>
                    ) : (
                        <div className="text-center p-8">No valuation data found.</div>
                    )}
                </DialogContent>
            </Dialog>
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

    