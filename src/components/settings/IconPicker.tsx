import { useEffect, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { IconBan, IconPhotoUp } from "@tabler/icons-react";
import { ICON_CATEGORIES } from "../../lib/opIcons";
import { getRecentIcons, pushRecentIcon } from "../../lib/recentIcons";
import { getIconTags, type IconTagIndex } from "../../lib/iconTags";
import { fileToIconDataUrl } from "../../lib/imageIcon";
import { toast } from "../../lib/toast";
import { OpIcon, getIconNames, iconExists } from "../ui/OpIcon";
import { ModalShell } from "../ui/ModalShell";
import { SearchInput } from "../ui/SearchInput";

const MAX_RESULTS = 180;

/** Icon picker for tagging a saved operation. Browsing shows curated,
 * illustration-tool-oriented categories (draw / colour / select / …); the search
 * box matches names + concept tags across that same curated set (~200 icons —
 * only these are bundled). Anything outside it can still be set via the custom
 * image import. The first cell clears the icon. Stored value = the Tabler
 * component name, e.g. "IconBrush". */
export function IconPicker({
  value,
  onPick,
  onClose,
}: {
  value?: string;
  onPick: (name: string | undefined) => void;
  onClose: () => void;
}) {
  const { t } = useTranslation();
  const [query, setQuery] = useState("");
  // The full name list resolves once the icon barrel loads (searching needs it;
  // the curated categories show instantly meanwhile).
  const [all, setAll] = useState<string[]>([]);
  useEffect(() => {
    getIconNames().then(setAll).catch(() => {});
  }, []);
  // Concept keywords (IconName → "tag tag …"), lazy-loaded so searching can match
  // "erase" / "delete" etc., not just the component name. Absent until it loads.
  const [tags, setTags] = useState<IconTagIndex>({});
  useEffect(() => {
    getIconTags().then(setTags).catch(() => {});
  }, []);
  // Tabler names are PascalCase with no spaces/hyphens (e.g. IconBrush); match a
  // space-stripped, lower-cased query against the lower-cased name. Tags keep
  // their spaces, so they get the plain lower-cased query.
  const q = query.trim().toLowerCase().replace(/\s+/g, "");
  const qTag = query.trim().toLowerCase();
  // Recently-picked icons (read once on open; picking closes the modal). Drop
  // any that no longer resolve (e.g. picked from 0.1.0's full-barrel search),
  // so the row never shows blank, clickable dead cells.
  const [recents] = useState(() => getRecentIcons().filter(iconExists));

  // Name matches first (most relevant), then tag-only matches, capped. So a
  // keyword like "delete" surfaces IconTrash even though its name lacks "delete".
  const results = useMemo(() => {
    if (!q) return [];
    const nameHits: string[] = [];
    const tagHits: string[] = [];
    for (const n of all) {
      if (n.toLowerCase().includes(q)) nameHits.push(n);
      else if (tags[n]?.includes(qTag)) tagHits.push(n);
    }
    return [...nameHits, ...tagHits].slice(0, MAX_RESULTS);
  }, [q, qTag, all, tags]);

  const pick = (name: string | undefined) => {
    if (name) pushRecentIcon(name);
    onPick(name);
    onClose();
  };

  // Custom image icon: pick a file or paste one (e.g. from CLIP Studio). It's
  // downscaled to a tiny data URL. Recent list holds Tabler names only, so an
  // image doesn't push there.
  const fileRef = useRef<HTMLInputElement>(null);
  const importImage = async (file: File | null | undefined) => {
    if (!file) return;
    try {
      const url = await fileToIconDataUrl(file);
      onPick(url);
      onClose();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : String(e));
    }
  };
  useEffect(() => {
    const onPaste = (e: ClipboardEvent) => {
      const img = Array.from(e.clipboardData?.items ?? []).find((i) =>
        i.type.startsWith("image/"),
      );
      if (img) {
        e.preventDefault();
        void importImage(img.getAsFile());
      }
    };
    window.addEventListener("paste", onPaste);
    return () => window.removeEventListener("paste", onPaste);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  const cell =
    "w-9 h-9 inline-flex items-center justify-center rounded-row border transition-colors";

  const iconCell = (name: string) => {
    const on = value === name;
    return (
      <button
        key={name}
        onClick={() => pick(name)}
        data-tip={name.replace(/^Icon/, "")}
        className={
          cell +
          (on
            ? " border-accent text-accent bg-accent/10"
            : " border-border text-text2 hover:border-text3 hover:text-text")
        }
      >
        <OpIcon name={name} size={17} />
      </button>
    );
  };

  return (
    <ModalShell
      title="アイコンを選ぶ"
      onClose={onClose}
      width="w-[min(94vw,720px)]"
      height="h-[80vh]"
      z={60}
      bodyClassName="flex flex-col overflow-hidden p-0"
    >
      <div className="shrink-0 p-3 border-b border-border">
        <SearchInput
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={t("アイコンを検索（英語名・キーワード）")}
        />
      </div>
      <div className="flex-1 min-h-0 overflow-y-auto p-4">
        {q ? (
          <>
            <div className="flex flex-wrap gap-1.5">{results.map(iconCell)}</div>
            {results.length === 0 && (
              <p className="p-3 text-center text-label text-text3">
                {t("一致するアイコンがありません。")}
              </p>
            )}
            {results.length >= MAX_RESULTS && (
              <p className="mt-2 text-center text-caption text-text3">
                {t("結果が多すぎます。検索を絞ってください。")}
              </p>
            )}
          </>
        ) : (
          <div className="space-y-3">
            {/* Clear (no icon) + custom image import (file / paste). */}
            <div className="flex items-center gap-1.5 flex-wrap">
              <button
                onClick={() => pick(undefined)}
                data-tip={t("アイコンなし")}
                aria-label={t("アイコンなし")}
                className={
                  cell +
                  (value == null
                    ? " border-accent text-accent bg-accent/10"
                    : " border-border text-text3 hover:border-text3")
                }
              >
                <IconBan size={16} aria-hidden />
              </button>
              <button
                onClick={() => fileRef.current?.click()}
                data-tip={t("画像を読み込む（貼り付けも可・クリスタの書き出し画像など）")}
                className={
                  "h-9 px-3 inline-flex items-center gap-1.5 text-label rounded-row border transition-colors " +
                  (value?.startsWith("data:")
                    ? "border-accent text-accent bg-accent/10"
                    : "border-border text-text2 hover:border-accent hover:text-accent")
                }
              >
                {value?.startsWith("data:") ? (
                  <OpIcon name={value} size={17} />
                ) : (
                  <IconPhotoUp size={15} aria-hidden />
                )}
                {t("画像")}
              </button>
              <input
                ref={fileRef}
                type="file"
                accept="image/png,image/jpeg,image/webp,image/gif,image/bmp"
                className="hidden"
                onChange={(e) => {
                  void importImage(e.target.files?.[0]);
                  e.target.value = "";
                }}
              />
            </div>
            {/* Recently used (if any), above the curated categories. */}
            {recents.length > 0 && (
              <div>
                <div className="mb-1 text-caption font-semibold uppercase tracking-wider text-text3">
                  {t("最近使った")}
                </div>
                <div className="flex flex-wrap gap-1.5">{recents.map(iconCell)}</div>
              </div>
            )}
            {/* Curated categories. */}
            {ICON_CATEGORIES.map((cat) => (
              <div key={cat.label}>
                <div className="mb-1 text-caption font-semibold uppercase tracking-wider text-text3">
                  {t(cat.label)}
                </div>
                <div className="flex flex-wrap gap-1.5">{cat.icons.map(iconCell)}</div>
              </div>
            ))}
          </div>
        )}
      </div>
    </ModalShell>
  );
}
