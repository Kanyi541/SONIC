
"use client";

import React, { Suspense, useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { doc, getDoc, getDocs, collection, query, where } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Button } from '@/components/ui/button';
import { Loader2, ArrowLeft, Phone, MapPin, Mail, XCircle } from 'lucide-react';
import Image from 'next/image';
import QRCode from 'qrcode';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";


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
  isVerification: boolean;
}

const DetailItem = ({ label, value, className, labelSize = 'text-[12px]', valueSize = 'text-[12px]' }: { label: string; value: React.ReactNode, className?: string, labelSize?: string, valueSize?: string }) => (
    <div className={className}>
        <span className={`font-bold text-gray-700 uppercase mr-2 ${labelSize}`}>{label}</span>
        <span className={`text-blue-600 font-medium text-right ${valueSize}`}>{value || 'N/A'}</span>
    </div>
);

const ConditionItem = ({ question, answer }: { question: string, answer?: 'Yes' | 'No' }) => (
    <div className="flex justify-between py-0.5">
        <span className="text-[11px]">{question}</span>
        <span className="font-bold text-blue-600 text-[12px]">{answer || 'N/A'}</span>
    </div>
)

const NoteItem = ({ label, value }: { label: string, value?: string }) => (
     <div className="flex items-start">
        <span className="font-bold uppercase text-gray-600 mr-2 text-[12px]">{label}</span>
        <p className={`font-medium text-blue-600 text-[12px]`}>{value || 'N/A'}</p>
    </div>
)

