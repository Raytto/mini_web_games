import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    BarElement,
    Title,
    Tooltip,
    Legend,
} from 'chart.js';
import { Line, Bar } from 'react-chartjs-2';
import { getStats } from '../api';

ChartJS.register(
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    BarElement,
    Title,
    Tooltip,
    Legend
);

const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
        legend: {
            position: 'top',
            labels: { color: '#94a3b8' }
        },
        title: { display: false },
    },
    scales: {
        x: { ticks: { color: '#94a3b8' }, grid: { color: 'rgba(148, 163, 184, 0.1)' } },
        y: { ticks: { color: '#94a3b8' }, grid: { color: 'rgba(148, 163, 184, 0.1)' } },
    }
};

function Dashboard() {
    const navigate = useNavigate();
    const [windowHours, setWindowHours] = useState(24);
    const [onlineCount, setOnlineCount] = useState(0);

    const [mainVisits, setMainVisits] = useState({ labels: [], datasets: [] });
    const [uniqueIps, setUniqueIps] = useState({ labels: [], datasets: [] });
    const [gameVisits, setGameVisits] = useState({ labels: [], datasets: [] });

    const loadData = async () => {
        try {
            // Calculate dates
            const end = new Date();
            const start = new Date(end.getTime() - windowHours * 60 * 60 * 1000);

            const startIso = start.toISOString();
            const endIso = end.toISOString();

            // Online count
            const onlineData = await getStats('online');
            setOnlineCount(onlineData.online_count);

            // Main Visits
            const visitsData = await getStats('main-page-visits', {
                start_date: startIso,
                end_date: endIso,
                granularity: windowHours > 48 ? 'day' : 'hour'
            });
            setMainVisits({
                labels: visitsData.map(d => new Date(d.time).toLocaleString()),
                datasets: [{
                    label: 'Main Page Visits',
                    data: visitsData.map(d => d.count),
                    borderColor: '#38bdf8',
                    backgroundColor: 'rgba(56, 189, 248, 0.5)',
                    tension: 0.4
                }]
            });

            // Unique IPs
            const ipsData = await getStats('unique-ips', {
                start_date: startIso,
                end_date: endIso,
                granularity: windowHours > 48 ? 'day' : 'hour'
            });
            setUniqueIps({
                labels: ipsData.map(d => new Date(d.time).toLocaleString()),
                datasets: [{
                    label: 'Unique IPs',
                    data: ipsData.map(d => d.count),
                    borderColor: '#a855f7',
                    backgroundColor: 'rgba(168, 85, 247, 0.5)',
                    tension: 0.4
                }]
            });

            // Game Visits
            const gamesData = await getStats('game-visits', {
                start_date: startIso,
                end_date: endIso
            });
            setGameVisits({
                labels: gamesData.map(d => d.game_name || 'Unknown'),
                datasets: [{
                    label: 'Game Starts',
                    data: gamesData.map(d => d.count),
                    backgroundColor: [
                        'rgba(255, 99, 132, 0.7)',
                        'rgba(54, 162, 235, 0.7)',
                        'rgba(255, 206, 86, 0.7)',
                        'rgba(75, 192, 192, 0.7)',
                        'rgba(153, 102, 255, 0.7)',
                    ],
                }]
            });

        } catch (err) {
            console.error(err);
        }
    };

    useEffect(() => {
        loadData();
        const interval = setInterval(loadData, 60000); // Refresh every minute
        return () => clearInterval(interval);
    }, [windowHours]);

    const handleLogout = () => {
        localStorage.removeItem('token');
        navigate('/login');
    };

    return (
        <div>
            <header className="header">
                <h2>Admin Dashboard</h2>
                <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                    <select
                        className="select-input"
                        value={windowHours}
                        onChange={(e) => setWindowHours(Number(e.target.value))}
                    >
                        <option value={24}>Last 24 Hours</option>
                        <option value={168}>Last 7 Days</option>
                        <option value={720}>Last 30 Days</option>
                    </select>
                    <button className="btn" onClick={handleLogout} style={{ background: '#ef4444', color: 'white' }}>
                        Logout
                    </button>
                </div>
            </header>

            <div className="container">
                {/* Top Cards */}
                <div style={{ marginBottom: '2rem' }}>
                    <div className="card" style={{ display: 'inline-block', minWidth: '200px' }}>
                        <div className="stat-label">Online Users</div>
                        <div className="stat-value">
                            {onlineCount} <span style={{ fontSize: '1rem', color: '#22c55e' }}>● Live</span>
                        </div>
                    </div>
                </div>

                <div className="grid-cols-2">
                    <div className="card">
                        <h3 style={{ marginBottom: '1rem' }}>Main Page Traffic</h3>
                        <div className="chart-container">
                            <Line options={chartOptions} data={mainVisits} />
                        </div>
                    </div>

                    <div className="card">
                        <h3 style={{ marginBottom: '1rem' }}>Unique Visitors (IP)</h3>
                        <div className="chart-container">
                            <Line options={chartOptions} data={uniqueIps} />
                        </div>
                    </div>

                    <div className="card" style={{ gridColumn: '1 / -1' }}>
                        <h3 style={{ marginBottom: '1rem' }}>Game Popularity</h3>
                        <div className="chart-container">
                            <Bar options={chartOptions} data={gameVisits} />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default Dashboard;
