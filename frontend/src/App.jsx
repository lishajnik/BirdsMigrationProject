import React, { useState } from 'react';
import './App.css';

function App() {
    const [token, setToken] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [successMessage, setSuccessMessage] = useState('');
    const [birdData, setBirdData] = useState([]);

    const handleSync = async (e) => {
        e.preventDefault();
        if (!token.trim()) {
            setError('Пожалуйста, введите ваш eBird API токен');
            return;
        }

        setLoading(true);
        setError('');
        setSuccessMessage('');
        setBirdData([]);

        try {
            const response = await fetch('http://127.0.0.1:5000/api/sync-and-calculate', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ api_token: token }),
            });

            const result = await response.json();

            if (response.ok && result.status === 'success') {
                setSuccessMessage(result.message);
                setBirdData(result.data);
            } else {
                setError(result.message || 'Произошла ошибка при обработке данных');
            }
        } catch (err) {
            setError('Не удалось связаться с бэкенд-сервером. Убедитесь, что Flask запущен.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="app-container" >
            <header className="app-header" >
                <h1>Love Bird Forever</h1>
                <p style={{ color: '#7f8c8d', margin: 0 }}>Система миграционного мониторинга птиц и погодного контекста</p>
            </header>

            <main className="app-main">
                <section className="token-section" >
                    <form onSubmit={handleSync} className="token-form">
                        <label htmlFor="token-input">Введите ваш eBird API Токен:</label>
                        <input
                            id="token-input"
                            type="text"
                            value={token}
                            onChange={(e) => setToken(e.target.value)}
                            disabled={loading}
                        />
                        <button type="submit" disabled={loading} className="sync-button" >
                            {loading ? 'Синхронизация и Pandas-анализ...' : 'Запустить синхронизацию'}
                        </button>
                    </form>
                </section>

                {error && <div className="message-box error-box">{error}</div>}
                {successMessage && <div className="message-box success-box">{successMessage}</div>}

                {birdData.length > 0 && (
                    <section className="data-section">
                        <h2>Результаты анализа</h2>
                        <div className="table-responsive">
                            <table className="data-table">
                                <thead>
                                    <tr style={{ background: '#34495e', color: '#fff', textAlign: 'left' }}>
                                        <th style={{ padding: '12px' }}>Название птицы</th>
                                        <th style={{ padding: '12px' }}>Замечено особей (Всего)</th>
                                        <th style={{ padding: '12px' }}>Ср. Температура (°C)</th>
                                        <th style={{ padding: '12px' }}>Ср. Скорость ветра (км/ч)</th>
                                        <th style={{ padding: '12px' }}>Центр. Широта</th>
                                        <th style={{ padding: '12px' }}>Центр. Долгота</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {birdData.map((bird, index) => (
                                        <tr key={index} style={{ borderBottom: '1px solid #ddd', background: index % 2 === 0 ? '#f9f9f9' : '#fff' }}>
                                            <td style={{ padding: '12px' }}><strong>{bird.bird_name}</strong></td>
                                            <td style={{ padding: '12px' }}>{bird.total_spotted}</td>
                                            <td style={{ padding: '12px' }}>{bird.avg_temp} °C</td>
                                            <td style={{ padding: '12px' }}>{bird.avg_wind} км/ч</td>
                                            <td style={{ padding: '12px' }}>{bird.center_lat}</td>
                                            <td style={{ padding: '12px' }}>{bird.center_lng}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </section>
                )}
            </main>
        </div>
    );
}

export default App;