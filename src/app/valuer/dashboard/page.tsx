

"use client";

import { useState, useEffect, useRef, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import UnifiedDashboardLayout from '@/components/dashboard/unified-dashboard-layout';
import { collection, onSnapshot, doc, updateDoc, addDoc, serverTimestamp, query, where, getDoc, setDoc } from "firebase/firestore";
import { db } from '@/lib/firebase';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Car, Clock, CheckCircle, Hourglass, FilePen, Printer, Calendar as CalendarIcon, Upload, X, Image as ImageIcon, Loader2, Search, XCircle, FileSignature, FileWarning, ChevronLeft, ChevronRight, ChevronDown, Download } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { format, startOfMonth, endOfMonth, eachDayOfInterval, getDate, subDays } from 'date-fns';
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Form, FormField, FormItem, FormControl, FormMessage, FormLabel } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import Image from 'next/image';
import { Textarea } from '@/components/ui/textarea';
import { Progress } from "@/components/ui/progress";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { LineChart, Line, ResponsiveContainer, XAxis, YAxis, Tooltip, Legend, CartesianGrid } from "recharts"
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"
import { Tabs, TabsContent } from '@/components/ui/tabs';
import { cn } from '@/lib/utils';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { carData } from '@/lib/car-data';
import Loading from '@/app/loading';


interface LoggedInUser {
    name: string;
    username: string;
    email: string;
    role: string;
}

interface Booking {
  id: string;
  bookingNumber: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  plateNumber: string;
  carMake: string;
  carModel: string;
  policyNumber?: string;
  createdAt: any;
  status: string;
  insurerName: string;
  authorisedBy?: string;
  branch?: string;
  comments?: string;
  insuranceLetterId?: string;
  logbookImageId?: string;
}

interface Valuation {
    id: string;
    bookingId: string;
    assessmentDate: any;
    imageUrls: string[];
    valuedBy: string;
    valuedAt: any;
    status: 'Approved' | 'Rejected' | 'Pending Approval';
    rejectionReason?: string;
    purpose?: string;
    
