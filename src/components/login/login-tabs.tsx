
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { signInWithEmailAndPassword } from "firebase/auth";
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

const loginSchema = z.object({
  email: z.string().email({ message: "Please enter a valid email." }),
  password: z.string().min(1, { message: "Password is required." }),
});

const userLoginSchema = z.object({
  username: z.string().min(1, { message: "Username or Email is required." }),
  password: z.string().min(1, { message: "Password is required." }),
});


type LoginFormValues = z.infer<typeof loginSchema>;
type UserLoginFormValues = z.infer<typeof userLoginSchema>;
type Role = "Admin" | "Insurer" | "Valuer";

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

  const form = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "" },
  });

  const onSubmit = async (data: LoginFormValues) => {
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

  return (
    <Card>
      <CardHeader>
        <CardTitle className="font-headline">Admin Login</CardTitle>
        <CardDescription>
          Enter your credentials to access the admin dashboard.
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
            <Button type="submit" className="w-full" disabled={form.formState.isSubmitting}>
              {form.formState.isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Sign In
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
};


const InsurerLoginForm = ({ setIsLoading }: { setIsLoading: (loading: boolean) => void }) => {
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
      
      sessionStorage.setItem('loggedInUser', JSON.stringify({ name: insurerData.name, username: insurerData.username, email: insurerData.email, role: 'Insurer' }));
      router.push('/client/dashboard');
      toast({ title: "Insurer Login Successful", description: `Welcome back, ${insurerData.name}!` });

    } catch (error) {
      console.error("Insurer login error:", error);
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
    <Card>
      <CardHeader>
        <CardTitle className="font-headline">Insurer Login</CardTitle>
        <CardDescription>
          Enter your credentials to access the insurer dashboard.
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
                    <Input placeholder="Insurer Username" {...field} />
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
        const usernameQuery = query(valuersRef, where("username", "==", data.username));
        const emailQuery = query(valuersRef, where("email", "==", data.username));

        const [usernameSnapshot, emailSnapshot] = await Promise.all([
            getDocs(usernameQuery),
            getDocs(emailQuery)
        ]);

        let valuerDoc;
        if (!usernameSnapshot.empty) {
            valuerDoc = usernameSnapshot.docs[0];
        } else if (!emailSnapshot.empty) {
            valuerDoc = emailSnapshot.docs[0];
        }

        if (!valuerDoc) {
            toast({ variant: "destructive", title: "Login Failed", description: "Invalid credentials." });
            setIsLoading(false);
            return;
        }

        const valuerData = valuerDoc.data();

        if (valuerData.password !== data.password) {
            toast({ variant: "destructive", title: "Login Failed", description: "Invalid credentials." });
            setIsLoading(false);
            return;
        }

        if (!valuerData.active) {
            toast({ variant: "destructive", title: "Account Inactive", description: "Your account is inactive. Please contact the administrator." });
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
    <Card>
      <CardHeader>
        <CardTitle className="font-headline">Valuer Login</CardTitle>
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
                  <FormLabel>Username or Email</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter username or email" {...field} />
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
          </form>
        </Form>
      </CardContent>
    </Card>
  );
};


export default function LoginTabs() {
  const [loadingStates, setLoadingStates] = useState<Record<Role, boolean>>({
    Admin: false,
    Insurer: false,
    Valuer: false,
  });

  const roles: Role[] = ["Admin", "Insurer", "Valuer"];
  
  const getFormComponent = (role: Role) => {
    const setIsLoading = (loading: boolean) => setLoadingStates(prev => ({ ...prev, [role]: loading }));

    switch (role) {
      case 'Admin':
        return <AdminLoginForm setIsLoading={setIsLoading} />;
      case 'Insurer':
        return <InsurerLoginForm setIsLoading={setIsLoading} />;
      case 'Valuer':
        return <ValuerLoginForm setIsLoading={setIsLoading} />;
      default:
        return null;
    }
  }

  return (
    <Tabs defaultValue="Admin" className="w-full">
      <TabsList className="grid w-full grid-cols-1 sm:grid-cols-3 h-auto sm:h-10">
        {roles.map((role) => (
          <TabsTrigger key={role} value={role}>{role}</TabsTrigger>
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