const numberToWords = (num: number | string): string => {
    if (num === null || num === undefined) return 'N/A';
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


class ReportToPrint extends React.Component<{valuation: Valuation | null, booking: Booking | null, qrCodeUrl: string | null, isVerification: boolean}> {
  
  state = {
    isVerificationDialogOpen: this.props.isVerification
  }

  componentDidUpdate(prevProps: { isVerification: boolean; }) {
    if (this.props.isVerification && !prevProps.isVerification) {
      this.setState({ isVerificationDialogOpen: true });
    }
  }

  render() {
    const { valuation, booking, qrCodeUrl } = this.props;

    if (!valuation || !booking) {
        return <div className="p-4 text-center text-muted-foreground">No valuation report found for this booking.</div>;
    }
    const assessmentValueInWords = valuation.assessmentValue ? `${numberToWords(valuation.assessmentValue)} Shillings Only` : 'N/A';
    
    return (
        <div className="bg-white shadow-2xl rounded-lg flex flex-col min-h-[calc(100vh-4rem)] font-sans-trebuchet italic">
             <header className="relative bg-[#1a1a1a] p-4 flex justify-between items-center print-header">
                <div className="relative z-10 w-48">
                    <Image src="/logo.png" alt="CASA Motor Valuers And Assessors Ltd" width={180} height={70} />
                </div>

                <div className="relative z-10 text-center text-white">
                    <h2 className="font-bold text-lg">CASA MOTOR VALUERS & ASSESSORS LTD</h2>
                    <h3 className="font-bold text-base">MOTOR VEHICLE VALUATION & INSPECTION CERTIFICATE</h3>
                </div>
                
                <div className="relative z-10 flex items-center gap-4">
                    {qrCodeUrl && (
                        <div className="relative z-20 text-center">
                            <Image src={qrCodeUrl} alt="QR Code" width={120} height={120} />
                            <p className="text-[7px] font-bold text-white mt-1">SCAN TO VERIFY</p>
                        </div>
                    )}
                    <div className="h-28 w-8 bg-primary"></div>
                </div>
            </header>
            <main className="flex-grow px-10 pt-2 pb-4 watermarked-valuation">
             <div className="report-content">
                
                <AlertDialog open={this.state.isVerificationDialogOpen} onOpenChange={(open) => this.setState({ isVerificationDialogOpen: open })}>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Verified Authentic Report</AlertDialogTitle>
                      <AlertDialogDescription>
                        This is a Verified Authentic Report from CASA.
                         <Button variant="link" onClick={() => window.print()} className="p-0 h-auto block">Click here to download it</Button>
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogAction>Close</AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
                
                <section className="mb-1 text-[12px]">
                    <div className="grid grid-cols-[auto_1fr_auto_1fr] gap-x-4 gap-y-0">
                       <span className="font-bold">SERIAL No</span>
                       <span className="font-medium text-blue-600">{booking.bookingNumber}</span>
                       <span className="font-bold">ISSUED BY</span>
                       <span className="font-medium text-blue-600">Casa Motor Valuers And Assessors</span>
                       
                       <span className="font-bold">CLIENT NAME</span>
                       <span className="font-medium text-blue-600">{booking.customerName}</span>
                       <span className="font-bold">CONTACTS</span>
                       <span className="font-medium text-blue-600">{booking.customerPhone}</span>
                       
                       <span className="font-bold">INSURER</span>
                       <span className="font-medium text-blue-600">{valuation.insurer}</span>
                       <span className="font-bold">POLICY NO.</span>
                       <span className="font-medium text-blue-600">{booking.policyNumber}</span>
                       
                       <div/>
                       <div/>
                       <span className="font-bold">EXPIRY DATE.</span>
                       <span className="font-medium text-blue-600">{valuation.policyExpiryDate ? new Date(valuation.policyExpiryDate.toDate()).toLocaleDateString() : 'N/A'}</span>
                    </div>
                </section>

                <p className="text-[12px] my-1 text-center">A brief, integrity examination and road test has been carried out on the vehicle described below and the findings are as follows.</p>

                <section className="mb-1 text-[12px]">
                    <div className="grid grid-cols-3 gap-x-4 gap-y-0">
                        <DetailItem label="REGISTRATION NO" value={booking.plateNumber} />
                        <DetailItem label="MAKE" value={booking.carMake} />
                        <DetailItem label="TYPE :" value={booking.carType} />
                        <DetailItem label="CHASSIS NO" value={valuation.chassisNo} />
                        <DetailItem label="COLOUR" value={valuation.colour} />
                        <DetailItem label="FUEL TYPE" value={valuation.fuelType} />
                        <DetailItem label="ENGINE NO" value={valuation.engineNo} />
                        <DetailItem label="ENGINE RATING" value={valuation.engineRating} />
                        <DetailItem label="DATE OF REG." value={valuation.dateOfReg ? new Date(valuation.dateOfReg.toDate()).toLocaleDateString() : 'N/A'} />
                        <DetailItem label="YEAR OF MAN." value={valuation.yearOfManufacture} />
                        <DetailItem label="ODOMETER READING" value={valuation.odometerReadings} />
                        <DetailItem label="COUNTRY OF ORIGIN" value={valuation.countryOfOrigin} />
                        <DetailItem label="NO OF AIRBAGS" value={valuation.numberOfAirbags} />
                        <DetailItem label="LIGHTS" value={valuation.lightsType} />
                    </div>
                </section>
                
                <section className="mb-1 break-inside-avoid">
                     <h4 className="font-bold text-[14px] underline mb-0.5">Coachwork</h4>
                     <div className="grid grid-cols-3 gap-x-4">
                        <ConditionItem question="Accident Repairs Noted?" answer={valuation.coachWork?.accidentRepairs} />
                        <ConditionItem question="Accident Damages noted?" answer={valuation.coachWork?.accidentDamagesNoted} />
                        <ConditionItem question="Are roof linings damaged or repaired?" answer={valuation.coachWork?.roofLiningsDamaged} />
                        <ConditionItem question="Is Paint work Scratched/ Faded/ Dented?" answer={valuation.coachWork?.paintWorkScratched} />
                        <ConditionItem question="Are inner wings repaired or damaged?" answer={valuation.coachWork?.innerWingsRepaired} />
                        <ConditionItem question="Are Bumpers/ Outer Wing repaired?" answer={valuation.coachWork?.bumpersOuterWingRepaired} />
                        <ConditionItem question="Has the body had a complete respray?" answer={valuation.coachWork?.completeRespray} />
                        <ConditionItem question="Is Upholstery Torn/faded/worn out??" answer={valuation.coachWork?.upholsteryTorn} />
                        <ConditionItem question="Is the Chassis kinked or damaged?" answer={valuation.coachWork?.chassisKinked} />
                    </div>
                </section>

                <section className="mb-1 break-inside-avoid">
                     <h4 className="font-bold text-[14px] underline mb-0.5">Mechanical Condition</h4>
                     <div className="grid grid-cols-3 gap-x-4">
                        <ConditionItem question="is the parking brake effective?" answer={valuation.mechanicalCondition?.parkingBrakeEffective} />
                        <ConditionItem question="is the braking system okay?" answer={valuation.mechanicalCondition?.brakingSystemOk} />
                        <ConditionItem question="Are the drive shafts/cv joints worn out?" answer={valuation.mechanicalCondition?.driveShaftWorn} />
                        <ConditionItem question="is the automatic/manual gearbox okay?" answer={valuation.mechanicalCondition?.gearboxOk} />
                        <ConditionItem question="is the steering system okay?" answer={valuation.mechanicalCondition?.steeringSystemOk} />
                        <ConditionItem question="is the suspension system okay?" answer={valuation.mechanicalCondition?.suspensionSystemOk} />
                        <ConditionItem question="Is cooling system operating well?" answer={valuation.mechanicalCondition?.coolingSystemOk} />
                        <ConditionItem question="Are There signs of fluid or oil leakage?" answer={valuation.mechanicalCondition?.fluidLeakage} />
                        <ConditionItem question="Are engine mountings worn out?" answer={valuation.mechanicalCondition?.engineMountingsWorn} />
                    </div>
                </section>

                <section className="mb-1 break-inside-avoid">
                     <h4 className="font-bold text-[14px] underline mb-0.5">Electrical Condition</h4>
                     <div className="grid grid-cols-3 gap-x-4">
                        <ConditionItem question="Do the indicator lights operate well?" answer={valuation.electricalCondition?.indicatorLightsOk} />
                        <ConditionItem question="Are the wipers operating well?" answer={valuation.electricalCondition?.wipersOk} />
                        <ConditionItem question="Do the brake lights operate well?" answer={valuation.electricalCondition?.brakeLightsOk} />
                        <ConditionItem question="Are the headlights operating well?" answer={valuation.electricalCondition?.headlightsOk} />
                        <ConditionItem question="Do the instrument panel lights work well?" answer={valuation.electricalCondition?.instrumentPanelLightsOk} />
                     </div>
                </section>

                <section className="my-1 space-y-0.5">
                    <NoteItem label="COACHWORK NOTES" value={valuation.coachWorkNotes} />
                    <NoteItem label="ELECTRICAL NOTES" value={valuation.electricalNotes} />
                    <NoteItem label="MECHANICAL NOTES" value={valuation.mechanicalNotes} />
                    <NoteItem label="ANTI THEFT" value={valuation.antiTheft} />
                    <NoteItem label="TYRES" value={`${valuation.tyresType} - ${valuation.tyresCondition}`} />
                    <NoteItem label="GENERAL CONDITION" value="good" />
                    <NoteItem label="EXTRAS:" value={valuation.extras} />
                </section>
                
                <section className="my-1">
                    <div className="py-0.5">
                        <span className="font-bold uppercase text-[12px] text-gray-600">ASSESSED VALUE : </span>
                        <span className="font-bold text-blue-600 text-[12px]">{`${assessmentValueInWords} (Kshs. ${valuation.assessmentValue})`}</span>
                    </div>
                </section>
                
                <section className="my-1 text-[12px]">
                    <span className="font-bold uppercase text-[12px] text-gray-600">NOTE VALUE</span>
                    <div className="grid grid-cols-2 gap-x-12 mt-0.5">
                      <div className="flex justify-between items-baseline">
                          <span className="text-gray-700">Radio Estimate</span>
                          <span className="text-blue-600 font-medium">{valuation.wsValue}</span>
                      </div>
                       <div className="flex justify-between items-baseline">
                          <span className="text-gray-700">Windscreen Estimate</span>
                          <span className="text-blue-600 font-medium">{valuation.rsValue}</span>
                      </div>
                    </div>
                </section>

                <section className="my-1 space-y-0.5">
                    <NoteItem label="REMARKS:" value={valuation.comments} />
                    <NoteItem label="REMEDY :" value="" />
                    <NoteItem label="DISCLAIMER :" value="none" />
                </section>
                
                <section className="mt-2 grid grid-cols-2 gap-x-8 text-[12px]">
                    <DetailItem label="COUNTRY OF ORIGIN" value={valuation.countryOfOrigin} />
                    <DetailItem label="DATE OF INSPECTION" value={valuation.assessmentDate ? new Date(valuation.assessmentDate.toDate()).toLocaleDateString() : 'N/A'} />
                    <DetailItem label="DESTINATION" value={`${valuation.insurer} prompt insurance agency`} />
                    <DetailItem label="EXAMINER" value={valuation.valuedBy} />
                    <div/>
                    <DetailItem label="LOCATION OF INSPECTION" value={booking.branch} />
                </section>
                
                <section className="mt-2 grid grid-cols-2 gap-x-8 text-[12px]">
                  <div>
                    <span className="font-bold uppercase">Signed</span>
                  </div>
                   <div>
                    <span className="font-bold uppercase mr-2">Date</span>
                    <span className="text-blue-600">{valuation.assessmentDate ? new Date(valuation.assessmentDate.toDate()).toLocaleDateString() : 'N/A'}</span>
                  </div>
                </section>

                <p className="text-center font-bold text-[12px] mt-2">For and on Behalf of CASA Motor Valuers & Assessors Ltd</p>
                
                <div className="break-before-page">
                    <div className="my-4 break-inside-avoid">
                        <h3 className="font-bold text-[14px] underline mb-2">Valuation Photos</h3>
                        <div className="grid grid-cols-2 gap-4">
                            {valuation.imageUrls.map((url, index) => (
                                <div key={index} className="border p-1 rounded-md bg-gray-100 break-inside-avoid">
                                    <Image src={url} alt={`Valuation Photo ${index + 1}`} width={400} height={300} className="object-contain w-full h-auto" />
                                </div>
                            ))}
                        </div>
                    </div>
                    
                    <div className="my-4 break-inside-avoid">
                        <h3 className="font-bold text-[14px] underline mb-2">Logbook</h3>
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
            <footer className="bg-[#1a1a1a] p-2 text-white text-[11px] mt-auto print-footer">
                <div className="max-w-5xl mx-auto grid grid-cols-3 gap-4 text-center">
                    <div className="flex items-center justify-center gap-2">
                        <Phone size={12} className="text-primary"/>
                        <span>0722924854 / 0737924854</span>
                    </div>
                    <div className="flex items-center justify-center gap-2">
                        <MapPin size={12} className="text-primary"/>
                        <span>Plessy Hse, next to Nissan Kenya & Carrefour Mega, Uhuru Highway, Nairobi</span>
                    </div>
                    <div className="flex items-center justify-center gap-2">
                        <Mail size={12} className="text-primary"/>
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
      isVerification: false,
    };
  }

  componentDidMount() {
    const bookingId = this.props.searchParams.get('id');
    const isVerification = this.props.searchParams.get('verify') === 'true';
    
    this.setState({ isVerification });

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
            const printDate = new Date().toLocaleDateString('en-CA');
            document.title = `${bookingData.bookingNumber} - ${bookingData.customerName} - ${printDate}`;
            const reportUrl = `${window.location.origin}/admin/valuation-report?id=${bookingId}&verify=true`;
            const qrUrl = await QRCode.toDataURL(reportUrl, { width: 128, margin: 1, color: { dark: '#FFFFFF', light: '#00000000' } });
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
          {!this.state.isVerification && (
              <div className="flex justify-end mb-6 gap-4 print:hidden">
                <Button onClick={() => window.print()} variant="default">
                  Print / Save PDF
                </Button>
                <Button onClick={this.handleGoBack} variant="outline" className="text-black border-black hover:bg-black hover:text-white">
                  <ArrowLeft className="mr-2 h-5 w-5" />
                  Go Back
                </Button>
              </div>
          )}
          <ReportToPrint 
            valuation={this.state.valuation} 
            booking={this.state.booking} 
            qrCodeUrl={this.state.qrCodeUrl}
            isVerification={this.state.isVerification}
          />
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
