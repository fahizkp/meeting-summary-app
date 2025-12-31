import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getDashboardStats, getZones, getMeetingReport } from '../services/api';
import AttendanceSummary from './AttendanceSummary';

const Dashboard = () => {
    const navigate = useNavigate();
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // Filters
    const [selectedZone, setSelectedZone] = useState('All');
    const [zonesList, setZonesList] = useState([]);
    const [dateFilter, setDateFilter] = useState('week'); // week, month, custom
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');

    const [viewMode, setViewMode] = useState('dashboard'); // 'dashboard', 'attendance_sheet', 'attendance_summary'
    const [selectedReport, setSelectedReport] = useState(null);
    const [selectedMeetingData, setSelectedMeetingData] = useState(null);
    const [reportLoading, setReportLoading] = useState(false);

    useEffect(() => {
        loadZones();
        initializeDates('week');
    }, []);

    useEffect(() => {
        if (startDate && endDate) {
            fetchStats();
        }
    }, [selectedZone, startDate, endDate]);

    // Reset view mode when zone changes to 'All' while in attendance_summary view
    useEffect(() => {
        if ((!selectedZone || selectedZone === 'All') && viewMode === 'attendance_summary') {
            setViewMode('dashboard');
        }
    }, [selectedZone, viewMode]);

    const loadZones = async () => {
        try {
            const response = await getZones();
            if (response.success) {
                setZonesList(response.zones.map(z => z.name));
            }
        } catch (e) {
            console.error("Failed to load zones", e);
        }
    };

    const initializeDates = (filterType) => {
        const today = new Date();
        let start = new Date();
        let end = new Date();

        if (filterType === 'week') {
            // Monday of this week
            const day = today.getDay();
            const diff = today.getDate() - day + (day === 0 ? -6 : 1); // adjust when day is sunday
            start.setDate(diff);
        } else if (filterType === 'month') {
            start.setDate(1); // 1st of month
        } else if (filterType === 'custom') {
            // Keep existing or default to month
            return;
        }

        const formatDate = (d) => d.toISOString().split('T')[0];
        setStartDate(formatDate(start));
        setEndDate(formatDate(end));
    };

    const handleDateFilterChange = (filter) => {
        setDateFilter(filter);
        if (filter !== 'custom') {
            initializeDates(filter);
        }
    };

    const fetchStats = async () => {
        setLoading(true);
        try {
            const response = await getDashboardStats(startDate, endDate, selectedZone);
            if (response.success) {
                setStats(response.data);
                setError(null);
            } else {
                setError('Failed to fetch data');
            }
        } catch (err) {
            setError(err.message || 'Error fetching dashboard data');
        } finally {
            setLoading(false);
        }
    };

    const handleViewReport = async (meetingId) => {
        setReportLoading(true);
        try {
            const response = await getMeetingReport(meetingId);
            if (response.success) {
                setSelectedMeetingData(response.meetingData);
                setSelectedReport(response.report);
                setViewMode('report_view');
            } else {
                alert('റിപ്പോർട്ട് ലഭിക്കുന്നതിൽ പിശക്');
            }
        } catch (err) {
            alert('റിപ്പോർട്ട് ലഭിക്കുന്നതിൽ പിശക്: ' + err.message);
        } finally {
            setReportLoading(false);
        }
    };

    const handlePrintReport = () => {
        window.print();
    };

    const formatDate = (dateString) => {
        if (!dateString) return '-';
        const date = new Date(dateString);
        return date.toLocaleDateString('en-IN', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    };

    // --- Renderers ---

    const renderControls = () => (
        <div className="dashboard-controls card">
            <div className="control-group">
                <label>Date Range:</label>
                <div className="btn-group">
                    <button
                        className={dateFilter === 'week' ? 'active' : ''}
                        onClick={() => handleDateFilterChange('week')}
                    >This Week</button>
                    <button
                        className={dateFilter === 'month' ? 'active' : ''}
                        onClick={() => handleDateFilterChange('month')}
                    >This Month</button>
                    <button
                        className={dateFilter === 'custom' ? 'active' : ''}
                        onClick={() => handleDateFilterChange('custom')}
                    >Custom</button>
                </div>
            </div>

            {dateFilter === 'custom' && (
                <div className="control-group dates">
                    <input
                        type="date"
                        value={startDate}
                        onChange={(e) => setStartDate(e.target.value)}
                    />
                    <span>to</span>
                    <input
                        type="date"
                        value={endDate}
                        onChange={(e) => setEndDate(e.target.value)}
                    />
                </div>
            )}

            <div className="control-group">
                <label>Zone:</label>
                <select
                    value={selectedZone}
                    onChange={(e) => setSelectedZone(e.target.value)}
                    className="zone-select"
                >
                    <option value="All">All Zones</option>
                    {zonesList.map(z => <option key={z} value={z}>{z}</option>)}
                </select>
            </div>

            <div className="control-group right">
                <button className="refresh-btn" onClick={fetchStats}>Refresh</button>
            </div>
        </div>
    );

    const renderOverview = () => {
        if (!stats) return null;

        const { totalMeetings, totalMembers, attendanceRegister, noMeetingZones, zonesWithMeetings, consecutiveAbsence, latestLeaves, qhlsMissingBranches, currentWeek, meetingsList } = stats;

        // Calculate Overall Pct
        let totalPresent = 0;
        let grandTotal = 0;
        attendanceRegister.forEach(p => {
            totalPresent += p.present;
            grandTotal += p.total;
        });
        const overallPct = grandTotal > 0 ? ((totalPresent / grandTotal) * 100).toFixed(1) : 0;

        // Time period label based on filter
        const periodLabel = dateFilter === 'month' ? 'ഈ മാസം' : 'ഈ ആഴ്ച';

        // All Zones View - Show simplified dashboard
        if (selectedZone === 'All') {
            return (
                <div className="dashboard-grid">
                    {/* Zones WITHOUT meetings */}
                    <div className="card full-width">
                        <h3>{periodLabel} മീറ്റിംഗ് നടക്കാത്ത മണ്ഡലങ്ങൾ ({noMeetingZones.length})</h3>
                        {noMeetingZones.length === 0 ? (
                            <p className="empty-state success-text">എല്ലാ മണ്ഡലങ്ങളിലും മീറ്റിംഗ് നടന്നു!</p>
                        ) : (
                            <ol className="zone-list warn-list">
                                {noMeetingZones.map(z => (
                                    <li key={z.zoneName}>
                                        {z.zoneName}{z.reason ? ` (${z.reason})` : ''}
                                    </li>
                                ))}
                            </ol>
                        )}
                    </div>

                    {/* Zones WITH meetings */}
                    <div className="card full-width">
                        <h3>{periodLabel} മീറ്റിംഗ് നടന്ന മണ്ഡലങ്ങൾ ({zonesWithMeetings?.length || 0})</h3>
                        {(!zonesWithMeetings || zonesWithMeetings.length === 0) ? (
                            <p className="empty-state">ഒരു മണ്ഡലത്തിലും മീറ്റിംഗ് നടന്നിട്ടില്ല</p>
                        ) : (
                            <ol className="zone-list success-list">
                                {zonesWithMeetings.map(z => (
                                    <li key={z.zoneName}>
                                        {z.zoneName} ({z.meetingCount || 1})
                                    </li>
                                ))}
                            </ol>
                        )}
                    </div>

                    {/* Members with 3+ Consecutive Leaves */}
                    <div className="card full-width">
                        <h3>⚠️ തുടർച്ചയായി 3 മീറ്റിംഗിൽ ലീവ് ആയ മെമ്പർമാർ</h3>
                        {consecutiveAbsence.length === 0 ? (
                            <p className="empty-state">ആരും ഇല്ല</p>
                        ) : (
                            <div className="tags-container">
                                {consecutiveAbsence.map((p, i) => (
                                    <span key={i} className="tag warn">
                                        {p.name} ({p.zone})
                                    </span>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* QHLS Missing Branches - Only show for week filter */}
                    {dateFilter === 'week' && (
                        <div className="card full-width">
                            <h3>QHLS നടക്കാത്ത ശാഖകൾ</h3>
                            {(!qhlsMissingBranches || qhlsMissingBranches.length === 0) ? (
                                <p className="empty-state success-text">എല്ലാ ശാഖകളിലും QHLS നടന്നു!</p>
                            ) : (
                                <div className="tags-container">
                                    {qhlsMissingBranches.map((b, i) => (
                                        <span key={i} className="tag warn">{b.branch}</span>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}
                </div>
            );
        }

        // Specific Zone View - Show detailed dashboard
        // If no meetings in selected period, show message
        if (totalMeetings === 0) {
            const noMeetingMsg = dateFilter === 'month'
                ? 'ഈ മാസം മീറ്റിംഗ് നടന്നിട്ടില്ല'
                : 'ഈ ആഴ്ച മീറ്റിംഗ് നടന്നിട്ടില്ല';
            return (
                <div className="dashboard-grid">
                    <div className="card full-width no-meeting-card">
                        <h3>{noMeetingMsg}</h3>
                        <p className="empty-state">{selectedZone} മണ്ഡലത്തിൽ തിരഞ്ഞെടുത്ത കാലയളവിൽ മീറ്റിംഗ് റിപ്പോർട്ട് ലഭ്യമല്ല</p>
                    </div>
                </div>
            );
        }

        // Month view for specific zone - show meetings table
        if (dateFilter === 'month') {
            return (
                <div className="dashboard-grid">
                    {/* Meeting Count */}
                    <div className="card full-width">
                        <h3>ഈ മാസം മീറ്റിംഗുകൾ: {totalMeetings}</h3>
                    </div>

                    {/* Meetings Table */}
                    <div className="card full-width">
                        <h3>മീറ്റിംഗ് വിവരങ്ങൾ</h3>
                        <div className="table-responsive">
                            <table className="meetings-table">
                                <thead>
                                    <tr>
                                        <th>തീയതി</th>
                                        <th>Week</th>
                                        <th>റിപ്പോർട്ട്</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {meetingsList && meetingsList.map((meeting, i) => (
                                        <tr key={meeting.meetingId || i}>
                                            <td>{formatDate(meeting.date)}</td>
                                            <td>{meeting.week ? `Week ${meeting.week}` : '-'}</td>
                                            <td>
                                                <button
                                                    className="view-btn"
                                                    onClick={() => handleViewReport(meeting.meetingId)}
                                                    disabled={reportLoading}
                                                >
                                                    {reportLoading ? 'Loading...' : 'View'}
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            );
        }

        // Week view for specific zone - show detailed stats
        return (
            <div className="dashboard-grid">
                {/* KPI Cards */}
                <div className="card kpi-card">
                    <h3>Total Meetings</h3>
                    <div className="number">{totalMeetings}</div>
                    <div className="sub-text">in selected range</div>
                </div>
                <div className="card kpi-card">
                    <h3>Active Members</h3>
                    <div className="number">{totalMembers}</div>
                </div>
                <div className="card kpi-card">
                    <h3>Overall Attendance</h3>
                    <div className="number">{overallPct}%</div>
                    <div className="sub-text">{totalPresent} / {grandTotal} attendances</div>
                </div>

                {/* Consecutive Leave */}
                <div className="card full-width">
                    <h3>⚠️ തുടർച്ചയായി 3+ മീറ്റിംഗിൽ ലീവ്</h3>
                    {consecutiveAbsence.length === 0 ? (
                        <p className="empty-state">ആരും ഇല്ല</p>
                    ) : (
                        <div className="table-responsive">
                            <table className="warn-table">
                                <thead>
                                    <tr>
                                        <th>പേര്</th>
                                        <th>തുടർച്ച ലീവുകൾ</th>
                                        <th>അവസാനം ഹാജരായത്</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {consecutiveAbsence.map((p, i) => (
                                        <tr key={i}>
                                            <td>{p.name}</td>
                                            <td>{p.consecutiveLeaves || p.consecutiveAbsences}</td>
                                            <td>{p.lastAttendedDate || 'N/A'}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>

                {/* Latest Leave Details */}
                <div className="card full-width">
                    <h3>അവസാന മീറ്റിംഗ് ലീവ് വിവരങ്ങൾ</h3>
                    {latestLeaves.length === 0 ? (
                        <p className="empty-state">ലീവുകൾ ഇല്ല</p>
                    ) : (
                        <div className="tags-container horizontal">
                            {latestLeaves.map((l, i) => (
                                <div key={i} className="leave-tag">
                                    <span className="name">{l.name}</span>
                                    {l.reason && <span className="reason">({l.reason})</span>}
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Attendance Register (Summary View) */}
                <div className="card full-width">
                    <div className="card-header">
                        <h3>ഹാജർ സംഗ്രഹം</h3>
                        <div className="header-buttons">
                            <button className="btn-link" onClick={() => setViewMode('attendance_summary')}>Weekly View &rarr;</button>
                            <button className="btn-link" onClick={() => setViewMode('attendance_sheet')}>Full Register &rarr;</button>
                        </div>
                    </div>
                    <div className="table-responsive">
                        <table>
                            <thead>
                                <tr>
                                    <th>പേര്</th>
                                    <th>ഹാജർ</th>
                                    <th>സ്കോർ</th>
                                    <th>%</th>
                                </tr>
                            </thead>
                            <tbody>
                                {attendanceRegister.slice(0, 10).map((p, i) => (
                                    <tr key={i}>
                                        <td>{p.name}</td>
                                        <td>
                                            <div style={{ display: 'flex', gap: '5px' }}>
                                                <span style={{ color: 'green' }}>✔ {p.present}</span>
                                                <span style={{ color: 'red' }}>✘ {p.total - p.present}</span>
                                            </div>
                                        </td>
                                        <td>{p.present} / {p.total}</td>
                                        <td>
                                            <span className={`badge ${parseFloat(p.percentage) < 50 ? 'bad' : 'good'}`}>
                                                {p.percentage}%
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                        {attendanceRegister.length > 10 && <div className="more-row">...and {attendanceRegister.length - 10} more</div>}
                    </div>
                </div>
            </div>
        );
    };

    const renderAttendanceSummary = () => {
        // Only render when a specific zone is selected
        if (!selectedZone || selectedZone === 'All') {
            return null;
        }

        return (
            <div className="card full-width">
                <div className="card-header">
                    <button className="btn-back" onClick={() => setViewMode('dashboard')}>&larr; Back to Dashboard</button>
                    <h3>Weekly Attendance Summary</h3>
                </div>
                <AttendanceSummary
                    zoneId={selectedZone}
                    startDate={startDate}
                    endDate={endDate}
                />
            </div>
        );
    };

    const renderAttendanceSheet = () => {
        if (!stats) return null;

        const { attendanceRegister } = stats;

        return (
            <div className="card full-width">
                <div className="card-header">
                    <button className="btn-back" onClick={() => setViewMode('dashboard')}>&larr; Back to Dashboard</button>
                    <h3>Full Attendance Register</h3>
                </div>
                <div className="table-responsive">
                    <table className="register-table">
                        <thead>
                            <tr>
                                <th>Name</th>
                                <th>Zone</th>
                                <th>Total</th>
                                <th>Present</th>
                                <th>Leave</th>
                                <th>Absent</th>
                                <th>%</th>
                            </tr>
                        </thead>
                        <tbody>
                            {attendanceRegister.map((p, i) => (
                                <tr key={i}>
                                    <td><strong>{p.name}</strong></td>
                                    <td>{p.zone}</td>
                                    <td>{p.total}</td>
                                    <td className="success-text">{p.present}</td>
                                    <td className="warn-text">{p.leave}</td>
                                    <td className="error-text">{p.absent}</td>
                                    <td>
                                        <strong>{p.percentage}%</strong>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        );
    };

    const renderReportView = () => {
        if (!selectedReport || !selectedMeetingData) return null;

        return (
            <div className="card full-width report-view">
                <div className="card-header">
                    <button className="btn-back" onClick={() => {
                        setViewMode('dashboard');
                        setSelectedReport(null);
                        setSelectedMeetingData(null);
                    }}>&larr; Back</button>
                    <h3>മീറ്റിംഗ് റിപ്പോർട്ട്</h3>
                    <button className="print-btn" onClick={handlePrintReport}>🖨️ Print</button>
                </div>

                <div className="report-content-wrapper">
                    <div className="report-section">
                        <p><strong>മണ്ഡലം:</strong> {selectedMeetingData.zoneName}</p>
                        <p><strong>തീയതി:</strong> {selectedMeetingData.date}</p>
                        {selectedMeetingData.startTime && <p><strong>സമയം:</strong> {selectedMeetingData.startTime} - {selectedMeetingData.endTime}</p>}
                    </div>

                    <div className="report-section">
                        <h4>പങ്കെടുത്തവർ:</h4>
                        <pre>{selectedReport.attendees || 'ആരുമില്ല'}</pre>
                    </div>

                    <div className="report-section">
                        <h4>ലീവ് ആയവർ:</h4>
                        <pre>{selectedReport.leaveAayavar || 'ആരുമില്ല'}</pre>
                    </div>

                    <div className="report-section">
                        <h4>അജണ്ടകൾ:</h4>
                        <pre>{selectedReport.agenda || 'അജണ്ടകളില്ല'}</pre>
                    </div>

                    <div className="report-section">
                        <h4>തീരുമാനങ്ങൾ:</h4>
                        <pre>{selectedReport.minutes || 'തീരുമാനങ്ങളില്ല'}</pre>
                    </div>

                    <div className="report-section">
                        <h4>QHLS Status:</h4>
                        <pre>{selectedReport.qhlsStatus || 'QHLS ഡാറ്റയില്ല'}</pre>
                    </div>
                </div>
            </div>
        );
    };

    return (
        <div className="container dashboard-container">
            <h2 className="page-title">District Admin Dashboard</h2>
            {dateFilter === 'week' && stats?.currentWeek && (
                <h4 className="week-subtitle">Week {stats.currentWeek}</h4>
            )}
            {dateFilter === 'month' && (
                <h4 className="week-subtitle">
                    {new Date().toLocaleString('ml-IN', { month: 'long' })}
                </h4>
            )}

            {renderControls()}

            {error && <div className="error-msg">{error}</div>}
            {loading ? (
                <div className="loading-spinner">Loading stats...</div>
            ) : (
                <>
                    {viewMode === 'dashboard' && renderOverview()}
                    {viewMode === 'attendance_sheet' && renderAttendanceSheet()}
                    {viewMode === 'attendance_summary' && renderAttendanceSummary()}
                    {viewMode === 'report_view' && renderReportView()}
                </>
            )}

            <style>{`
                .dashboard-container {
                    padding-bottom: 50px;
                    max-width: 1200px;
                    margin: 0 auto;
                }
                .page-title {
                    margin-bottom: 20px;
                    color: #2c3e50;
                }
                .week-subtitle {
                    margin: -10px 0 15px 0;
                    color: #333;
                    font-size: 1rem;
                    font-weight: 600;
                }
                .no-meeting-card {
                    text-align: center;
                    padding: 40px 20px;
                    background: #fff3cd;
                    border: 1px solid #ffeeba;
                }
                .no-meeting-card h3 {
                    color: #856404;
                    margin-bottom: 10px;
                }
                .meetings-table {
                    width: 100%;
                    border-collapse: collapse;
                }
                .meetings-table th,
                .meetings-table td {
                    padding: 12px 15px;
                    text-align: left;
                    border-bottom: 1px solid #eee;
                }
                .meetings-table th {
                    background: #f8f9fa;
                    font-weight: 600;
                    color: #555;
                }
                .view-btn {
                    padding: 6px 16px;
                    background: #3498db;
                    color: white;
                    border: none;
                    border-radius: 4px;
                    cursor: pointer;
                    font-size: 0.9rem;
                }
                .view-btn:hover {
                    background: #2980b9;
                }
                .view-btn:disabled {
                    background: #bdc3c7;
                    cursor: not-allowed;
                }
                .print-btn {
                    padding: 8px 16px;
                    background: #27ae60;
                    color: white;
                    border: none;
                    border-radius: 6px;
                    cursor: pointer;
                    font-size: 0.9rem;
                }
                .print-btn:hover {
                    background: #219a52;
                }
                .report-view .card-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    gap: 15px;
                    margin-bottom: 20px;
                    flex-wrap: wrap;
                }
                .report-content-wrapper {
                    background: #f8f9fa;
                    padding: 20px;
                    border-radius: 8px;
                }
                .report-section {
                    margin-bottom: 20px;
                    padding-bottom: 15px;
                    border-bottom: 1px solid #e0e0e0;
                }
                .report-section:last-child {
                    border-bottom: none;
                    margin-bottom: 0;
                }
                .report-section h4 {
                    margin: 0 0 10px 0;
                    color: #2c3e50;
                }
                .report-section pre {
                    margin: 0;
                    white-space: pre-wrap;
                    font-family: inherit;
                    font-size: 0.95rem;
                    color: #333;
                }
                @media print {
                    .dashboard-controls,
                    .btn-back,
                    .print-btn,
                    nav {
                        display: none !important;
                    }
                    .report-view {
                        box-shadow: none;
                        border: none;
                    }
                }
                .card {
                    background: white;
                    padding: 20px;
                    border-radius: 12px;
                    box-shadow: 0 4px 12px rgba(0,0,0,0.05);
                    border: 1px solid #eee;
                }
                .dashboard-controls {
                    display: flex;
                    flex-wrap: wrap;
                    gap: 20px;
                    align-items: flex-end;
                    margin-bottom: 25px;
                    background: #f8f9fa;
                }
                .control-group {
                    display: flex;
                    flex-direction: column;
                    gap: 5px;
                }
                .control-group.right {
                    margin-left: auto;
                }
                .control-group label {
                    font-size: 0.9rem;
                    color: #666;
                    font-weight: 500;
                }
                .btn-group {
                    display: flex;
                    border: 1px solid #ddd;
                    border-radius: 6px;
                    overflow: hidden;
                }
                .btn-group button {
                    background: white;
                    border: none;
                    padding: 8px 16px;
                    cursor: pointer;
                    border-right: 1px solid #ddd;
                    font-size: 0.9rem;
                    color: black;
                }
                .btn-group button:last-child {
                    border-right: none;
                }
                .btn-group button.active {
                    background: #3498db;
                    color: white;
                }
                .dates {
                    flex-direction: row;
                    align-items: center;
                    gap: 10px;
                }
                .dates input {
                    padding: 8px;
                    border: 1px solid #ddd;
                    border-radius: 4px;
                }
                .zone-select {
                    padding: 8px 12px;
                    border-radius: 4px;
                    border: 1px solid #ddd;
                    min-width: 150px;
                    font-size: 1rem;
                }
                .dashboard-grid {
                    display: grid;
                    grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
                    gap: 20px;
                }
                .full-width {
                    grid-column: 1 / -1;
                }
                .kpi-card {
                    text-align: center;
                    padding: 25px;
                }
                .kpi-card .number {
                    font-size: 2.5rem;
                    font-weight: 800;
                    color: #2c3e50;
                    margin: 10px 0;
                }
                .kpi-card.warn .number {
                    color: #e67e22;
                }
                .sub-text {
                    color: #7f8c8d;
                    font-size: 0.9rem;
                }
                .tags-container {
                    display: flex;
                    flex-wrap: wrap;
                    gap: 10px;
                    margin-top: 15px;
                }
                .tag {
                    padding: 6px 12px;
                    background: #eee;
                    border-radius: 20px;
                    font-size: 0.9rem;
                }
                .tag.warn {
                    background: #fff3cd;
                    color: #856404;
                    border: 1px solid #ffeeba;
                }
                .tag.success {
                    background: #d4edda;
                    color: #155724;
                    border: 1px solid #c3e6cb;
                }
                .zone-list {
                    margin: 15px 0 0 0;
                    padding-left: 25px;
                }
                .zone-list li {
                    padding: 4px 0;
                    font-size: 0.95rem;
                    color: #333;
                }
                .leave-tag {
                    display: flex;
                    align-items: center;
                    gap: 8px;
                    background: #f8f9fa;
                    padding: 8px 12px;
                    border-radius: 8px;
                    border: 1px solid #eee;
                }
                .leave-tag .name {
                    font-weight: 600;
                }
                .leave-tag .reason {
                    color: #e74c3c;
                    font-style: italic;
                }
                .zone-badge {
                    font-size: 0.75rem;
                    background: #e1ecf4;
                    color: #39739d;
                    padding: 2px 6px;
                    border-radius: 4px;
                }
                .table-responsive {
                    overflow-x: auto;
                    margin-top: 15px;
                }
                table {
                    width: 100%;
                    border-collapse: collapse;
                }
                th, td {
                    padding: 12px 15px;
                    text-align: left;
                    border-bottom: 1px solid #eee;
                }
                th {
                    font-weight: 600;
                    color: #7f8c8d;
                    font-size: 0.9rem;
                    text-transform: uppercase;
                    background: #fcfcfc;
                }
                .warn-table th {
                    color: #856404;
                    background: #fff3cd;
                }
                .badge {
                    padding: 4px 8px;
                    border-radius: 4px;
                    font-weight: bold;
                    font-size: 0.85rem;
                }
                .badge.good {
                    background: #d4edda;
                    color: #155724;
                }
                .badge.bad {
                    background: #f8d7da;
                    color: #721c24;
                }
                .card-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                }
                .header-buttons {
                    display: flex;
                    gap: 15px;
                }
                .btn-link {
                    background: none;
                    border: none;
                    color: #3498db;
                    cursor: pointer;
                    font-weight: 600;
                }
                .btn-back {
                    background: #eee;
                    border: none;
                    padding: 6px 12px;
                    border-radius: 4px;
                    cursor: pointer;
                }
                .error-msg {
                    background: #f8d7da;
                    color: #721c24;
                    padding: 15px;
                    border-radius: 8px;
                    margin-bottom: 20px;
                }
                .loading-spinner {
                    text-align: center;
                    padding: 40px;
                    color: #666;
                    font-size: 1.1rem;
                }
                .success-text { color: #27ae60; font-weight: bold; }
                .warn-text { color: #f39c12; font-weight: bold; }
                .error-text { color: #c0392b; font-weight: bold; }
                .more-row {
                    text-align: center;
                    padding: 10px;
                    color: #888;
                    font-style: italic;
                }
                .refresh-btn {
                    padding: 10px 20px;
                    background: #27ae60;
                    color: white;
                    border: none;
                    border-radius: 6px;
                    cursor: pointer;
                    font-weight: 600;
                }
                @media (max-width: 768px) {
                    .dashboard-controls {
                        flex-direction: column;
                        align-items: stretch;
                    }
                    .control-group.right {
                        margin-left: 0;
                    }
                    .dates {
                        flex-direction: column;
                    }
                    .dates input {
                        width: 100%;
                    }
                }
            `}</style>
        </div>
    );
};

export default Dashboard;