    // New Fields
    insurer: string;
    carType?: string;
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


type ChartDataPoint = {
    day: string;
    Pending: number;
    Approved: number;
    Rejected: number;
};

const valuationSchema = z.object({
  assessmentDate: z.date({ required_error: "An assessment date is required." }),
  purpose: z.string().min(1, "Purpose of valuation is required."),
  comments: z.string().optional(),
  insurer: z.string().min(1, "Insurer is required."),
  carType: z.string().optional(),
  policyExpiryDate: z.date().optional(),
  chassisNo: z.string().optional(),
  colour: z.string().optional(),
  fuelType: z.string().optional(),
  engineNo: z.string().optional(),
  engineRating: z.string().optional(),
  dateOfReg: z.date().optional(),
  yearOfManufacture: z.string().optional(),
  odometerReadings: z.string().optional(),
  countryOfOrigin: z.string().optional(),
  numberOfAirbags: z.string().optional(),
  lightsType: z.string().optional(),
  transmissionType: z.string().optional(),
  coachWork: z.object({
    accidentRepairs: z.enum(['Yes', 'No']).optional(),
    paintWorkScratched: z.enum(['Yes', 'No']).optional(),
    completeRespray: z.enum(['Yes', 'No']).optional(),
    accidentDamagesNoted: z.enum(['Yes', 'No']).optional(),
    innerWingsRepaired: z.enum(['Yes', 'No']).optional(),
    upholsteryTorn: z.enum(['Yes', 'No']).optional(),
    roofLiningsDamaged: z.enum(['Yes', 'No']).optional(),
    bumpersOuterWingRepaired: z.enum(['Yes', 'No']).optional(),
    chassisKinked: z.enum(['Yes', 'No']).optional(),
  }).optional(),
  coachWorkNotes: z.string().optional(),
  mechanicalCondition: z.object({
    parkingBrakeEffective: z.enum(['Yes', 'No']).optional(),
    gearboxOk: z.enum(['Yes', 'No']).optional(),
    coolingSystemOk: z.enum(['Yes', 'No']).optional(),
    brakingSystemOk: z.enum(['Yes', 'No']).optional(),
    steeringSystemOk: z.enum(['Yes', 'No']).optional(),
    fluidLeakage: z.enum(['Yes', 'No']).optional(),
    driveShaftWorn: z.enum(['Yes', 'No']).optional(),
    suspensionSystemOk: z.enum(['Yes', 'No']).optional(),
    engineMountingsWorn: z.enum(['Yes', 'No']).optional(),
  }).optional(),
  mechanicalNotes: z.string().optional(),
  electricalCondition: z.object({
    indicatorLightsOk: z.enum(['Yes', 'No']).optional(),
    brakeLightsOk: z.enum(['Yes', 'No']).optional(),
    wipersOk: z.enum(['Yes', 'No']).optional(),
    headlightsOk: z.enum(['Yes', 'No']).optional(),
    instrumentPanelLightsOk: z.enum(['Yes', 'No']).optional(),
  }).optional(),
  electricalNotes: z.string().optional(),
  antiTheft: z.string().optional(),
  tyresType: z.string().optional(),
  tyresCondition: z.string().optional(),
  extras: z.string().optional(),
});


type ValuationFormValues = z.infer<typeof valuationSchema>;


export default function ValuerDashboardPage() {
    const [loggedInUser, setLoggedInUser] = useState<LoggedInUser | null>(null);
    const [bookings, setBookings] = useState<Booking[]>([]);
    const [valuations, setValuations] = useState<Valuation[]>([]);
    const [loading, setLoading] = useState(true);
    const [isValuationDialogOpen, setValuationDialogOpen] = useState(false);
    const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
    const [valuationImages, setValuationImages] = useState<string[]>([]);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const router = useRouter();
    const { toast } = useToast();
    const [searchTerm, setSearchTerm] = useState('');
    const [chartData, setChartData] = useState<ChartDataPoint[]>([]);
    const [itemsPerPage] = useState(5);
    const [allCarsCurrentPage, setAllCarsCurrentPage] = useState(1);
    const [pendingCurrentPage, setPendingCurrentPage] = useState(1);
    const [completedCurrentPage, setCompletedCurrentPage] = useState(1);
    const [rejectedCurrentPage, setRejectedCurrentPage] = useState(1);

    const [loadingBookingDocs, setLoadingBookingDocs] = useState(false);
    const [insuranceLetter, setInsuranceLetter] = useState<string | null>(null);
    const [logbookImage, setLogbookImage] = useState<string | null>(null);
    const [newInsuranceLetterData, setNewInsuranceLetterData] = useState<string | null>(null);
    const [newLogbookImageData, setNewLogbookImageData] = useState<string | null>(null);


    const form = useForm<ValuationFormValues>({
        resolver: zodResolver(valuationSchema),
        defaultValues: {
            insurer: "",
            purpose: "",
            carType: "",
            policyExpiryDate: undefined,
            chassisNo: "",
            colour: "",
            fuelType: "",
            engineNo: "",
            engineRating: "",
            dateOfReg: undefined,
            yearOfManufacture: "",
            odometerReadings: "",
            countryOfOrigin: "",
            numberOfAirbags: "",
            lightsType: "",
            transmissionType: "",
            coachWorkNotes: "",
            mechanicalNotes: "",
            electricalNotes: "",
            antiTheft: "",
            tyresType: "",
            tyresCondition: "",
            extras: "",
            comments: "",
        }
    });

    const carTypes = useMemo(() => {
        if (selectedBooking) {
            const make = carData.find(m => m.brand === selectedBooking.carMake);
            const model = make?.models.find(m => m.name === selectedBooking.carModel);
            return model?.types || [];
        }
        return [];
    }, [selectedBooking]);
    
    useEffect(() => {
        const storedUserString = sessionStorage.getItem('loggedInUser');
        if (storedUserString) {
            try {
                const user: LoggedInUser = JSON.parse(storedUserString);
                setLoggedInUser(user);
            } catch (e) {
                console.error("Failed to parse user from session storage", e);
                router.push('/');
            }
        } else {
             router.push('/');
        }
    }, [router]);

    const generateChartData = (bookings: Booking[]) => {
      const today = new Date();
      const firstDayOfMonth = startOfMonth(today);
      const lastDayOfMonth = endOfMonth(today);
      const daysInMonth = eachDayOfInterval({ start: firstDayOfMonth, end: lastDayOfMonth });

      const monthlyData: ChartDataPoint[] = daysInMonth.map(day => ({
          day: format(day, 'd'),
          Pending: 0,
          Approved: 0,
          Rejected: 0,
      }));

      bookings.forEach(booking => {
          if (booking.createdAt) {
              const bookingDate = booking.createdAt.toDate();
              if (bookingDate >= firstDayOfMonth && bookingDate <= lastDayOfMonth) {
                  const dayOfMonth = getDate(bookingDate) - 1; 
                  if (monthlyData[dayOfMonth]) {
                      if (booking.status === 'Pending Valuation') monthlyData[dayOfMonth].Pending++;
                      if (booking.status === 'Completed') monthlyData[dayOfMonth].Approved++;
                      if (booking.status === 'Rejected') monthlyData[dayOfMonth].Rejected++;
                  }
              }
          }
      });
      
      setChartData(monthlyData);
    };

    useEffect(() => {
        if (!loggedInUser?.username) {
            setLoading(false);
            return;
        }

        setLoading(true);
        const bookingsQuery = query(
            collection(db, "bookings"),
            where("assignedValuerId", "==", loggedInUser.username)
        );

        const bookingsUnsubscribe = onSnapshot(bookingsQuery, (snapshot) => {
            const bookingsData: Booking[] = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() as Booking }));
            const sortedBookings = bookingsData.sort((a, b) => (b.createdAt?.toMillis() || 0) - (a.createdAt?.toMillis() || 0));
            setBookings(sortedBookings);
            generateChartData(sortedBookings);
            setLoading(false);
        }, (error) => {
            console.error("Error fetching bookings:", error);
            toast({ variant: "destructive", title: "Error", description: "Could not fetch assigned bookings." });
            setLoading(false);
        });
        
