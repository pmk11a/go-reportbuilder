import { IUser } from '@/domains/users/types/user'
import { z } from 'zod'

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

export const loginSchema = z.object({
  username: z.string().min(1, 'Username is required'),
  password: z.string().min(1, 'Password is required'),
})

export const registerSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  email: z.string().email('Invalid email'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  confirmPassword: z.string().optional(),
}).refine((data) => data.password === data.confirmPassword, {
  message: 'Passwords do not match',
  path: ['confirmPassword'],
})