import React, { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";

const API_BASE =
  process.env.REACT_APP_API_BASE_URL || "http://localhost:5000";
const REDIRECT_BASE =
  process.env.REACT_APP_REDIRECT_BASE_URL || "http://localhost:5000";

function Dashboard() {
  const [url, setUrl] = useState("");
  const [code, setCode] = useState("");
  const [links, setLinks] = useState([]);
  const [loadingLinks, setLoadingLinks] = useState(true);
  const [creating, setCreating] = useState(false);
  const [deletingCodes, setDeletingCodes] = useState([]);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [lastCreatedShort, setLastCreatedShort] = useState("");
  const [searchParams, setSearchParams] = useSearchParams();
  const [search, setSearch] = useState(searchParams.get("q") || "");
  const navigate = useNavigate();

  const isValidUrl = (value) => {
    try {
      const u = new URL(value);
      return u.protocol === "http:" || u.protocol === "https:";
    } catch {
      return false;
    }
  };

  const fetchLinks = async (searchValue) => {
    try {
      setLoadingLinks(true);
      setError("");

      let url = `${API_BASE}/api/links`;
      if (searchValue) {
        url += `?search=${encodeURIComponent(searchValue)}`;
      }

      const res = await fetch(url);
      if (!res.ok) {
        throw new Error(`Failed to fetch links (status ${res.status})`);
      }

      const data = await res.json();
      setLinks(data);
    } catch (err) {
      console.error(err);
      setError(err.message || "Failed to load links.");
    } finally {
      setLoadingLinks(false);
    }
  };

  useEffect(() => {
    fetchLinks(searchParams.get("q") || "");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // When the window/tab regains focus, refresh the links to pick up any
  // click count changes that happened in other tabs (or after a redirect).
  useEffect(() => {
    const onFocus = () => fetchLinks(searchParams.get("q") || "");
    window.addEventListener("focus", onFocus);
    return () => window.removeEventListener("focus", onFocus);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  // Open the short URL in a new tab and optimistically increment the click
  // count in the UI so users see an immediate update.
  const handleOpenShort = (code, shortUrl) => {
    try {
      window.open(shortUrl, "_blank", "noopener,noreferrer");
    } catch (e) {
      // fallback: navigate
      window.location.href = shortUrl;
    }

    setLinks((prev) =>
      prev.map((l) =>
        l.code === code
          ? {
              ...l,
              total_clicks: (l.total_clicks || 0) + 1,
              last_clicked_at: new Date().toISOString(),
            }
          : l
      )
    );
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setLastCreatedShort("");

    if (!url.trim()) {
      setError("Please enter a destination URL.");
      return;
    }

    if (!isValidUrl(url.trim())) {
      setError("URL must start with http:// or https://");
      return;
    }

    if (code && !/^[A-Za-z0-9]{6,8}$/.test(code)) {
      setError("Custom code must be 6–8 characters (A–Z, a–z, 0–9).");
      return;
    }

    setCreating(true);
    try {
      const res = await fetch(`${API_BASE}/api/links`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          targetUrl: url.trim(),
          code: code.trim() || undefined,
        }),
      });

      if (res.status === 409) {
        const data = await res.json().catch(() => ({}));
        setError(data.error || "That code already exists. Try another one.");
        return;
      }

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || `Failed with status ${res.status}`);
      }

      const data = await res.json();
      setLinks((prev) => [data, ...prev]);
      setUrl("");
      setCode("");

      const short = `${REDIRECT_BASE}/${data.code}`;
      setLastCreatedShort(short);
      setSuccess("Short link created successfully!");
    } catch (err) {
      console.error(err);
      setError(err.message || "Failed to create short link.");
    } finally {
      setCreating(false);
    }
  };

  const handleDelete = async (linkToDelete) => {
    const codeToDelete = linkToDelete.code;
    if (!window.confirm(`Delete link "${codeToDelete}"?`)) return;
    setError("");
    setSuccess("");

    // Optimistically remove from UI and mark as deleting
    setDeletingCodes((d) => [...d, codeToDelete]);
    setLinks((prev) => prev.filter((l) => l.code !== codeToDelete));

    try {
      const res = await fetch(`${API_BASE}/api/links/${codeToDelete}`, {
        method: "DELETE",
      });

      if (res.status === 404) {
        setError("Link not found (maybe already deleted).");
        return;
      }
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || `Failed with status ${res.status}`);
      }

      setSuccess("Link deleted.");
    } catch (err) {
      console.error(err);
      // Restore row on failure
      setLinks((prev) => [linkToDelete, ...prev]);
      setError(err.message || "Failed to delete link.");
    } finally {
      setDeletingCodes((d) => d.filter((c) => c !== codeToDelete));
    }
  };

  const handleCopy = async (code) => {
    const shortUrl = `${REDIRECT_BASE}/${code}`;
    try {
      await navigator.clipboard.writeText(shortUrl);
      setSuccess("Short link copied to clipboard!");
    } catch {
      setError("Failed to copy link. You can copy it manually.");
    }
  };

  const handleCopyLast = async () => {
    if (!lastCreatedShort) return;
    try {
      await navigator.clipboard.writeText(lastCreatedShort);
      setSuccess("Short link copied to clipboard!");
    } catch {
      setError("Failed to copy link. You can copy it manually.");
    }
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setSearchParams(search ? { q: search } : {});
    fetchLinks(search);
  };

  const domain = REDIRECT_BASE.replace(/^https?:\/\//, "");

  return (
    <div className="page-root">
      <div className="quick-card">
        {/* Create card */}
        <div className="quick-card-header">
          <h2 className="quick-title">Create short link</h2>
          <p className="quick-subtitle">
            Paste your long URL and optionally customize the short code.
          </p>
          <div className="quick-meta">
            <span className="quick-domain-label">Domain:</span>
            <span className="quick-domain-value">{domain}</span>
          </div>
        </div>

        <form className="quick-form" onSubmit={handleCreate}>
          <label className="field-label">Destination URL</label>
          <input
            className="input-field"
            type="text"
            placeholder="https://example.com/very/long/url"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            disabled={creating}
          />

          <label className="field-label">Custom back-half (optional)</label>
          <div className="field-inline">
            <div className="field-inline-prefix">/</div>
            <input
              className="input-field-inline"
              type="text"
              placeholder="6–8 chars (A–Z, a–z, 0–9)"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              disabled={creating}
            />
          </div>

          {error && <div className="alert alert-error">{error}</div>}
          {success && <div className="alert alert-success">{success}</div>}

          <button className="primary-btn" type="submit" disabled={creating}>
            {creating ? "Creating..." : "Create short link"}
          </button>
        </form>

        {/* Show last created short link, Bitly style */}
        {lastCreatedShort && (
          <div className="result-panel">
            <span className="result-label">Your latest short link</span>
            <div className="result-row">
              <a
                href={lastCreatedShort}
                target="_blank"
                rel="noreferrer"
                className="result-link"
              >
                {lastCreatedShort}
              </a>
              <button className="secondary-btn" onClick={handleCopyLast}>
                Copy
              </button>
            </div>
          </div>
        )}

        {/* Search + table */}
        <div className="table-section">
          <form className="search-form" onSubmit={handleSearchSubmit}>
            <input
              className="input-field"
              type="text"
              placeholder="Search by code or URL..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            <button className="secondary-btn" type="submit">
              Search
            </button>
          </form>

          {loadingLinks && <p>Loading links...</p>}

          {!loadingLinks && !error && links.length === 0 && (
            <p className="empty-text">No links yet. Create one above.</p>
          )}

          {!loadingLinks && links.length > 0 && (
            <div className="table-wrapper">
              <table className="link-table">
                <thead>
                  <tr>
                    <th>Code</th>
                    <th>Short URL</th>
                    <th>Target URL</th>
                    <th>Total Clicks</th>
                    <th>Last Clicked</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {links.map((link) => {
                    const shortUrl = `${REDIRECT_BASE}/${link.code}`;
                    return (
                      <tr key={link.id}>
                        <td>
                          <code>{link.code}</code>
                        </td>
                            <td className="cell-short">
                              <a
                                href={shortUrl}
                                target="_blank"
                                rel="noreferrer"
                                className="result-link"
                                onClick={(e) => {
                                  e.preventDefault();
                                  handleOpenShort(link.code, shortUrl);
                                }}
                              >
                                {shortUrl}
                              </a>
                            </td>
                        <td className="cell-url">
                          <span title={link.target_url}>
                            {link.target_url}
                          </span>
                        </td>
                        <td className="cell-center">{link.total_clicks}</td>
                        <td className="cell-center">
                          {link.last_clicked_at
                            ? new Date(
                                link.last_clicked_at
                              ).toLocaleString()
                            : "-"}
                        </td>
                        <td className="cell-center">
                          <button
                            className="small-btn"
                            onClick={() => handleCopy(link.code)}
                          >
                            Copy
                          </button>
                          <button
                            className="small-btn"
                            onClick={() => navigate(`/code/${link.code}`)}
                          >
                            Stats
                          </button>
                          <button
                            className="small-btn small-btn-danger"
                            onClick={() => handleDelete(link)}
                            disabled={deletingCodes.includes(link.code)}
                          >
                            {deletingCodes.includes(link.code) ? "Deleting..." : "Delete"}
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default Dashboard;
