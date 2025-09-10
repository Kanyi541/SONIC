
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

const DetailItem = ({ label, value, isBlue = false }: { label: string; value: React.ReactNode, isBlue?: boolean }) => (
    <div className="flex justify-between items-baseline">
        <span className="font-bold text-gray-700 uppercase text-xs">{label}</span>
        <span className={`text-black font-medium text-xs text-right ${isBlue ? 'text-blue-600' : ''}`}>{value || 'N/A'}</span>
    </div>
);

const ConditionItem = ({ question, answer }: { question: string, answer?: 'Yes' | 'No' }) => (
    <div className="flex justify-between text-xs py-0.5">
        <span>{question}</span>
        <span className="font-bold">{answer || 'N/A'}</span>
    </div>
)

const NoteItem = ({ label, value, isBlue = false }: { label: string, value?: string, isBlue?: boolean }) => (
     <div className="flex items-start text-xs">
        <span className="font-bold uppercase text-gray-600 mr-2">{label}</span>
        <p className={`font-medium ${isBlue ? 'text-blue-600' : 'text-black'}`}>{value || 'N/A'}</p>
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
            <header className="bg-[#1a1a1a] p-6 relative text-white">
                <div className="flex justify-between items-center">
                    <div className="w-48 flex-shrink-0">
                        <Image src="/logo.png" alt="Company Logo" width={200} height={80} />
                    </div>
                    <div className="text-center mx-4">
                        <h2 className="text-xl font-bold uppercase tracking-wider">CASA MOTOR VALUERS & ASSESSORS LTD</h2>
                        <p className="text-sm font-light tracking-wide">MOTOR VEHICLE VALUATION & INSPECTION CERTIFICATE</p>
                    </div>
                    {qrCodeUrl && (
                        <div className="bg-white p-1 rounded-md flex-shrink-0">
                            <Image src={qrCodeUrl} alt="QR Code" width={80} height={80} />
                        </div>
                    )}
                </div>
                <div className="absolute right-0 top-0 h-full w-8 bg-primary" />
            </header>

            <main className="flex-grow p-10 font-sans watermarked-valuation">
             <div className="report-content">
                
                <section className="mb-2">
                    <div className="grid grid-cols-2 gap-x-16 gap-y-1">
                        <DetailItem label="SERIAL No" value={booking.bookingNumber} />
                        <DetailItem label="ISSUED BY" value="Casa Motor Valuers And Assessors" />
                        <DetailItem label="CLIENT NAME" value={booking.customerName} isBlue />
                        <DetailItem label="CONTACTS" value="0715239719" />
                        <DetailItem label="INSURER" value={valuation.insurer} isBlue />
                        <DetailItem label="POLICY NO." value={booking.policyNumber} />
                         <div />
                        <DetailItem label="EXPIRY DATE." value={valuation.policyExpiryDate ? new Date(valuation.policyExpiryDate.toDate()).toLocaleDateString() : 'N/A'} />
                    </div>
                </section>

                <p className="text-xs italic my-3 text-center">A brief, integrity examination and road test has been carried out on the vehicle described below and the findings are as follows.</p>

                <section className="mb-2">
                    <div className="grid grid-cols-3 gap-x-8 gap-y-1">
                        <DetailItem label="REGISTRATION NO" value={booking.plateNumber} isBlue />
                        <DetailItem label="MAKE" value={booking.carMake} isBlue />
                        <DetailItem label="TYPE :" value={booking.carType} isBlue />
                        <DetailItem label="CHASSIS NO" value={valuation.chassisNo} isBlue />
                        <DetailItem label="COLOUR" value={valuation.colour} isBlue />
                        <DetailItem label="FUEL TYPE" value={valuation.fuelType} isBlue />
                        <DetailItem label="ENGINE NO" value={valuation.engineNo} isBlue />
                        <DetailItem label="ENGINE RATING" value={valuation.engineRating} isBlue />
                        <DetailItem label="DATE OF REG." value={valuation.dateOfReg ? new Date(valuation.dateOfReg.toDate()).toLocaleDateString() : 'N/A'} isBlue />
                        <DetailItem label="YEAR OF MAN." value={valuation.yearOfManufacture} isBlue />
                        <DetailItem label="ODOMETER READING" value={valuation.odometerReadings} isBlue />
                        <DetailItem label="COUNTRY OF ORIGIN" value={valuation.countryOfOrigin} isBlue />
                        <DetailItem label="NO OF AIRBAGS" value={valuation.numberOfAirbags} isBlue />
                        <DetailItem label="LIGHTS" value={valuation.lightsType} isBlue />
                    </div>
                </section>
                
                <section className="mb-2 break-inside-avoid">
                     <h4 className="font-bold text-sm underline mb-1">Coachwork</h4>
                     <div className="grid grid-cols-3 gap-x-8">
                        <ConditionItem question="Accident Repairs Noted?" answer={valuation.coachWork?.accidentRepairs} />
                        <ConditionItem question="Accident Damages noted?" answer={valuation.coachWork?.accidentDamagesNoted} />
                        <ConditionItem question="Are roof linings damaged or repaired?" answer={valuation.coachWork?.roofLiningsDamaged} />
                        <ConditionItem question="Is Paint work Scratched/ Faded/ Dented?" answer={valuation.coachWork?.paintWorkScratched} />
                        <ConditionItem question="Are Inner wings repaired or damaged?" answer={valuation.coachWork?.innerWingsRepaired} />
                        <ConditionItem question="Are Bumpers/ Outer Wing repaired?" answer={valuation.coachWork?.bumpersOuterWingRepaired} />
                        <ConditionItem question="Has the body had a complete respray?" answer={valuation.coachWork?.completeRespray} />
                        <ConditionItem question="Is Upholstery Torn/faded/worn out??" answer={valuation.coachWork?.upholsteryTorn} />
                        <ConditionItem question="Is the Chassis kinked or damaged?" answer={valuation.coachWork?.chassisKinked} />
                    </div>
                </section>

                <section className="mb-2 break-inside-avoid">
                     <h4 className="font-bold text-sm underline mb-1">Mechanical Condition</h4>
                     <div className="grid grid-cols-3 gap-x-8">
                        <ConditionItem question="Is the parking brake effective?" answer={valuation.mechanicalCondition?.parkingBrakeEffective} />
                        <ConditionItem question="Is the braking system okay?" answer={valuation.mechanicalCondition?.brakingSystemOk} />
                        <ConditionItem question="Are the drive shafts/cv joints worn out?" answer={valuation.mechanicalCondition?.driveShaftWorn} />
                        <ConditionItem question="Is the automatic/manual gearbox okay?" answer={valuation.mechanicalCondition?.gearboxOk} />
                        <ConditionItem question="Is the steering system okay?" answer={valuation.mechanicalCondition?.steeringSystemOk} />
                        <ConditionItem question="Is the suspension system okay?" answer={valuation.mechanicalCondition?.suspensionSystemOk} />
                        <ConditionItem question="Is cooling system operating well?" answer={valuation.mechanicalCondition?.coolingSystemOk} />
                        <ConditionItem question="Are There signs of fluid or oil leakage?" answer={valuation.mechanicalCondition?.fluidLeakage} />
                        <ConditionItem question="Are engine mountings worn out?" answer={valuation.mechanicalCondition?.engineMountingsWorn} />
                    </div>
                </section>

                <section className="mb-2 break-inside-avoid">
                     <h4 className="font-bold text-sm underline mb-1">Electrical Condition</h4>
                     <div className="grid grid-cols-3 gap-x-8">
                        <ConditionItem question="Do the indicator lights operate well?" answer={valuation.electricalCondition?.indicatorLightsOk} />
                        <ConditionItem question="Are the wipers operating well?" answer={valuation.electricalCondition?.wipersOk} />
                        <ConditionItem question="Do the Instrument panel lights work well?" answer={valuation.electricalCondition?.instrumentPanelLightsOk} />
                        <ConditionItem question="Do the brake lights operate well?" answer={valuation.electricalCondition?.brakeLightsOk} />
                        <ConditionItem question="Are the headlights operating well?" answer={valuation.electricalCondition?.headlightsOk} />
                     </div>
                </section>

                <section className="my-3 space-y-1">
                    <NoteItem label="COACHWORK NOTES" value={valuation.coachWorkNotes} isBlue/>
                    <NoteItem label="ELECTRICAL NOTES" value={valuation.electricalNotes} isBlue/>
                    <NoteItem label="MECHANICAL NOTES" value={valuation.mechanicalNotes} isBlue/>
                    <NoteItem label="ANTI THEFT" value={valuation.antiTheft} isBlue/>
                    <NoteItem label="TYRES" value={`${valuation.tyresType} - ${valuation.tyresCondition}`} isBlue/>
                    <NoteItem label="GENERAL CONDITION" value="good" isBlue/>
                    <NoteItem label="EXTRAS:" value={valuation.extras} isBlue/>
                </section>
                
                <section className="my-3">
                    <div className="py-1">
                        <span className="font-bold uppercase text-xs text-gray-600">ASSESSED VALUE : </span>
                        <span className="font-bold text-blue-600 text-xs">{`${assessmentValueInWords} (Kshs. ${valuation.assessmentValue})`}</span>
                    </div>
                </section>
                
                <section className="my-2 grid grid-cols-2 gap-x-12 text-xs">
                    <div>
                      <span className="font-bold uppercase text-xs text-gray-600">Noted Value: WS (KES)</span>
                      <div className="flex justify-between items-baseline mt-1">
                          <span className="text-gray-700">Radio Estimate</span>
                          <span className="text-black font-medium">{valuation.wsValue}</span>
                      </div>
                    </div>
                     <div>
                       <span className="font-bold uppercase text-xs text-gray-600">Noted Value: RS (KES)</span>
                       <div className="flex justify-between items-baseline mt-1">
                          <span className="text-gray-700">Windscreen Estimate</span>
                          <span className="text-black font-medium">{valuation.rsValue}</span>
                      </div>
                    </div>
                </section>

                <section className="my-3 space-y-1">
                    <NoteItem label="REMARKS:" value={valuation.comments} isBlue/>
                    <NoteItem label="REMEDY :" value="" />
                    <NoteItem label="DISCLAIMER :" value="none" isBlue/>
                </section>
                
                <section className="mt-4 grid grid-cols-2 gap-x-16 text-xs">
                    <DetailItem label="COUNTRY OF ORIGIN" value={valuation.countryOfOrigin} isBlue />
                    <DetailItem label="DATE OF INSPECTION" value={valuation.assessmentDate ? new Date(valuation.assessmentDate.toDate()).toLocaleDateString() : 'N/A'} isBlue />
                    <div />
                    <DetailItem label="EXAMINER" value={valuation.valuedBy} isBlue />
                    <DetailItem label="DESTINATION" value={`${valuation.insurer} prompt insurance agency`} isBlue />
                    <DetailItem label="LOCATION OF INSPECTION" value={booking.branch} isBlue />
                </section>
                
                <section className="mt-4 grid grid-cols-2 gap-x-16 text-xs">
                  <div>
                    <span className="font-bold uppercase">Signed</span>
                  </div>
                   <div>
                    <span className="font-bold uppercase mr-2">Date</span>
                    <span>{valuation.assessmentDate ? new Date(valuation.assessmentDate.toDate()).toLocaleDateString() : 'N/A'}</span>
                  </div>
                </section>

                <p className="text-center font-bold text-xs mt-4">For and on Behalf of CASA Motor Valuers & Assessors Ltd</p>
                
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
                    
                    <div className="my-4 break-inside-avoid">
                        <h3 className="font-bold text-lg underline mb-2">Logbook</h3>
                        {booking.logbookImage ? (
                            <div className="border p-1 rounded-md max-w-md bg-gray-100">
                                <Image src={booking.logbookImage} alt="Logbook" width={500} height={400} className="object-contain w-full h-auto" />
                            </div>
                        ) : (
                            <p className="text-gray-500 italic">No logbook provided.</p>
                        )}
                    </div>
                </div>
            </div>
            </main>
            <footer className="bg-[#1a1a1a] p-4 text-white text-xs mt-auto print-footer">
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
            const reportUrl = `https://casamotorvaluers.co.ke/`;
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
