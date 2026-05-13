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
    const normalize = (raw: string) =>
        raw.replace(/[^A-Za-z0-9]/g, '').replace(/^KZ/i, '').slice(0, 18).toUpperCase();

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const clean = normalize(e.target.value);
        onChange({ target: { name: props.name, value: clean } } as React.ChangeEvent<HTMLInputElement>);
    };

    const displayValue = value ? `KZ${value}` : '';

    return (
        <input
            {...props}
            type="text"
            value={displayValue}
            onChange={handleChange}
            placeholder="KZ__ ____ ____ ____ ____"
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
