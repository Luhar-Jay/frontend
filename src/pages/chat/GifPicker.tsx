import { useState, useRef, useEffect } from "react";
import { Search, X, Loader2 } from "lucide-react";
import { useGifSearch } from "../../apis/api/chat";
import type { GifResult } from "../../types/chat.types";

type Props = {
  onSelect: (gif: GifResult) => void;
  onClose: () => void;
};

export function GifPicker({ onSelect, onClose }: Props) {
  const [query, setQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const timerRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const handleQueryChange = (value: string) => {
    setQuery(value);
    clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => setDebouncedQuery(value), 400);
  };

  const { data: gifs = [], isLoading } = useGifSearch(debouncedQuery);

  return (
    <div className="absolute bottom-full right-0 z-50 mb-2 w-72 overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-xl">
      {/* Search bar */}
      <div className="flex items-center gap-2 border-b border-gray-100 px-3 py-2">
        <Search className="h-4 w-4 shrink-0 text-gray-400" />
        <input
          ref={inputRef}
          type="text"
          placeholder="Search GIFs..."
          value={query}
          onChange={(e) => handleQueryChange(e.target.value)}
          className="flex-1 text-sm outline-none placeholder:text-gray-400"
        />
        <button
          type="button"
          onClick={onClose}
          className="flex h-6 w-6 items-center justify-center rounded-lg text-gray-400 hover:bg-gray-100"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      </div>

      {/* GIF Grid */}
      <div className="h-56 overflow-y-auto p-2">
        {isLoading ? (
          <div className="flex h-full items-center justify-center">
            <Loader2 className="h-5 w-5 animate-spin text-violet-500" />
          </div>
        ) : gifs.length === 0 ? (
          <div className="flex h-full items-center justify-center text-sm text-gray-400">
            {debouncedQuery ? "No GIFs found" : "Search for GIFs above"}
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-1.5">
            {gifs.map((gif) => (
              <button
                key={gif.id}
                type="button"
                onClick={() => onSelect(gif)}
                className="group relative overflow-hidden rounded-xl bg-gray-100"
                style={{ aspectRatio: `${gif.dims[0]} / ${gif.dims[1]}` }}
              >
                <img
                  src={gif.preview}
                  alt={gif.title}
                  className="h-full w-full object-cover transition group-hover:scale-105"
                  loading="lazy"
                />
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
