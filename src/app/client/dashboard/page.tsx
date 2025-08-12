
"use client";

import React, { useState, useEffect } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import UnifiedDashboardLayout from "@/components/dashboard/unified-dashboard-layout";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
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
import { collection, onSnapshot, addDoc } from "firebase/firestore";
import { useToast } from "@/hooks/use-toast";
import { Skeleton } from "@/components/ui/skeleton";
import { BookMarked, Loader2 } from "lucide-react";
import { carData } from "@/lib/car-data";

interface Customer {
  id: string;
  name: string;
  email: string;
  phone: string;
}

const bookingSchema = z.object({
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
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentView, setCurrentView] = useState("overview");
  const [isBookingDialogOpen, setBookingDialogOpen] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const { toast } = useToast();

  const {
    handleSubmit,
    control,
    reset,
    watch,
    formState: { isSubmitting },
  } = useForm<BookingFormValues>({
    resolver: zodResolver(bookingSchema),
  });

  const selectedCarMake = watch("carMake");
  const carModels = selectedCarMake ? carData.find(make => make.brand === selectedCarMake)?.models || [] : [];

  useEffect(() => {
    if (currentView === "bookings") {
      setLoading(true);
      const unsubscribe = onSnapshot(collection(db, "customers"), (querySnapshot) => {
        const customersData: Customer[] = [];
        querySnapshot.forEach((doc) => {
          customersData.push({ id: doc.id, ...doc.data() } as Customer);
        });
        setCustomers(customersData);
        setLoading(false);
      });
      return () => unsubscribe();
    }
  }, [currentView]);
  
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
      {(activeView) => {
        useEffect(() => {
          setCurrentView(activeView);
        }, [activeView]);

        return (
          <Tabs value={activeView} className="w-full">
            <TabsContent value="overview">
              <Card>
                <CardHeader>
                  <CardTitle>Welcome Back!</CardTitle>
                  <CardDescription>
                    Here’s what’s happening with your account today.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">
                    Your dashboard overview will appear here.
                  </p>
                </CardContent>
              </Card>
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
                                <BookMarked className="mr-2" />
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
          </Tabs>
        );
      }}
    </UnifiedDashboardLayout>
  );
}
