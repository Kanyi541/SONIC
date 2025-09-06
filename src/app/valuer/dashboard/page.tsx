
"use client";

import { useState, useEffect, useRef, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import UnifiedDashboardLayout from '@/components/dashboard/unified-dashboard-layout';
import { collection, onSnapshot, doc, updateDoc, addDoc, serverTimestamp, query, where } from "firebase/firestore";
import { db } from '@/lib/firebase';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Car, Clock, CheckCircle, Hourglass, FilePen, Printer, Calendar as CalendarIcon, Upload, X, Image as ImageIcon, Loader2, Search, XCircle, FileSignature, FileWarning, ChevronLeft, ChevronRight } from 'lucide-react';
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
  customerEmail: string;
  customerPhone: string;
  plateNumber: string;
  carMake: string;
  carModel: string;
  policyNumber?: string;
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
    const [itemsPerPage] = useState(5);
    const [currentPage, setCurrentPage] = useState(1);
    const [allCarsCurrentPage, setAllCarsCurrentPage] = useState(1);
    const [pendingCurrentPage, setPendingCurrentPage] = useState(1);
    const [completedCurrentPage, setCompletedCurrentPage] = useState(1);
    const [rejectedCurrentPage, setRejectedCurrentPage] = useState(1);

    const form = useForm<ValuationFormValues>({
        resolver: zodResolver(valuationSchema),
        defaultValues: {
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
            const bookingsQuery = query(
                collection(db, "bookings"),
                where("assignedValuerId", "==", loggedInUser.username)
            );

            const bookingsUnsubscribe = onSnapshot(bookingsQuery, (snapshot) => {
                const bookingsData: Booking[] = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() as Booking }));
                setBookings(bookingsData);
                generateChartData(bookingsData);
                setLoading(false);
            }, (error) => {
                console.error("Error fetching bookings:", error);
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
                imageUrls: imageDataUrls,
                comments: data.comments,
                valuedBy: loggedInUser.name,
                valuedAt: serverTimestamp(),
                status: "Pending Approval", 
            });
    
            const bookingDocRef = doc(db, "bookings", selectedBooking.id);
            await updateDoc(bookingDocRef, {
                status: "Valuated"
            });
    
            toast({
                title: "Valuation Submitted",
                description: `Report for ${selectedBooking.bookingNumber} has been submitted for admin approval.`,
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
    

    const openValuationDialog = (booking: Booking) => {
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
            case "Valuated": return "secondary";
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
        return filteredBookings.filter(b => statuses.includes(b.status));
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
    
    return (
        <UnifiedDashboardLayout
            title="CASA Motor Valuers & Assessors Ltd"
            userRole={loggedInUser?.name || "Valuer"}
            userEmail={loggedInUser?.email || ""}
            menuItems={[
                { name: 'Dashboard', view: 'dashboard' },
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
                                {renderBookingsTable(filteredBookings, "All Cars", "A summary of all assigned bookings.", allCarsCurrentPage, setAllCarsCurrentPage)}
                            </div>
                        </TabsContent>
                        <TabsContent value="all-bookings">
                           {renderBookingsTable(filteredBookings, "All Bookings", "A list of all assigned bookings.", allCarsCurrentPage, setAllCarsCurrentPage)}
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
                        <DialogContent className="sm:max-w-2xl grid-rows-[auto_1fr_auto] max-h-[90vh]">
                            <DialogHeader>
                                <DialogTitle>Valuation Form</DialogTitle>
                                <DialogDescription>
                                    Fill in the details below for booking #{selectedBooking?.bookingNumber}.
                                </DialogDescription>
                            </DialogHeader>
                            <div className="overflow-y-auto pr-6 -mr-6">
                            <Form {...form}>
                                <form onSubmit={form.handleSubmit(handleValuationSubmit)} className="space-y-4">
                                    <div className="grid grid-cols-2 gap-4 text-sm">
                                        <div className="space-y-1"><Label className="text-muted-foreground">Customer Name</Label><Input value={selectedBooking?.customerName} disabled className="font-medium" /></div>
                                        <div className="space-y-1"><Label className="text-muted-foreground">Customer Phone</Label><Input value={selectedBooking?.customerPhone} disabled className="font-medium" /></div>
                                        <div className="space-y-1"><Label className="text-muted-foreground">Customer Email</Label><Input value={selectedBooking?.customerEmail} disabled className="font-medium" /></div>
                                        <div className="space-y-1"><Label className="text-muted-foreground">Client</Label><Input value={selectedBooking?.insurerName} disabled className="font-medium" /></div>
                                        <div className="space-y-1"><Label className="text-muted-foreground">Vehicle</Label><Input value={`${selectedBooking?.carMake} ${selectedBooking?.carModel}`} disabled className="font-medium" /></div>
                                        <div className="space-y-1"><Label className="text-muted-foreground">Plate Number</Label><Input value={selectedBooking?.plateNumber} disabled className="font-medium" /></div>
                                        <div className="space-y-1"><Label className="text-muted-foreground">Policy Number</Label><Input value={selectedBooking?.policyNumber} disabled className="font-medium" /></div>
                                        <div className="space-y-1"><Label className="text-muted-foreground">Booking Number</Label><Input value={selectedBooking?.bookingNumber} disabled className="font-medium" /></div>
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
