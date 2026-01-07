"use client";

import { useState, useRef, useEffect } from "react";
import { useTranslations } from "next-intl";
import { Link } from "~/i18n/navigation";
import { api } from "~/trpc/react";
import { ChevronDown, Check, Plus, Building2 } from "lucide-react";
import { cn } from "~/lib/utils";

interface OrganizationSwitcherProps {
  currentOrgSlug: string;
  currentOrgName: string;
  onNavigate?: () => void;
}

export function OrganizationSwitcher({
  currentOrgSlug,
  currentOrgName,
  onNavigate,
}: OrganizationSwitcherProps) {
  const t = useTranslations("organizations");
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const { data: organizations } = api.organization.list.useQuery();

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Close on escape
  useEffect(() => {
    function handleEscape(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setIsOpen(false);
      }
    }

    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, []);

  const handleSelect = () => {
    setIsOpen(false);
    onNavigate?.();
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Trigger */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "flex w-full items-center justify-between gap-2 rounded-xl px-3 py-2.5 text-left transition-colors",
          isOpen
            ? "bg-gray-100 text-gray-900"
            : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
        )}
      >
        <div className="flex items-center gap-3 overflow-hidden">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-pelorous-100">
            <Building2 className="h-4 w-4 text-pelorous-600" />
          </div>
          <span className="truncate text-sm font-medium">{currentOrgName}</span>
        </div>
        <ChevronDown
          className={cn(
            "h-4 w-4 shrink-0 text-gray-400 transition-transform",
            isOpen && "rotate-180"
          )}
        />
      </button>

      {/* Dropdown */}
      {isOpen && (
        <div className="absolute left-0 right-0 top-full z-50 mt-2 overflow-hidden rounded-xl border border-gray-100 bg-white shadow-lg">
          {/* Organizations list */}
          <div className="max-h-64 overflow-y-auto p-2">
            {organizations?.map((org) => {
              const isCurrent = org.slug === currentOrgSlug;
              return (
                <Link
                  key={org.id}
                  href={`/app/${org.slug}/dashboard`}
                  onClick={handleSelect}
                  className={cn(
                    "flex items-center gap-3 rounded-lg px-3 py-2.5 transition-colors",
                    isCurrent
                      ? "bg-pelorous-50 text-pelorous-700"
                      : "text-gray-700 hover:bg-gray-50"
                  )}
                >
                  <div
                    className={cn(
                      "flex h-8 w-8 shrink-0 items-center justify-center rounded-lg",
                      isCurrent ? "bg-pelorous-100" : "bg-gray-100"
                    )}
                  >
                    <Building2
                      className={cn(
                        "h-4 w-4",
                        isCurrent ? "text-pelorous-600" : "text-gray-500"
                      )}
                    />
                  </div>
                  <div className="flex-1 overflow-hidden">
                    <p className="truncate text-sm font-medium">{org.name}</p>
                    {org.commune && (
                      <p className="truncate text-xs text-gray-400">
                        {org.commune}
                        {org.canton && `, ${org.canton}`}
                      </p>
                    )}
                  </div>
                  {isCurrent && (
                    <Check className="h-4 w-4 shrink-0 text-pelorous-600" />
                  )}
                </Link>
              );
            })}
          </div>

          {/* Divider */}
          <div className="border-t border-gray-100" />

          {/* Create new */}
          <div className="p-2">
            <Link
              href="/app/new"
              onClick={handleSelect}
              className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-gray-600 transition-colors hover:bg-gray-50 hover:text-gray-900"
            >
              <div className="flex h-8 w-8 items-center justify-center rounded-lg border-2 border-dashed border-gray-200">
                <Plus className="h-4 w-4 text-gray-400" />
              </div>
              <span className="text-sm font-medium">{t("create")}</span>
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
