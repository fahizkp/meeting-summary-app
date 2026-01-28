import React, { useState, useEffect } from 'react';
import './QHLSDashboard.css';

const API_BASE = import.meta.env.VITE_API_URL || '';

function QHLSDashboard() {
    const [weekOffset, setWeekOffset] = useState(0);
    const [dashboardData, setDashboardData] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    // Filter and view state
    const [zoneFilter, setZoneFilter] = useState('');
    const [activeTab, setActiveTab] = useState('responses'); // 'responses' or 'missing'

    // Fetch dashboard data
    useEffect(() => {
        fetchDashboardData();
    }, [weekOffset]);

    async function fetchDashboardData() {
        setLoading(true);
        setError('');

        try {
            const token = localStorage.getItem('token');
            const response = await fetch(`${API_BASE}/api/qhls/dashboard?weekOffset=${weekOffset}`, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                },
            });

            const result = await response.json();

            if (result.success) {
                setDashboardData(result.data);
            } else {
                setError(result.error || 'Failed to load data');
            }
        } catch (err) {
            setError('Failed to load data. Please refresh.');
            console.error('Error fetching QHLS dashboard:', err);
        } finally {
            setLoading(false);
        }
    }

    // Get unique zones for filter
    const uniqueZones = dashboardData?.responses
        ? [...new Set(dashboardData.responses.map(r => r.zone))].sort()
        : [];

    // Filter responses by zone
    const filteredResponses = zoneFilter && dashboardData?.responses
        ? dashboardData.responses.filter(r => r.zone === zoneFilter)
        : dashboardData?.responses || [];

    // Format date range
    const formatDateRange = () => {
        if (!dashboardData) return '';
        const start = new Date(dashboardData.weekStart).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' });
        const end = new Date(dashboardData.weekEnd).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' });
        return `${start} - ${end}`;
    };

    return (
        <div className="qhls-dashboard">
            <header className="qhls-header">
                <h1>QHLS Dashboard</h1>
                <div className="week-selector">
                    <select
                        value={weekOffset}
                        onChange={(e) => setWeekOffset(parseInt(e.target.value))}
                    >
                        <option value="0">Current Week</option>
                        <option value="-1">Previous Week</option>
                        <option value="-2">2 Weeks Ago</option>
                        <option value="-3">3 Weeks Ago</option>
                    </select>
                </div>
            </header>

            {error && <div className="qhls-error">{error}</div>}

            {loading && <div className="qhls-loading">Loading...</div>}

            {!loading && dashboardData && (
                <>
                    {/* Week Info */}
                    <div style={{ padding: '12px 16px', color: '#94a3b8', fontSize: '0.85rem', textAlign: 'center' }}>
                        {formatDateRange()}
                    </div>

                    {/* Stats Cards */}
                    {dashboardData.stats && (
                        <div className="qhls-stats-grid">
                            <div className="qhls-stat-card">
                                <div className="qhls-stat-value">{dashboardData.stats.totalResponses}</div>
                                <div className="qhls-stat-label">യൂണിറ്റുകൾ</div>
                            </div>
                            <div className="qhls-stat-card">
                                <div className="qhls-stat-value">{dashboardData.stats.totalMales}</div>
                                <div className="qhls-stat-label">പുരുഷന്മാർ</div>
                            </div>
                            <div className="qhls-stat-card">
                                <div className="qhls-stat-value">{dashboardData.stats.totalFemales}</div>
                                <div className="qhls-stat-label">സ്ത്രീകൾ</div>
                            </div>
                            <div className="qhls-stat-card highlight">
                                <div className="qhls-stat-value">{dashboardData.stats.totalParticipants}</div>
                                <div className="qhls-stat-label">ആകെ പങ്കാളികൾ</div>
                            </div>
                        </div>
                    )}

                    {/* Missing Units Summary */}
                    {dashboardData.missing && (
                        <div className="qhls-missing-summary">
                            <span className="qhls-missing-count">{dashboardData.missing.totalMissing}</span>
                            <span className="qhls-missing-text">/{dashboardData.missing.totalUnits} ശാഖകൾ QHLS റിപ്പോർട്ട് ചെയ്തിട്ടില്ല</span>
                        </div>
                    )}

                    {/* Tab Navigation */}
                    <div className="qhls-tab-nav">
                        <button
                            className={`qhls-tab-btn ${activeTab === 'responses' ? 'active' : ''}`}
                            onClick={() => setActiveTab('responses')}
                        >
                            QHLS ഉള്ളവ ({dashboardData.responses.filter(r => r.hasQhls).length})
                        </button>
                        <button
                            className={`qhls-tab-btn ${activeTab === 'missing' ? 'active' : ''}`}
                            onClick={() => setActiveTab('missing')}
                        >
                            QHLS ഇല്ലാത്തവ ({dashboardData.missing?.totalMissing || 0})
                        </button>
                    </div>

                    {/* Responses Tab */}
                    {activeTab === 'responses' && (
                        <>
                            {/* Filter and Refresh Bar */}
                            <div className="qhls-actions-bar">
                                <select
                                    className="qhls-zone-filter"
                                    value={zoneFilter}
                                    onChange={(e) => setZoneFilter(e.target.value)}
                                >
                                    <option value="">എല്ലാ മണ്ഡലങ്ങളും</option>
                                    {uniqueZones.map(zone => (
                                        <option key={zone} value={zone}>{zone}</option>
                                    ))}
                                </select>
                                <button onClick={fetchDashboardData} className="qhls-refresh-btn" disabled={loading}>
                                    {loading ? '...' : '🔄'}
                                </button>
                            </div>

                            {/* Response Cards */}
                            <div className="qhls-cards-container">
                                {filteredResponses.filter(r => r.hasQhls).length === 0 ? (
                                    <div className="qhls-empty-state">
                                        {loading ? 'Loading...' : 'No QHLS data available'}
                                    </div>
                                ) : (
                                    filteredResponses.filter(r => r.hasQhls).map((row, index) => (
                                        <div key={index} className="qhls-response-card">
                                            <div className="qhls-card-header">
                                                <span className="qhls-card-zone">{row.zone}</span>
                                                <span className="qhls-status-badge qhls-status-yes">ഉണ്ട്</span>
                                            </div>
                                            <div className="qhls-card-unit">{row.unit}</div>
                                            <div className="qhls-card-details">
                                                <span>📅 {row.day || '-'}</span>
                                                <span>👤 {row.faculty || '-'}</span>
                                            </div>
                                            <div className="qhls-card-counts">
                                                <div className="qhls-count-item">
                                                    <span className="qhls-count-value">{row.male}</span>
                                                    <span className="qhls-count-label">പുരുഷൻ</span>
                                                </div>
                                                <div className="qhls-count-item">
                                                    <span className="qhls-count-value">{row.female}</span>
                                                    <span className="qhls-count-label">സ്ത്രീ</span>
                                                </div>
                                                <div className="qhls-count-item total">
                                                    <span className="qhls-count-value">{row.male + row.female}</span>
                                                    <span className="qhls-count-label">ആകെ</span>
                                                </div>
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        </>
                    )}

                    {/* Missing Units Tab */}
                    {activeTab === 'missing' && dashboardData.missing && (
                        <div className="qhls-missing-container">
                            {Object.keys(dashboardData.missing.byZone).length === 0 ? (
                                <div className="qhls-empty-state success">
                                    🎉 എല്ലാ ശാഖകളും QHLS റിപ്പോർട്ട് ചെയ്തു!
                                </div>
                            ) : (
                                Object.entries(dashboardData.missing.byZone).map(([zone, units]) => (
                                    <div key={zone} className="qhls-missing-zone-card">
                                        <div className="qhls-missing-zone-header">
                                            <span className="qhls-missing-zone-name">{zone}</span>
                                            <span className="qhls-missing-zone-count">{units.length} ശാഖകൾ</span>
                                        </div>
                                        <div className="qhls-missing-units-list">
                                            {units.map((unit, idx) => (
                                                <div key={idx} className="qhls-missing-unit-item">
                                                    {unit}
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    )}
                </>
            )}
        </div>
    );
}

export default QHLSDashboard;
