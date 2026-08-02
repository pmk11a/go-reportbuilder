"use client";

import * as React from "react";
import type {  FieldPath, FieldValues, UseFormReturn } from "react-hook-form";
import { Eye, EyeOff } from "lucide-react";

import {
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
  FormDescription,
} from "./form";
import { Input } from "./input";
import { Textarea } from "./textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./select";
import { cn } from "@/shared/utils/cn";

/**
 * FormInput - Wrapper component for text, email, number, date inputs
 * Handles FormField → FormItem → FormControl → Input → FormMessage automatically
 */
interface FormInputProps<
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>
> {
  control: UseFormReturn<TFieldValues>["control"];
  name: TName;
  label?: string;
  placeholder?: string;
  type?: "text" | "email" | "number" | "date" | "tel" | "url";
  required?: boolean;
  disabled?: boolean;
  description?: string;
  className?: string;
  variant?: "rounded" | "default";
}

export const FormInput = React.forwardRef<HTMLInputElement, FormInputProps>(
  (
    {
      control,
      name,
      label,
      placeholder,
      type = "text",
      required,
      disabled,
      description,
      className,
      variant = "default",
    },
    ref
  ) => {
    return (
      <FormField
        control={control}
        name={name}
        render={({ field, fieldState: { error } }) => (
          <FormItem>
            {label && (
              <FormLabel className="block text-sm font-medium">
                {label}
                {required && <span className="text-red-500 ml-1">*</span>}
              </FormLabel>
            )}
            <FormControl>
              <Input
                type={type}
                placeholder={placeholder}
                disabled={disabled}
                {...field}
                ref={(e) => {
                  field.ref(e);
                  if (typeof ref === "function") ref(e);
                  else if (ref) ref.current = e;
                }}
                className={cn(
                  variant === "rounded" && "rounded-lg",
                  className
                )}
              />
            </FormControl>
            {description && !error && <FormDescription>{description}</FormDescription>}
            <FormMessage />
          </FormItem>
        )}
      />
    );
  }
);
FormInput.displayName = "FormInput";

/**
 * FormPasswordInput - Wrapper for password fields with show/hide toggle
 * Includes built-in eye icon button
 */
interface FormPasswordInputProps<
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>
> {
  control: UseFormReturn<TFieldValues>["control"];
  name: TName;
  label?: string;
  placeholder?: string;
  required?: boolean;
  disabled?: boolean;
  description?: string;
  className?: string;
  variant?: "rounded" | "default";
}

export const FormPasswordInput = React.forwardRef<
  HTMLInputElement,
  FormPasswordInputProps
>(
  (
    {
      control,
      name,
      label,
      placeholder,
      required,
      disabled,
      description,
      className,
      variant = "default",
    },
    ref
  ) => {
    const [showPassword, setShowPassword] = React.useState(false);

    return (
      <FormField
        control={control}
        name={name}
        render={({ field, fieldState: { error } }) => (
          <FormItem>
            {label && (
              <FormLabel className="block text-sm font-medium">
                {label}
                {required && <span className="text-red-500 ml-1">*</span>}
              </FormLabel>
            )}
            <FormControl>
              <div className="relative">
                <Input
                  type={showPassword ? "text" : "password"}
                  placeholder={placeholder}
                  disabled={disabled}
                  {...field}
                  ref={(e) => {
                    field.ref(e);
                    if (typeof ref === "function") ref(e);
                    else if (ref) ref.current = e;
                  }}
                  className={cn(
                    "pr-10",
                    variant === "rounded" && "rounded-lg",
                    className
                  )}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  disabled={disabled}
                  tabIndex={-1}
                >
                  {showPassword ? (
                    <EyeOff className="w-5 h-5" />
                  ) : (
                    <Eye className="w-5 h-5" />
                  )}
                </button>
              </div>
            </FormControl>
            {description && !error && <FormDescription>{description}</FormDescription>}
            <FormMessage />
          </FormItem>
        )}
      />
    );
  }
);
FormPasswordInput.displayName = "FormPasswordInput";

/**
 * FormCheckbox - Wrapper for checkbox fields
 * Label positioned inline with checkbox
 */
