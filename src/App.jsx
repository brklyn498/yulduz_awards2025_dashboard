import React, { useState, useEffect } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend
} from 'recharts';
import { Users, MapPin, Briefcase, Award, Terminal, LayoutDashboard, ListFilter, Sun, Moon, Download } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { processData } from './utils/dataProcessor';
import { processJuryData, aggregateAllScores } from './utils/juryProcessor';
import ContestantsView from './components/ContestantsView';
import ResultsView from './components/ResultsView';

const COLORS = ['#6366f1', '#a855f7', '#ec4899', '#f43f5e', '#f59e0b', '#10b981', '#06b6d4'];

const StatCard = ({ title, value, icon: Icon, delay, theme }) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ delay }}
    className="glass p-6 rounded-2xl flex items-center space-x-4 shadow-sm"
  >
    <div className={`p-3 rounded-xl ${theme === 'dark' ? 'bg-indigo-500/20' : 'bg-indigo-100'}`}>
      <Icon className="w-6 h-6 text-indigo-500" />
    </div>
    <div>
      <p className={`${theme === 'dark' ? 'text-slate-400' : 'text-slate-500'} text-sm font-medium`}>{title}</p>
      <h3 className={`text-2xl font-bold ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>{value}</h3>
    </div>
  </motion.div>
);

const ChartCard = ({ title, children, delay, theme }) => (
  <motion.div
    initial={{ opacity: 0, scale: 0.95 }}
    animate={{ opacity: 1, scale: 1 }}
    transition={{ delay }}
    className="glass p-6 rounded-2xl overflow-hidden shadow-sm"
  >
    <h3 className={`text-lg font-semibold mb-6 flex items-center gap-2 ${theme === 'dark' ? 'text-white' : 'text-slate-800'}`}>
      <div className="w-1 h-6 bg-indigo-500 rounded-full" />
      {title}
    </h3>
    <div className="h-[350px] w-full">
      {children}
    </div>
  </motion.div>
);

const App = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('list');
  const [theme, setTheme] = useState('dark');
  const [selectedIds, setSelectedIds] = useState([]);
  const [juryResults, setJuryResults] = useState({ results: [], jurorNames: [] });
  const [isResultsLocked, setIsResultsLocked] = useState(true);
  const [scores, setScores] = useState(() => {
    const saved = localStorage.getItem('contestant_scores');
    return saved ? JSON.parse(saved) : {};
  });

  useEffect(() => {
    localStorage.setItem('contestant_scores', JSON.stringify(scores));
  }, [scores]);

  useEffect(() => {
    const workerUrl = import.meta.env.VITE_WORKER_URL;

    // 1. Fetch Main Data
    fetch(`${workerUrl}/main-data`)
      .then(res => res.text())
      .then(csv => {
        const processed = processData(csv);
        setStats(processed);
        setLoading(false);

        // 2. Load jury data via Worker
        if (workerUrl) {
          fetch(`${workerUrl}/juries`)
            .then(res => res.json())
            .then(async (juryNames) => {
              const juryPromises = juryNames.map(async (name) => {
                try {
                  const res = await fetch(`${workerUrl}/jury/${name}`);
                  if (!res.ok) throw new Error('Not found');
                  const text = await res.text();
                  return { jurorName: name.replace(/_/g, ' '), data: processJuryData(text) };
                } catch (e) {
                  console.error(`Error loading jury ${name}:`, e);
                  return null;
                }
              });
              const juries = (await Promise.all(juryPromises)).filter(Boolean);
              const aggregated = aggregateAllScores(juries, processed.raw);
              setJuryResults(aggregated);
            })
            .catch(err => console.warn('Jury manifest not found or empty'));
        }
      })
      .catch(err => {
        console.error('Data error:', err);
        setLoading(false);
      });

    // 3. Fetch Lock Status
    if (workerUrl) {
      fetch(`${workerUrl}/results-lock`)
        .then(res => res.json())
        .then(data => setIsResultsLocked(data.locked))
        .catch(err => console.error('Lock fetch error:', err));
    }
  }, []);

  useEffect(() => {
    document.documentElement.className = theme;
  }, [theme]);

  const toggleTheme = () => setTheme(prev => prev === 'dark' ? 'light' : 'dark');

  const onToggleSelect = (id) => {
    setSelectedIds(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };

  const onScoreChange = (name, score) => {
    setScores(prev => ({
      ...prev,
      [name]: score
    }));
  };

  if (loading) return (
    <div className={`min-h-screen ${theme === 'dark' ? 'bg-[#0f172a]' : 'bg-slate-50'} flex items-center justify-center transition-colors`}>
      <div className="flex flex-col items-center gap-4">
        <div className="w-12 h-12 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
        <p className="text-indigo-500 font-medium">Maʼlumotlar yuklanmoqda...</p>
      </div>
    </div>
  );

  if (!stats) return (
    <div className="min-h-screen bg-[#0f172a] flex items-center justify-center text-red-400">
      Maʼlumotlarni yuklashda xatolik yuz berdi.
    </div>
  );

  return (
    <div className={`min-h-screen ${theme === 'dark' ? 'bg-[#0f172a]' : 'bg-slate-50'} text-slate-50 p-4 md:p-8 transition-colors`}>
      {/* Header */}
      <header className="max-w-7xl mx-auto mb-10 flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex items-center gap-2 text-indigo-500 font-semibold mb-2"
          >
            <Award className="w-5 h-5" />
            <span>YULDUZ TECH AWARDS 2025</span>
          </motion.div>
          <motion.h1
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}
            className={`text-4xl md:text-5xl font-extrabold tracking-tight ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}
          >
            Ishtirokchilar <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-500 to-purple-500">Tahlili</span>
          </motion.h1>
        </div>

        <div className="flex items-center gap-4">
          <button
            onClick={toggleTheme}
            className={`p-3 rounded-2xl border transition-all ${theme === 'dark' ? 'bg-slate-800/50 border-slate-700 text-yellow-400 hover:bg-slate-700' : 'bg-white border-slate-200 text-indigo-600 shadow-sm hover:bg-slate-50'}`}
          >
            {theme === 'dark' ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
          </button>

          <div className={`flex p-1 rounded-2xl border transition-all ${theme === 'dark' ? 'bg-slate-800/50 border-slate-700' : 'bg-white border-slate-200 shadow-sm'}`}>
            <button
              onClick={() => setActiveTab('dashboard')}
              className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-semibold transition-all ${activeTab === 'dashboard' ? 'bg-indigo-600 text-white shadow-lg' : theme === 'dark' ? 'text-slate-400 hover:text-slate-100' : 'text-slate-500 hover:text-slate-900'}`}
            >
              <LayoutDashboard className="w-4 h-4" /> Tahlil
            </button>
            <button
              onClick={() => setActiveTab('list')}
              className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-semibold transition-all ${activeTab === 'list' ? 'bg-indigo-600 text-white shadow-lg' : theme === 'dark' ? 'text-slate-400 hover:text-slate-100' : 'text-slate-500 hover:text-slate-900'}`}
            >
              <ListFilter className="w-4 h-4" /> Ishtirokchilar
            </button>
            <button
              onClick={() => setActiveTab('selected')}
              className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-semibold transition-all ${activeTab === 'selected' ? 'bg-emerald-600 text-white shadow-lg' : theme === 'dark' ? 'text-slate-400 hover:text-slate-100' : 'text-slate-500 hover:text-slate-900'}`}
            >
              <Users className="w-4 h-4" /> Saralanganlar ({selectedIds.length})
            </button>
            <button
              onClick={() => setActiveTab('results')}
              className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-semibold transition-all ${activeTab === 'results' ? 'bg-amber-600 text-white shadow-lg' : theme === 'dark' ? 'text-slate-400 hover:text-slate-100' : 'text-slate-500 hover:text-slate-900'}`}
            >
              <Award className="w-4 h-4" /> Natijalar
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto">
        <AnimatePresence mode="wait">
          {activeTab === 'dashboard' ? (
            <motion.div
              key="dashboard"
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 10 }}
              className="space-y-8"
            >
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                <StatCard title="Jami ishtirokchilar" value={stats.totalParticipants} icon={Users} delay={0.2} theme={theme} />
                <StatCard title="AT yoʻnalishlari" value={stats.fields.length} icon={Terminal} delay={0.4} theme={theme} />
                <StatCard title="Nominatsiyalar" value={stats.nominations.length} icon={Award} delay={0.5} theme={theme} />
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <ChartCard title="Hududlar boʻyicha taqsimot" delay={0.6} theme={theme}>
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={stats.regions.slice(0, 10)} layout="vertical">
                      <CartesianGrid strokeDasharray="3 3" stroke={theme === 'dark' ? '#2d3748' : '#e2e8f0'} horizontal={false} />
                      <XAxis type="number" hide />
                      <YAxis
                        dataKey="name"
                        type="category"
                        stroke={theme === 'dark' ? '#94a3b8' : '#64748b'}
                        fontSize={12}
                        width={150}
                        tickFormatter={(val) => val.length > 20 ? `${val.slice(0, 17)}...` : val}
                      />
                      <Tooltip
                        cursor={{ fill: theme === 'dark' ? '#334155' : '#f1f5f9', opacity: 0.4 }}
                        contentStyle={{
                          backgroundColor: theme === 'dark' ? '#1e293b' : '#ffffff',
                          border: 'none',
                          borderRadius: '12px',
                          color: theme === 'dark' ? '#f8fafc' : '#0f172a'
                        }}
                      />
                      <Bar dataKey="value" fill="#6366f1" radius={[0, 4, 4, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </ChartCard>

                <ChartCard title="AT yoʻnalishlari ulushi" delay={0.7} theme={theme}>
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={stats.fields.slice(0, 7)}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={100}
                        paddingAngle={5}
                        dataKey="value"
                      >
                        {stats.fields.slice(0, 7).map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip
                        contentStyle={{
                          backgroundColor: theme === 'dark' ? '#1e293b' : '#ffffff',
                          border: 'none',
                          borderRadius: '12px',
                          color: theme === 'dark' ? '#f8fafc' : '#0f172a'
                        }}
                      />
                      <Legend
                        layout="horizontal"
                        verticalAlign="bottom"
                        align="center"
                        wrapperStyle={{ paddingTop: '20px' }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </ChartCard>
              </div>
            </motion.div>
          ) : activeTab === 'list' || activeTab === 'selected' ? (
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
            >
              <ContestantsView
                contestants={activeTab === 'selected' ? stats.raw.filter(c => selectedIds.includes(c.id)) : stats.raw}
                options={stats.filterOptions}
                theme={theme}
                selectedIds={selectedIds}
                onToggleSelect={onToggleSelect}
                isSelectionMode={activeTab === 'selected'}
                scores={scores}
                onScoreChange={onScoreChange}
              />
            </motion.div>
          ) : activeTab === 'results' ? (
            <motion.div
              key="results"
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
            >
              {isResultsLocked ? (
                <div className={`text-center py-32 rounded-3xl border border-dashed ${theme === 'dark' ? 'bg-slate-800/20 border-slate-700 text-slate-500' : 'bg-slate-100 border-slate-200 text-slate-400'}`}>
                  <Award className="w-16 h-16 mx-auto mb-4 opacity-20" />
                  <h3 className="text-2xl font-bold mb-2">Natijalar tez orada e'lon qilinadi</h3>
                  <p>Hozirda hakamlar hay'ati a’zolari ishtirokchilarni baholashmoqda.</p>
                </div>
              ) : (
                <ResultsView
                  contestants={juryResults.results}
                  jurorNames={juryResults.jurorNames}
                  theme={theme}
                  categories={stats.filterOptions.categories}
                />
              )}
            </motion.div>
          ) : null}
        </AnimatePresence>
      </main>

      <footer className={`max-w-7xl mx-auto mt-20 pt-8 border-t ${theme === 'dark' ? 'border-slate-800 text-slate-500' : 'border-slate-200 text-slate-400'} text-center text-sm`}>
        &copy; 2025 Yulduz Tech Awards Dashboard. Barcha huquqlar himoyalangan.
      </footer>
    </div>
  );
};

export default App;
