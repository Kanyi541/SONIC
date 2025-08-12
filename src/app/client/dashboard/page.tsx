import DashboardLayout from '@/components/dashboard/dashboard-layout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';

export default function ClientDashboardPage() {
    return (
        <DashboardLayout title="Client Dashboard">
            <Card className="shadow-lg">
                <CardHeader>
                    <CardTitle className="font-headline text-3xl">Welcome, Client!</CardTitle>
                    <CardDescription>Here is an overview of your account.</CardDescription>
                </CardHeader>
                <CardContent>
                    <p className="font-body">
                        This is your dedicated dashboard. View your project status, invoices, and support tickets here.
                    </p>
                     <div className="mt-6 p-4 bg-muted rounded-lg">
                        <h3 className="font-headline text-lg font-semibold mb-2">Your Projects</h3>
                        <p className="text-muted-foreground">No active projects. Check back later for updates.</p>
                    </div>
                </CardContent>
            </Card>
        </DashboardLayout>
    );
}
