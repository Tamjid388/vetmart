import { apiGet } from '../../../lib/axios/axios.ts';
import type { DashboardData } from '../types/index.ts';

const BASE = '/dashboard';

export async function getDashboard(): Promise<DashboardData> {
  return apiGet<DashboardData>(BASE);
}
