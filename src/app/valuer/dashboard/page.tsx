
"use client";

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import UnifiedDashboardLayout from '@/components/dashboard/unified-dashboard-layout';
import { collection, query, where, getDocs } from "firebase/firestore";
import { db } from '@/lib/firebase';

interface LoggedInUser {
    name: string;
    username: string;
    email: string;
    role: string;
}

export default function ValuerDashboardPage() {
    const [loggedInUser, setLoggedInUser] = useState<LoggedInUser | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchValuerData = async () => {
            const storedUserString = sessionStorage.getItem('loggedInUser');
            if (storedUserString) {
                const storedUser = JSON.parse(storedUserString);
                const valuersRef = collection(db, "valuers");
                const q = query(valuersRef, where("username", "==", storedUser.username));
                
                try {
                    const querySnapshot = await getDocs(q);
                    if (!querySnapshot.empty) {
                        const valuerDoc = querySnapshot.docs[0];
                        const valuerData = valuerDoc.data();
                        setLoggedInUser({
                            name: valuerData.name,
                            username: valuerData.username,
                            email: valuerData.email,
                            role: 'Valuer'
                        });
                    } else {
                        // Handle case where user is in session but not in DB
                        console.error("Valuer not found in database.");
                    }
                } catch (error) {
                    console.error("Error fetching valuer data:", error);
                }
            }
            setLoading(false);
        };

        fetchValuerData();
    }, []);

    if (loading) {
         return (
            <div className="flex h-screen items-center justify-center">
                <p>Loading...</p>
            </div>
        );
    }

    return (
        <UnifiedDashboardLayout
            title="CASA DASH"
            userRole={loggedInUser?.name || "Valuer"}
            userEmail={loggedInUser?.email || ""}
            menuItems={[
                { name: 'Dashboard', view: 'dashboard' },
                { name: 'Assigned Valuations', view: 'valuations' },
            ]}
        >
            {(activeView) => (
                <>
                    {activeView === 'dashboard' && (
                        <Card className="shadow-lg">
                            <CardHeader>
                                <CardTitle className="font-headline text-3xl">Welcome, {loggedInUser?.name || 'Valuer'}!</CardTitle>
                                <CardDescription>Here are the valuations assigned to you.</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <p className="font-body">
                                    Review your assigned tasks, submit valuation reports, and manage your schedule from this panel.
                                </p>
                            </CardContent>
                        </Card>
                    )}
                    {activeView === 'valuations' && (
                        <Card>
                            <CardHeader>
                                <CardTitle>Assigned Valuations</CardTitle>
                                <CardDescription>All valuations assigned to you.</CardDescription>
                            </CardHeader>
                            <CardContent>
                                 <p className="text-muted-foreground">You have no pending valuations at the moment.</p>
                            </CardContent>
                        </Card>
                    )}
                </>
            )}
        </UnifiedDashboardLayout>
    );
}
