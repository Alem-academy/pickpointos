import React from 'react';
import { PatternFormat, NumericFormat } from 'react-number-format';
import { cn } from '@/lib/utils';

interface MaskedInputProps {
    name: string;
    value: string;
    onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
    placeholder?: string;
    className?: string;
    required?: boolean;
    disabled?: boolean;
    error?: boolean;
}

export function IINInput({ value, onChange, className, error, ...props }: MaskedInputProps) {
    return (
        <PatternFormat
            {...props}
            format="### ### ### ###"
            mask="_"
            value={value}
            onValueChange={(vals) => {
                onChange({ target: { name: props.name, value: vals.value } } as React.ChangeEvent<HTMLInputElement>);
            }}
            className={cn(
                "w-full rounded-lg border bg-background px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50",
                error && "border-red-500 focus:ring-red-500",
                className
            )}
        />
    );
}

export function PhoneInput({ value, onChange, className, error, ...props }: MaskedInputProps) {
    return (
        <PatternFormat
            {...props}
            format="+7 (###) ###-##-##"
            mask="_"
            value={value}
            onValueChange={(vals) => {
                onChange({ target: { name: props.name, value: vals.value } } as React.ChangeEvent<HTMLInputElement>);
            }}
            className={cn(
                "w-full rounded-lg border bg-background px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50",
                error && "border-red-500 focus:ring-red-500",
                className
            )}
        />
    );
}

export function IBANInput({ value, onChange, className, error, ...props }: MaskedInputProps) {
    const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
        e.preventDefault();
        const pasted = e.clipboardData.getData('text');
        // Extract digits only, strip spaces/KZ prefix if pasted
        const digits = pasted.replace(/\D/g, '').replace(/^KZ/i, '').slice(0, 18);
        onChange({ target: { name: props.name, value: digits } } as React.ChangeEvent<HTMLInputElement>);
    };
    return (
        <PatternFormat
            {...props}
            format="KZ## #### #### #### ####"
            mask="_"
            value={value}
            onValueChange={(vals) => {
                onChange({ target: { name: props.name, value: vals.value } } as React.ChangeEvent<HTMLInputElement>);
            }}
            onPaste={handlePaste}
            className={cn(
                "w-full rounded-lg border bg-background px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 font-mono",
                error && "border-red-500 focus:ring-red-500",
                className
            )}
        />
    );
}

export function IdCardInput({ value, onChange, className, error, ...props }: MaskedInputProps) {
    return (
        <PatternFormat
            {...props}
            format="#########"
            mask="_"
            value={value}
            onValueChange={(vals) => {
                onChange({ target: { name: props.name, value: vals.value } } as React.ChangeEvent<HTMLInputElement>);
            }}
            className={cn(
                "w-full rounded-lg border bg-background px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50",
                error && "border-red-500 focus:ring-red-500",
                className
            )}
        />
    );
}

interface NumberInputProps {
    name: string;
    value: string;
    onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
    placeholder?: string;
    className?: string;
    required?: boolean;
    disabled?: boolean;
    error?: boolean;
    suffix?: string;
    prefix?: string;
    min?: number;
}

export function NumberInput({ value, onChange, className, error, suffix, prefix, ...props }: NumberInputProps) {
    return (
        <NumericFormat
            {...props}
            thousandSeparator=" "
            decimalSeparator=","
            suffix={suffix}
            prefix={prefix}
            value={value}
            onValueChange={(vals) => {
                onChange({ target: { name: props.name, value: vals.value } } as React.ChangeEvent<HTMLInputElement>);
            }}
            className={cn(
                "w-full rounded-lg border bg-background px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50",
                error && "border-red-500 focus:ring-red-500",
                className
            )}
        />
    );
}
