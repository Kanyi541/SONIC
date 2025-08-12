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
import { Loader2 } from "lucide-react";

const loginSchema = z.object({
  email: z.string().email({ message: "Please enter a valid email." }),
  password: z.string().min(1, { message: "Password is required." }),
});

const clientLoginSchema = z.object({
  name: z.string().min(1, { message: "Name is required." }),
  password: z.string().min(1, { message: "Password is required." }),
});


type LoginFormValues = z.infer<typeof loginSchema>;
type ClientLoginFormValues = z.infer<typeof clientLoginSchema>;
type Role = "Admin" | "Client" | "Customer" | "Valuer";

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
                    <Input type="password" placeholder="••••••••" {...field} />
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


const ClientLoginForm = ({ setIsLoading }: { setIsLoading: (loading: boolean) => void }) => {
  const router = useRouter();
  const { toast } = useToast();

  const form = useForm<ClientLoginFormValues>({
    resolver: zodResolver(clientLoginSchema),
    defaultValues: { name: "", password: "" },
  });

  const onSubmit = async (data: ClientLoginFormValues) => {
    setIsLoading(true);
    try {
      const q = query(collection(db, "clients"), where("name", "==", data.name));
      const querySnapshot = await getDocs(q);

      if (querySnapshot.empty) {
        throw new Error("Invalid credentials.");
      }

      const clientDoc = querySnapshot.docs[0];
      const clientData = clientDoc.data();

      if (clientData.password !== data.password) {
        throw new Error("Invalid credentials.");
      }
      
      if (!clientData.active) {
        throw new Error("Your account is inactive. Please contact admin to activate it.");
      }
      
      router.push('/client/dashboard');
      toast({ title: `Client Login Successful`, description: `Welcome, ${clientData.name}!` });

    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Login Failed",
        description: error.message,
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="font-headline">Client Login</CardTitle>
        <CardDescription>
          Enter your credentials to access the client dashboard.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Name (Username)</FormLabel>
                  <FormControl>
                    <Input placeholder="John Doe" {...field} />
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
                    <Input type="password" placeholder="••••••••" {...field} />
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


const MockLoginForm = ({ role, setIsLoading }: { role: Role; setIsLoading: (loading: boolean) => void }) => {
  const router = useRouter();
  const { toast } = useToast();

  const form = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "" },
  });

  const onSubmit = async (data: LoginFormValues) => {
    setIsLoading(true);
    try {
        await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate network delay
        if (data.email && data.password) {
          router.push(`/${role.toLowerCase()}/dashboard`);
          toast({ title: `${role} Login Successful`, description: "Welcome!" });
        } else {
          throw new Error("Invalid credentials for mock login.");
        }
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Login Failed",
        description: error.message,
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="font-headline">{role} Login</CardTitle>
        <CardDescription>
          Enter your credentials to access the {role.toLowerCase()} dashboard.
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
                    <Input type="password" placeholder="••••••••" {...field} />
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
    Client: false,
    Customer: false,
    Valuer: false,
  });

  const roles: Role[] = ["Admin", "Client", "Customer", "Valuer"];
  
  const getFormComponent = (role: Role) => {
    const setIsLoading = (loading: boolean) => setLoadingStates(prev => ({ ...prev, [role]: loading }));

    switch (role) {
      case 'Admin':
        return <AdminLoginForm setIsLoading={setIsLoading} />;
      case 'Client':
        return <ClientLoginForm setIsLoading={setIsLoading} />;
      default:
        return <MockLoginForm role={role} setIsLoading={setIsLoading} />;
    }
  }

  return (
    <Tabs defaultValue="Admin" className="w-full">
      <TabsList className="grid w-full grid-cols-2 sm:grid-cols-4">
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
