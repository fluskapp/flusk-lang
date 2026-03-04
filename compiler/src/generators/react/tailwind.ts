/**
 * Tailwind CSS utility mappings — semantic values to Tailwind class names.
 * Ported from flusk-lang-compiler/ReactUIGenerator.ts
 */

export const mapColorToTailwind = (color: string, prefix = 'bg'): string => {
  if (color.includes('.')) {
    const [colorName, shade] = color.split('.');
    const colorMap: Record<string, string> = {
      primary: 'blue',
      secondary: 'gray',
      success: 'green',
      warning: 'yellow',
      danger: 'red',
      info: 'blue',
    };
    return `${prefix}-${colorMap[colorName] ?? colorName}-${shade}`;
  }
  return `${prefix}-${color}`;
};

export const mapBorderRadiusToTailwind = (radius: string): string => {
  const mapping: Record<string, string> = {
    sm: 'rounded-sm', md: 'rounded-md', lg: 'rounded-lg',
    xl: 'rounded-xl', full: 'rounded-full',
  };
  return mapping[radius] ?? 'rounded';
};

export const mapShadowToTailwind = (shadow: string): string => {
  const mapping: Record<string, string> = {
    xs: 'shadow-xs', sm: 'shadow-sm', md: 'shadow-md', lg: 'shadow-lg', xl: 'shadow-xl',
  };
  return mapping[shadow] ?? 'shadow';
};

export const mapGapToTailwind = (gap: string): string => {
  const mapping: Record<string, string> = {
    xs: 'gap-1', sm: 'gap-2', md: 'gap-4', lg: 'gap-6', xl: 'gap-8',
  };
  return mapping[gap] ?? 'gap-4';
};

export const mapSpaceYToTailwind = (gap: string): string => {
  const mapping: Record<string, string> = {
    xs: 'space-y-1', sm: 'space-y-2', md: 'space-y-4', lg: 'space-y-6', xl: 'space-y-8',
  };
  return mapping[gap] ?? 'space-y-4';
};

export const mapPaddingToTailwind = (padding: string): string => {
  const mapping: Record<string, string> = {
    xs: 'p-1', sm: 'p-2', md: 'p-4', lg: 'p-6', xl: 'p-8', '2xl': 'p-12',
  };
  return mapping[padding] ?? 'p-4';
};

export const mapMarginToTailwind = (type: string, margin: string): string => {
  const mapping: Record<string, string> = {
    xs: '1', sm: '2', md: '4', lg: '6', xl: '8',
  };
  return `${type}-${mapping[margin] ?? '4'}`;
};

export const mapJustifyToTailwind = (justify: string): string => {
  const mapping: Record<string, string> = {
    start: 'justify-start',
    end: 'justify-end',
    center: 'justify-center',
    'space-between': 'justify-between',
    'space-around': 'justify-around',
  };
  return mapping[justify] ?? 'justify-start';
};

export const mapAlignToTailwind = (align: string): string => {
  const mapping: Record<string, string> = {
    start: 'items-start',
    end: 'items-end',
    center: 'items-center',
    stretch: 'items-stretch',
  };
  return mapping[align] ?? 'items-start';
};

export const mapSizeToTailwind = (size: string): string => {
  const mapping: Record<string, string> = {
    xs: 'text-xs', sm: 'text-sm', base: 'text-base',
    lg: 'text-lg', xl: 'text-xl', '2xl': 'text-2xl',
    '3xl': 'text-3xl', '4xl': 'text-4xl', '5xl': 'text-5xl',
  };
  return mapping[size] ?? 'text-base';
};

export const mapWeightToTailwind = (weight: string): string => {
  const mapping: Record<string, string> = {
    light: 'font-light', normal: 'font-normal', medium: 'font-medium',
    semibold: 'font-semibold', bold: 'font-bold',
  };
  return mapping[weight] ?? 'font-normal';
};

export const mapTextAlignToTailwind = (align: string): string => {
  const mapping: Record<string, string> = {
    left: 'text-left', center: 'text-center', right: 'text-right',
  };
  return mapping[align] ?? 'text-left';
};

export const mapWidthToTailwind = (width: string): string => {
  if (width === '100%') return 'w-full';
  if (width.endsWith('px')) return `w-[${width}]`;
  return `w-${width}`;
};

export const mapHeightToTailwind = (height: string): string => {
  if (height === '100%') return 'h-full';
  if (height === '100vh') return 'h-screen';
  if (height.endsWith('px')) return `h-[${height}]`;
  return `h-${height}`;
};

/** Map semantic badge variant to Tailwind badge classes */
export const mapBadgeVariantToTailwind = (variant: string): string => {
  const mapping: Record<string, string> = {
    primary: 'bg-blue-100 text-blue-800',
    success: 'bg-green-100 text-green-800',
    warning: 'bg-yellow-100 text-yellow-800',
    danger: 'bg-red-100 text-red-800',
    default: 'bg-gray-100 text-gray-800',
  };
  return mapping[variant] ?? mapping['default'];
};

/** Map semantic button variant to Tailwind button classes */
export const mapButtonVariantToTailwind = (variant: string): string => {
  const mapping: Record<string, string> = {
    primary: 'bg-blue-600 text-white hover:bg-blue-700 focus:ring-blue-500',
    secondary: 'bg-gray-100 text-gray-900 hover:bg-gray-200 focus:ring-gray-500',
    outline: 'border border-gray-300 bg-transparent text-gray-700 hover:bg-gray-50 focus:ring-gray-500',
    ghost: 'bg-transparent text-gray-700 hover:bg-gray-100 focus:ring-gray-500',
  };
  return mapping[variant] ?? mapping['primary'];
};
