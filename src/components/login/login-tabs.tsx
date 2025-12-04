

"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { signInWithEmailAndPassword, sendPasswordResetEmail } from "firebase/auth";
import { auth, db } from "@/lib/firebase";
import { collection, query, where, getDocs } from "firebase/firestore";


import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Eye, EyeOff } from "lucide-react";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";

const loginSchema = z.object({
  email: z.string().email({ message: "Please enter a valid email." }),
  password: z.string().min(1, { message: "Password is required." }),
});

const forgotPasswordSchema = z.object({
  email: z.string().email({ message: "Please enter a valid email to reset your password." }),
});

const userLoginSchema = z.object({
  username: z.string().min(1, { message: "Username is required." }),
  password: z.string().min(1, { message: "Password is required." }),
});


type LoginFormValues = z.infer<typeof loginSchema>;
type ForgotPasswordFormValues = z.infer<typeof forgotPasswordSchema>;
type UserLoginFormValues = z.infer<typeof userLoginSchema>;
type Role = "Admin" | "Client" | "Valuer";

const PasswordInput = ({ field, ...props }: { field: any, [key: string]: any }) => {
    const [showPassword, setShowPassword] = useState(false);
    return (
        <div className="relative">
            <Input 
                type={showPassword ? "text" : "password"} 
                {...field}
                {...props}
            />
            <Button
                type="button"
                variant="ghost"
                size="icon"
                className="absolute top-1/2 right-2 -translate-y-1/2 h-7 w-7 text-muted-foreground"
                onClick={() => setShowPassword(!showPassword)}
            >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
            </Button>
        </div>
    );
};

