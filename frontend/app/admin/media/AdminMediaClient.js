"use client";

import { useEffect, useMemo, useState } from "react";
import AdminLayout from "@/components/AdminLayout";
import { PageHeader, FilterBar, SearchInput, EmptyState, ConfirmDialog, useToast } from "@/components/admin/ui";
import { listMedia, uploadMedia, deleteMedia } from "@/lib/api/media";
import { ApiError } from "@/lib/api/client";

export default function AdminMediaClient() {
  const [media, setMedia] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [search, setSearch] = useState("");
  const [tag, setTag] = useState("all");
  const [pendingDelete, setPendingDelete] = useState(null);
  const [uploading, setUploading] = useState(false);
  const showToast = useToast();

  const refresh = async () => {
    setLoading(true);
    setLoadError("");
    try {
      const items = await listMedia();
      setMedia(Array.isArray(items) ? items : items?.results || []);
    } catch (err) {
      setLoadError(err instanceof ApiError ? err.message : "بارگذاری کتابخانه‌ی رسانه از سرور ناموفق بود.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refresh();
  }, []);

  const tags = useMemo(() => ["all", ...new Set(media.map((m) => m.tag).filter(Boolean))], [media]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return media.filter((m) => {
      const matchesQuery = !q || (m.label || "").toLowerCase().includes(q);
      const matchesTag = tag === "all" || m.tag === tag;
      return matchesQuery && matchesTag;
    });
  }, [media, search, tag]);

  async function handleUploadFiles(fileList) {
    if (!fileList || !fileList.length) return;
    setUploading(true);
    try {
      for (const file of Array.from(fileList)) {
        // Sequential so a partial failure doesn't leave the toast/refresh
        // racing an in-flight upload — and uploads land in picked order.
        await uploadMedia(file, { label: file.name.replace(/\.[^.]+$/, "") });
      }
      await refresh();
      showToast(fileList.length > 1 ? "تصاویر اضافه شدند" : "تصویر اضافه شد");
    } catch (err) {
      showToast(err instanceof ApiError ? err.message : "آپلود تصویر ناموفق بود.", "error");
    } finally {
      setUploading(false);
    }
  }

  const confirmDelete = async () => {
    if (!pendingDelete) return;
    try {
      await deleteMedia(pendingDelete.id);
      setMedia((prev) => prev.filter((m) => m.id !== pendingDelete.id));
      showToast("تصویر حذف شد");
    } catch (err) {
      showToast(err instanceof ApiError ? err.message : "حذف تصویر ناموفق بود.", "error");
    } finally {
      setPendingDelete(null);
    }
  };

  return (
    <AdminLayout active="/admin/media">
      <PageHeader
        title="کتابخانه رسانه"
        desc="مدیریت تصاویر استفاده‌شده در محصولات و صفحات سایت."
        actions={
          <label
            className="a-btn a-btn-gold"
            style={{ display: "inline-flex", cursor: uploading ? "not-allowed" : "pointer", opacity: uploading ? 0.6 : 1 }}
          >
            <svg className="icon"><use href="#i-upload" /></svg>
            <span>{uploading ? "در حال آپلود…" : "آپلود تصویر"}</span>
            <input
              type="file"
              accept="image/*"
              multiple
              disabled={uploading}
              style={{ display: "none" }}
              onChange={(e) => {
                handleUploadFiles(e.target.files);
                e.target.value = "";
              }}
            />
          </label>
        }
      />

      {loadError && (
        <div className="a-card" style={{ marginBottom: 16, color: "#B5452F" }}>
          {loadError} — <button type="button" className="a-btn" onClick={refresh}>تلاش مجدد</button>
        </div>
      )}

      <FilterBar>
        <SearchInput value={search} onChange={setSearch} placeholder="جست‌وجوی تصویر…" />
        <select className="a-select" value={tag} onChange={(e) => setTag(e.target.value)}>
          {tags.map((t) => (
            <option key={t} value={t}>{t === "all" ? "همه‌ی برچسب‌ها" : t}</option>
          ))}
        </select>
      </FilterBar>

      {loading ? (
        <div className="a-card"><EmptyState icon="i-image" title="در حال بارگذاری…" desc="" /></div>
      ) : filtered.length === 0 ? (
        <div className="a-card">
          <EmptyState icon="i-image" title="تصویری پیدا نشد" desc="فیلترها را تغییر دهید یا تصویر جدیدی آپلود کنید." />
        </div>
      ) : (
        <div className="a-media-grid">
          {filtered.map((m) => (
            <div className="a-media-item" key={m.id}>
              <img src={m.url} alt={m.alt_text || m.label} loading="lazy" />
              {m.tag && <span className="a-media-item-tag">{m.tag}</span>}
              <button type="button" className="a-media-item-del" aria-label="حذف تصویر" onClick={() => setPendingDelete(m)}>
                <svg className="icon icon-sm"><use href="#i-trash" /></svg>
              </button>
              <div className="a-media-item-overlay">
                <span className="a-media-item-label">{m.label || "بدون عنوان"}</span>
              </div>
            </div>
          ))}
        </div>
      )}

      <ConfirmDialog
        open={!!pendingDelete}
        title="حذف تصویر"
        desc={pendingDelete ? `تصویر «${pendingDelete.label || "بدون عنوان"}» از کتابخانه حذف شود؟` : ""}
        confirmLabel="حذف"
        danger
        onConfirm={confirmDelete}
        onCancel={() => setPendingDelete(null)}
      />
    </AdminLayout>
  );
}
