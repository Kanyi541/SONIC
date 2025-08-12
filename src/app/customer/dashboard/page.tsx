
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import DashboardLayout from '@/components/dashboard/unified-dashboard-layout';

export default function CustomerDashboardPage() {
    return (
        <DashboardLayout
            title="Customer Dashboard"
            userRole="Customer"
            userEmail="customer@example.com"
            menuItems={[
                { name: 'Dashboard', view: 'dashboard' },
                { name: 'Order History', view: 'history' },
                { name: 'My Profile', view: 'profile' },
            ]}
        >
            {(activeView) => (
                <>
                    {activeView === 'dashboard' && (
                        <Card className="shadow-lg">
                            <CardHeader>
                                <CardTitle className="font-headline text-3xl">Welcome, Customer!</CardTitle>
                                <CardDescription>Manage your profile and view your history.</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <p className="font-body">
                                    Thank you for being a valued customer. Here you can find your order history and manage your account details.
                                </p>
                            </CardContent>
                        </Card>
                    )}
                    {activeView === 'history' && (
                         <Card>
                            <CardHeader>
                                <CardTitle>Order History</CardTitle>
                                <CardDescription>Your past orders.</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <p className="text-muted-foreground">You have not placed any orders yet.</p>
                            </CardContent>
                        </Card>
                    )}
                    {activeView === 'profile' && (
                        <Card>
                            <CardHeader>
                                <CardTitle>My Profile</CardTitle>
                                <CardDescription>Manage your account details.</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <p className="text-muted-foreground">Profile editing is not yet available.</p>
                            </CardContent>
                        </Card>
                    )}
                </>
            )}
        </DashboardLayout>
    );
}
