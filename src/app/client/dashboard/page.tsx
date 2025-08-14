
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
import { collection, onSnapshot, addDoc, query, where } from "firebase/firestore";
import { useToast } from "@/hooks/use-toast";
import { Skeleton } from "@/components/ui/skeleton";
import { Loader2, PlusCircle, Printer } from "lucide-react";
import { carData } from "@/lib/car-data";
import { Form, FormField, FormItem, FormControl, FormMessage, FormLabel } from "@/components/ui/form";
import { Badge } from "@/components/ui/badge";
import { useRouter } from "next/navigation";


interface LoggedInUser {
    name: string;
    username: string;
    email: string;
    role: string;
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

export default function InsurerDashboardPage() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [isBookingDialogOpen, setBookingDialogOpen] = useState(false);
  const { toast } = useToast();
  const router = useRouter();
  const [loggedInUser, setLoggedInUser] = useState<LoggedInUser | null>(null);

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
    watch,
    formState: { isSubmitting },
  } = form;

  const selectedCarMake = watch("carMake");
  const carModels = selectedCarMake ? carData.find(make => make.brand === selectedCarMake)?.models || [] : [];

  useEffect(() => {
    const storedUser = sessionStorage.getItem('loggedInUser');
    if (storedUser) {
        setLoggedInUser(JSON.parse(storedUser));
    }
  }, []);

  useEffect(() => {
    if (loggedInUser) {
        setLoading(true);
        const bookingsQuery = query(collection(db, "bookings"), where("branch", "==", loggedInUser.name));
        const unsubscribe = onSnapshot(bookingsQuery, (snapshot) => {
            const bookingsData: Booking[] = [];
            snapshot.forEach((doc) => {
                bookingsData.push({ id: doc.id, ...doc.data() } as Booking);
            });
            setBookings(bookingsData);
            setLoading(false);
        });

        return () => unsubscribe();
    }
}, [loggedInUser]);
  
  const handleSaveBooking = async (data: BookingFormValues) => {
    if (!loggedInUser) {
        toast({ variant: "destructive", title: "Authentication Error", description: "You must be logged in to create a booking." });
        return;
    }
    
    try {
      const bookingNumber = `BKG-${Date.now()}-${Math.random().toString(36).substring(2, 7).toUpperCase()}`;
      await addDoc(collection(db, "bookings"), {
        ...data,
        bookingNumber,
        createdAt: new Date(),
        status: "Pending", // Initial status
        insurerId: loggedInUser.username, // Associate booking with the insurer's username
        branch: loggedInUser.name, // To maintain filter functionality
      });
      toast({
        title: "Booking Created",
        description: `Booking #${bookingNumber} for ${data.customerName} has been saved.`,
      });
      setBookingDialogOpen(false);
      form.reset();
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

  return (
    <UnifiedDashboardLayout
      title="CASA DASH"
      userRole={loggedInUser?.name || "Insurer"}
      userEmail={loggedInUser?.email || ""}
      menuItems={[
        { name: "Bookings", view: "bookings" },
      ]}
    >
      {(activeView) => (
          <Tabs value={activeView} className="w-full">
            <TabsContent value="bookings">
              <Card>
                <CardHeader>
                  <div className="flex justify-between items-center">
                    <div>
                      <CardTitle>All Bookings</CardTitle>
                      <CardDescription>View and manage all vehicle bookings.</CardDescription>
                    </div>
                     <Dialog open={isBookingDialogOpen} onOpenChange={setBookingDialogOpen}>
                        <DialogTrigger asChild>
                          <Button>
                            <PlusCircle className="mr-2" />
                            Add Booking
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="sm:max-w-4xl">
                          <DialogHeader>
                            <DialogTitle>Make a New Booking</DialogTitle>
                            <DialogDescription>
                              Fill out the form below to create a new booking.
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
                                                <Input {...field} placeholder="e.g. Jane Doe" />
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
                                                <Input {...field} placeholder="e.g. jane@example.com" type="email" />
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
                                                <Input {...field} placeholder="e.g. 0712345678" />
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
                                            <FormLabel>Broker</FormLabel>
                                            <FormControl>
                                                <Input {...field} placeholder="e.g. Resource Ins Agency" />
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
                  </div>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Booking ID</TableHead>
                        <TableHead className="hidden sm:table-cell">Customer</TableHead>
                        <TableHead className="hidden md:table-cell">Vehicle</TableHead>
                        <TableHead className="hidden sm:table-cell">Date</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="text-right">Action</TableHead>
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
            </TabsContent>

          </Tabs>
      )}
    </UnifiedDashboardLayout>
  );
}
