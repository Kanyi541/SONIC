
"use client";

import { useState, useEffect } from 'react';
import { doc, getDocs, collection, query, where } from "firebase/firestore";
import { db } from '@/lib/firebase';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from '@/components/ui/carousel';
import Image from 'next/image';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { XCircle } from 'lucide-react';

interface Valuation {
    id: string;
    bookingId: string;
    assessmentDate: any;
    assessmentValue: string;
    forcedValue: string;
    wsValue: string;
    rsValue: string;
    comments?: string;
    imageUrls: string[];
    valuedBy: string;
    valuedAt: any;
    status?: 'Approved' | 'Rejected';
    rejectionReason?: string;
}

interface Booking {
  id: string;
  bookingNumber: string;
  customerName: string;
  customerEmail: string;
  plateNumber: string;
  carMake: string;
  carModel: string;
  createdAt: any;
  status: string;
}

const ValuationReportView = ({ bookingId }: { bookingId: string }) => {
    const [valuation, setValuation] = useState<Valuation | null>(null);
    const [booking, setBooking] = useState<Booking | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchReports = async () => {
            if (!bookingId) return;
            setLoading(true);

            try {
                // Fetch Valuation
                const q = query(collection(db, "valuations"), where("bookingId", "==", bookingId));
                const valuationSnapshot = await getDocs(q);
                if (!valuationSnapshot.empty) {
                    const valuationDoc = valuationSnapshot.docs[0];
                    setValuation({ id: valuationDoc.id, ...valuationDoc.data() } as Valuation);
                }

                // Fetch Booking
                const bookingRef = doc(db, "bookings", bookingId);
                const bookingSnap = await getDocs(query(collection(db, "bookings"), where("__name__", "==", bookingId)));

                if (!bookingSnap.empty) {
                    const bookingDoc = bookingSnap.docs[0];
                    setBooking({ id: bookingDoc.id, ...bookingDoc.data() } as Booking);
                }

            } catch (error) {
                console.error("Error fetching reports:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchReports();
    }, [bookingId]);

    if (loading) {
        return (
            <div className="p-4 space-y-4">
                <Skeleton className="h-48 w-full" />
                <Skeleton className="h-32 w-full" />
                <Skeleton className="h-64 w-full" />
            </div>
        );
    }

    if (!valuation) {
        return <div className="p-4 text-center text-muted-foreground">No valuation report found for this booking.</div>;
    }
    
    return (
        <div className="p-1">
            <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
                <div className="lg:col-span-3 space-y-6">
                   {valuation.status === 'Rejected' && (
                        <Alert variant="destructive">
                            <XCircle className="h-4 w-4" />
                            <AlertTitle>Report Rejected</AlertTitle>
                            <AlertDescription>
                                {valuation.rejectionReason || "This valuation report was rejected."}
                            </AlertDescription>
                        </Alert>
                    )}
                    <Card>
                        <CardHeader>
                            <CardTitle>Valuation Images</CardTitle>
                        </CardHeader>
                        <CardContent>
                             <Carousel className="w-full">
                                <CarouselContent>
                                {valuation.imageUrls.map((url, index) => (
                                    <CarouselItem key={index}>
                                    <Image src={url} alt={`Valuation Image ${index + 1}`} width={800} height={600} className="rounded-lg object-cover w-full aspect-[4/3]" />
                                    </CarouselItem>
                                ))}
                                </CarouselContent>
                                {valuation.imageUrls.length > 1 && (
                                <>
                                    <CarouselPrevious />
                                    <CarouselNext />
                                </>
                                )}
                            </Carousel>
                        </CardContent>
                    </Card>
                </div>

                <div className="lg:col-span-2 space-y-6">
                    {booking && (
                        <Card>
                             <CardHeader>
                                <CardTitle>Client & Booking Details</CardTitle>
                             </CardHeader>
                             <CardContent className="text-sm">
                                <div className="grid grid-cols-2 gap-x-4 gap-y-2">
                                    <div className="font-semibold">Customer Name:</div>
                                    <div>{booking.customerName}</div>
                                    <div className="font-semibold">Customer Email:</div>
                                    <div>{booking.customerEmail}</div>
                                    <div className="font-semibold">Vehicle:</div>
                                    <div>{`${booking.carMake} ${booking.carModel}`}</div>
                                    <div className="font-semibold">Booking Number:</div>
                                    <div className="font-mono text-xs">{booking.bookingNumber}</div>
                                    <div className="font-semibold">Plate Number:</div>
                                    <div className="font-mono">{booking.plateNumber}</div>
                                </div>
                             </CardContent>
                        </Card>
                    )}
                    <Card>
                         <CardHeader>
                            <CardTitle>Valuation Summary</CardTitle>
                         </CardHeader>
                         <CardContent className="text-sm">
                             <div className="grid grid-cols-2 gap-4">
                                <div className="font-semibold">Valued By:</div>
                                <div>{valuation.valuedBy}</div>
                                
                                <div className="font-semibold">Valuation Date:</div>
                                <div>{new Date(valuation.valuedAt?.toDate()).toLocaleString()}</div>

                                <div className="font-semibold">Assessment Date:</div>
                                <div>{new Date(valuation.assessmentDate?.toDate()).toLocaleDateString()}</div>
                                
                                <div className="font-semibold text-green-600">Assessment Value:</div>
                                <div className="font-mono text-green-600">KES {valuation.assessmentValue}</div>

                                <div className="font-semibold text-orange-600">Forced Sale Value:</div>
                                <div className="font-mono text-orange-600">KES {valuation.forcedValue}</div>
                                
                                <div className="font-semibold">Noted Value (WS):</div>
                                <div className="font-mono">KES {valuation.wsValue}</div>
                                
                                <div className="font-semibold">Noted Value (RS):</div>
                                <div className="font-mono">KES {valuation.rsValue}</div>
                            </div>
                            {valuation.comments && (
                                <div className="pt-4 mt-4 border-t">
                                    <h4 className="font-semibold mb-2">Valuer's Comments</h4>
                                    <p className="text-sm p-3 bg-muted rounded-md">{valuation.comments}</p>
                                </div>
                            )}
                         </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
};

export default ValuationReportView;
