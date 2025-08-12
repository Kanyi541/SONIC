"use client";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import UnifiedDashboardLayout from '@/components/dashboard/unified-dashboard-layout';
import { Car, FilePlus, Hourglass, CheckCircle } from 'lucide-react';

export default function ClientDashboardPage() {
    // Mock data for display purposes
    const stats = {
        allCars: 12,
        newRequests: 2,
        pendingValuation: 3,
        pendingApproval: 1,
    };

    return (
        <UnifiedDashboardLayout
            title="Client Dashboard"
            userRole="Client"
            userEmail="client@example.com"
            menuItems={[
                { name: 'Dashboard', view: 'dashboard' },
                { name: 'My Projects', view: 'projects' },
                { name: 'Invoices', view: 'invoices' },
                { name: 'Support', view: 'support' },
            ]}
        >
            {(activeView) => (
                <>
                    {activeView === 'dashboard' && (
                        <div>
                            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-8">
                                <Card className="shadow-lg">
                                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                        <CardTitle className="text-sm font-medium">All Cars</CardTitle>
                                        <Car className="h-4 w-4 text-muted-foreground" />
                                    </CardHeader>
                                    <CardContent>
                                        <div className="text-2xl font-bold">{stats.allCars}</div>
                                        <p className="text-xs text-muted-foreground">Total cars registered</p>
                                    </CardContent>
                                </Card>
                                <Card className="shadow-lg">
                                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                        <CardTitle className="text-sm font-medium">New Requests</CardTitle>
                                        <FilePlus className="h-4 w-4 text-muted-foreground" />
                                    </CardHeader>
                                    <CardContent>
                                        <div className="text-2xl font-bold">+{stats.newRequests}</div>
                                        <p className="text-xs text-muted-foreground">Awaiting processing</p>
                                    </CardContent>
                                </Card>
                                <Card className="shadow-lg">
                                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                        <CardTitle className="text-sm font-medium">Pending Valuation</CardTitle>
                                        <Hourglass className="h-4 w-4 text-muted-foreground" />
                                    </CardHeader>
                                    <CardContent>
                                        <div className="text-2xl font-bold">{stats.pendingValuation}</div>
                                        <p className="text-xs text-muted-foreground">In valuation queue</p>
                                    </CardContent>
                                </Card>
                                <Card className="shadow-lg">
                                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                        <CardTitle className="text-sm font-medium">Pending Approval</CardTitle>
                                        <CheckCircle className="h-4 w-4 text-muted-foreground" />
                                    </CardHeader>
                                    <CardContent>
                                        <div className="text-2xl font-bold">{stats.pendingApproval}</div>
                                        <p className="text-xs text-muted-foreground">Awaiting your approval</p>
                                    </CardContent>
                                </Card>
                            </div>
                            <Card className="shadow-lg">
                                <CardHeader>
                                    <CardTitle className="font-headline text-3xl">Welcome, Client!</CardTitle>
                                    <CardDescription>Here is an overview of your account.</CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <p className="font-body">
                                        This is your dedicated dashboard. View your project status, invoices, and support tickets here.
                                    </p>
                                </CardContent>
                            </Card>
                        </div>
                    )}
                    {activeView === 'projects' && (
                        <Card>
                            <CardHeader>
                                <CardTitle>My Projects</CardTitle>
                                <CardDescription>All your active and past projects.</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <p className="text-muted-foreground">No active projects. Check back later for updates.</p>
                            </CardContent>
                        </Card>
                    )}
                    {activeView === 'invoices' && (
                         <Card>
                            <CardHeader>
                                <CardTitle>Invoices</CardTitle>
                                <CardDescription>Your billing and payment history.</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <p className="text-muted-foreground">No invoices found.</p>
                            </CardContent>
                        </Card>
                    )}
                    {activeView === 'support' && (
                        <Card>
                            <CardHeader>
                                <CardTitle>Support Tickets</CardTitle>
                                <CardDescription>Create and manage your support requests.</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <p className="text-muted-foreground">No support tickets.</p>
                            </CardContent>
                        </Card>
                    )}
                </>
            )}
        </UnifiedDashboardLayout>
    );
}
