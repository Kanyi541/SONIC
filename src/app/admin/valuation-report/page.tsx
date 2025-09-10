
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
    resaleAbility?: string;
    specialPointOut?: string;
    disclaimer?: string;
    windscreenValue?: string;
    radioSystemValue?: string;
    examiner?: string;
    locationOfInspection?: string;
    destination?: string;
    brokerAgent?: string;
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
    <div>
        <span className="font-bold text-xs uppercase text-gray-600">{label}:</span>
        <span className="ml-2 font-mono text-xs font-bold text-blue-800">{value || 'N/A'}</span>
    </div>
);


class ReportToPrint extends React.Component<{valuation: Valuation | null, booking: Booking | null, qrCodeUrl: string | null}> {
  render() {
    const { valuation, booking, qrCodeUrl } = this.props;

    if (!valuation || !booking) {
        return <div className="p-4 text-center text-muted-foreground">No valuation report found for this booking.</div>;
    }
    
    const accessories = [
        valuation.numberOfAirbags ? `${valuation.numberOfAirbags} SRS airbags` : null,
        valuation.extras,
    ].filter(Boolean).join(', ');

    return (
      <div className="bg-white shadow-lg rounded-lg p-6 font-sans text-[10px] leading-tight">
        {/* Header */}
        <div className="flex justify-between items-start mb-2">
          <div className="w-1/4">
            <Image src="/logo.png" alt="Company Logo" width={150} height={60} />
          </div>
          <div className="w-3/4 text-center -ml-12">
            <h1 className="font-bold text-lg text-blue-900">CASA Motor Valuers & Assessors Ltd</h1>
            <p className="text-[9px]">Plessy Hse, next to Nissan Kenya & Carrefour Mega, Uhuru Highway, Nairobi</p>
            <p className="text-[9px]">Mob: 0722924854 / 0737924854</p>
            <p className="text-[9px]">Email: casamotorvaluers@gmail.com</p>
          </div>
        </div>

        <div className="text-center bg-gray-200 py-1 my-2">
            <h2 className="font-bold text-base tracking-wider">MOTOR VEHICLE VALUATION REPORT</h2>
        </div>

        {/* Top Meta */}
        <div className="border-y border-gray-400 py-1">
            <div className="flex justify-between">
                <DetailItem label="Serial No" value={booking.bookingNumber} />
                <DetailItem label="Purpose" value="FOR INSURANCE USE ONLY" />
                <DetailItem label="Date" value={valuation.assessmentDate ? new Date(valuation.assessmentDate.toDate()).toLocaleDateString() : 'N/A'} />
            </div>
            <div className="flex justify-between mt-1">
                <div className="w-1/2">
                    <DetailItem label="Client's Name" value={booking.customerName} />
                    <DetailItem label="Insurer" value={booking.insurerName} />
                    <DetailItem label="Exp" value={valuation.policyExpiryDate ? new Date(valuation.policyExpiryDate.toDate()).toLocaleDateString() : 'N/A'} />
                </div>
                <div className="w-1/2">
                    <DetailItem label="Contacts" value={booking.customerPhone} />
                    <DetailItem label="Ins Cert. No" value={booking.policyNumber} />
                    <DetailItem label="Policy No" value={booking.policyNumber} />
                    <DetailItem label="Client's Email" value={booking.customerEmail} />
                </div>
            </div>
             <p className="text-[9px] mt-1">{valuation.comments || 'A brief, integrity examination and road test has been carried out on the vehicle described below and the findings are as follows.'}</p>
        </div>
        
        {/* Particulars */}
        <div className="text-center font-bold text-xs my-1 underline">MOTOR VEHICLE PARTICULARS</div>
        <div className="grid grid-cols-2 gap-x-6 border-y border-gray-400 py-1">
            <div>
                <DetailItem label="Registration" value={booking.plateNumber} />
                <DetailItem label="Type" value={booking.carType} />
                <DetailItem label="Propellant" value={valuation.fuelType} />
                <DetailItem label="Engine Rating" value={valuation.engineRating} />
                <DetailItem label="Date of Reg." value={valuation.dateOfReg ? new Date(valuation.dateOfReg.toDate()).toLocaleDateString() : 'N/A'} />
                <DetailItem label="Chassis No." value={valuation.chassisNo} />
                <DetailItem label="Country of Origin" value={valuation.countryOfOrigin} />
                <DetailItem label="Anti Theft" value={valuation.antiTheft} />
                <DetailItem label="Logbook Ownership Details" value={booking.customerName} />
            </div>
            <div>
                <DetailItem label="Make" value={booking.carMake} />
                <DetailItem label="Model" value={booking.carModel} />
                <DetailItem label="Colour" value={valuation.colour} />
                <DetailItem label="Transmission" value={valuation.transmissionType} />
                <DetailItem label="Year of Man" value={valuation.yearOfManufacture} />
                <DetailItem label="Mileage" value={valuation.odometerReadings} />
                <DetailItem label="Engine No." value={valuation.engineNo} />
            </div>
        </div>

        {/* Accessories */}
        <div className="text-center font-bold text-xs my-1 underline">VEHICLE ACCESSORIES</div>
        <p className="border-y border-gray-400 py-1 text-blue-800 font-bold">{accessories}</p>

        {/* Values & Details */}
        <div className="border-b border-gray-400 py-1">
            <DetailItem label="General Condition" value={valuation.tyresCondition} />
            <DetailItem label="Assessed Value" value={`Kshs. ${valuation.assessmentValue}/=`} />
            <DetailItem label="Forced Value" value={`(Ksh. ${valuation.forcedValue}/=)`} />
            <DetailItem label="Resale Ability" value={valuation.resaleAbility} />
            <DetailItem label="Special Point Out" value={valuation.specialPointOut} />
            <DetailItem label="Disclaimer" value={valuation.disclaimer} />
            <div className="flex justify-between">
                <DetailItem label="Value" value={`Windscreen Kshs. ${valuation.windscreenValue}/= Estimate`} />
                <DetailItem label="Radio System" value={`Kshs.${valuation.radioSystemValue}/= Estimate`} />
            </div>
            <div className="flex justify-between">
                 <DetailItem label="Examiner" value={valuation.examiner} />
                 <DetailItem label="Prepared By" value={valuation.valuedBy} />
            </div>
            <DetailItem label="Location of Inspection" value={valuation.locationOfInspection} />
            <DetailItem label="Destination" value={valuation.destination} />
             <div className="flex justify-between">
                <DetailItem label="Valuation Authorised By" value={booking.authorisedBy} />
                <DetailItem label="Broker/Agent" value={valuation.brokerAgent} />
             </div>
        </div>
        
        {/* Footer */}
        <div className="flex justify-between items-end mt-2">
            <div>
                <p className="font-bold">AUTHORISED SIGNATURE: ........................</p>
            </div>
            <div className="relative w-24 h-24">
                <Image src="/stamp.png" alt="Stamp" layout="fill" objectFit="contain" />
            </div>
            <div className="w-24 h-24">
                {qrCodeUrl && <Image src={qrCodeUrl} alt="QR Code" width={96} height={96} />}
            </div>
        </div>
        
        <div className="text-center mt-2 text-[8px] space-y-0.5">
            <p className="text-red-600 font-bold">We do not authenticate logbook & Chassis chemical analysis.</p>
            <p className="font-bold">FOR AND ON BEHALF OF CASA Motor Valuers & Assessors Ltd-C2025</p>
            <p>The report reflects the estimated Market value of the subjected vehicle in its present condition, at the time of valuation. Any future assessment will take into account any changes in the meantime, due to usage etc. This report is based on information on the logbook/Importation documents.</p>
            <div className="flex justify-between items-center">
                <p>Email: casamotorvaluers@gmail.com</p>
                <p className="font-bold italic">A Zone of efficiency and integrity.</p>
            </div>
            <p>Website: www.casamotorvaluers.co.ke</p>
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
            const qrUrl = await QRCode.toDataURL(reportUrl);
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

    
