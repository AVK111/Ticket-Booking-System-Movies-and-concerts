import React from 'react'
import { forwardRef, useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';

const Input = forwardRef(({ label, error, type = 'text', className = '', ...props }, ref) => {
    const [show, setShow] = useState(false);
    const isPassword = type === 'password';
    const resolvedType = isPassword ? (show ? 'text' : 'password') : type;

    return (
        <div className="mb-4">
            {label && <label className="block text-xs font-medium text-text-dim mb-1.5">{label}</label>}
            <div className="relative">
                <input
                    ref={ref}
                    type={resolvedType}
                    className={`w-full bg-bg-secondary border ${error ? 'border-error/60' : 'border-border'
                        } rounded-xl px-3.5 py-2.5 text-sm text-text placeholder:text-text-faint outline-none transition-colors focus:border-accent/60 ${className}`}
                    {...props}
                />
                {isPassword && (
                    <button
                        type="button"
                        tabIndex={-1}
                        onClick={() => setShow((s) => !s)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-text-faint hover:text-text-dim"
                    >
                        {show ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                )}
            </div>
            {error && <p className="text-xs text-error mt-1.5">{error}</p>}
        </div>
    );
});

Input.displayName = 'Input';

export default Input;