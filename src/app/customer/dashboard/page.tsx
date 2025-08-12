import DashboardLayout from '@/components/dashboard/dashboard-layout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';

export default function CustomerDashboardPage() {
    return (
        <DashboardLayout title="Customer Dashboard">
            <Card className="shadow-lg">
                <CardHeader>
                    <CardTitle className="font-headline text-3xl">Welcome, Customer!</CardTitle>
                    <CardDescription>Manage your profile and view your history.</CardDescription>
                </CardHeader>
                <CardContent>
                    <p className="font-body">
                        Thank you for being a valued customer. Here you can find your order history and manage your account details.
                    </p>
                     <div className="mt-6 p-4 bg-muted rounded-lg">
                        <h3 className="font-headline text-lg font-semibold mb-2">Order History</h3>
                        <p className="text-muted-foreground">You have not placed any orders yet.</p>
                    </div>
                </CardContent>
            </Card>
        </DashboardLayout>
    );
}
