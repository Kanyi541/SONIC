
"use client";

import { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import UnifiedDashboardLayout from '@/components/dashboard/unified-dashboard-layout';
import { collection, onSnapshot, doc, updateDoc, addDoc, serverTimestamp } from "firebase/firestore";
import { db } from '@/lib/firebase';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Car, Clock, CheckCircle, Hourglass, FilePen, Printer, Calendar as CalendarIcon, Upload, X, Image as ImageIcon, Loader2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { format } from "date-fns";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Form, FormField, FormItem, FormControl, FormMessage, FormLabel } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import Image from 'next/image';

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

const valuationSchema = z.object({
  assessmentDate: z.date({
    required_error: "A date of assessment is required.",
  }),
  assessmentValue: z.string().min(1, "Assessment value is required"),
  forcedValue: z.string().min(1, "Forced value is required"),
  salvageValue: z.string().min(1, "Salvage value is required"),
  images: z.array(z.string()).min(1, "At least one image is required."),
});

type ValuationFormValues = z.infer<typeof valuationSchema>;


export default function ValuerDashboardPage() {
    const [loggedInUser, setLoggedInUser] = useState<LoggedInUser | null>(null);
    const [bookings, setBookings] = useState<Booking[]>([]);
    const [loading, setLoading] = useState(true);
    const [isValuationDialogOpen, setValuationDialogOpen] = useState(false);
    const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
    const [imageDataUrls, setImageDataUrls] = useState<string[]>([]);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const router = useRouter();
    const { toast } = useToast();

    const form = useForm<ValuationFormValues>({
        resolver: zodResolver(valuationSchema),
        defaultValues: {
            assessmentValue: "",
            forcedValue: "",
            salvageValue: "",
            images: [],
        }
    });

    useEffect(() => {
        const storedUserString = sessionStorage.getItem('loggedInUser');
        if (storedUserString) {
            const user = JSON.parse(storedUserString);
            setLoggedInUser(user);
        }
    }, []);

    useEffect(() => {
        if (loggedInUser) {
            setLoading(true);
            const bookingsUnsubscribe = onSnapshot(collection(db, "bookings"), (snapshot) => {
                const bookingsData: Booking[] = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Booking));
                setBookings(bookingsData);
                setLoading(false);
            });

            return () => bookingsUnsubscribe();
        } else {
            setLoading(false);
        }
    }, [loggedInUser]);
    
    const handleImageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        if (event.target.files) {
            const files = Array.from(event.target.files);
            const newUrls: string[] = [];

            files.forEach(file => {
                const reader = new FileReader();
                reader.onload = (e) => {
                    const dataUrl = e.target?.result as string;
                    newUrls.push(dataUrl);
                    if (newUrls.length === files.length) {
                       setImageDataUrls(prevUrls => [...prevUrls, ...newUrls]);
                    }
                };
                reader.readAsDataURL(file);
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
                bookingNumber: selectedBooking.bookingNumber,
                customerName: selectedBooking.customerName,
                plateNumber: selectedBooking.plateNumber,
                carMake: selectedBooking.carMake,
                carModel: selectedBooking.carModel,
                guarantorName: selectedBooking.insurerName,
                assessmentDate: data.assessmentDate,
                assessmentValue: data.assessmentValue,
                forcedValue: data.forcedValue,
                salvageValue: data.salvageValue,
                imageUrls: imageDataUrls,
                valuedBy: loggedInUser.name,
                valuedAt: serverTimestamp(),
            });
    
            const bookingDocRef = doc(db, "bookings", selectedBooking.id);
            await updateDoc(bookingDocRef, {
                status: "Pending Approval"
            });
    
            toast({
                title: "Valuation Submitted",
                description: `Report for ${selectedBooking.bookingNumber} has been submitted for approval.`,
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
            case "Pending Approval": return "destructive";
            case "Completed": return "default";
            default: return "default";
        }
    };

    const stats = {
        total: bookings.length,
        pendingValuation: bookings.filter(b => b.status === 'Pending').length,
        pendingApproval: bookings.filter(b => b.status === 'Pending Approval').length,
        completed: bookings.filter(b => b.status === 'Completed').length,
    };
    
    return (
        <UnifiedDashboardLayout
            title="CASA DASH"
            userRole={loggedInUser?.name || "Valuer"}
            userEmail={loggedInUser?.email || ""}
            menuItems={[
                { name: 'Dashboard', view: 'dashboard' },
                { name: 'All Valuations', view: 'valuations' },
            ]}
        >
            {(activeView) => (
                <>
                    {activeView === 'dashboard' && (
                        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                           <Card>
                                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                    <CardTitle className="text-sm font-medium">All Cars</CardTitle>
                                    <Car className="h-4 w-4 text-muted-foreground" />
                                </CardHeader>
                                <CardContent>
                                    <div className="text-2xl font-bold">{loading ? <Skeleton className="h-8 w-16" /> : stats.total}</div>
                                    <p className="text-xs text-muted-foreground">Total registered plates</p>
                                </CardContent>
                            </Card>
                            <Card>
                                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                    <CardTitle className="text-sm font-medium">Pending Valuation</CardTitle>
                                    <Clock className="h-4 w-4 text-muted-foreground" />
                                </CardHeader>
                                <CardContent>
                                    <div className="text-2xl font-bold">{loading ? <Skeleton className="h-8 w-16" /> : stats.pendingValuation}</div>
                                    <p className="text-xs text-muted-foreground">Awaiting valuation reports</p>
                                </CardContent>
                            </Card>
                             <Card>
                                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                    <CardTitle className="text-sm font-medium">Pending Approval</CardTitle>
                                    <Hourglass className="h-4 w-4 text-muted-foreground" />
                                </CardHeader>
                                <CardContent>
                                    <div className="text-2xl font-bold">{loading ? <Skeleton className="h-8 w-16" /> : stats.pendingApproval}</div>
                                    <p className="text-xs text-muted-foreground">Awaiting Guarantor approval</p>
                                </CardContent>
                            </Card>
                            <Card>
                                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                    <CardTitle className="text-sm font-medium">Approved</CardTitle>
                                    <CheckCircle className="h-4 w-4 text-muted-foreground" />
                                </CardHeader>
                                <CardContent>
                                    <div className="text-2xl font-bold">{loading ? <Skeleton className="h-8 w-16" /> : stats.completed}</div>
                                    <p className="text-xs text-muted-foreground">Completed and approved</p>
                                </CardContent>
                            </Card>
                        </div>
                    )}
                    {(activeView === 'dashboard' || activeView === 'valuations') && (
                        <Card className="mt-8">
                            <CardHeader>
                                <CardTitle>All Bookings</CardTitle>
                                <CardDescription>A list of all registered vehicle valuations.</CardDescription>
                            </CardHeader>
                            <CardContent>
                                 <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Booking ID</TableHead>
                                            <TableHead className="hidden sm:table-cell">Customer</TableHead>
                                            <TableHead className="hidden md:table-cell">Vehicle</TableHead>
                                            <TableHead className="hidden md:table-cell">Guarantor</TableHead>
                                            <TableHead>Status</TableHead>
                                            <TableHead className="text-right">Action</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                    {loading ? (
                                        Array.from({ length: 5 }).map((_, index) => (
                                        <TableRow key={index}>
                                            <TableCell><Skeleton className="h-5 w-24" /></TableCell>
                                            <TableCell className="hidden sm:table-cell"><Skeleton className="h-5 w-32" /></TableCell>
                                            <TableCell className="hidden md:table-cell"><Skeleton className="h-5 w-40" /></TableCell>
                                            <TableCell className="hidden md:table-cell"><Skeleton className="h-5 w-32" /></TableCell>
                                            <TableCell><Skeleton className="h-6 w-20" /></TableCell>
                                            <TableCell className="text-right"><Skeleton className="h-8 w-48 ml-auto" /></TableCell>
                                        </TableRow>
                                        ))
                                    ) : bookings.length > 0 ? (
                                        bookings.map((booking) => (
                                        <TableRow key={booking.id}>
                                            <TableCell className="font-mono text-xs truncate">{booking.bookingNumber}</TableCell>
                                            <TableCell className="font-medium hidden sm:table-cell">{booking.customerName}</TableCell>
                                            <TableCell className="hidden md:table-cell">{`${booking.carMake} ${booking.carModel} (${booking.plateNumber})`}</TableCell>
                                            <TableCell className="hidden md:table-cell">{booking.insurerName}</TableCell>
                                            <TableCell>
                                            <Badge variant={getStatusVariant(booking.status)}>{booking.status}</Badge>
                                            </TableCell>
                                            <TableCell className="text-right space-x-2">
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    onClick={() => openValuationDialog(booking)}
                                                    disabled={booking.status !== 'Pending'}
                                                >
                                                    <FilePen className="mr-2 h-4 w-4" />
                                                    <span className="hidden sm:inline">Valuate</span>
                                                </Button>
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    onClick={() => router.push(`/client/booking-report?id=${booking.id}`)}
                                                >
                                                    <Printer className="mr-2 h-4 w-4" />
                                                    <span className="hidden sm:inline">Valuated</span>
                                                </Button>
                                            </TableCell>
                                        </TableRow>
                                        ))
                                    ) : (
                                        <TableRow>
                                            <TableCell colSpan={6} className="text-center h-24">
                                                No bookings found.
                                            </TableCell>
                                        </TableRow>
                                    )}
                                    </TableBody>
                                </Table>
                            </CardContent>
                        </Card>
                    )}
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
                                        <div><Label>Guarantor</Label><Input value={selectedBooking?.insurerName} disabled /></div>
                                        <div><Label>Vehicle</Label><Input value={`${selectedBooking?.carMake} ${selectedBooking?.carModel}`} disabled /></div>
                                        <div><Label>Plate Number</Label><Input value={selectedBooking?.plateNumber} disabled /></div>
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
                                            name="salvageValue"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>Salvage Value (KES)</FormLabel>
                                                    <FormControl><Input placeholder="e.g. 300,000" {...field} /></FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                    </div>
                                    
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

    