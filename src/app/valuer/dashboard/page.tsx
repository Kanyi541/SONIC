import DashboardLayout from '@/components/dashboard/dashboard-layout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';

export default function ValuerDashboardPage() {
    return (
        <DashboardLayout title="Valuer Dashboard">
            <Card className="shadow-lg">
                <CardHeader>
                    <CardTitle className="font-headline text-3xl">Welcome, Valuer!</CardTitle>
                    <CardDescription>Here are the valuations assigned to you.</CardDescription>
                </CardHeader>
                <CardContent>
                    <p className="font-body">
                        Review your assigned tasks, submit valuation reports, and manage your schedule from this panel.
                    </p>
                    <div className="mt-6 p-4 bg-muted rounded-lg">
                        <h3 className="font-headline text-lg font-semibold mb-2">Assigned Valuations</h3>
                        <p className="text-muted-foreground">You have no pending valuations at the moment.</p>
                    </div>
                </CardContent>
            </Card>
        </DashboardLayout>
    );
}
