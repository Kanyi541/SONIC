
"use client";

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import UnifiedDashboardLayout from '@/components/dashboard/unified-dashboard-layout';
import { collection, onSnapshot, query, where, doc, getDoc } from "firebase/firestore";
import { db } from '@/lib/firebase';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Car, Clock, CheckCircle, Hourglass } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Printer } from 'lucide-react';


interface LoggedInUser {
    name: string;
    username: string;
    email: string;
    role: string;
}

interface Booking {
  id: string;
  bookingNumber: string;
  customerName: string;
  plateNumber: string;
  carMake: string;
  carModel: string;
  createdAt: any;
  status: string;
}

export default function ValuerDashboardPage() {
    const [loggedInUser, setLoggedInUser = useState<LoggedInUser | null>(null);
    const [bookings, setBookings] = useState<Booking[]>([]);
    const [loading, setLoading] = useState(true);
    const router = useRouter();

    useEffect(() => {
        const storedUserString = sessionStorage.getItem('loggedInUser');
        if (storedUserString) {
            const user = JSON.parse(storedUserString);
            setLoggedInUser(user);
        }
    }, []);

    useEffect(() => {
        if (loggedInUser) {
            setLoading(true);
            const bookingsUnsubscribe = onSnapshot(collection(db, "bookings"), (snapshot) => {
                const bookingsData: Booking[] = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Booking));
                setBookings(bookingsData);
                setLoading(false);
            });

            return () => bookingsUnsubscribe();
        } else {
            // If there's no logged-in user, we shouldn't be loading.
            setLoading(false);
        }
    }, [loggedInUser]);

    const getStatusVariant = (status: string): "default" | "secondary" | "destructive" | "outline" => {
        switch (status) {
            case "Pending": return "secondary";
            case "Pending Valuation": return "outline";
            case "Pending Approval": return "destructive";
            case "Completed": return "default";
            default: return "default";
        }
    };

    const stats = {
        total: bookings.length,
        pendingValuation: bookings.filter(b => b.status === 'Pending Valuation').length,
        pendingApproval: bookings.filter(b => b.status === 'Pending Approval').length,
        completed: bookings.filter(b => b.status === 'Completed').length,
    };
    
    return (
        <UnifiedDashboardLayout
            title="CASA DASH"
            userRole={loggedInUser?.name || "Valuer"}
            userEmail={loggedInUser?.email || ""}
            menuItems={[
                { name: 'Dashboard', view: 'dashboard' },
                { name: 'All Valuations', view: 'valuations' },
            ]}
        >
            {(activeView) => (
                <>
                    {activeView === 'dashboard' && (
                        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                            <Card>
                                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                    <CardTitle className="text-sm font-medium">All Cars</CardTitle>
                                    <Car className="h-4 w-4 text-muted-foreground" />
                                </CardHeader>
                                <CardContent>
                                    <div className="text-2xl font-bold">{loading ? <Skeleton className="h-8 w-16" /> : stats.total}</div>
                                    <p className="text-xs text-muted-foreground">Total registered plates</p>
                                </CardContent>
                            </Card>
                            <Card>
                                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                    <CardTitle className="text-sm font-medium">Pending Valuation</CardTitle>
                                    <Clock className="h-4 w-4 text-muted-foreground" />
                                </CardHeader>
                                <CardContent>
                                    <div className="text-2xl font-bold">{loading ? <Skeleton className="h-8 w-16" /> : stats.pendingValuation}</div>
                                    <p className="text-xs text-muted-foreground">Awaiting valuation reports</p>
                                </CardContent>
                            </Card>
                             <Card>
                                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                    <CardTitle className="text-sm font-medium">Pending Approval</CardTitle>
                                    <Hourglass className="h-4 w-4 text-muted-foreground" />
                                </CardHeader>
                                <CardContent>
                                    <div className="text-2xl font-bold">{loading ? <Skeleton className="h-8 w-16" /> : stats.pendingApproval}</div>
                                    <p className="text-xs text-muted-foreground">Awaiting insurer approval</p>
                                </CardContent>
                            </Card>
                            <Card>
                                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                    <CardTitle className="text-sm font-medium">Approved</CardTitle>
                                    <CheckCircle className="h-4 w-4 text-muted-foreground" />
                                </CardHeader>
                                <CardContent>
                                    <div className="text-2xl font-bold">{loading ? <Skeleton className="h-8 w-16" /> : stats.completed}</div>
                                    <p className="text-xs text-muted-foreground">Completed and approved</p>
                                </CardContent>
                            </Card>
                        </div>
                    )}
                    {(activeView === 'dashboard' || activeView === 'valuations') && (
                        <Card className="mt-8">
                            <CardHeader>
                                <CardTitle>All Bookings</CardTitle>
                                <CardDescription>A list of all registered vehicle valuations.</CardDescription>
                            </CardHeader>
                            <CardContent>
                                 <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Booking ID</TableHead>
                                            <TableHead className="hidden sm:table-cell">Customer</TableHead>
                                            <TableHead className="hidden md:table-cell">Vehicle</TableHead>
                                            <TableHead className="hidden sm:table-cell">Date</TableHead>
                                            <TableHead>Status</TableHead>
                                            <TableHead className="text-right">Action</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                    {loading ? (
                                        Array.from({ length: 5 }).map((_, index) => (
                                        <TableRow key={index}>
                                            <TableCell><Skeleton className="h-5 w-24" /></TableCell>
                                            <TableCell className="hidden sm:table-cell"><Skeleton className="h-5 w-32" /></TableCell>
                                            <TableCell className="hidden md:table-cell"><Skeleton className="h-5 w-40" /></TableCell>
                                            <TableCell className="hidden sm:table-cell"><Skeleton className="h-5 w-24" /></TableCell>
                                            <TableCell><Skeleton className="h-6 w-20" /></TableCell>
                                            <TableCell className="text-right"><Skeleton className="h-8 w-28 ml-auto" /></TableCell>
                                        </TableRow>
                                        ))
                                    ) : bookings.length > 0 ? (
                                        bookings.map((booking) => (
                                        <TableRow key={booking.id}>
                                            <TableCell className="font-mono text-xs truncate">{booking.bookingNumber}</TableCell>
                                            <TableCell className="font-medium hidden sm:table-cell">{booking.customerName}</TableCell>
                                            <TableCell className="hidden md:table-cell">{`${booking.carMake} ${booking.carModel} (${booking.plateNumber})`}</TableCell>
                                            <TableCell className="hidden sm:table-cell">{new Date(booking.createdAt?.toDate()).toLocaleDateString()}</TableCell>
                                            <TableCell>
                                            <Badge variant={getStatusVariant(booking.status)}>{booking.status}</Badge>
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() => router.push(`/client/booking-report?id=${booking.id}`)}
                                                >
                                                <Printer className="mr-2 h-4 w-4" />
                                                <span className="hidden sm:inline">View</span>
                                                </Button>
                                            </TableCell>
                                        </TableRow>
                                        ))
                                    ) : (
                                        <TableRow>
                                        <TableCell colSpan={6} className="text-center h-24">
                                            No bookings found.
                                        </TableCell>
                                        </TableRow>
                                    )}
                                    </TableBody>
                                </Table>
                            </CardContent>
                        </Card>
                    )}
                </>
            )}
        </UnifiedDashboardLayout>
    );
}

  