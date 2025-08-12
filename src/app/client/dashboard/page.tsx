
"use client";

import React, { useState, useEffect } from "react";
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
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { db } from "@/lib/firebase";
import { collection, onSnapshot, addDoc, query, where, getDocs, orderBy } from "firebase/firestore";
import { useToast } from "@/hooks/use-toast";
import { Skeleton } from "@/components/ui/skeleton";
import { BookMarked, Loader2, Car, FilePlus, Hourglass, CheckCircle } from "lucide-react";
import { carData } from "@/lib/car-data";
import { Form, FormField, FormItem, FormControl, FormMessage, FormLabel } from "@/components/ui/form";


interface Customer {
  id: string;
  name: string;
  email: string;
  phone: string;
  createdAt: any;
}

interface Booking {
    id: string;
    status: string;
}

interface Stats {
    totalBookings: number;
    newRequests: number;
    pendingValuation: number;
    pendingApproval: number;
}

const bookingSchema = z.object({
  customerName: z.string(),
  customerEmail: z.string().email(),
  customerPhone: z.string(),
  plateNumber: z.string().min(1, "Plate number is required"),
  policyNumber: z.string().min(1, "Policy number is required"),
  carMake: z.string().min(1, "Car make is required"),
  carModel: z.string().min(1, "Car model is required"),
  branch: z.string().min(1, "Branch is required"),
  maxValuationDays: z.string().min(1, "Maximum valuation days are required"),
  authorisedBy: z.string().min(1, "Authorised by is required"),
  comments: z.string().optional(),
});

type BookingFormValues = z.infer<typeof bookingSchema>;

