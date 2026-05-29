import { IUser } from './user'

export interface IAuthState {
  user: IUser | null
  isLoading: boolean
  error: string | null
}

export interface ILoginInput {
  username: string
  password: string
}

export interface IRegisterInput {
  name: string
  email: string
  password: string
  confirmPassword?: string
}

export interface IAuthResponse {
  token: string
  user: IUser
}