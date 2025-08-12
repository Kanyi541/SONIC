"use client";

import React, { useState } from "react";
import UnifiedDashboardLayout from "@/components/dashboard/unified-dashboard-layout";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function ClientDashboardPage() {
  const [activeTab, setActiveTab] = useState("overview");

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
      {(activeView) => (
        <Tabs value={activeView} onValueChange={setActiveTab} className="w-full">
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
                      <Button>Make a Booking</Button>
                  </div>
              </CardHeader>
              <CardContent>
                  <div className="mb-4">
                      <Input
                          placeholder="Search by name, email, or phone..."
                      />
                  </div>
                  <p className="text-muted-foreground">No bookings found.</p>
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
      )}
    </UnifiedDashboardLayout>
  );
}
