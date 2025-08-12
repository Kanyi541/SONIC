
"use client";

import React, { useState, useEffect } from "react";
import UnifiedDashboardLayout from "@/components/dashboard/unified-dashboard-layout";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/table";
import { db } from "@/lib/firebase";
import { collection, onSnapshot } from "firebase/firestore";
import { Skeleton } from "@/components/ui/skeleton";
import { BookMarked, Mail, Phone } from "lucide-react";

interface Customer {
  id: string;
  name: string;
  email: string;
  phone: string;
}

export default function ClientDashboardPage() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentView, setCurrentView] = useState("overview");

  useEffect(() => {
    // Only fetch customers when the bookings tab is active
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

      // Cleanup subscription on component unmount or when tab changes
      return () => unsubscribe();
    }
  }, [currentView]);

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
            { name: 'Overview', view: 'overview' },
            { name: 'Bookings', view: 'bookings' },
            { name: 'Invoices', view: 'invoices' },
            { name: 'Support', view: 'support' },
        ]}
    >
      {(activeView) => {
         // Use effect to sync state from parent to avoid render-time setState calls.
        useEffect(() => {
          setCurrentView(activeView);
        }, [activeView]);

        return (
          <Tabs value={activeView} className="w-full">
            {/* Overview Tab */}
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

            {/* Bookings Tab */}
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
                                <Button size="sm">
                                  <BookMarked className="mr-2"/>
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

            {/* Invoices Tab */}
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

            {/* Support Tab */}
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
