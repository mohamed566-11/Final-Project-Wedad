# Admin Payouts & Prescriptions Summary

1.  **Admin Payouts**
    *   **Frontend**: Implemented "Payout Requests" tab in `FinancialsPage.tsx` with filtering and processing actions.
    *   **Backend**: `PayoutController` handles approval/rejection logic. Rejecting a request automatically returns the amount to the doctor's available balance.
    *   **Hooks**: Added `usePayoutRequests` and `useProcessPayoutRequest` to `useAdminQueries.ts`.

2.  **Prescription Management**
    *   **Patient Details**: Added a prescription card to `ConsultationDetails.tsx` displaying medications and diagnosis.
    *   **Printable PDF**: Created `PrescriptionPage.tsx` at `/patient/consultations/:id/prescription`. This page is optimized for printing via `window.print()`, serving as a PDF export.
    *   **Routing**: Added new route to `App.tsx`.
    *   **API**: Updated `Patient\ConsultationResource.php` and `consultationService.ts` to include prescription data.

3.  **Notifications**
    *   **Payout Status**: Created `PayoutStatusNotification` sent when a request is processed or rejected.
    *   **Consultation Completed**: Created `ConsultationCompletedNotification` sent when a doctor completes a consultation, linking to the prescription.

Everything is integrated and the code is structured cleanly.
