// Represents a single row from legacy DBFLPASS table
export interface IDbflpass {
  user_id: string
  uid?: string
  full_name?: string
  tingkat?: string
  status?: string
}

// Represents an internal website user (JWT-authenticated)
export interface IUser {
  id: number
  email: string
  name: string
  full_name: string
  username: string
  user_id: string
  role: 'admin' | 'karyawan' | 'user'
  dbflpass?: IDbflpass
  created_at: string
  updated_at: string
  is_active?: boolean
  status?: string
}

// Represents a single legacy dbmenu / dbmenureport permission row
// Supports both simple access model and granular permissions
export interface IUserPermission {
  // Menu hierarchy & metadata
  kodemenu: string
  keterangan: string
  l0: number
  l1: number
  l2: number
  l3: number
  icon: string
  routename: string | null

  // Legacy simple model (for backward compatibility)
  checked: number  // 0 = hidden, 1 = visible
  aktif: number    // 0 = disabled, 1 = enabled
  access: number   // 0 = no access, 1 = read, 2 = write, 3 = full

  // Granular permissions from Laravel DbFlmenu
  has_access?: number   // Read permission
  is_create?: number    // Create/Add permission
  is_update?: number    // Update/Edit permission
  is_delete?: number    // Delete permission
  is_print?: number     // Print/Cetak permission
  is_export?: number    // Export permission
  is_approve_1?: number // Approval level 1
  is_approve_2?: number // Approval level 2
  is_approve_3?: number // Approval level 3
  is_approve_4?: number // Approval level 4
  is_approve_5?: number // Approval level 5
  is_canceled?: number  // Cancellation permission
}

// Represents a single COA (Chart of Accounts) access entry from DBAKSESPERKIRAAN
export interface IUserCoaAccess {
  perkiraan: string   // COA code
  keterangan: string  // Description
  checked: number     // 0 = no access, 1 = has access
}

// The full permissions response payload (menu + report + coa tabs)
export interface IUserPermissionsData {
  menu: IUserPermission[]
  report: IUserPermission[]
  coa: IUserCoaAccess[]
}

// Payload for creating a new user
export interface ICreateUserPayload {
  username: string
  password: string
  full_name: string
  role: 'admin' | 'karyawan'
}

// Payload for updating an existing user
export interface IUpdateUserPayload {
  full_name: string
  role: 'admin' | 'karyawan'
  password?: string
  status?: string
}

// Query parameters for listing users
export interface IUserListParams {
  page?: number
  limit?: number
  search?: string
  status?: string
}
