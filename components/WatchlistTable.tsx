'use client';

import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table'; // Assumed Shadcn Table components
import { WATCHLIST_TABLE_HEADER } from '@/lib/constants';
import { Button } from './ui/button';
import WatchlistButton from './WatchlistButton';
import { StockAlertButton } from './StockAlertButton';
import { useRouter } from 'next/navigation';
import { cn, getChangeColorClass } from '@/lib/utils'; // Assumed utils

interface WatchlistItemData {
    company: string;
    symbol: string;
    currentPrice: number;
    priceFormatted: string;
    changeFormatted: string;
    changePercent: number;
    marketCap: string;
    peRatio: string;
}

interface WatchlistTableProps {
    watchlist: WatchlistItemData[];
}

export function WatchlistTable({ watchlist }: WatchlistTableProps) {
    const router = useRouter();

    // Function to handle optimistic UI update on removal (optional, as revalidatePath handles it)
    // For simplicity, rely on the server action revalidatePath('/watchlist') to refresh.
    // The WatchlistButton component handles the server action call.

    return (
        <>
            <Table className='scrollbar-hide-default watchlist-table'>
                <TableHeader>
                    <TableRow className='table-header-row'>
                        {WATCHLIST_TABLE_HEADER.map((label) => (
                            <TableHead className='table-header' key={label}>
                                {label}
                            </TableHead>
                        ))}
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {watchlist.map((item, index) => (
                        <TableRow
                            key={item.symbol + index}
                            className='table-row cursor-pointer'
                            onClick={() =>
                                router.push(`/stocks/${encodeURIComponent(item.symbol)}`)
                            }
                        >
                            <TableCell className='pl-4 table-cell'>{item.company}</TableCell>
                            <TableCell className='table-cell'>{item.symbol}</TableCell>
                            <TableCell className='table-cell'>
                                {item.priceFormatted || '—'}
                            </TableCell>
                            <TableCell
                                className={cn(
                                    'table-cell',
                                    getChangeColorClass(item.changePercent)
                                )}
                            >
                                {item.changeFormatted || '—'}
                            </TableCell>
                            <TableCell className='table-cell'>
                                {item.marketCap || '—'}
                            </TableCell>
                            <TableCell>
                                <div className="flex items-center gap-3">
                                    <div onClick={(e) => e.stopPropagation()}>
                                        <StockAlertButton symbol={item.symbol} currentPrice={item.currentPrice} iconOnly={true} />
                                    </div>
                                    <div onClick={(e) => e.stopPropagation()}>
                                        <WatchlistButton
                                            symbol={item.symbol}
                                            company={item.company}
                                            isInWatchlist={true}
                                            showTrashIcon={true}
                                            type='icon'
                                        />
                                    </div>
                                </div>
                            </TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
        </>
    );
}