const AdminLoginForm = ({ setIsLoading }: { setIsLoading: (loading: boolean) => void }) => {
  const router = useRouter();
  const { toast } = useToast();
  const [isForgotPassword, setForgotPassword] = useState(false);

  const loginForm = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "" },
  });

  const forgotPasswordForm = useForm<ForgotPasswordFormValues>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: { email: "" },
  });

  const onLoginSubmit = async (data: LoginFormValues) => {
    setIsLoading(true);
    try {
        // Step 1: Sign in with Firebase Auth
        const userCredential = await signInWithEmailAndPassword(auth, data.email, data.password);
        const user = userCredential.user;

        // Step 2: Check Firestore 'staff' collection for admin role and active status
        const staffRef = collection(db, "staff");
        const q = query(staffRef, where("uid", "==", user.uid));
        const querySnapshot = await getDocs(q);

        if (querySnapshot.empty) {
            // This could be the root admin, not in the staff list. Or an error.
            // For now, let's assume a root admin can always log in if Auth passes.
            // A more robust system might check a specific 'admins' collection.
             router.push('/admin/dashboard');
             toast({ title: "Admin Login Successful", description: "Welcome back!" });
        } else {
            const staffDoc = querySnapshot.docs[0].data();
            if (staffDoc.isAdmin && staffDoc.active) {
                router.push('/admin/dashboard');
                toast({ title: "Admin Login Successful", description: "Welcome back!" });
            } else if (!staffDoc.active) {
                 await signOut(auth);
                 toast({
                    variant: "destructive",
                    title: "Account Inactive",
                    description: "Your account is currently inactive. Please contact another administrator for assistance.",
                });
            } else {
                 await signOut(auth);
                 toast({
                    variant: "destructive",
                    title: "Login Failed",
                    description: "You do not have administrative privileges.",
                });
            }
        }
    } catch (error: any) {
        const errorMessage = error.code === 'auth/invalid-credential' 
            ? 'Invalid email or password.'
            : 'An unexpected error occurred.';
        toast({
            variant: "destructive",
            title: "Login Failed",
            description: errorMessage,
        });
    } finally {
        setIsLoading(false);
    }
  };
  
  const onForgotPasswordSubmit = async (data: ForgotPasswordFormValues) => {
    setIsLoading(true);
    try {
      await sendPasswordResetEmail(auth, data.email);
      toast({
        title: "Password Reset Email Sent",
        description: "Please check your inbox for instructions to reset your password.",
      });
      setForgotPassword(false);
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Reset Failed",
        description: "Could not send password reset email. Please check the email address.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (isForgotPassword) {
    return (
    <Card className="bg-white/90 backdrop-blur-sm">
        <CardHeader>
          <CardTitle className="font-headline text-primary">Reset Admin Password</CardTitle>
          <CardDescription>
            Enter your email to receive a password reset link.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...forgotPasswordForm}>
            <form onSubmit={forgotPasswordForm.handleSubmit(onForgotPasswordSubmit)} className="space-y-6">
              <FormField
                control={forgotPasswordForm.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input placeholder="name@example.com" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="flex flex-col sm:flex-row gap-2">
                <Button type="button" variant="outline" className="w-full" onClick={() => setForgotPassword(false)}>
                  Cancel
                </Button>
                <Button type="submit" className="w-full" disabled={forgotPasswordForm.formState.isSubmitting}>
                  {forgotPasswordForm.formState.isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Send Reset Link
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="bg-white/90 backdrop-blur-sm">
      <CardHeader>
        <CardTitle className="font-headline text-primary">Admin Login</CardTitle>
        <CardDescription>
          Enter your credentials to access the admin dashboard.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...loginForm}>
          <form onSubmit={loginForm.handleSubmit(onLoginSubmit)} className="space-y-6">
            <FormField
              control={loginForm.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email</FormLabel>
                  <FormControl>
                    <Input placeholder="name@example.com" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={loginForm.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Password</FormLabel>
                  <FormControl>
                    <PasswordInput field={field} placeholder="••••••••" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button type="submit" className="w-full" disabled={loginForm.formState.isSubmitting}>
              {loginForm.formState.isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Sign In
            </Button>
             <div className="text-center text-sm">
              <Button variant="link" type="button" onClick={() => setForgotPassword(true)}>
                Forgot Password?
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
};


const ClientLoginForm = ({ setIsLoading }: { setIsLoading: (loading: boolean) => void }) => {
    const router = useRouter();
    const { toast } = useToast();

    const form = useForm<UserLoginFormValues>({
        resolver: zodResolver(userLoginSchema),
        defaultValues: { username: "", password: "" },
    });

    const onSubmit = async (data: UserLoginFormValues) => {
        setIsLoading(true);
        try {
            const insurersRef = collection(db, "insurers");

            // Check in insurers collection (for main client/institution AND agents)
            const qInsurers = query(insurersRef, where("username", "==", data.username));
            const insurerSnapshot = await getDocs(qInsurers);

            if (!insurerSnapshot.empty) {
                const userDoc = insurerSnapshot.docs[0];
                const userData = userDoc.data();

                if (userData.password === data.password && userData.active) {
                    if (userData.role === 'Agent') {
                        // This is an Agent
                        const clientQuery = query(insurersRef, where("username", "==", userData.clientId));
                        const clientSnapshot = await getDocs(clientQuery);

                        if (!clientSnapshot.empty) {
                            const clientData = clientSnapshot.docs[0].data();
                            sessionStorage.setItem('loggedInUser', JSON.stringify({ 
                                name: clientData.name,
                                username: clientData.username, 
                                email: clientData.email,
                                role: 'Client',
                                agentName: userData.name // Agent's own name
                            }));
                            router.push('/client/dashboard');
                            toast({ title: "Agent Login Successful", description: `Welcome back, ${userData.name}!` });
                        } else {
                            throw new Error("Could not find parent institution for agent.");
                        }
                    } else {
                        // This is a main Client/Institution
                        sessionStorage.setItem('loggedInUser', JSON.stringify({ name: userData.name, username: userData.username, email: userData.email, role: 'Client' }));
                        router.push('/client/dashboard');
                        toast({ title: "Client Login Successful", description: `Welcome back, ${userData.name}!` });
                    }
                    setIsLoading(false);
                    return;
                }
            }

            // If not found in insurers, check in staff collection
            const staffRef = collection(db, "staff");
            const qStaff = query(staffRef, where("username", "==", data.username));
            const staffSnapshot = await getDocs(qStaff);

            if (!staffSnapshot.empty) {
                const staffDoc = staffSnapshot.docs[0];
                const staffData = staffDoc.data();

                if (staffData.password === data.password) {
                     // Find the client this staff belongs to
                    const clientQuery = query(insurersRef, where("username", "==", staffData.clientId));
                    const clientSnapshot = await getDocs(clientQuery);

                    if (!clientSnapshot.empty) {
                        const clientData = clientSnapshot.docs[0].data();
                        sessionStorage.setItem('loggedInUser', JSON.stringify({ 
                            name: clientData.name, // Institution name
                            username: clientData.username, // Institution username
                            email: clientData.email, // Institution email
                            role: 'Client',
                            agentName: staffData.name // Staff's own name
                        }));
                        router.push('/client/dashboard');
                        toast({ title: "Staff Login Successful", description: `Welcome back, ${staffData.name}!` });
                        setIsLoading(false);
                        return;
                    }
                }
            }
            
            // If no user is found or password doesn't match
            toast({
                variant: "destructive",
                title: "Login Failed",
                description: "Invalid credentials or account is inactive.",
            });

        } catch (error) {
            console.error("Unified client/staff/agent login error:", error);
            toast({
                variant: "destructive",
                title: "Login Failed",
                description: "An unexpected error occurred. Please try again.",
            });
        } finally {
            setIsLoading(false);
        }
    };

  return (
    <Card className="bg-white/90 backdrop-blur-sm">
      <CardHeader>
        <CardTitle className="font-headline text-primary">Client/Staff/Agent Login</CardTitle>
        <CardDescription>
          Enter your credentials to access the client dashboard.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="username"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Username</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter your username" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Password</FormLabel>
                  <FormControl>
                    <PasswordInput field={field} placeholder="••••••••" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button type="submit" className="w-full" disabled={form.formState.isSubmitting}>
              {form.formState.isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Sign In
            </Button>
            <div className="text-center text-sm">
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="link">Forgot Password?</Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Password Recovery</AlertDialogTitle>
                    <AlertDialogDescription>
                      To reset your password, please contact Sonic Motor Valuers directly for assistance.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogAction>OK</AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
};

const ValuerLoginForm = ({ setIsLoading }: { setIsLoading: (loading: boolean) => void }) => {
  const router = useRouter();
  const { toast } = useToast();

  const form = useForm<UserLoginFormValues>({
    resolver: zodResolver(userLoginSchema),
    defaultValues: { username: "", password: "" },
  });

  const onSubmit = async (data: UserLoginFormValues) => {
    setIsLoading(true);
    try {
      const valuersRef = collection(db, "valuers");
      const q = query(valuersRef, where("username", "==", data.username));
      const querySnapshot = await getDocs(q);

      if (querySnapshot.empty) {
        toast({
          variant: "destructive",
          title: "Login Failed",
          description: "Invalid credentials.",
        });
        setIsLoading(false);
        return;
      }

      const valuerDoc = querySnapshot.docs[0];
      const valuerData = valuerDoc.data();

      if (valuerData.password !== data.password) {
        toast({
          variant: "destructive",
          title: "Login Failed",
          description: "Invalid credentials.",
        });
        setIsLoading(false);
        return;
      }

      if (!valuerData.active) {
        toast({
          variant: "destructive",
          title: "Account Inactive",
          description: "Your account is inactive. Please contact the administrator.",
        });
        setIsLoading(false);
        return;
      }
      
      sessionStorage.setItem('loggedInUser', JSON.stringify({ name: valuerData.name, username: valuerData.username, email: valuerData.email, role: 'Valuer' }));
      router.push('/valuer/dashboard');
      toast({ title: "Valuer Login Successful", description: `Welcome back, ${valuerData.name}!` });

    } catch (error) {
      console.error("Valuer login error:", error);
      toast({
        variant: "destructive",
        title: "Login Failed",
        description: "An unexpected error occurred. Please try again.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="bg-white/90 backdrop-blur-sm">
      <CardHeader>
        <CardTitle className="font-headline text-primary">Valuer Login</CardTitle>
        <CardDescription>
          Enter your credentials to access the valuer dashboard.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="username"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Username</FormLabel>
                  <FormControl>
                    <Input placeholder="Valuer Username" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Password</FormLabel>
                  <FormControl>
                    <PasswordInput field={field} placeholder="••••••••" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button type="submit" className="w-full" disabled={form.formState.isSubmitting}>
              {form.formState.isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Sign In
            </Button>
             <div className="text-center text-sm">
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="link">Forgot Password?</Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Password Recovery</AlertDialogTitle>
                    <AlertDialogDescription>
                      To reset your password, please contact Sonic Motor Valuers directly for assistance.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogAction>OK</AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
};


export default function LoginTabs() {
  const [loadingStates, setLoadingStates] = useState<Record<Role, boolean>>({
    Admin: false,
    Client: false,
    Valuer: false,
  });

  const roles: Role[] = ["Admin", "Client", "Valuer"];
  
  const getFormComponent = (role: Role) => {
    const setIsLoading = (loading: boolean) => setLoadingStates(prev => ({ ...prev, [role]: loading }));

    switch (role) {
      case 'Admin':
        return <AdminLoginForm setIsLoading={setIsLoading} />;
      case 'Client':
        return <ClientLoginForm setIsLoading={setIsLoading} />;
      case 'Valuer':
        return <ValuerLoginForm setIsLoading={setIsLoading} />;
      default:
        return null;
    }
  }

  return (
    <Tabs defaultValue="Client" className="w-full">
      <TabsList className="grid w-full grid-cols-3 h-auto sm:h-10 bg-black/20 text-white">
        {roles.map((role) => (
          <TabsTrigger key={role} value={role} className="data-[state=active]:bg-primary/80 data-[state=active]:text-black">{role}</TabsTrigger>
        ))}
      </TabsList>
      {roles.map((role) => (
         <TabsContent key={role} value={role}>
            {getFormComponent(role)}
         </TabsContent>
      ))}
    </Tabs>
  );
}
