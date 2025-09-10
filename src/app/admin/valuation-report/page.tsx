
"use client";

import React, { Suspense, useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { doc, getDoc, getDocs, collection, query, where } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Button } from '@/components/ui/button';
import { Loader2, ArrowLeft, Phone, MapPin, Mail, XCircle } from 'lucide-react';
import Image from 'next/image';
import QRCode from 'qrcode';


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
    insurer?: string;
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
  carType?: string;
  policyNumber?: string;
  authorisedBy?: string;
  createdAt: any;
  branch?: string; 
  insurerName?: string;
  logbookImage?: string;
  status: string;
}

interface ReportState {
  valuation: Valuation | null;
  booking: Booking | null;
  loading: boolean;
  qrCodeUrl: string | null;
}

const DetailItem = ({ label, value }: { label: string; value: React.ReactNode }) => (
    <div className="flex justify-between py-1 border-b border-gray-100">
        <span className="font-semibold text-gray-700">{label}:</span>
        <span className="text-gray-900 font-medium text-right">{value || 'N/A'}</span>
    </div>
);

const ConditionItem = ({ question, answer }: { question: string, answer?: 'Yes' | 'No' }) => (
    <div className="flex justify-between text-sm py-1.5 border-b border-gray-100">
        <span>{question}</span>
        <span className="font-bold">{answer || 'N/A'}</span>
    </div>
)

const NoteItem = ({ label, value }: { label: string, value?: string }) => (
     <div className="py-2">
        <span className="font-bold uppercase text-sm text-gray-600">{label}</span>
        <p className="text-base text-gray-800 mt-1">{value || 'N/A'}</p>
    </div>
)

const numberToWords = (num: number | string): string => {
    const s = String(num).replace(/[\,]/g, '');
    if (isNaN(Number(s))) return 'Invalid number';
    if (Number(s) === 0) return 'Zero';

    const a = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine', 'Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];
    const b = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];
    const g = ['', 'Thousand', 'Million', 'Billion', 'Trillion'];

    const toWords = (n: string): string => {
        let str = '';
        const x = n.length;
        const h = n[x - 3];
        const t = n[x - 2];
        const o = n[x - 1];

        if (h && h !== '0') {
            str += a[Number(h)] + ' Hundred ';
        }
        if (t === '1') {
            str += a[Number(t + o)] + ' ';
        } else if (t && t !== '0') {
            str += b[Number(t)] + ' ';
            if (o !== '0') str += a[Number(o)] + ' ';
        } else if (o !== '0') {
            str += a[Number(o)] + ' ';
        }
        return str;
    };
    
    let str = '';
    let i = s.length;
    let j = 0;
    
    while(i > 0) {
        const chunk = s.substring(Math.max(0, i - 3), i);
        if (chunk !== '000') {
            str = toWords(chunk) + (g[j] ? g[j] + ' ' : '') + str;
        }
        i -= 3;
        j++;
    }

    return str.trim();
};


