import  { useState, useCallback } from 'react';
import { DataPagination } from '@/shared/ui/navigation/data-pagination';

export function usePagination(defaultLimit: number = 10) {
    const [page, setPage] = useState(1);
    const [limit, setLimit] = useState(defaultLimit);

    const resetPage = useCallback(() => setPage(1), []);

    const renderPagination = useCallback(({ 
        totalPages, 
        totalItems,
        className
    }: { 
        totalPages: number; 
        totalItems?: number;
        className?: string;
    }) => {
        if (totalPages <= 1 && (!totalItems || totalItems === 0)) return null;
        
        return (
            <DataPagination
                currentPage={page}
                totalPages={totalPages}
                itemsPerPage={limit}
                totalItems={totalItems}
                onPageChange={setPage}
                onLimitChange={(newLimit) => {
                    setLimit(newLimit);
                    setPage(1);
                }}
                className={className}
            />
        );
    }, [page, limit]);

    return {
        page,
        setPage,
        limit,
        setLimit,
        resetPage,
        renderPagination,
    };
}
