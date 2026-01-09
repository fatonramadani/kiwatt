"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { api } from "~/trpc/react";
import {
  Plus,
  Search,
  Upload,
  Trash2,
  Edit,
  X,
  Mail,
  Loader2,
  CheckCircle,
  Clock,
} from "lucide-react";
import { AddressAutocomplete, type AddressData } from "~/components/app/address-autocomplete";

// Type for member data used in edit form
interface MemberData {
  id: string;
  firstname: string;
  lastname: string;
  email: string;
  phone: string | null;
  address: string | null;
  postalCode: string | null;
  city: string | null;
  podNumber: string;
  installationType: "consumer" | "producer" | "prosumer";
  solarCapacityKwp: string | number | null;
  batteryCapacityKwh: string | number | null;
  status: "active" | "inactive" | "pending";
  userId?: string | null;
  inviteStatus?: string | null;
}

// Type for CSV row data
interface MemberCsvRow {
  firstname?: string;
  "first name"?: string;
  lastname?: string;
  "last name"?: string;
  email?: string;
  phone?: string;
  address?: string;
  postalcode?: string;
  "postal code"?: string;
  city?: string;
  podnumber?: string;
  "pod number"?: string;
  pod?: string;
  installationtype?: string;
  type?: string;
  solarcapacitykwp?: string;
  batterycapacitykwh?: string;
  [key: string]: string | undefined;
}

