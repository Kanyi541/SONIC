
"use client";

import React, { Suspense, useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { doc, getDoc, getDocs, collection, query, where } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Button } from '@/components/ui/button';
import { Loader2, ArrowLeft } from 'lucide-react';
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
    <div className="flex justify-between">
        <span className="font-bold text-xs uppercase text-gray-600">{label}:</span>
        <span className="font-mono text-xs font-bold text-blue-800 text-right">{value || 'N/A'}</span>
    </div>
);

const ConditionItem = ({ question, answer }: { question: string, answer?: 'Yes' | 'No' }) => (
    <div className="flex justify-between text-xs py-1 border-b border-gray-100">
        <span>{question}</span>
        <span className="font-bold">{answer || 'N/A'}</span>
    </div>
)

const NoteItem = ({ label, value }: { label: string, value?: string }) => (
    <div className="flex text-xs">
        <span className="font-bold uppercase text-gray-600 w-32">{label}:</span>
        <span className="font-bold text-blue-800">{value || 'N/A'}</span>
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
      <div className="bg-white shadow-lg rounded-lg p-4 font-sans text-[10px] leading-tight border-2 border-black">
        <div className="text-center mb-2">
            <h1 className="font-bold text-lg text-blue-900">CASA Motor Valuers & Assessors Ltd</h1>
            <p className="text-[9px]">Plessy Hse, next to Nissan Kenya & Carrefour Mega, Uhuru Highway, Nairobi</p>
            <p className="text-[9px]">Mob: 0722924854 / 0737924854 | Email: casamotorvaluers@gmail.com</p>
            <h2 className="font-bold text-base tracking-wider mt-1 bg-gray-200 py-1">MOTOR VEHICLE VALUATION REPORT</h2>
        </div>
        
        {/* Top Header Block */}
        <div className="grid grid-cols-12 gap-x-4 border-y-2 border-black py-1">
            <div className="col-span-4 space-y-1">
                <DetailItem label="Serial No" value={booking.bookingNumber} />
                <DetailItem label="Client Name" value={booking.customerName} />
                <DetailItem label="Insurer" value={valuation.insurer || booking.insurerName} />
            </div>
            <div className="col-span-4 space-y-1">
                <DetailItem label="Issued By" value="Casa Motor Valuers And Assessors" />
                <DetailItem label="Contacts" value={booking.customerPhone} />
                <DetailItem label="Policy No." value={booking.policyNumber} />
            </div>
            <div className="col-span-4 space-y-1">
                 <div className="flex justify-between"><div></div><div></div></div>
                 <div className="flex justify-between"><div></div><div></div></div>
                <DetailItem label="Expiry Date" value={valuation.policyExpiryDate ? new Date(valuation.policyExpiryDate.toDate()).toLocaleDateString() : 'N/A'} />
            </div>
        </div>

        {/* Vehicle Particulars */}
        <div className="grid grid-cols-12 gap-x-4 border-y-2 border-black py-1">
             <div className="col-span-4 space-y-1">
                <DetailItem label="Registration No" value={booking.plateNumber} />
                <DetailItem label="Chassis No" value={valuation.chassisNo} />
                <DetailItem label="Engine No" value={valuation.engineNo} />
                <DetailItem label="Year of Man." value={valuation.yearOfManufacture} />
                <DetailItem label="Air Bags" value={valuation.numberOfAirbags} />
            </div>
            <div className="col-span-4 space-y-1">
                <DetailItem label="Make" value={booking.carMake} />
                <DetailItem label="Colour" value={valuation.colour} />
                <DetailItem label="Engine Rating" value={valuation.engineRating} />
                <DetailItem label="Odometer Reading" value={valuation.odometerReadings} />
                <DetailItem label="Lights" value={valuation.lightsType} />
            </div>
            <div className="col-span-4 space-y-1">
                <DetailItem label="Type" value={booking.carType} />
                <DetailItem label="Fuel Type" value={valuation.fuelType} />
                <DetailItem label="Date of Reg." value={valuation.dateOfReg ? new Date(valuation.dateOfReg.toDate()).toLocaleDateString() : 'N/A'} />
                <DetailItem label="Country of Origin" value={valuation.countryOfOrigin} />
            </div>
        </div>
        
        {/* Condition Checklists */}
        <div className="grid grid-cols-12 gap-x-4 my-2">
            <div className="col-span-6">
                <h4 className="font-bold text-sm underline mb-1">Coachwork</h4>
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
             <div className="col-span-6">
                <h4 className="font-bold text-sm underline mb-1">Mechanical Condition</h4>
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
        <div className="my-2">
             <h4 className="font-bold text-sm underline mb-1">Electrical Condition</h4>
             <div className="grid grid-cols-3 gap-x-4">
                <ConditionItem question="Do the indicator lights operate well?" answer={valuation.electricalCondition?.indicatorLightsOk} />
                <ConditionItem question="Do the brake lights operate well?" answer={valuation.electricalCondition?.brakeLightsOk} />
                <ConditionItem question="Are the wipers operating well?" answer={valuation.electricalCondition?.wipersOk} />
                <ConditionItem question="Are the headlights operating well?" answer={valuation.electricalCondition?.headlightsOk} />
                <ConditionItem question="Do the Instrument panel lights work well?" answer={valuation.electricalCondition?.instrumentPanelLightsOk} />
             </div>
        </div>

        {/* Notes */}
        <div className="space-y-1 my-2">
            <NoteItem label="Coachwork Notes" value={valuation.coachWorkNotes} />
            <NoteItem label="Electrical Notes" value={valuation.electricalNotes} />
            <NoteItem label="Mechanical Notes" value={valuation.mechanicalNotes} />
            <NoteItem label="Anti Theft" value={valuation.antiTheft} />
            <NoteItem label="Tyres" value={`${valuation.tyresType} - ${valuation.tyresCondition}`} />
            <NoteItem label="General Condition" value="Good" />
            <NoteItem label="Extras" value={valuation.extras} />
        </div>

        {/* Assessed Value */}
        <div className="border-y-2 border-black py-1 my-2">
            <NoteItem label="Assessed Value" value={`${assessmentValueInWords} (Kshs. ${valuation.assessmentValue})`} />
        </div>

        {/* Note Value */}
        <div className="flex justify-between my-2">
            <h4 className="font-bold text-sm uppercase">Note Value</h4>
            <div className="flex gap-8">
                <DetailItem label="Noted Value: WS (KES)" value={valuation.wsValue} />
                <DetailItem label="Noted Value: RS (KES)" value={valuation.rsValue} />
            </div>
            <div></div>
        </div>

        {/* Final Details */}
        <div className="space-y-1 my-2">
             <NoteItem label="Remarks" value={valuation.comments || 'N/A'} />
        </div>

        <div className="grid grid-cols-12 gap-x-4 border-y-2 border-black py-1 my-2">
             <div className="col-span-6 space-y-1">
                <DetailItem label="Country of Origin" value={valuation.countryOfOrigin} />
                <DetailItem label="Destination" value={booking.insurerName} />
             </div>
             <div className="col-span-6 space-y-1">
                <DetailItem label="Examiner" value={valuation.valuedBy} />
                <DetailItem label="Location of Inspection" value={booking.branch} />
             </div>
        </div>

        {/* Footer */}
        <div className="flex justify-between items-end mt-2">
            <div className="w-1/3">
                <p className="font-bold text-[8px]">For and on Behalf of CASA Motor Valuers & Assessors Ltd</p>
                 <div className="mt-8">
                    <DetailItem label="Date of Inspection" value={valuation.assessmentDate ? new Date(valuation.assessmentDate.toDate()).toLocaleDateString() : 'N/A'} />
                     <div className="flex justify-between mt-2">
                        <span className="font-bold text-xs uppercase text-gray-600">Signed:</span>
                        <div className="w-2/3 border-b border-gray-600"></div>
                    </div>
                </div>
            </div>
            <div className="w-1/3 text-center">
                <p className="text-red-600 font-bold text-[8px] italic">A zone of efficiency and integrity</p>
            </div>
            <div className="w-1/3 flex justify-end">
                <div className="w-24 h-24">
                    {qrCodeUrl && <Image src={qrCodeUrl} alt="QR Code" width={96} height={96} />}
                </div>
            </div>
        </div>
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
            const reportUrl = window.location.href;
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
        <div className="max-w-4xl mx-auto">
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
