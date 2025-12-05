

"use client";

import React, { Suspense, useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { doc, getDoc, getDocs, collection, query, where, orderBy } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Button } from '@/components/ui/button';
import { Loader2, ArrowLeft, Phone, MapPin, Mail, XCircle } from 'lucide-react';
import Image from 'next/image';
import QRCode from 'qrcode';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { AuthGuard } from '@/hooks/use-auth';


interface Valuation {
    id: string;
    bookingId: string;
    assessmentDate: any;
    assessmentValue: string;
    forcedValue: string;
    wsValue: string;
    rsValue: string;
    imageUrls: string[]; // These are now IDs
    valuedBy: string;
    valuedAt: any;
    status?: 'Approved' | 'Rejected' | 'Pending Approval';
    rejectionReason?: string;
    purpose?: string;
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
  policyExpiryDate?: any;
  authorisedBy?: string;
  createdAt: any;
  branch?: string; 
  insurerName?: string;
  logbookImageId?: string;
  insuranceLetterId?: string;
  status: string;
  rejectionReason?: string;
}

interface PopulatedReportData {
    valuation: Valuation;
    booking: Booking;
    logbookImage?: string;
    insuranceLetterImage?: string;
    valuationImages: string[];
}

interface ReportState {
  reportData: PopulatedReportData | null;
  loading: boolean;
  qrCodeUrl: string | null;
  isVerification: boolean;
}

const DetailItem = ({ label, value, className, labelSize = 'text-xs', valueSize = 'text-xs' }: { label: string; value: React.ReactNode, className?: string, labelSize?: string, valueSize?: string }) => (
    <div className={className}>
        <span className={`font-bold text-gray-700 uppercase mr-2 ${labelSize}`}>{label}</span>
        <span className={`text-red-700 font-medium text-right ${valueSize}`}>{value || 'N/A'}</span>
    </div>
);

const ConditionItem = ({ question, answer }: { question: string, answer?: 'Yes' | 'No' }) => (
    <div className="flex justify-between py-0">
        <span className="text-xs">{question}</span>
        <span className={`font-bold text-xs ${answer === 'Yes' ? 'text-red-700' : 'text-green-700'}`}>{answer || 'N/A'}</span>
    </div>
)

