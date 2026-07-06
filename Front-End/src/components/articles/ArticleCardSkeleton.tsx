import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

interface ArticleCardSkeletonProps {
    variant?: 'grid' | 'list' | 'featured';
}

const ArticleCardSkeleton = ({ variant = 'grid' }: ArticleCardSkeletonProps) => {
    const isFeatured = variant === 'featured';
    const isList = variant === 'list';

    return (
        <Card className={`overflow-hidden border-none shadow-sm rounded-[32px] ${isFeatured ? 'col-span-full' : ''} ${isList ? 'flex flex-row' : ''}`}>
            {/* Image Skeleton */}
            <div className={`${isList ? 'w-48 flex-shrink-0' : ''} ${isFeatured ? 'h-full grid grid-cols-2' : ''}`}>
                <Skeleton className={`w-full bg-slate-100 ${isFeatured ? 'h-80 col-span-1' : isList ? 'h-full' : 'h-52'}`} />
                {isFeatured && <div className="p-8 space-y-4">
                    <Skeleton className="h-4 w-32 rounded-full" />
                    <Skeleton className="h-10 w-full rounded-2xl" />
                    <Skeleton className="h-10 w-3/4 rounded-2xl" />
                    <Skeleton className="h-16 w-full rounded-2xl" />
                </div>}
            </div>

            {!isFeatured && (
                <CardContent className={`p-6 ${isList ? 'flex-grow' : ''} bg-white`}>
                    {/* Meta Info */}
                    <div className="flex gap-4 mb-4">
                        <Skeleton className="h-3 w-16 rounded-full" />
                        <Skeleton className="h-3 w-12 rounded-full" />
                    </div>

                    {/* Title */}
                    <Skeleton className="h-7 w-full mb-3 rounded-xl" />
                    <Skeleton className="h-7 w-2/3 mb-6 rounded-xl" />

                    {/* Excerpt */}
                    <div className="space-y-2 mb-6">
                        <Skeleton className="h-3 w-full rounded-full" />
                        <Skeleton className="h-3 w-3/4 rounded-full" />
                    </div>

                    {/* Doctor Info */}
                    <div className="flex items-center gap-3 pt-6 border-t border-slate-50">
                        <Skeleton className="w-10 h-10 rounded-xl" />
                        <div className="flex-grow space-y-2">
                            <Skeleton className="h-3 w-24 rounded-full" />
                            <Skeleton className="h-2 w-16 rounded-full" />
                        </div>
                    </div>
                </CardContent>
            )}
        </Card>
    );
};

export default ArticleCardSkeleton;
