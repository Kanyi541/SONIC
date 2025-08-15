
"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { SidebarProvider, Sidebar, SidebarTrigger, SidebarInset, SidebarHeader, SidebarContent, SidebarMenu, SidebarMenuItem, SidebarMenuButton, SidebarFooter } from '@/components/ui/sidebar';
import { Button } from '@/components/ui/button';
import { LogOut, LayoutDashboard, Settings, Users, BookCopy, ChevronDown, FolderCog, Hourglass, UserCog, PlusCircle, FileText } from 'lucide-react';
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useToast } from '@/hooks/use-toast';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';

interface MenuItem {
    name: string;
    view: string;
    icon?: React.ReactNode;
    notificationCount?: number;
    action?: () => void;
}

type DashboardLayoutProps = {
    title: string;
    userRole: string;
    userEmail: string;
    menuItems: MenuItem[];
    children: (activeView: string) => React.ReactNode;
};

const getIconForView = (view: string) => {
    switch (view) {
        case 'dashboard':
            return <LayoutDashboard />;
        case 'create-booking':
            return <PlusCircle />;
        case 'bookings':
        case 'valuations':
            return <BookCopy />;
        case 'customers':
            return <Users />;
        case 'agents':
            return <UserCog />;
        case 'pending-approval':
            return <Hourglass />;
        default:
            return <LayoutDashboard />;
    }
}

