
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

const agentLoginSchema = z.object({
  clientUsername: z.string().min(1, { message: "Client username is required." }),
  username: z.string().min(1, { message: "Your username is required." }),
  password: z.string().min(1, { message: "Password is required." }),
});


type LoginFormValues = z.infer<typeof loginSchema>;
type ForgotPasswordFormValues = z.infer<typeof forgotPasswordSchema>;
type UserLoginFormValues = z.infer<typeof userLoginSchema>;
type AgentLoginFormValues = z.infer<typeof agentLoginSchema>;
type Role = "Admin" | "Client" | "Valuer" | "Agent";

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
      await signInWithEmailAndPassword(auth, data.email, data.password);
      router.push('/admin/dashboard');
      toast({ title: "Admin Login Successful", description: "Welcome back!" });
    } catch (error: any) {
      const errorMessage = error.code === 'auth/invalid-credential'
        ? 'Invalid email or password.'
        : error.message;
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
      const q = query(insurersRef, where("username", "==", data.username));
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

      const insurerDoc = querySnapshot.docs[0];
      const insurerData = insurerDoc.data();

      if (insurerData.password !== data.password) {
        toast({
          variant: "destructive",
          title: "Login Failed",
          description: "Invalid credentials.",
        });
        setIsLoading(false);
        return;
      }

      if (!insurerData.active) {
        toast({
          variant: "destructive",
          title: "Account Inactive",
          description: "Your account is inactive. Please contact the administrator.",
        });
        setIsLoading(false);
        return;
      }
      
      sessionStorage.setItem('loggedInUser', JSON.stringify({ name: insurerData.name, username: insurerData.username, email: insurerData.email, role: 'Client' }));
      router.push('/client/dashboard');
      toast({ title: "Client Login Successful", description: `Welcome back, ${insurerData.name}!` });

    } catch (error) {
      console.error("Client login error:", error);
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
        <CardTitle className="font-headline text-primary">Client/Institution Login</CardTitle>
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
                    <Input placeholder="Institution Username" {...field} />
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
                      To reset your password, please contact CASA Motor Valuers & Assessors directly for assistance.
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
                      To reset your password, please contact CASA Motor Valuers & Assessors directly for assistance.
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

const AgentLoginForm = ({ setIsLoading }: { setIsLoading: (loading: boolean) => void }) => {
  const router = useRouter();
  const { toast } = useToast();

  const form = useForm<AgentLoginFormValues>({
    resolver: zodResolver(agentLoginSchema),
    defaultValues: { clientUsername: "", username: "", password: "" },
  });

  const onSubmit = async (data: AgentLoginFormValues) => {
    setIsLoading(true);
    try {
      const insurersRef = collection(db, "insurers");
      
      const clientQuery = query(insurersRef, where("username", "==", data.clientUsername));
      const clientSnapshot = await getDocs(clientQuery);

      if (clientSnapshot.empty) {
        toast({ variant: "destructive", title: "Login Failed", description: "Could not find the specified institution/client." });
        setIsLoading(false);
        return;
      }
      
      const clientData = clientSnapshot.docs[0].data();

      // Fetch all agents for the client and filter in code
      const agentsQuery = query(insurersRef, 
        where("clientId", "==", data.clientUsername),
        where("role", "==", "Agent")
      );
      const agentsSnapshot = await getDocs(agentsQuery);
      
      if (agentsSnapshot.empty) {
        toast({ variant: "destructive", title: "Login Failed", description: "No agents found for this client." });
        setIsLoading(false);
        return;
      }

      const agentDoc = agentsSnapshot.docs.find(doc => doc.data().username === data.username);

      if (!agentDoc) {
        toast({ variant: "destructive", title: "Login Failed", description: "Invalid agent username for this client." });
        setIsLoading(false);
        return;
      }
      
      const agentData = agentDoc.data();

      if (agentData.password !== data.password) {
        toast({ variant: "destructive", title: "Login Failed", description: "Invalid agent password." });
        setIsLoading(false);
        return;
      }

      sessionStorage.setItem('loggedInUser', JSON.stringify({ 
        name: clientData.name,
        username: clientData.username, 
        email: clientData.email,
        role: 'Client',
        agentName: agentData.name 
      }));
      
      router.push('/client/dashboard');
      toast({ title: "Agent Login Successful", description: `Welcome back, ${agentData.name}!` });

    } catch (error) {
      console.error("Agent login error:", error);
      toast({ variant: "destructive", title: "Login Failed", description: "An unexpected error occurred." });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="bg-white/90 backdrop-blur-sm">
      <CardHeader>
        <CardTitle className="font-headline text-primary">Agent Login</CardTitle>
        <CardDescription>
          Enter your credentials to access your client's dashboard.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="clientUsername"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Institution/Client Username</FormLabel>
                  <FormControl><Input placeholder="Your institution's username" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="username"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Your Username</FormLabel>
                  <FormControl><Input placeholder="Your agent username" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Your Password</FormLabel>
                  <FormControl><PasswordInput field={field} placeholder="••••••••" /></FormControl>
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
                      To reset your password, please contact CASA Motor Valuers & Assessors directly for assistance.
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
    Agent: false,
  });

  const roles: Role[] = ["Admin", "Client", "Valuer", "Agent"];
  
  const getFormComponent = (role: Role) => {
    const setIsLoading = (loading: boolean) => setLoadingStates(prev => ({ ...prev, [role]: loading }));

    switch (role) {
      case 'Admin':
        return <AdminLoginForm setIsLoading={setIsLoading} />;
      case 'Client':
        return <ClientLoginForm setIsLoading={setIsLoading} />;
      case 'Valuer':
        return <ValuerLoginForm setIsLoading={setIsLoading} />;
      case 'Agent':
        return <AgentLoginForm setIsLoading={setIsLoading} />;
      default:
        return null;
    }
  }

  return (
    <Tabs defaultValue="Admin" className="w-full">
      <TabsList className="grid w-full grid-cols-2 sm:grid-cols-4 h-auto sm:h-10 bg-black/20 text-white">
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

    