
"use client";

import React, { useState, useEffect, useMemo } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import UnifiedDashboardLayout from "@/components/dashboard/unified-dashboard-layout";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { db } from "@/lib/firebase";
import { collection, onSnapshot, addDoc, query, where, getDocs, doc, deleteDoc, orderBy } from "firebase/firestore";
import { useToast } from "@/hooks/use-toast";
import { Skeleton } from "@/components/ui/skeleton";
import { Loader2, PlusCircle, Printer, User, UserPlus, Check, ChevronsUpDown, Save, Car, Building, Hash, Calendar, MessageSquare, UserCheck, Sheet, Pen, Search, Hourglass, CheckCircle, XCircle, UserCog, Trash2, Clock, Building2 } from "lucide-react";
import { carData } from "@/lib/car-data";
import { Form, FormField, FormItem, FormControl, FormMessage, FormLabel } from "@/components/ui/form";
import { Badge } from "@/components/ui/badge";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { LineChart, Line, ResponsiveContainer, XAxis, YAxis, Tooltip, Legend, CartesianGrid } from "recharts"
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"
import { format, startOfMonth, endOfMonth, eachDayOfInterval, getDate } from 'date-fns';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";


interface LoggedInUser {
    name: string;
    username: string;
    email: string;
    role: string;
}

interface Customer {
  id: string;
  name: string;
  email: string;
  phone: string;
  insurerId: string;
}

interface Agent {
  id: string;
  name: string;
  email: string;
  phone: string;
  username: string;
  clientId: string;
}

interface Branch {
  id: string;
  name: string;
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
}

type ChartDataPoint = {
    day: string;
    Pending: number;
    Approved: number;
    Rejected: number;
};

const customerSchema = z.object({
  name: z.string().min(1, "Customer name is required"),
  email: z.string().email("Invalid email address"),
  phone: z.string().min(1, "Customer phone is required"),
});

type CustomerFormValues = z.infer<typeof customerSchema>;

const agentSchema = z.object({
    name: z.string().min(1, "Agent name is required"),
    username: z.string().min(1, "Username is required"),
    password: z.string().min(6, "Password must be at least 6 characters"),
    email: z.string().email("Invalid email address"),
    phone: z.string().min(1, "Agent phone is required"),
});

type AgentFormValues = z.infer<typeof agentSchema>;


const bookingSchema = z.object({
  customerName: z.string().min(1, "Customer name is required."),
  customerEmail: z.string().email("Invalid email address."),
  customerPhone: z.string().min(1, "Customer phone is required."),
  plateNumber: z.string().min(1, "Plate number is required"),
  policyNumber: z.string().min(1, "Policy number is required"),
  carMake: z.string().min(1, "Car make is required"),
  carModel: z.string().min(1, "Car model is required"),
  branch: z.string().min(1, "Branch is required"),
  maxValuationDays: z.string().min(1, "Maximum valuation days are required"),
  authorisedBy: z.string().min(1, "Authorising agent is required"),
  comments: z.string().optional(),
});

type BookingFormValues = z.infer<typeof bookingSchema>;