class ReportToPrint extends React.Component<{valuation: Valuation | null, booking: Booking | null, qrCodeUrl: string | null}> {
  render() {
    const { valuation, booking, qrCodeUrl } = this.props;

    if (!valuation || !booking) {
        return <div className="p-4 text-center text-muted-foreground">No valuation report found for this booking.</div>;
    }
    const assessmentValueInWords = valuation.assessmentValue ? `${numberToWords(valuation.assessmentValue)} Shillings Only` : 'N/A';
    
    return (
        <div className="bg-white shadow-2xl rounded-lg flex flex-col min-h-[calc(100vh-4rem)]">
            <header className="bg-[#1a1a1a] p-6 relative">
              <div className="w-48">
                <Image src="/logo.png" alt="Company Logo" width={200} height={80} />
              </div>
              <div className="absolute right-6 top-1/2 -translate-y-1/2 h-24 w-24 p-1 bg-white">
                 {qrCodeUrl && <Image src={qrCodeUrl} alt="QR Code" width={96} height={96} />}
              </div>
            </header>

            <main className="flex-grow p-14 watermarked-valuation">
             <div className="report-content">
                <h2 className="text-2xl font-bold text-center text-black uppercase tracking-widest mb-4">
                    Motor Vehicle Valuation Report
                </h2>
                
                <section className="mb-6">
                    <h3 className="text-lg font-semibold text-gray-800 mb-2 pb-2 border-b-2 border-primary">Vehicle Particulars</h3>
                    <div className="grid grid-cols-2 gap-x-12 gap-y-1 text-sm">
                        <DetailItem label="Registration No" value={booking.plateNumber} />
                        <DetailItem label="Make" value={booking.carMake} />
                        <DetailItem label="Chassis No" value={valuation.chassisNo} />
                        <DetailItem label="Type" value={booking.carType} />
                        <DetailItem label="Engine No" value={valuation.engineNo} />
                        <DetailItem label="Colour" value={valuation.colour} />
                        <DetailItem label="Year of Man." value={valuation.yearOfManufacture} />
                        <DetailItem label="Fuel Type" value={valuation.fuelType} />
                        <DetailItem label="Air Bags" value={valuation.numberOfAirbags} />
                        <DetailItem label="Date of Reg." value={valuation.dateOfReg ? new Date(valuation.dateOfReg.toDate()).toLocaleDateString() : 'N/A'} />
                        <DetailItem label="Engine Rating" value={valuation.engineRating} />
                        <DetailItem label="Country of Origin" value={valuation.countryOfOrigin} />
                        <DetailItem label="Odometer Reading" value={valuation.odometerReadings} />
                        <DetailItem label="Lights" value={valuation.lightsType} />
                    </div>
                </section>
                
                <section className="mb-6">
                     <div className="grid grid-cols-2 gap-x-12">
                        <div>
                            <h4 className="font-bold text-base underline mb-1">Coachwork</h4>
                            <div className="space-y-1">
                                <ConditionItem question="Accident Repairs Noted?" answer={valuation.coachWork?.accidentRepairs} />
                                <ConditionItem question="Accident Damages noted?" answer={valuation.coachWork?.accidentDamagesNoted} />
                                <ConditionItem question="Is Paint work Scratched/ Faded/ Dented?" answer={valuation.coachWork?.paintWorkScratched} />
                                <ConditionItem question="Are Inner wings repaired or damaged?" answer={valuation.coachWork?.innerWingsRepaired} />
                                <ConditionItem question="Has the body had a complete respray?" answer={valuation.coachWork?.completeRespray} />
                                <ConditionItem question="Are roof linings damaged or repaired?" answer={valuation.coachWork?.roofLiningsDamaged} />
                                <ConditionItem question="Is Upholstery Torn/faded/worn out??" answer={valuation.coachWork?.upholsteryTorn} />
                                <ConditionItem question="Are Bumpers/ Outer Wing repaired?" answer={valuation.coachWork?.bumpersOuterWingRepaired} />
                                <ConditionItem question="Is the Chassis kinked or damaged?" answer={valuation.coachWork?.chassisKinked} />
                            </div>
                        </div>
                         <div>
                            <h4 className="font-bold text-base underline mb-1">Mechanical Condition</h4>
                            <div className="space-y-1">
                                <ConditionItem question="Is the parking brake effective?" answer={valuation.mechanicalCondition?.parkingBrakeEffective} />
                                <ConditionItem question="Is the braking system okay?" answer={valuation.mechanicalCondition?.brakingSystemOk} />
                                <ConditionItem question="Is the automatic/manual gearbox okay?" answer={valuation.mechanicalCondition?.gearboxOk} />
                                <ConditionItem question="Is the steering system okay?" answer={valuation.mechanicalCondition?.steeringSystemOk} />
                                <ConditionItem question="Is cooling system operating well?" answer={valuation.mechanicalCondition?.coolingSystemOk} />
                                <ConditionItem question="Are There signs of fluid or oil leakage?" answer={valuation.mechanicalCondition?.fluidLeakage} />
                                <ConditionItem question="Are the drive shafts/cv joints worn out?" answer={valuation.mechanicalCondition?.driveShaftWorn} />
                                <ConditionItem question="Is the suspension system okay?" answer={valuation.mechanicalCondition?.suspensionSystemOk} />
                                <ConditionItem question="Are engine mountings worn out?" answer={valuation.mechanicalCondition?.engineMountingsWorn} />
                            </div>
                        </div>
                    </div>
                </section>
                <section className="mb-6">
                     <h4 className="font-bold text-base underline mb-1">Electrical Condition</h4>
                     <div className="grid grid-cols-3 gap-x-12">
                        <ConditionItem question="Do the indicator lights operate well?" answer={valuation.electricalCondition?.indicatorLightsOk} />
                        <ConditionItem question="Do the brake lights operate well?" answer={valuation.electricalCondition?.brakeLightsOk} />
                        <ConditionItem question="Are the wipers operating well?" answer={valuation.electricalCondition?.wipersOk} />
                        <ConditionItem question="Are the headlights operating well?" answer={valuation.electricalCondition?.headlightsOk} />
                        <ConditionItem question="Do the Instrument panel lights work well?" answer={valuation.electricalCondition?.instrumentPanelLightsOk} />
                     </div>
                </section>

                <section className="mb-6 text-sm space-y-2">
                    <NoteItem label="Coachwork Notes" value={valuation.coachWorkNotes} />
                    <NoteItem label="Electrical Notes" value={valuation.electricalNotes} />
                    <NoteItem label="Mechanical Notes" value={valuation.mechanicalNotes} />
                    <NoteItem label="Anti Theft" value={valuation.antiTheft} />
                    <NoteItem label="Tyres" value={`${valuation.tyresType} - ${valuation.tyresCondition}`} />
                    <NoteItem label="General Condition" value="Good" />
                    <NoteItem label="Extras" value={valuation.extras} />
                </section>
                
                <section className="mb-6">
                    <div className="border-y-2 border-dashed border-gray-300 py-2">
                        <span className="font-bold uppercase text-sm text-gray-600">Assessed Value: </span>
                        <p className="text-base text-gray-800 mt-1">{`${assessmentValueInWords} (Kshs. ${valuation.assessmentValue})`}</p>
                    </div>
                </section>
                
                <section className="mb-6 grid grid-cols-2 gap-x-12 text-sm">
                    <DetailItem label="Noted Value: WS (KES)" value={valuation.wsValue} />
                    <DetailItem label="Noted Value: RS (KES)" value={valuation.rsValue} />
                </section>

                <section className="mb-6">
                    <NoteItem label="Remarks" value={valuation.comments} />
                </section>
                
                <section className="mb-8 grid grid-cols-2 gap-x-12 border-y-2 border-dashed border-gray-300 py-2 text-sm">
                    <DetailItem label="Country of Origin" value={valuation.countryOfOrigin} />
                     <DetailItem label="Examiner" value={valuation.valuedBy} />
                    <DetailItem label="Destination" value={booking.insurerName} />
                    <DetailItem label="Location of Inspection" value={booking.branch} />
                </section>
                
                <section className="mt-12 flex justify-between items-end">
                    <div className="w-2/3 text-sm">
                         <div className="flex justify-between items-center">
                            <span className="font-bold uppercase text-gray-600">Date of Inspection:</span>
                            <span className="font-medium">{valuation.assessmentDate ? new Date(valuation.assessmentDate.toDate()).toLocaleDateString() : 'N/A'}</span>
                        </div>
                         <div className="flex justify-between items-center mt-8">
                            <span className="font-bold uppercase text-gray-600">Signed:</span>
                            <div className="w-2/3 border-b-2 border-gray-400"></div>
                        </div>
                    </div>
                    <div className="w-1/3 text-right">
                         <p className="font-bold text-base italic">CASA Motor Valuers & Assessors Ltd</p>
                    </div>
                </section>
                
                <div className="break-before-page">
                    <div className="my-4 break-inside-avoid">
                        <h3 className="font-bold text-lg underline mb-2">Valuation Photos</h3>
                        <div className="grid grid-cols-2 gap-4">
                            {valuation.imageUrls.map((url, index) => (
                                <div key={index} className="border p-1 rounded-md bg-gray-100 break-inside-avoid">
                                    <Image src={url} alt={`Valuation Photo ${index + 1}`} width={400} height={300} className="object-contain w-full h-auto" />
                                </div>
                            ))}
                        </div>
                    </div>
                    
                    {booking.logbookImage && (
                        <div className="my-4 break-inside-avoid">
                            <h3 className="font-bold text-lg underline mb-2">Logbook</h3>
                            <div className="border p-1 rounded-md max-w-md bg-gray-100">
                                <Image src={booking.logbookImage} alt="Logbook" width={500} height={400} className="object-contain w-full h-auto" />
                            </div>
                        </div>
                    )}
                </div>
            </div>
            </main>
             <footer className="bg-[#1a1a1a] p-4 text-white text-xs mt-auto">
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
      qrCodeUrl: null,
    };
  }

