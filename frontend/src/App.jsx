import { useState, useEffect, useCallback } from 'react';
import { getBins, getOptimizedRoutes, collectBins, getAnalysis } from './api';
import './App.css';

function App() {
  const [bins, setBins] = useState([]);
  const [routes, setRoutes] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [collectingBins, setCollectingBins] = useState(new Set());
  const [insights, setInsights] = useState(null);

  /**
   * Fetch EDA insights from /analysis.
   */
  const fetchInsights = useCallback(async () => {
    try {
      const data = await getAnalysis();
      setInsights(data);
    } catch (err) {
      console.error('Insights fetch error:', err);
    }
  }, []);

  // Fetch insights on mount + every 10 seconds
  useEffect(() => {
    fetchInsights();
    const interval = setInterval(fetchInsights, 10000);
    return () => clearInterval(interval);
  }, [fetchInsights]);

  /**
   * Fetch bins and optimized routes from the backend.
   */
  const fetchData = useCallback(async () => {
    try {
      const [binsData, routesData] = await Promise.all([
        getBins(),
        getOptimizedRoutes(),
      ]);
      setBins(binsData);
      setRoutes(routesData);
      setError(null);
    } catch (err) {
      console.error('Fetch error:', err);
      setError('Unable to connect to backend. Make sure the server is running on port 5000.');
    } finally {
      setLoading(false);
    }
  }, []);

  // Initial fetch + auto-refresh every 5 seconds
  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 5000);
    return () => clearInterval(interval);
  }, [fetchData]);

  /**
   * Handle waste collection for given bin IDs.
   */
  const handleCollect = useCallback(async (binIds) => {
    try {
      setCollectingBins((prev) => new Set([...prev, ...binIds]));
      await collectBins(binIds);
      await fetchData();
    } catch (err) {
      console.error('Collection error:', err);
      setError('Failed to collect waste. Please try again.');
    } finally {
      setCollectingBins((prev) => {
        const next = new Set(prev);
        binIds.forEach((id) => next.delete(id));
        return next;
      });
    }
  }, [fetchData]);

  /**
   * Determine color status based on fill level thresholds.
   */
  const getStatus = (level) => {
    if (level > 70) return 'red';
    if (level >= 50) return 'yellow';
    return 'green';
  };

  const getStatusLabel = (level) => {
    if (level > 85) return 'High Priority';
    if (level > 70) return 'Critical';
    if (level >= 50) return 'Warning';
    return 'Normal';
  };

  // Summary stats
  const totalBins = bins.length;
  const criticalBins = bins.filter((b) => b.fill_level > 70).length;
  const warningBins = bins.filter((b) => b.fill_level >= 50 && b.fill_level <= 70).length;
  const avgFill = totalBins > 0
    ? Math.round(bins.reduce((sum, b) => sum + b.fill_level, 0) / totalBins)
    : 0;

  if (loading) {
    return (
      <div className="loading">
        <div className="spinner" />
        <p>Connecting to waste management network...</p>
      </div>
    );
  }

  return (
    <div className="app">
      {/* ===== HEADER ===== */}
      <header className="header">
        <span className="header-icon">♻️</span>
        <h1>Smart Waste Management</h1>
        <p className="header-subtitle">
          Real-time bin monitoring &amp; intelligent route optimization
        </p>
        <div className="header-live">
          <span className="live-dot" />
          LIVE — Auto-refreshing every 5s
        </div>
      </header>

      {/* ===== ERROR ===== */}
      {error && (
        <div className="error-banner">
          <span>⚠️</span>
          <p>{error}</p>
        </div>
      )}

      {/* ===== STATS BAR ===== */}
      <div className="stats-bar">
        <div className="stat-card">
          <div className="stat-icon">🗑️</div>
          <div className="stat-value">{totalBins}</div>
          <div className="stat-label">Total Bins</div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">🔴</div>
          <div className="stat-value">{criticalBins}</div>
          <div className="stat-label">Critical (&gt;70%)</div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">🟡</div>
          <div className="stat-value">{warningBins}</div>
          <div className="stat-label">Warning (50-70%)</div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">📊</div>
          <div className="stat-value">{avgFill}%</div>
          <div className="stat-label">Avg Fill Level</div>
        </div>
      </div>

      {/* ===== EDA INSIGHTS ===== */}
      {insights && (
        <div className="insights-section">
          <div className="section-header">
            <h2>📈 Insights</h2>
            <span className="section-badge">EDA</span>
          </div>
          <div className="insights-grid">
            <div className="insight-card insight-active">
              <div className="insight-icon">🏆</div>
              <div className="insight-value">
                {insights.most_active_bin ? `Bin #${insights.most_active_bin}` : '—'}
              </div>
              <div className="insight-label">Most Active Bin</div>
              <div className="insight-sublabel">Highest avg fill level</div>
            </div>
            <div className="insight-card insight-avg">
              <div className="insight-icon">📊</div>
              <div className="insight-value">{insights.average_fill}%</div>
              <div className="insight-label">Historical Avg Fill</div>
              <div className="insight-sublabel">Across all records</div>
            </div>
            <div className="insight-card insight-critical">
              <div className="insight-icon">⚠️</div>
              <div className="insight-value">{insights.critical_events}</div>
              <div className="insight-label">Critical Events</div>
              <div className="insight-sublabel">Times fill &gt; 70%</div>
            </div>
          </div>
        </div>
      )}

      {/* ===== BIN STATUS ===== */}
      <div className="section-header">
        <h2>🗑️ Bin Status</h2>
        <span className="section-badge">{totalBins} bins</span>
      </div>
      <div className="bins-grid">
        {bins.map((bin) => {
          const status = getStatus(bin.fill_level);
          const label = getStatusLabel(bin.fill_level);
          return (
            <div key={bin.id} className={`bin-card status-${status}`}>
              <div className="bin-card-header">
                <span className="bin-id">Bin #{bin.id}</span>
                <span className={`bin-status-badge badge-${status}`}>
                  {label}
                </span>
              </div>
              <div className="bin-location">📍 {bin.location}</div>
              <div className="fill-bar-container">
                <div className="fill-bar-bg">
                  <div
                    className={`fill-bar bar-${status}`}
                    style={{ width: `${bin.fill_level}%` }}
                  />
                </div>
              </div>
              <div className="fill-info">
                <span className={`fill-percent text-${status}`}>
                  {bin.fill_level}%
                </span>
                <span className="fill-label">Fill Level</span>
              </div>
              {bin.fill_level > 70 && (
                <button
                  className={`collect-btn ${collectingBins.has(bin.id) ? 'collecting' : ''}`}
                  onClick={() => handleCollect([bin.id])}
                  disabled={collectingBins.has(bin.id)}
                >
                  {collectingBins.has(bin.id) ? '♻️ Collecting...' : '🚛 Collect Waste'}
                </button>
              )}
            </div>
          );
        })}
      </div>

      {/* ===== OPTIMIZED ROUTES ===== */}
      <div className="section-header">
        <h2>🚛 Optimized Collection Routes</h2>
        {routes?.routes?.length > 0 && (
          <>
            <span className="section-badge">
              {routes.routes.length} truck{routes.routes.length !== 1 ? 's' : ''} active
            </span>
            <button
              className={`collect-all-btn ${collectingBins.size > 0 ? 'collecting' : ''}`}
              onClick={() => {
                const allCriticalIds = bins
                  .filter((b) => b.fill_level > 70)
                  .map((b) => b.id);
                if (allCriticalIds.length > 0) handleCollect(allCriticalIds);
              }}
              disabled={collectingBins.size > 0}
            >
              {collectingBins.size > 0 ? '♻️ Collecting...' : '🚛 Collect All Critical'}
            </button>
          </>
        )}
      </div>

      <div className="routes-container">
        {routes?.routes?.length > 0 ? (
          routes.routes.map((route, idx) => (
            <div key={idx} className="route-card">
              <div className="route-truck-header">
                <div className="truck-icon">🚛</div>
                <div>
                  <div className="truck-name">{route.truck}</div>
                  <div className="truck-stops">
                    {route.stops.length} stop{route.stops.length !== 1 ? 's' : ''} assigned
                  </div>
                </div>
              </div>
              <div className="route-path">
                <span className="route-stop stop-medium" style={{
                  background: 'var(--accent-bg)',
                  borderColor: 'var(--border-glow)',
                  color: 'var(--accent-light)',
                }}>
                  🏢 Depot
                </span>
                {route.stops.map((stop, sIdx) => (
                  <span key={sIdx} style={{ display: 'contents' }}>
                    <span className="route-arrow">→</span>
                    <span className={`route-stop stop-${stop.priority === 'HIGH' ? 'high' : 'medium'}`}>
                      🗑️ Bin {stop.bin_id} ({stop.fill_level}%)
                    </span>
                  </span>
                ))}
              </div>
            </div>
          ))
        ) : (
          <div className="no-routes">
            <div className="no-routes-icon">✅</div>
            <p>All bins are below the 70% threshold</p>
            <p className="sub-text">No collection routes needed at this time</p>
          </div>
        )}
      </div>
    </div>
  );
}

export default App;
