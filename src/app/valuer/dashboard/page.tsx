"use client";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import UnifiedDashboardLayout from '@/components/dashboard/unified-dashboard-layout';

export default function ValuerDashboardPage() {
    return (
        <UnifiedDashboardLayout
            title="CASA DASH"
            userRole="Valuer"
            userEmail="valuer@example.com"
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
                                <CardTitle className="font-headline text-3xl">Welcome, Valuer!</CardTitle>
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
