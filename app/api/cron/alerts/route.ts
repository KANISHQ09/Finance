import { NextResponse } from 'next/server';
import { checkStockAlertsTask } from '@/lib/cron/tasks';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const secret = searchParams.get('secret') || req.headers.get('Authorization');

    // Secure the cron job endpoint
    if (secret !== `Bearer ${process.env.CRON_SECRET}` && secret !== process.env.CRON_SECRET) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const result = await checkStockAlertsTask();
    return NextResponse.json(result);
  } catch (error) {
    console.error('Alerts cron failed:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
