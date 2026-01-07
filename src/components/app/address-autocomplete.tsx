"use client";

import { useState, useEffect, useRef } from "react";
import { useTranslations } from "next-intl";
import { Search, Loader2, MapPin, X } from "lucide-react";
import { cn } from "~/lib/utils";

interface GeoAdminResult {
  id: number;
  weight: number;
  attrs: {
    label: string;
    detail: string;
    origin: string;
    lat: number;
    lon: number;
    geom_st_box2d?: string;
  };
}

export interface AddressData {
  street: string;
  postalCode: string;
  city: string;
  commune?: string;
  canton?: string;
}

interface AddressAutocompleteProps {
  value: string;
  onChange: (value: string) => void;
  onAddressSelect: (address: AddressData) => void;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
}

export function AddressAutocomplete({
  value,
  onChange,
  onAddressSelect,
  placeholder,
  className,
  disabled,
}: AddressAutocompleteProps) {
  const t = useTranslations("components.addressAutocomplete");
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [results, setResults] = useState<GeoAdminResult[]>([]);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const containerRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<NodeJS.Timeout | null>(null);

  // Debounced search
  useEffect(() => {
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    if (value.length < 3) {
      setResults([]);
      setIsOpen(false);
      return;
    }

    debounceRef.current = setTimeout(async () => {
      setIsLoading(true);
      try {
        const response = await fetch(
          `https://api3.geo.admin.ch/rest/services/api/SearchServer?searchText=${encodeURIComponent(value)}&type=locations&origins=address&limit=8`
        );
        const data = await response.json();
        setResults(data.results || []);
        setIsOpen(true);
        setSelectedIndex(-1);
      } catch (error) {
        console.error("Address search failed:", error);
        setResults([]);
      } finally {
        setIsLoading(false);
      }
    }, 300);

    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, [value]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Parse address from geoadmin result
  const parseAddress = (result: GeoAdminResult): AddressData => {
    // Label format: "<b>Street Number</b> <b>PostalCode</b> City"
    // Detail format varies but typically contains more info
    const label = result.attrs.label.replace(/<[^>]*>/g, ""); // Strip HTML tags

    // Try to parse from label: "Rue de la Gare 12 1003 Lausanne"
    const parts = label.split(" ");

    // Find postal code (4-digit number in Switzerland)
    const postalCodeIndex = parts.findIndex((p) => /^\d{4}$/.test(p));

    if (postalCodeIndex > 0) {
      const street = parts.slice(0, postalCodeIndex).join(" ");
      const postalCode = parts[postalCodeIndex];
      const city = parts.slice(postalCodeIndex + 1).join(" ");

      // Try to extract canton from detail
      const detail = result.attrs.detail || "";
      const cantonMatch = detail.match(/\b([A-Z]{2})\s*$/);
      const canton = cantonMatch ? cantonMatch[1] : undefined;

      return {
        street,
        postalCode: postalCode ?? "",
        city,
        commune: city, // In Switzerland, city is often the commune
        canton,
      };
    }

    // Fallback: return entire label as street
    return {
      street: label,
      postalCode: "",
      city: "",
    };
  };

  const handleSelect = (result: GeoAdminResult) => {
    const addressData = parseAddress(result);
    const cleanLabel = result.attrs.label.replace(/<[^>]*>/g, "");
    onChange(cleanLabel);
    onAddressSelect(addressData);
    setIsOpen(false);
    setResults([]);
  };

  // Keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!isOpen || results.length === 0) return;

    switch (e.key) {
      case "ArrowDown":
        e.preventDefault();
        setSelectedIndex((i) => Math.min(i + 1, results.length - 1));
        break;
      case "ArrowUp":
        e.preventDefault();
        setSelectedIndex((i) => Math.max(i - 1, 0));
        break;
      case "Enter":
        e.preventDefault();
        if (selectedIndex >= 0 && results[selectedIndex]) {
          handleSelect(results[selectedIndex]);
        }
        break;
      case "Escape":
        setIsOpen(false);
        break;
    }
  };

  const handleClear = () => {
    onChange("");
    setResults([]);
    setIsOpen(false);
  };

  return (
    <div ref={containerRef} className="relative">
      <div className="relative">
        <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-300" />
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={handleKeyDown}
          onFocus={() => results.length > 0 && setIsOpen(true)}
          placeholder={placeholder ?? t("placeholder")}
          disabled={disabled}
          className={cn(
            "w-full rounded-xl border border-gray-100 py-3 pl-11 pr-10 text-sm focus:border-gray-200 focus:outline-none",
            disabled && "cursor-not-allowed bg-gray-50",
            className
          )}
        />
        {isLoading && (
          <Loader2 className="absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-gray-400" />
        )}
        {value && !isLoading && (
          <button
            type="button"
            onClick={handleClear}
            className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      {/* Dropdown */}
      {isOpen && results.length > 0 && (
        <div className="absolute z-50 mt-2 w-full rounded-xl border border-gray-100 bg-white shadow-lg">
          {results.map((result, index) => (
            <button
              key={result.id}
              type="button"
              onClick={() => handleSelect(result)}
              className={cn(
                "flex w-full items-start gap-3 px-4 py-3 text-left text-sm transition-colors",
                index === selectedIndex ? "bg-pelorous-50" : "hover:bg-gray-50",
                index === 0 && "rounded-t-xl",
                index === results.length - 1 && "rounded-b-xl"
              )}
            >
              <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-gray-400" />
              <span
                className="text-gray-700"
                dangerouslySetInnerHTML={{ __html: result.attrs.label }}
              />
            </button>
          ))}
        </div>
      )}

      {/* Empty state */}
      {isOpen && results.length === 0 && !isLoading && value.length >= 3 && (
        <div className="absolute z-50 mt-2 w-full rounded-xl border border-gray-100 bg-white p-4 text-center text-sm text-gray-400 shadow-lg">
          {t("noResults")}
        </div>
      )}
    </div>
  );
}
