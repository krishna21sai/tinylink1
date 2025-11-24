import React, { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";

const API_BASE =
  process.env.REACT_APP_API_BASE_URL || "http://localhost:5000";
const REDIRECT_BASE =
  process.env.REACT_APP_REDIRECT_BASE_URL || "http://localhost:5000";

function StatsPage() {
  const { code } = useParams();
  const [link, setLink] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchStats = async () => {
    try {
      setLoading(true);
      setError("");

      const res = await fetch(`${API_BASE}/api/links/${code}`);

      if (res.status === 404) {
        setError("Link not found.");
        setLink(null);
        return;
      }
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || `Failed with status ${res.status}`);
      }

      const data = await res.json();
      setLink(data);
    } catch (err) {
      console.error(err);
      setError(err.message || "Failed to load stats.");
    } finally {
      setLoading(false);
    }
  };

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    fetchStats();
    // refetch on window focus so counts update after redirects
    const onFocus = () => fetchStats();
    window.addEventListener("focus", onFocus);

    // poll every 5 seconds while the page is visible
    const interval = setInterval(() => {
      if (document.visibilityState === "visible") fetchStats();
    }, 5000);

    return () => {
      window.removeEventListener("focus", onFocus);
      clearInterval(interval);
    };
  }, [code]);

  const shortUrl = `${REDIRECT_BASE}/${code}`;

  return (
    <div className="page-root">
      <div className="quick-card">
        <h2 className="quick-title">
          Stats for <code>{code}</code>
        </h2>

        {loading && <p>Loading stats...</p>}

        {error && <p className="alert alert-error">Error: {error}</p>}

        {!loading && !error && !link && (
          <p className="empty-text">No data found.</p>
        )}

        {!loading && !error && link && (
          <div className="stats-grid">
            <div>
              <div className="stats-label">Short URL</div>
              <a
                href={shortUrl}
                target="_blank"
                rel="noreferrer"
                className="result-link"
              >
                {shortUrl}
              </a>
            </div>
            <div>
              <div className="stats-label">Target URL</div>
              <a
                href={link.target_url}
                target="_blank"
                rel="noreferrer"
                className="result-link"
              >
                {link.target_url}
              </a>
            </div>
            <div>
              <div className="stats-label">Total clicks</div>
              <div className="stats-value">{link.total_clicks}</div>
            </div>
            <div>
              <div className="stats-label">Last clicked</div>
              <div className="stats-value">
                {link.last_clicked_at
                  ? new Date(link.last_clicked_at).toLocaleString()
                  : "Never"}
              </div>
            </div>
            <div>
              <div className="stats-label">Created at</div>
              <div className="stats-value">
                {link.created_at
                  ? new Date(link.created_at).toLocaleString()
                  : "-"}
              </div>
            </div>
            <div>
              <div className="stats-label">Updated at</div>
              <div className="stats-value">
                {link.updated_at
                  ? new Date(link.updated_at).toLocaleString()
                  : "-"}
              </div>
            </div>
          </div>
        )}

        <p style={{ marginTop: "16px" }}>
          <Link to="/">← Back to Dashboard</Link>
        </p>
      </div>
    </div>
  );
}

export default StatsPage;
