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
                                {/* Stop propagation so clicking the button doesn't trigger row navigation */}
                                <Button className='add-alert' onClick={(e) => e.stopPropagation()}>Add Alert</Button>
                            </TableCell>
                            <TableCell>
                                <WatchlistButton
                                    symbol={item.symbol}
                                    company={item.company}
                                    isInWatchlist={true} // Always true here since it's the watchlist table
                                    showTrashIcon={true}
                                    type='icon'
                                />
                            </TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
        </>
    );
}