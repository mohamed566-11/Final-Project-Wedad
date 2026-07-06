# Admin Pages Refactoring Summary

This document summarizes the refactoring work done to migrate Admin pages to use React Query hooks.

## Overview

The goal was to replace manual state management (`useState`, `useEffect`) and direct API calls with **React Query** hooks (`useQuery`, `useMutation`) to improve performance, caching, and state management consistency.

## Completed Pages

The following pages have been fully refactored:

1.  **`ArticlesManagement.tsx`**
    *   Replaced `getAdminArticles` with `useArticles`.
    *   Implemented mutations: `useApproveArticle`, `useRejectArticle`, `useArchiveArticle`.
    *   Optimistic updates and query invalidation added.

2.  **`MessagesPage.tsx`**
    *   Replaced `getContactMessages` with `useContactMessages`.
    *   Implemented mutations: `useMarkMessageAsRead`, `useMarkMessageAsUnread`, `useMarkAllMessagesAsRead`, `useDeleteContactMessage`.

3.  **`FinancialsPage.tsx`**
    *   Replaced `getFinancialOverview`, `getTransactions`, `getDoctorsPayouts` with corresponding hooks.
    *   Implemented `useProcessPayout` mutation.

4.  **`SettingsPage.tsx`**
    *   Migrated Site Settings, Roles, and System Settings to React Query.
    *   Added hooks: `useSiteSettings`, `useUpdateSiteSettings`, `useSettingsRoles`, `useCreateRole`, `useUpdateRole`, `useDeleteRole`, `useSystemSettings`.

## `useAdminQueries.ts` Updates

The `src/hooks/useAdminQueries.ts` file acts as the central hub for all admin-related hooks. It has been updated to include:

*   **Articles Hooks**: `useArticles`, `useArticle`, `useApproveArticle`, `useRejectArticle`, `useArchiveArticle`, `useDeleteArticle` (if applicable).
*   **Contact Messages Hooks**: `useContactMessages`, `useContactMessage`, `useMarkMessageAsRead`, etc.
*   **Settings Hooks**: `useSiteSettings`, `useUpdateSiteSettings`, `useSettingsRoles`, `useCreateRole`, `useUpdateRole`, `useDeleteRole`, `useSystemSettings`.
*   **Financial Hooks**: `useFinancialOverview`, `useTransactions`, `useDoctorsPayouts`, `useProcessPayout`.

## `adminService.ts` Updates

Verified that all necessary service functions exist in `src/services/adminService.ts` to support the new hooks.

## Build Status

*   **TypeScript Check**: Passed (`tsc --noEmit` exited with code 0).
*   **Vite Build**: Encountered an issue with external dependency resolution (`react-is` required by `recharts`), which was addressed by installing `react-is`.

## Next Steps

*   Monitor the application for any runtime issues.
*   Verify that caching behavior (stale time, invalidation) meets user requirements.
