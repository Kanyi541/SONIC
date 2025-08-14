
"use client";

import React, { useState, useEffect, useMemo } from "react";
import { useForm, Controller } from "react-hook-form";
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
import { collection, onSnapshot, addDoc, query, where, getDocs } from "firebase/firestore";
import { useToast } from "@/hooks/use-toast";
import { Skeleton } from "@/components/ui/skeleton";
import { Loader2, PlusCircle, Printer, User, UserPlus, Check, ChevronsUpDown, Save, Car, Building, Hash, Calendar, MessageSquare, UserCheck, Sheet, Pen, Search } from "lucide-react";
import { carData } from "@/lib/car-data";
import { Form, FormField, FormItem, FormControl, FormMessage, FormLabel } from "@/components/ui/form";
import { Badge } from "@/components/ui/badge";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";


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

const customerSchema = z.object({
  name: z.string().min(1, "Customer name is required"),
  email: z.string().email("Invalid email address"),
  phone: z.string().min(1, "Customer phone is required"),
});

type CustomerFormValues = z.infer<typeof customerSchema>;


const bookingSchema = z.object({
  customerId: z.string().min(1, "Please select a customer"),
  customerName: z.string(),
  customerEmail: z.string(),
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
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingCustomers, setLoadingCustomers] = useState(true);
  const [isBookingDialogOpen, setBookingDialogOpen] = useState(false);
  const [isCustomerDialogOpen, setCustomerDialogOpen] = useState(false);
  const [isComboboxOpen, setComboboxOpen] = useState(false);
  const { toast } = useToast();
  const router = useRouter();
  const [loggedInUser, setLoggedInUser] = useState<LoggedInUser | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [customerSearchTerm, setCustomerSearchTerm] = useState("");

  const customerForm = useForm<CustomerFormValues>({
      resolver: zodResolver(customerSchema),
      defaultValues: { name: "", email: "", phone: "" },
  });

  const bookingForm = useForm<BookingFormValues>({
    resolver: zodResolver(bookingSchema),
    defaultValues: {
        customerId: "",
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
  const selectedCustomerId = watchBooking("customerId");
  const carModels = useMemo(() => {
    return selectedCarMake ? carData.find(make => make.brand === selectedCarMake)?.models || [] : [];
  }, [selectedCarMake]);

  useEffect(() => {
    const storedUser = sessionStorage.getItem('loggedInUser');
    if (storedUser) {
        setLoggedInUser(JSON.parse(storedUser));
    }
  }, []);

  useEffect(() => {
    if (loggedInUser) {
        setLoading(true);
        const bookingsQuery = query(collection(db, "bookings"), where("insurerId", "==", loggedInUser.username));
        const bookingsUnsubscribe = onSnapshot(bookingsQuery, (snapshot) => {
            const bookingsData: Booking[] = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Booking));
            setBookings(bookingsData);
            setLoading(false);
        });

        setLoadingCustomers(true);
        const customersQuery = query(collection(db, "customers"), where("insurerId", "==", loggedInUser.username));
        const customersUnsubscribe = onSnapshot(customersQuery, (snapshot) => {
            const customersData: Customer[] = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Customer));
            setCustomers(customersData);
            setLoadingCustomers(false);
        });

        return () => {
            bookingsUnsubscribe();
            customersUnsubscribe();
        };
    }
}, [loggedInUser]);

  useEffect(() => {
      if (selectedCustomerId) {
          const selectedCustomer = customers.find(c => c.id === selectedCustomerId);
          if (selectedCustomer) {
              setBookingValue("customerName", selectedCustomer.name);
              setBookingValue("customerEmail", selectedCustomer.email);
              setBookingValue("customerPhone", selectedCustomer.phone);
          }
      }
  }, [selectedCustomerId, customers, setBookingValue]);

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

        const { customerId, ...bookingData } = data;
        const bookingNumber = `BKG-${Date.now()}-${Math.random().toString(36).substring(2, 7).toUpperCase()}`;

        await addDoc(collection(db, "bookings"), {
            ...bookingData,
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
      default:
        return "default";
    }
  };

  const filteredBookings = bookings.filter(booking => {
    const searchTermLower = searchTerm.toLowerCase();
    return (
        booking.bookingNumber.toLowerCase().includes(searchTermLower) ||
        booking.customerName.toLowerCase().includes(searchTermLower) ||
        `${booking.carMake} ${booking.carModel}`.toLowerCase().includes(searchTermLower) ||
        booking.plateNumber.toLowerCase().includes(searchTermLower)
    );
  });

  const filteredCustomers = customers.filter(customer => {
    const searchTermLower = customerSearchTerm.toLowerCase();
    return (
        customer.name.toLowerCase().includes(searchTermLower) ||
        customer.email.toLowerCase().includes(searchTermLower) ||
        customer.phone.toLowerCase().includes(searchTermLower)
    );
  });

  return (
    <UnifiedDashboardLayout
      title="CASA DASH"
      userRole={loggedInUser?.name || "Client"}
      userEmail={loggedInUser?.email || ""}
      menuItems={[
        { name: "Bookings", view: "bookings" },
        { name: "Manage Customers", view: "customers"},
      ]}
    >
      {(activeView) => (
          <Tabs value={activeView} className="w-full">
            <TabsContent value="bookings">
              <Card>
                <CardHeader>
                  <div className="flex justify-between items-center">
                    <div>
                      <CardTitle className="font-headline text-3xl text-primary">All Bookings</CardTitle>
                      <CardDescription>View and manage all vehicle bookings.</CardDescription>
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
                         <Dialog open={isBookingDialogOpen} onOpenChange={setBookingDialogOpen}>
                            <DialogTrigger asChild>
                              <Button>
                                <PlusCircle className="mr-2" />
                                Add Booking
                              </Button>
                            </DialogTrigger>
                            <DialogContent className="sm:max-w-3xl grid-rows-[auto_1fr_auto] max-h-[90vh]">
                              <DialogHeader>
                                <DialogTitle>Make a New Booking</DialogTitle>
                                <DialogDescription>
                                  Select a customer and fill out the form to create a new booking.
                                </DialogDescription>
                              </DialogHeader>
                               <div className="overflow-y-auto pr-6 -mr-6">
                                  <Form {...bookingForm}>
                                    <form onSubmit={handleBookingSubmit(handleSaveBooking)} className="space-y-4">
                                       <FormField
                                          control={bookingControl}
                                          name="customerId"
                                          render={({ field }) => (
                                            <FormItem className="flex flex-col">
                                              <FormLabel>Select Customer</FormLabel>
                                               <Popover open={isComboboxOpen} onOpenChange={setComboboxOpen}>
                                                <PopoverTrigger asChild>
                                                  <FormControl>
                                                    <Button
                                                      variant="outline"
                                                      role="combobox"
                                                      className={cn(
                                                        "w-full justify-between",
                                                        !field.value && "text-muted-foreground"
                                                      )}
                                                    >
                                                      {field.value
                                                        ? customers.find(
                                                            (customer) => customer.id === field.value
                                                          )?.name
                                                        : "Select a customer"}
                                                      <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                                    </Button>
                                                  </FormControl>
                                                </PopoverTrigger>
                                                <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
                                                  <Command>
                                                    <CommandInput placeholder="Search customer..." />
                                                    <CommandEmpty>No customer found.</CommandEmpty>
                                                    <CommandList>
                                                        <CommandGroup>
                                                        {customers.map((customer) => (
                                                            <CommandItem
                                                            value={customer.name}
                                                            key={customer.id}
                                                            onSelect={() => {
                                                                bookingForm.setValue("customerId", customer.id)
                                                                setComboboxOpen(false)
                                                            }}
                                                            >
                                                            <Check
                                                                className={cn(
                                                                "mr-2 h-4 w-4",
                                                                customer.id === field.value
                                                                    ? "opacity-100"
                                                                    : "opacity-0"
                                                                )}
                                                            />
                                                            {customer.name} ({customer.email})
                                                            </CommandItem>
                                                        ))}
                                                        </CommandGroup>
                                                    </CommandList>
                                                  </Command>
                                                </PopoverContent>
                                              </Popover>
                                              <FormMessage />
                                            </FormItem>
                                          )}
                                        />

                                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                            <FormField
                                                control={bookingControl}
                                                name="customerName"
                                                render={({ field }) => (
                                                    <FormItem>
                                                    <FormLabel>Customer Name</FormLabel>
                                                    <FormControl>
                                                        <Input {...field} readOnly placeholder="Selected customer name" />
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
                                                        <Input {...field} readOnly placeholder="Selected customer email" />
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
                                                        <Input {...field} readOnly placeholder="Selected customer phone" />
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
                                                        <Input {...field} placeholder="e.g. Nairobi" />
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
                      ) : filteredBookings.length > 0 ? (
                        filteredBookings.map((booking) => (
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

          </Tabs>
      )}
    </UnifiedDashboardLayout>
  );
}

    
