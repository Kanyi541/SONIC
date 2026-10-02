

"use client"

import React, { useState, useEffect, Suspense, useRef, useMemo } from 'react';
import { SidebarProvider, Sidebar, SidebarTrigger, SidebarInset, SidebarHeader, SidebarContent, SidebarMenu, SidebarMenuItem, SidebarMenuButton, SidebarFooter } from '@/components/ui/sidebar';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { useAuth, AuthGuard } from '@/hooks/use-auth';
import { Button } from '@/components/ui/button';
import { LogOut, Users, LayoutDashboard, User, PlusCircle, Settings, Printer, FileText, Eye, EyeOff, UserCog, Search, Hourglass, CheckCircle, XCircle, Send, ThumbsUp, ThumbsDown, Car, Clock, ChevronDown, FolderCog, BookOpen, FileSpreadsheet, Database, ExternalLink, Bell, FileCheck, Trash2, FileClock, FileX, Building, Briefcase, Building2, FileWarning, FileSignature, ChevronLeft, ChevronRight, FileSearch, Save, Edit, Loader2, KeyRound, ShieldCheck, FileDown, ShieldQuestion, TrendingUp, DollarSign, Timer, Repeat, Activity, Download } from 'lucide-react';
import { signOut, createUserWithEmailAndPassword, fetchSignInMethodsForEmail } from 'firebase/auth';
import { auth, db } from '@/lib/firebase';
import { collection, addDoc, onSnapshot, doc, updateDoc, query, where, getDocs, serverTimestamp, orderBy, limit, deleteDoc, getDoc } from "firebase/firestore";
import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Form, FormField, FormItem, FormControl, FormMessage, FormLabel } from "@/components/ui/form";
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from '@/components/ui/carousel';
import Image from 'next/image';
import { Textarea } from '@/components/ui/textarea';
import { LineChart, Line, ResponsiveContainer, XAxis, YAxis, Tooltip, Legend, CartesianGrid, PieChart, Pie, Cell, BarChart, Bar } from "recharts"
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"
import { format, startOfMonth, endOfMonth, eachDayOfInterval, getDate, isToday, differenceInHours, subDays } from 'date-fns';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress"
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import Loading from '@/app/loading';
import pako from 'pako';
import { InstallPwaButton } from '@/components/pwa/install-prompt';


interface Institution {
  id: string;
  name: string;
  username: string;
  email: string;
  phone: string;
  active: boolean;
  uid?: string;
  createdAt?: any;
}

interface Valuer {
  id: string;
  name: string;
  username: string;
  email: string;
  phone: string;
  active: boolean;
  createdAt?: any;
  uid?: string;
}

interface Staff {
  id: string;
  name: string;
  username: string;
  email: string;
  phone: string;
  active: boolean;
  createdAt?: any;
  isAdmin?: boolean;
  uid?: string;
  role?: 'Super Admin' | 'Admin' | 'Staff';
  clientId?: string;
}

interface Branch {
  id: string;
  name: string;
  manager: string;
  location: string;
  createdAt?: any;
}

interface Booking {
  id: string;
  bookingNumber: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  plateNumber: string;
  carMake: string;
  carModel: string;
  policyNumber?: string;
  createdAt: any;
  status: string;
  insurerName?: string;
  rejectionReason?: string;
  assignedValuerId?: string;
  assignedValuerName?: string;
  assignmentDate?: any;
  logbookImageId?: string;
  branch?: string;
}

interface Valuation {
  id: string;
  bookingId: string;
  assessmentDate: any;
  assessmentValue: string;
  forcedValue: string;
  wsValue: string;
  rsValue: string;
  imageUrls: string[];
  valuedBy: string;
  valuedAt: any;
  status: 'Approved' | 'Rejected' | 'Pending Approval';
  rejectionReason?: string;
  booking?: Booking;
  policyExpiryDate?: any;
  chassisNo?: string;
  colour?: string;
  fuelType?: string;
  engineNo?: string;
  engineRating?: string;
  dateOfReg?: any;
  yearOfManufacture?: string;
  odometerReadings?: string;
  countryOfOrigin?: string;
  numberOfAirbags?: string;
  lightsType?: string;
  transmissionType?: string;
  coachWork?: Record<string, 'Yes' | 'No'>;
  coachWorkNotes?: string;
  mechanicalCondition?: Record<string, 'Yes' | 'No'>;
  mechanicalNotes?: string;
  electricalCondition?: Record<string, 'Yes' | 'No'>;
  electricalNotes?: string;
  antiTheft?: string;
  tyresType?: string;
  tyresCondition?: string;
  extras?: string;
  comments?: string;
}

interface PopulatedValuation extends Valuation {
  logbookImage?: string;
  valuationImages: string[];
}

type ChartDataPoint = {
  day: string;
  Approved: number;
  Rejected: number;
};

const adminValuationSchema = z.object({
  assessmentValue: z.string().min(1, "Assessment value is required."),
  forcedValue: z.string().min(1, "Forced sale value is required."),
  wsValue: z.string().min(1, "WS value is required."),
  rsValue: z.string().min(1, "RS value is required."),
});

type AdminValuationFormValues = z.infer<typeof adminValuationSchema>;


