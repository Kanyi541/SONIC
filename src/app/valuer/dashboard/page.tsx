
"use client";

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import UnifiedDashboardLayout from '@/components/dashboard/unified-dashboard-layout';

interface LoggedInUser {
    name: string;
    username: string;
    email: string;
    role: string;
}

export default function ValuerDashboardPage() {
    const [loggedInUser, setLoggedInUser] = useState<LoggedInUser | null>(null);

    useEffect(() => {
        const storedUser = sessionStorage.getItem('loggedInUser');
        if (storedUser) {
            setLoggedInUser(JSON.parse(storedUser));
        }
    }, []);

    return (
        <UnifiedDashboardLayout
            title="CASA DASH"
            userRole={loggedInUser?.name || "Valuer"}
            userEmail={loggedInUser?.email || ""}
            menuItems={[
                { name: 'Dashboard', view: 'dashboard' },
                { name: 'Assigned Valuations', view: 'valuations' },
            ]}
        >
            {(activeView) => (
                <>
                    {activeView === 'dashboard' && (
                        <Card className="shadow-lg">
                            <CardHeader>
                                <CardTitle className="font-headline text-3xl">Welcome, {loggedInUser?.name || 'Valuer'}!</CardTitle>
                                <CardDescription>Here are the valuations assigned to you.</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <p className="font-body">
                                    Review your assigned tasks, submit valuation reports, and manage your schedule from this panel.
                                </p>
                            </CardContent>
                        </Card>
                    )}
                    {activeView === 'valuations' && (
                        <Card>
                            <CardHeader>
                                <CardTitle>Assigned Valuations</CardTitle>
                                <CardDescription>All valuations assigned to you.</CardDescription>
                            </CardHeader>
                            <CardContent>
                                 <p className="text-muted-foreground">You have no pending valuations at the moment.</p>
                            </CardContent>
                        </Card>
                    )}
                </>
            )}
        </UnifiedDashboardLayout>
    );
}
