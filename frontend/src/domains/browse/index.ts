/**
 * Public surface of the browse domain.
 *
 * Consumers should import from this barrel rather than reaching into
 * specific files. This keeps the API stable as the implementation evolves.
 */

// Types
export type {
  IBrowseType,
  IBrowseRow,
  IBrowseSearchParams,
  IBrowseValidateRequest,
  IBrowseValidateBatchRequest,
  IBrowseValidateBatchResponse,
  IBrowseOption,
} from './types/browse'
export { pickField } from './types/browse'

// Service
export { browseService } from './services/browseService'

// Hooks
export {
  browseKeys,
  useBrowseTypes,
  useBrowseAll,
  useBrowseValidate,
  useInvalidateBrowse,
  fetchBrowseAll,
} from './hooks/useBrowse'
export { useBrowseSearch } from './hooks/useBrowseSearch'
export { useBrowseDisplay } from './hooks/useBrowseDisplay'

// Components
export { GenericBrowsePicker } from './components/browse/GenericBrowsePicker'
export { PerkiraanSelect } from './components/browse/PerkiraanSelect'
export { CustomerPicker } from './components/browse/CustomerPicker'
export { KasBankSelect } from './components/browse/KasBankSelect'