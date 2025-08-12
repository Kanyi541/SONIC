
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
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { db } from "@/lib/firebase";
import { collection, onSnapshot, addDoc, query, getDocs, orderBy, where, Timestamp } from "firebase/firestore";
import { useToast } from "@/hooks/use-toast";
import { Skeleton } from "@/components/ui/skeleton";
import { BookMarked, Loader2, Car, FilePlus, Hourglass, CheckCircle, PlusCircle } from "lucide-react";
import { carData } from "@/lib/car-data";
import { Form, FormField, FormItem, FormControl, FormMessage, FormLabel } from "@/components/ui/form";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";

interface Customer {
    id: string;
    name: string;
    email: string;
    phone: string;
    createdAt?: Timestamp;
    hasBooking?: boolean;
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

const bookingSchema = z.object({
  customerName: z.string().min(1, "Customer name is required"),
  customerEmail: z.string().email("Invalid email address"),
  customerPhone: z.string().min(1, "Customer phone is required"),
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
  const [customersLoading, setCustomersLoading] = useState(true);
  const [isBookingDialogOpen, setBookingDialogOpen] = useState(false);
  const { toast } = useToast();
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [isAddCustomerDialogOpen, setAddCustomerDialogOpen] = useState(false);

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
    setValue,
    formState: { isSubmitting },
  } = form;

  const selectedCarMake = watch("carMake");
  const carModels = selectedCarMake ? carData.find(make => make.brand === selectedCarMake)?.models || [] : [];

  useEffect(() => {
    setCustomersLoading(true);
    const customersQuery = query(collection(db, "customers"));

    const unsubCustomers = onSnapshot(customersQuery, (customersSnapshot) => {
        const customersData: Customer[] = [];
        customersSnapshot.forEach((doc) => {
            customersData.push({ id: doc.id, ...doc.data() } as Customer);
        });
        
        const bookingsQuery = query(collection(db, "bookings"));
        onSnapshot(bookingsQuery, (bookingsSnapshot) => {
            const bookingsData: Booking[] = [];
            bookingsSnapshot.forEach((doc) => {
                bookingsData.push({ id: doc.id, ...doc.data() } as Booking);
            });
            setBookings(bookingsData);
            setLoading(false);

            const bookedEmails = new Set(bookingsData.map(b => b.customerEmail));
            const updatedCustomers = customersData.map(c => ({
                ...c,
                hasBooking: bookedEmails.has(c.email)
            })).sort((a, b) => (b.createdAt?.toMillis() || 0) - (a.createdAt?.toMillis() || 0));
            setCustomers(updatedCustomers);
            setCustomersLoading(false);
        });
    });

    return () => {
        unsubCustomers();
    };
}, []);


  useEffect(() => {
    if (selectedCustomer) {
        setValue("customerName", selectedCustomer.name);
        setValue("customerEmail", selectedCustomer.email);
        setValue("customerPhone", selectedCustomer.phone);
    } else {
        reset({
            customerName: "", customerEmail: "", customerPhone: "",
            plateNumber: "", policyNumber: "", carMake: "", carModel: "",
            branch: "", maxValuationDays: "", authorisedBy: "", comments: ""
        });
    }
  }, [selectedCustomer, setValue, reset]);
  
  const handleOpenBookingDialog = (customer: Customer) => {
    setSelectedCustomer(customer);
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
      setSelectedCustomer(null);
    } catch (error) {
      console.error("Error creating booking: ", error);
      toast({
        variant: "destructive",
        title: "Booking Failed",
        description: "An error occurred while creating the booking.",
      });
    }
  };

  const handleAddCustomer = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = event.currentTarget;
    const name = (form.elements.namedItem('name') as HTMLInputElement).value;
    const email = (form.elements.namedItem('email') as HTMLInputElement).value;
    const phone = (form.elements.namedItem('phone') as HTMLInputElement).value;
    const password = (form.elements.namedItem('password') as HTMLInputElement).value;
    
