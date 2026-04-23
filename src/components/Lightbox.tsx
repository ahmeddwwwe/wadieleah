import { X } from "lucide-react";

type Props = {
  item: { src: string; alt: string; label: string };
  onClose: () => void;
};

export const Lightbox = ({ item, onClose }: Props) => (
  <div
    className="fixed inset-0 z-[70] bg-night/90 backdrop-blur-md flex items-center justify-center p-4 animate-fade-in"
    onClick={onClose}
    role="dialog"
    aria-modal="true"
  >
    <button
      onClick={onClose}
      className="absolute top-4 left-4 h-10 w-10 rounded-full glass-strong text-frost grid place-items-center hover:bg-night/80 transition-smooth"
      aria-label="إغلاق"
    >
      <X className="h-4 w-4" />
    </button>
    <figure className="max-w-5xl w-full" onClick={(e) => e.stopPropagation()}>
      <img src={item.src} alt={item.alt} className="w-full max-h-[80vh] object-contain rounded-2xl shadow-lift" />
      <figcaption className="mt-3 text-center text-frost font-bold">{item.label}</figcaption>
    </figure>
  </div>
);
