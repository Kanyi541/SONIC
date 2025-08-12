
"use client";

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import UnifiedDashboardLayout from '@/components/dashboard/unified-dashboard-layout';
import { collection, query, where, onSnapshot, DocumentData } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';

interface LoggedInUser {
    name: string;
    email: string;
    role: string;
}

interface Booking {
    id: string;
    bookingNumber: string;
    carMake: string;
    carModel: string;
    plateNumber: string;
    createdAt: any;
    status: string;
}

export default function CustomerDashboardPage() {
    const [user, setUser] = useState<LoggedInUser | null>(null);
    const [bookings, setBookings] = useState<Booking[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const storedUser = sessionStorage.getItem('loggedInUser');
        if (storedUser) {
            const parsedUser = JSON.parse(storedUser);
            setUser(parsedUser);

            const bookingsQuery = query(collection(db, "bookings"), where("customerName", "==", parsedUser.name));
            const unsubscribe = onSnapshot(bookingsQuery, (snapshot) => {
                const bookingsData: Booking[] = [];
                snapshot.forEach((doc: DocumentData) => {
                    bookingsData.push({ id: doc.id, ...doc.data() } as Booking);
                });
                setBookings(bookingsData);
                setLoading(false);
            }, (error) => {
                console.error("Error fetching bookings:", error);
                setLoading(false);
            });

            return () => unsubscribe();
        } else {
             setLoading(false);
        }
    }, []);

    const getStatusVariant = (status: string): "default" | "secondary" | "destructive" | "outline" => {
        switch (status) {
            case "Pending": return "secondary";
            case "Pending Valuation": return "outline";
            case "Pending Approval": return "destructive";
            case "Completed": return "default";
            default: return "default";
        }
    };

    return (
        <UnifiedDashboardLayout
            title="Customer Dashboard"
            userRole={user?.role || "Customer"}
            userEmail={user?.email || ""}
            menuItems={[
                { name: 'My Bookings', view: 'bookings' },
                { name: 'My Profile', view: 'profile' },
            ]}
        >
            {(activeView) => (
                <>
                    {activeView === 'bookings' && (
                        <Card className="shadow-lg">
                            <CardHeader>
                                <CardTitle className="font-headline text-3xl">Welcome, {user?.name}!</CardTitle>
                                <CardDescription>Here are your recent bookings.</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Booking ID</TableHead>
                                            <TableHead>Vehicle</TableHead>
                                            <TableHead>Date</TableHead>
                                            <TableHead>Status</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {loading ? (
                                             Array.from({ length: 3 }).map((_, index) => (
                                                <TableRow key={index}>
                                                    <TableCell><Skeleton className="h-5 w-24" /></TableCell>
                                                    <TableCell><Skeleton className="h-5 w-40" /></TableCell>
                                                    <TableCell><Skeleton className="h-5 w-24" /></TableCell>
                                                    <TableCell><Skeleton className="h-6 w-20" /></TableCell>
                                                </TableRow>
                                            ))
                                        ) : bookings.length > 0 ? (
                                            bookings.map((booking) => (
                                                <TableRow key={booking.id}>
                                                    <TableCell className="font-mono text-xs">{booking.bookingNumber}</TableCell>
                                                    <TableCell>{`${booking.carMake} ${booking.carModel} (${booking.plateNumber})`}</TableCell>
                                                    <TableCell>{new Date(booking.createdAt?.toDate()).toLocaleDateString()}</TableCell>
                                                    <TableCell>
                                                        <Badge variant={getStatusVariant(booking.status)}>{booking.status}</Badge>
                                                    </TableCell>
                                                </TableRow>
                                            ))
                                        ) : (
                                            <TableRow>
                                                <TableCell colSpan={4} className="h-24 text-center">
                                                    You have no bookings yet.
                                                </TableCell>
                                            </TableRow>
                                        )}
                                    </TableBody>
                                </Table>
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
        </UnifiedDashboardLayout>
    );
}