interface FormCheckboxProps<
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>
> {
  control: UseFormReturn<TFieldValues>["control"];
  name: TName;
  label?: string;
  description?: string;
  disabled?: boolean;
  className?: string;
}

export const FormCheckbox = React.forwardRef<HTMLInputElement, FormCheckboxProps>(
  ({ control, name, label, description, disabled, className }, ref) => {
    return (
      <FormField
        control={control}
        name={name}
        render={({ field, fieldState: { error } }) => (
          <FormItem>
            <div className="flex items-center space-x-2">
              <FormControl>
                <input
                  ref={ref}
                  type="checkbox"
                  checked={field.value}
                  onChange={field.onChange}
                  disabled={disabled}
                  className={cn(
                    "w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 cursor-pointer",
                    className
                  )}
                />
              </FormControl>
              {label && (
                <FormLabel className="text-sm cursor-pointer">{label}</FormLabel>
              )}
            </div>
            {description && !error && <FormDescription>{description}</FormDescription>}
            <FormMessage />
          </FormItem>
        )}
      />
    );
  }
);
FormCheckbox.displayName = "FormCheckbox";

/**
 * FormSelect - Wrapper for select dropdowns
 * Uses Radix UI Select component
 */
interface SelectOption {
  value: string;
  label: string;
}

interface FormSelectProps<
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>
> {
  control: UseFormReturn<TFieldValues>["control"];
  name: TName;
  label?: string;
  placeholder?: string;
  options: SelectOption[];
  required?: boolean;
  disabled?: boolean;
  description?: string;
  className?: string;
}

export const FormSelect = React.forwardRef<HTMLDivElement, FormSelectProps>(
  (
    {
      control,
      name,
      label,
      placeholder = "Select an option",
      options,
      required,
      disabled,
      description,
      className,
    },
    ref
  ) => {
    return (
      <FormField
        control={control}
        name={name}
        render={({ field, fieldState: { error } }) => (
          <FormItem ref={ref}>
            {label && (
              <FormLabel className="block text-sm font-medium">
                {label}
                {required && <span className="text-red-500 ml-1">*</span>}
              </FormLabel>
            )}
            <FormControl>
              <Select
                value={field.value || ""}
                onValueChange={field.onChange}
                disabled={disabled}
              >
                <SelectTrigger className={className}>
                  <SelectValue placeholder={placeholder} />
                </SelectTrigger>
                <SelectContent>
                  {options.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </FormControl>
            {description && !error && <FormDescription>{description}</FormDescription>}
            <FormMessage />
          </FormItem>
        )}
      />
    );
  }
);
FormSelect.displayName = "FormSelect";

/**
 * FormTextarea - Wrapper for textarea fields
 */
interface FormTextareaProps<
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>
> {
  control: UseFormReturn<TFieldValues>["control"];
  name: TName;
  label?: string;
  placeholder?: string;
  required?: boolean;
  disabled?: boolean;
  rows?: number;
  description?: string;
  className?: string;
}

export const FormTextarea = React.forwardRef<HTMLTextAreaElement, FormTextareaProps>(
  (
    {
      control,
      name,
      label,
      placeholder,
      required,
      disabled,
      rows = 4,
      description,
      className,
    },
    ref
  ) => {
    return (
      <FormField
        control={control}
        name={name}
        render={({ field, fieldState: { error } }) => (
          <FormItem>
            {label && (
              <FormLabel className="block text-sm font-medium">
                {label}
                {required && <span className="text-red-500 ml-1">*</span>}
              </FormLabel>
            )}
            <FormControl>
              <Textarea
                placeholder={placeholder}
                disabled={disabled}
                rows={rows}
                {...field}
                ref={(e) => {
                  field.ref(e);
                  if (typeof ref === "function") ref(e);
                  else if (ref) ref.current = e;
                }}
                className={className}
              />
            </FormControl>
            {description && !error && <FormDescription>{description}</FormDescription>}
            <FormMessage />
          </FormItem>
        )}
      />
    );
  }
);
FormTextarea.displayName = "FormTextarea";