  componentDidMount() {
    const bookingId = this.props.searchParams.get('id');

    if (bookingId) {
      this.fetchReports(bookingId);
    }
  }

  fetchReports = async (bookingId: string) => {
    this.setState({ loading: true });
    try {
        const q = query(collection(db, "valuations"), where("bookingId", "==", bookingId));
        const valuationSnapshot = await getDocs(q);
        let valuationData: Valuation | null = null;
        if (!valuationSnapshot.empty) {
            const valuationDoc = valuationSnapshot.docs[0];
            valuationData = { id: valuationDoc.id, ...valuationDoc.data() } as Valuation;
        }

        const bookingDocRef = doc(db, 'bookings', bookingId as string);
        const bookingSnap = await getDoc(bookingDocRef);
        let bookingData: Booking | null = null;
        if (bookingSnap.exists()) {
             bookingData = { id: bookingSnap.id, ...bookingSnap.data() } as Booking;
        }

         if (bookingData) {
            document.title = `Valuation Report - ${bookingData.bookingNumber}`;
            const reportUrl = 'https://casamotorvaluers.co.ke/';
            const qrUrl = await QRCode.toDataURL(reportUrl, { width: 96, margin: 1 });
            this.setState({ booking: bookingData, valuation: valuationData, qrCodeUrl: qrUrl });
        }

    } catch (error) {
        console.error("Error fetching reports:", error);
    } finally {
        this.setState({ loading: false });
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
      <div className="bg-gray-200 min-h-screen p-4 sm:p-8 print:bg-white print:p-0">
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
          <ReportToPrint valuation={this.state.valuation} booking={this.state.booking} qrCodeUrl={this.state.qrCodeUrl} />
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

    