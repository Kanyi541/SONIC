
"use client"

import React, { useState, useEffect, Suspense, useRef } from 'react';
import { SidebarProvider, Sidebar, SidebarTrigger, SidebarInset, SidebarHeader, SidebarContent, SidebarMenu, SidebarMenuItem, SidebarMenuButton, SidebarFooter } from '@/components/ui/sidebar';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { AuthGuard, useAuth } from '@/hooks/use-auth';
import { Button } from '@/components/ui/button';
import { LogOut, Users, LayoutDashboard, User, PlusCircle, Settings, Printer, FileText, Eye, EyeOff, UserCog, Search, Hourglass, CheckCircle, XCircle, Send, ThumbsUp, ThumbsDown, Car, Clock, ChevronDown, FolderCog, BookOpen, FileSpreadsheet, Database, ExternalLink, Bell, FileCheck, Trash2, FileClock, FileX, Building, Briefcase, Building2, FileWarning, FileSignature } from 'lucide-react';
import { signOut } from 'firebase/auth';
import { auth, db } from '@/lib/firebase';
import { collection, addDoc, onSnapshot, doc, updateDoc, query, where, getDocs, serverTimestamp, orderBy, limit, deleteDoc } from "firebase/firestore";
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
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Input } from '@/components/ui/input';
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
import { LineChart, Line, ResponsiveContainer, XAxis, YAxis, Tooltip, Legend, CartesianGrid, PieChart, Pie, Cell } from "recharts"
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"
import { format, startOfMonth, endOfMonth, eachDayOfInterval, getDate } from 'date-fns';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from "@/components/ui/progress"


interface Institution {
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

interface Staff {
  id: string;
  name: string;
  username: string;
  email: string;
  phone: string;
  active: boolean;
}

interface Branch {
  id: string;
  name: string;
  manager: string;
  location: string;
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
  insurerName?: string;
  rejectionReason?: string;
}

interface Valuation {
    id: string;
    bookingId: string;
    assessmentDate: any;
    assessmentValue: string;
    forcedValue: string;
    wsValue: string;
    rsValue: string;
    comments?: string;
    imageUrls: string[];
    valuedBy: string;
    valuedAt: any;
    status: 'Approved' | 'Rejected' | 'Pending Approval';
    rejectionReason?: string;
}

type ChartDataPoint = {
    day: string;
    Approved: number;
    Rejected: number;
};


function AdminDashboard() {
  const { user } = useAuth();
  const { toast } = useToast();
  const router = useRouter();
  const [activeView, setActiveView] = useState('dashboard');
  const [institutions, setInstitutions] = useState<Institution[]>([]);
  const [valuers, setValuers] = useState<Valuer[]>([]);
  const [staff, setStaff] = useState<Staff[]>([]);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [valuations, setValuations] = useState<Valuation[]>([]);
  const [pendingBookingsForNotif, setPendingBookingsForNotif] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAddInstitutionOpen, setAddInstitutionOpen] = useState(false);
  const [isAddValuerOpen, setAddValuerOpen] = useState(false);
  const [isAddStaffOpen, setAddStaffOpen] = useState(false);
  const [isAddBranchOpen, setAddBranchOpen] = useState(false);
  const [isControlActive, setControlActive] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [bookingSearchTerm, setBookingSearchTerm] = useState('');
  const [chartData, setChartData] = useState<ChartDataPoint[]>([]);
  const [rejectionReason, setRejectionReason] = useState("");
  const [selectedBookingForAction, setSelectedBookingForAction] = useState<Booking | null>(null);
  
  const getInitials = (email?: string | null) => {
    return email ? email.charAt(0).toUpperCase() : '?';
  };
    
    const generateChartData = (bookings: Booking[]) => {
        const today = new Date();
        const firstDayOfMonth = startOfMonth(today);
        const lastDayOfMonth = endOfMonth(today);
        const daysInMonth = eachDayOfInterval({ start: firstDayOfMonth, end: lastDayOfMonth });

        const monthlyData: ChartDataPoint[] = daysInMonth.map(day => ({
            day: format(day, 'd'),
            Approved: 0,
            Rejected: 0,
        }));

        bookings.forEach(booking => {
            if (booking.createdAt) {
                const bookingDate = booking.createdAt.toDate();
                if (bookingDate >= firstDayOfMonth && bookingDate <= lastDayOfMonth) {
                    const dayOfMonth = getDate(bookingDate) - 1; 
                    if (monthlyData[dayOfMonth]) {
                        if (booking.status === 'Completed') monthlyData[dayOfMonth].Approved++;
                        if (booking.status === 'Rejected') monthlyData[dayOfMonth].Rejected++;
                    }
                }
            }
        });
        
        setChartData(monthlyData);
    };

