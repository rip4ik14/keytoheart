import { Loader2 } from 'lucide-react';

export default function Spinner({ size = '1.25rem' }: { size?: string }) {
  return (
    <div
      className="flex items-center justify-center"
      role="status"
      aria-label="Загрузка"
    >
      <Loader2
        className="animate-spin text-black"
        style={{ width: size, height: size }}
      />
    </div>
  );
}