        const valuationsQuery = query(collection(db, "valuations"));
        const valuationsUnsubscribe = onSnapshot(valuationsQuery, (snapshot) => {
            const valuationsData: Valuation[] = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() as Valuation }));
            setValuations(valuationsData);
        }, (error) => {
             console.error("Error fetching valuations:", error);
        });

        return () => {
            bookingsUnsubscribe();
            valuationsUnsubscribe();
        };
    }, [loggedInUser, toast]);
    
    const compressImage = (file: File): Promise<string> => {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.readAsDataURL(file);
            reader.onload = (loadEvent) => {
                const img = new window.Image();
                img.src = loadEvent.target?.result as string;
                img.onload = () => {
                    const canvas = document.createElement("canvas");
                    const MAX_WIDTH = 1024;
                    const MAX_HEIGHT = 1024;
                    let { width, height } = img;

                    if (width > height) {
                        if (width > MAX_WIDTH) {
                            height *= MAX_WIDTH / width;
                            width = MAX_WIDTH;
                        }
                    } else {
                        if (height > MAX_HEIGHT) {
                            width *= MAX_HEIGHT / height;
                            height = MAX_HEIGHT;
                        }
                    }
                    canvas.width = width;
                    canvas.height = height;
                    const ctx = canvas.getContext("2d");
                    if (!ctx) return reject(new Error("Could not get canvas context"));
                    
                    ctx.drawImage(img, 0, 0, width, height);
                    resolve(canvas.toDataURL("image/jpeg", 0.7));
                };
                img.onerror = reject;
            };
            reader.onerror = reject;
        });
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, setData: (data: string | null) => void) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            if (!file.type.startsWith('image/')) {
                toast({ variant: "destructive", title: "Invalid File Type", description: "Please select an image file." });
                e.target.value = '';
                return;
            }
            compressImage(file).then(compressedData => {
                setData(compressedData);
            }).catch(error => {
                console.error("Error compressing image:", error);
                toast({ variant: "destructive", title: "File Error", description: "Could not process the image." });
                setData(null);
            });
        } else {
            setData(null);
        }
    };


    const handleValuationImagesChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        if (event.target.files) {
            const files = Array.from(event.target.files);
            const compressionPromises = files.map(compressImage);

            Promise.all(compressionPromises).then(compressedUrls => {
                setValuationImages(prevUrls => [...prevUrls, ...compressedUrls]);
            }).catch(error => {
                console.error("Error compressing images:", error);
                toast({
                    variant: "destructive",
                    title: "Image Processing Error",
                    description: "There was an error while compressing the images. Please try again.",
                });
            });
        }
    };

    const removeValuationImage = (index: number) => {
        setValuationImages(prevData => prevData.filter((_, i) => i !== index));
    };
    
    const handleValuationSubmit = async (data: ValuationFormValues) => {
        if (!selectedBooking || !loggedInUser) return;
        
        const isInsuranceLetterMissing = !insuranceLetter && !newInsuranceLetterData;
        const isLogbookMissing = !logbookImage && !newLogbookImageData;

        if (valuationImages.length === 0 || isInsuranceLetterMissing || isLogbookMissing) {
            toast({ variant: "destructive", title: "Missing Photos", description: "Please upload all required photos (Valuation, Insurance Letter, Logbook)." });
            return;
        }

        setIsSubmitting(true);
    
        try {
            const uploadedValuationImageIds: string[] = [];
            for (const dataUrl of valuationImages) {
                const uploadRef = await addDoc(collection(db, "uploads"), {
                    bookingId: selectedBooking.id,
                    imageData: dataUrl,
                    createdAt: serverTimestamp(),
                    type: 'valuationPhoto',
                });
                uploadedValuationImageIds.push(uploadRef.id);
            }
            
            const bookingDocRef = doc(db, "bookings", selectedBooking.id);
            let updatedInsuranceLetterId = selectedBooking.insuranceLetterId;
            let updatedLogbookImageId = selectedBooking.logbookImageId;

            if (newInsuranceLetterData) {
                const uploadRef = await addDoc(collection(db, "uploads"), {
                    bookingId: selectedBooking.id,
                    imageData: newInsuranceLetterData,
                    createdAt: serverTimestamp(),
                    type: 'insuranceLetter',
                });
                updatedInsuranceLetterId = uploadRef.id;
            }

            if (newLogbookImageData) {
                const uploadRef = await addDoc(collection(db, "uploads"), {
                    bookingId: selectedBooking.id,
                    imageData: newLogbookImageData,
                    createdAt: serverTimestamp(),
                    type: 'logbookImage',
                });
                updatedLogbookImageId = uploadRef.id;
            }
            
            if (newInsuranceLetterData || newLogbookImageData) {
                await updateDoc(bookingDocRef, {
                    insuranceLetterId: updatedInsuranceLetterId,
                    logbookImageId: updatedLogbookImageId,
                });
            }

            const valuationDocRef = doc(collection(db, "valuations"));
            await setDoc(valuationDocRef, {
                ...data,
                bookingId: selectedBooking.id,
                imageUrls: uploadedValuationImageIds,
                valuedBy: loggedInUser.name,
                valuedAt: serverTimestamp(),
                status: "Pending Approval",
            });
    
            await updateDoc(bookingDocRef, {
                status: "Valuated"
            });
    
            toast({
                title: "Valuation Submitted",
                description: `Report for ${selectedBooking.bookingNumber} has been submitted for admin approval.`,
            });
            
            setValuationDialogOpen(false);
    
        } catch (error) {
            console.error("Error submitting valuation:", error);
            toast({
                variant: "destructive",
                title: "Submission Failed",
                description: "An error occurred while submitting the valuation.",
            });
        } finally {
            setIsSubmitting(false);
        }
    };
    

    const openValuationDialog = async (booking: Booking) => {
        form.reset();
        setValuationImages([]);
        setInsuranceLetter(null);
        setLogbookImage(null);
        setNewInsuranceLetterData(null);
        setNewLogbookImageData(null);
        setSelectedBooking(booking);
        setValuationDialogOpen(true);
        setLoadingBookingDocs(true);

        try {
            if (booking.insuranceLetterId) {
                const docRef = doc(db, "uploads", booking.insuranceLetterId);
                const docSnap = await getDoc(docRef);
                if (docSnap.exists()) {
                    setInsuranceLetter(docSnap.data().imageData);
                }
            }
             if (booking.logbookImageId) {
                const docRef = doc(db, "uploads", booking.logbookImageId);
                const docSnap = await getDoc(docRef);
                if (docSnap.exists()) {
                    setLogbookImage(docSnap.data().imageData);
                }
            }
        } catch (error) {
            console.error("Error fetching booking documents:", error);
            toast({ variant: "destructive", title: "Error", description: "Could not load booking documents." });
        } finally {
            setLoadingBookingDocs(false);
        }
    };

    const getStatusVariant = (status: string): "default" | "secondary" | "destructive" | "outline" => {
        switch (status) {
            case "Pending": return "secondary";
            case "Pending Valuation": return "outline";
            case "Pending Approval": return "outline";
            case "Valuated": return "secondary";
            case "Completed": return "default";
            case "Rejected": return "destructive";
            default: return "default";
        }
    };

    const sortedBookings = useMemo(() => {
        const statusOrder: { [key: string]: number } = {
            "Pending Valuation": 1,
            "Valuated": 2,
            "Completed": 3,
            "Rejected": 4,
        };

        const filtered = bookings.filter(booking => {
            const searchTermLower = searchTerm.toLowerCase();
            return (
                booking.bookingNumber.toLowerCase().includes(searchTermLower) ||
                booking.customerName.toLowerCase().includes(searchTermLower) ||
                booking.plateNumber.toLowerCase().includes(searchTermLower) ||
                booking.insurerName.toLowerCase().includes(searchTermLower)
            );
        });

        return filtered.sort((a, b) => {
            const orderA = statusOrder[a.status] || 99;
            const orderB = statusOrder[b.status] || 99;
            if (orderA !== orderB) {
                return orderA - orderB;
            }
            return (b.createdAt?.toMillis() || 0) - (a.createdAt?.toMillis() || 0);
        });
    }, [bookings, searchTerm]);


    const getFilteredBookingsByStatus = (status: string | string[]) => {
        const statuses = Array.isArray(status) ? status : [status];
        return sortedBookings.filter(b => statuses.includes(b.status));
    };
    
    const pendingValuationBookings = getFilteredBookingsByStatus('Pending Valuation');
    const rejectedBookings = getFilteredBookingsByStatus('Rejected');
    const completedBookings = getFilteredBookingsByStatus('Completed');
    const valuatedBookings = getFilteredBookingsByStatus('Valuated');


    const stats = {
        total: bookings.length,
        pendingValuation: pendingValuationBookings.length,
        completed: completedBookings.length,
        rejected: rejectedBookings.length,
        valuated: valuatedBookings.length,
    };
    
    const StatCard = ({ title, value, icon, onClick, progress, colorClass }: { title: string, value: number, icon: React.ReactNode, onClick?: () => void, progress: number, colorClass: string }) => (
      <Card onClick={onClick} className={`${onClick ? 'cursor-pointer hover:bg-muted' : ''} transition-colors p-4 flex flex-col justify-between`}>
          <div className="flex items-start justify-between">
              <div className={`w-12 h-12 rounded-full flex items-center justify-center bg-muted`}>
                  {icon}
              </div>
              <div className="text-3xl font-bold">{loading ? <Skeleton className="h-9 w-12" /> : value}</div>
          </div>
          <div className="mt-4">
              <p className="text-sm font-medium text-muted-foreground">{title}</p>
              <Progress value={progress} className={`h-1 mt-1 ${colorClass}`} indicatorClassName={colorClass} />
          </div>
      </Card>
    );

    const chartConfig = {
      Pending: {
        label: "Pending Valuation",
        color: "hsl(var(--secondary-foreground))",
      },
      Approved: {
        label: "Approved",
        color: "hsl(var(--chart-1))",
      },
      Rejected: {
          label: "Rejected",
          color: "hsl(var(--primary))"
      }
    } 

    const renderBookingsTable = (
        bookingsData: Booking[],
        title: string,
        description: string,
        page: number,
        setPage: (page: number) => void
    ) => {
        const totalPages = Math.ceil(bookingsData.length / itemsPerPage);
        const startIndex = (page - 1) * itemsPerPage;
        const paginatedData = bookingsData.slice(startIndex, startIndex + itemsPerPage);

        return (
         <Card>
            <CardHeader>
               <div className="flex justify-between items-center">
                    <div>
                        <CardTitle className="font-headline text-3xl text-primary">{title}</CardTitle>
                        <CardDescription>{description}</CardDescription>
                    </div>
                    <div className="relative w-full max-w-sm">
                        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input
                            type="search"
                            placeholder="Search bookings..."
                            className="w-full rounded-lg bg-background pl-8"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                </div>
            </CardHeader>
            <CardContent>
                 <Table>
                    <TableHeader>
                        <TableRow className="bg-muted/50">
                            <TableHead className="font-semibold w-[50px]">No.</TableHead>
                            <TableHead className="font-semibold">Booking ID</TableHead>
                            <TableHead className="hidden sm:table-cell font-semibold">Customer</TableHead>
                            <TableHead className="hidden md:table-cell font-semibold">Vehicle</TableHead>
                            <TableHead className="hidden md:table-cell font-semibold">Client</TableHead>
                            <TableHead className="font-semibold">Status</TableHead>
                            <TableHead className="text-right font-semibold">Action</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                    {loading ? (
                        Array.from({ length: itemsPerPage }).map((_, index) => (
                        <TableRow key={index}>
                            <TableCell><Skeleton className="h-5 w-8" /></TableCell>
                            <TableCell><Skeleton className="h-5 w-24" /></TableCell>
                            <TableCell className="hidden sm:table-cell"><Skeleton className="h-5 w-32" /></TableCell>
                            <TableCell className="hidden md:table-cell"><Skeleton className="h-5 w-40" /></TableCell>
                            <TableCell className="hidden md:table-cell"><Skeleton className="h-5 w-32" /></TableCell>
                            <TableCell><Skeleton className="h-6 w-20" /></TableCell>
                            <TableCell className="text-right"><Skeleton className="h-8 w-24 ml-auto" /></TableCell>
                        </TableRow>
                        ))
                    ) : paginatedData.length > 0 ? (
                        paginatedData.map((booking, index) => (
                        <TableRow key={booking.id}>
                            <TableCell>{startIndex + index + 1}</TableCell>
                            <TableCell className="font-mono text-xs truncate">{booking.bookingNumber}</TableCell>
                            <TableCell className="font-medium hidden sm:table-cell">{booking.customerName}</TableCell>
                            <TableCell className="hidden md:table-cell">{booking.plateNumber}</TableCell>
                            <TableCell className="hidden md:table-cell">{booking.insurerName}</TableCell>
                            <TableCell>
                            <Badge variant={getStatusVariant(booking.status)}>{booking.status}</Badge>
                            </TableCell>
                            <TableCell className="text-right space-x-2">
                                {booking.status === 'Pending Valuation' && (
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => openValuationDialog(booking)}
                                >
                                    <FilePen className="mr-2 h-4 w-4" />
                                    <span className="hidden sm:inline">Valuate</span>
                                </Button>
                                )}
                            </TableCell>
                        </TableRow>
                        ))
                    ) : (
                        <TableRow>
                            <TableCell colSpan={7} className="text-center h-24">
                                No bookings found.
                            </TableCell>
                        </TableRow>
                    )}
                    </TableBody>
                </Table>
                <div className="flex justify-end items-center gap-2 mt-4">
                    <Button variant="outline" size="sm" onClick={() => setPage(page - 1)} disabled={page === 1}>
                        <ChevronLeft className="h-4 w-4" />
                        Previous
                    </Button>
                    <span className="text-sm">Page {page} of {totalPages}</span>
                    <Button variant="outline" size="sm" onClick={() => setPage(page + 1)} disabled={page === totalPages}>
                        Next
                        <ChevronRight className="h-4 w-4" />
                    </Button>
                </div>
            </CardContent>
        </Card>
    )};

    const renderRadioGroup = (name: any, label: string) => (
        <FormField
            control={form.control}
            name={name}
            render={({ field }) => (
                <FormItem className="flex items-center justify-between rounded-lg border p-4">
                    <FormLabel className="text-sm">{label}</FormLabel>
                    <FormControl>
                        <RadioGroup
                            onValueChange={field.onChange}
                            defaultValue={field.value}
                            className="flex items-center space-x-4"
                        >
                            <FormItem className="flex items-center space-x-2">
                                <FormControl>
                                    <RadioGroupItem value="Yes" />
                                </FormControl>
                                <FormLabel className="font-normal">Yes</FormLabel>
                            </FormItem>
                            <FormItem className="flex items-center space-x-2">
                                <FormControl>
                                    <RadioGroupItem value="No" />
                                </FormControl>
                                <FormLabel className="font-normal">No</FormLabel>
                            </FormItem>
                        </RadioGroup>
                    </FormControl>
                </FormItem>
            )}
        />
    );
    
    const isSubmitDisabled = isSubmitting || valuationImages.length === 0 || (!insuranceLetter && !newInsuranceLetterData) || (!logbookImage && !newLogbookImageData);

    if (loading) {
      return <Loading />;
    }

    return (
        <UnifiedDashboardLayout
            title="CASA Motor Assessors Ltd"
            userRole={loggedInUser?.name || "Valuer"}
            userEmail={loggedInUser?.email || ""}
            menuItems={[
                { name: 'Dashboard', view: 'dashboard' },
            ]}
            footerContent={(
                 <>
                    <p className="text-sm text-muted-foreground">
                        &copy; {new Date().getFullYear()} CASA Motor Assessors Ltd. All rights reserved.
                    </p>
                    <p className="text-sm text-muted-foreground">
                        Designed by <a href="https://elvisdev.netlify.app/" target="_blank" rel="noopener noreferrer" className="font-medium underline underline-offset-4">Tekivo Technologies</a>
                    </p>
                </>
            )}
        >
            {(activeView, setActiveView) => (
                <>
                    <Tabs value={activeView} onValueChange={setActiveView} className="w-full">
                        <TabsContent value="dashboard">
                            <div className="grid gap-8">
                                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                                   <StatCard 
                                        title="All Cars" 
                                        value={stats.total} 
                                        icon={<Car className="h-6 w-6 text-blue-500" />} 
                                        onClick={() => setActiveView('all-bookings')}
                                        progress={100}
                                        colorClass="bg-blue-500"
                                    />
                                     <StatCard 
                                        title="Pending Valuation" 
                                        value={stats.pendingValuation} 
                                        icon={<FileSignature className="h-6 w-6 text-orange-500" />} 
                                        onClick={() => setActiveView('pending-valuation-bookings')}
                                        progress={stats.total > 0 ? (stats.pendingValuation / stats.total) * 100 : 0}
                                        colorClass="bg-orange-500"
                                    />
                                    <StatCard 
                                        title="Rejected by Admin" 
                                        value={stats.rejected} 
                                        icon={<XCircle className="h-6 w-6 text-red-500" />} 
                                        onClick={() => setActiveView('rejected-bookings')}
                                        progress={stats.total > 0 ? (stats.rejected / stats.total) * 100 : 0}
                                        colorClass="bg-red-500"
                                    />
                                     <StatCard 
                                        title="Approved" 
                                        value={stats.completed} 
                                        icon={<CheckCircle className="h-6 w-6 text-green-500" />} 
                                        onClick={() => setActiveView('completed-bookings')}
                                        progress={stats.total > 0 ? (stats.completed / stats.total) * 100 : 0}
                                        colorClass="bg-green-500"
                                    />
                                </div>
                                {renderBookingsTable(sortedBookings, "All Cars", "A summary of all assigned bookings.", allCarsCurrentPage, setAllCarsCurrentPage)}
                            </div>
                        </TabsContent>
                        <TabsContent value="all-bookings">
                           {renderBookingsTable(sortedBookings, "All Bookings", "A list of all assigned bookings.", allCarsCurrentPage, setAllCarsCurrentPage)}
                        </TabsContent>
                         <TabsContent value="pending-valuation-bookings">
                           {renderBookingsTable(pendingValuationBookings, "Pending Valuations", "A list of all new vehicle valuations.", pendingCurrentPage, setPendingCurrentPage)}
                        </TabsContent>
                         <TabsContent value="completed-bookings">
                           {renderBookingsTable(completedBookings, "Completed Valuations", "A list of all valuations that have been completed.", completedCurrentPage, setCompletedCurrentPage)}
                        </TabsContent>
                         <TabsContent value="rejected-bookings">
                           {renderBookingsTable(rejectedBookings, "Rejected Valuations", "A list of all valuations that have been rejected by clients.", rejectedCurrentPage, setRejectedCurrentPage)}
                        </TabsContent>
                    </Tabs>
                    <Dialog open={isValuationDialogOpen} onOpenChange={setValuationDialogOpen}>
                        <DialogContent className="sm:max-w-4xl grid-rows-[auto_1fr_auto] max-h-[90vh]">
                            <DialogHeader>
                                <DialogTitle>Valuation Form</DialogTitle>
                                <DialogDescription>
                                    Fill in the details below for booking #{selectedBooking?.bookingNumber}.
                                </DialogDescription>
                            </DialogHeader>
                            <div className="overflow-y-auto pr-6 -mr-6">
                            <Form {...form}>
                                <form onSubmit={form.handleSubmit(handleValuationSubmit)} className="space-y-6">
                                    <Card>
                                        <CardHeader>
                                            <CardTitle className="text-lg">Booking Details</CardTitle>
                                        </CardHeader>
                                        <CardContent className="space-y-4">
                                            <div className="grid grid-cols-2 gap-4 text-sm">
                                                <div className="space-y-1"><Label className="text-muted-foreground">Customer Name</Label><p className="font-medium">{selectedBooking?.customerName}</p></div>
                                                <div className="space-y-1"><Label className="text-muted-foreground">Customer Phone</Label><p className="font-medium">{selectedBooking?.customerPhone}</p></div>
                                                <div className="space-y-1"><Label className="text-muted-foreground">Customer Email</Label><p className="font-medium">{selectedBooking?.customerEmail}</p></div>
                                                <div className="space-y-1"><Label className="text-muted-foreground">Client</Label><p className="font-medium">{selectedBooking?.insurerName}</p></div>
                                                <div className="space-y-1"><Label className="text-muted-foreground">Vehicle</Label><p className="font-medium">{`${selectedBooking?.carMake} ${selectedBooking?.carModel}`}</p></div>
                                                <div className="space-y-1"><Label className="text-muted-foreground">Plate Number</Label><p className="font-medium">{selectedBooking?.plateNumber}</p></div>
                                                <div className="space-y-1"><Label className="text-muted-foreground">Policy Number</Label><p className="font-medium">{selectedBooking?.policyNumber}</p></div>
                                                <div className="space-y-1"><Label className="text-muted-foreground">Booking Number</Label><p className="font-medium">{selectedBooking?.bookingNumber}</p></div>
                                                <div className="space-y-1"><Label className="text-muted-foreground">Branch</Label><p className="font-medium">{selectedBooking?.branch}</p></div>
                                                <div className="space-y-1"><Label className="text-muted-foreground">Authorised By</Label><p className="font-medium">{selectedBooking?.authorisedBy}</p></div>
                                                <div className="space-y-1 col-span-2"><Label className="text-muted-foreground">Booking Comments</Label><p className="font-medium text-sm p-2 bg-muted rounded-md">{selectedBooking?.comments || 'N/A'}</p></div>
                                            </div>
                                        </CardContent>
                                    </Card>

                                    <Card>
                                        <CardHeader>
                                            <CardTitle className="text-lg">Booking Documents</CardTitle>
                                        </CardHeader>
                                        <CardContent>
                                            {loadingBookingDocs ? (
                                                <div className="flex items-center justify-center h-24">
                                                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                                                </div>
                                            ) : (
                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                                    <div>
                                                        <Label className="font-semibold">Insurance Letter</Label>
                                                        {insuranceLetter ? (
                                                            <div className="mt-2 border rounded-md p-2">
                                                                <Image src={insuranceLetter} alt="Insurance Letter" width={300} height={200} className="rounded-md w-full object-contain" />
                                                            </div>
                                                        ) : (
                                                            <div className="mt-2">
                                                                <p className="text-sm text-destructive mb-2">Insurance letter is missing. Please upload it.</p>
                                                                <Input type="file" accept="image/*" onChange={(e) => handleFileChange(e, setNewInsuranceLetterData)} />
                                                                {newInsuranceLetterData && <p className="text-xs text-green-600 mt-1">Image ready for upload.</p>}
                                                            </div>
                                                        )}
                                                    </div>
                                                     <div>
                                                        <Label className="font-semibold">Logbook</Label>
                                                        {logbookImage ? (
                                                            <div className="mt-2 border rounded-md p-2">
                                                                <Image src={logbookImage} alt="Logbook" width={300} height={200} className="rounded-md w-full object-contain" />
                                                            </div>
                                                        ) : (
                                                            <div className="mt-2">
                                                                <p className="text-sm text-destructive mb-2">Logbook image is missing. Please upload it.</p>
                                                                <Input type="file" accept="image/*" onChange={(e) => handleFileChange(e, setNewLogbookImageData)} />
                                                                {newLogbookImageData && <p className="text-xs text-green-600 mt-1">Image ready for upload.</p>}
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            )}
                                        </CardContent>
                                    </Card>

                                    <Card>
                                        <CardHeader><CardTitle>Vehicle & Policy Details</CardTitle></CardHeader>
                                        <CardContent className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                            <FormField
                                                control={form.control}
                                                name="purpose"
                                                render={({ field }) => (
                                                    <FormItem className="col-span-1 md:col-span-2 lg:col-span-3">
                                                        <FormLabel>Purpose of Valuation</FormLabel>
                                                        <FormControl>
                                                            <Input {...field} placeholder="e.g., Insurance, Loan Application" />
                                                        </FormControl>
                                                        <FormMessage />
                                                    </FormItem>
                                                )}
                                            />
                                             <FormField
                                                control={form.control}
                                                name="insurer"
                                                render={({ field }) => (
                                                    <FormItem>
                                                        <FormLabel>Insurer</FormLabel>
                                                        <FormControl>
                                                            <Input {...field} placeholder="Enter insurer name" />
                                                        </FormControl>
                                                        <FormMessage />
                                                    </FormItem>
                                                )}
                                            />
                                            <FormField
                                                control={form.control}
                                                name="carType"
                                                render={({ field }) => (
                                                    <FormItem>
                                                    <FormLabel>Car Type</FormLabel>
                                                        <Select onValueChange={field.onChange} value={field.value} disabled={carTypes.length === 0}>
                                                            <FormControl>
                                                                <SelectTrigger>
                                                                    <SelectValue placeholder="Select a car type" />
                                                                </SelectTrigger>
                                                            </FormControl>
                                                            <SelectContent>
                                                                {carTypes.map((type) => (
                                                                    <SelectItem key={type} value={type}>
                                                                        {type}
                                                                    </SelectItem>
                                                                ))}
                                                            </SelectContent>
                                                        </Select>
                                                    <FormMessage />
                                                    </FormItem>
                                                )}
                                            />
                                            <FormField control={form.control} name="policyExpiryDate" render={({ field }) => (
                                                <FormItem className="flex flex-col"><FormLabel>Policy Expiry Date</FormLabel><Popover><PopoverTrigger asChild><FormControl>
                                                    <Button variant={"outline"} className={cn("pl-3 text-left font-normal", !field.value && "text-muted-foreground")}>{field.value ? format(field.value, "PPP") : <span>Pick a date</span>}<CalendarIcon className="ml-auto h-4 w-4 opacity-50" /></Button>
                                                </FormControl></PopoverTrigger><PopoverContent className="w-auto p-0" align="start"><Calendar mode="single" selected={field.value} onSelect={field.onChange} initialFocus /></PopoverContent></Popover><FormMessage /></FormItem>
                                            )}/>
                                            <FormField control={form.control} name="chassisNo" render={({ field }) => (<FormItem><FormLabel>Chassis No.</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)}/>
                                            <FormField control={form.control} name="colour" render={({ field }) => (<FormItem><FormLabel>Colour</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)}/>
                                            <FormField control={form.control} name="fuelType" render={({ field }) => (<FormItem><FormLabel>Fuel Type</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)}/>
                                            <FormField control={form.control} name="engineNo" render={({ field }) => (<FormItem><FormLabel>Engine No.</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)}/>
                                            <FormField control={form.control} name="engineRating" render={({ field }) => (<FormItem><FormLabel>Engine Rating</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)}/>
                                            <FormField control={form.control} name="dateOfReg" render={({ field }) => (
                                                <FormItem className="flex flex-col"><FormLabel>Date of Reg.</FormLabel><Popover><PopoverTrigger asChild><FormControl>
                                                    <Button variant={"outline"} className={cn("pl-3 text-left font-normal", !field.value && "text-muted-foreground")}>{field.value ? format(field.value, "PPP") : <span>Pick a date</span>}<CalendarIcon className="ml-auto h-4 w-4 opacity-50" /></Button>
                                                </FormControl></PopoverTrigger><PopoverContent className="w-auto p-0" align="start"><Calendar mode="single" selected={field.value} onSelect={field.onChange} initialFocus /></PopoverContent></Popover><FormMessage /></FormItem>
                                            )}/>
                                            <FormField control={form.control} name="yearOfManufacture" render={({ field }) => (<FormItem><FormLabel>Year of Manufacture</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)}/>
                                            <FormField control={form.control} name="odometerReadings" render={({ field }) => (<FormItem><FormLabel>Odometer Readings</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)}/>
                                            <FormField control={form.control} name="countryOfOrigin" render={({ field }) => (<FormItem><FormLabel>Country of Origin</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)}/>
                                            <FormField control={form.control} name="numberOfAirbags" render={({ field }) => (<FormItem><FormLabel>Number of Airbags</FormLabel><FormControl><Input type="number" {...field} /></FormControl><FormMessage /></FormItem>)}/>
                                            <FormField control={form.control} name="lightsType" render={({ field }) => (<FormItem><FormLabel>Lights Type</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)}/>
                                            <FormField control={form.control} name="transmissionType" render={({ field }) => (<FormItem><FormLabel>Transmission Type</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)}/>
                                        </CardContent>
                                    </Card>

                                    <Collapsible><CollapsibleTrigger asChild><Button variant="outline" className="w-full justify-between">Coach Work <ChevronDown /></Button></CollapsibleTrigger><CollapsibleContent className="space-y-2 pt-4">
                                        {renderRadioGroup("coachWork.accidentRepairs", "Accident Repairs need?")}
                                        {renderRadioGroup("coachWork.paintWorkScratched", "Is paint work scratched/faded/dented?")}
                                        {renderRadioGroup("coachWork.completeRespray", "Has the body had a complete respray?")}
                                        {renderRadioGroup("coachWork.accidentDamagesNoted", "Accident Damages noted?")}
                                        {renderRadioGroup("coachWork.innerWingsRepaired", "Are inner wings repaired or damaged?")}
                                        {renderRadioGroup("coachWork.upholsteryTorn", "Is Upholstery torn/faded/worn out?")}
                                        {renderRadioGroup("coachWork.roofLiningsDamaged", "Are roof linings damaged or repaired?")}
                                        {renderRadioGroup("coachWork.bumpersOuterWingRepaired", "Are bumpers/outer wing repaired?")}
                                        {renderRadioGroup("coachWork.chassisKinked", "Is the chassis kinked or damaged?")}
                                        <FormField control={form.control} name="coachWorkNotes" render={({ field }) => (<FormItem><FormLabel>Coach Work Notes</FormLabel><FormControl><Textarea {...field} /></FormControl><FormMessage /></FormItem>)}/>
                                    </CollapsibleContent></Collapsible>

                                    <Collapsible><CollapsibleTrigger asChild><Button variant="outline" className="w-full justify-between">Mechanical Condition <ChevronDown /></Button></CollapsibleTrigger><CollapsibleContent className="space-y-2 pt-4">
                                        {renderRadioGroup("mechanicalCondition.parkingBrakeEffective", "Is the parking brake effective?")}
                                        {renderRadioGroup("mechanicalCondition.gearboxOk", "Is the automatic/manual gearbox okay?")}
                                        {renderRadioGroup("mechanicalCondition.coolingSystemOk", "Is cooling system operating well?")}
                                        {renderRadioGroup("mechanicalCondition.brakingSystemOk", "Is the braking system okay?")}
                                        {renderRadioGroup("mechanicalCondition.steeringSystemOk", "Is the steering system okay?")}
                                        {renderRadioGroup("mechanicalCondition.fluidLeakage", "Are there signs of fluid or oil leakage?")}
                                        {renderRadioGroup("mechanicalCondition.driveShaftWorn", "Are the drive shaft/CV joints worn out?")}
                                        {renderRadioGroup("mechanicalCondition.suspensionSystemOk", "Is the suspension system okay?")}
                                        {renderRadioGroup("mechanicalCondition.engineMountingsWorn", "Are engine mountings worn out?")}
                                        <FormField control={form.control} name="mechanicalNotes" render={({ field }) => (<FormItem><FormLabel>Mechanical Notes</FormLabel><FormControl><Textarea {...field} /></FormControl><FormMessage /></FormItem>)}/>
                                    </CollapsibleContent></Collapsible>
                                    
                                    <Collapsible><CollapsibleTrigger asChild><Button variant="outline" className="w-full justify-between">Electrical Condition <ChevronDown /></Button></CollapsibleTrigger><CollapsibleContent className="space-y-2 pt-4">
                                        {renderRadioGroup("electricalCondition.indicatorLightsOk", "Do the indicator lights operate well?")}
                                        {renderRadioGroup("electricalCondition.brakeLightsOk", "Do the brake lights operate well?")}
                                        {renderRadioGroup("electricalCondition.wipersOk", "Are the wipers operating well?")}
                                        {renderRadioGroup("electricalCondition.headlightsOk", "Are the headlights operating well?")}
                                        {renderRadioGroup("electricalCondition.instrumentPanelLightsOk", "Do the instrument panel lights work well?")}
                                        <FormField control={form.control} name="electricalNotes" render={({ field }) => (<FormItem><FormLabel>Electrical Notes</FormLabel><FormControl><Textarea {...field} /></FormControl><FormMessage /></FormItem>)}/>
                                    </CollapsibleContent></Collapsible>

                                    <Card>
                                        <CardHeader><CardTitle>Tyres & Security</CardTitle></CardHeader>
                                        <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <FormField control={form.control} name="antiTheft" render={({ field }) => (<FormItem><FormLabel>Anti-theft System</FormLabel><FormControl><Input {...field} placeholder="Type of anti-theft system" /></FormControl><FormMessage /></FormItem>)}/>
                                            <FormField control={form.control} name="tyresType" render={({ field }) => (<FormItem><FormLabel>Tyres Type</FormLabel><FormControl><Input {...field} placeholder="e.g., Tubeless, Radial" /></FormControl><FormMessage /></FormItem>)}/>
                                            <FormField control={form.control} name="tyresCondition" render={({ field }) => (<FormItem><FormLabel>General Tyre Condition</FormLabel><FormControl><Input {...field} placeholder="e.g., Good, Worn, New" /></FormControl><FormMessage /></FormItem>)}/>
                                        </CardContent>
                                    </Card>
                                    
                                     <FormField control={form.control} name="extras" render={({ field }) => (<FormItem><FormLabel>Extras</FormLabel><FormControl><Textarea {...field} placeholder="List any extras, e.g., Bull bars, Spoiler" /></FormControl><FormMessage /></FormItem>)}/>


                                    <FormField
                                        control={form.control}
                                        name="assessmentDate"
                                        render={({ field }) => (
                                            <FormItem className="flex flex-col">
                                            <FormLabel>Date of Assessment</FormLabel>
                                            <Popover>
                                                <PopoverTrigger asChild>
                                                <FormControl>
                                                    <Button
                                                    variant={"outline"}
                                                    className={cn(
                                                        "w-[240px] pl-3 text-left font-normal",
                                                        !field.value && "text-muted-foreground"
                                                    )}
                                                    >
                                                    {field.value ? (
                                                        format(field.value, "PPP")
                                                    ) : (
                                                        <span>Pick a date</span>
                                                    )}
                                                    <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                                    </Button>
                                                </FormControl>
                                                </PopoverTrigger>
                                                <PopoverContent className="w-auto p-0" align="start">
                                                <Calendar
                                                    mode="single"
                                                    selected={field.value}
                                                    onSelect={field.onChange}
                                                    disabled={(date) => {
                                                        const today = new Date();
                                                        today.setHours(0, 0, 0, 0);
                                                        const sevenDaysAgo = subDays(today, 7);
                                                        return date > today || date < sevenDaysAgo;
                                                    }}
                                                    initialFocus
                                                />
                                                </PopoverContent>
                                            </Popover>
                                            <FormMessage />
                                            </FormItem>
                                        )}
                                    />

                                     <FormField
                                        control={form.control}
                                        name="comments"
                                        render={({ field }) => (
                                            <FormItem>
                                            <FormLabel>Valuation Comments</FormLabel>
                                            <FormControl>
                                                <Textarea
                                                    placeholder="Add any additional comments here..."
                                                    className="resize-none"
                                                    {...field}
                                                />
                                            </FormControl>
                                            <FormMessage />
                                            </FormItem>
                                        )}
                                    />

                                    <div>
                                        <Label>Valuation Photos <span className="text-destructive">*</span></Label>
                                        <div className="mt-2 flex justify-center rounded-lg border border-dashed border-input px-6 py-10">
                                            <div className="text-center">
                                                <ImageIcon className="mx-auto h-12 w-12 text-gray-300" />
                                                <div className="mt-4 flex text-sm leading-6 text-gray-600">
                                                <label
                                                    htmlFor="file-upload"
                                                    className="relative cursor-pointer rounded-md bg-white font-semibold text-primary focus-within:outline-none focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2 hover:text-primary/80"
                                                >
                                                    <span>Upload files</span>
                                                    <input id="file-upload" name="file-upload" type="file" className="sr-only" multiple onChange={handleValuationImagesChange} accept="image/*" ref={fileInputRef} />
                                                </label>
                                                <p className="pl-1">or drag and drop</p>
                                                </div>
                                                <p className="text-xs leading-5 text-gray-600">Images will be compressed automatically</p>
                                            </div>
                                        </div>
                                         {valuationImages.length > 0 && (
                                            <div className="mt-4 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                                                {valuationImages.map((preview, index) => (
                                                <div key={index} className="relative group">
                                                    <Image src={preview} alt={`preview ${index}`} width={150} height={150} className="w-full h-auto object-cover rounded-md" />
                                                    <Button
                                                    type="button"
                                                    variant="destructive"
                                                    size="icon"
                                                    className="absolute top-1 right-1 h-6 w-6 opacity-0 group-hover:opacity-100"
                                                    onClick={() => removeValuationImage(index)}
                                                    >
                                                    <X className="h-4 w-4" />
                                                    </Button>
                                                </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                    <DialogFooter className="pt-4 !mt-8">
                                        <Button type="button" variant="outline" onClick={() => setValuationDialogOpen(false)}>Cancel</Button>
                                        <Button type="submit" disabled={isSubmitDisabled}>
                                            {isSubmitting ? (
                                                <>
                                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                                    Submitting...
                                                </>
                                            ) : (
                                                "Valuate & Submit"
                                            )}
                                        </Button>
                                    </DialogFooter>
                                </form>
                            </Form>
                            </div>
                        </DialogContent>
                    </Dialog>
                </>
            )}
        </UnifiedDashboardLayout>
    );
}