const NoteItem = ({ label, value }: { label: string, value?: string }) => (
     <div className="flex items-start">
        <span className="font-bold uppercase text-gray-600 mr-2 text-xs">{label}</span>
        <p className={`font-medium text-red-700 text-xs`}>{value || 'N/A'}</p>
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


class ReportToPrint extends React.Component<{reportData: PopulatedReportData | null, qrCodeUrl: string | null, isVerification: boolean, onDownloadClick: () => void}> {
  
  state = {
    isVerificationDialogOpen: this.props.isVerification
  }

  componentDidUpdate(prevProps: { isVerification: boolean; }) {
    if (this.props.isVerification && !prevProps.isVerification) {
      this.setState({ isVerificationDialogOpen: true });
    }
  }

  handleDownload = () => {
    this.setState({ isVerificationDialogOpen: false }, () => {
      // Use a timeout to allow the dialog to close before printing
      setTimeout(() => {
        window.print();
      }, 100);
    });
  }

  render() {
    const { reportData, qrCodeUrl } = this.props;

    if (!reportData) {
        return <div className="p-4 text-center text-muted-foreground">No valuation report found for this booking.</div>;
    }

    const { valuation, booking, logbookImage, valuationImages, insuranceLetterImage } = reportData;
    const assessmentValueInWords = valuation.assessmentValue ? `${numberToWords(valuation.assessmentValue)} Shillings Only` : 'N/A';
    
    const chunkedImages = [];
    for (let i = 0; i < valuationImages.length; i += 9) {
        chunkedImages.push(valuationImages.slice(i, i + 9));
    }

    return (
        <div className="bg-white shadow-2xl rounded-lg flex flex-col font-sans-trebuchet italic">
            <div className="watermarked-valuation break-after-page">
                <div className="report-content">
                    <header className="relative p-2 flex items-start gap-4 border-b border-gray-300 print-header">
                        <div className="flex-shrink-0">
                            <Image src="/logo.jpeg" alt="Sonic Motor Valuers Logo" width={150} height={150} className="object-contain" />
                        </div>
                        <div className="flex-grow text-center mt-2">
                            <h2 className="font-georgia font-bold text-3xl text-red-800">SONIC MOTOR VALUERS AND ASSESSORS LTD</h2>
                            <div className="font-sans-times font-bold text-xs mt-1 text-blue-800 text-center">
                                <p>
                                    Dealer in: Valuation and Assessment for Bank Loan Facilities, Motor Vehicles Buying & Selling, Court Bonds,
                                    Inventories, Insurance purposes and Accident Assessment etc.
                                </p>
                                <p>
                                    Location: Plessy Hse, next to Highway Mall & Carrefour Mega, along Uhuru Highway.
                                </p>
                                <p>
                                    P.O. Box 103-90200, Nairobi. Mob: 0798662206/0750677839
                                </p>
                            </div>
                        </div>
                    </header>
                    <main className="flex-grow px-8 pt-1 pb-2">
                        <AlertDialog open={this.state.isVerificationDialogOpen} onOpenChange={(open) => this.setState({ isVerificationDialogOpen: open })}>
                        <AlertDialogContent>
                            <AlertDialogHeader>
                            <AlertDialogTitle>Verified Authentic Report</AlertDialogTitle>
                            <AlertDialogDescription>
                                This is a Verified Authentic Report from SONIC. Click the button below to download.
                            </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                                <AlertDialogCancel>Close</AlertDialogCancel>
                                <AlertDialogAction onClick={this.handleDownload}>
                                    Download Report
                                </AlertDialogAction>
                            </AlertDialogFooter>
                        </AlertDialogContent>
                        </AlertDialog>
                        
                        <section className="bg-red-100 p-1 my-1 border-y border-red-200">
                            <div className="text-center text-xs font-bold">
                                <span>Serial No: {booking.bookingNumber}</span>
                                <span className="ml-4">{booking.insurerName} ({booking.branch})</span>
                            </div>
                            <p className="text-center font-bold text-xs underline">(FOR INSURANCE USE ONLY)</p>
                        </section>

                        <h3 className="font-bold text-base text-center my-1 underline">MOTOR VEHICLE VALUATION & INSPECTION CERTIFICATE</h3>

                        <section className="mb-1 text-xs">
                            <div className="grid grid-cols-[auto_1fr_auto_1fr] gap-x-4 gap-y-0">
                            <span className="font-bold">CLIENT'S NAME:</span>
                            <span className="font-medium text-red-700">{booking.customerName}</span>
                            <span className="font-bold">CONTACTS:</span>
                            <span className="font-medium text-red-700">{booking.customerPhone}</span>

                            <span className="font-bold">INSURER:</span>
                            <span className="font-medium text-red-700">{valuation.insurer}</span>
                            <span className="font-bold">POLICY NO:</span>
                            <span className="font-medium text-red-700">{booking.policyNumber}</span>

                            <span className="font-bold">EXP:</span>
                            <span className="font-medium text-red-700">{booking.policyExpiryDate ? new Date(booking.policyExpiryDate.toDate()).toLocaleDateString() : 'N/A'}</span>
                            <span className="font-bold">CLIENT'S EMAIL:</span>
                            <span className="font-medium text-red-700">{booking.customerEmail || 'TBA'}</span>

                            <span className="font-bold">P.O BOX:</span>
                            <span className="font-medium text-red-700">TBA</span>
                            </div>
                        </section>

                        <p className="text-xs my-1 text-center">A brief, integrity examination and road test has been carried out on the vehicle described below and the findings are as follows.</p>

                        <section className="mb-1 text-xs">
                            <div className="grid grid-cols-2 gap-x-4 gap-y-0">
                                <DetailItem label="REGISTRATION:" value={booking.plateNumber} />
                                <DetailItem label="MAKE:" value={`${booking.carMake} ${booking.carModel}`} />
                                <DetailItem label="TYPE:" value={booking.carType} />
                                <DetailItem label="FUEL:" value={valuation.fuelType} />
                                <DetailItem label="COLOUR:" value={valuation.colour} />
                                <DetailItem label="ENGINE RATING:" value={valuation.engineRating} />
                                <DetailItem label="YEAR OF MAN:" value={valuation.yearOfManufacture} />
                                <DetailItem label="DATE OF REG:" value={valuation.dateOfReg ? new Date(valuation.dateOfReg.toDate()).toLocaleDateString() : 'N/A'} />
                                <DetailItem label="MILEAGE:" value={valuation.odometerReadings} />
                                <DetailItem label="CHASSIS NO:" value={valuation.chassisNo} />
                                <DetailItem label="ENGINE NO:" value={valuation.engineNo} />
                            </div>
                        </section>
                        
                        <section className="mb-1">
                            <h4 className="font-bold text-sm underline mb-0.5">COACH WORK</h4>
                            <div className="grid grid-cols-2 gap-x-4">
                                <ConditionItem question="Accident Repairs Noted?" answer={valuation.coachWork?.accidentRepairs} />
                                <ConditionItem question="Accident Damages noted?" answer={valuation.coachWork?.accidentDamagesNoted} />
                                <ConditionItem question="Is Paint work Scratched/faded?" answer={valuation.coachWork?.paintWorkScratched} />
                                <ConditionItem question="Are inner wings repaired or damaged?" answer={valuation.coachWork?.innerWingsRepaired} />
                                <ConditionItem question="Are roof linings damaged or repaired?" answer={valuation.coachWork?.roofLiningsDamaged} />
                                <ConditionItem question="Has the body had a complete re-spray?" answer={valuation.coachWork?.completeRespray} />
                                <ConditionItem question="Is Upholstery Torn/faded/worn out?" answer={valuation.coachWork?.upholsteryTorn} />
                                <ConditionItem question="Are bumpers/Outer Wing repaired?" answer={valuation.coachWork?.bumpersOuterWingRepaired} />
                                <ConditionItem question="Is the Chassis kinked or damaged?" answer={valuation.coachWork?.chassisKinked} />
                            </div>
                        </section>

                        <section className="mb-1">
                            <h4 className="font-bold text-sm underline mb-0.5">MECHANICAL CONDITION</h4>
                            <div className="grid grid-cols-2 gap-x-4">
                                <ConditionItem question="is the parking brake effective?" answer={valuation.mechanicalCondition?.parkingBrakeEffective} />
                                <ConditionItem question="is the braking system okay?" answer={valuation.mechanicalCondition?.brakingSystemOk} />
                                <ConditionItem question="Is the automatic/manual gearbox okay?" answer={valuation.mechanicalCondition?.gearboxOk} />
                                <ConditionItem question="is the steering system okay?" answer={valuation.mechanicalCondition?.steeringSystemOk} />
                                <ConditionItem question="Are there signs of fluid or oil leakage?" answer={valuation.mechanicalCondition?.fluidLeakage} />
                                <ConditionItem question="is the cooling system operating well?" answer={valuation.mechanicalCondition?.coolingSystemOk} />
                                <ConditionItem question="Are the drive shafts/cv joints worn out?" answer={valuation.mechanicalCondition?.driveShaftWorn} />
                                <ConditionItem question="is the suspension system okay?" answer={valuation.mechanicalCondition?.suspensionSystemOk} />
                                <ConditionItem question="Are engine mountings lights work well?" answer={valuation.mechanicalCondition?.engineMountingsWorn} />
                            </div>
                        </section>

                        <section className="mb-1">
                            <h4 className="font-bold text-sm underline mb-0.5">ELECTRICAL CONDITION</h4>
                            <div className="grid grid-cols-2 gap-x-4">
                                <ConditionItem question="Do the indicator lights operate well?" answer={valuation.electricalCondition?.indicatorLightsOk} />
                                <ConditionItem question="Are the wipers operating well?" answer={valuation.electricalCondition?.wipersOk} />
                                <ConditionItem question="Are the headlights operating well?" answer={valuation.electricalCondition?.headlightsOk} />
                                <ConditionItem question="Do the brake lights operate well?" answer={valuation.electricalCondition?.brakeLightsOk} />
                                <ConditionItem question="Do the instrument panel lights work well?" answer={valuation.electricalCondition?.instrumentPanelLightsOk} />
                                <ConditionItem question="Do the ignition start?" answer={valuation.electricalCondition?.wipersOk} />
                            </div>
                        </section>
                        
                        <section className="my-1 space-y-0 text-xs">
                            <NoteItem label="COACH WORK STATUS:" value={valuation.coachWorkNotes} />
                            <NoteItem label="MECHANICAL STATUS:" value={valuation.mechanicalNotes} />
                            <NoteItem label="ELECTRICAL STATUS:" value={valuation.electricalNotes} />
                            <NoteItem label="TYRES:" value={`${valuation.tyresType} - ${valuation.tyresCondition}`} />
                            <NoteItem label="GENERAL CONDITION:" value="Good-Working condition" />
                        </section>
                        
                        <section className="my-1">
                            <div className="py-0.5">
                                <span className="font-bold uppercase text-xs text-gray-600">ASSESSED VALUE: </span>
                                <span className="font-bold uppercase text-red-700 text-xs">{`${assessmentValueInWords} (Kshs. ${valuation.assessmentValue})`}</span>
                            </div>
                        </section>
                        
                        <div className="grid grid-cols-2 gap-x-8 items-start my-2">
                           <section className="text-xs space-y-0.5">
                                <NoteItem label="COUNTRY OF ORIGIN:" value={valuation.countryOfOrigin} />
                                <NoteItem label="EXTRAS:" value={valuation.extras} />
                                <NoteItem label="ANTI THEFT:" value={valuation.antiTheft} />
                                <NoteItem label="LOG BOOK OWNERSHIP DETAILS:" value={booking.customerName} />
                                <NoteItem label="REMARKS:" value={valuation.comments} />
                                <NoteItem label="REMEDY:" value="NONE" />
                                <NoteItem label="DISCLAIMER:" value="Logbook was not available at the time of inspection, valuation based on importation documents" />
                                <NoteItem label="NOTE VALUE:" value={`Windscreen Kshs.${valuation.wsValue}/= Estimate, Radio System Kshs.${valuation.rsValue}/= Estimate`} />
                            </section>
                            
                            <section className="text-xs space-y-0.5">
                                <NoteItem label="EXAMINER:" value={valuation.valuedBy} />
                                <NoteItem label="LOCATION OF INSPECTION:" value={booking.branch} />
                                <NoteItem label="DESTINATION:" value={valuation.insurer} />
                                <NoteItem label="PREPARED BY:" value={valuation.valuedBy} />
                                <NoteItem label="VALUATION AUTHORISED BY:" value={booking.branch} />
                            </section>
                        </div>
                        
                        <div className="grid grid-cols-2 gap-x-8 items-end">
                            <div>
                                <div className="flex items-start">
                                    <span className="font-bold uppercase text-gray-600 mr-2 text-xs">AUTHORISED SIGNATURE:</span>
                                    <div className="relative h-10 w-28 -mt-2">
                                        <Image src="/signature.png" alt="Signature" layout="fill" objectFit="contain" />
                                    </div>
                                </div>
                            </div>
                            <div className="relative z-10 justify-self-end text-center">
                                <div className="relative border-2 border-blue-800 p-1 w-40">
                                    <Image src="/stamp.png" alt="Company Stamp" width={150} height={75} className="object-contain" />
                                </div>
                                <div className="grid grid-cols-2 gap-x-2 mt-2 text-xs">
                                    <span className="font-bold text-gray-600">BROKER/AGENT:</span>
                                    <span className="font-medium text-red-700">{booking.authorisedBy}</span>
                                    <span className="font-bold text-gray-600">DATE:</span>
                                    <span className="font-medium text-red-700">{valuation.assessmentDate ? new Date(valuation.assessmentDate.toDate()).toLocaleDateString() : 'N/A'}</span>
                                </div>
                            </div>
                        </div>

                    </main>
                </div>
            </div>

            {chunkedImages.map((imageChunk, pageIndex) => (
                <div key={pageIndex} className="break-before-page watermarked-valuation">
                     <div className="report-content my-2 break-inside-avoid px-8">
                        <h3 className="font-bold text-base underline mb-1">Valuation Photos (Page {pageIndex + 1})</h3>
                        <div className="grid grid-cols-3 gap-2">
                            {imageChunk.map((url, index) => (
                                <div key={index} className="border p-1 rounded-md bg-gray-100 break-inside-avoid">
                                    <Image src={url} alt={`Valuation Photo ${index + 1}`} width={250} height={180} className="object-contain w-full h-auto" />
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            ))}

            <div className="break-before-page watermarked-valuation">
                <div className="report-content my-2 break-inside-avoid px-8">
                    <h3 className="font-bold text-base underline mb-1">Insurance Letter</h3>
                    {insuranceLetterImage ? (
                        <div className="border p-1 rounded-md max-w-full bg-gray-100">
                            <Image src={insuranceLetterImage} alt="Insurance Letter" width={800} height={1000} className="object-contain w-full h-auto" />
                        </div>
                    ) : (
                        <p className="text-gray-500 italic text-sm">No insurance letter provided.</p>
                    )}
                </div>
            </div>
            
            <div className="break-before-page watermarked-valuation">
                <div className="report-content my-2 break-inside-avoid px-8">
                    <h3 className="font-bold text-base underline mb-1">Logbook</h3>
                    {logbookImage ? (
                        <div className="border p-1 rounded-md max-w-full bg-gray-100">
                            <Image src={logbookImage} alt="Logbook" width={800} height={1000} className="object-contain w-full h-auto" />
                        </div>
                    ) : (
                        <p className="text-gray-500 italic text-sm">No logbook provided.</p>
                    )}
                </div>
            </div>
            
             <div className="break-before-page watermarked-valuation">
                <div className="report-content my-2 break-inside-avoid px-8 pt-10">
                    <p className="text-center font-bold text-xs">FOR AND ON BEHALF OF SONICMOTOR VALUERS & ASSESSORS LTD</p>
                    <p className="text-center text-xs mt-1">
                        The report reflects the estimated Market value of the subjected vehicle in its present condition, at the time of valuation. Any future
                        assessment will take into account any changes in the meantime, due to usage etc. This report is based on information on the logbook/
                        Importation documents.
                    </p>
                    <p className="text-center text-xs font-bold mt-2">Email: soniemotorvaluers@gmail.com</p>
                </div>
            </div>
        </div>
    );
  }
}

class ValuationReportPageContent extends React.Component<{ router: any; searchParams: any }, ReportState> {
  state: ReportState = {
    reportData: null,
    loading: true,
    qrCodeUrl: null,
    isVerification: false,
  };
  
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
        // Fetch Booking
        const bookingDocRef = doc(db, 'bookings', bookingId);
        const bookingSnap = await getDoc(bookingDocRef);
        if (!bookingSnap.exists()) {
            throw new Error("Booking not found");
        }
        const bookingData = { id: bookingSnap.id, ...bookingSnap.data() } as Booking;
        
        // Fetch Valuation
        const valQuery = query(collection(db, "valuations"), where("bookingId", "==", bookingId));
        const valuationSnapshot = await getDocs(valQuery);
        if (valuationSnapshot.empty) {
            throw new Error("Valuation not found");
        }
        const valuationData = { id: valuationSnapshot.docs[0].id, ...valuationSnapshot.docs[0].data() } as Valuation;

        // Fetch Logbook Image
        let logbookImage: string | undefined;
        if (bookingData.logbookImageId) {
            const logbookDoc = await getDoc(doc(db, "uploads", bookingData.logbookImageId));
            if (logbookDoc.exists()) {
                logbookImage = logbookDoc.data().imageData;
            }
        }
        
        // Fetch Insurance Letter Image
        let insuranceLetterImage: string | undefined;
        if (bookingData.insuranceLetterId) {
            const insuranceDoc = await getDoc(doc(db, "uploads", bookingData.insuranceLetterId));
            if (insuranceDoc.exists()) {
                insuranceLetterImage = insuranceDoc.data().imageData;
            }
        }
        
        // Fetch Valuation Images and sort them
        let valuationImages: string[] = [];
        if (valuationData.imageUrls && valuationData.imageUrls.length > 0) {
            const imageDocsQuery = query(
                collection(db, "uploads"), 
                where("__name__", "in", valuationData.imageUrls),
                orderBy("createdAt", "asc")
            );
            const imageDocsSnapshot = await getDocs(imageDocsQuery);
            const imageDataMap = new Map(imageDocsSnapshot.docs.map(d => [d.id, d.data().imageData as string]));
            // Sort based on the original order in imageUrls to maintain upload order
            valuationImages = valuationData.imageUrls.map(id => imageDataMap.get(id)).filter(Boolean) as string[];
        }
        
        this.setState({ 
            reportData: { 
                booking: bookingData, 
                valuation: valuationData,
                logbookImage,
                insuranceLetterImage,
                valuationImages,
            }
        });
        
        document.title = `${bookingData.plateNumber} - ${bookingData.bookingNumber}`;
        const reportUrl = `${window.location.origin}/verify-report?id=${bookingId}&verify=true`;
        const qrUrl = await QRCode.toDataURL(reportUrl, { width: 128, margin: 1 });
        this.setState({ qrCodeUrl: qrUrl });

    } catch (error) {
        console.error("Error fetching reports:", error);
    } finally {
        this.setState({ loading: false });
    }
  }
  
  handleGoBack = () => {
    this.props.router.push('/admin/dashboard');
  };

  handleDownload = () => {
      window.print();
  }

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
            reportData={this.state.reportData} 
            qrCodeUrl={this.state.qrCodeUrl}
            isVerification={this.state.isVerification}
            onDownloadClick={this.handleDownload}
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

const GuardedValuationReportPage = AuthGuard(ValuationReportWrapper, { allowClients: true });

export default GuardedValuationReportPage;
