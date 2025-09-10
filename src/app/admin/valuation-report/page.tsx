
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
    imageUrls: string[];
    valuedBy: string;
    valuedAt: any;
    status?: 'Approved' | 'Rejected' | 'Pending Approval';
    rejectionReason?: string;
    policyExpiryDate?: any;
    chassisNo?: string;
    colour?: string;
    fuelType?: string;
    engineNo?: string;
    engineRating?: string;
    dateOfReg?: any;
    yearOfManufacture?: string;
    odometerReadings?: string;
    countryOfOrigin?: string;
    numberOfAirbags?: string;
    lightsType?: string;
    transmissionType?: string;
    coachWork?: Record<string, 'Yes' | 'No'>;
    coachWorkNotes?: string;
    mechanicalCondition?: Record<string, 'Yes' | 'No'>;
    mechanicalNotes?: string;
    electricalCondition?: Record<string, 'Yes' | 'No'>;
    electricalNotes?: string;
    antiTheft?: string;
    tyresType?: string;
    tyresCondition?: string;
    extras?: string;
    comments?: string;
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
  logbookImage?: string;
}

interface ReportState {
  valuation: Valuation | null;
  booking: Booking | null;
  loading: boolean;
}

const ConditionChecklist = ({ title, data, notes }: { title: string, data?: Record<string, 'Yes' | 'No'>, notes?: string }) => {
    if (!data) return null;
    const entries = Object.entries(data);
    if (entries.length === 0) return null;

    // Split into two columns
    const midPoint = Math.ceil(entries.length / 2);
    const column1 = entries.slice(0, midPoint);
    const column2 = entries.slice(midPoint);

    const toSentenceCase = (str: string) => {
        const result = str.replace(/([A-Z])/g, " $1");
        return result.charAt(0).toUpperCase() + result.slice(1);
    };

    return (
        <section className="mb-8 break-inside-avoid">
            <h3 className="text-xl font-semibold text-black mb-4 pb-2 border-b border-gray-300">{title}</h3>
            <div className="grid grid-cols-2 gap-x-12">
                <div className="space-y-2">
                    {column1.map(([key, value]) => (
                        <div key={key} className="flex justify-between items-center text-sm">
                            <span className="text-gray-600">{toSentenceCase(key)}:</span>
                            <span className={`font-medium ${value === 'Yes' ? 'text-red-600' : 'text-green-600'}`}>{value}</span>
                        </div>
                    ))}
                </div>
                <div className="space-y-2">
                     {column2.map(([key, value]) => (
                        <div key={key} className="flex justify-between items-center text-sm">
                            <span className="text-gray-600">{toSentenceCase(key)}:</span>
                            <span className={`font-medium ${value === 'Yes' ? 'text-red-600' : 'text-green-600'}`}>{value}</span>
                        </div>
                    ))}
                </div>
            </div>
            {notes && (
                <div className="mt-4">
                    <h4 className="font-semibold text-gray-700">Notes:</h4>
                    <p className="text-sm text-gray-700 p-3 bg-gray-50 rounded-md border mt-1">{notes}</p>
                </div>
            )}
        </section>
    );
};


