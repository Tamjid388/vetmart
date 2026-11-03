export type LedgerFiltersValue = {
  name?: string;
  customerId?: string;
  area?: string;
  dateFrom?: string;
  dateTo?: string;
};

export type VendorLedgerFiltersValue = {
  supplierId?: string;
  dateFrom?: string;
  dateTo?: string;
};

export const LEDGER_PAGE_SIZE = 10;
