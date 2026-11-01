"use client";

import { useCallback, useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { isAuthenticated } from "@/lib/api/client";
import { fetchComments, fetchReactions, removeComment, sendComment, sendReaction } from "@/lib/api/social";

const fa = (n) => String(n).replace(/\d/g, (d) => "۰۱۲۳۴۵۶۷۸۹"[d]);
const dateFa = (iso) => {
  try {
    return new Date(iso).toLocaleDateString("fa-IR", { year: "numeric", month: "long", day: "numeric" });
  } catch {
    return "";
  }
};

function LoginHint({ text }) {
  return (
    <p className="pd-login-hint">
      {text} <a href="/login">ورود / ثبت‌نام</a>
    </p>
  );
}

function Rating({ summary }) {
  if (!summary) return null;
  const { percent, likes, dislikes } = summary;
  return (
    <>
      <span className="pd-stars" aria-hidden="true">
        <span className="pd-stars-bg">★★★★★</span>
        <span className="pd-stars-fg" style={{ width: `${percent ?? 0}%` }}>★★★★★</span>
      </span>
      {percent === null ? (
        <span>هنوز امتیازی ثبت نشده</span>
      ) : (
        <span>
          <strong>{fa(percent)}٪</strong> رضایت ({fa(likes)} پسند · {fa(dislikes)} نپسند)
        </span>
      )}
    </>
  );
}

function ReactButtons({ summary, onReact, message }) {
  const mine = summary?.my_reaction || 0;
  return (
    <div className="pd-react">
      <button type="button" className={`pd-react-btn${mine === 1 ? " active like" : ""}`} onClick={() => onReact(1)} aria-pressed={mine === 1} aria-label="پسندیدم">
        👍 <span>{fa(summary?.likes ?? 0)}</span>
      </button>
      <button type="button" className={`pd-react-btn${mine === -1 ? " active dislike" : ""}`} onClick={() => onReact(-1)} aria-pressed={mine === -1} aria-label="نپسندیدم">
        👎 <span>{fa(summary?.dislikes ?? 0)}</span>
      </button>
      {message && <small className="pd-react-msg">{message}</small>}
    </div>
  );
}

function CommentForm({ placeholder, submitLabel, onSubmit, onCancel }) {
  const [body, setBody] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const submit = async (e) => {
    e.preventDefault();
    if (!body.trim()) return;
    setBusy(true);
    setError("");
    try {
      await onSubmit(body.trim());
      setBody("");
    } catch (err) {
      setError(err?.status === 401 ? "نشست شما منقضی شده؛ دوباره وارد شوید." : err?.message || "ثبت نظر انجام نشد.");
    } finally {
      setBusy(false);
    }
  };
  return (
    <div className="pd-cform">
      <textarea value={body} onChange={(e) => setBody(e.target.value)} maxLength={1000} rows={3} placeholder={placeholder} />
      <div className="pd-cform-row">
        <button type="button" className="btn btn-gold" disabled={busy || !body.trim()} onClick={submit}>
          <span>{busy ? "در حال ثبت…" : submitLabel}</span>
        </button>
        {onCancel && (
          <button type="button" className="pd-link-btn" onClick={onCancel}>انصراف</button>
        )}
        <small>{fa(body.length)} / ۱۰۰۰</small>
      </div>
      {error && <small className="pd-cerror">{error}</small>}
    </div>
  );
}

function Comment({ comment, loggedIn, onReply, onDelete, isReply }) {
  const [replying, setReplying] = useState(false);
  return (
    <div className={`pd-comment${isReply ? " reply" : ""}`}>
      <div className="pd-comment-head">
        <strong>{comment.author}</strong>
        {comment.is_staff && <span className="pd-badge">فروشگاه</span>}
        <small>{dateFa(comment.created_at)}</small>
      </div>
      <p>{comment.body}</p>
      <div className="pd-comment-actions">
        {!isReply && loggedIn && (
          <button type="button" className="pd-link-btn" onClick={() => setReplying((v) => !v)}>پاسخ</button>
        )}
        {comment.can_delete && (
          <button type="button" className="pd-link-btn danger" onClick={() => window.confirm("این نظر حذف شود؟") && onDelete(comment.id)}>حذف</button>
        )}
      </div>
      {replying && (
        <CommentForm
          placeholder="پاسخ شما…"
          submitLabel="ثبت پاسخ"
          onCancel={() => setReplying(false)}
          onSubmit={async (text) => {
            await onReply(text, comment.id);
            setReplying(false);
          }}
        />
      )}
      {(comment.replies || []).map((r) => (
        <Comment key={r.id} comment={r} isReply loggedIn={loggedIn} onDelete={onDelete} />
      ))}
    </div>
  );
}

/**
 * Real likes/dislikes + comments for a product, rendered into mount points of
 * the product page markup (#pdRatingMount, #pdReactMount, #reviewsMount).
 */
export default function ProductSocial({ slug, mounts }) {
  const [summary, setSummary] = useState(null);
  const [comments, setComments] = useState({ count: 0, results: [] });
  const [message, setMessage] = useState("");
  const loggedIn = typeof window !== "undefined" && isAuthenticated();

  const load = useCallback(async () => {
    const [s, c] = await Promise.all([fetchReactions(slug).catch(() => null), fetchComments(slug).catch(() => null)]);
    if (s) setSummary(s);
    if (c) setComments(c);
  }, [slug]);

  useEffect(() => {
    load();
  }, [load]);

  // keep the "نظرات کاربران (N)" tab label in sync
  useEffect(() => {
    if (mounts.tab) mounts.tab.textContent = `نظرات کاربران (${fa(comments.count)})`;
  }, [mounts.tab, comments.count]);

  const react = async (value) => {
    if (!isAuthenticated()) {
      setMessage("برای ثبت امتیاز ابتدا وارد حساب خود شوید.");
      return;
    }
    setMessage("");
    const next = (summary?.my_reaction || 0) === value ? 0 : value; // click again = undo
    try {
      setSummary(await sendReaction(slug, next));
    } catch (err) {
      setMessage(err?.status === 401 ? "نشست شما منقضی شده؛ دوباره وارد شوید." : "ثبت امتیاز انجام نشد.");
    }
  };

  const post = async (text, parent = null) => {
    await sendComment(slug, text, parent);
    await load();
  };
  const del = async (id) => {
    try {
      await removeComment(slug, id);
    } finally {
      await load();
    }
  };

  return (
    <>
      {mounts.rating && createPortal(<Rating summary={summary} />, mounts.rating)}
      {mounts.react && createPortal(<ReactButtons summary={summary} onReact={react} message={message} />, mounts.react)}
      {mounts.reviews &&
        createPortal(
          <div className="pd-comments">
            <h3>نظرات کاربران ({fa(comments.count)})</h3>
            {loggedIn ? (
              <CommentForm placeholder="نظر خود را درباره‌ی این محصول بنویسید…" submitLabel="ثبت نظر" onSubmit={(t) => post(t)} />
            ) : (
              <LoginHint text="برای ثبت نظر یا پاسخ، ابتدا وارد شوید." />
            )}
            {comments.results.length === 0 ? (
              <p className="pd-empty">هنوز نظری ثبت نشده است. اولین نفر باشید!</p>
            ) : (
              comments.results.map((c) => (
                <Comment key={c.id} comment={c} loggedIn={loggedIn} onReply={post} onDelete={del} />
              ))
            )}
          </div>,
          mounts.reviews
        )}
    </>
  );
}
