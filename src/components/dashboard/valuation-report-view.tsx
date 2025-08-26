
"use client";

import React, { useState, useEffect } from 'react';
import { doc, getDocs, collection, query, where } from "firebase/firestore";
import { db } from '@/lib/firebase';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { XCircle, Loader2 } from 'lucide-react';
import Image from 'next/image';

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
  customerEmail:string;
  customerPhone: string;
  plateNumber: string;
  carMake: string;
  carModel: string;
  policyNumber?: string;
  authorisedBy?: string;
  createdAt: any;
  branch?: string; 
  insurerName?: string;
}

class ReportToPrint extends React.Component<{valuation: Valuation | null, booking: Booking | null}> {
  render() {
    const { valuation, booking } = this.props;

    if (!valuation || !booking) {
        return <div className="p-4 text-center text-muted-foreground">No valuation report found for this booking.</div>;
    }

    return (
      <div className="bg-white p-14 shadow-lg rounded-lg" id="valuation-report">
        <header className="flex justify-between items-center pb-6 border-b-2 border-primary">
            <div>
                <Image src="/logo.png" alt="Company Logo" width={200} height={80} />
            </div>
            <div className="text-left">
            <h1 className="text-4xl font-extrabold text-black">CASA Motor Valuers & Assessors</h1>
            <p className="text-base text-gray-700 mt-1">
                Highway Mall, Uhuru Highway<br />
                Nairobi, Kenya
            </p>
            </div>
            <div className="text-right text-base text-gray-700">
            <p><span className="font-semibold">Phone:</span> +254 712 345 678</p>
            <p><span className="font-semibold">Email:</span> casamotorvaluer@gmail.com</p>
            </div>
        </header>

        <main className="mt-10">
            <h2 className="text-2xl font-bold text-center text-black uppercase tracking-widest mb-8">
                Motor Vehicle Valuation Report
            </h2>

            {valuation.status === 'Rejected' && (
                <Alert variant="destructive" className="mb-8">
                    <XCircle className="h-4 w-4" />
                    <AlertTitle>Report Rejected by {booking.insurerName}</AlertTitle>
                    <AlertDescription>
                        {valuation.rejectionReason || "This valuation report was rejected."}
                    </AlertDescription>
                </Alert>
            )}

            <section className="mb-8">
                <h3 className="text-xl font-semibold text-black mb-4 pb-2 border-b border-gray-300">Client & Vehicle Details</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-4 text-base">
                    <div className="flex justify-between"><span className="font-semibold text-gray-700">Client Name:</span><span className="text-gray-900 font-medium">{booking.customerName}</span></div>
                    <div className="flex justify-between"><span className="font-semibold text-gray-700">Vehicle Make:</span><span className="text-gray-900 font-medium">{booking.carMake}</span></div>
                    <div className="flex justify-between"><span className="font-semibold text-gray-700">Client Phone:</span><span className="text-gray-900 font-medium">{booking.customerPhone}</span></div>
                    <div className="flex justify-between"><span className="font-semibold text-gray-700">Vehicle Model:</span><span className="text-gray-900 font-medium">{booking.carModel}</span></div>
                    <div className="flex justify-between"><span className="font-semibold text-gray-700">Client Email:</span><span className="text-gray-900 font-medium">{booking.customerEmail}</span></div>
                    <div className="flex justify-between"><span className="font-semibold text-gray-700">Registration No:</span><span className="text-gray-900 font-medium">{booking.plateNumber}</span></div>
                    <div className="flex justify-between"><span className="font-semibold text-gray-700">Insurance Co:</span><span className="text-gray-900 font-medium">{booking.insurerName}</span></div>
                    <div className="flex justify-between"><span className="font-semibold text-gray-700">Policy Number:</span><span className="text-gray-900 font-medium">{booking.policyNumber}</span></div>
                </div>
            </section>

            <section className="mb-8">
                <h3 className="text-xl font-semibold text-black mb-4 pb-2 border-b border-gray-300">Valuation Summary</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-4 text-base">
                    <div className="flex justify-between"><span className="font-semibold text-gray-700">Valued By:</span><span>{valuation.valuedBy}</span></div>
                    <div className="flex justify-between"><span className="font-semibold text-gray-700">Assessment Date:</span><span>{new Date(valuation.assessmentDate?.toDate()).toLocaleDateString()}</span></div>
                    <div className="flex justify-between"><span className="font-semibold text-gray-700">Report Date:</span><span>{new Date(valuation.valuedAt?.toDate()).toLocaleString()}</span></div>
                    <div className="flex justify-between"><span className="font-semibold text-green-600">Assessment Value:</span><span className="font-mono text-green-600">KES {valuation.assessmentValue}</span></div>
                    <div className="flex justify-between"><span className="font-semibold text-orange-600">Forced Sale Value:</span><span className="font-mono text-orange-600">KES {valuation.forcedValue}</span></div>
                    <div className="flex justify-between"><span className="font-semibold text-gray-700">Noted Value (WS):</span><span className="font-mono">KES {valuation.wsValue}</span></div>
                    <div className="flex justify-between"><span className="font-semibold text-gray-700">Noted Value (RS):</span><span className="font-mono">KES {valuation.rsValue}</span></div>
                </div>
            </section>

            {valuation.comments && (
                <section className="mb-8">
                    <h3 className="text-xl font-semibold text-black mb-4 pb-2 border-b border-gray-300">Valuer's Comments</h3>
                    <p className="text-base text-gray-700 p-4 bg-gray-50 rounded-md border">{valuation.comments}</p>
                </section>
            )}

            <section>
                <h3 className="text-xl font-semibold text-black mb-4 pb-2 border-b border-gray-300">Vehicle Images</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    {valuation.imageUrls.map((url, index) => (
                        <div key={index} className="border rounded-lg overflow-hidden shadow-sm">
                            <Image src={url} alt={`Valuation Image ${index + 1}`} width={800} height={600} className="object-cover w-full aspect-[4/3]" />
                        </div>
                    ))}
                </div>
            </section>
        </main>

        <footer className="text-center text-sm text-gray-500 mt-16 pt-6 border-t border-gray-300">
            © {new Date().getFullYear()} Casa Motor Valuers & Assessors. This is a computer-generated document and does not require a signature.
        </footer>
      </div>
    );
  }
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
            <div className="flex justify-center items-center h-96">
                <Loader2 className="h-10 w-10 animate-spin text-primary" />
            </div>
        );
    }
    
    return (
        <div className="bg-gray-100 font-sans">
            <div>
                <ReportToPrint valuation={valuation} booking={booking} />
            </div>
        </div>
    );
};

export default ValuationReportView;
