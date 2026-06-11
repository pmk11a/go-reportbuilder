"use client"

import * as React from "react"
import { cva, type VariantProps } from 'class-variance-authority';
import { Eye, EyeOff } from "lucide-react"
import { cn } from "@/shared/utils/cn"
import { Button } from "../overlay/button"
import { Input } from "./input"

const passwordInputVariants = cva('pr-10');

export interface PasswordInputProps
  extends React.InputHTMLAttributes<HTMLInputElement>,
    VariantProps<typeof passwordInputVariants> {}

const PasswordInput = React.forwardRef<HTMLInputElement, PasswordInputProps>(
  ({ className, ...props }, ref) => {
    const [showPassword, setShowPassword] = React.useState(false)

    return (
      <div className="relative">
        <Input
          type={showPassword ? "text" : "password"}
          className={cn(passwordInputVariants(), className)}
          ref={ref}
          {...props}
        />
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="absolute right-0 top-0 h-full px-3 py-2 "
          onClick={() => setShowPassword(!showPassword)}
          disabled={props.disabled}
        >
          {showPassword ? (
            <EyeOff className="h-4 w-4" />
          ) : (
            <Eye className="h-4 w-4" />
          )}
          <span className="sr-only">
            {showPassword ? "Hide password" : "Show password"}
          </span>
        </Button>
      </div>
    )
  }
)
PasswordInput.displayName = "PasswordInput"

export { PasswordInput }