export default function UnifiedDashboardLayout({
    title,
    userRole,
    userEmail,
    menuItems,
    children,
}: DashboardLayoutProps) {
    const { toast } = useToast();
    const router = useRouter();
    const [activeView, setActiveView] = useState(menuItems[0]?.view || 'dashboard');
    const [isClient, setIsClient] = useState(false);

    useEffect(() => {
        setIsClient(true);
    }, []);

    const getInitials = (email?: string | null) => {
        return email ? email.charAt(0).toUpperCase() : '?';
    };

    const handleLogout = async () => {
        try {
            if (isClient) {
                sessionStorage.removeItem('loggedInUser');
            }
            router.push('/');
            toast({ title: "Logged Out", description: "You have been successfully signed out." });
        } catch (error) {
            console.error("Error signing out: ", error);
            toast({ variant: "destructive", title: "Logout Failed", description: "An error occurred while signing out." });
        }
    };
    
    const isValuerDashboard = userRole !== "Admin" && !menuItems.some(item => item.view === 'customers');

    const topLevelItems = menuItems.filter(item => ['dashboard', 'create-booking'].includes(item.view));
    const managementItems = menuItems.filter(item => ['customers', 'agents'].includes(item.view));
    const bookingItems = menuItems.filter(item => ['bookings', 'valuations'].includes(item.view));
    const pendingApprovalItem = menuItems.find(item => item.view === 'pending-approval');


    return (
        <SidebarProvider>
            <Sidebar variant="inset" side="left">
                <SidebarHeader>
                    <div className="flex items-center gap-2 p-2">
                        <div className="bg-primary text-primary-foreground rounded-lg p-2 flex items-center justify-center">
                            <Settings className="h-6 w-6" />
                        </div>
                        <h2 className="text-xl font-semibold text-primary">{userRole} Panel</h2>
                    </div>
                </SidebarHeader>
                <SidebarContent>
                    <SidebarMenu>
                         {topLevelItems.map(item => (
                            <SidebarMenuItem key={item.view}>
                                <SidebarMenuButton 
                                    onClick={() => item.action ? item.action() : setActiveView(item.view)} 
                                    isActive={activeView === item.view} 
                                    tooltip={item.name}
                                >
                                    <div className="flex items-center gap-2">
                                        {getIconForView(item.view)}
                                        {item.name}
                                    </div>
                                </SidebarMenuButton>
                            </SidebarMenuItem>
                         ))}

                        {!isValuerDashboard && (
                            <>
                               <Collapsible>
                                    <CollapsibleTrigger className="w-full">
                                        <div className="flex items-center justify-between p-2 rounded-md hover:bg-gray-200 w-full">
                                            <div className="flex items-center gap-2">
                                                <FolderCog/>
                                                <span>Management</span>
                                            </div>
                                            <ChevronDown className="h-4 w-4" />
                                        </div>
                                    </CollapsibleTrigger>
                                    <CollapsibleContent className="ml-4">
                                        {managementItems.map(item => (
                                             <SidebarMenuItem key={item.view}>
                                                <SidebarMenuButton onClick={() => setActiveView(item.view)} isActive={activeView === item.view} tooltip={item.name}>
                                                    {getIconForView(item.view)}
                                                    {item.name}
                                                </SidebarMenuButton>
                                            </SidebarMenuItem>
                                        ))}
                                    </CollapsibleContent>
                                </Collapsible>
                            </>
                        )}
                        
                        <Collapsible>
                            <CollapsibleTrigger className="w-full" onClick={() => bookingItems.length > 0 && setActiveView(bookingItems[0].view)}>
                                <div className="flex items-center justify-between p-2 rounded-md hover:bg-gray-200 w-full">
                                    <div className="flex items-center gap-2">
                                        <BookCopy/>
                                        <span>View Bookings</span>
                                    </div>
                                    <ChevronDown className="h-4 w-4" />
                                </div>
                            </CollapsibleTrigger>
                                <CollapsibleContent className="ml-4">
                                {bookingItems.map(item => (
                                    <SidebarMenuItem key={item.view}>
                                        <SidebarMenuButton onClick={() => setActiveView(item.view)} isActive={activeView === item.view} tooltip={item.name}>
                                            {getIconForView(item.view)}
                                            {item.name}
                                        </SidebarMenuButton>
                                    </SidebarMenuItem>
                                ))}
                                </CollapsibleContent>
                        </Collapsible>

                        {pendingApprovalItem && (
                             <SidebarMenuItem>
                                <SidebarMenuButton 
                                    onClick={() => setActiveView(pendingApprovalItem.view)} 
                                    isActive={activeView === pendingApprovalItem.view} 
                                    tooltip={pendingApprovalItem.name}
                                    className="flex items-center justify-between"
                                >
                                    <div className="flex items-center gap-2">
                                        {getIconForView(pendingApprovalItem.view)}
                                        {pendingApprovalItem.name}
                                    </div>
                                    {pendingApprovalItem.notificationCount && pendingApprovalItem.notificationCount > 0 && (
                                        <span className="bg-destructive text-destructive-foreground text-xs font-semibold rounded-full h-5 w-5 flex items-center justify-center">
                                            {pendingApprovalItem.notificationCount}
                                        </span>
                                    )}
                                </SidebarMenuButton>
                            </SidebarMenuItem>
                        )}

                    </SidebarMenu>
                </SidebarContent>
            </Sidebar>
            <SidebarInset>
                <header className="sticky top-0 z-40 w-full border-b bg-card shadow-sm">
                    <div className="container flex h-16 items-center justify-between">
                        <div className="flex items-center gap-4">
                            <SidebarTrigger />
                            <h1 className="text-2xl font-headline font-bold text-primary">{title}</h1>
                        </div>
                         <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="ghost" className="relative h-10 w-10 rounded-full">
                                <Avatar className="h-10 w-10">
                                    <AvatarFallback className="bg-secondary text-secondary-foreground">{getInitials(userEmail)}</AvatarFallback>
                                </Avatar>
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent className="w-56" align="end" forceMount>
                                <DropdownMenuLabel className="font-normal">
                                <div className="flex flex-col space-y-1">
                                    <p className="text-sm font-medium leading-none">{userRole}</p>
                                    <p className="text-xs leading-none text-muted-foreground">
                                    {userEmail}
                                    </p>
                                </div>
                                </DropdownMenuLabel>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem onClick={handleLogout}>
                                <LogOut className="mr-2 h-4 w-4" />
                                <span>Log out</span>
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </div>
                </header>
                <main className="flex-1 container py-8">
                    {children(activeView)}
                </main>
                <footer className="py-6 md:px-8 md:py-0 border-t bg-card/50">
                    <div className="container flex flex-col items-center justify-between gap-4 md:h-24 md:flex-row">
                        <p className="text-sm text-center text-muted-foreground">
                            © {new Date().getFullYear()} Casa Motor Valuers & Assessors. All rights reserved.
                        </p>
                    </div>
                </footer>
            </SidebarInset>
        </SidebarProvider>
    );
}
