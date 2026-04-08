import { ArrowUp, ArrowDown, ArrowUpDown } from 'lucide-react';
import type { SortField } from './types';

interface Props {
  field: SortField;
  sortField: SortField;
  sortAsc: boolean;
}

export function SortIcon({ field, sortField, sortAsc }: Props) {
  if (sortField !== field) return <ArrowUpDown className="w-3.5 h-3.5 text-gray-300 opacity-0 group-hover:opacity-100 transition-opacity" />;
  return sortAsc ? <ArrowUp className="w-3.5 h-3.5 text-indigo-500" /> : <ArrowDown className="w-3.5 h-3.5 text-indigo-500" />;
}
