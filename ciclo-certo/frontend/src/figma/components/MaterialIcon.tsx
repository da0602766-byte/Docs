import { CupSoda, Droplet, Milk, Newspaper, Package, Wine } from 'lucide-react';
import type { MaterialKey } from '../types';

// Colors follow the Brazilian selective-collection bins (glass green, paper blue, plastic red, metal yellow).
const MAP = {
  vidro: { Icon: Wine, cls: 'bg-green-100 text-green-800' },
  papel: { Icon: Newspaper, cls: 'bg-blue-100 text-blue-800' },
  cartonado: { Icon: Package, cls: 'bg-blue-100 text-blue-800' },
  plastico: { Icon: Milk, cls: 'bg-red-100 text-red-700' },
  metal: { Icon: CupSoda, cls: 'bg-yellow-100 text-yellow-800' },
  oleo: { Icon: Droplet, cls: 'bg-orange-100 text-orange-700' },
} as const;

export function MaterialIcon({ k, size = 'md' }: { k: MaterialKey; size?: 'sm' | 'md' }) {
  const { Icon, cls } = MAP[k];
  const dims = size === 'sm' ? 'h-7 w-7 rounded-lg' : 'h-10 w-10 rounded-xl';
  return (
    <span className={`${dims} ${cls} grid shrink-0 place-items-center`}>
      <Icon className={size === 'sm' ? 'h-3.5 w-3.5' : 'h-5 w-5'} />
    </span>
  );
}
