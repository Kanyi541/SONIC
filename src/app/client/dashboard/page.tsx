"use client";

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import UnifiedDashboardLayout from '@/components/dashboard/unified-dashboard-layout';
import { Car, FilePlus, Hourglass, CheckCircle, PlusCircle, User, Book, DollarSign, LifeBuoy } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from '@/hooks/use-toast';
import { db } from '@/lib/firebase';
import { collection, addDoc, onSnapshot } from "firebase/firestore";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/table";

interface Customer {
    id: string;
    name: string;
    email: string;
    phone: string;
}

export default function ClientDashboardPage() {
    const { toast } = useToast();
    const [isAddCustomerOpen, setAddCustomerOpen] = useState(false);
    const [customers, setCustomers] = useState<Customer[]>([]);
    
    const stats = {
        allCars: 12,
        newRequests: 2,
        pendingValuation: 3,
        pendingApproval: 1,
    };
    
    useEffect(() => {
        const unsubscribe = onSnapshot(collection(db, "customers"), (querySnapshot) => {
            const customersData: Customer[] = [];
            querySnapshot.forEach((doc) => {
                customersData.push({ id: doc.id, ...doc.data() } as Customer);
            });
            setCustomers(customersData);
        });
        return () => unsubscribe();
    }, []);
    
    const handleAddCustomer = async (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        const form = event.currentTarget;
        const name = (form.elements.namedItem('name') as HTMLInputElement).value;
        const email = (form.elements.namedItem('email') as HTMLInputElement).value;
        const phone = (form.elements.namedItem('phone') as HTMLInputElement).value;
        const password = (form.elements.namedItem('password') as HTMLInputElement).value;

        try {
            await addDoc(collection(db, "customers"), {
                name,
                email,
                phone,
                password,
            });

            setAddCustomerOpen(false);
            form.reset();
            toast({ title: "Customer Added", description: `${name} has been successfully added.` });
        } catch (error: any) {
            console.error("Error adding customer: ", error);
            toast({
                variant: "destructive",
                title: "Failed to Add Customer",
                description: "An error occurred while adding the customer.",
            });
        }
    };


    return (
        <UnifiedDashboardLayout
            title="Client Dashboard"
            userRole="Client"
            userEmail="client@example.com"
            menuItems={[
                { name: 'Dashboard', view: 'dashboard' },
                { name: 'Bookings', view: 'bookings', icon: <Book /> },
                { name: 'Invoices', view: 'invoices', icon: <DollarSign /> },
                { name: 'Support', view: 'support', icon: <LifeBuoy /> },
            ]}
        >
            {(activeView) => (
                <>
                    {activeView === 'dashboard' && (
                        <div>
                             <div className="flex items-center justify-between mb-8">
                                <div>
                                    <h2 className="text-3xl font-bold tracking-tight">Dashboard</h2>
                                    <p className="text-muted-foreground">Overview of your vehicle assessments.</p>
                                </div>
                                <Dialog open={isAddCustomerOpen} onOpenChange={setAddCustomerOpen}>
                                    <DialogTrigger asChild>
                                        <Button>
                                            <PlusCircle className="mr-2" />
                                            Add New Customer
                                        </Button>
                                    </DialogTrigger>
                                    <DialogContent className="sm:max-w-[425px]">
                                        <DialogHeader>
                                            <DialogTitle>Add New Customer</DialogTitle>
                                            <DialogDescription>
                                                Fill in the details below to create a new customer account.
                                            </DialogDescription>
                                        </DialogHeader>
                                        <form onSubmit={handleAddCustomer} className="grid gap-4 py-4">
                                            <div className="grid grid-cols-4 items-center gap-4">
                                                <Label htmlFor="name" className="text-right">Name</Label>
                                                <Input id="name" name="name" className="col-span-3" required />
                                            </div>
                                            <div className="grid grid-cols-4 items-center gap-4">
                                                <Label htmlFor="email" className="text-right">Email</Label>
                                                <Input id="email" name="email" type="email" className="col-span-3" required />
                                            </div>
                                            <div className="grid grid-cols-4 items-center gap-4">
                                                <Label htmlFor="phone" className="text-right">Phone</Label>
                                                <Input id="phone" name="phone" className="col-span-3" />
                                            </div>
                                            <div className="grid grid-cols-4 items-center gap-4">
                                                <Label htmlFor="password" className="text-right">Password</Label>
                                                <Input id="password" name="password" type="password" className="col-span-3" required />
                                            </div>
                                            <DialogFooter>
                                                <Button type="submit">Create Customer</Button>
                                            </DialogFooter>
                                        </form>
                                    </DialogContent>
                                </Dialog>
                            </div>
                            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
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
                        </div>
                    )}
                    {activeView === 'bookings' && (
                        <Card>
                            <CardHeader>
                                <CardTitle>Bookings</CardTitle>
                                <CardDescription>All your customer bookings.</CardDescription>
                            </CardHeader>
                            <CardContent>
                                 <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Customer Name</TableHead>
                                            <TableHead>Email</TableHead>
                                            <TableHead>Phone</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {customers.map(customer => (
                                            <TableRow key={customer.id}>
                                                <TableCell className="font-medium flex items-center gap-3">
                                                    <div className="p-2 bg-muted rounded-full">
                                                        <User className="h-5 w-5 text-primary" />
                                                    </div>
                                                    {customer.name}
                                                </TableCell>
                                                <TableCell>{customer.email}</TableCell>
                                                <TableCell>{customer.phone}</TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </CardContent>
                        </Card>
                    )}
                    {activeView === 'invoices' && (
                         <Card>
                            <CardHeader>
                                <CardTitle>Invoices</CardTitle>
                                <CardDescription>Your billing and payment history.</CardDescription>
                            </Header>
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
                            </Header>
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