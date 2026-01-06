"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { api } from "~/trpc/react";
import {
  Plus,
  Search,
  Upload,
  MoreHorizontal,
  Trash2,
  Edit,
  X,
} from "lucide-react";

export default function MembersPage() {
  const params = useParams<{ orgSlug: string }>();
  const t = useTranslations("members");
  const tCommon = useTranslations("common");

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [typeFilter, setTypeFilter] = useState<string>("");
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingMember, setEditingMember] = useState<any>(null);
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
      search: search || undefined,
      status: statusFilter as any || undefined,
      installationType: typeFilter as any || undefined,
    },
    { enabled: !!org?.id }
  );

  const deleteMutation = api.member.delete.useMutation({
    onSuccess: () => refetch(),
  });

  const handleDelete = (memberId: string) => {
    if (confirm("Are you sure you want to delete this member?")) {
      deleteMutation.mutate({ memberId });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-normal text-gray-900">{t("title")}</h1>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowImport(true)}
            className="flex items-center gap-2 rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-600 hover:bg-gray-50"
          >
            <Upload className="h-4 w-4" />
            {t("importMembers")}
          </button>
          <button
            onClick={() => {
              setEditingMember(null);
              setShowAddForm(true);
            }}
            className="flex items-center gap-2 rounded-lg bg-gray-900 px-3 py-2 text-sm text-white hover:bg-gray-800"
          >
            <Plus className="h-4 w-4" />
            {t("addMember")}
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder={t("searchPlaceholder")}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-lg border border-gray-200 py-2 pl-10 pr-4 text-sm focus:border-gray-400 focus:outline-none"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-gray-400 focus:outline-none"
        >
          <option value="">{t("table.status")}</option>
          <option value="active">{t("status.active")}</option>
          <option value="inactive">{t("status.inactive")}</option>
          <option value="pending">{t("status.pending")}</option>
        </select>
        <select
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value)}
          className="rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-gray-400 focus:outline-none"
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
            refetch();
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
            refetch();
          }}
        />
      )}

      {/* Table */}
      <div className="rounded-lg border border-gray-200 bg-white">
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-200">
              <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">
                {t("table.name")}
              </th>
              <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">
                {t("table.email")}
              </th>
              <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">
                {t("table.pod")}
              </th>
              <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">
                {t("table.type")}
              </th>
              <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">
                {t("table.status")}
              </th>
              <th className="px-4 py-3 text-right text-sm font-medium text-gray-500">
                {t("table.actions")}
              </th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-sm text-gray-500">
                  {tCommon("loading")}
                </td>
              </tr>
            ) : membersData?.members.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-sm text-gray-500">
                  No members found
                </td>
              </tr>
            ) : (
              membersData?.members.map((member) => (
                <tr key={member.id} className="border-b border-gray-100 last:border-0">
                  <td className="px-4 py-3 text-sm text-gray-900">
                    {member.firstname} {member.lastname}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-500">{member.email}</td>
                  <td className="px-4 py-3 text-sm font-mono text-gray-500">
                    {member.podNumber}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-block rounded px-2 py-0.5 text-xs ${
                        member.installationType === "prosumer"
                          ? "bg-green-50 text-green-700"
                          : member.installationType === "producer"
                            ? "bg-blue-50 text-blue-700"
                            : "bg-gray-100 text-gray-600"
                      }`}
                    >
                      {t(`types.${member.installationType}`)}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-block rounded px-2 py-0.5 text-xs ${
                        member.status === "active"
                          ? "bg-green-50 text-green-700"
                          : member.status === "pending"
                            ? "bg-amber-50 text-amber-700"
                            : "bg-gray-100 text-gray-600"
                      }`}
                    >
                      {t(`status.${member.status}`)}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => setEditingMember(member)}
                        className="rounded p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
                      >
                        <Edit className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(member.id)}
                        className="rounded p-1 text-gray-400 hover:bg-gray-100 hover:text-red-600"
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
        <div className="text-sm text-gray-500">
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
  member: any | null;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const t = useTranslations("members.form");
  const tTypes = useTranslations("members.types");
  const tStatus = useTranslations("members.status");
  const tCommon = useTranslations("common");

  const [formData, setFormData] = useState({
    firstname: member?.firstname ?? "",
    lastname: member?.lastname ?? "",
    email: member?.email ?? "",
    phone: member?.phone ?? "",
    address: member?.address ?? "",
    postalCode: member?.postalCode ?? "",
    city: member?.city ?? "",
    podNumber: member?.podNumber ?? "",
    installationType: member?.installationType ?? "consumer",
    solarCapacityKwp: member?.solarCapacityKwp ? parseFloat(member.solarCapacityKwp) : undefined,
    batteryCapacityKwh: member?.batteryCapacityKwh ? parseFloat(member.batteryCapacityKwh) : undefined,
    status: member?.status ?? "pending",
  });

  const createMutation = api.member.create.useMutation({ onSuccess });
  const updateMutation = api.member.update.useMutation({ onSuccess });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (member) {
      updateMutation.mutate({
        memberId: member.id,
        ...formData,
        solarCapacityKwp: formData.solarCapacityKwp || undefined,
        batteryCapacityKwh: formData.batteryCapacityKwh || undefined,
      });
    } else {
      createMutation.mutate({
        orgId,
        ...formData,
        installationType: formData.installationType as "consumer" | "producer" | "prosumer",
        status: formData.status as "active" | "inactive" | "pending",
        solarCapacityKwp: formData.solarCapacityKwp || undefined,
        batteryCapacityKwh: formData.batteryCapacityKwh || undefined,
      });
    }
  };

  const isPending = createMutation.isPending || updateMutation.isPending;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="w-full max-w-2xl rounded-lg bg-white p-6">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-medium text-gray-900">{t("title")}</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-sm text-gray-600">{t("firstname")}</label>
              <input
                type="text"
                value={formData.firstname}
                onChange={(e) => setFormData({ ...formData, firstname: e.target.value })}
                className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-gray-400 focus:outline-none"
                required
              />
            </div>
            <div>
              <label className="block text-sm text-gray-600">{t("lastname")}</label>
              <input
                type="text"
                value={formData.lastname}
                onChange={(e) => setFormData({ ...formData, lastname: e.target.value })}
                className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-gray-400 focus:outline-none"
                required
              />
            </div>
            <div>
              <label className="block text-sm text-gray-600">{t("email")}</label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-gray-400 focus:outline-none"
                required
              />
            </div>
            <div>
              <label className="block text-sm text-gray-600">{t("phone")}</label>
              <input
                type="tel"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-gray-400 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-sm text-gray-600">{t("address")}</label>
              <input
                type="text"
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-gray-400 focus:outline-none"
              />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-sm text-gray-600">{t("postalCode")}</label>
                <input
                  type="text"
                  value={formData.postalCode}
                  onChange={(e) => setFormData({ ...formData, postalCode: e.target.value })}
                  className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-gray-400 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-sm text-gray-600">{t("city")}</label>
                <input
                  type="text"
                  value={formData.city}
                  onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                  className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-gray-400 focus:outline-none"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm text-gray-600">{t("podNumber")}</label>
              <input
                type="text"
                value={formData.podNumber}
                onChange={(e) => setFormData({ ...formData, podNumber: e.target.value })}
                className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm font-mono focus:border-gray-400 focus:outline-none"
                required
              />
            </div>
            <div>
              <label className="block text-sm text-gray-600">{t("installationType")}</label>
              <select
                value={formData.installationType}
                onChange={(e) => setFormData({ ...formData, installationType: e.target.value })}
                className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-gray-400 focus:outline-none"
              >
                <option value="consumer">{tTypes("consumer")}</option>
                <option value="producer">{tTypes("producer")}</option>
                <option value="prosumer">{tTypes("prosumer")}</option>
              </select>
            </div>
            {(formData.installationType === "producer" || formData.installationType === "prosumer") && (
              <>
                <div>
                  <label className="block text-sm text-gray-600">{t("solarCapacity")}</label>
                  <input
                    type="number"
                    step="0.1"
                    value={formData.solarCapacityKwp ?? ""}
                    onChange={(e) => setFormData({ ...formData, solarCapacityKwp: e.target.value ? parseFloat(e.target.value) : undefined })}
                    className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-gray-400 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-600">{t("batteryCapacity")}</label>
                  <input
                    type="number"
                    step="0.1"
                    value={formData.batteryCapacityKwh ?? ""}
                    onChange={(e) => setFormData({ ...formData, batteryCapacityKwh: e.target.value ? parseFloat(e.target.value) : undefined })}
                    className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-gray-400 focus:outline-none"
                  />
                </div>
              </>
            )}
            <div>
              <label className="block text-sm text-gray-600">{tCommon("status")}</label>
              <select
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-gray-400 focus:outline-none"
              >
                <option value="pending">{tStatus("pending")}</option>
                <option value="active">{tStatus("active")}</option>
                <option value="inactive">{tStatus("inactive")}</option>
              </select>
            </div>
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="submit"
              disabled={isPending}
              className="rounded-lg bg-gray-900 px-4 py-2 text-sm text-white hover:bg-gray-800 disabled:opacity-50"
            >
              {isPending ? tCommon("loading") : tCommon("save")}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-gray-200 px-4 py-2 text-sm text-gray-600 hover:bg-gray-50"
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
  const [preview, setPreview] = useState<any[]>([]);
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
          const row: any = {};
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
          const row: any = {};
          headers.forEach((header, i) => {
            row[header] = values[i] ?? "";
          });
          return {
            firstname: row.firstname || row["first name"] || "",
            lastname: row.lastname || row["last name"] || "",
            email: row.email || "",
            phone: row.phone || "",
            address: row.address || "",
            postalCode: row.postalcode || row["postal code"] || "",
            city: row.city || "",
            podNumber: row.podnumber || row["pod number"] || row.pod || "",
            installationType: (row.installationtype || row.type || "consumer") as
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="w-full max-w-2xl rounded-lg bg-white p-6">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-medium text-gray-900">{t("importMembers")}</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="mt-6">
          <div className="rounded-lg border-2 border-dashed border-gray-200 p-8 text-center">
            <input
              type="file"
              accept=".csv"
              onChange={handleFileChange}
              className="hidden"
              id="csv-upload"
            />
            <label
              htmlFor="csv-upload"
              className="cursor-pointer text-sm text-gray-500 hover:text-gray-700"
            >
              {file ? file.name : "Click to select CSV file"}
            </label>
          </div>

          {preview.length > 0 && (
            <div className="mt-4">
              <p className="text-sm text-gray-600">Preview (first 5 rows):</p>
              <div className="mt-2 max-h-40 overflow-auto rounded border border-gray-200">
                <table className="w-full text-xs">
                  <tbody>
                    {preview.map((row, i) => (
                      <tr key={i} className="border-b border-gray-100">
                        <td className="px-2 py-1">{row.firstname}</td>
                        <td className="px-2 py-1">{row.lastname}</td>
                        <td className="px-2 py-1">{row.email}</td>
                        <td className="px-2 py-1">{row.podnumber || row.pod}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {errors.length > 0 && (
            <div className="mt-4 rounded bg-red-50 p-3 text-sm text-red-700">
              {errors.map((err, i) => (
                <p key={i}>{err}</p>
              ))}
            </div>
          )}

          {bulkCreateMutation.isSuccess && (
            <div className="mt-4 rounded bg-green-50 p-3 text-sm text-green-700">
              {bulkCreateMutation.data.created} members imported successfully
            </div>
          )}
        </div>

        <div className="mt-6 flex gap-3">
          <button
            onClick={handleImport}
            disabled={!file || bulkCreateMutation.isPending}
            className="rounded-lg bg-gray-900 px-4 py-2 text-sm text-white hover:bg-gray-800 disabled:opacity-50"
          >
            {bulkCreateMutation.isPending ? tCommon("loading") : tCommon("import")}
          </button>
          <button
            onClick={onClose}
            className="rounded-lg border border-gray-200 px-4 py-2 text-sm text-gray-600 hover:bg-gray-50"
          >
            {tCommon("close")}
          </button>
        </div>
      </div>
    </div>
  );
}
