import type { ComponentType, SVGProps } from 'react';
import { cn } from '@/lib/utils';

type GravityIconProps = Omit<SVGProps<SVGSVGElement>, 'ref'> & {
  icon: ComponentType<SVGProps<SVGSVGElement>>;
};

export function GravityIcon({ icon: Icon, className, ...props }: GravityIconProps) {
  return <Icon className={cn('mt-px', className)} {...props} />;
}
