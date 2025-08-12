
"use client";

import { Suspense } from 'react';
import BookingReport from '@/components/dashboard/booking-report';

function BookingReportPage() {
  return (
    <div>
      <BookingReport />
    </div>
  );
}

export default function BookingReportPageWrapper() {
  return (
    <Suspense fallback={<div>Loading report...</div>}>
      <BookingReportPage />
    </Suspense>
  );
}