const ConditionChecklist = ({ title, data, notes }: { title: string, data?: Record<string, 'Yes' | 'No'>, notes?: string }) => {
  if (!data) return null;
  const entries = Object.entries(data);
  if (entries.length === 0 && !notes) return null;

  const toSentenceCase = (str: string) => {
    const result = str.replace(/([A-Z])/g, " $1");
    return result.charAt(0).toUpperCase() + result.slice(1);
  };

  return (
    <Card>
      <CardHeader><CardTitle>{title}</CardTitle></CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-2 text-sm">
          {entries.map(([key, value]) => (
            <div key={key} className="flex justify-between items-center py-1 border-b">
              <span className="text-muted-foreground">{toSentenceCase(key)}:</span>
              <span className={`font-medium ${value === 'Yes' ? 'text-red-500' : 'text-green-500'}`}>{value}</span>
            </div>
          ))}
        </div>
        {notes && (
          <div className="mt-4">
            <h4 className="font-medium text-muted-foreground">Notes:</h4>
            <p className="text-sm text-foreground p-3 bg-muted rounded-md border mt-1">{notes}</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
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
  const [allCarsSearchTerm, setAllCarsSearchTerm] = useState("");
  const [chartData, setChartData] = useState<ChartDataPoint[]>([]);

  const [isAssignDialogOpen, setAssignDialogOpen] = useState(false);
  const [isRejectDialogOpen, setRejectDialogOpen] = useState(false);
  const [isCompleteValuationOpen, setCompleteValuationOpen] = useState(false);
  const [rejectionReason, setRejectionReason] = useState("");
  const [selectedBookingForAction, setSelectedBookingForAction] = useState<Booking | null>(null);
  const [selectedValuationForAction, setSelectedValuationForAction] = useState<PopulatedValuation | null>(null);
  const [loadingValuationDetails, setLoadingValuationDetails] = useState(false);
  const [selectedValuerId, setSelectedValuerId] = useState<string>("");
  const [currentUserRole, setCurrentUserRole] = useState<'Super Admin' | 'Admin' | null>(null);

  const [itemsPerPage] = useState(5);
  const [institutionsPage, setInstitutionsPage] = useState(1);
  const [valuersPage, setValuersPage] = useState(1);
  const [staffPage, setStaffPage] = useState(1);
  const [branchesPage, setBranchesPage] = useState(1);
  const [valuationsPage, setValuationsPage] = useState(1);
  const [pendingValuationPage, setPendingValuationPage] = useState(1);
  const [newBookingsPage, setNewBookingsPage] = useState(1);
  const [rejectedBookingsPage, setRejectedBookingsPage] = useState(1);
  const [recentValuationsPage, setRecentValuationsPage] = useState(1);
  const [valuatedBookingsPage, setValuatedBookingsPage] = useState(1);
  const [allCarsPage, setAllCarsPage] = useState(1);

  const handleViewChange = (view: string) => {
    setActiveView(view);
  };

  const adminValuationForm = useForm<AdminValuationFormValues>({
    resolver: zodResolver(adminValuationSchema),
    defaultValues: { assessmentValue: "", forcedValue: "", wsValue: "", rsValue: "" },
  });

  const chartConfig = {
    valuations: { label: "Valuations", color: "hsl(var(--chart-1))" },
    count: { label: "Count", color: "hsl(var(--chart-1))" },
  } as const;

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
    const fetchUserRole = async () => {
      if (user) {
        const staffRef = collection(db, "staff");
        const q = query(staffRef, where("uid", "==", user.uid));
        const querySnapshot = await getDocs(q);

        if (!querySnapshot.empty) {
          const staffData = querySnapshot.docs[0].data() as Staff;
          setCurrentUserRole(staffData.role || 'Admin');
        } else {
          // This could be the root user not in the staff list
          setCurrentUserRole('Super Admin');
        }
      }
    };
    fetchUserRole();
  }, [user]);

  useEffect(() => {
    setLoading(true);
    const subscriptions: (() => void)[] = [];

    // Always subscribe to notifications for pending bookings
    const notifQuery = query(collection(db, "bookings"), where("status", "==", "Pending Approval"), limit(5));
    const notifUnsubscribe = onSnapshot(notifQuery, (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() as Booking }));
      const sortedData = data.sort((a, b) => (b.createdAt?.toMillis() || 0) - (a.createdAt?.toMillis() || 0));
      setPendingBookingsForNotif(sortedData);
    }, (error) => {
      console.error("Error in notification listener:", error);
    });
    subscriptions.push(notifUnsubscribe);

    const subscribeToCollection = (
      collectionName: string,
      setter: React.Dispatch<React.SetStateAction<any[]>>,
      limitCount?: number
    ) => {
      let q = query(collection(db, collectionName), orderBy("createdAt", "desc"));
      if (limitCount) {
        q = query(collection(db, collectionName), orderBy("createdAt", "desc"), limit(limitCount));
      }
      const unsubscribe = onSnapshot(q, (snapshot) => {
        let data;
        if (collectionName === 'insurers') {
          data = snapshot.docs
            .map(doc => ({ id: doc.id, ...doc.data() }))
            .filter(item => (item as any).role !== 'Agent');
        } else {
          data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        }
        setter(data);
        setLoading(false);
      }, (error) => {
        console.error(`Error in ${collectionName} listener:`, error);
        setLoading(false);
      });
      subscriptions.push(unsubscribe);
    };

    // Lazy load based on active view - only load what's needed
    if (activeView === 'dashboard') {
      // Load limited data for dashboard
      const bookingsQuery = query(collection(db, "bookings"), orderBy("createdAt", "desc"), limit(50));
      const bookingsUnsubscribe = onSnapshot(bookingsQuery, (snapshot) => {
        const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Booking[];
        setBookings(data.sort((a, b) => (b.createdAt?.toMillis() || 0) - (a.createdAt?.toMillis() || 0)));
        generateChartData(data);
        setLoading(false);
      }, (error) => {
        console.error("Error in bookings listener:", error);
        setLoading(false);
      });
      subscriptions.push(bookingsUnsubscribe);

      const valuationsQuery = query(collection(db, "valuations"), orderBy("valuedAt", "desc"), limit(20));
      const valUnsubscribe = onSnapshot(valuationsQuery, (snapshot) => {
        const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() as Valuation }));
        setValuations(data);
      });
      subscriptions.push(valUnsubscribe);

      const valuerQuery = query(collection(db, "valuers"), orderBy("createdAt", "desc"), limit(20));
      const valuerUnsubscribe = onSnapshot(valuerQuery, (snapshot) => {
        setValuers(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() as Valuer })));
      });
      subscriptions.push(valuerUnsubscribe);
    } else if (activeView === 'institutions') {
      subscribeToCollection("insurers", setInstitutions);
    } else if (activeView === 'valuers') {
      subscribeToCollection("valuers", setValuers);
    } else if (activeView === 'staff') {
      subscribeToCollection("staff", setStaff);
    } else if (activeView === 'branches') {
      subscribeToCollection("branches", setBranches);
    } else if (activeView === 'new-bookings' || activeView === 'pending-valuation' || activeView === 'valuated-bookings' || activeView === 'rejected-bookings' || activeView === 'all-cars') {
      const bookingsQuery = query(collection(db, "bookings"), orderBy("createdAt", "desc"), limit(100));
      const bookingsUnsubscribe = onSnapshot(bookingsQuery, (snapshot) => {
        const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Booking[];
        setBookings(data.sort((a, b) => (b.createdAt?.toMillis() || 0) - (a.createdAt?.toMillis() || 0)));
        setLoading(false);
      }, (error) => {
        console.error("Error in bookings listener:", error);
        setLoading(false);
      });
      subscriptions.push(bookingsUnsubscribe);
    } else if (activeView === 'valuations') {
      const valuationsQuery = query(collection(db, "valuations"), orderBy("valuedAt", "desc"), limit(100));
      const valUnsubscribe = onSnapshot(valuationsQuery, (snapshot) => {
        const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() as Valuation }));
        setValuations(data);
        setLoading(false);
      }, (error) => {
        console.error("Error in valuations listener:", error);
        setLoading(false);
      });
      subscriptions.push(valUnsubscribe);
    } else if (activeView === 'analytics') {
      // Load all collections for analytics view
      const allCollections = [
        { name: "insurers", setter: setInstitutions },
        { name: "valuers", setter: setValuers },
        { name: "staff", setter: setStaff },
        { name: "branches", setter: setBranches },
        { name: "bookings", setter: setBookings },
        { name: "valuations", setter: setValuations },
      ];
      allCollections.forEach(col => {
        const q = query(collection(db, col.name));
        const unsubscribe = onSnapshot(q, (snapshot) => {
          const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
          col.setter(data);
        }, (error) => console.error(`Error in ${col.name} listener:`, error));
        subscriptions.push(unsubscribe);
      });
      setLoading(false);
    } else {
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

    const userTypeDisplay = userType.charAt(0).toUpperCase() + userType.slice(1);
    const collectionName = userType === 'institution' ? 'insurers' : (userType === 'valuer' ? 'valuers' : 'staff');

    try {
      const signInMethods = await fetchSignInMethodsForEmail(auth, email);

      if (signInMethods.length > 0) {
        // Email already exists in Firebase Auth.
        // We need to find the user's UID without creating a new account.
        // This is a limitation on the client-side. The best approach is to inform the admin.
        // A more advanced solution involves a Cloud Function to manage users.
        toast({
          variant: "destructive",
          title: `Email Already in Use`,
          description: `The email ${email} is already registered. Please use a different email or manage the existing user.`,
        });
        return;
      }

      // Email does not exist, proceed with creating a new user
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const newUser = userCredential.user;

      const data: any = {
        name,
        username,
        email,
        phone,
        active: isControlActive,
        createdAt: serverTimestamp(),
        uid: newUser.uid,
      };

      if (userType === 'staff') {
        data.role = 'Staff';
        data.isAdmin = false;
      }

      await addDoc(collection(db, collectionName), data);

      toast({ title: `${userTypeDisplay} Added`, description: `${name} has been successfully added.` });

      // Close the correct dialog
      if (userType === 'institution') setAddInstitutionOpen(false);
      if (userType === 'valuer') setAddValuerOpen(false);
      if (userType === 'staff') setAddStaffOpen(false);

      form.reset();
      setControlActive(true);
      setShowPassword(false);

    } catch (error: any) {
      console.error(`Error adding ${userType}:`, error);
      const errorMessage = error.code === 'auth/email-already-in-use'
        ? "This email is already registered."
        : `An error occurred while adding the ${userType}.`;
      toast({
        variant: "destructive",
        title: `Failed to Add ${userTypeDisplay}`,
        description: errorMessage,
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
        createdAt: serverTimestamp()
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
      toast({ title: "Status Updated", description: `Status for ${name} has been updated.` });
    } catch (error) {
      console.error("Error updating status: ", error);
      toast({ variant: "destructive", title: "Update Failed", description: "Could not update status." });
    }
  };

  const handleDeleteUser = async (id: string, name: string, collectionName: string) => {
    // Note: This does not delete the user from Firebase Auth, only Firestore.
    // Deleting from Auth should be a separate, more deliberate action.
    const docRef = doc(db, collectionName, id);
    try {
      await deleteDoc(docRef);
      let userTypeDisplay = 'User';
      if (collectionName === 'insurers') userTypeDisplay = 'Institution';
      if (collectionName === 'valuer') userTypeDisplay = 'Valuer';
      if (collectionName === 'staff') userTypeDisplay = 'Staff';
      toast({ title: `${userTypeDisplay} Deleted`, description: `${name} has been successfully deleted.` });
    } catch (error) {
      console.error("Error deleting user: ", error);
      toast({ variant: "destructive", title: "Deletion Failed", description: "Could not delete user." });
    }
  };

  const handleRoleChange = async (staffMember: Staff, newRole: 'Admin' | 'Staff') => {
    if (currentUserRole !== 'Super Admin') {
      toast({ variant: "destructive", title: "Permission Denied", description: "Only Super Admins can change roles." });
      return;
    }
    const staffDocRef = doc(db, "staff", staffMember.id);
    try {
      await updateDoc(staffDocRef, {
        role: newRole,
        isAdmin: newRole === 'Admin'
      });
      toast({
        title: "Role Updated",
        description: `${staffMember.name}'s role has been changed to ${newRole}.`,
      });
    } catch (error) {
      console.error("Error updating role:", error);
      toast({
        variant: "destructive",
        title: "Update Failed",
        description: "Could not update the user's role.",
      });
    }
  };

  const handleOpenReportInNewTab = (reportType: 'booking' | 'valuation', bookingId: string) => {
    const url = reportType === 'booking'
      ? `/client/booking-report?id=${bookingId}`
      : `/admin/valuation-report?id=${bookingId}`;
    window.open(url, '_blank');
  };

  const handleAssignmentAndApproval = async () => {
    if (!selectedBookingForAction || !selectedValuerId) {
      toast({ variant: "destructive", title: "Validation Error", description: "A valuer must be selected." });
      return;
    }

    const selectedValuer = valuers.find(v => v.id === selectedValuerId);
    if (!selectedValuer) {
      toast({ variant: "destructive", title: "Validation Error", description: "Selected valuer not found." });
      return;
    }

    const todaysAssignments = bookings.filter(b =>
      b.assignedValuerId === selectedValuer.username &&
      b.assignmentDate &&
      isToday(b.assignmentDate.toDate())
    ).length;

    if (todaysAssignments >= 5) {
      toast({ variant: "destructive", title: "Assignment Limit Reached", description: `${selectedValuer.name} already has 5 bookings assigned for today.` });
      return;
    }

    const bookingDocRef = doc(db, "bookings", selectedBookingForAction.id);
    try {
      await updateDoc(bookingDocRef, {
        status: "Pending Valuation",
        assignedValuerId: selectedValuer.username,
        assignedValuerName: selectedValuer.name,
        assignmentDate: serverTimestamp()
      });
      toast({ title: "Booking Approved & Assigned", description: `Booking #${selectedBookingForAction.bookingNumber} assigned to ${selectedValuer.name}.` });
      setAssignDialogOpen(false);
      setSelectedBookingForAction(null);
      setSelectedValuerId("");
    } catch (error) {
      console.error("Error approving booking: ", error);
      toast({ variant: "destructive", title: "Approval Failed", description: "Could not approve and assign booking." });
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
      setRejectDialogOpen(false);
      setAssignDialogOpen(false);
      setSelectedBookingForAction(null);
    } catch (error) {
      console.error("Error rejecting booking: ", error);
      toast({ variant: "destructive", title: "Rejection Failed", description: "Could not reject booking." });
    }
  };

  const handleCompleteValuation = async (data: AdminValuationFormValues) => {
    if (!selectedBookingForAction) return;

    try {
      const q = query(collection(db, "valuations"), where("bookingId", "==", selectedBookingForAction.id));
      const valuationSnapshot = await getDocs(q);

      if (valuationSnapshot.empty) {
        toast({ variant: "destructive", title: "Error", description: "No initial valuation found for this booking." });
        return;
      }

      const valuationDoc = valuationSnapshot.docs[0];
      const valuationRef = doc(db, "valuations", valuationDoc.id);

      await updateDoc(valuationRef, {
        ...data,
        assessmentDate: serverTimestamp(),
        status: "Approved",
      });

      const bookingRef = doc(db, "bookings", selectedBookingForAction.id);
      await updateDoc(bookingRef, {
        status: "Completed",
      });

      toast({ title: "Valuation Completed", description: "The valuation has been finalized." });
      setCompleteValuationOpen(false);
      setSelectedBookingForAction(null);
      setSelectedValuationForAction(null);
      adminValuationForm.reset();

    } catch (error) {
      console.error("Error completing valuation:", error);
      toast({ variant: "destructive", title: "Error", description: "Failed to complete valuation." });
    }
  };

  const openAssignDialog = (booking: Booking) => {
    setSelectedBookingForAction(booking);
    setAssignDialogOpen(true);
  };

  const openRejectDialog = () => {
    setAssignDialogOpen(false);
    setRejectDialogOpen(true);
  }

  const openCompleteValuationDialog = async (booking: Booking) => {
    setSelectedBookingForAction(booking);
    setCompleteValuationOpen(true);
    setLoadingValuationDetails(true);
    try {
      const q = query(collection(db, "valuations"), where("bookingId", "==", booking.id), limit(1));
      const valuationSnapshot = await getDocs(q);

      if (valuationSnapshot.empty) {
        toast({ variant: "destructive", title: "Error", description: "Could not find the valuation report." });
        setSelectedValuationForAction(null);
        return;
      }

      const valuationDoc = valuationSnapshot.docs[0];
      const valuationData = { id: valuationDoc.id, ...valuationDoc.data() } as Valuation;

      let logbookImage: string | undefined = undefined;
      if (booking.logbookImageId) {
        const logbookDoc = await getDoc(doc(db, "uploads", booking.logbookImageId));
        if (logbookDoc.exists()) {
          logbookImage = logbookDoc.data().imageData;
        }
      }

      let valuationImages: string[] = [];
      if (valuationData.imageUrls && valuationData.imageUrls.length > 0) {
        const imageDocsQuery = query(collection(db, "uploads"), where("__name__", "in", valuationData.imageUrls));
        const imageDocsSnapshot = await getDocs(imageDocsQuery);
        valuationImages = imageDocsSnapshot.docs.map(d => d.data().imageData);
      }

      setSelectedValuationForAction({
        ...valuationData,
        logbookImage,
        valuationImages,
      });

    } catch (error) {
      console.error("Error fetching valuation details:", error);
      toast({ variant: "destructive", title: "Error", description: "Failed to fetch valuation details." });
    } finally {
      setLoadingValuationDetails(false);
    }
  };

  const getStatusVariant = (status: string): "default" | "secondary" | "destructive" | "outline" => {
    switch (status) {
      case "Pending": return "secondary";
      case "Pending Valuation": return "outline";
      case "Pending Approval": return "outline";
      case "Valuated": return "secondary";
      case "Completed":
      case "Approved": return "default";
      case "Rejected": return "destructive";
      default: return "outline";
    }
  };

  const stats = {
    totalCars: bookings.length,
    totalValuations: valuations.length,
    totalInstitutions: institutions.length,
    totalValuers: valuers.length,
    totalStaff: staff.length,
    approved: bookings.filter(b => b.status === 'Completed').length,
    rejected: bookings.filter(b => b.status === 'Rejected').length,
    pendingApproval: bookings.filter(b => b.status === 'Pending Approval').length,
    pendingValuation: bookings.filter(b => b.status === 'Pending Valuation').length,
    valuated: bookings.filter(b => b.status === 'Valuated').length,
  };

  const recentValuations = valuations.map(v => ({
    ...v,
    booking: bookings.find(b => b.id === v.bookingId),
  })).filter(v => v.booking?.status === 'Completed');

  const analyticsData = useMemo(() => {
    const makeCounts = bookings.reduce((acc, booking) => {
      acc[booking.carMake] = (acc[booking.carMake] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    const popularMakes = Object.entries(makeCounts)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    const valuerData = bookings.reduce((acc, booking) => {
      if (booking.assignedValuerName) {
        acc[booking.assignedValuerName] = (acc[booking.assignedValuerName] || 0) + 1;
      }
      return acc;
    }, {} as Record<string, number>);
    const topValuers = Object.entries(valuerData)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count);

    return { popularMakes, topValuers };
  }, [bookings]);

  const StatCard = ({ title, value, icon, onClick, progress, colorClass }: { title: string, value: number | string, icon: React.ReactNode, onClick?: () => void, progress?: number, colorClass?: string }) => (
    <Card onClick={onClick} className={`${onClick ? 'cursor-pointer hover:bg-muted' : ''} transition-colors p-4 flex flex-col justify-between`}>
      <div className="flex items-start justify-between">
        <div className={`w-12 h-12 rounded-full flex items-center justify-center bg-muted`}>
          {icon}
        </div>
        <div className="text-3xl font-bold">{loading ? <Skeleton className="h-9 w-12" /> : value}</div>
      </div>
      <div className="mt-4">
        <p className="text-sm font-medium text-muted-foreground">{title}</p>
        {progress !== undefined && colorClass && (
          <Progress value={progress} className="h-1 mt-1" indicatorClassName={colorClass} />
        )}
      </div>
    </Card>
  );

  const renderUserTable = (
    data: (Institution | Valuer | Staff)[],
    title: string,
    description: string,
    onAdd: () => void,
    userType: 'institution' | 'valuer' | 'staff',
    currentPage: number,
    setCurrentPage: (page: number) => void
  ) => {
    const totalPages = Math.ceil(data.length / itemsPerPage);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const paginatedData = data.slice(startIndex, startIndex + itemsPerPage);

    return (
      <Card className="shadow-lg border-primary/20">
        <CardHeader className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <CardTitle className="font-headline text-3xl text-primary">{title}</CardTitle>
            <CardDescription>{description}</CardDescription>
          </div>
          {(userType !== 'staff' || currentUserRole === 'Super Admin') && (
            <Button onClick={onAdd}>
              <PlusCircle className="mr-2" />
              Register New {userType === 'institution' ? 'Institution' : (userType.charAt(0).toUpperCase() + userType.slice(1))}
            </Button>
          )}
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/50">
                <TableHead className="font-semibold w-[50px]">No.</TableHead>
                <TableHead className="font-semibold text-left">Name</TableHead>
                <TableHead className="hidden sm:table-cell font-semibold text-left">Username</TableHead>
                <TableHead className="hidden sm:table-cell font-semibold text-left">Email</TableHead>
                <TableHead className="hidden md:table-cell font-semibold text-left">Phone</TableHead>
                {userType === 'staff' && <TableHead className="font-semibold text-center">Role</TableHead>}
                <TableHead className="font-semibold text-center">Status</TableHead>
                <TableHead className="text-right font-semibold">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedData.map((item, index) => (
                <TableRow key={item.id}>
                  <TableCell>{startIndex + index + 1}</TableCell>
                  <TableCell className="font-medium flex items-center gap-3">
                    <div className="p-2 bg-muted rounded-full hidden sm:flex">
                      <User className="h-5 w-5 text-primary" />
                    </div>
                    {item.name}
                  </TableCell>
                  <TableCell className="hidden sm:table-cell">{item.username}</TableCell>
                  <TableCell className="hidden sm:table-cell">{item.email}</TableCell>
                  <TableCell className="hidden md:table-cell">{item.phone}</TableCell>
                  {userType === 'staff' && (
                    <TableCell className="text-center">
                      <Badge variant={(item as Staff).role === 'Admin' ? 'default' : ((item as Staff).role === 'Super Admin' ? 'destructive' : 'secondary')}>
                        {(item as Staff).role || 'Staff'}
                      </Badge>
                    </TableCell>
                  )}
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
                        disabled={currentUserRole !== 'Super Admin'}
                        aria-label={`Toggle status for ${item.name}`}
                      />
                    </div>
                  </TableCell>
                  <TableCell className="text-right space-x-2">
                    {userType === 'staff' && currentUserRole === 'Super Admin' && (
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="outline" size="sm">
                            <ShieldQuestion className="mr-2 h-4 w-4" />
                            Change Role
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent>
                          <DropdownMenuItem onClick={() => handleRoleChange(item as Staff, 'Admin')} disabled={(item as Staff).role === 'Admin'}>
                            Promote to Admin
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleRoleChange(item as Staff, 'Staff')} disabled={(item as Staff).role === 'Staff'}>
                            Demote to Staff
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    )}
                    {currentUserRole === 'Super Admin' && (
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
                              This action cannot be undone. This will permanently delete the user {item.name} from Firestore, but not from Firebase Authentication.
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
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          <div className="flex justify-end items-center gap-2 mt-4">
            <Button variant="outline" size="sm" onClick={() => setCurrentPage(currentPage - 1)} disabled={currentPage === 1}>
              <ChevronLeft className="h-4 w-4" />
              Previous
            </Button>
            <span className="text-sm">Page {currentPage} of {totalPages}</span>
            <Button variant="outline" size="sm" onClick={() => setCurrentPage(currentPage + 1)} disabled={currentPage === totalPages}>
              Next
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  };

  const renderUserDialog = (
    isOpen: boolean,
    onOpenChange: (open: boolean) => void,
    userType: 'institution' | 'valuer' | 'staff'
  ) => {
    const userTypeDisplay = userType === 'institution' ? 'Institution' : userType.charAt(0).toUpperCase() + userType.slice(1);
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
    description: string,
    currentPage: number,
    setCurrentPage: (page: number) => void
  ) => {
    const totalPages = Math.ceil(valuationsData.length / itemsPerPage);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const paginatedData = valuationsData.slice(startIndex, startIndex + itemsPerPage);

    return (
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
                <TableHead className="font-semibold w-[50px]">No.</TableHead>
                <TableHead className="font-semibold">Booking ID</TableHead>
                <TableHead className="font-semibold hidden md:table-cell">Customer</TableHead>
                <TableHead className="font-semibold hidden sm:table-cell">Vehicle</TableHead>
                <TableHead className="font-semibold hidden lg:table-cell">Institution</TableHead>
                <TableHead className="font-semibold text-left">Status</TableHead>
                <TableHead className="font-semibold hidden xl:table-cell">Assessment Value (KES)</TableHead>
                <TableHead className="font-semibold hidden xl:table-cell">Forced Value (KES)</TableHead>
                <TableHead className="text-right font-semibold">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                Array.from({ length: itemsPerPage }).map((_, index) => (
                  <TableRow key={index}>
                    <TableCell><Skeleton className="h-5 w-8" /></TableCell>
                    <TableCell><Skeleton className="h-5 w-24" /></TableCell>
                    <TableCell className="hidden md:table-cell"><Skeleton className="h-5 w-32" /></TableCell>
                    <TableCell className="hidden sm:table-cell"><Skeleton className="h-5 w-28" /></TableCell>
                    <TableCell className="hidden lg:table-cell"><Skeleton className="h-5 w-32" /></TableCell>
                    <TableCell><Skeleton className="h-6 w-20" /></TableCell>
                    <TableCell className="hidden xl:table-cell"><Skeleton className="h-5 w-24" /></TableCell>
                    <TableCell className="hidden xl:table-cell"><Skeleton className="h-5 w-24" /></TableCell>
                    <TableCell className="text-right"><Skeleton className="h-8 w-28 ml-auto" /></TableCell>
                  </TableRow>
                ))
              ) : paginatedData.length > 0 ? (
                paginatedData.map((valuation, index) => {
                  const booking = bookings.find(b => b.id === valuation.bookingId);
                  const isCompleted = booking?.status === 'Completed';
                  return (
                    <TableRow key={valuation.id}>
                      <TableCell>{startIndex + index + 1}</TableCell>
                      <TableCell className="font-mono text-xs truncate">{booking?.bookingNumber}</TableCell>
                      <TableCell className="font-medium hidden md:table-cell">{booking?.customerName}</TableCell>
                      <TableCell className="hidden sm:table-cell">{`${booking?.carMake} ${booking?.carModel}`}</TableCell>
                      <TableCell className="hidden lg:table-cell">{booking?.insurerName}</TableCell>
                      <TableCell>
                        <Badge variant={getStatusVariant(booking?.status || 'Unknown')}>{booking?.status}</Badge>
                      </TableCell>
                      <TableCell className="font-mono hidden xl:table-cell">
                        {isCompleted ? valuation.assessmentValue : ''}
                      </TableCell>
                      <TableCell className="font-mono hidden xl:table-cell">
                        {isCompleted ? valuation.forcedValue : ''}
                      </TableCell>
                      <TableCell className="text-right">
                        <Popover>
                          <PopoverTrigger asChild>
                            <Button variant="default" size="sm">
                              <FileDown className="mr-2 h-4 w-4" />
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
                                <FileDown className="mr-2 h-4 w-4" />
                                Booking Report
                              </Button>
                              {isCompleted && (
                                <Button
                                  variant="ghost"
                                  className="justify-start"
                                  onClick={() => handleOpenReportInNewTab('valuation', valuation.bookingId)}
                                >
                                  <FileDown className="mr-2 h-4 w-4" />
                                  Valuation Report
                                </Button>
                              )}
                            </div>
                          </PopoverContent>
                        </Popover>
                      </TableCell>
                    </TableRow>
                  )
                })
              ) : (
                <TableRow>
                  <TableCell colSpan={9} className="text-center h-24">
                    No valuations found.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
          <div className="flex justify-end items-center gap-2 mt-4">
            <Button variant="outline" size="sm" onClick={() => setCurrentPage(currentPage - 1)} disabled={currentPage === 1}>
              <ChevronLeft className="h-4 w-4" />
              Previous
            </Button>
            <span className="text-sm">Page {currentPage} of {totalPages}</span>
            <Button variant="outline" size="sm" onClick={() => setCurrentPage(currentPage + 1)} disabled={currentPage === totalPages}>
              Next
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  };

  const renderNewBookingsTable = (
    bookingsData: Booking[],
    title: string,
    description: string,
    currentPage: number,
    setCurrentPage: (page: number) => void
  ) => {
    const totalPages = Math.ceil(bookingsData.length / itemsPerPage);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const paginatedData = bookingsData.slice(startIndex, startIndex + itemsPerPage);

    return (
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
                <TableHead className="font-semibold w-[50px]">No.</TableHead>
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
                Array.from({ length: itemsPerPage }).map((_, index) => (
                  <TableRow key={index}>
                    <TableCell><Skeleton className="h-5 w-8" /></TableCell>
                    <TableCell><Skeleton className="h-5 w-24" /></TableCell>
                    <TableCell className="hidden md:table-cell"><Skeleton className="h-5 w-32" /></TableCell>
                    <TableCell className="hidden lg:table-cell"><Skeleton className="h-5 w-32" /></TableCell>
                    <TableCell className="hidden sm:table-cell"><Skeleton className="h-5 w-28" /></TableCell>
                    <TableCell className="hidden md:table-cell"><Skeleton className="h-5 w-24" /></TableCell>
                    <TableCell><Skeleton className="h-6 w-20" /></TableCell>
                    <TableCell className="text-right"><Skeleton className="h-8 w-28 ml-auto" /></TableCell>
                  </TableRow>
                ))
              ) : paginatedData.length > 0 ? (
                paginatedData.map((booking, index) => (
                  <TableRow key={booking.id}>
                    <TableCell>{startIndex + index + 1}</TableCell>
                    <TableCell className="font-mono text-xs truncate">{booking?.bookingNumber}</TableCell>
                    <TableCell className="font-medium hidden md:table-cell">{booking?.customerName}</TableCell>
                    <TableCell className="hidden lg:table-cell">{booking?.insurerName}</TableCell>
                    <TableCell className="hidden sm:table-cell">{booking?.carMake}</TableCell>
                    <TableCell className="font-mono hidden md:table-cell">{booking?.plateNumber}</TableCell>
                    <TableCell>
                      <Badge variant={getStatusVariant(booking.status)}>{booking.status}</Badge>
                    </TableCell>
                    <TableCell className="text-right space-x-2">
                      <Button variant="outline" size="sm" onClick={() => openAssignDialog(booking)}>
                        <FileSearch className="mr-2 h-4 w-4" />
                        Assign &amp; Approve
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={8} className="text-center h-24">
                    No new bookings found.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
          <div className="flex justify-end items-center gap-2 mt-4">
            <Button variant="outline" size="sm" onClick={() => setCurrentPage(currentPage - 1)} disabled={currentPage === 1}>
              <ChevronLeft className="h-4 w-4" />
              Previous
            </Button>
            <span className="text-sm">Page {currentPage} of {totalPages}</span>
            <Button variant="outline" size="sm" onClick={() => setCurrentPage(currentPage + 1)} disabled={currentPage === totalPages}>
              Next
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  };

  const renderPendingValuationTable = (
    bookingsData: Booking[],
    title: string,
    description: string,
    currentPage: number,
    setCurrentPage: (page: number) => void
  ) => {
    const totalPages = Math.ceil(bookingsData.length / itemsPerPage);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const paginatedData = bookingsData.slice(startIndex, startIndex + itemsPerPage);

    return (
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
                <TableHead className="font-semibold w-[50px]">No.</TableHead>
                <TableHead className="font-semibold">Booking No.</TableHead>
                <TableHead className="font-semibold hidden md:table-cell">Customer</TableHead>
                <TableHead className="font-semibold hidden lg:table-cell">Client</TableHead>
                <TableHead className="font-semibold hidden sm:table-cell">Vehicle</TableHead>
                <TableHead className="font-semibold text-left">Assigned To</TableHead>
                <TableHead className="font-semibold text-left">Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                Array.from({ length: itemsPerPage }).map((_, index) => (
                  <TableRow key={index}>
                    <TableCell><Skeleton className="h-5 w-8" /></TableCell>
                    <TableCell><Skeleton className="h-5 w-24" /></TableCell>
                    <TableCell className="hidden md:table-cell"><Skeleton className="h-5 w-32" /></TableCell>
                    <TableCell className="hidden lg:table-cell"><Skeleton className="h-5 w-32" /></TableCell>
                    <TableCell className="hidden sm:table-cell"><Skeleton className="h-5 w-28" /></TableCell>
                    <TableCell><Skeleton className="h-5 w-32" /></TableCell>
                    <TableCell><Skeleton className="h-6 w-24" /></TableCell>
                  </TableRow>
                ))
              ) : paginatedData.length > 0 ? (
                paginatedData.map((booking, index) => (
                  <TableRow key={booking.id}>
                    <TableCell>{startIndex + index + 1}</TableCell>
                    <TableCell className="font-mono text-xs truncate">{booking?.bookingNumber}</TableCell>
                    <TableCell className="font-medium hidden md:table-cell">{booking?.customerName}</TableCell>
                    <TableCell className="hidden lg:table-cell">{booking?.insurerName}</TableCell>
                    <TableCell className="hidden sm:table-cell">{booking?.carMake}</TableCell>
                    <TableCell>
                      <Badge variant="secondary">{booking.assignedValuerName}</Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant={getStatusVariant(booking.status)}>{booking.status}</Badge>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={7} className="text-center h-24">
                    No bookings pending valuation.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
          <div className="flex justify-end items-center gap-2 mt-4">
            <Button variant="outline" size="sm" onClick={() => setCurrentPage(currentPage - 1)} disabled={currentPage === 1}>
              <ChevronLeft className="h-4 w-4" />
              Previous
            </Button>
            <span className="text-sm">Page {currentPage} of {totalPages}</span>
            <Button variant="outline" size="sm" onClick={() => setCurrentPage(currentPage + 1)} disabled={currentPage === totalPages}>
              Next
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  };

  const renderValuatedTable = (
    bookingsData: Booking[],
    title: string,
    description: string,
    currentPage: number,
    setCurrentPage: (page: number) => void
  ) => {
    const totalPages = Math.ceil(bookingsData.length / itemsPerPage);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const paginatedData = bookingsData.slice(startIndex, startIndex + itemsPerPage);

    return (
      <Card className="shadow-lg border-primary/20">
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle className="font-headline text-3xl text-primary">{title}</CardTitle>
              <CardDescription>{description}</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/50">
                <TableHead className="font-semibold w-[50px]">No.</TableHead>
                <TableHead className="font-semibold">Booking No.</TableHead>
                <TableHead className="font-semibold hidden sm:table-cell">Valued By</TableHead>
                <TableHead className="font-semibold text-left">Status</TableHead>
                <TableHead className="text-right font-semibold">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                Array.from({ length: itemsPerPage }).map((_, index) => (
                  <TableRow key={index}>
                    <TableCell><Skeleton className="h-5 w-8" /></TableCell>
                    <TableCell><Skeleton className="h-5 w-24" /></TableCell>
                    <TableCell className="hidden sm:table-cell"><Skeleton className="h-5 w-32" /></TableCell>
                    <TableCell><Skeleton className="h-6 w-24" /></TableCell>
                    <TableCell className="text-right"><Skeleton className="h-8 w-40 ml-auto" /></TableCell>
                  </TableRow>
                ))
              ) : paginatedData.length > 0 ? (
                paginatedData.map((booking, index) => (
                  <TableRow key={booking.id}>
                    <TableCell>{startIndex + index + 1}</TableCell>
                    <TableCell className="font-mono text-xs truncate">{booking?.bookingNumber}</TableCell>
                    <TableCell className="hidden sm:table-cell">
                      <Badge variant="secondary">{booking.assignedValuerName}</Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant={getStatusVariant(booking.status)}>{booking.status}</Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button variant="default" size="sm" onClick={() => openCompleteValuationDialog(booking)}>
                        <Edit className="mr-2 h-4 w-4" />
                        Complete Valuation
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={5} className="text-center h-24">
                    No bookings to complete.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
          <div className="flex justify-end items-center gap-2 mt-4">
            <Button variant="outline" size="sm" onClick={() => setCurrentPage(currentPage - 1)} disabled={currentPage === 1}>
              <ChevronLeft className="h-4 w-4" />
              Previous
            </Button>
            <span className="text-sm">Page {currentPage} of {totalPages}</span>
            <Button variant="outline" size="sm" onClick={() => setCurrentPage(currentPage + 1)} disabled={currentPage === totalPages}>
              Next
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  };

  const renderRejectedBookingsTable = (
    bookingsData: Booking[],
    title: string,
    description: string,
    currentPage: number,
    setCurrentPage: (page: number) => void
  ) => {
    const totalPages = Math.ceil(bookingsData.length / itemsPerPage);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const paginatedData = bookingsData.slice(startIndex, startIndex + itemsPerPage);

    return (
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
                <TableHead className="font-semibold w-[50px]">No.</TableHead>
                <TableHead className="font-semibold">Booking No.</TableHead>
                <TableHead className="font-semibold hidden md:table-cell">Customer</TableHead>
                <TableHead className="font-semibold hidden lg:table-cell">Client</TableHead>
                <TableHead className="font-semibold hidden sm:table-cell">Vehicle</TableHead>
                <TableHead className="font-semibold hidden md:table-cell">Rejection Reason</TableHead>
                <TableHead className="text-right font-semibold">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                Array.from({ length: itemsPerPage }).map((_, index) => (
                  <TableRow key={index}>
                    <TableCell><Skeleton className="h-5 w-8" /></TableCell>
                    <TableCell><Skeleton className="h-5 w-24" /></TableCell>
                    <TableCell className="hidden md:table-cell"><Skeleton className="h-5 w-32" /></TableCell>
                    <TableCell className="hidden lg:table-cell"><Skeleton className="h-5 w-32" /></TableCell>
                    <TableCell className="hidden sm:table-cell"><Skeleton className="h-5 w-28" /></TableCell>
                    <TableCell className="hidden md:table-cell"><Skeleton className="h-5 w-48" /></TableCell>
                    <TableCell className="text-right"><Skeleton className="h-8 w-28 ml-auto" /></TableCell>
                  </TableRow>
                ))
              ) : paginatedData.length > 0 ? (
                paginatedData.map((booking, index) => (
                  <TableRow key={booking.id}>
                    <TableCell>{startIndex + index + 1}</TableCell>
                    <TableCell className="font-mono text-xs truncate">{booking?.bookingNumber}</TableCell>
                    <TableCell className="font-medium hidden md:table-cell">{booking?.customerName}</TableCell>
                    <TableCell className="hidden lg:table-cell">{booking?.insurerName}</TableCell>
                    <TableCell className="hidden sm:table-cell">{booking?.carMake}</TableCell>
                    <TableCell className="hidden md:table-cell text-sm text-muted-foreground truncate max-w-xs">{booking?.rejectionReason}</TableCell>
                    <TableCell className="text-right space-x-2">
                      <Button variant="default" size="sm" onClick={() => handleOpenReportInNewTab('booking', booking.id)}>
                        <FileDown className="mr-2 h-4 w-4" />
                        View Report
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={7} className="text-center h-24">
                    No rejected bookings found.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
          <div className="flex justify-end items-center gap-2 mt-4">
            <Button variant="outline" size="sm" onClick={() => setCurrentPage(currentPage - 1)} disabled={currentPage === 1}>
              <ChevronLeft className="h-4 w-4" />
              Previous
            </Button>
            <span className="text-sm">Page {currentPage} of {totalPages}</span>
            <Button variant="outline" size="sm" onClick={() => setCurrentPage(currentPage + 1)} disabled={currentPage === totalPages}>
              Next
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  };

  const allBookings = useMemo(() => {
    return bookings
      .filter(b => {
        if (b.status === 'Rejected') {
          return false;
        }
        const searchTerm = allCarsSearchTerm.toLowerCase();
        return (
          b.plateNumber.toLowerCase().includes(searchTerm) ||
          b.bookingNumber.toLowerCase().includes(searchTerm) ||
          b.customerName.toLowerCase().includes(searchTerm)
        )
      })
      .sort((a, b) => {
        if (a.status === 'Completed' && b.status !== 'Completed') return -1;
        if (a.status !== 'Completed' && b.status === 'Completed') return 1;
        return (b.createdAt?.toMillis() || 0) - (a.createdAt?.toMillis() || 0)
      });
  }, [bookings, allCarsSearchTerm]);

  const allBookingsPaginated = allBookings.slice(
    (allCarsPage - 1) * itemsPerPage,
    allCarsPage * itemsPerPage
  );
  const totalAllBookingsPages = Math.ceil(allBookings.length / itemsPerPage);

  const adminStaff = useMemo(() => {
    return staff.filter(s => !s.clientId);
  }, [staff]);

  const handleActiveViewChange = (view: string) => {
    setLoading(true);
    setActiveView(view);
  };

  const sidebarMenuItems = useMemo(() => {
    const baseItems = [
      { name: "Dashboard", view: 'dashboard', icon: <LayoutDashboard /> },
      { name: "Institutions", view: 'institutions', icon: <Building /> }
    ];

    const analyticsItem = { name: "Analytics", view: 'analytics', icon: <TrendingUp /> };

    if (currentUserRole === 'Super Admin') {
      return [
        ...baseItems,
        analyticsItem,
        { name: "Our Staff", view: 'staff', icon: <Briefcase /> },
        { name: "Valuers", view: 'valuers', icon: <UserCog /> }
      ];
    }

    return [...baseItems, analyticsItem];
  }, [currentUserRole]);

  const PIE_CHART_COLORS = ['#0A2A66', '#002B5C', '#E6A400', '#C32828', '#8A9A5B', '#5A4FCF'];

  if (loading) {
    return <Loading />;
  }


  return (
    <SidebarProvider>
      <Sidebar variant="inset" side="left">
        <SidebarHeader>
          <div className="flex items-center gap-2 p-2">
            <div className="bg-sidebar-primary text-sidebar-primary-foreground rounded-lg p-2 flex items-center justify-center w-10 h-10 overflow-hidden">
              <Image
                src="/logo.jpeg"
                alt="Sonic Motor Valuers"
                width={32}
                height={32}
                className="object-contain"
              />
            </div>
            <h2 className="text-lg font-semibold text-sidebar-primary">Admin Panel</h2>
          </div>
        </SidebarHeader>
        <SidebarContent>
          <SidebarMenu>
            {sidebarMenuItems.map(item => (
              <SidebarMenuItem key={item.view}>
                <SidebarMenuButton onClick={() => handleActiveViewChange(item.view)} isActive={activeView === item.view} tooltip={item.name}>
                  {item.icon}
                  {item.name}
                </SidebarMenuButton>
              </SidebarMenuItem>
            ))}
          </SidebarMenu>
        </SidebarContent>
        <SidebarFooter>
          <InstallPwaButton />
        </SidebarFooter>
      </Sidebar>

      <SidebarInset>
        <header className="sticky top-0 z-40 w-full border-b bg-secondary shadow-sm">
          <div className="container flex h-16 items-center justify-between">
            <div className="flex items-center gap-4">
              <SidebarTrigger className="text-white hover:text-white/80" />
              <div className="h-10 w-40 relative">
                <Image
                  src="/logo.jpeg"
                  alt="Sonic Motor Valuers Logo"
                  fill
                  className="object-contain"
                  priority
                />
              </div>
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
                        <div key={booking.id} className="p-2 hover:bg-muted rounded-md text-sm cursor-pointer" onClick={() => openAssignDialog(booking)}>
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
                      <p className="text-sm font-medium leading-none">{currentUserRole || 'Admin'}</p>
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
                <p className="text-muted-foreground mt-2">This is your secure control panel for Sonic Motor Valuers.</p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <StatCard
                  title="Pending Approval"
                  value={stats.pendingApproval}
                  icon={<FileSignature className="h-6 w-6 text-yellow-500" />}
                  onClick={() => handleActiveViewChange('new-bookings')}
                  progress={stats.totalCars > 0 ? (stats.pendingApproval / stats.totalCars) * 100 : 0}
                  colorClass="bg-yellow-500"
                />
                <StatCard
                  title="Pending Valuation"
                  value={stats.pendingValuation}
                  icon={<FileClock className="h-6 w-6 text-orange-500" />}
                  onClick={() => handleActiveViewChange('pending-valuation')}
                  progress={stats.totalCars > 0 ? (stats.pendingValuation / stats.totalCars) * 100 : 0}
                  colorClass="bg-orange-500"
                />
                <StatCard
                  title="Valuated"
                  value={stats.valuated}
                  icon={<FileCheck className="h-6 w-6 text-blue-500" />}
                  onClick={() => handleActiveViewChange('valuated-bookings')}
                  progress={stats.totalCars > 0 ? (stats.valuated / stats.totalCars) * 100 : 0}
                  colorClass="bg-blue-500"
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <StatCard
                  title="Approved"
                  value={stats.approved}
                  icon={<CheckCircle className="h-6 w-6 text-green-500" />}
                  onClick={() => handleActiveViewChange('valuations')}
                  progress={stats.totalCars > 0 ? (stats.approved / stats.totalCars) * 100 : 0}
                  colorClass="bg-green-500"
                />
                <StatCard
                  title="Rejected"
                  value={stats.rejected}
                  icon={<XCircle className="h-6 w-6 text-red-500" />}
                  onClick={() => handleActiveViewChange('rejected-bookings')}
                  progress={stats.totalCars > 0 ? (stats.rejected / stats.totalCars) * 100 : 0}
                  colorClass="bg-red-500"
                />
                <StatCard
                  title="All Cars"
                  value={stats.totalCars}
                  icon={<Car className="h-6 w-6 text-purple-500" />}
                  onClick={() => handleActiveViewChange('all-cars')}
                  progress={100}
                  colorClass="bg-purple-500"
                />
              </div>

              <Card>
                <CardHeader>
                  <div className="flex justify-between items-center">
                    <div>
                      <CardTitle>All Completed Cars</CardTitle>
                      <CardDescription>A summary of all vehicles that have been completely valued.</CardDescription>
                    </div>
                    <div className="relative w-full max-w-sm">
                      <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                      <Input
                        type="search"
                        placeholder="Search by plate, booking ID, customer..."
                        className="w-full rounded-lg bg-background pl-8"
                        value={allCarsSearchTerm}
                        onChange={(e) => setAllCarsSearchTerm(e.target.value)}
                      />
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>No.</TableHead>
                        <TableHead>Plate Number</TableHead>
                        <TableHead>Booking ID</TableHead>
                        <TableHead>Make and Model</TableHead>
                        <TableHead>Customer</TableHead>
                        <TableHead>Institution</TableHead>
                        <TableHead>Valuer</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Assessment Value</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {loading ? (
                        Array.from({ length: 5 }).map((_, index) => (
                          <TableRow key={index}>
                            <TableCell><Skeleton className="h-5 w-8" /></TableCell>
                            <TableCell><Skeleton className="h-5 w-24" /></TableCell>
                            <TableCell><Skeleton className="h-5 w-32" /></TableCell>
                            <TableCell><Skeleton className="h-5 w-32" /></TableCell>
                            <TableCell><Skeleton className="h-5 w-32" /></TableCell>
                            <TableCell><Skeleton className="h-5 w-32" /></TableCell>
                            <TableCell><Skeleton className="h-5 w-32" /></TableCell>
                            <TableCell><Skeleton className="h-6 w-24" /></TableCell>
                            <TableCell><Skeleton className="h-5 w-28" /></TableCell>
                            <TableCell className="text-right"><Skeleton className="h-9 w-24" /></TableCell>
                          </TableRow>
                        ))
                      ) : allBookingsPaginated.length > 0 ? (
                        allBookingsPaginated.map((booking, index) => {
                          const valuation = valuations.find(v => v.bookingId === booking.id);
                          return (
                            <TableRow key={booking.id}>
                              <TableCell>{(allCarsPage - 1) * itemsPerPage + index + 1}</TableCell>
                              <TableCell>{booking.plateNumber}</TableCell>
                              <TableCell className="font-mono text-xs">{booking.bookingNumber}</TableCell>
                              <TableCell>{`${booking.carMake} ${booking.carModel}`}</TableCell>
                              <TableCell>{booking.customerName}</TableCell>
                              <TableCell>{booking.insurerName}</TableCell>
                              <TableCell>{booking.assignedValuerName || 'N/A'}</TableCell>
                              <TableCell>
                                <Badge variant={getStatusVariant(booking.status)}>{booking.status}</Badge>
                              </TableCell>
                              <TableCell>{valuation?.assessmentValue || 'N/A'}</TableCell>
                              <TableCell className="text-right">
                                {booking.status === 'Pending Approval' ? (
                                  <Button variant="outline" size="sm" onClick={() => openAssignDialog(booking)}>
                                    <FileSearch className="mr-2 h-4 w-4" />
                                    Assign &amp; Approve
                                  </Button>
                                ) : booking.status === 'Valuated' ? (
                                  <Button variant="default" size="sm" onClick={() => openCompleteValuationDialog(booking)}>
                                    <Edit className="mr-2 h-4 w-4" />
                                    Complete
                                  </Button>
                                ) : (
                                  <Popover>
                                    <PopoverTrigger asChild>
                                      <Button variant="default" size="sm">
                                        <FileDown className="mr-2 h-4 w-4" />
                                        Reports
                                      </Button>
                                    </PopoverTrigger>
                                    <PopoverContent className="w-56 p-2">
                                      <div className="grid gap-2">
                                        <Button
                                          variant="ghost"
                                          className="justify-start"
                                          onClick={() => handleOpenReportInNewTab('booking', booking.id)}
                                        >
                                          <FileDown className="mr-2 h-4 w-4" />
                                          Booking Report
                                        </Button>
                                        {booking.status === 'Completed' && (
                                          <Button
                                            variant="ghost"
                                            className="justify-start"
                                            onClick={() => handleOpenReportInNewTab('valuation', booking.id)}
                                          >
                                            <FileDown className="mr-2 h-4 w-4" />
                                            Valuation Report
                                          </Button>
                                        )}
                                      </div>
                                    </PopoverContent>
                                  </Popover>
                                )}
                              </TableCell>
                            </TableRow>
                          )
                        })
                      ) : (
                        <TableRow>
                          <TableCell colSpan={10} className="h-24 text-center">
                            No completed bookings found.
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                  <div className="flex justify-end items-center gap-2 mt-4">
                    <Button variant="outline" size="sm" onClick={() => setAllCarsPage(allCarsPage - 1)} disabled={allCarsPage === 1}>
                      <ChevronLeft className="h-4 w-4" />
                      Previous
                    </Button>
                    <span className="text-sm">Page {allCarsPage} of {totalAllBookingsPages}</span>
                    <Button variant="outline" size="sm" onClick={() => setAllCarsPage(allCarsPage + 1)} disabled={allCarsPage === totalAllBookingsPages}>
                      <ChevronRight className="h-4 w-4" />
                      Next
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
          {activeView === 'analytics' && (
            <div className="grid gap-8">
              <div>
                <h1 className="font-headline text-3xl md:text-4xl font-bold text-primary">Analytics Dashboard</h1>
                <p className="text-muted-foreground mt-2">Insights into your valuation operations.</p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatCard
                  title="Total Valuations"
                  value={stats.totalValuations}
                  icon={<TrendingUp className="h-6 w-6 text-blue-500" />}
                />
                <StatCard
                  title="Total Institutions"
                  value={stats.totalInstitutions}
                  icon={<Building2 className="h-6 w-6 text-green-500" />}
                />
                <StatCard
                  title="Total Valuers"
                  value={stats.totalValuers}
                  icon={<UserCog className="h-6 w-6 text-indigo-500" />}
                />
                <StatCard
                  title="Total Staff"
                  value={stats.totalStaff}
                  icon={<Users className="h-6 w-6 text-purple-500" />}
                />
              </div>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Valuations by Valuer</CardTitle>
                  </CardHeader>
                  <CardContent className="h-[300px] flex items-center justify-center">
                    <ChartContainer config={chartConfig} className="min-h-[200px] w-full">
                      <PieChart>
                        <Pie data={analyticsData.topValuers} dataKey="count" nameKey="name" cx="50%" cy="50%" outerRadius={90} label>
                          {analyticsData.topValuers.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={PIE_CHART_COLORS[index % PIE_CHART_COLORS.length]} />
                          ))}
                        </Pie>
                        <ChartTooltip content={<ChartTooltipContent />} />
                        <Legend />
                      </PieChart>
                    </ChartContainer>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader>
                    <CardTitle>Most Valued Vehicle Brands</CardTitle>
                  </CardHeader>
                  <CardContent className="h-[300px]">
                    <ChartContainer config={chartConfig} className="min-h-[200px] w-full">
                      <BarChart data={analyticsData.popularMakes}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="name" tick={{ fontSize: 12 }} angle={-45} textAnchor="end" height={60} />
                        <YAxis />
                        <ChartTooltip cursor={{ fill: 'hsl(var(--muted))' }} content={<ChartTooltipContent />} />
                        <Bar dataKey="count" name="Valuations" fill="var(--color-count)" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ChartContainer>
                  </CardContent>
                </Card>
              </div>
            </div>
          )}
          {activeView === 'institutions' && renderUserTable(
            institutions,
            "Client Institutions",
            "Manage all client institutions.",
            () => setAddInstitutionOpen(true),
            "institution",
            institutionsPage,
            setInstitutionsPage
          )}
          {activeView === 'valuers' && renderUserTable(
            valuers,
            "Valuers",
            "Manage all valuers.",
            () => setAddValuerOpen(true),
            "valuer",
            valuersPage,
            setValuersPage
          )}
          {activeView === 'staff' && renderUserTable(
            adminStaff,
            "Our Staff",
            "Manage all staff members.",
            () => setAddStaffOpen(true),
            "staff",
            staffPage,
            setStaffPage
          )}
          {activeView === 'new-bookings' && renderNewBookingsTable(
            bookings.filter(booking => booking.status === 'Pending Approval'),
            "New Bookings",
            "Approve and assign new booking requests.",
            newBookingsPage,
            setNewBookingsPage
          )}
          {activeView === 'pending-valuation' && renderPendingValuationTable(
            bookings.filter(booking => booking.status === 'Pending Valuation'),
            "Pending Valuation",
            "Monitor bookings pending valuation.",
            pendingValuationPage,
            setPendingValuationPage
          )}
          {activeView === 'valuated-bookings' && renderValuatedTable(
            bookings.filter(booking => booking.status === 'Valuated'),
            "For Valuation",
            "Complete the assessment for valuated bookings.",
            valuatedBookingsPage,
            setValuatedBookingsPage
          )}
          {activeView === 'rejected-bookings' && renderRejectedBookingsTable(
            bookings.filter(booking => booking.status === 'Rejected'),
            "Rejected Bookings",
            "View rejected bookings and their reasons.",
            rejectedBookingsPage,
            setRejectedBookingsPage
          )}
          {activeView === 'all-cars' && (
            <Card>
              <CardHeader>
                <div className="flex justify-between items-center">
                  <div>
                    <CardTitle>All Cars</CardTitle>
                    <CardDescription>A summary of all vehicles in the system.</CardDescription>
                  </div>
                  <div className="relative w-full max-w-sm">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      type="search"
                      placeholder="Search by plate, booking ID, customer..."
                      className="w-full rounded-lg bg-background pl-8"
                      value={allCarsSearchTerm}
                      onChange={(e) => setAllCarsSearchTerm(e.target.value)}
                    />
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>No.</TableHead>
                      <TableHead>Plate Number</TableHead>
                      <TableHead>Booking ID</TableHead>
                      <TableHead>Make and Model</TableHead>
                      <TableHead>Customer</TableHead>
                      <TableHead>Institution</TableHead>
                      <TableHead>Valuer</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {loading ? (
                      Array.from({ length: 5 }).map((_, index) => (
                        <TableRow key={index}>
                          <TableCell><Skeleton className="h-5 w-8" /></TableCell>
                          <TableCell><Skeleton className="h-5 w-24" /></TableCell>
                          <TableCell><Skeleton className="h-5 w-32" /></TableCell>
                          <TableCell><Skeleton className="h-5 w-32" /></TableCell>
                          <TableCell><Skeleton className="h-5 w-32" /></TableCell>
                          <TableCell><Skeleton className="h-5 w-32" /></TableCell>
                          <TableCell><Skeleton className="h-5 w-32" /></TableCell>
                          <TableCell><Skeleton className="h-6 w-24" /></TableCell>
                          <TableCell className="text-right"><Skeleton className="h-9 w-24" /></TableCell>
                        </TableRow>
                      ))
                    ) : allBookingsPaginated.length > 0 ? (
                      allBookingsPaginated.map((booking, index) => (
                        <TableRow key={booking.id}>
                          <TableCell>{(allCarsPage - 1) * itemsPerPage + index + 1}</TableCell>
                          <TableCell>{booking.plateNumber}</TableCell>
                          <TableCell className="font-mono text-xs">{booking.bookingNumber}</TableCell>
                          <TableCell>{`${booking.carMake} ${booking.carModel}`}</TableCell>
                          <TableCell>{booking.customerName}</TableCell>
                          <TableCell>{booking.insurerName}</TableCell>
                          <TableCell>{booking.assignedValuerName || 'N/A'}</TableCell>
                          <TableCell>
                            <Badge variant={getStatusVariant(booking.status)}>{booking.status}</Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            <Button variant="default" size="sm" onClick={() => handleOpenReportInNewTab('booking', booking.id)}>
                              <FileDown className="mr-2 h-4 w-4" />
                              Report
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell colSpan={9} className="h-24 text-center">
                          No bookings found.
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
                <div className="flex justify-end items-center gap-2 mt-4">
                  <Button variant="outline" size="sm" onClick={() => setAllCarsPage(allCarsPage - 1)} disabled={allCarsPage === 1}>
                    <ChevronLeft className="h-4 w-4" />
                    Previous
                  </Button>
                  <span className="text-sm">Page {allCarsPage} of {totalAllBookingsPages}</span>
                  <Button variant="outline" size="sm" onClick={() => setAllCarsPage(allCarsPage + 1)} disabled={allCarsPage === totalAllBookingsPages}>
                    <ChevronRight className="h-4 w-4" />
                    Next
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </main>
      </SidebarInset>
      {renderUserDialog(isAddInstitutionOpen, setAddInstitutionOpen, 'institution')}
      {renderUserDialog(isAddValuerOpen, setAddValuerOpen, 'valuer')}
      {renderUserDialog(isAddStaffOpen, setAddStaffOpen, 'staff')}

      <Dialog open={isAddBranchOpen} onOpenChange={setAddBranchOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Register New Branch</DialogTitle>
            <DialogDescription>
              Fill in the details below to create a new company branch.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleAddBranch} className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="branchName" className="text-right">Branch Name</Label>
              <Input id="branchName" name="branchName" className="col-span-3" required />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="branchManager" className="text-right">Branch Manager</Label>
              <Input id="branchManager" name="branchManager" className="col-span-3" required />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="branchLocation" className="text-right">Branch Location</Label>
              <Input id="branchLocation" name="branchLocation" className="col-span-3" required />
            </div>
            <DialogFooter>
              <Button type="submit">Create Branch</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={isAssignDialogOpen} onOpenChange={setAssignDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Approve &amp; Assign Booking</DialogTitle>
            <DialogDescription>
              Assign the booking to a valuer and approve it for valuation.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            {selectedBookingForAction && (
              <>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <Label>Customer Name:</Label>
                    <p className="font-medium">{selectedBookingForAction.customerName}</p>
                  </div>
                  <div>
                    <Label>Car Make:</Label>
                    <p className="font-medium">{selectedBookingForAction.carMake} {selectedBookingForAction.carModel}</p>
                  </div>
                  <div>
                    <Label>Booking Number:</Label>
                    <p className="font-medium">{selectedBookingForAction.bookingNumber}</p>
                  </div>
                  <div>
                    <Label>Plate Number:</Label>
                    <p className="font-medium">{selectedBookingForAction.plateNumber}</p>
                  </div>
                </div>
                <Label htmlFor="valuer">Select Valuer</Label>
                <Select value={selectedValuerId} onValueChange={setSelectedValuerId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a valuer" />
                  </SelectTrigger>
                  <SelectContent>
                    {valuers.map(valuer => (
                      <SelectItem key={valuer.id} value={valuer.id}>
                        {valuer.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </>
            )}
          </div>
          <DialogFooter>
            <Button variant="destructive" onClick={openRejectDialog}>
              Reject Booking
            </Button>
            <Button onClick={handleAssignmentAndApproval} disabled={!selectedValuerId}>
              Approve &amp; Assign
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isRejectDialogOpen} onOpenChange={setRejectDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Reject Booking</DialogTitle>
            <DialogDescription>
              Please provide a reason for rejecting this booking.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <Label htmlFor="rejectionReason">Rejection Reason</Label>
            <Textarea
              id="rejectionReason"
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              placeholder="Enter reason for rejection"
            />
          </div>
          <DialogFooter>
            <Button type="button" variant="secondary" onClick={() => {
              setRejectDialogOpen(false);
              setAssignDialogOpen(true);
            }}>
              Back
            </Button>
            <Button type="button" variant="destructive" onClick={handleBookingRejection} disabled={!rejectionReason}>
              Confirm Rejection
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isCompleteValuationOpen} onOpenChange={setCompleteValuationOpen}>
        <DialogContent className="sm:max-w-[800px]">
          <DialogHeader>
            <DialogTitle>Complete Valuation</DialogTitle>
            <DialogDescription>
              Enter official assessment values to complete the valuation process.
            </DialogDescription>
          </DialogHeader>
          <Tabs defaultValue="report" className="space-y-4">
            <TabsList>
              <TabsTrigger value="report">Valuation Report</TabsTrigger>
              <TabsTrigger value="images">Images</TabsTrigger>
              <TabsTrigger value="admin-values">Assessment Values</TabsTrigger>
            </TabsList>
            <TabsContent value="report" className="space-y-4">
              {loadingValuationDetails ? (
                <div className="space-y-2">
                  <Skeleton className="h-4 w-[200px]" />
                  <Skeleton className="h-4 w-[250px]" />
                  <Skeleton className="h-4 w-[220px]" />
                  <Skeleton className="h-4 w-[180px]" />
                </div>
              ) : selectedValuationForAction ? (
                <Collapsible>
                  <CollapsibleTrigger asChild>
                    <Button variant="ghost" className="w-full justify-start">
                      Vehicle Information <ChevronDown className="ml-auto h-4 w-4 shrink-0 transition-transform peer-data-[state=open]:rotate-180" />
                    </Button>
                  </CollapsibleTrigger>
                  <CollapsibleContent className="pl-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <Card>
                        <CardHeader><CardTitle>Details</CardTitle></CardHeader>
                        <CardContent>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-2 text-sm">
                            <div className="flex justify-between items-center py-1 border-b">
                              <span className="text-muted-foreground">Chassis No:</span>
                              <span className="font-medium">{selectedValuationForAction.chassisNo}</span>
                            </div>
                            <div className="flex justify-between items-center py-1 border-b">
                              <span className="text-muted-foreground">Colour:</span>
                              <span className="font-medium">{selectedValuationForAction.colour}</span>
                            </div>
                            <div className="flex justify-between items-center py-1 border-b">
                              <span className="text-muted-foreground">Fuel Type:</span>
                              <span className="font-medium">{selectedValuationForAction.fuelType}</span>
                            </div>
                            <div className="flex justify-between items-center py-1 border-b">
                              <span className="text-muted-foreground">Engine No:</span>
                              <span className="font-medium">{selectedValuationForAction.engineNo}</span>
                            </div>
                            <div className="flex justify-between items-center py-1 border-b">
                              <span className="text-muted-foreground">Engine Rating:</span>
                              <span className="font-medium">{selectedValuationForAction.engineRating}</span>
                            </div>
                            <div className="flex justify-between items-center py-1 border-b">
                              <span className="text-muted-foreground">Date of Reg:</span>
                              <span className="font-medium">{selectedValuationForAction.dateOfReg?.toDate().toLocaleDateString()}</span>
                            </div>
                            <div className="flex justify-between items-center py-1 border-b">
                              <span className="text-muted-foreground">Year of Manufacture:</span>
                              <span className="font-medium">{selectedValuationForAction.yearOfManufacture}</span>
                            </div>
                            <div className="flex justify-between items-center py-1 border-b">
                              <span className="text-muted-foreground">Odometer Readings:</span>
                              <span className="font-medium">{selectedValuationForAction.odometerReadings}</span>
                            </div>
                            <div className="flex justify-between items-center py-1 border-b">
                              <span className="text-muted-foreground">Country of Origin:</span>
                              <span className="font-medium">{selectedValuationForAction.countryOfOrigin}</span>
                            </div>
                            <div className="flex justify-between items-center py-1 border-b">
                              <span className="text-muted-foreground">Number of Airbags:</span>
                              <span className="font-medium">{selectedValuationForAction.numberOfAirbags}</span>
                            </div>
                            <div className="flex justify-between items-center py-1 border-b">
                              <span className="text-muted-foreground">Lights Type:</span>
                              <span className="font-medium">{selectedValuationForAction.lightsType}</span>
                            </div>
                            <div className="flex justify-between items-center py-1 border-b">
                              <span className="text-muted-foreground">Transmission Type:</span>
                              <span className="font-medium">{selectedValuationForAction.transmissionType}</span>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                      <Card>
                        <CardHeader><CardTitle>Logbook Image</CardTitle></CardHeader>
                        <CardContent>
                          {selectedValuationForAction.logbookImage ? (
                            <Image
                              src={selectedValuationForAction.logbookImage}
                              alt="Logbook"
                              width={500}
                              height={300}
                              className="object-contain"
                            />
                          ) : (
                            <p className="text-muted-foreground">No logbook image available.</p>
                          )}
                        </CardContent>
                      </Card>
                    </div>
                  </CollapsibleContent>
                </Collapsible>
              ) : (
                <p className="text-muted-foreground">Could not load valuation report.</p>
              )}
            </TabsContent>
            <TabsContent value="images">
              {loadingValuationDetails ? (
                <div className="space-y-2">
                  <Skeleton className="h-4 w-[200px]" />
                  <Skeleton className="h-4 w-[250px]" />
                </div>
              ) : selectedValuationForAction ? (
                selectedValuationForAction.valuationImages && selectedValuationForAction.valuationImages.length > 0 ? (
                  <Carousel className="w-full max-w-4xl">
                    <CarouselContent>
                      {selectedValuationForAction.valuationImages.map((image, index) => (
                        <CarouselItem key={index} className="pl-1 md:pl-0">
                          <div className="p-1">
                            <Image
                              src={image}
                              alt={`Valuation Image ${index + 1}`}
                              width={500}
                              height={300}
                              className="object-contain rounded-md"
                            />
                          </div>
                        </CarouselItem>
                      ))}
                    </CarouselContent>
                    <CarouselPrevious />
                    <CarouselNext />
                  </Carousel>
                ) : (
                  <p className="text-muted-foreground">No valuation images available.</p>
                )
              ) : (
                <p className="text-muted-foreground">Could not load valuation images.</p>
              )}
            </TabsContent>
            <TabsContent value="admin-values">
              {loadingValuationDetails ? (
                <div className="space-y-2">
                  <Skeleton className="h-4 w-[200px]" />
                  <Skeleton className="h-4 w-[250px]" />
                </div>
              ) : selectedValuationForAction ? (
                <Form {...adminValuationForm}>
                  <form onSubmit={adminValuationForm.handleSubmit(handleCompleteValuation)} className="space-y-4">
                    <FormField
                      control={adminValuationForm.control}
                      name="assessmentValue"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Assessment Value (KES)</FormLabel>
                          <FormControl>
                            <Input placeholder="Enter assessment value" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={adminValuationForm.control}
                      name="forcedValue"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Forced Sale Value (KES)</FormLabel>
                          <FormControl>
                            <Input placeholder="Enter forced sale value" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={adminValuationForm.control}
                      name="wsValue"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>WS Value (KES)</FormLabel>
                          <FormControl>
                            <Input placeholder="Enter WS value" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={adminValuationForm.control}
                      name="rsValue"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>RS Value (KES)</FormLabel>
                          <FormControl>
                            <Input placeholder="Enter RS value" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <DialogFooter>
                      <Button type="submit">Complete Valuation</Button>
                    </DialogFooter>
                  </form>
                </Form>
              ) : (
                <p>Could not load assessment values.</p>
              )}
            </TabsContent>
          </Tabs>
        </DialogContent>
      </Dialog>
      <footer className="mt-auto py-2 border-t bg-card/50">
        <div className="flex flex-col items-center justify-center gap-0.5 text-[10px] text-muted-foreground">
          <p>© {new Date().getFullYear()} Sonic Motor Valuers. All rights reserved.</p>
          <p>Version 1.0.0</p>
        </div>
      </footer>

    </SidebarProvider>
  );
}

const GuardedAdminDashboard = AuthGuard(AdminDashboard);
export default GuardedAdminDashboard;