class ReportToPrint extends React.Component<{valuation: Valuation | null, booking: Booking | null}> {
  render() {
    const { valuation, booking } = this.props;

    if (!valuation || !booking) {
        return <div className="p-4 text-center text-muted-foreground">No valuation report found for this booking.</div>;
    }

    const renderDetailRow = (label: string, value: any) => (
        <div className="flex justify-between py-1.5 border-b border-gray-100">
            <span className="font-semibold text-gray-600">{label}:</span>
            <span className="text-gray-800 text-right">{value || 'N/A'}</span>
        </div>
    );
    
    return (
      <div className="bg-white shadow-lg rounded-lg flex flex-col min-h-[calc(100vh-4rem)]">
        <header className="bg-[#1a1a1a] p-6 relative print:hidden">
            <div className="w-48">
              <Image src="/logo.png" alt="Company Logo" width={200} height={80} />
            </div>
            <div className="absolute right-0 top-0 h-full w-4 bg-primary" />
        </header>

        <main className="flex-grow p-10 print:p-8 watermarked">
          <div className="report-content">
             <div className="text-center mb-8 hidden print:block">
                 <Image src="/logo.png" alt="Company Logo" width={200} height={80} className="mx-auto" />
             </div>
            <h2 className="text-2xl font-bold text-center text-black uppercase tracking-widest mb-2">
                Motor Vehicle Valuation Report
            </h2>
             <p className="text-center text-sm text-gray-500 mb-8">Ref: {booking.bookingNumber}</p>

            {valuation.status === 'Rejected' && (
                <Alert variant="destructive" className="mb-8">
                    <XCircle className="h-4 w-4" />
                    <AlertTitle>Report Rejected by Admin</AlertTitle>
                    <AlertDescription>
                       <strong>Reason:</strong> {valuation.rejectionReason || "This valuation report was rejected."}
                    </AlertDescription>
                </Alert>
            )}

            <section className="mb-8 break-after-page">
                <h3 className="text-xl font-semibold text-black mb-4 pb-2 border-b border-gray-300">Section A: Vehicle Particulars</h3>
                <div className="grid grid-cols-2 gap-x-12 gap-y-1 text-sm">
                    {renderDetailRow("Client Name", booking.customerName)}
                    {renderDetailRow("Client Phone", booking.customerPhone)}
                    {renderDetailRow("Client Email", booking.customerEmail)}
                    {renderDetailRow("Insurance Co.", booking.insurerName)}
                    {renderDetailRow("Policy Number", booking.policyNumber)}
                    {renderDetailRow("Policy Expiry", valuation.policyExpiryDate ? new Date(valuation.policyExpiryDate.toDate()).toLocaleDateString() : 'N/A')}
                    {renderDetailRow("Vehicle Make", booking.carMake)}
                    {renderDetailRow("Vehicle Model", booking.carModel)}
                    {renderDetailRow("Registration No", booking.plateNumber)}
                    {renderDetailRow("Date of Registration", valuation.dateOfReg ? new Date(valuation.dateOfReg.toDate()).toLocaleDateString() : 'N/A')}
                    {renderDetailRow("Year of Manufacture", valuation.yearOfManufacture)}
                    {renderDetailRow("Colour", valuation.colour)}
                    {renderDetailRow("Chassis No.", valuation.chassisNo)}
                    {renderDetailRow("Engine No.", valuation.engineNo)}
                    {renderDetailRow("Engine Rating", valuation.engineRating)}
                    {renderDetailRow("Fuel Type", valuation.fuelType)}
                    {renderDetailRow("Odometer Reading", valuation.odometerReadings)}
                    {renderDetailRow("Transmission", valuation.transmissionType)}
                    {renderDetailRow("No. of Airbags", valuation.numberOfAirbags)}
                    {renderDetailRow("Lights Type", valuation.lightsType)}
                    {renderDetailRow("Country of Origin", valuation.countryOfOrigin)}
                    {renderDetailRow("Anti-Theft System", valuation.antiTheft)}
                    {renderDetailRow("Tyres Type", valuation.tyresType)}
                    {renderDetailRow("Tyres Condition", valuation.tyresCondition)}
                    {renderDetailRow("Extras", valuation.extras)}
                </div>
            </section>
            
            <ConditionChecklist title="Section B: Coach Work Assessment" data={valuation.coachWork} notes={valuation.coachWorkNotes} />
            
            <ConditionChecklist title="Section C: Mechanical Condition" data={valuation.mechanicalCondition} notes={valuation.mechanicalNotes} />

            <ConditionChecklist title="Section D: Electrical Condition" data={valuation.electricalCondition} notes={valuation.electricalNotes} />

            <section className="mb-8 break-before-page">
                <h3 className="text-xl font-semibold text-black mb-4 pb-2 border-b border-gray-300">Section E: Valuation Summary</h3>
                <div className="grid grid-cols-2 gap-x-12 gap-y-4 text-base">
                    <div className="flex justify-between"><span className="font-semibold text-gray-700">Valued By:</span><span>{valuation.valuedBy}</span></div>
                    <div className="flex justify-between"><span className="font-semibold text-gray-700">Assessment Date:</span><span>{new Date(valuation.assessmentDate?.toDate()).toLocaleDateString()}</span></div>
                    <div className="flex justify-between"><span className="font-semibold text-gray-700">Report Date:</span><span>{new Date(valuation.valuedAt?.toDate()).toLocaleString()}</span></div>
                    <div></div>
                    <div className="flex justify-between text-lg"><span className="font-bold text-green-700">Assessment Value:</span><span className="font-mono font-bold text-green-700">KES {valuation.assessmentValue}</span></div>
                    <div className="flex justify-between text-lg"><span className="font-bold text-orange-700">Forced Sale Value:</span><span className="font-mono font-bold text-orange-700">KES {valuation.forcedValue}</span></div>
                    <div className="flex justify-between"><span className="font-semibold text-gray-700">Noted Value (WS):</span><span className="font-mono">KES {valuation.wsValue}</span></div>
                    <div className="flex justify-between"><span className="font-semibold text-gray-700">Noted Value (RS):</span><span className="font-mono">KES {valuation.rsValue}</span></div>
                </div>
                 {valuation.comments && (
                    <div className="mt-6">
                        <h4 className="font-semibold text-gray-700 text-lg">General Valuer's Comments</h4>
                        <p className="text-base text-gray-700 p-4 bg-gray-50 rounded-md border mt-2">{valuation.comments}</p>
                    </div>
                )}
            </section>
            
            <section className="break-before-page">
                <h3 className="text-xl font-semibold text-black mb-4 pb-2 border-b border-gray-300">Section F: Vehicle & Document Images</h3>
                <div className="grid grid-cols-2 gap-6">
                     {booking.logbookImage && (
                        <div className="border rounded-lg overflow-hidden shadow-sm">
                            <h4 className="p-2 text-sm font-semibold bg-gray-100 border-b">Logbook</h4>
                            <Image src={booking.logbookImage} alt="Logbook Image" width={800} height={600} className="object-cover w-full aspect-[4/3]" />
                        </div>
                    )}
                    {valuation.imageUrls.map((url, index) => (
                        <div key={index} className="border rounded-lg overflow-hidden shadow-sm">
                            <h4 className="p-2 text-sm font-semibold bg-gray-100 border-b">Vehicle Image {index + 1}</h4>
                            <Image src={url} alt={`Valuation Image ${index + 1}`} width={800} height={600} className="object-cover w-full aspect-[4/3]" />
                        </div>
                    ))}
                </div>
            </section>
          </div>
        </main>

        <footer className="bg-[#1a1a1a] p-4 text-white text-xs mt-auto print:hidden">
            <div className="max-w-5xl mx-auto grid grid-cols-3 gap-4 text-center">
                <div className="flex items-center justify-center gap-2">
                    <Phone size={14} className="text-primary"/>
                    <span>0722924854 / 0737924854</span>
                </div>
                <div className="flex items-center justify-center gap-2">
                    <MapPin size={14} className="text-primary"/>
                    <span>Plessy Hse, next to Nissan Kenya & Carrefour Mega, Uhuru Highway, Nairobi</span>
                </div>
                <div className="flex items-center justify-center gap-2">
                    <Mail size={14} className="text-primary"/>
                    <span>casamotorvaluers@gmail.com</span>
                </div>
            </div>
        </footer>
         <footer className="text-center text-sm text-gray-500 mt-8 pt-4 border-t hidden print:block">
            © {new Date().getFullYear()} CASA Motor Valuers & Assessors Ltd. This is a computer-generated document.
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
