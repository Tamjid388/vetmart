export {
  CustomerTable,
  CustomerCard,
  CustomerCardList,
  CustomerForm,
  CustomerFilters,
  CustomerDetails,
  CustomerSearchSelect,
} from './components/index.ts';
export {
  useCustomers,
  useCustomer,
  useCustomerMutations,
} from './hooks/index.ts';
export { customerSchema, getCustomerSubmitErrorMessage, isPhoneConflictError } from './schemas/index.ts';
export type {
  CreateCustomerPayload,
  Customer,
  CustomerCategory,
  CustomerFormValues,
  CustomerListFilters,
  CustomerListMeta,
  CustomerListQueryParams,
  CustomerResponse,
  UpdateCustomerPayload,
} from './types/index.ts';
export {
  CustomersPage,
  CreateCustomerPage,
  ViewCustomerPage,
  EditCustomerPage,
} from './pages/index.ts';
