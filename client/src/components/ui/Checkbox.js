import React, { useEffect, useRef } from 'react';

// Utility function to combine class names
const cn = (...classes) => {
  return classes.filter(Boolean).join(' ');
};

const Checkbox = React.forwardRef(({ className, onCheckedChange, onChange, checked, ...props }, ref) => {
  const inputRef = useRef(null);

  // Handle indeterminate state
  const isIndeterminate = checked === "indeterminate";
  const isChecked = checked === true;

  // Set indeterminate state on the actual DOM element
  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.indeterminate = isIndeterminate;
    }
  }, [isIndeterminate]);

  // Support both onCheckedChange (Radix UI style) and onChange (HTML style)
  const handleChange = (e) => {
    e.stopPropagation(); // Prevent event bubbling
    const isCheckedValue = e.target.checked;
    
    if (onCheckedChange) {
      onCheckedChange(isCheckedValue);
    }
    if (onChange) {
      onChange(e);
    }
  };

  // Handle click to ensure proper state handling
  const handleClick = (e) => {
    e.stopPropagation();
  };

  return (
    <input
      type="checkbox"
      className={cn(
        "peer h-4 w-4 shrink-0 rounded-sm border border-primary focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 data-[state=checked]:bg-primary data-[state=checked]:text-primary-foreground",
        className
      )}
      ref={(el) => {
        inputRef.current = el;
        if (typeof ref === 'function') {
          ref(el);
        } else if (ref) {
          ref.current = el;
        }
      }}
      checked={isChecked}
      onChange={handleChange}
      onClick={handleClick}
      {...props}
    />
  );
});

Checkbox.displayName = "Checkbox";

export { Checkbox };