export default function MembersPage() {
  const params = useParams<{ orgSlug: string }>();
  const t = useTranslations("members");
  const tCommon = useTranslations("common");

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [typeFilter, setTypeFilter] = useState<string>("");
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingMember, setEditingMember] = useState<MemberData | null>(null);
  const [showImport, setShowImport] = useState(false);

  const { data: org } = api.organization.getBySlug.useQuery({
    slug: params.orgSlug,
  });

  const {
    data: membersData,
    refetch,
    isLoading,
  } = api.member.list.useQuery(
    {
      orgId: org?.id ?? "",
      search: search ? search : undefined,
      status: (statusFilter as "active" | "inactive" | "pending") || undefined,
      installationType: (typeFilter as "consumer" | "producer" | "prosumer") || undefined,
    },
    { enabled: !!org?.id }
  );

  const deleteMutation = api.member.delete.useMutation({
    onSuccess: () => refetch(),
  });

  const inviteMutation = api.member.inviteMember.useMutation({
    onSuccess: () => refetch(),
  });

  const [invitingMemberId, setInvitingMemberId] = useState<string | null>(null);

  const handleDelete = (memberId: string) => {
    if (confirm(t("confirmDelete"))) {
      deleteMutation.mutate({ memberId });
    }
  };

  const handleInvite = (memberId: string) => {
    setInvitingMemberId(memberId);
    inviteMutation.mutate({ memberId }, {
      onSettled: () => setInvitingMemberId(null),
    });
  };

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-light tracking-tight text-gray-900">{t("title")}</h1>
          <p className="mt-3 text-gray-400">{t("description")}</p>
        </div>
        <div className="flex items-center gap-4">
          <button
            onClick={() => setShowImport(true)}
            className="flex items-center gap-2 rounded-xl border border-gray-200 px-4 py-2.5 text-sm text-gray-500 hover:bg-gray-50 hover:text-gray-700"
          >
            <Upload className="h-4 w-4" />
            {t("importMembers")}
          </button>
          <button
            onClick={() => {
              setEditingMember(null);
              setShowAddForm(true);
            }}
            className="flex items-center gap-2 rounded-xl bg-gray-900 px-5 py-2.5 text-sm text-white hover:bg-gray-800"
          >
            <Plus className="h-4 w-4" />
            {t("addMember")}
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-300" />
          <input
            type="text"
            placeholder={t("searchPlaceholder")}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-xl border border-gray-100 bg-white py-3 pl-11 pr-4 text-sm focus:border-gray-200 focus:outline-none"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="rounded-xl border border-gray-100 bg-white px-4 py-3 text-sm text-gray-500 focus:border-gray-200 focus:outline-none"
        >
          <option value="">{t("table.status")}</option>
          <option value="active">{t("status.active")}</option>
          <option value="inactive">{t("status.inactive")}</option>
          <option value="pending">{t("status.pending")}</option>
        </select>
        <select
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value)}
          className="rounded-xl border border-gray-100 bg-white px-4 py-3 text-sm text-gray-500 focus:border-gray-200 focus:outline-none"
        >
          <option value="">{t("table.type")}</option>
          <option value="consumer">{t("types.consumer")}</option>
          <option value="producer">{t("types.producer")}</option>
          <option value="prosumer">{t("types.prosumer")}</option>
        </select>
      </div>

      {/* Add/Edit Form Modal */}
      {(showAddForm || editingMember) && org && (
        <MemberForm
          orgId={org.id}
          member={editingMember}
          onClose={() => {
            setShowAddForm(false);
            setEditingMember(null);
          }}
          onSuccess={() => {
            setShowAddForm(false);
            setEditingMember(null);
            void refetch();
          }}
        />
      )}

      {/* Import Modal */}
      {showImport && org && (
        <ImportModal
          orgId={org.id}
          onClose={() => setShowImport(false)}
          onSuccess={() => {
            setShowImport(false);
            void refetch();
          }}
        />
      )}

      {/* Table */}
      <div className="rounded-2xl border border-gray-100 bg-white">
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-100">
              <th className="px-6 py-4 text-left text-sm font-normal text-gray-400">
                {t("table.name")}
              </th>
              <th className="px-6 py-4 text-left text-sm font-normal text-gray-400">
                {t("table.email")}
              </th>
              <th className="px-6 py-4 text-left text-sm font-normal text-gray-400">
                {t("table.pod")}
              </th>
              <th className="px-6 py-4 text-left text-sm font-normal text-gray-400">
                {t("table.type")}
              </th>
              <th className="px-6 py-4 text-left text-sm font-normal text-gray-400">
                {t("table.status")}
              </th>
              <th className="px-6 py-4 text-left text-sm font-normal text-gray-400">
                Portal
              </th>
              <th className="px-6 py-4 text-right text-sm font-normal text-gray-400">
                {t("table.actions")}
              </th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr>
                <td colSpan={7} className="px-6 py-12 text-center text-sm text-gray-400">
                  {tCommon("loading")}
                </td>
              </tr>
            ) : membersData?.members.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-6 py-12 text-center text-sm text-gray-400">
                  {t("noMembers")}
                </td>
              </tr>
            ) : (
              membersData?.members.map((member) => (
                <tr key={member.id} className="border-b border-gray-50 last:border-0">
                  <td className="px-6 py-4 text-sm text-gray-900">
                    {member.firstname} {member.lastname}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500">{member.email}</td>
                  <td className="px-6 py-4 text-sm font-mono text-gray-400">
                    {member.podNumber}
                  </td>
                  <td className="px-6 py-4">
                    <span
                      className={`inline-block rounded-lg px-2.5 py-1 text-xs ${
                        member.installationType === "prosumer"
                          ? "bg-emerald-50 text-emerald-600"
                          : member.installationType === "producer"
                            ? "bg-pelorous-50 text-pelorous-600"
                            : "bg-gray-50 text-gray-500"
                      }`}
                    >
                      {t(`types.${member.installationType}`)}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span
                      className={`inline-block rounded-lg px-2.5 py-1 text-xs ${
                        member.status === "active"
                          ? "bg-emerald-50 text-emerald-600"
                          : member.status === "pending"
                            ? "bg-amber-50 text-amber-600"
                            : "bg-gray-50 text-gray-500"
                      }`}
                    >
                      {t(`status.${member.status}`)}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    {member.userId ? (
                      <span className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-50 px-2.5 py-1 text-xs text-emerald-600">
                        <CheckCircle className="h-3 w-3" />
                        Linked
                      </span>
                    ) : member.inviteStatus === "pending" ? (
                      <button
                        onClick={() => handleInvite(member.id)}
                        disabled={invitingMemberId === member.id}
                        className="inline-flex items-center gap-1.5 rounded-lg bg-amber-50 px-2.5 py-1 text-xs text-amber-600 hover:bg-amber-100"
                        title="Resend invite"
                      >
                        {invitingMemberId === member.id ? (
                          <Loader2 className="h-3 w-3 animate-spin" />
                        ) : (
                          <Clock className="h-3 w-3" />
                        )}
                        Invited
                      </button>
                    ) : (
                      <button
                        onClick={() => handleInvite(member.id)}
                        disabled={invitingMemberId === member.id}
                        className="inline-flex items-center gap-1.5 rounded-lg bg-gray-100 px-2.5 py-1 text-xs text-gray-600 hover:bg-gray-200"
                      >
                        {invitingMemberId === member.id ? (
                          <Loader2 className="h-3 w-3 animate-spin" />
                        ) : (
                          <Mail className="h-3 w-3" />
                        )}
                        Send Invite
                      </button>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center justify-end gap-1">
                      <button
                        onClick={() => setEditingMember(member as MemberData)}
                        className="rounded-lg p-2 text-gray-400 hover:bg-gray-50 hover:text-gray-600"
                      >
                        <Edit className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(member.id)}
                        className="rounded-lg p-2 text-gray-400 hover:bg-gray-50 hover:text-red-500"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {membersData && (
        <div className="text-sm text-gray-400">
          {membersData.total} member(s)
        </div>
      )}
    </div>
  );
}

// Member Form Component
function MemberForm({
  orgId,
  member,
  onClose,
  onSuccess,
}: {
  orgId: string;
  member: MemberData | null;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const t = useTranslations("members.form");
  const tTypes = useTranslations("members.types");
  const tStatus = useTranslations("members.status");
  const tCommon = useTranslations("common");

  const [formData, setFormData] = useState<{
    firstname: string;
    lastname: string;
    email: string;
    phone: string;
    address: string;
    postalCode: string;
    city: string;
    podNumber: string;
    installationType: "consumer" | "producer" | "prosumer";
    solarCapacityKwp: number | undefined;
    batteryCapacityKwh: number | undefined;
    status: "active" | "inactive" | "pending";
  }>({
    firstname: member?.firstname ?? "",
    lastname: member?.lastname ?? "",
    email: member?.email ?? "",
    phone: member?.phone ?? "",
    address: member?.address ?? "",
    postalCode: member?.postalCode ?? "",
    city: member?.city ?? "",
    podNumber: member?.podNumber ?? "",
    installationType: member?.installationType ?? "consumer",
    solarCapacityKwp: member?.solarCapacityKwp ? parseFloat(String(member.solarCapacityKwp)) : undefined,
    batteryCapacityKwh: member?.batteryCapacityKwh ? parseFloat(String(member.batteryCapacityKwh)) : undefined,
    status: member?.status ?? "pending",
  });

  const createMutation = api.member.create.useMutation({ onSuccess });
  const updateMutation = api.member.update.useMutation({ onSuccess });

  const handleAddressSelect = (addressData: AddressData) => {
    setFormData((prev) => ({
      ...prev,
      postalCode: addressData.postalCode,
      city: addressData.city,
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (member) {
      updateMutation.mutate({
        memberId: member.id,
        ...formData,
        solarCapacityKwp: formData.solarCapacityKwp ?? undefined,
        batteryCapacityKwh: formData.batteryCapacityKwh ?? undefined,
      });
    } else {
      createMutation.mutate({
        orgId,
        ...formData,
        solarCapacityKwp: formData.solarCapacityKwp ?? undefined,
        batteryCapacityKwh: formData.batteryCapacityKwh ?? undefined,
      });
    }
  };

  const isPending = createMutation.isPending || updateMutation.isPending;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
      <div className="w-full max-w-2xl rounded-2xl bg-white p-8">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-light text-gray-900">{t("title")}</h2>
          <button onClick={onClose} className="rounded-lg p-1 text-gray-400 hover:bg-gray-50 hover:text-gray-600">
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-8 space-y-5">
          <div className="grid gap-5 sm:grid-cols-2">
            <div>
              <label className="block text-sm text-gray-500">{t("firstname")}</label>
              <input
                type="text"
                value={formData.firstname}
                onChange={(e) => setFormData({ ...formData, firstname: e.target.value })}
                className="mt-2 w-full rounded-xl border border-gray-100 px-4 py-3 text-sm focus:border-gray-200 focus:outline-none"
                required
              />
            </div>
            <div>
              <label className="block text-sm text-gray-500">{t("lastname")}</label>
              <input
                type="text"
                value={formData.lastname}
                onChange={(e) => setFormData({ ...formData, lastname: e.target.value })}
                className="mt-2 w-full rounded-xl border border-gray-100 px-4 py-3 text-sm focus:border-gray-200 focus:outline-none"
                required
              />
            </div>
            <div>
              <label className="block text-sm text-gray-500">{t("email")}</label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="mt-2 w-full rounded-xl border border-gray-100 px-4 py-3 text-sm focus:border-gray-200 focus:outline-none"
                required
              />
            </div>
            <div>
              <label className="block text-sm text-gray-500">{t("phone")}</label>
              <input
                type="tel"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                className="mt-2 w-full rounded-xl border border-gray-100 px-4 py-3 text-sm focus:border-gray-200 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-sm text-gray-500">{t("address")}</label>
              <AddressAutocomplete
                value={formData.address}
                onChange={(value) => setFormData({ ...formData, address: value })}
                onAddressSelect={handleAddressSelect}
                className="mt-2"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm text-gray-500">{t("postalCode")}</label>
                <input
                  type="text"
                  value={formData.postalCode}
                  onChange={(e) => setFormData({ ...formData, postalCode: e.target.value })}
                  className="mt-2 w-full rounded-xl border border-gray-100 px-4 py-3 text-sm focus:border-gray-200 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-sm text-gray-500">{t("city")}</label>
                <input
                  type="text"
                  value={formData.city}
                  onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                  className="mt-2 w-full rounded-xl border border-gray-100 px-4 py-3 text-sm focus:border-gray-200 focus:outline-none"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm text-gray-500">{t("podNumber")}</label>
              <input
                type="text"
                value={formData.podNumber}
                onChange={(e) => setFormData({ ...formData, podNumber: e.target.value })}
                className="mt-2 w-full rounded-xl border border-gray-100 px-4 py-3 text-sm font-mono focus:border-gray-200 focus:outline-none"
                required
              />
            </div>
            <div>
              <label className="block text-sm text-gray-500">{t("installationType")}</label>
              <select
                value={formData.installationType}
                onChange={(e) => setFormData({ ...formData, installationType: e.target.value as "consumer" | "producer" | "prosumer" })}
                className="mt-2 w-full rounded-xl border border-gray-100 px-4 py-3 text-sm focus:border-gray-200 focus:outline-none"
              >
                <option value="consumer">{tTypes("consumer")}</option>
                <option value="producer">{tTypes("producer")}</option>
                <option value="prosumer">{tTypes("prosumer")}</option>
              </select>
            </div>
            {(formData.installationType === "producer" || formData.installationType === "prosumer") && (
              <>
                <div>
                  <label className="block text-sm text-gray-500">{t("solarCapacity")}</label>
                  <input
                    type="number"
                    step="0.1"
                    value={formData.solarCapacityKwp ?? ""}
                    onChange={(e) => setFormData({ ...formData, solarCapacityKwp: e.target.value ? parseFloat(e.target.value) : undefined })}
                    className="mt-2 w-full rounded-xl border border-gray-100 px-4 py-3 text-sm focus:border-gray-200 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-500">{t("batteryCapacity")}</label>
                  <input
                    type="number"
                    step="0.1"
                    value={formData.batteryCapacityKwh ?? ""}
                    onChange={(e) => setFormData({ ...formData, batteryCapacityKwh: e.target.value ? parseFloat(e.target.value) : undefined })}
                    className="mt-2 w-full rounded-xl border border-gray-100 px-4 py-3 text-sm focus:border-gray-200 focus:outline-none"
                  />
                </div>
              </>
            )}
            <div>
              <label className="block text-sm text-gray-500">{tCommon("status")}</label>
              <select
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value as "active" | "inactive" | "pending" })}
                className="mt-2 w-full rounded-xl border border-gray-100 px-4 py-3 text-sm focus:border-gray-200 focus:outline-none"
              >
                <option value="pending">{tStatus("pending")}</option>
                <option value="active">{tStatus("active")}</option>
                <option value="inactive">{tStatus("inactive")}</option>
              </select>
            </div>
          </div>

          <div className="flex gap-4 pt-6">
            <button
              type="submit"
              disabled={isPending}
              className="rounded-xl bg-gray-900 px-6 py-3 text-sm text-white hover:bg-gray-800 disabled:opacity-50"
            >
              {isPending ? tCommon("loading") : tCommon("save")}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl border border-gray-200 px-6 py-3 text-sm text-gray-500 hover:bg-gray-50"
            >
              {tCommon("cancel")}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// Import Modal Component
function ImportModal({
  orgId,
  onClose,
  onSuccess,
}: {
  orgId: string;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const t = useTranslations("members");
  const tCommon = useTranslations("common");
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<MemberCsvRow[]>([]);
  const [errors, setErrors] = useState<string[]>([]);

  const bulkCreateMutation = api.member.bulkCreate.useMutation({
    onSuccess: (result) => {
      if (result.errors.length > 0) {
        setErrors(result.errors.map((e) => `Row ${e.row}: ${e.error}`));
      } else {
        onSuccess();
      }
    },
  });

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    setFile(selectedFile);
    setErrors([]);

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      const lines = text.split("\n");
      const headers = lines[0]?.split(",").map((h) => h.trim().toLowerCase());

      if (!headers) return;

      const data = lines
        .slice(1)
        .filter((line) => line.trim())
        .map((line) => {
          const values = line.split(",").map((v) => v.trim());
          const row: MemberCsvRow = {};
          headers.forEach((header, i) => {
            row[header] = values[i] ?? "";
          });
          return row;
        });

      setPreview(data.slice(0, 5));
    };
    reader.readAsText(selectedFile);
  };

  const handleImport = () => {
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      const lines = text.split("\n");
      const headers = lines[0]?.split(",").map((h) => h.trim().toLowerCase());

      if (!headers) return;

      const members = lines
        .slice(1)
        .filter((line) => line.trim())
        .map((line) => {
          const values = line.split(",").map((v) => v.trim());
          const row: MemberCsvRow = {};
          headers.forEach((header, i) => {
            row[header] = values[i] ?? "";
          });
          return {
            firstname: row.firstname ?? row["first name"] ?? "",
            lastname: row.lastname ?? row["last name"] ?? "",
            email: row.email ?? "",
            phone: row.phone ?? "",
            address: row.address ?? "",
            postalCode: row.postalcode ?? row["postal code"] ?? "",
            city: row.city ?? "",
            podNumber: row.podnumber ?? row["pod number"] ?? row.pod ?? "",
            installationType: (row.installationtype ?? row.type ?? "consumer") as
              | "consumer"
              | "producer"
              | "prosumer",
            solarCapacityKwp: row.solarcapacitykwp
              ? parseFloat(row.solarcapacitykwp)
              : undefined,
            batteryCapacityKwh: row.batterycapacitykwh
              ? parseFloat(row.batterycapacitykwh)
              : undefined,
          };
        })
        .filter((m) => m.firstname && m.lastname && m.email && m.podNumber);

      bulkCreateMutation.mutate({ orgId, members });
    };
    reader.readAsText(file);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
      <div className="w-full max-w-2xl rounded-2xl bg-white p-8">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-light text-gray-900">{t("importMembers")}</h2>
          <button onClick={onClose} className="rounded-lg p-1 text-gray-400 hover:bg-gray-50 hover:text-gray-600">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="mt-8">
          <div className="rounded-2xl border-2 border-dashed border-gray-200 p-12 text-center">
            <input
              type="file"
              accept=".csv"
              onChange={handleFileChange}
              className="hidden"
              id="csv-upload"
            />
            <label
              htmlFor="csv-upload"
              className="cursor-pointer text-sm text-gray-400 hover:text-gray-600"
            >
              {file ? file.name : t("import.selectFile")}
            </label>
          </div>

          {preview.length > 0 && (
            <div className="mt-6">
              <p className="text-sm text-gray-400">Preview (first 5 rows):</p>
              <div className="mt-3 max-h-40 overflow-auto rounded-xl border border-gray-100">
                <table className="w-full text-xs">
                  <tbody>
                    {preview.map((row, i) => (
                      <tr key={i} className="border-b border-gray-50">
                        <td className="px-3 py-2 text-gray-600">{row.firstname}</td>
                        <td className="px-3 py-2 text-gray-600">{row.lastname}</td>
                        <td className="px-3 py-2 text-gray-500">{row.email}</td>
                        <td className="px-3 py-2 font-mono text-gray-400">{row.podnumber ?? row.pod}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {errors.length > 0 && (
            <div className="mt-6 rounded-xl bg-red-50 p-4 text-sm text-red-600">
              {errors.map((err, i) => (
                <p key={i}>{err}</p>
              ))}
            </div>
          )}

          {bulkCreateMutation.isSuccess && (
            <div className="mt-6 rounded-xl bg-emerald-50 p-4 text-sm text-emerald-600">
              {bulkCreateMutation.data.created} members imported successfully
            </div>
          )}
        </div>

        <div className="mt-8 flex gap-4">
          <button
            onClick={handleImport}
            disabled={!file || bulkCreateMutation.isPending}
            className="rounded-xl bg-gray-900 px-6 py-3 text-sm text-white hover:bg-gray-800 disabled:opacity-50"
          >
            {bulkCreateMutation.isPending ? tCommon("loading") : tCommon("import")}
          </button>
          <button
            onClick={onClose}
            className="rounded-xl border border-gray-200 px-6 py-3 text-sm text-gray-500 hover:bg-gray-50"
          >
            {tCommon("close")}
          </button>
        </div>
      </div>
    </div>
  );
}
