export interface IDbflpass {
  user_id: string;
  uid?: string;
  full_name?: string;
  tingkat?: string;
  status?: string;
}

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
}
