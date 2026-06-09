import React, { useState, useEffect } from 'react';
import './App.css';

const CONTENT_DATA = {
    migration: { title: 'Миграция Птиц', bgColor: "#DFE5F2" },
    statistics: { title: 'Статистика', bgColor: "#FCD7D7" },
    charts: { title: 'Графики', bgColor: "#E0EEF1" },
    about: { title: 'О Проекте', bgColor: "#FFF4E0" }
};

function App() {
    const [activeTab, setActiveTab] = useState('migration');

    const [token, setToken] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [successMessage, setSuccessMessage] = useState('');
    const [birdData, setBirdData] = useState([]);
    const [region, setRegion] = useState('US');

    const [advancedData, setAdvancedData] = useState(null);
    const [analyticsLoading, setAnalyticsLoading] = useState(false);
    const [analyticsError, setAnalyticsError] = useState('');

    const fetchAdvancedAnalytics = async () => {
        setAnalyticsLoading(true);
        setAnalyticsError('');
        try {
            const response = await fetch('http://127.0.0.1:5000/api/advanced-analytics');
            const result = await response.json();

            if (response.ok && result.status === 'success') {
                setAdvancedData(result);
            } else if (result.status === 'empty') {
                setAnalyticsError(result.message);
            } else {
                setAnalyticsError('Не удалось прочитать аналитические метрики.');
            }
        } catch (err) {
            setAnalyticsError('Ошибка подключения к бэкенду. Проверьте Flask.');
        } finally {
            setAnalyticsLoading(false);
        }
    };

    useEffect(() => {
        if (activeTab === 'statistics' || activeTab === 'charts') {
            fetchAdvancedAnalytics();
        }
    }, [activeTab]);

    const handleSyncMigration = async (e) => {
        e.preventDefault();
        if (!token.trim()) {
            setError('Пожалуйста, введите ваш eBird API токен');
            return;
        }
        setLoading(true);
        setError('');
        setSuccessMessage('');
        try {
            const response = await fetch('http://127.0.0.1:5000/api/sync-and-calculate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ api_token: token, region: region }),
            });
            const result = await response.json();
            if (response.ok && result.status === 'success') {
                setSuccessMessage(result.message);
                setBirdData(result.data);
            } else {
                setError(result.message);
            }
        } catch (err) {
            setError('Ошибка бэкенда. Запустите Flask-сервер.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="container">
            <header>
                <p className="heading">Love birds forever</p>
                <div className="buttons">
                    <button className={`custom-btn ${activeTab === 'migration' ? 'active selection' : ''}`} onClick={() => setActiveTab('migration')}>Миграция</button>
                    <button className={`custom-btn ${activeTab === 'statistics' ? 'active noname' : ''}`} onClick={() => setActiveTab('statistics')}>Статистика</button>
                    <button className={`custom-btn ${activeTab === 'charts' ? 'active help' : ''}`} onClick={() => setActiveTab('charts')}>Графики</button>
                    <button className={`custom-btn ${activeTab === 'about' ? 'active desc' : ''}`} onClick={() => setActiveTab('about')}>О проекте</button>
                </div>
            </header>

            {activeTab && (
                <div className="info-panel show" style={{ backgroundColor: CONTENT_DATA[activeTab].bgColor }}>

                    {/* ВКЛАДКА 1: МИГРАЦИЯ */}
                    {activeTab === 'migration' && (
                        <div>
                            <div style={{ display: 'flex', alignItems: 'center', marginBottom: '20px' }}>
                                <img className="pic" src="images/Spark.png" alt="icon" style={{ width: '50px' }} />
                                <p className="heading" style={{ margin: '0 20px' }}>Мониторинг</p>
                                <img className="line" src="images/Container.png" alt="line" style={{ width: '500px' }} />
                            </div>
                            <p className="text">Парсинг живых данных орнитологических станций США и запись в SQLite:</p>
                            <form onSubmit={handleSyncMigration} style={{ margin: '20px 0', display: 'flex', gap: '15px', alignItems: 'center', flexWrap: 'wrap' }}>
                                <input
                                    type="text"
                                    value={token}
                                    onChange={(e) => setToken(e.target.value)}
                                    placeholder="eBird Токен..."
                                    className="neo-input"
                                />

                                {/* НАШ НОВЫЙ СЕЛЕКТ РЕГИОНОВ */}
                                <select
                                    value={region}
                                    onChange={(e) => setRegion(e.target.value)}
                                    className="neo-input"
                                    style={{ width: '200px', cursor: 'pointer' }}
                                >
                                    <option value="KZ">Казахстан (KZ)</option>
                                    <option value="RU">Россия (RU)</option>
                                    <option value="US">США (US)</option>
                                    <option value="UZ">Узбекистан (UZ)</option>
                                    <option value="AM">Армения (AM)</option>
                                </select>

                                <button type="submit" disabled={loading} className="help-sub-btn">
                                    {loading ? 'Расчет...' : 'Запустить'}
                                </button>
                            </form>
                            {error && <p className="text" style={{ color: 'red' }}>{error}</p>}
                            {successMessage && <p className="text" style={{ color: 'green' }}>{successMessage}</p>}

                            {birdData.length > 0 && (
                                <div style={{ marginTop: '20px' }}>
                                    <table style={{ width: '100%', background: 'white', border: '3px solid black', fontFamily: 'Courier Prime Local, monospace' }}>
                                        <thead style={{ background: 'black', color: 'white' }}>
                                            <tr>
                                                <th style={{ padding: '10px' }}>Птица</th>
                                                <th style={{ padding: '10px' }}>Кол-во</th>
                                                <th style={{ padding: '10px' }}>Температура</th>
                                                <th style={{ padding: '10px' }}>Ветер</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {birdData.map((b, i) => (
                                                <tr key={i} style={{ borderBottom: '2px solid black' }}>
                                                    <td style={{ padding: '10px', fontWeight: 'bold' }}>{b.bird_name}</td>
                                                    <td style={{ padding: '10px' }}>{b.total_spotted}</td>
                                                    <td style={{ padding: '10px' }}>{b.avg_temp}°C</td>
                                                    <td style={{ padding: '10px' }}>{b.avg_wind} км/ч</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </div>
                    )}

                    {/* ВКЛАДКА 2: СТАТИСТИКА (PANDAS СЕРВЕРНЫЙ РАСЧЕТ) */}
                    {activeTab === 'statistics' && (
                        <div>
                            <div style={{ display: 'flex', alignItems: 'center', marginBottom: '20px' }}>
                                <img className="pic" src="images/Brutalism.png" alt="icon" style={{ width: '50px' }} />
                                <p className="heading" style={{ margin: '0 20px' }}>Био-Статистика</p>
                                <img className="line" src="images/Container.png" alt="line" style={{ width: '500px' }} />
                            </div>
                            <p className="text">Индекс метеозависимости видов, рассчитанный через корреляцию Пирсона:</p>

                            {analyticsLoading && <p className="text">Pandas обрабатывает базу данных...</p>}
                            {analyticsError && <p className="text" style={{ color: 'red' }}>{analyticsError}</p>}

                            {advancedData && advancedData.statistics && (
                                <div className="stats-grid" style={{ flexDirection: 'column', gap: '15px' }}>
                                    {advancedData.statistics.map((stat, idx) => (
                                        <div key={idx} className="stat-card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                            <div>
                                                <span className="heading" style={{ fontSize: '22px' }}>{stat.bird_name}</span>
                                                <p className="text" style={{ fontSize: '14px', margin: '5px 0 0 0' }}>Записей в базе: {stat.total_records} | Пиковая стая: {stat.max_flock} птиц</p>
                                            </div>
                                            <div style={{ textAlign: 'right' }}>
                                                <div className="number" style={{ color: stat.sensitivity_index > 50 ? '#FF6B6B' : '#27ae60' }}>
                                                    {stat.sensitivity_index}%
                                                </div>
                                                <span className="text" style={{ fontSize: '14px', fontWeight: 'bold' }}>{stat.status_text}</span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}

                    {/* ВКЛАДКА 3: ГРАФИКИ (ДВОЙНОЙ НЕО-ГРАФИК С ПРОГНОЗОМ) */}
                    {activeTab === 'charts' && (
                        <div>
                            <div style={{ display: 'flex', alignItems: 'center', marginBottom: '20px' }}>
                                <img className="pic" src="images/Spark.png" alt="icon" style={{ width: '50px' }} />
                                <p className="heading" style={{ margin: '0 20px' }}>Предиктивные Тренды</p>
                                <img className="line" src="images/Container.png" alt="line" style={{ width: '500px' }} />
                            </div>
                            <p className="text">Сравнение реальной активности перелетов со среднеквадратичным прогнозом NumPy:</p>

                            {analyticsLoading && <p className="text">Построение сетки трендов...</p>}
                            {analyticsError && <p className="text" style={{ color: 'red' }}>{analyticsError}</p>}

                            {advancedData && advancedData.chart_data && (
                                <div>
                                    <div className="neo-chart">
                                        {advancedData.chart_data.map((item, idx) => {
                                            const maxVal = Math.max(...advancedData.chart_data.map(d => Math.max(d.actual, d.predicted)), 1);
                                            const actualHeight = `${(item.actual / maxVal) * 90}%`;
                                            const predictedHeight = `${(item.predicted / maxVal) * 90}%`;

                                            return (
                                                <div key={idx} className="chart-bar-group" style={{ width: '20%' }}>
                                                    <div className="bar-container" style={{ background: '#fcfcfc', display: 'flex', justifyContent: 'center', gap: '8px', padding: '0 5px' }}>
                                                        {/* Столбик РЕАЛЬНОСТЬ */}
                                                        <div className="bar-fill" style={{ height: actualHeight, backgroundColor: '#45B7D1', title: `Реально: ${item.actual}` }}></div>
                                                        {/* Столбик ПРОГНОЗ */}
                                                        <div className="bar-fill" style={{ height: predictedHeight, backgroundColor: '#A388EE', title: `Прогноз: ${item.predicted}` }}></div>
                                                    </div>
                                                    <span className="chart-label" style={{ fontSize: '12px' }}>{item.range}</span>
                                                    <span className="text" style={{ fontSize: '12px', marginTop: '2px', whiteSpace: 'nowrap' }}> Факт: {item.actual} | План: {item.predicted}</span>
                                                </div>
                                            );
                                        })}
                                    </div>
                                    <div className="chart-legend" style={{ marginTop: '15px', gap: '30px' }}>
                                        <div className="legend-item"><span className="legend-dot" style={{ backgroundColor: '#45B7D1' }}></span> Текущие наблюдения (База SQL)</div>
                                        <div className="legend-item"><span className="legend-dot" style={{ backgroundColor: '#A388EE' }}></span> Прогноз на следующий миграционный цикл</div>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    {/* ВКЛАДКА 4: О ПРОЕКТЕ */}
                    {activeTab === 'about' && (
                        <div>
                            <div style={{ display: 'flex', alignItems: 'center', marginBottom: '20px' }}>
                                <img className="pic" src="images/bird.png" alt="icon" style={{ width: '50px' }} />
                                <p className="heading" style={{ margin: '0 20px' }}>О модуле</p>
                                <img className="line" src="images/Container.png" alt="line" style={{ width: '500px' }} />
                            </div>
                            <p className="text">
                                Разработка выполнена в рамках комплексного проекта автоматизации экологического мониторинга.
                            </p>
                            <p className="text" style={{ marginTop: '15px' }}>
                                Архитектура приложения связывает воедино реактивный клиентский слой React (Vite), персистентный реляционный файл базы данных SQLite3, аналитический процессор библиотеки Pandas и статистический аппарат прогнозирования NumPy.
                            </p>
                        </div>
                    )}

                </div>
            )}
        </div>
    );
}

export default App;