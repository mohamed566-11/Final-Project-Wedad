import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { ReactNode } from 'react';

// Create a client with optimized default options
export const queryClient = new QueryClient({
    defaultOptions: {
        queries: {
            // Cache data for 5 minutes by default
            staleTime: 5 * 60 * 1000,
            // Keep unused data in cache for 30 minutes
            gcTime: 30 * 60 * 1000,
            // Retry failed requests 2 times
            retry: 2,
            // Don't refetch on window focus in production
            refetchOnWindowFocus: import.meta.env.DEV,
            // Refetch on reconnect
            refetchOnReconnect: true,
            // Don't refetch on mount if data is fresh
            refetchOnMount: false,
        },
        mutations: {
            // Retry mutations once
            retry: 1,
        },
    },
});

interface QueryProviderProps {
    children: ReactNode;
}

export function QueryProvider({ children }: QueryProviderProps) {
    return (
        <QueryClientProvider client={queryClient}>
            {children}
            {/* Only show devtools in development */}
            {import.meta.env.DEV && (
                <ReactQueryDevtools
                    initialIsOpen={false}
                    buttonPosition="bottom-left"
                />
            )}
        </QueryClientProvider>
    );
}

// Export cache invalidation helpers
export const invalidateQueries = {
    // Dashboard
    dashboard: () => queryClient.invalidateQueries({ queryKey: ['admin', 'dashboard'] }),

    // Users
    patients: () => queryClient.invalidateQueries({ queryKey: ['admin', 'patients'] }),
    doctors: () => queryClient.invalidateQueries({ queryKey: ['admin', 'doctors'] }),

    // Content
    articles: () => queryClient.invalidateQueries({ queryKey: ['admin', 'articles'] }),

    // Consultations
    consultations: () => queryClient.invalidateQueries({ queryKey: ['admin', 'consultations'] }),

    // Financial
    financial: () => queryClient.invalidateQueries({ queryKey: ['admin', 'financial'] }),

    // All admin queries
    allAdmin: () => queryClient.invalidateQueries({ queryKey: ['admin'] }),

    // All queries
    all: () => queryClient.invalidateQueries(),
};
