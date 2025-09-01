
"use client";

import React, { Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { doc, getDoc, getDocs, collection, query, where } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Button } from '@/components/ui/button';
import { Loader2, ArrowLeft, XCircle, Phone, Mail, MapPin } from 'lucide-react';
import Image from 'next/image';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';


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
    status?: 'Approved' | 'Rejected' | 'Pending Approval';
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

interface ReportState {
  valuation: Valuation | null;
  booking: Booking | null;
  loading: boolean;
}

class ReportToPrint extends React.Component<{valuation: Valuation | null, booking: Booking | null}> {
  render() {
    const { valuation, booking } = this.props;

    if (!valuation || !booking) {
        return <div className="p-4 text-center text-muted-foreground">No valuation report found for this booking.</div>;
    }

    return (
      <div className="bg-white shadow-lg rounded-lg flex flex-col min-h-[calc(100vh-4rem)]">
        <header className="bg-[#1a1a1a] p-6 relative">
            <div className="w-48">
              <Image src="/logo.png" alt="Company Logo" width={200} height={80} />
            </div>
            <div className="absolute right-0 top-0 h-full w-4 bg-primary" />
        </header>

        <main className="flex-grow p-14 watermarked">
          <div className="report-content">
            <h2 className="text-2xl font-bold text-center text-black uppercase tracking-widest mb-8">
                Motor Vehicle Valuation Report
            </h2>

            {valuation.status === 'Rejected' && (
                <Alert variant="destructive" className="mb-8">
                    <XCircle className="h-4 w-4" />
                    <AlertTitle>Report Rejected by Admin</AlertTitle>
                    <AlertDescription>
                       <strong>Reason:</strong> {valuation.rejectionReason || "This valuation report was rejected."}
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
                <div className="grid grid-cols-2 gap-6">
                    {valuation.imageUrls.map((url, index) => (
                        <div key={index} className="border rounded-lg overflow-hidden shadow-sm">
                            <Image src={url} alt={`Valuation Image ${index + 1}`} width={800} height={600} className="object-cover w-full aspect-[4/3]" />
                        </div>
                    ))}
                </div>
            </section>
          </div>
        </main>

        <footer className="bg-[#1a1a1a] p-4 text-white text-xs mt-auto">
            <div className="max-w-5xl mx-auto grid grid-cols-1 sm:grid-cols-3 gap-4 text-center sm:text-left">
                <div className="flex items-center justify-center sm:justify-start gap-2">
                    <Phone size={14} className="text-primary"/>
                    <span>0722924854 / 0737924854</span>
                </div>
                <div className="flex items-center justify-center sm:justify-start gap-2">
                    <MapPin size={14} className="text-primary"/>
                    <span>Plessy Hse, next to Nissan Kenya & Carrefour Mega, Uhuru Highway, Nairobi</span>
                </div>
                <div className="flex items-center justify-center sm:justify-start gap-2">
                    <Mail size={14} className="text-primary"/>
                    <span>casamotorvaluers@gmail.com</span>
                </div>
            </div>
        </footer>
      </div>
    );
  }
}

class ValuationReportPageContent extends React.Component<{ router: any; searchParams: any }, ReportState> {
  constructor(props: { router: any; searchParams: any }) {
    super(props);
    this.state = {
      valuation: null,
      booking: null,
      loading: true,
    };
  }

  componentDidMount() {
    const bookingId = this.props.searchParams.get('id');

    if (bookingId) {
      const fetchReports = async () => {
        this.setState({ loading: true });

        try {
            // Fetch Valuation
            const q = query(collection(db, "valuations"), where("bookingId", "==", bookingId));
            const valuationSnapshot = await getDocs(q);
            let valuationData: Valuation | null = null;
            if (!valuationSnapshot.empty) {
                const valuationDoc = valuationSnapshot.docs[0];
                valuationData = { id: valuationDoc.id, ...valuationDoc.data() } as Valuation;
            }

            // Fetch Booking
            const bookingDocRef = doc(db, 'bookings', bookingId as string);
            const bookingSnap = await getDoc(bookingDocRef);
            let bookingData: Booking | null = null;
            if (bookingSnap.exists()) {
                 bookingData = { id: bookingSnap.id, ...bookingSnap.data() } as Booking;
            }

             if (bookingData) {
                document.title = `Valuation Report - ${bookingData.bookingNumber}`;
                this.setState({ booking: bookingData, valuation: valuationData });
            }

        } catch (error) {
            console.error("Error fetching reports:", error);
        } finally {
            this.setState({ loading: false });
        }
      };
      fetchReports();
    }
  }
  
  handleGoBack = () => {
    this.props.router.push('/admin/dashboard');
  };

  render() {
    if (this.state.loading) {
      return (
        <div className="flex justify-center items-center h-screen bg-gray-100">
          <Loader2 className="h-10 w-10 animate-spin text-primary" />
        </div>
      );
    }
    
    return (
      <div className="bg-gray-200 min-h-screen p-4 sm:p-8 font-sans print:bg-white print:p-0">
        <div className="max-w-5xl mx-auto">
          <div className="flex justify-end mb-6 gap-4 print:hidden">
            <Button onClick={() => window.print()} variant="default">
              Print / Save PDF
            </Button>
            <Button onClick={this.handleGoBack} variant="outline" className="text-black border-black hover:bg-black hover:text-white">
              <ArrowLeft className="mr-2 h-5 w-5" />
              Go Back
            </Button>
          </div>
          <ReportToPrint valuation={this.state.valuation} booking={this.state.booking} />
        </div>
      </div>
    );
  }
}

function ValuationReportWrapper() {
    const router = useRouter();
    const searchParams = useSearchParams();
    return <ValuationReportPageContent router={router} searchParams={searchParams} />;
}

export default function ValuationReportPage() {
  return (
    <Suspense fallback={
        <div className="flex justify-center items-center h-screen bg-gray-100">
            <Loader2 className="h-10 w-10 animate-spin text-primary" />
        </div>
    }>
      <ValuationReportWrapper />
    </Suspense>
  );
}