export default function ClientDashboardPage() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [isBookingDialogOpen, setBookingDialogOpen] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const { toast } = useToast();
  const [stats, setStats] = useState<Stats>({ totalBookings: 0, newRequests: 0, pendingValuation: 0, pendingApproval: 0 });
  const [statsLoading, setStatsLoading] = useState(true);

  const form = useForm<BookingFormValues>({
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
    handleSubmit,
    control,
    reset,
    watch,
    formState: { isSubmitting },
  } = form;

  const selectedCarMake = watch("carMake");
  const carModels = selectedCarMake ? carData.find(make => make.brand === selectedCarMake)?.models || [] : [];

  useEffect(() => {
    const fetchCustomers = () => {
        setLoading(true);
        const q = query(collection(db, "customers"), orderBy("createdAt", "desc"));
        const unsubscribe = onSnapshot(q, (querySnapshot) => {
            const customersData: Customer[] = [];
            querySnapshot.forEach((doc) => {
            customersData.push({ id: doc.id, ...doc.data() } as Customer);
            });
            setCustomers(customersData);
            setLoading(false);
        });
        return unsubscribe;
    };

    const fetchStats = async () => {
        setStatsLoading(true);
        const bookingsCollection = collection(db, "bookings");

        const bookingsSnapshot = await getDocs(bookingsCollection);
        const totalBookings = bookingsSnapshot.size;

        const newRequestsQuery = query(bookingsCollection, where("status", "==", "Pending"));
        const pendingValuationQuery = query(bookingsCollection, where("status", "==", "Pending Valuation"));
        const pendingApprovalQuery = query(bookingsCollection, where("status", "==", "Pending Approval"));

        const [newRequestsSnapshot, pendingValuationSnapshot, pendingApprovalSnapshot] = await Promise.all([
            getDocs(newRequestsQuery),
            getDocs(pendingValuationQuery),
            getDocs(pendingApprovalQuery),
        ]);

        setStats({
            totalBookings,
            newRequests: newRequestsSnapshot.size,
            pendingValuation: pendingValuationSnapshot.size,
            pendingApproval: pendingApprovalSnapshot.size,
        });

        setStatsLoading(false);
    };

    const unsubCustomers = fetchCustomers();
    fetchStats();
    
    // Set up a listener for real-time stat updates on bookings
    const unsubBookings = onSnapshot(collection(db, "bookings"), () => {
        fetchStats(); 
    });

    return () => {
        unsubCustomers();
        unsubBookings();
    };
  }, []);
  
  const handleOpenBookingDialog = (customer: Customer) => {
    setSelectedCustomer(customer);
    reset({
      customerName: customer.name,
      customerEmail: customer.email,
      customerPhone: customer.phone,
      plateNumber: "",
      policyNumber: "",
      carMake: "",
      carModel: "",
      branch: "",
      maxValuationDays: "",
      authorisedBy: "",
      comments: "",
    });
    setBookingDialogOpen(true);
  };
  
  const handleSaveBooking = async (data: BookingFormValues) => {
    try {
      const bookingNumber = `BKG-${Date.now()}-${Math.random().toString(36).substring(2, 7).toUpperCase()}`;
      await addDoc(collection(db, "bookings"), {
        ...data,
        bookingNumber,
        createdAt: new Date(),
        status: "Pending", // Initial status
      });
      toast({
        title: "Booking Created",
        description: `Booking #${bookingNumber} for ${data.customerName} has been saved.`,
      });
      setBookingDialogOpen(false);
    } catch (error) {
      console.error("Error creating booking: ", error);
      toast({
        variant: "destructive",
        title: "Booking Failed",
        description: "An error occurred while creating the booking.",
      });
    }
  };


  const filteredCustomers = customers.filter(
    (customer) =>
      customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      customer.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      customer.phone.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <UnifiedDashboardLayout
      title="Client Dashboard"
      userRole="Client"
      userEmail="client@example.com"
      menuItems={[
        { name: "Overview", view: "overview" },
        { name: "Bookings", view: "bookings" },
        { name: "Invoices", view: "invoices" },
        { name: "Support", view: "support" },
      ]}
    >
      {(activeView) => (
          <Tabs value={activeView} className="w-full">
            <TabsContent value="overview">
               <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Total Bookings</CardTitle>
                            <Car className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            {statsLoading ? <Skeleton className="h-8 w-1/4" /> : <div className="text-2xl font-bold">{stats.totalBookings}</div>}
                            <p className="text-xs text-muted-foreground">All time vehicle bookings</p>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">New Requests</CardTitle>
                            <FilePlus className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                             {statsLoading ? <Skeleton className="h-8 w-1/4" /> : <div className="text-2xl font-bold">{stats.newRequests}</div>}
                            <p className="text-xs text-muted-foreground">Newly created bookings</p>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Pending Valuation</CardTitle>
                            <Hourglass className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                             {statsLoading ? <Skeleton className="h-8 w-1/4" /> : <div className="text-2xl font-bold">{stats.pendingValuation}</div>}
                            <p className="text-xs text-muted-foreground">Bookings awaiting valuation</p>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Pending Approval</CardTitle>
                            <CheckCircle className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                             {statsLoading ? <Skeleton className="h-8 w-1/4" /> : <div className="text-2xl font-bold">{stats.pendingApproval}</div>}
                           <p className="text-xs text-muted-foreground">Valuations awaiting approval</p>
                        </CardContent>
                    </Card>
                </div>
            </TabsContent>

            <TabsContent value="bookings">
              <Card>
                <CardHeader>
                  <div className="flex justify-between items-center">
                    <div>
                      <CardTitle>Bookings</CardTitle>
                      <CardDescription>Manage your customer bookings.</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="mb-4">
                    <Input
                      placeholder="Search by name, email, or phone..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />
                  </div>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Name</TableHead>
                        <TableHead>Email</TableHead>
                        <TableHead>Phone</TableHead>
                        <TableHead className="text-right">Action</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {loading ? (
                        Array.from({ length: 3 }).map((_, index) => (
                          <TableRow key={index}>
                            <TableCell><Skeleton className="h-5 w-32" /></TableCell>
                            <TableCell><Skeleton className="h-5 w-48" /></TableCell>
                            <TableCell><Skeleton className="h-5 w-24" /></TableCell>
                            <TableCell className="text-right"><Skeleton className="h-8 w-32 ml-auto" /></TableCell>
                          </TableRow>
                        ))
                      ) : filteredCustomers.length > 0 ? (
                        filteredCustomers.map((customer) => (
                          <TableRow key={customer.id}>
                            <TableCell className="font-medium">{customer.name}</TableCell>
                            <TableCell>{customer.email}</TableCell>
                            <TableCell>{customer.phone}</TableCell>
                            <TableCell className="text-right">
                              <Button size="sm" onClick={() => handleOpenBookingDialog(customer)}>
                                <BookMarked className="mr-2 h-4 w-4" />
                                Make a Booking
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))
                      ) : (
                        <TableRow>
                          <TableCell colSpan={4} className="text-center h-24">
                            No customers found.
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="invoices">
              <Card>
                <CardHeader>
                  <CardTitle>Invoices</CardTitle>
                  <CardDescription>Your billing and payment history.</CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">No invoices found.</p>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="support">
              <Card>
                <CardHeader>
                  <CardTitle>Support</CardTitle>
                  <CardDescription>Contact our team for assistance.</CardDescription>
                </CardHeader>
                <CardContent>
                  <Button>Open Support Ticket</Button>
                </CardContent>
              </Card>
            </TabsContent>

             <Dialog open={isBookingDialogOpen} onOpenChange={setBookingDialogOpen}>
                <DialogContent className="sm:max-w-4xl">
                  <DialogHeader>
                    <DialogTitle>Make a New Booking</DialogTitle>
                    <DialogDescription>
                      Fill out the form below to create a booking for {selectedCustomer?.name}.
                    </DialogDescription>
                  </DialogHeader>
                  <Form {...form}>
                    <form onSubmit={handleSubmit(handleSaveBooking)} className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <FormField
                                control={control}
                                name="customerName"
                                render={({ field }) => (
                                    <FormItem>
                                    <FormLabel>Customer Name</FormLabel>
                                    <FormControl>
                                        <Input {...field} disabled />
                                    </FormControl>
                                    </FormItem>
                                )}
                                />
                            <FormField
                                control={control}
                                name="customerEmail"
                                render={({ field }) => (
                                    <FormItem>
                                    <FormLabel>Customer Email</FormLabel>
                                    <FormControl>
                                        <Input {...field} disabled />
                                    </FormControl>
                                    </FormItem>
                                )}
                                />
                            <FormField
                                control={control}
                                name="customerPhone"
                                render={({ field }) => (
                                    <FormItem>
                                    <FormLabel>Customer Phone</FormLabel>
                                    <FormControl>
                                        <Input {...field} disabled />
                                    </FormControl>
                                    </FormItem>
                                )}
                            />
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                             <FormField
                                control={control}
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
                                control={control}
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
                                control={control}
                                name="branch"
                                render={({ field }) => (
                                    <FormItem>
                                    <FormLabel>Branch</FormLabel>
                                    <FormControl>
                                        <Input {...field} placeholder="e.g. Nairobi Central" />
                                    </FormControl>
                                    <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <FormField
                                control={control}
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
                                control={control}
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
                                control={control}
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
                                control={control}
                                name="authorisedBy"
                                render={({ field }) => (
                                    <FormItem>
                                    <FormLabel>Authorised By</FormLabel>
                                    <FormControl>
                                        <Input {...field} placeholder="Enter name of authoriser" />
                                    </FormControl>
                                    <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>

                         <FormField
                            control={control}
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

                        <DialogFooter>
                            <Button type="button" variant="outline" onClick={() => setBookingDialogOpen(false)}>
                                Cancel
                            </Button>
                            <Button type="submit" disabled={isSubmitting}>
                                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                Save Booking
                            </Button>
                        </DialogFooter>
                    </form>
                  </Form>
                </DialogContent>
            </Dialog>
          </Tabs>
      )}
    </UnifiedDashboardLayout>
  );
}