    try {
      await addDoc(collection(db, "customers"), {
        name,
        email,
        phone,
        password,
        createdAt: new Date(),
      });

      setAddCustomerDialogOpen(false);
      form.reset();
      toast({ title: "Customer Added", description: `${name} has been successfully added.`});
    } catch (error: any) {
       console.error("Error adding customer: ", error);
       toast({
         variant: "destructive",
         title: "Failed to Add Customer",
         description: "An error occurred while adding the customer.",
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
               <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                  <div>
                    <CardTitle>Customers</CardTitle>
                    <CardDescription>Select a customer to make a new booking.</CardDescription>
                  </div>
                  <Dialog open={isAddCustomerDialogOpen} onOpenChange={setAddCustomerDialogOpen}>
                    <DialogTrigger asChild>
                      <Button>
                        <PlusCircle className="mr-2" />
                        Add Customer
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-[425px]">
                      <DialogHeader>
                        <DialogTitle>Add New Customer</DialogTitle>
                        <DialogDescription>
                          Fill in the details below to create a new customer.
                        </DialogDescription>
                      </DialogHeader>
                      <form onSubmit={handleAddCustomer} className="grid gap-4 py-4">
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
                        <DialogFooter>
                          <Button type="submit">Create Customer</Button>
                        </DialogFooter>
                      </form>
                    </DialogContent>
                  </Dialog>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Customer Name</TableHead>
                        <TableHead>Email</TableHead>
                        <TableHead>Phone</TableHead>
                        <TableHead className="text-right">Action</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {customersLoading ? (
                        Array.from({ length: 5 }).map((_, index) => (
                          <TableRow key={index}>
                            <TableCell><Skeleton className="h-5 w-32" /></TableCell>
                            <TableCell><Skeleton className="h-5 w-40" /></TableCell>
                            <TableCell><Skeleton className="h-5 w-32" /></TableCell>
                            <TableCell className="text-right"><Skeleton className="h-8 w-28 ml-auto" /></TableCell>
                          </TableRow>
                        ))
                      ) : customers.length > 0 ? (
                        customers.map((customer) => (
                          <TableRow key={customer.id}>
                            <TableCell className="font-medium">{customer.name}</TableCell>
                            <TableCell>{customer.email}</TableCell>
                            <TableCell>{customer.phone}</TableCell>
                            <TableCell className="text-right">
                              <Button
                                onClick={() => handleOpenBookingDialog(customer)}
                                disabled={customer.hasBooking}
                                size="sm"
                              >
                                {customer.hasBooking ? (
                                  <>
                                    <CheckCircle className="mr-2 h-4 w-4" />
                                    Booked
                                  </>
                                ) : (
                                  'Make Booking'
                                )}
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

            <TabsContent value="bookings">
              <Card>
                <CardHeader>
                  <div className="flex justify-between items-center">
                    <div>
                      <CardTitle>All Bookings</CardTitle>
                      <CardDescription>View and manage all vehicle bookings.</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Booking ID</TableHead>
                        <TableHead>Customer</TableHead>
                        <TableHead>Vehicle</TableHead>
                        <TableHead>Date</TableHead>
                        <TableHead className="text-right">Status</TableHead>
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
                            <TableCell className="text-right"><Skeleton className="h-6 w-20 ml-auto" /></TableCell>
                          </TableRow>
                        ))
                      ) : bookings.length > 0 ? (
                        bookings.map((booking) => (
                          <TableRow key={booking.id}>
                            <TableCell className="font-mono text-xs">{booking.bookingNumber}</TableCell>
                            <TableCell className="font-medium">{booking.customerName}</TableCell>
                            <TableCell>{`${booking.carMake} ${booking.carModel} (${booking.plateNumber})`}</TableCell>
                            <TableCell>{new Date(booking.createdAt?.toDate()).toLocaleDateString()}</TableCell>
                            <TableCell className="text-right">
                               <Badge variant={getStatusVariant(booking.status)}>{booking.status}</Badge>
                            </TableCell>
                          </TableRow>
                        ))
                      ) : (
                        <TableRow>
                          <TableCell colSpan={5} className="text-center h-24">
                            No bookings found.
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

             <Dialog open={isBookingDialogOpen} onOpenChange={(isOpen) => {
                 setBookingDialogOpen(isOpen);
                 if (!isOpen) {
                     setSelectedCustomer(null);
                 }
             }}>
                <DialogContent className="sm:max-w-4xl">
                  <DialogHeader>
                    <DialogTitle>Make a New Booking</DialogTitle>
                    <DialogDescription>
                      Fill out the form below to create a new booking for {selectedCustomer?.name}.
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
                                        <Input {...field} placeholder="e.g. Jane Doe" readOnly disabled />
                                    </FormControl>
                                    <FormMessage />
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
                                        <Input {...field} placeholder="e.g. jane@example.com" type="email" readOnly disabled />
                                    </FormControl>
                                     <FormMessage />
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
                                        <Input {...field} placeholder="e.g. 0712345678" readOnly disabled />
                                    </FormControl>
                                     <FormMessage />
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

    