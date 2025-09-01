
"use client";

import { useState, useEffect, useRef, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import UnifiedDashboardLayout from '@/components/dashboard/unified-dashboard-layout';
import { collection, onSnapshot, doc, updateDoc, addDoc, serverTimestamp, query, where } from "firebase/firestore";
import { db } from '@/lib/firebase';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Car, Clock, CheckCircle, Hourglass, FilePen, Printer, Calendar as CalendarIcon, Upload, X, Image as ImageIcon, Loader2, Search, XCircle, FileSignature } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { format, startOfMonth, endOfMonth, eachDayOfInterval, getDate } from 'date-fns';
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Form, FormField, FormItem, FormControl, FormMessage, FormLabel } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import Image from 'next/image';
import { Textarea } from '@/components/ui/textarea';
import { Progress } from "@/components/ui/progress";
import { LineChart, Line, ResponsiveContainer, XAxis, YAxis, Tooltip, Legend, CartesianGrid } from "recharts"
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"
import { Tabs, TabsContent } from '@/components/ui/tabs';

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
  plateNumber: string;
  carMake: string;
  carModel: string;
  createdAt: any;
  status: string;
  insurerName: string;
}

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
    status: 'Approved' | 'Rejected' | 'Pending Approval';
    rejectionReason?: string;
}


type ChartDataPoint = {
    day: string;
    Pending: number;
    Approved: number;
    Rejected: number;
};

const valuationSchema = z.object({
  assessmentDate: z.date({
    required_error: "A date of assessment is required.",
  }),
  assessmentValue: z.string().min(1, "Assessment value is required"),
  forcedValue: z.string().min(1, "Forced value is required"),
  wsValue: z.string().min(1, "WS value is required"),
  rsValue: z.string().min(1, "RS value is required"),
  images: z.array(z.string().url()).min(1, "At least one image is required."),
  comments: z.string().optional(),
});

type ValuationFormValues = z.infer<typeof valuationSchema>;


