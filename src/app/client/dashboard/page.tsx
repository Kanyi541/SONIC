
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import DashboardLayout from '@/components/dashboard/unified-dashboard-layout';

export default function ClientDashboardPage() {
    return (
        <DashboardLayout
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
        </DashboardLayout>
    );
}