export default function ClientDashboardPage() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [agents, setAgents] = useState<Agent[]>([]);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingCustomers, setLoadingCustomers] = useState(true);
  const [loadingAgents, setLoadingAgents] = useState(true);
  const [loadingBranches, setLoadingBranches] = useState(true);
  const [isBookingDialogOpen, setBookingDialogOpen] = useState(false);
  const [isCustomerDialogOpen, setCustomerDialogOpen] = useState(false);
  const [isAgentDialogOpen, setAgentDialogOpen] = useState(false);
  const [isComboboxOpen, setComboboxOpen] = useState(false);
  const { toast } = useToast();
  const router = useRouter();
  const [loggedInUser, setLoggedInUser] = useState<LoggedInUser | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [customerSearchTerm, setCustomerSearchTerm] = useState("");
  const [agentSearchTerm, setAgentSearchTerm] = useState("");
  const [chartData, setChartData] = useState<ChartDataPoint[]>([]);

  const customerForm = useForm<CustomerFormValues>({
      resolver: zodResolver(customerSchema),
      defaultValues: { name: "", email: "", phone: "" },
  });

  const agentForm = useForm<AgentFormValues>({
    resolver: zodResolver(agentSchema),
    defaultValues: { name: "", email: "", phone: "", username: "", password: "" },
  });

  const bookingForm = useForm<BookingFormValues>({
    resolver: zodResolver(bookingSchema),
    defaultValues: {
        customerName: "",
        customerEmail: "",
        customerPhone: "",
        plateNumber: "",
        policyNumber: "",
        carMake: "",
        carModel: "",
        branch: "",
        maxValuationDays: "",
        authorisedBy: "",
        comments: "",
    }
  });

  const {
    watch: watchBooking,
    control: bookingControl,
    setValue: setBookingValue,
    handleSubmit: handleBookingSubmit,
    formState: { isSubmitting: isBookingSubmitting },
    reset: resetBookingForm,
  } = bookingForm;

  const selectedCarMake = watchBooking("carMake");
  const carModels = useMemo(() => {
    return selectedCarMake ? carData.find(make => make.brand === selectedCarMake)?.models || [] : [];
  }, [selectedCarMake]);

  useEffect(() => {
    const storedUser = sessionStorage.getItem('loggedInUser');
    if (storedUser) {
        setLoggedInUser(JSON.parse(storedUser));
    }
  }, []);

  const generateChartData = (bookings: Booking[]) => {
      const today = new Date();
      const firstDayOfMonth = startOfMonth(today);
      const lastDayOfMonth = endOfMonth(today);
      const daysInMonth = eachDayOfInterval({ start: firstDayOfMonth, end: lastDayOfMonth });

      const monthlyData: ChartDataPoint[] = daysInMonth.map(day => ({
          day: format(day, 'd'),
          Pending: 0,
          Approved: 0,
          Rejected: 0,
      }));

      bookings.forEach(booking => {
          if (booking.createdAt) {
              const bookingDate = booking.createdAt.toDate();
              if (bookingDate >= firstDayOfMonth && bookingDate <= lastDayOfMonth) {
                  const dayOfMonth = getDate(bookingDate) - 1; 
                  if (monthlyData[dayOfMonth]) {
                      if (booking.status === 'Pending') monthlyData[dayOfMonth].Pending++;
                      if (booking.status === 'Completed') monthlyData[dayOfMonth].Approved++;
                      if (booking.status === 'Rejected') monthlyData[dayOfMonth].Rejected++;
                  }
              }
          }
      });
      
      setChartData(monthlyData);
  };

  useEffect(() => {
    if (loggedInUser) {
        setLoading(true);
        const bookingsQuery = query(collection(db, "bookings"), where("insurerId", "==", loggedInUser.username));
        const bookingsUnsubscribe = onSnapshot(bookingsQuery, (snapshot) => {
            const bookingsData: Booking[] = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Booking));
            const sortedBookings = bookingsData.sort((a, b) => b.createdAt.toMillis() - a.createdAt.toMillis());
            setBookings(sortedBookings);
            generateChartData(sortedBookings);
            setLoading(false);
        });

        setLoadingCustomers(true);
        const customersQuery = query(collection(db, "customers"), where("insurerId", "==", loggedInUser.username));
        const customersUnsubscribe = onSnapshot(customersQuery, (snapshot) => {
            const customersData: Customer[] = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Customer));
            setCustomers(customersData);
            setLoadingCustomers(false);
        });
        
        setLoadingAgents(true);
        const agentsQuery = query(collection(db, "agents"), where("clientId", "==", loggedInUser.username));
        const agentsUnsubscribe = onSnapshot(agentsQuery, (snapshot) => {
            const agentsData: Agent[] = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Agent));
            setAgents(agentsData);
            setLoadingAgents(false);
        });
        
        setLoadingBranches(true);
        const branchesQuery = query(collection(db, "branches"));
        const branchesUnsubscribe = onSnapshot(branchesQuery, (snapshot) => {
            const branchesData: Branch[] = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Branch));
            setBranches(branchesData);
            setLoadingBranches(false);
        });

        return () => {
            bookingsUnsubscribe();
            customersUnsubscribe();
            agentsUnsubscribe();
            branchesUnsubscribe();
        };
    }
}, [loggedInUser]);

  const handleAddCustomer = async (data: CustomerFormValues) => {
      if (!loggedInUser) return;
      try {
          await addDoc(collection(db, "customers"), {
              ...data,
              insurerId: loggedInUser.username,
          });
          toast({ title: "Customer Added", description: `${data.name} has been successfully registered.` });
          setCustomerDialogOpen(false);
          customerForm.reset();
      } catch (error) {
          console.error("Error adding customer:", error);
          toast({ variant: "destructive", title: "Error", description: "Failed to add customer." });
      }
  };

  const handleAddAgent = async (data: AgentFormValues) => {
    if (!loggedInUser) return;
    try {
        await addDoc(collection(db, "agents"), {
            ...data,
            clientId: loggedInUser.username,
        });
        toast({ title: "Agent Added", description: `${data.name} has been successfully registered.` });
        setAgentDialogOpen(false);
        agentForm.reset();
    } catch (error) {
        console.error("Error adding agent:", error);
        toast({ variant: "destructive", title: "Error", description: "Failed to add agent." });
    }
  };
  
  const handleDeleteAgent = async (agentId: string) => {
    try {
        await deleteDoc(doc(db, "agents", agentId));
        toast({ title: "Agent Deleted", description: "The agent has been successfully removed." });
    } catch (error) {
        console.error("Error deleting agent:", error);
        toast({ variant: "destructive", title: "Error", description: "Failed to delete agent." });
    }
  };

  const handleSaveBooking = async (data: BookingFormValues) => {
    if (!loggedInUser) {
        toast({ variant: "destructive", title: "Authentication Error", description: "You must be logged in to create a booking." });
        return;
    }

    try {
        const q = query(collection(db, "bookings"), 
            where("policyNumber", "==", data.policyNumber),
            where("plateNumber", "==", data.plateNumber),
            where("carMake", "==", data.carMake),
            where("carModel", "==", data.carModel),
            where("customerName", "==", data.customerName)
        );
        const querySnapshot = await getDocs(q);
        
        if (!querySnapshot.empty) {
            toast({
                variant: "destructive",
                title: "Duplicate Booking",
                description: "A booking with the same details (policy, plate, car, and customer) already exists.",
            });
            return;
        }
        
        const bookingNumber = `BKG-${Date.now()}-${Math.random().toString(36).substring(2, 7).toUpperCase()}`;

        await addDoc(collection(db, "bookings"), {
            ...data,
            bookingNumber,
            createdAt: new Date(),
            status: "Pending",
            insurerId: loggedInUser.username,
            insurerName: loggedInUser.name,
        });

        toast({
            title: "Booking Created",
            description: `Booking #${bookingNumber} for ${data.customerName} has been saved.`,
        });
        setBookingDialogOpen(false);
        resetBookingForm();
    } catch (error) {
        console.error("Error creating booking: ", error);
        toast({
            variant: "destructive",
            title: "Booking Failed",
            description: "An error occurred while creating the booking.",
        });
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
      case "Rejected":
        return "destructive";
      default:
        return "default";
    }
  };
  
    const stats = {
        total: bookings.length,
        pending: bookings.filter(b => b.status === 'Pending').length,
        pendingValuation: bookings.filter(b => b.status === 'Pending').length,
        pendingApproval: bookings.filter(b => b.status === 'Pending Approval').length,
        completed: bookings.filter(b => b.status === 'Completed').length,
        rejected: bookings.filter(b => b.status === 'Rejected').length,
    };

    const filteredBookings = bookings.filter(booking => {
        const searchTermLower = searchTerm.toLowerCase();
        return (
            booking.bookingNumber.toLowerCase().includes(searchTermLower) ||
            booking.customerName.toLowerCase().includes(searchTermLower) ||
            booking.plateNumber.toLowerCase().includes(searchTermLower)
        );
    });
    
    const pendingBookings = filteredBookings.filter(b => b.status === "Pending");
    const completedBookings = filteredBookings.filter(b => b.status === "Completed" || b.status === "Rejected");

    const filteredCustomers = customers.filter(customer => {
        const searchTermLower = customerSearchTerm.toLowerCase();
        return (
            customer.name.toLowerCase().includes(searchTermLower) ||
            customer.email.toLowerCase().includes(searchTermLower) ||
            customer.phone.toLowerCase().includes(searchTermLower)
        );
    });
    
    const filteredAgents = agents.filter(agent => {
        const searchTermLower = agentSearchTerm.toLowerCase();
        return (
            agent.name.toLowerCase().includes(searchTermLower) ||
            agent.email.toLowerCase().includes(searchTermLower) ||
            agent.phone.toLowerCase().includes(searchTermLower)
        );
    });
  

  const chartConfig = {
    Pending: {
      label: "Pending",
      color: "hsl(var(--secondary-foreground))",
    },
    Approved: {
      label: "Approved",
      color: "hsl(var(--chart-1))",
    },
    Rejected: {
        label: "Rejected",
        color: "hsl(var(--primary))"
    }
  } 

    const renderBookingsTable = (
        bookingsData: Booking[],
        title: string,
        description: string
    ) => (
        <Card>
            <CardHeader>
                <div className="flex justify-between items-center">
                    <div>
                        <CardTitle className="font-headline text-3xl text-primary">{title}</CardTitle>
                        <CardDescription>{description}</CardDescription>
                    </div>
                     <div className="flex items-center gap-4">
                        <div className="relative w-full max-w-sm">
                            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                            <Input
                                type="search"
                                placeholder="Search bookings..."
                                className="w-full rounded-lg bg-background pl-8"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
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
                                    <TableCell className="hidden md:table-cell">{booking.plateNumber}</TableCell>
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
    );

  return (
    <UnifiedDashboardLayout
      title="CASA Motor Valuers & Assessors Ltd"
      userRole={loggedInUser?.name || "Client"}
      userEmail={loggedInUser?.email || ""}
      menuItems={[
        { name: "Dashboard", view: "dashboard" },
        { name: "Create Booking", view: "create-booking", action: () => setBookingDialogOpen(true) },
        { name: "Manage Customers", view: "customers" },
        { name: "CASA Branches", view: "branches"},
      ]}
      footerContent={(
        <>
            <p className="text-sm text-muted-foreground">
                &copy; {new Date().getFullYear()} CASA Motor Valuers & Assessors Ltd. All rights reserved.
            </p>
            <p className="text-sm text-muted-foreground">
                Designed by <a href="https://elvisdev.netlify.app/" target="_blank" rel="noopener noreferrer" className="font-medium underline underline-offset-4">Tekivo Technologies</a>
            </p>
        </>
      )}
    >
      {(activeView) => (
          <>
          <Dialog open={isBookingDialogOpen} onOpenChange={setBookingDialogOpen}>
              <DialogContent className="sm:max-w-3xl grid-rows-[auto_1fr_auto] max-h-[90vh]">
                <DialogHeader>
                  <DialogTitle>Make a New Booking</DialogTitle>
                  <DialogDescription>
                    Fill out the form to create a new booking.
                  </DialogDescription>
                </DialogHeader>
                  <div className="overflow-y-auto pr-6 -mr-6">
                    <Form {...bookingForm}>
                      <form onSubmit={handleBookingSubmit(handleSaveBooking)} className="space-y-4">
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                              <FormField
                                  control={bookingControl}
                                  name="customerName"
                                  render={({ field }) => (
                                      <FormItem>
                                      <FormLabel>Customer Name</FormLabel>
                                      <FormControl>
                                          <Input {...field} placeholder="Enter customer name" />
                                      </FormControl>
                                      <FormMessage />
                                      </FormItem>
                                  )}
                                  />
                              <FormField
                                  control={bookingControl}
                                  name="customerEmail"
                                  render={({ field }) => (
                                      <FormItem>
                                      <FormLabel>Customer Email</FormLabel>
                                      <FormControl>
                                          <Input {...field} placeholder="Enter customer email" />
                                      </FormControl>
                                        <FormMessage />
                                      </FormItem>
                                  )}
                                  />
                              <FormField
                                  control={bookingControl}
                                  name="customerPhone"
                                  render={({ field }) => (
                                      <FormItem>
                                      <FormLabel>Customer Phone</FormLabel>
                                      <FormControl>
                                          <Input {...field} placeholder="Enter customer phone" />
                                      </FormControl>
                                        <FormMessage />
                                      </FormItem>
                                  )}
                              />
                          </div>
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <FormField
                                  control={bookingControl}
                                  name="plateNumber"
                                  render={({ field }) => (
                                      <FormItem>
                                      <FormLabel>Plate Number</FormLabel>
                                      <FormControl>
                                          <Input {...field} placeholder="e.g. KDA 123B" />
                                      </FormControl>
                                      <FormMessage />
                                      </FormItem>
                                  )}
                              />
                                <FormField
                                  control={bookingControl}
                                  name="policyNumber"
                                  render={({ field }) => (
                                      <FormItem>
                                      <FormLabel>Policy Number</FormLabel>
                                      <FormControl>
                                          <Input {...field} placeholder="Enter policy number" />
                                      </FormControl>
                                      <FormMessage />
                                      </FormItem>
                                  )}
                              />
                               <FormField
                                  control={bookingControl}
                                  name="branch"
                                  render={({ field }) => (
                                      <FormItem>
                                      <FormLabel>Branch</FormLabel>
                                      <FormControl>
                                          <Input {...field} placeholder="Enter branch" />
                                      </FormControl>
                                      <FormMessage />
                                      </FormItem>
                                  )}
                               />
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              <FormField
                                  control={bookingControl}
                                  name="carMake"
                                  render={({ field }) => (
                                      <FormItem>
                                      <FormLabel>Car Make</FormLabel>
                                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                                              <FormControl>
                                                  <SelectTrigger>
                                                      <SelectValue placeholder="Select a car make" />
                                                  </SelectTrigger>
                                              </FormControl>
                                              <SelectContent>
                                                  {carData.map((make) => (
                                                      <SelectItem key={make.brand} value={make.brand}>
                                                          {make.brand}
                                                      </SelectItem>
                                                  ))}
                                              </SelectContent>
                                          </Select>
                                      <FormMessage />
                                      </FormItem>
                                  )}
                              />
                                <FormField
                                  control={bookingControl}
                                  name="carModel"
                                  render={({ field }) => (
                                      <FormItem>
                                      <FormLabel>Car Model</FormLabel>
                                          <Select onValueChange={field.onChange} defaultValue={field.value} disabled={!selectedCarMake}>
                                              <FormControl>
                                                  <SelectTrigger>
                                                      <SelectValue placeholder="Select a car model" />
                                                  </SelectTrigger>
                                              </FormControl>
                                              <SelectContent>
                                                  {carModels.map((model) => (
                                                      <SelectItem key={model} value={model}>
                                                          {model}
                                                      </SelectItem>
                                                  ))}
                                              </SelectContent>
                                          </Select>
                                      <FormMessage />
                                      </FormItem>
                                  )}
                              />
                          </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <FormField
                                  control={bookingControl}
                                  name="maxValuationDays"
                                  render={({ field }) => (
                                      <FormItem>
                                      <FormLabel>Maximum Valuation Days</FormLabel>
                                      <FormControl>
                                          <Input type="number" {...field} placeholder="e.g. 3" />
                                      </FormControl>
                                      <FormMessage />
                                      </FormItem>
                                  )}
                              />
                              <FormField
                                control={bookingControl}
                                name="authorisedBy"
                                render={({ field }) => (
                                    <FormItem>
                                    <FormLabel>Authorised By (Agent)</FormLabel>
                                    <FormControl>
                                        <Input {...field} placeholder="Enter agent name" />
                                    </FormControl>
                                    <FormMessage />
                                    </FormItem>
                                )}
                                />
                          </div>

                            <FormField
                              control={bookingControl}
                              name="comments"
                              render={({ field }) => (
                                  <FormItem>
                                  <FormLabel>Comments</FormLabel>
                                  <FormControl>
                                      <Textarea
                                          placeholder="Add any additional comments here..."
                                          className="resize-none"
                                          {...field}
                                      />
                                  </FormControl>
                                  <FormMessage />
                                  </FormItem>
                              )}
                          />

                          <DialogFooter className="pt-4">
                              <Button type="button" variant="outline" onClick={() => setBookingDialogOpen(false)}>
                                  Cancel
                              </Button>
                              <Button type="submit" disabled={isBookingSubmitting}>
                                  {isBookingSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                                  Save Booking
                              </Button>
                          </DialogFooter>
                      </form>
                    </Form>
                  </div>
              </DialogContent>
          </Dialog>

          <Tabs value={activeView} className="w-full">
            <TabsContent value="dashboard">
               <div className="grid gap-8">
                <div>
                    <h1 className="font-headline text-3xl md:text-4xl font-bold text-primary">Welcome, {loggedInUser?.name}!</h1>
                    <p className="text-muted-foreground mt-2">Here's a summary of your recent activity.</p>
                </div>
                 <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                   <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Total Bookings</CardTitle>
                            <Car className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{loading ? <Skeleton className="h-8 w-16" /> : stats.total}</div>
                            <p className="text-xs text-muted-foreground">Total bookings made</p>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Pending Valuation</CardTitle>
                            <Hourglass className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{loading ? <Skeleton className="h-8 w-16" /> : stats.pendingValuation}</div>
                            <p className="text-xs text-muted-foreground">Awaiting valuation from valuer</p>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Approved</CardTitle>
                            <CheckCircle className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{loading ? <Skeleton className="h-8 w-16" /> : stats.completed}</div>
                            <p className="text-xs text-muted-foreground">Completed and approved reports</p>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Rejected</CardTitle>
                            <XCircle className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{loading ? <Skeleton className="h-8 w-16" /> : stats.rejected}</div>
                            <p className="text-xs text-muted-foreground">Rejected reports</p>
                        </CardContent>
                    </Card>
                </div>
                 <Card>
                    <CardHeader>
                        <CardTitle>Booking Statistics ({format(new Date(), 'MMMM')})</CardTitle>
                        <CardDescription>Daily trends for your booking statuses this month.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <ChartContainer config={chartConfig} className="min-h-[300px] w-full">
                           <LineChart data={chartData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis dataKey="day" />
                                <YAxis domain={[0, 'dataMax + 5']} />
                                <Tooltip content={<ChartTooltipContent />} />
                                <Legend />
                                <Line type="monotone" dataKey="Pending" stroke={chartConfig.Pending.color} strokeWidth={2} />
                                <Line type="monotone" dataKey="Approved" stroke={chartConfig.Approved.color} strokeWidth={2} />
                                <Line type="monotone" dataKey="Rejected" stroke={chartConfig.Rejected.color} strokeWidth={2} />
                            </LineChart>
                        </ChartContainer>
                    </CardContent>
                </Card>
              </div>
            </TabsContent>
            
            <TabsContent value="customers">
                <Card>
                    <CardHeader>
                        <div className="flex justify-between items-center">
                            <div>
                                <CardTitle className="font-headline text-3xl text-primary">Manage Customers</CardTitle>
                                <CardDescription>Register new customers and view existing ones.</CardDescription>
                            </div>
                            <div className="flex items-center gap-4">
                                <div className="relative w-full max-w-sm">
                                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                                    <Input
                                        type="search"
                                        placeholder="Search customers..."
                                        className="w-full rounded-lg bg-background pl-8"
                                        value={customerSearchTerm}
                                        onChange={(e) => setCustomerSearchTerm(e.target.value)}
                                    />
                                </div>
                                <Dialog open={isCustomerDialogOpen} onOpenChange={setCustomerDialogOpen}>
                                    <DialogTrigger asChild>
                                        <Button><UserPlus className="mr-2" /> Add Customer</Button>
                                    </DialogTrigger>
                                    <DialogContent className="sm:max-w-[425px]">
                                    <DialogHeader>
                                        <DialogTitle>Register New Customer</DialogTitle>
                                        <DialogDescription>
                                            Fill in the details to add a new customer.
                                        </DialogDescription>
                                    </DialogHeader>
                                        <Form {...customerForm}>
                                            <form onSubmit={customerForm.handleSubmit(handleAddCustomer)} className="space-y-6 pt-4">
                                                <FormField
                                                    control={customerForm.control}
                                                    name="name"
                                                    render={({ field }) => (
                                                        <FormItem>
                                                        <FormLabel>Full Name</FormLabel>
                                                        <FormControl>
                                                            <Input {...field} placeholder="e.g. John Doe" />
                                                        </FormControl>
                                                        <FormMessage />
                                                        </FormItem>
                                                    )}
                                                />
                                                <FormField
                                                    control={customerForm.control}
                                                    name="email"
                                                    render={({ field }) => (
                                                        <FormItem>
                                                        <FormLabel>Email Address</FormLabel>
                                                        <FormControl>
                                                            <Input {...field} type="email" placeholder="e.g. john@example.com" />
                                                        </FormControl>
                                                        <FormMessage />
                                                        </FormItem>
                                                    )}
                                                />
                                                <FormField
                                                    control={customerForm.control}
                                                    name="phone"
                                                    render={({ field }) => (
                                                        <FormItem>
                                                        <FormLabel>Phone Number</FormLabel>
                                                        <FormControl>
                                                            <Input {...field} placeholder="e.g. 0712345678" />
                                                        </FormControl>
                                                        <FormMessage />
                                                        </FormItem>
                                                    )}
                                                />
                                                <DialogFooter>
                                                    <Button type="button" variant="outline" onClick={() => setCustomerDialogOpen(false)}>Cancel</Button>
                                                    <Button type="submit" disabled={customerForm.formState.isSubmitting}>
                                                         {customerForm.formState.isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                                                        Save Customer
                                                    </Button>
                                                </DialogFooter>
                                            </form>
                                        </Form>
                                    </DialogContent>
                                </Dialog>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent>
                        <Table>
                            <TableHeader>
                                <TableRow className="bg-muted/50">
                                    <TableHead className="font-semibold text-left">Name</TableHead>
                                    <TableHead className="font-semibold text-left">Email</TableHead>
                                    <TableHead className="font-semibold text-left">Phone</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {loadingCustomers ? (
                                    Array.from({ length: 5 }).map((_, index) => (
                                      <TableRow key={index}>
                                        <TableCell><Skeleton className="h-5 w-40" /></TableCell>
                                        <TableCell><Skeleton className="h-5 w-48" /></TableCell>
                                        <TableCell><Skeleton className="h-5 w-32" /></TableCell>
                                      </TableRow>
                                    ))
                                ) : filteredCustomers.length > 0 ? (
                                    filteredCustomers.map(customer => (
                                        <TableRow key={customer.id}>
                                            <TableCell className="font-medium flex items-center gap-3">
                                                <div className="p-2 bg-muted rounded-full hidden sm:flex">
                                                    <User className="h-5 w-5 text-primary" />
                                                </div>
                                                {customer.name}
                                            </TableCell>
                                            <TableCell>{customer.email}</TableCell>
                                            <TableCell>{customer.phone}</TableCell>
                                        </TableRow>
                                    ))
                                ) : (
                                    <TableRow>
                                        <TableCell colSpan={3} className="text-center h-24">
                                            No customers found.
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>
            </TabsContent>
            
            <TabsContent value="agents">
                <Card>
                    <CardHeader>
                        <div className="flex justify-between items-center">
                            <div>
                                <CardTitle className="font-headline text-3xl text-primary">Manage Agents</CardTitle>
                                <CardDescription>Register new agents and view existing ones.</CardDescription>
                            </div>
                            <div className="flex items-center gap-4">
                                <div className="relative w-full max-w-sm">
                                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                                    <Input
                                        type="search"
                                        placeholder="Search agents..."
                                        className="w-full rounded-lg bg-background pl-8"
                                        value={agentSearchTerm}
                                        onChange={(e) => setAgentSearchTerm(e.target.value)}
                                    />
                                </div>
                                <Dialog open={isAgentDialogOpen} onOpenChange={setAgentDialogOpen}>
                                    <DialogTrigger asChild>
                                        <Button><UserCog className="mr-2" /> Register Agent</Button>
                                    </DialogTrigger>
                                    <DialogContent className="sm:max-w-[425px]">
                                    <DialogHeader>
                                        <DialogTitle>Register New Agent</DialogTitle>
                                        <DialogDescription>
                                            Fill in the details to add a new agent.
                                        </DialogDescription>
                                    </DialogHeader>
                                        <Form {...agentForm}>
                                            <form onSubmit={agentForm.handleSubmit(handleAddAgent)} className="space-y-6 pt-4">
                                                <FormField control={agentForm.control} name="name" render={({ field }) => (<FormItem><FormLabel>Full Name</FormLabel><FormControl><Input {...field} placeholder="e.g. Jane Smith" /></FormControl><FormMessage /></FormItem>)} />
                                                <FormField control={agentForm.control} name="username" render={({ field }) => (<FormItem><FormLabel>Username</FormLabel><FormControl><Input {...field} placeholder="e.g. janesmith" /></FormControl><FormMessage /></FormItem>)} />
                                                <FormField control={agentForm.control} name="password" render={({ field }) => (<FormItem><FormLabel>Password</FormLabel><FormControl><Input {...field} type="password" placeholder="••••••••" /></FormControl><FormMessage /></FormItem>)} />
                                                <FormField control={agentForm.control} name="email" render={({ field }) => (<FormItem><FormLabel>Email Address</FormLabel><FormControl><Input {...field} type="email" placeholder="e.g. jane@example.com" /></FormControl><FormMessage /></FormItem>)} />
                                                <FormField control={agentForm.control} name="phone" render={({ field }) => (<FormItem><FormLabel>Phone Number</FormLabel><FormControl><Input {...field} placeholder="e.g. 0712345678" /></FormControl><FormMessage /></FormItem>)} />
                                                <DialogFooter>
                                                    <Button type="button" variant="outline" onClick={() => setAgentDialogOpen(false)}>Cancel</Button>
                                                    <Button type="submit" disabled={agentForm.formState.isSubmitting}>
                                                         {agentForm.formState.isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                                                        Save Agent
                                                    </Button>
                                                </DialogFooter>
                                            </form>
                                        </Form>
                                    </DialogContent>
                                </Dialog>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent>
                        <Table>
                            <TableHeader>
                                <TableRow className="bg-muted/50">
                                    <TableHead className="font-semibold text-left">Name</TableHead>
                                    <TableHead className="hidden sm:table-cell font-semibold text-left">Username</TableHead>
                                    <TableHead className="font-semibold text-left">Email</TableHead>
                                    <TableHead className="font-semibold text-left">Phone</TableHead>
                                    <TableHead className="font-semibold text-right">Action</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {loadingAgents ? (
                                    Array.from({ length: 3 }).map((_, index) => (
                                      <TableRow key={index}>
                                        <TableCell><Skeleton className="h-5 w-40" /></TableCell>
                                        <TableCell className="hidden sm:table-cell"><Skeleton className="h-5 w-32" /></TableCell>
                                        <TableCell><Skeleton className="h-5 w-48" /></TableCell>
                                        <TableCell><Skeleton className="h-5 w-32" /></TableCell>
                                        <TableCell className="text-right"><Skeleton className="h-8 w-20 ml-auto" /></TableCell>
                                      </TableRow>
                                    ))
                                ) : filteredAgents.length > 0 ? (
                                    filteredAgents.map(agent => (
                                        <TableRow key={agent.id}>
                                            <TableCell className="font-medium flex items-center gap-3">
                                                <div className="p-2 bg-muted rounded-full hidden sm:flex">
                                                    <UserCog className="h-5 w-5 text-primary" />
                                                </div>
                                                {agent.name}
                                            </TableCell>
                                            <TableCell className="hidden sm:table-cell">{agent.username}</TableCell>
                                            <TableCell>{agent.email}</TableCell>
                                            <TableCell>{agent.phone}</TableCell>
                                            <TableCell className="text-right">
                                                 <AlertDialog>
                                                    <AlertDialogTrigger asChild>
                                                        <Button variant="destructive" size="icon">
                                                          <Trash2 className="h-4 w-4" />
                                                        </Button>
                                                    </AlertDialogTrigger>
                                                    <AlertDialogContent>
                                                        <AlertDialogHeader>
                                                        <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                                                        <AlertDialogDescription>
                                                            This action cannot be undone. This will permanently delete the agent {agent.name}.
                                                        </AlertDialogDescription>
                                                        </AlertDialogHeader>
                                                        <AlertDialogFooter>
                                                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                                                        <AlertDialogAction onClick={() => handleDeleteAgent(agent.id)}>Continue</AlertDialogAction>
                                                        </AlertDialogFooter>
                                                    </AlertDialogContent>
                                                </AlertDialog>
                                            </TableCell>
                                        </TableRow>
                                    ))
                                ) : (
                                    <TableRow>
                                        <TableCell colSpan={5} className="text-center h-24">
                                            No agents found.
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>
            </TabsContent>
            
            <TabsContent value="branches">
                <Card>
                    <CardHeader>
                        <CardTitle className="font-headline text-3xl text-primary">Our Branches</CardTitle>
                        <CardDescription>Find a CASA Motor Valuers & Assessors branch near you.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Branch Name</TableHead>
                                    <TableHead>Location</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {loadingBranches ? (
                                     Array.from({ length: 3 }).map((_, index) => (
                                      <TableRow key={index}>
                                        <TableCell><Skeleton className="h-5 w-40" /></TableCell>
                                        <TableCell><Skeleton className="h-5 w-48" /></TableCell>
                                      </TableRow>
                                     ))
                                ) : branches.length > 0 ? (
                                    branches.map((branch) => (
                                        <TableRow key={branch.id}>
                                            <TableCell className="font-medium flex items-center gap-3">
                                                <Building2 className="h-5 w-5 text-primary" />
                                                {branch.name}
                                            </TableCell>
                                            <TableCell>{branch.location}</TableCell>
                                        </TableRow>
                                    ))
                                ) : (
                                    <TableRow>
                                        <TableCell colSpan={2} className="text-center h-24">No branches found.</TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>
            </TabsContent>

          </Tabs>
        </>
      )}
    </UnifiedDashboardLayout>
  );
}

    