export default function ValuerDashboardPage() {
    const [loggedInUser, setLoggedInUser] = useState<LoggedInUser | null>(null);
    const [bookings, setBookings] = useState<Booking[]>([]);
    const [valuations, setValuations] = useState<Valuation[]>([]);
    const [loading, setLoading] = useState(true);
    const [isValuationDialogOpen, setValuationDialogOpen] = useState(false);
    const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
    const [imageDataUrls, setImageDataUrls] = useState<string[]>([]);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const router = useRouter();
    const { toast } = useToast();
    const [searchTerm, setSearchTerm] = useState('');
    const [chartData, setChartData] = useState<ChartDataPoint[]>([]);
    const [activeView, setActiveView] = useState('dashboard');
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 5;

    const form = useForm<ValuationFormValues>({
        resolver: zodResolver(valuationSchema),
        defaultValues: {
            assessmentValue: "",
            forcedValue: "",
            wsValue: "",
            rsValue: "",
            images: [],
            comments: "",
        }
    });

    useEffect(() => {
        const storedUserString = sessionStorage.getItem('loggedInUser');
        if (storedUserString) {
            const user = JSON.parse(storedUserString);
            setLoggedInUser(user);
        }
    }, []);

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
        if (loggedInUser) {
            setLoading(true);
            const bookingsQuery = query(collection(db, "bookings"), where("status", "in", ["Pending Valuation", "Completed", "Rejected"]));
            const bookingsUnsubscribe = onSnapshot(bookingsQuery, (snapshot) => {
                const bookingsData: Booking[] = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Booking));
                setBookings(bookingsData);
                generateChartData(bookingsData);
            });

            const valuationsQuery = query(collection(db, "valuations"));
             const valuationsUnsubscribe = onSnapshot(valuationsQuery, (snapshot) => {
                const valuationsData: Valuation[] = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Valuation));
                setValuations(valuationsData);
                setLoading(false);
            });

            return () => {
                bookingsUnsubscribe();
                valuationsUnsubscribe();
            };
        } else {
            setLoading(false);
        }
    }, [loggedInUser]);
    
    const handleImageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        if (event.target.files) {
            const files = Array.from(event.target.files);
            const newImageUrls: string[] = [];

            const fileReaders = files.map(file => {
                return new Promise<string>((resolve, reject) => {
                    const reader = new FileReader();
                    reader.onload = (e) => {
                        resolve(e.target?.result as string);
                    };
                    reader.onerror = reject;
                    reader.readAsDataURL(file);
                });
            });

            Promise.all(fileReaders).then(urls => {
                setImageDataUrls(prevUrls => [...prevUrls, ...urls]);
            });
        }
    };

    useEffect(() => {
        form.setValue('images', imageDataUrls, { shouldValidate: true });
    }, [imageDataUrls, form]);
    
    const removeImage = (index: number) => {
        const newImageDataUrls = imageDataUrls.filter((_, i) => i !== index);
        setImageDataUrls(newImageDataUrls);
    };
    
    const handleValuationSubmit = async (data: ValuationFormValues) => {
        if (!selectedBooking || !loggedInUser) return;
    
        setIsSubmitting(true);
    
        try {
            await addDoc(collection(db, "valuations"), {
                bookingId: selectedBooking.id,
                assessmentDate: data.assessmentDate,
                assessmentValue: data.assessmentValue,
                forcedValue: data.forcedValue,
                wsValue: data.wsValue,
                rsValue: data.rsValue,
                imageUrls: imageDataUrls,
                comments: data.comments,
                valuedBy: loggedInUser.name,
                valuedAt: serverTimestamp(),
                status: "Approved",
            });
    
            const bookingDocRef = doc(db, "bookings", selectedBooking.id);
            await updateDoc(bookingDocRef, {
                status: "Completed"
            });
    
            toast({
                title: "Valuation Submitted",
                description: `Report for ${selectedBooking.bookingNumber} has been submitted successfully.`,
            });
            
            setValuationDialogOpen(false);
            form.reset();
            setImageDataUrls([]);
    
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
        setImageDataUrls([]);
        setSelectedBooking(booking);
        setValuationDialogOpen(true);
    };

    const getStatusVariant = (status: string): "default" | "secondary" | "destructive" | "outline" => {
        switch (status) {
            case "Pending": return "secondary";
            case "Pending Valuation": return "outline";
            case "Pending Approval": return "outline";
            case "Completed": return "default";
            case "Rejected": return "destructive";
            default: return "default";
        }
    };

    const filteredBookings = bookings.filter(booking => {
        const searchTermLower = searchTerm.toLowerCase();
        return (
            booking.bookingNumber.toLowerCase().includes(searchTermLower) ||
            booking.customerName.toLowerCase().includes(searchTermLower) ||
            booking.plateNumber.toLowerCase().includes(searchTermLower) ||
            booking.insurerName.toLowerCase().includes(searchTermLower)
        );
    });

    const getFilteredBookingsByStatus = (status: string | string[]) => {
        const statuses = Array.isArray(status) ? status : [status];
        if (statuses.includes('All')) {
            return filteredBookings;
        }
        return filteredBookings.filter(b => statuses.includes(b.status));
    };

    const allValuationsWithBookings = useMemo(() => {
        return valuations
            .map(valuation => {
                const booking = bookings.find(b => b.id === valuation.bookingId);
                return { ...valuation, booking };
            })
            .filter(item => item.booking) // Ensure booking exists
            .filter(v => {
                const searchTermLower = searchTerm.toLowerCase();
                const booking = v.booking;
                if (!booking) return false;
                return (
                    booking.plateNumber?.toLowerCase().includes(searchTermLower) ||
                    booking.customerName?.toLowerCase().includes(searchTermLower) ||
                    booking.bookingNumber?.toLowerCase().includes(searchTermLower) ||
                    booking.insurerName?.toLowerCase().includes(searchTermLower)
                );
            });
    }, [valuations, bookings, searchTerm]);

    const stats = {
        total: bookings.length,
        pending: bookings.filter(b => b.status === 'Pending Valuation').length,
        completed: bookings.filter(b => b.status === 'Completed').length,
        rejected: bookings.filter(b => b.status === 'Rejected').length,
    };

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

    const StatCard = ({ title, value, icon, onClick, progress, colorClass }: { title: string, value: number, icon: React.ReactNode, onClick: () => void, progress: number, colorClass: string }) => (
        <Card onClick={onClick} className="cursor-pointer hover:bg-muted transition-colors p-4 flex flex-col justify-between">
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

    const renderBookingsTable = (
        bookingsData: Booking[],
        title: string,
        description: string,
        isPendingTable: boolean = false
    ) => {
        const totalPages = Math.ceil(bookingsData.length / itemsPerPage);
        const paginatedData = bookingsData.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

        return (
         <Card>
            <CardHeader>
               <div className="flex justify-between items-center">
                    <div>
                        <CardTitle>{title}</CardTitle>
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
                            <TableHead className="w-[50px]">No.</TableHead>
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
                        Array.from({ length: 5 }).map((_, index) => (
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
                             <TableCell>{(currentPage - 1) * itemsPerPage + index + 1}</TableCell>
                            <TableCell className="font-mono text-xs truncate">{booking.bookingNumber}</TableCell>
                            <TableCell className="font-medium hidden sm:table-cell">{booking.customerName}</TableCell>
                            <TableCell className="hidden md:table-cell">{booking.plateNumber}</TableCell>
                            <TableCell className="hidden md:table-cell">{booking.insurerName}</TableCell>
                            <TableCell>
                            <Badge variant={getStatusVariant(booking.status)}>{booking.status}</Badge>
                            </TableCell>
                            <TableCell className="text-right space-x-2">
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => openValuationDialog(booking)}
                                    disabled={!isPendingTable}
                                >
                                    <FilePen className="mr-2 h-4 w-4" />
                                    <span className="hidden sm:inline">Valuate</span>
                                </Button>
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
                <div className="flex items-center justify-end space-x-2 py-4">
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                        disabled={currentPage === 1}
                    >
                        Previous
                    </Button>
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                        disabled={currentPage === totalPages}
                    >
                        Next
                    </Button>
                </div>
            </CardContent>
        </Card>
        )
    };

    const renderValuationsDashboard = () => {
        const totalPages = Math.ceil(allValuationsWithBookings.length / itemsPerPage);
        const paginatedData = allValuationsWithBookings.slice(
            (currentPage - 1) * itemsPerPage,
            currentPage * itemsPerPage
        );

        return (
            <Card>
                <CardHeader>
                   <div className="flex justify-between items-center">
                        <div>
                            <CardTitle>All car</CardTitle>
                            <CardDescription>A summary of all Car Valutions</CardDescription>
                        </div>
                        <div className="relative w-full max-w-sm">
                            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                            <Input
                                type="search"
                                placeholder="Search valuations..."
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
                            <TableRow>
                                <TableHead>No.</TableHead>
                                <TableHead>Plate No</TableHead>
                                <TableHead>Make &amp; Model</TableHead>
                                <TableHead className="hidden sm:table-cell">Booking Number</TableHead>
                                <TableHead className="hidden md:table-cell">Assessment Date</TableHead>
                                <TableHead>Customer Name</TableHead>
                                <TableHead className="hidden sm:table-cell">Client</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead className="hidden xl:table-cell">Assessment Value (KES)</TableHead>
                                <TableHead className="hidden xl:table-cell">Forced Value (KES)</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {loading ? (
                                Array.from({ length: 5 }).map((_, index) => (
                                <TableRow key={index}>
                                    <TableCell><Skeleton className="h-5 w-8" /></TableCell>
                                    <TableCell><Skeleton className="h-5 w-20" /></TableCell>
                                    <TableCell><Skeleton className="h-5 w-28" /></TableCell>
                                    <TableCell className="hidden sm:table-cell"><Skeleton className="h-5 w-32" /></TableCell>
                                    <TableCell className="hidden md:table-cell"><Skeleton className="h-5 w-24" /></TableCell>
                                    <TableCell><Skeleton className="h-5 w-32" /></TableCell>
                                    <TableCell className="hidden sm:table-cell"><Skeleton className="h-5 w-32" /></TableCell>
                                    <TableCell><Skeleton className="h-6 w-20" /></TableCell>
                                    <TableCell className="hidden xl:table-cell"><Skeleton className="h-5 w-24" /></TableCell>
                                    <TableCell className="hidden xl:table-cell"><Skeleton className="h-5 w-24" /></TableCell>
                                </TableRow>
                                ))
                            ) : paginatedData.length > 0 ? (
                                paginatedData.map((valuation, index) => (
                                <TableRow key={valuation.id}>
                                    <TableCell>{(currentPage - 1) * itemsPerPage + index + 1}</TableCell>
                                    <TableCell>{valuation.booking?.plateNumber}</TableCell>
                                    <TableCell>{`${valuation.booking?.carMake} ${valuation.booking?.carModel}`}</TableCell>
                                    <TableCell className="font-mono text-xs hidden sm:table-cell">{valuation.booking?.bookingNumber}</TableCell>
                                    <TableCell className="hidden md:table-cell">{new Date(valuation.assessmentDate?.toDate()).toLocaleDateString()}</TableCell>
                                    <TableCell>{valuation.booking?.customerName}</TableCell>
                                    <TableCell className="hidden sm:table-cell">{valuation.booking?.insurerName}</TableCell>
                                    <TableCell>
                                      <Badge variant={getStatusVariant(valuation.booking?.status || 'Unknown')}>
                                        {valuation.booking?.status}
                                      </Badge>
                                    </TableCell>
                                    <TableCell className="font-mono hidden xl:table-cell">{valuation.assessmentValue}</TableCell>
                                    <TableCell className="font-mono hidden xl:table-cell">{valuation.forcedValue}</TableCell>
                                </TableRow>
                                ))
                            ) : (
                                <TableRow>
                                    <TableCell colSpan={10} className="h-24 text-center">
                                        No recent valuations found.
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                     <div className="flex items-center justify-end space-x-2 py-4">
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                            disabled={currentPage === 1}
                        >
                            Previous
                        </Button>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                            disabled={currentPage === totalPages}
                        >
                            Next
                        </Button>
                    </div>
                </CardContent>
            </Card>
        )
    };
    
    return (
        <UnifiedDashboardLayout
            title="CASA Motor Valuers & Assessors Ltd"
            userRole={loggedInUser?.name || "Valuer"}
            userEmail={loggedInUser?.email || ""}
            menuItems={[
                { name: 'Dashboard', view: 'dashboard' },
                { name: 'Pending Valuations', view: 'pending-bookings', notificationCount: stats.pending },
                { name: 'Finalized Reports', view: 'bookings' },
            ]}
            footerContent={(
                 <>
                    <p className="text-sm text-muted-foreground">
                        &copy; {new Date().getFullYear()} CASA Motor Valuers & Assessors Ltd. All rights reserved.
                    </p>
                    <p className="text-sm text-muted-foreground">
                        Designed by <a href="https://elvisdev.netlify.app/" target="_blank" rel="noopener noreferrer" className="font-medium underline underline-offset-4">Tekivo Technologies</a>
                    </p>
                </>
            )}
        >
            {(activeView, setActiveView) => (
                <>
                    <Tabs value={activeView} onValueChange={(view) => { setActiveView(view); setCurrentPage(1); }}>
                        <TabsContent value="dashboard">
                            <div className="grid gap-8">
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
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
                                        value={stats.pending} 
                                        icon={<FileSignature className="h-6 w-6 text-orange-500" />} 
                                        onClick={() => setActiveView('pending-bookings')}
                                        progress={(stats.pending / stats.total) * 100}
                                        colorClass="bg-orange-500"
                                    />
                                    <StatCard 
                                        title="Approved" 
                                        value={stats.completed} 
                                        icon={<CheckCircle className="h-6 w-6 text-green-500" />} 
                                        onClick={() => setActiveView('completed-bookings')}
                                        progress={(stats.completed / stats.total) * 100}
                                        colorClass="bg-green-500"
                                    />
                                    <StatCard 
                                        title="Rejected" 
                                        value={stats.rejected} 
                                        icon={<XCircle className="h-6 w-6 text-red-500" />} 
                                        onClick={() => setActiveView('rejected-bookings')}
                                        progress={(stats.rejected / stats.total) * 100}
                                        colorClass="bg-red-500"
                                    />
                                </div>
                                {renderValuationsDashboard()}
                            </div>
                        </TabsContent>
                         <TabsContent value="all-bookings">
                           {renderBookingsTable(getFilteredBookingsByStatus('All'), "All Assigned Bookings", "A complete list of all bookings assigned to you.", true)}
                        </TabsContent>
                        <TabsContent value="pending-bookings">
                           {renderBookingsTable(getFilteredBookingsByStatus("Pending Valuation"), "Pending Valuations", "A list of all new vehicle valuations.", true)}
                        </TabsContent>
                        <TabsContent value="completed-bookings">
                           {renderBookingsTable(getFilteredBookingsByStatus("Completed"), "Approved Reports", "A list of all valuations that have been approved.")}
                        </TabsContent>
                        <TabsContent value="rejected-bookings">
                           {renderBookingsTable(getFilteredBookingsByStatus("Rejected"), "Rejected Reports", "A list of all valuations that have been rejected by clients.")}
                        </TabsContent>
                        <TabsContent value="bookings">
                           {renderBookingsTable(getFilteredBookingsByStatus(["Completed", "Rejected"]), "Finalized Reports", "A list of all valuations that have been approved or rejected by clients.")}
                        </TabsContent>
                    </Tabs>
                    <Dialog open={isValuationDialogOpen} onOpenChange={setValuationDialogOpen}>
                        <DialogContent className="sm:max-w-2xl grid-rows-[auto_1fr_auto] max-h-[90vh]">
                            <DialogHeader>
                                <DialogTitle>Submit Valuation Report</DialogTitle>
                                <DialogDescription>
                                    Fill in the details below for booking #{selectedBooking?.bookingNumber}.
                                </DialogDescription>
                            </DialogHeader>
                            <div className="overflow-y-auto pr-6 -mr-6">
                            <Form {...form}>
                                <form onSubmit={form.handleSubmit(handleValuationSubmit)} className="space-y-4">
                                    <div className="grid grid-cols-2 gap-4">
                                        <div><Label>Customer Name</Label><Input value={selectedBooking?.customerName} disabled /></div>
                                        <div><Label>Client</Label><Input value={selectedBooking?.insurerName} disabled /></div>
                                        <div><Label>Vehicle</Label><Input value={`${selectedBooking?.carMake} ${selectedBooking?.carModel}`} disabled /></div>
                                        <div><Label>Plate Number</Label><Input value={selectedBooking?.plateNumber} disabled /></div>
                                        <div><Label>Booking Number</Label><Input value={selectedBooking?.bookingNumber} disabled /></div>
                                    </div>
                                    
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                                                        className={`w-full pl-3 text-left font-normal ${!field.value && "text-muted-foreground"}`}
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
                                                        disabled={(date) =>
                                                            date > new Date() || date < new Date("2000-01-01")
                                                        }
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
                                            name="assessmentValue"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>Assessment Value (KES)</FormLabel>
                                                    <FormControl><Input placeholder="e.g. 1,500,000" {...field} /></FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <FormField
                                            control={form.control}
                                            name="forcedValue"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>Forced Sale Value (KES)</FormLabel>
                                                    <FormControl><Input placeholder="e.g. 1,200,000" {...field} /></FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                        <FormField
                                            control={form.control}
                                            name="wsValue"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>Noted Value: WS (KES)</FormLabel>
                                                    <FormControl><Input placeholder="e.g. 20,000" {...field} /></FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                       <FormField
                                            control={form.control}
                                            name="rsValue"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>Noted Value: RS (KES)</FormLabel>
                                                    <FormControl><Input placeholder="e.g. 15,000" {...field} /></FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                    </div>
                                    
                                     <FormField
                                        control={form.control}
                                        name="comments"
                                        render={({ field }) => (
                                            <FormItem>
                                            <FormLabel>Comments</FormLabel>
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
                                        <Label>Valuation Photos</Label>
                                        <div className="mt-2 flex justify-center rounded-lg border border-dashed border-input px-6 py-10">
                                            <div className="text-center">
                                                <ImageIcon className="mx-auto h-12 w-12 text-gray-300" />
                                                <div className="mt-4 flex text-sm leading-6 text-gray-600">
                                                <label
                                                    htmlFor="file-upload"
                                                    className="relative cursor-pointer rounded-md bg-white font-semibold text-primary focus-within:outline-none focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2 hover:text-primary/80"
                                                >
                                                    <span>Upload files</span>
                                                    <input id="file-upload" name="file-upload" type="file" className="sr-only" multiple onChange={handleImageChange} accept="image/*" ref={fileInputRef} />
                                                </label>
                                                <p className="pl-1">or drag and drop</p>
                                                </div>
                                                <p className="text-xs leading-5 text-gray-600">PNG, JPG, GIF up to 10MB</p>
                                            </div>
                                        </div>
                                         <FormField
                                            control={form.control}
                                            name="images"
                                            render={() => (
                                                <FormItem>
                                                    {imageDataUrls.length > 0 && (
                                                        <div className="mt-4 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                                                            {imageDataUrls.map((preview, index) => (
                                                            <div key={index} className="relative group">
                                                                <Image src={preview} alt={`preview ${index}`} width={150} height={150} className="w-full h-auto object-cover rounded-md" />
                                                                <Button
                                                                type="button"
                                                                variant="destructive"
                                                                size="icon"
                                                                className="absolute top-1 right-1 h-6 w-6 opacity-0 group-hover:opacity-100"
                                                                onClick={() => removeImage(index)}
                                                                >
                                                                <X className="h-4 w-4" />
                                                                </Button>
                                                            </div>
                                                            ))}
                                                        </div>
                                                    )}
                                                    <FormMessage/>
                                                </FormItem>
                                            )}
                                        />
                                    </div>
                                    <DialogFooter className="pt-4 !mt-8">
                                        <Button type="button" variant="outline" onClick={() => setValuationDialogOpen(false)}>Cancel</Button>
                                        <Button type="submit" disabled={isSubmitting}>
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
