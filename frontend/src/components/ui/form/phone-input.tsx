"use client"

import * as React from "react"
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from "@/utils/cn"
import { Input } from "./input"

const phoneInputVariants = cva('');

export interface PhoneInputProps
  extends React.InputHTMLAttributes<HTMLInputElement>,
    VariantProps<typeof phoneInputVariants> {}

const PhoneInput = React.forwardRef<HTMLInputElement, PhoneInputProps>(
  ({ className, value, onChange, ...props }, ref) => {
    const [displayValue, setDisplayValue] = React.useState("")
    
    // Format phone number as user types
    const formatPhoneNumber = (input: string) => {
      // Remove all non-digits
      const digits = input.replace(/\D/g, '')
      
      // Format based on length
      if (digits.length === 0) return ""
      if (digits.length <= 3) return `(${digits}`
      if (digits.length <= 6) return `(${digits.slice(0, 3)}) ${digits.slice(3)}`
      return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6, 10)}`
    }
    
    // Generate placeholder based on current value
    const generatePlaceholder = (currentValue: string) => {
      const digits = currentValue.replace(/\D/g, '')
      const placeholder = "(xxx) xxx-xxxx"
      
      if (digits.length === 0) return placeholder
      
      let result = ""
      let digitIndex = 0
      
      for (let i = 0; i < placeholder.length; i++) {
        const char = placeholder[i]
        if (char === 'x') {
          if (digitIndex < digits.length) {
            result += digits[digitIndex]
            digitIndex++
          } else {
            result += 'x'
          }
        } else {
          result += char
        }
      }
      
      return result
    }
    
    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const formatted = formatPhoneNumber(e.target.value)
      setDisplayValue(formatted)
      
      // Call the original onChange with the raw digits
      const digits = e.target.value.replace(/\D/g, '')
      if (onChange) {
        const syntheticEvent = {
          ...e,
          target: {
            ...e.target,
            value: digits
          }
        }
        onChange(syntheticEvent as React.ChangeEvent<HTMLInputElement>)
      }
    }
    
    // Update display value when value prop changes
    React.useEffect(() => {
      if (value !== undefined) {
        setDisplayValue(formatPhoneNumber(String(value)))
      }
    }, [value])
    
    const placeholder = generatePlaceholder(displayValue)
    
    return (
      <Input
        className={cn(className)}
        ref={ref}
        value={displayValue}
        onChange={handleChange}
        placeholder={placeholder}
        maxLength={14}
        {...props}
      />
    )
  }
)
PhoneInput.displayName = "PhoneInput"

export { PhoneInput }
