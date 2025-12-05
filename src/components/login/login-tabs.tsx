
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

const clientLoginSchema = z.object({
  email: z.string().email({ message: "Please enter a valid email." }),
  password: z.string().min(1, { message: "Password is required." }),
});

const valuerLoginSchema = z.object({
  email: z.string().email({ message: "Please enter a valid email." }),
  password: z.string().min(1, { message: "Password is required." }),
});


type LoginFormValues = z.infer<typeof loginSchema>;
type ForgotPasswordFormValues = z.infer<typeof forgotPasswordSchema>;
type ClientLoginFormValues = z.infer<typeof clientLoginSchema>;
type ValuerLoginFormValues = z.infer<typeof valuerLoginSchema>;
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
        const userCredential = await signInWithEmailAndPassword(auth, data.email, data.password);
        const user = userCredential.user;

        const staffRef = collection(db, "staff");
        const q = query(staffRef, where("uid", "==", user.uid));
        const querySnapshot = await getDocs(q);

        if (querySnapshot.empty) {
            // If no staff doc, assume root super admin if login is successful.
            // This allows the first-ever admin to log in.
            sessionStorage.setItem('loggedInUser', JSON.stringify({ name: "Super Admin", username: "superadmin", email: user.email, role: 'Super Admin', uid: user.uid }));
            router.push('/admin/dashboard');
            toast({ title: "Admin Login Successful", description: "Welcome back!" });
        } else {
            const staffDoc = querySnapshot.docs[0].data();
            if (staffDoc.isAdmin && staffDoc.active) {
                sessionStorage.setItem('loggedInUser', JSON.stringify({ name: staffDoc.name, username: staffDoc.username, email: staffDoc.email, role: staffDoc.role, uid: user.uid }));
                router.push('/admin/dashboard');
                toast({ title: "Admin Login Successful", description: `Welcome back, ${staffDoc.name}!` });
            } else if (!staffDoc.active) {
                await auth.signOut();
                toast({
                    variant: "destructive",
                    title: "Account Inactive",
                    description: "Your account is currently inactive. Please contact an administrator.",
                });
            } else {
                await auth.signOut();
                toast({
                    variant: "destructive",
                    title: "Permission Denied",
                    description: "You do not have sufficient privileges to access the admin dashboard.",
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
    <Card className="bg-black/20 backdrop-blur-lg border-white/20 text-white">
        <CardHeader>
          <CardTitle className="font-headline text-white">Reset Admin Password</CardTitle>
          <CardDescription className="text-gray-300">
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
                <Button type="submit" variant="accent" className="w-full" disabled={forgotPasswordForm.formState.isSubmitting}>
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
    <Card className="bg-black/20 backdrop-blur-lg border-white/20 text-white">
      <CardHeader>
        <CardTitle className="font-headline text-white">Admin Login</CardTitle>
        <CardDescription className="text-gray-300">
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
            <Button type="submit" variant="accent" className="w-full" disabled={loginForm.formState.isSubmitting}>
              {loginForm.formState.isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Sign In
            </Button>
             <div className="text-center text-sm">
              <Button variant="link" type="button" onClick={() => setForgotPassword(true)} className="text-gray-300">
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
    const [isForgotPassword, setForgotPassword] = useState(false);
    const [isResetSent, setResetSent] = useState(false);

    const form = useForm<ClientLoginFormValues>({
        resolver: zodResolver(clientLoginSchema),
        defaultValues: { email: "", password: "" },
    });
    
    const forgotPasswordForm = useForm<ForgotPasswordFormValues>({
        resolver: zodResolver(forgotPasswordSchema),
        defaultValues: { email: "" },
    });

    const onForgotPasswordSubmit = async (data: ForgotPasswordFormValues) => {
        setIsLoading(true);
        try {
            await sendPasswordResetEmail(auth, data.email);
            setResetSent(true);
            setForgotPassword(false);
        } catch (error) {
            toast({
                variant: "destructive",
                title: "Reset Failed",
                description: "Could not send password reset email. Please check the email address.",
            });
        } finally {
            setIsLoading(false);
        }
    };

    const onSubmit = async (data: ClientLoginFormValues) => {
        setIsLoading(true);
        try {
            const userCredential = await signInWithEmailAndPassword(auth, data.email, data.password);
            const user = userCredential.user;

            // Check if user is an Institution
            const insurersRef = collection(db, "insurers");
            const qInsurers = query(insurersRef, where("uid", "==", user.uid));
            const insurersSnapshot = await getDocs(qInsurers);

            if (!insurersSnapshot.empty) {
                const userDoc = insurersSnapshot.docs[0].data();
                if (userDoc.active) {
                    sessionStorage.setItem('loggedInUser', JSON.stringify({ 
                        name: userDoc.name, 
                        username: userDoc.username, 
                        email: userDoc.email, 
                        role: 'Client',
                        uid: user.uid,
                    }));
                    router.push('/client/dashboard');
                    toast({ title: "Client Login Successful", description: `Welcome back, ${userDoc.name}!` });
                    return;
                } else {
                    await auth.signOut();
                    toast({ variant: "destructive", title: "Account Inactive", description: "Your account is inactive." });
                    return;
                }
            }

            // Check if user is a Staff member of a client
            const staffRef = collection(db, "staff");
            const qStaff = query(staffRef, where("uid", "==", user.uid));
            const staffSnapshot = await getDocs(qStaff);

            if (!staffSnapshot.empty) {
                const userDoc = staffSnapshot.docs[0].data();
                const clientRef = query(collection(db, "insurers"), where("username", "==", userDoc.clientId));
                const clientSnapshot = await getDocs(clientRef);
                
                if (!clientSnapshot.empty) {
                    const clientDoc = clientSnapshot.docs[0].data();
                    sessionStorage.setItem('loggedInUser', JSON.stringify({ 
                        name: userDoc.name, 
                        username: userDoc.username, 
                        email: userDoc.email, 
                        role: 'Staff',
                        agentName: clientDoc.name, // To show which institution they belong to
                        uid: user.uid,
                    }));
                    router.push('/client/dashboard');
                    toast({ title: "Staff Login Successful", description: `Welcome, ${userDoc.name}!` });
                    return;
                }
            }

            // Check if user is an Agent of a client
            const agentsRef = collection(db, "insurers");
            const qAgents = query(agentsRef, where("uid", "==", user.uid), where("role", "==", "Agent"));
            const agentsSnapshot = await getDocs(qAgents);
            
            if(!agentsSnapshot.empty) {
                const userDoc = agentsSnapshot.docs[0].data();
                const clientRef = query(collection(db, "insurers"), where("username", "==", userDoc.clientId));
                const clientSnapshot = await getDocs(clientRef);
                 if (!clientSnapshot.empty) {
                    const clientDoc = clientSnapshot.docs[0].data();
                     sessionStorage.setItem('loggedInUser', JSON.stringify({ 
                        name: userDoc.name, 
                        username: userDoc.username, 
                        email: userDoc.email, 
                        role: 'Agent',
                        agentName: clientDoc.name,
                        uid: user.uid,
                    }));
                    router.push('/client/dashboard');
                    toast({ title: "Agent Login Successful", description: `Welcome, ${userDoc.name}!` });
                    return;
                }
            }
            
            // If user is not found in any of the above roles
            await auth.signOut();
            toast({ variant: "destructive", title: "Login Failed", description: "No profile found for this account." });

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
    
    if (isForgotPassword) {
    return (
    <Card className="bg-black/20 backdrop-blur-lg border-white/20 text-white">
        <CardHeader>
          <CardTitle className="font-headline text-white">Reset Password</CardTitle>
          <CardDescription className="text-gray-300">
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
                <Button type="submit" variant="accent" className="w-full" disabled={forgotPasswordForm.formState.isSubmitting}>
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
    <>
      <AlertDialog open={isResetSent} onOpenChange={setResetSent}>
          <AlertDialogContent>
              <AlertDialogHeader>
                  <AlertDialogTitle>Password Reset Email Sent</AlertDialogTitle>
                  <AlertDialogDescription>
                      Your password reset link has been sent. Please check your email inbox (and spam/junk folder) to continue resetting your password.
                  </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                  <AlertDialogAction onClick={() => setResetSent(false)}>OK</AlertDialogAction>
              </AlertDialogFooter>
          </AlertDialogContent>
      </AlertDialog>

      <Card className="bg-black/20 backdrop-blur-lg border-white/20 text-white">
        <CardHeader>
          <CardTitle className="font-headline text-white">Client/Staff/Agent Login</CardTitle>
          <CardDescription className="text-gray-300">
            Enter your credentials to access the client dashboard.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter your email" {...field} />
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
              <Button type="submit" variant="accent" className="w-full" disabled={form.formState.isSubmitting}>
                {form.formState.isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Sign In
              </Button>
              <div className="text-center text-sm">
                <Button type="button" variant="link" onClick={() => setForgotPassword(true)} className="text-gray-300">
                  Forgot Password?
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </>
  );
};

const ValuerLoginForm = ({ setIsLoading }: { setIsLoading: (loading: boolean) => void }) => {
  const router = useRouter();
  const { toast } = useToast();
  const [isForgotPassword, setForgotPassword] = useState(false);
  const [isResetSent, setResetSent] = useState(false);

  const form = useForm<ValuerLoginFormValues>({
    resolver: zodResolver(valuerLoginSchema),
    defaultValues: { email: "", password: "" },
  });
  
  const forgotPasswordForm = useForm<ForgotPasswordFormValues>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: { email: "" },
  });

  const onForgotPasswordSubmit = async (data: ForgotPasswordFormValues) => {
    setIsLoading(true);
    try {
        await sendPasswordResetEmail(auth, data.email);
        setResetSent(true);
        setForgotPassword(false);
    } catch (error) {
        toast({
            variant: "destructive",
            title: "Reset Failed",
            description: "Could not send password reset email. Please check the email address.",
        });
    } finally {
        setIsLoading(false);
    }
  };


  const onSubmit = async (data: ValuerLoginFormValues) => {
    setIsLoading(true);
    try {
      const userCredential = await signInWithEmailAndPassword(auth, data.email, data.password);
      const user = userCredential.user;

      const valuersRef = collection(db, "valuers");
      const q = query(valuersRef, where("uid", "==", user.uid));
      const querySnapshot = await getDocs(q);

      if (querySnapshot.empty) {
        await auth.signOut();
        toast({
          variant: "destructive",
          title: "Login Failed",
          description: "No valuer profile found for this account.",
        });
        setIsLoading(false);
        return;
      }

      const valuerData = querySnapshot.docs[0].data();

      if (!valuerData.active) {
        await auth.signOut();
        toast({
          variant: "destructive",
          title: "Account Inactive",
          description: "Your account is inactive. Please contact the administrator.",
        });
        setIsLoading(false);
        return;
      }
      
      sessionStorage.setItem('loggedInUser', JSON.stringify({ 
        name: valuerData.name, 
        username: valuerData.username, 
        email: valuerData.email, 
        role: 'Valuer',
        uid: user.uid,
      }));
      router.push('/valuer/dashboard');
      toast({ title: "Valuer Login Successful", description: `Welcome back, ${valuerData.name}!` });

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
  
  if (isForgotPassword) {
    return (
    <Card className="bg-black/20 backdrop-blur-lg border-white/20 text-white">
        <CardHeader>
          <CardTitle className="font-headline text-white">Reset Valuer Password</CardTitle>
          <CardDescription className="text-gray-300">
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
                <Button type="submit" variant="accent" className="w-full" disabled={forgotPasswordForm.formState.isSubmitting}>
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
    <>
      <AlertDialog open={isResetSent} onOpenChange={setResetSent}>
          <AlertDialogContent>
              <AlertDialogHeader>
                  <AlertDialogTitle>Password Reset Email Sent</AlertDialogTitle>
                  <AlertDialogDescription>
                      Your password reset link has been sent. Please check your email inbox (and spam/junk folder) to continue resetting your password.
                  </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                  <AlertDialogAction onClick={() => setResetSent(false)}>OK</AlertDialogAction>
              </AlertDialogFooter>
          </AlertDialogContent>
      </AlertDialog>

      <Card className="bg-black/20 backdrop-blur-lg border-white/20 text-white">
        <CardHeader>
          <CardTitle className="font-headline text-white">Valuer Login</CardTitle>
          <CardDescription className="text-gray-300">
            Enter your credentials to access the valuer dashboard.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
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
              <Button type="submit" variant="accent" className="w-full" disabled={form.formState.isSubmitting}>
                {form.formState.isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Sign In
              </Button>
               <div className="text-center text-sm">
                <Button type="button" variant="link" onClick={() => setForgotPassword(true)} className="text-gray-300">
                  Forgot Password?
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </>
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
          <TabsTrigger key={role} value={role} className="data-[state=active]:bg-primary/80 data-[state=active]:text-white">{role}</TabsTrigger>
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
