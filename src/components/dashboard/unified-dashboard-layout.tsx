

"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { SidebarProvider, Sidebar, SidebarTrigger, SidebarInset, SidebarHeader, SidebarContent, SidebarMenu, SidebarMenuItem, SidebarMenuButton, SidebarFooter } from '@/components/ui/sidebar';
import { Button } from '@/components/ui/button';
import { LogOut, LayoutDashboard, Settings, Users, BookCopy, ChevronDown, FolderCog, Hourglass, UserCog, PlusCircle, FileText, Clock, CheckCircle, Building2, Briefcase } from 'lucide-react';
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
import Image from 'next/image';
import { InstallPwaButton } from '../pwa/install-prompt';

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
    institutionName?: string;
    menuItems: MenuItem[];
    children: (activeView: string, setActiveView: React.Dispatch<React.SetStateAction<string>>) => React.ReactNode;
    footerContent?: React.ReactNode;
    isAgent?: boolean;
};

const getIconForView = (view: string) => {
    switch (view) {
        case 'dashboard':
            return <LayoutDashboard />;
        case 'customers':
             return <Users />;
        case 'bookings':
            return <CheckCircle />;
        case 'valuations':
            return <BookCopy />;
        case 'agents':
            return <UserCog />;
        case 'staff':
            return <Briefcase />;
        case 'new-booking':
            return <PlusCircle />
        case 'pending-approval':
            return <Hourglass />;
        case 'pending-bookings':
            return <Clock />;
        case 'branches':
            return <Building2 />;
        default:
            return <LayoutDashboard />;
    }
}

export default function UnifiedDashboardLayout({
    title,
    userRole,
    userEmail,
    institutionName,
    menuItems,
    children,
    footerContent,
    isAgent = false,
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

    const sidebarPanelTitle = userRole.includes(' - ')
      ? userRole.split(' - ')[0] + ' Panel'
      : `${userRole} Panel`;

    const handleMenuItemClick = (item: MenuItem) => {
        if (item.action) {
            item.action();
        } else {
            setActiveView(item.view);
        }
    };


    return (
        <SidebarProvider>
            <Sidebar variant="inset" side="left">
                <SidebarHeader>
                    <div className="flex items-center gap-2 p-2">
                        <div className="bg-sidebar-primary text-sidebar-primary-foreground rounded-lg p-2 flex items-center justify-center">
                            <Settings className="h-6 w-6" />
                        </div>
                        <h2 className="text-lg font-semibold text-sidebar-primary">{sidebarPanelTitle}</h2>
                    </div>
                </SidebarHeader>
                <SidebarContent>
                    <SidebarMenu>
                         {menuItems.map(item => (
                            <SidebarMenuItem key={item.view}>
                                <SidebarMenuButton 
                                    onClick={() => handleMenuItemClick(item)} 
                                    isActive={activeView === item.view} 
                                    tooltip={item.name}
                                    className="flex items-center justify-between"
                                >
                                    <div className="flex items-center gap-2">
                                        {getIconForView(item.view)}
                                        {item.name}
                                    </div>
                                     {item.notificationCount && item.notificationCount > 0 && (
                                        <span className="bg-destructive text-destructive-foreground text-xs font-semibold rounded-full h-5 w-5 flex items-center justify-center">
                                            {item.notificationCount}
                                        </span>
                                    )}
                                </SidebarMenuButton>
                            </SidebarMenuItem>
                         ))}
                    </SidebarMenu>
                </SidebarContent>
                 <SidebarFooter>
                    <InstallPwaButton />
                </SidebarFooter>
            </Sidebar>
            <SidebarInset>
                <header className="sticky top-0 z-40 w-full border-b bg-secondary shadow-sm">
                    <div className="container flex h-16 items-center justify-between">
                        <div className="flex items-center gap-4">
                            <SidebarTrigger className="text-white hover:text-white/80" />
                            <div className="h-10 w-40 relative">
                                <Image
                                    src="/logo.jpeg"
                                    alt="Sonic Motor Valuers Logo"
                                    fill
                                    className="object-contain"
                                    priority
                                />
                            </div>
                        </div>
                         <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="ghost" className="relative h-10 w-10 rounded-full">
                                <Avatar className="h-10 w-10">
                                    <AvatarFallback className="bg-primary text-primary-foreground">{getInitials(userEmail)}</AvatarFallback>
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
                    {children(activeView, setActiveView)}
                </main>
                <footer className="py-4 border-t bg-card/50">
                    <div className="container flex flex-col items-center justify-center gap-1 text-xs text-muted-foreground">
                        <p>© {new Date().getFullYear()} Sonic Motor Valuers. All rights reserved.</p>
                        <p>Version 1.0.0</p>
                        {footerContent}
                    </div>
                </footer>
            </SidebarInset>
        </SidebarProvider>
    );
}