  useEffect(() => {
    setLoading(true);
    const subscriptions: (() => void)[] = [];

    // Subscription for notifications (latest 5 pending bookings)
    const notifQuery = query(collection(db, "bookings"), where("status", "==", "Pending Approval"));
    const notifUnsubscribe = onSnapshot(notifQuery, (snapshot) => {
        const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() as Booking }));
        const sortedData = data.sort((a, b) => b.createdAt.toMillis() - a.createdAt.toMillis());
        setPendingBookingsForNotif(sortedData.slice(0, 5));
    }, (error) => {
        console.error("Error in notification listener:", error);
    });
    subscriptions.push(notifUnsubscribe);

    const subscribeToCollection = (
        collectionName: string, 
        setter: React.Dispatch<React.SetStateAction<any[]>>, 
        requiredViews: string[]
    ) => {
        if (requiredViews.includes(activeView) || activeView === 'dashboard') {
            const q = query(collection(db, collectionName), orderBy("name"));
            const unsubscribe = onSnapshot(q, (snapshot) => {
                const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
                setter(data);
                setLoading(false);
            }, (error) => {
                 console.error(`Error in ${collectionName} listener:`, error);
            });
            subscriptions.push(unsubscribe);
        }
    };
    
    subscribeToCollection("insurers", setInstitutions, ["clients"]);
    subscribeToCollection("valuers", setValuers, ["valuers"]);
    subscribeToCollection("staff", setStaff, ["staff"]);
    subscribeToCollection("branches", setBranches, ["branches"]);
    
    if (['dashboard', 'valuations'].includes(activeView)) {
        const valuationsQuery = query(collection(db, "valuations"), orderBy("valuedAt", "desc"));
        const valUnsubscribe = onSnapshot(valuationsQuery, (snapshot) => {
            const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() as Valuation }));
            setValuations(data);
        });
        subscriptions.push(valUnsubscribe);
    }
    

    const bookingsQuery = query(collection(db, "bookings"));
    const requiredBookingViews = ['dashboard', 'valuations', 'new-bookings'];

    if (requiredBookingViews.includes(activeView)) {
        const unsubscribe = onSnapshot(bookingsQuery, (snapshot) => {
            const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            const bookingsData = data as Booking[];
            setBookings(bookingsData);
            if(activeView === 'dashboard') {
              generateChartData(bookingsData);
            }
            setLoading(false);
        }, (error) => {
            console.error("Error in bookings listener:", error);
        });
        subscriptions.push(unsubscribe);
    }
    
    // Fallback for views that don't subscribe to anything
    const viewsWithoutSubscriptions = ['settings'];
    if (!['clients', 'valuers', 'staff', 'branches', ...requiredBookingViews].includes(activeView) && !viewsWithoutSubscriptions.includes(activeView)) {
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
  
  const handleAddUser = async (event: React.FormEvent<HTMLFormElement>, userType: 'institution' | 'valuer' | 'staff') => {
    event.preventDefault();
    const form = event.currentTarget;
    const name = (form.elements.namedItem('name') as HTMLInputElement).value;
    const username = (form.elements.namedItem('username') as HTMLInputElement).value;
    const email = (form.elements.namedItem('email') as HTMLInputElement).value;
    const phone = (form.elements.namedItem('phone') as HTMLInputElement).value;
    const password = (form.elements.namedItem('password') as HTMLInputElement).value;

    let collectionName = 'insurers';
    if (userType === 'valuer') collectionName = 'valuers';
    if (userType === 'staff') collectionName = 'staff';

    try {
      const usernameQuery = query(collection(db, collectionName), where("username", "==", username));
      const emailQuery = query(collection(db, collectionName), where("email", "==", email));
      
      const [usernameSnapshot, emailSnapshot] = await Promise.all([
          getDocs(usernameQuery),
          getDocs(emailQuery)
      ]);

      if (!usernameSnapshot.empty) {
          toast({ variant: "destructive", title: "Registration Failed", description: `A user with this username already exists.` });
          return;
      }
      if (!emailSnapshot.empty) {
          toast({ variant: "destructive", title: "Registration Failed", description: `A user with this email already exists.` });
          return;
      }

      await addDoc(collection(db, collectionName), {
        name,
        username,
        email,
        phone,
        password,
        active: isControlActive,
      });

      if (userType === 'institution') setAddInstitutionOpen(false);
      else if (userType === 'valuer') setAddValuerOpen(false);
      else setAddStaffOpen(false);

      form.reset();
      setControlActive(true);
      setShowPassword(false);
      let userTypeDisplay = 'User';
      if (userType === 'institution') userTypeDisplay = 'Client';
      if (userType === 'valuer') userTypeDisplay = 'Valuer';
      if (userType === 'staff') userTypeDisplay = 'Staff';

      toast({ title: `${userTypeDisplay} Added`, description: `${name} has been successfully added.`});
    } catch (error: any) {
       let userTypeDisplay = 'User';
        if (userType === 'institution') userTypeDisplay = 'Client';
        if (userType === 'valuer') userTypeDisplay = 'Valuer';
        if (userType === 'staff') userTypeDisplay = 'Staff';
       console.error(`Error adding ${userType}: `, error);
       toast({
         variant: "destructive",
         title: `Failed to Add ${userTypeDisplay}`,
         description: `An error occurred while adding the ${userType}.`,
       });
    }
  };

  const handleAddBranch = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = event.currentTarget;
    const name = (form.elements.namedItem('branchName') as HTMLInputElement).value;
    const manager = (form.elements.namedItem('branchManager') as HTMLInputElement).value;
    const location = (form.elements.namedItem('branchLocation') as HTMLInputElement).value;

    try {
        await addDoc(collection(db, "branches"), {
            name,
            manager,
            location,
        });
        toast({ title: "Branch Added", description: `${name} has been successfully added.` });
        setAddBranchOpen(false);
        form.reset();
    } catch (error) {
        console.error("Error adding branch: ", error);
        toast({
            variant: "destructive",
            title: "Failed to Add Branch",
            description: "An error occurred while adding the branch.",
        });
    }
  };
  
  const handleDeleteBranch = async (id: string, name: string) => {
    const docRef = doc(db, "branches", id);
    try {
        await deleteDoc(docRef);
        toast({ title: "Branch Deleted", description: `${name} has been successfully deleted.` });
    } catch (error) {
        console.error("Error deleting branch: ", error);
        toast({ variant: "destructive", title: "Deletion Failed", description: "Could not delete branch." });
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

  const handleDeleteUser = async (id: string, name: string, collectionName: string) => {
    const docRef = doc(db, collectionName, id);
    try {
        await deleteDoc(docRef);
        let userTypeDisplay = 'User';
        if (collectionName === 'insurers') userTypeDisplay = 'Client';
        if (collectionName === 'valuers') userTypeDisplay = 'Valuer';
        if (collectionName === 'staff') userTypeDisplay = 'Staff';
        toast({ title: `${userTypeDisplay} Deleted`, description: `${name} has been successfully deleted.` });
    } catch (error) {
        console.error("Error deleting user: ", error);
        toast({ variant: "destructive", title: "Deletion Failed", description: "Could not delete user." });
    }
  };
  
  const handleOpenReportInNewTab = (reportType: 'booking' | 'valuation', bookingId: string) => {
    const url = reportType === 'booking' 
      ? `/client/booking-report?id=${bookingId}`
      : `/admin/valuation-report?id=${bookingId}`;
    window.open(url, '_blank');
  };

  const handleBookingApproval = async (booking: Booking) => {
      const bookingDocRef = doc(db, "bookings", booking.id);
      try {
          await updateDoc(bookingDocRef, { status: "Pending Valuation" });
          toast({ title: "Booking Approved", description: `Booking #${booking.bookingNumber} approved for valuation.` });
      } catch (error) {
          console.error("Error approving booking: ", error);
          toast({ variant: "destructive", title: "Approval Failed", description: "Could not approve booking." });
      }
  };

  const handleBookingRejection = async () => {
      if (!selectedBookingForAction || !rejectionReason) {
          toast({ variant: "destructive", title: "Validation Error", description: "Rejection reason cannot be empty." });
          return;
      }
      const { id, bookingNumber } = selectedBookingForAction;
      const bookingDocRef = doc(db, "bookings", id);
      try {
          await updateDoc(bookingDocRef, { status: "Rejected", rejectionReason });
          toast({ title: "Booking Rejected", description: `Booking #${bookingNumber} has been rejected.` });
          setRejectionReason("");
          setSelectedBookingForAction(null);
      } catch (error) {
          console.error("Error rejecting booking: ", error);
          toast({ variant: "destructive", title: "Rejection Failed", description: "Could not reject booking." });
      }
  };

  const getStatusVariant = (status: string): "default" | "secondary" | "destructive" | "outline" => {
    switch (status) {
      case "Pending":
      case "Pending Valuation":
        return "secondary";
      case "Pending Approval":
        return "outline";
      case "Completed":
      case "Approved":
        return "default";
      case "Rejected":
        return "destructive";
      default:
        return "outline";
    }
  };
  
  const stats = {
      totalCars: bookings.length,
      totalValuations: valuations.length,
      pendingApproval: bookings.filter(b => b.status === 'Pending Approval').length,
      totalInstitutions: institutions.length,
      totalStaff: staff.length,
  };
    
    const recentValuations = valuations.slice(0, 5).map(valuation => {
        const booking = bookings.find(b => b.id === valuation.bookingId);
        return { ...valuation, booking };
    });
    
  const StatCard = ({ title, value, icon, onClick, progress, colorClass }: { title: string, value: number, icon: React.ReactNode, onClick?: () => void, progress: number, colorClass: string }) => (
      <Card onClick={onClick} className={`${onClick ? 'cursor-pointer hover:bg-muted' : ''} transition-colors p-4 flex flex-col justify-between`}>
          <div className="flex items-start justify-between">
              <div className={`w-12 h-12 rounded-full flex items-center justify-center bg-muted`}>
                  {icon}
              </div>
              <div className="text-3xl font-bold">{loading ? <Skeleton className="h-9 w-12" /> : value}</div>
          </div>
          <div className="mt-4">
              <p className="text-sm font-medium text-muted-foreground">{title}</p>
              <Progress value={progress} className={`h-1 mt-1 ${colorClass}`} indicatorClassName={colorClass} />
          </div>
      </Card>
  );

  const renderUserTable = (
    data: (Institution | Valuer | Staff)[],
    title: string,
    description: string,
    onAdd: () => void,
    userType: 'institution' | 'valuer' | 'staff'
  ) => (
    <Card className="shadow-lg border-primary/20">
      <CardHeader className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <CardTitle className="font-headline text-3xl text-primary">{title}</CardTitle>
          <CardDescription>{description}</CardDescription>
        </div>
        <Button onClick={onAdd}>
          <PlusCircle className="mr-2" />
          Register New {userType === 'institution' ? 'Client' : (userType.charAt(0).toUpperCase() + userType.slice(1))}
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
              <TableHead className="font-semibold text-center">Status</TableHead>
              <TableHead className="text-right font-semibold">Actions</TableHead>
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
                <TableCell className="text-center">
                   <div className="flex items-center justify-center gap-2">
                      <span className={`text-sm font-medium ${item.active ? 'text-green-500' : 'text-red-500'}`}>
                        {item.active ? 'Active' : 'Inactive'}
                      </span>
                      <Switch
                        checked={item.active}
                        onCheckedChange={() => {
                            let collectionName = '';
                            if (userType === 'institution') collectionName = 'insurers';
                            else if (userType === 'valuer') collectionName = 'valuers';
                            else if (userType === 'staff') collectionName = 'staff';
                            toggleStatus(item.id, item.active, collectionName, item.name);
                        }}
                        aria-label={`Toggle status for ${item.name}`}
                      />
                    </div>
                </TableCell>
                <TableCell className="text-right">
                    <AlertDialog>
                        <AlertDialogTrigger asChild>
                           <Button variant="outline" size="icon" className="bg-black text-primary hover:bg-black/90 hover:text-primary/90">
                                <Trash2 className="h-4 w-4" />
                            </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                            <AlertDialogHeader>
                                <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                                <AlertDialogDescription>
                                    This action cannot be undone. This will permanently delete the user {item.name}.
                                </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction onClick={() => {
                                     let collectionName = '';
                                     if (userType === 'institution') collectionName = 'insurers';
                                     else if (userType === 'valuer') collectionName = 'valuers';
                                     else if (userType === 'staff') collectionName = 'staff';
                                    handleDeleteUser(item.id, item.name, collectionName)
                                }}>
                                    Continue
                                </AlertDialogAction>
                            </AlertDialogFooter>
                        </AlertDialogContent>
                    </AlertDialog>
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
    userType: 'institution' | 'valuer' | 'staff'
  ) => {
    const userTypeDisplay = userType === 'institution' ? 'Client' : userType.charAt(0).toUpperCase() + userType.slice(1);
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
};
  
  const renderValuationsTable = (
    valuationsData: Valuation[],
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
                    placeholder="Search valuations..."
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
              <TableHead className="font-semibold">Booking No.</TableHead>
              <TableHead className="font-semibold hidden md:table-cell">Customer</TableHead>
              <TableHead className="font-semibold hidden lg:table-cell">Client</TableHead>
              <TableHead className="font-semibold hidden sm:table-cell">Vehicle</TableHead>
              <TableHead className="font-semibold hidden md:table-cell">Plate No.</TableHead>
              <TableHead className="font-semibold text-left">Status</TableHead>
              <TableHead className="text-right font-semibold">Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              Array.from({ length: 5 }).map((_, index) => (
                <TableRow key={index}>
                  <TableCell><Skeleton className="h-5 w-24" /></TableCell>
                  <TableCell className="hidden md:table-cell"><Skeleton className="h-5 w-32" /></TableCell>
                  <TableCell className="hidden lg:table-cell"><Skeleton className="h-5 w-32" /></TableCell>
                  <TableCell className="hidden sm:table-cell"><Skeleton className="h-5 w-28" /></TableCell>
                  <TableCell className="hidden md:table-cell"><Skeleton className="h-5 w-24" /></TableCell>
                  <TableCell><Skeleton className="h-6 w-20" /></TableCell>
                  <TableCell className="text-right"><Skeleton className="h-8 w-28 ml-auto" /></TableCell>
                </TableRow>
              ))
            ) : valuationsData.length > 0 ? (
                valuationsData.map((valuation) => {
                const booking = bookings.find(b => b.id === valuation.bookingId);
                return (
                    <TableRow key={valuation.id}>
                    <TableCell className="font-mono text-xs truncate">{booking?.bookingNumber}</TableCell>
                    <TableCell className="font-medium hidden md:table-cell">{booking?.customerName}</TableCell>
                    <TableCell className="hidden lg:table-cell">{booking?.insurerName}</TableCell>
                    <TableCell className="hidden sm:table-cell">{booking?.carMake}</TableCell>
                    <TableCell className="font-mono hidden md:table-cell">{booking?.plateNumber}</TableCell>
                    <TableCell>
                        <Badge variant={getStatusVariant(booking?.status || 'Unknown')}>{booking?.status}</Badge>
                    </TableCell>
                    <TableCell className="text-right">
                         <Popover>
                            <PopoverTrigger asChild>
                                <Button variant="outline" size="sm">
                                <FileSpreadsheet className="mr-2 h-4 w-4" />
                                <span className="hidden sm:inline">Reports</span>
                                </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-56 p-2">
                                <div className="grid gap-2">
                                <Button
                                    variant="ghost"
                                    className="justify-start"
                                    onClick={() => handleOpenReportInNewTab('booking', valuation.bookingId)}
                                >
                                    Booking Report
                                </Button>
                                <Button
                                    variant="ghost"
                                    className="justify-start"
                                    onClick={() => handleOpenReportInNewTab('valuation', valuation.bookingId)}
                                >
                                    Valuation Report
                                </Button>
                                </div>
                            </PopoverContent>
                        </Popover>
                    </TableCell>
                    </TableRow>
                )
              })
            ) : (
              <TableRow>
                <TableCell colSpan={7} className="text-center h-24">
                  No valuations found.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );

  const renderNewBookingsTable = (
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
              <TableHead className="font-semibold">Booking No.</TableHead>
              <TableHead className="font-semibold hidden md:table-cell">Customer</TableHead>
              <TableHead className="font-semibold hidden lg:table-cell">Client</TableHead>
              <TableHead className="font-semibold hidden sm:table-cell">Vehicle</TableHead>
              <TableHead className="font-semibold hidden md:table-cell">Plate No.</TableHead>
              <TableHead className="font-semibold text-left">Status</TableHead>
              <TableHead className="text-right font-semibold">Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              Array.from({ length: 5 }).map((_, index) => (
                <TableRow key={index}>
                  <TableCell><Skeleton className="h-5 w-24" /></TableCell>
                  <TableCell className="hidden md:table-cell"><Skeleton className="h-5 w-32" /></TableCell>
                  <TableCell className="hidden lg:table-cell"><Skeleton className="h-5 w-32" /></TableCell>
                  <TableCell className="hidden sm:table-cell"><Skeleton className="h-5 w-28" /></TableCell>
                  <TableCell className="hidden md:table-cell"><Skeleton className="h-5 w-24" /></TableCell>
                  <TableCell><Skeleton className="h-6 w-20" /></TableCell>
                  <TableCell className="text-right"><Skeleton className="h-8 w-28 ml-auto" /></TableCell>
                </TableRow>
              ))
            ) : bookingsData.length > 0 ? (
                bookingsData.map((booking) => (
                    <TableRow key={booking.id}>
                    <TableCell className="font-mono text-xs truncate">{booking?.bookingNumber}</TableCell>
                    <TableCell className="font-medium hidden md:table-cell">{booking?.customerName}</TableCell>
                    <TableCell className="hidden lg:table-cell">{booking?.insurerName}</TableCell>
                    <TableCell className="hidden sm:table-cell">{booking?.carMake}</TableCell>
                    <TableCell className="font-mono hidden md:table-cell">{booking?.plateNumber}</TableCell>
                    <TableCell>
                        <Badge variant={getStatusVariant(booking.status)}>{booking.status}</Badge>
                    </TableCell>
                    <TableCell className="text-right space-x-2">
                        <Button variant="default" size="sm" onClick={() => handleBookingApproval(booking)}>
                            <ThumbsUp className="mr-2 h-4 w-4" />
                            Approve
                        </Button>
                        <DialogTrigger asChild>
                            <Button variant="destructive" size="sm" onClick={() => setSelectedBookingForAction(booking)}>
                                <ThumbsDown className="mr-2 h-4 w-4" />
                                Reject
                            </Button>
                        </DialogTrigger>
                    </TableCell>
                    </TableRow>
                ))
            ) : (
              <TableRow>
                <TableCell colSpan={7} className="text-center h-24">
                  No new bookings found.
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
            <div className="bg-sidebar-primary text-sidebar-primary-foreground rounded-lg p-2 flex items-center justify-center">
              <Settings className="h-6 w-6" />
            </div>
            <h2 className="text-lg font-semibold text-sidebar-primary">Admin Panel</h2>
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
                <SidebarMenuButton onClick={() => setActiveView('staff')} isActive={activeView === 'staff'} tooltip="Manage Staff">
                    <Briefcase />
                    Manage Staff
                </SidebarMenuButton>
            </SidebarMenuItem>

            <SidebarMenuItem>
              <SidebarMenuButton onClick={() => setActiveView('clients')} isActive={activeView === 'clients'} tooltip="Manage Clients">
                <Building />
                Manage Clients
              </SidebarMenuButton>
            </SidebarMenuItem>
            <SidebarMenuItem>
                <SidebarMenuButton onClick={() => setActiveView('valuers')} isActive={activeView === 'valuers'} tooltip="Manage Valuers">
                    <UserCog />
                    Manage Valuers
                </SidebarMenuButton>
            </SidebarMenuItem>
            <SidebarMenuItem>
                <SidebarMenuButton onClick={() => setActiveView('branches')} isActive={activeView === 'branches'} tooltip="Our Branches">
                    <Building2 />
                    Our Branches
                </SidebarMenuButton>
            </SidebarMenuItem>
            
            <SidebarMenuItem>
              <SidebarMenuButton onClick={() => setActiveView('valuations')} isActive={activeView === 'valuations'} tooltip="Valuations">
                <FileSpreadsheet />
                Valuations
              </SidebarMenuButton>
            </SidebarMenuItem>
            
            <SidebarMenuItem>
              <SidebarMenuButton onClick={() => setActiveView('settings')} isActive={activeView === 'settings'} tooltip="Settings">
                <Settings />
                Settings
              </SidebarMenuButton>
            </SidebarMenuItem>

          </SidebarMenu>
        </SidebarContent>
      </Sidebar>
      <Dialog onOpenChange={(open) => !open && setSelectedBookingForAction(null)}>
      <SidebarInset>
        <header className="sticky top-0 z-40 w-full border-b bg-black shadow-sm">
            <div className="container flex h-16 items-center justify-between">
                <div className="flex items-center gap-4">
                    <SidebarTrigger className="text-white hover:text-white/80" />
                    <h1 className="text-xl font-headline font-bold text-white">CASA Motor Valuers & Assessors Ltd</h1>
                </div>
                <div className="flex items-center gap-4">
                    <Popover>
                        <PopoverTrigger asChild>
                            <Button variant="ghost" size="icon" className="relative text-white hover:text-white/80">
                                <Bell className="h-5 w-5" />
                                {pendingBookingsForNotif.length > 0 && (
                                    <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-xs text-white">
                                        {pendingBookingsForNotif.length}
                                    </span>
                                )}
                            </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-80 p-0">
                            <div className="p-4 font-semibold border-b">Notifications</div>
                            <div className="p-2 max-h-80 overflow-y-auto">
                                {pendingBookingsForNotif.length > 0 ? (
                                    pendingBookingsForNotif.map(booking => (
                                        <div key={booking.id} className="p-2 hover:bg-muted rounded-md text-sm">
                                            <p className="font-semibold">{booking.customerName}</p>
                                            <p className="text-muted-foreground">New booking for {booking.carMake} {booking.carModel}</p>
                                        </div>
                                    ))
                                ) : (
                                    <p className="p-4 text-center text-sm text-muted-foreground">No new notifications.</p>
                                )}
                            </div>
                        </PopoverContent>
                    </Popover>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="relative h-10 w-10 rounded-full">
                          <Avatar className="h-10 w-10">
                            <AvatarFallback className="bg-primary text-primary-foreground">{getInitials(user?.email)}</AvatarFallback>
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
            </div>
        </header>
        <main className="flex-1 container py-8">
            {activeView === 'dashboard' && (
              <div className="grid gap-8">
                <div>
                    <h1 className="font-headline text-3xl md:text-4xl font-bold text-primary">Welcome, Admin!</h1>
                    <p className="text-muted-foreground mt-2">This is your secure control panel for CASA Motor Valuers & Assessors.</p>
                </div>
                 <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <StatCard 
                        title="Staff" 
                        value={stats.totalStaff} 
                        icon={<Briefcase className="h-6 w-6 text-blue-500" />} 
                        onClick={() => setActiveView('staff')}
                        progress={100}
                        colorClass="bg-blue-500"
                    />
                     <StatCard 
                        title="Clients" 
                        value={stats.totalInstitutions} 
                        icon={<Building className="h-6 w-6 text-orange-500" />} 
                        onClick={() => setActiveView('clients')}
                        progress={100}
                        colorClass="bg-orange-500"
                    />
                     <StatCard 
                        title="Total Cars" 
                        value={stats.totalCars} 
                        icon={<Car className="h-6 w-6 text-green-500" />} 
                        onClick={() => setActiveView('valuations')}
                        progress={100}
                        colorClass="bg-green-500"
                    />
                     <StatCard 
                        title="Pending Approval" 
                        value={stats.pendingApproval} 
                        icon={<FileSignature className="h-6 w-6 text-yellow-500" />} 
                        onClick={() => setActiveView('new-bookings')}
                        progress={stats.totalCars > 0 ? (stats.pendingApproval / stats.totalCars) * 100 : 0}
                        colorClass="bg-yellow-500"
                    />
                </div>

                <Card>
                    <CardHeader>
                        <CardTitle>Recent Valuations</CardTitle>
                        <CardDescription>A summary of the latest valuation reports submitted.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Plate No</TableHead>
                                    <TableHead>Make &amp; Model</TableHead>
                                    <TableHead className="hidden sm:table-cell">Booking Number</TableHead>
                                    <TableHead className="hidden md:table-cell">Assessment Date</TableHead>
                                    <TableHead>Customer Name</TableHead>
                                    <TableHead className="hidden sm:table-cell">Institution</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead className="hidden xl:table-cell">Assessment Value (KES)</TableHead>
                                    <TableHead className="hidden xl:table-cell">Forced Value (KES)</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {loading ? (
                                    Array.from({ length: 5 }).map((_, index) => (
                                    <TableRow key={index}>
                                        <TableCell><Skeleton className="h-5 w-20" /></TableCell>
                                        <TableCell><Skeleton className="h-5 w-28" /></TableCell>
                                        <TableCell className="hidden sm:table-cell"><Skeleton className="h-5 w-32" /></TableCell>
                                        <TableCell className="hidden md:table-cell"><Skeleton className="h-5 w-24" /></TableCell>
                                        <TableCell><Skeleton className="h-5 w-32" /></TableCell>
                                        <TableCell className="hidden sm:table-cell"><Skeleton className="h-5 w-32" /></TableCell>
                                        <TableCell><Skeleton className="h-6 w-20" /></TableCell>
                                        <TableCell className="hidden xl:table-cell"><Skeleton className="h-5 w-24" /></TableCell>
                                        <TableCell className="hidden xl:table-cell"><Skeleton className="h-5 w-24" /></TableCell>
                                    </TableRow>
                                    ))
                                ) : recentValuations.length > 0 ? (
                                    recentValuations.map((valuation) => (
                                    <TableRow key={valuation.id}>
                                        <TableCell>{valuation.booking?.plateNumber}</TableCell>
                                        <TableCell>{`${valuation.booking?.carMake} ${valuation.booking?.carModel}`}</TableCell>
                                        <TableCell className="font-mono text-xs hidden sm:table-cell">{valuation.booking?.bookingNumber}</TableCell>
                                        <TableCell className="hidden md:table-cell">{new Date(valuation.assessmentDate?.toDate()).toLocaleDateString()}</TableCell>
                                        <TableCell>{valuation.booking?.customerName}</TableCell>
                                        <TableCell className="hidden sm:table-cell">{valuation.booking?.insurerName}</TableCell>
                                        <TableCell>
                                          <Badge variant={getStatusVariant(valuation.booking?.status || 'Unknown')}>
                                            {valuation.booking?.status}
                                          </Badge>
                                        </TableCell>
                                        <TableCell className="font-mono hidden xl:table-cell">{valuation.assessmentValue}</TableCell>
                                        <TableCell className="font-mono hidden xl:table-cell">{valuation.forcedValue}</TableCell>
                                    </TableRow>
                                    ))
                                ) : (
                                    <TableRow>
                                        <TableCell colSpan={9} className="h-24 text-center">
                                            No recent valuations found.
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>
              </div>
            )}
            {activeView === 'clients' && renderUserTable(institutions, "Manage Clients", "View and manage all registered clients.", () => setAddInstitutionOpen(true), "institution")}
            {activeView === 'valuers' && renderUserTable(valuers, "Manage Valuers", "View and manage all registered valuers.", () => setAddValuerOpen(true), "valuer")}
            {activeView === 'staff' && renderUserTable(staff, "Manage Staff", "View and manage all registered staff members.", () => setAddStaffOpen(true), "staff")}
            {activeView === 'branches' && (
                <Card className="shadow-lg border-primary/20">
                    <CardHeader className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                        <div>
                        <CardTitle className="font-headline text-3xl text-primary">Our Branches</CardTitle>
                        <CardDescription>View and manage all company branches.</CardDescription>
                        </div>
                        <Button onClick={() => setAddBranchOpen(true)}>
                            <PlusCircle className="mr-2" />
                            Add Branch
                        </Button>
                    </CardHeader>
                    <CardContent>
                        <Table>
                        <TableHeader>
                            <TableRow className="bg-muted/50">
                            <TableHead className="font-semibold text-left">Branch Name</TableHead>
                            <TableHead className="font-semibold text-left">Branch Manager</TableHead>
                            <TableHead className="font-semibold text-left">Location</TableHead>
                            <TableHead className="text-right font-semibold">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {branches.map(branch => (
                            <TableRow key={branch.id}>
                                <TableCell className="font-medium">{branch.name}</TableCell>
                                <TableCell>{branch.manager}</TableCell>
                                <TableCell>{branch.location}</TableCell>
                                <TableCell className="text-right">
                                    <AlertDialog>
                                        <AlertDialogTrigger asChild>
                                            <Button variant="outline" size="icon" className="bg-black text-primary hover:bg-black/90 hover:text-primary/90">
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        </AlertDialogTrigger>
                                        <AlertDialogContent>
                                            <AlertDialogHeader>
                                                <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                                                <AlertDialogDescription>
                                                    This action cannot be undone. This will permanently delete the branch {branch.name}.
                                                </AlertDialogDescription>
                                            </AlertDialogHeader>
                                            <AlertDialogFooter>
                                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                                <AlertDialogAction onClick={() => handleDeleteBranch(branch.id, branch.name)}>
                                                    Continue
                                                </AlertDialogAction>
                                            </AlertDialogFooter>
                                        </AlertDialogContent>
                                    </AlertDialog>
                                </TableCell>
                            </TableRow>
                            ))}
                        </TableBody>
                        </Table>
                    </CardContent>
                </Card>
            )}
            
            {renderUserDialog(isAddInstitutionOpen, setAddInstitutionOpen, 'institution')}
            {renderUserDialog(isAddValuerOpen, setAddValuerOpen, 'valuer')}
            {renderUserDialog(isAddStaffOpen, setAddStaffOpen, 'staff')}
            
            <Dialog open={isAddBranchOpen} onOpenChange={setAddBranchOpen}>
                <DialogContent className="sm:max-w-[425px]">
                    <DialogHeader>
                    <DialogTitle>Add New Branch</DialogTitle>
                    <DialogDescription>
                        Fill in the details below to create a new branch.
                    </DialogDescription>
                    </DialogHeader>
                    <form onSubmit={handleAddBranch} className="grid gap-4 py-4">
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="branchName" className="text-right">Name</Label>
                        <Input id="branchName" name="branchName" className="col-span-3" required />
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="branchManager" className="text-right">Manager</Label>
                        <Input id="branchManager" name="branchManager" className="col-span-3" required />
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="branchLocation" className="text-right">Location</Label>
                        <Input id="branchLocation" name="branchLocation" className="col-span-3" required />
                    </div>
                    <DialogFooter>
                        <Button type="submit">Create Branch</Button>
                    </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            {activeView === 'valuations' && renderValuationsTable(valuations, "All Valuations", "View and manage all submitted valuation reports.")}
            
            {activeView === 'new-bookings' && renderNewBookingsTable(bookings.filter(b => b.status === 'Pending Approval'), "New Bookings", "Review and approve or reject new bookings.")}

            {activeView === 'settings' && (
              <div>
                <h2 className="text-2xl font-bold">Settings</h2>
                <p>Manage application settings here.</p>
              </div>
            )}
        </main>
        <footer className="py-6 md:px-8 md:py-0 border-t bg-card/50">
            <div className="container flex flex-col items-center justify-center gap-2 md:h-24 md:flex-row">
                 <p className="text-sm text-muted-foreground">
                    &copy; {new Date().getFullYear()} CASA Motor Valuers & Assessors Ltd. All rights reserved.
                </p>
                <p className="text-sm text-muted-foreground">
                    Designed by <a href="https://elvisdev.netlify.app/" target="_blank" rel="noopener noreferrer" className="font-medium underline underline-offset-4">Tekivo Technologies</a>
                </p>
            </div>
        </footer>
      </SidebarInset>
        <DialogContent>
            <DialogHeader>
                <DialogTitle>Reject Booking</DialogTitle>
                <DialogDescription>
                    Please provide a reason for rejecting this booking. This will be visible to the client.
                </DialogDescription>
            </DialogHeader>
            <Textarea
                placeholder="Enter rejection reason here..."
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
            />
            <DialogFooter>
                <DialogClose asChild>
                    <Button variant="outline">Cancel</Button>
                </DialogClose>
                <Button variant="destructive" onClick={handleBookingRejection}>
                    Confirm Rejection
                </Button>
            </DialogFooter>
        </DialogContent>
      </Dialog>
    </SidebarProvider>
  );
}

export default function AdminDashboardPage() {
  return (
    <AuthGuard>
      <AdminDashboard />
    </AuthGuard>
  );
}

    