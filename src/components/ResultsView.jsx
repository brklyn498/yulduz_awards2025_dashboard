import React, { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Award, Trophy, Medal, Download, Filter, Search, X, Users } from 'lucide-react';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';

const ResultsView = ({ contestants, jurorNames, theme, categories }) => {
    const [selectedCategory, setSelectedCategory] = useState('');
    const [searchTerm, setSearchTerm] = useState('');

    const results = useMemo(() => {
        let filtered = [...contestants];

        if (selectedCategory) {
            filtered = filtered.filter(c => c.category === selectedCategory);
        }

        if (searchTerm) {
            const lowSearch = searchTerm.toLowerCase();
            filtered = filtered.filter(c =>
                c.name.toLowerCase().includes(lowSearch) ||
                (c.project_info && c.project_info.toLowerCase().includes(lowSearch))
            );
        }

        // The sorting is already done in App.jsx but we re-apply for stability
        return filtered.sort((a, b) => b.cumulativeScore - a.cumulativeScore || a.name.localeCompare(b.name));
    }, [contestants, selectedCategory, searchTerm]);

    const topThree = results.slice(0, 3);

    const exportToExcel = () => {
        const exportData = results.map((c, i) => {
            const row = {
                'Rank': i + 1,
                'Name': c.name,
                'Nomination': c.category,
                'Region': c.region,
                'Cumulative Score': c.cumulativeScore,
            };
            jurorNames.forEach(j => {
                row[j] = c.juries[j] || 0;
            });
            row['Project'] = c.project_info;
            return row;
        });

        const worksheet = XLSX.utils.json_to_sheet(exportData);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, 'Natijalar');
        const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
        const data = new Blob([excelBuffer], { type: 'application/octet-stream' });
        saveAs(data, `Yulduz_Awards_Results_${selectedCategory || 'Barchasi'}_${new Date().toISOString().split('T')[0]}.xlsx`);
    };

    const PodiumCard = ({ contestant, rank, delay }) => {
        const icons = {
            1: <Trophy className="w-10 h-10 text-yellow-400" />,
            2: <Medal className="w-10 h-10 text-slate-300" />,
            3: <Medal className="w-10 h-10 text-amber-600" />
        };

        const colors = {
            1: 'border-yellow-400/50 bg-yellow-400/5',
            2: 'border-slate-300/50 bg-slate-300/5',
            3: 'border-amber-600/50 bg-amber-600/5'
        };

        return (
            <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay }}
                className={`glass p-8 rounded-3xl border-2 ${colors[rank]} flex flex-col items-center text-center relative overflow-hidden group hover:scale-105 transition-all`}
            >
                <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                    {icons[rank]}
                </div>

                <div className={`w-20 h-20 rounded-2xl flex items-center justify-center text-3xl font-black mb-4 ${theme === 'dark' ? 'bg-slate-800 text-indigo-400' : 'bg-white text-indigo-600 shadow-sm'}`}>
                    {rank}
                </div>

                <div className="mb-4">
                    {icons[rank]}
                </div>

                <h3 className={`text-xl font-black uppercase tracking-tight mb-2 ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>{contestant.name}</h3>
                <p className={`text-sm opacity-60 mb-4 line-clamp-2`}>{contestant.category}</p>

                <div className="px-6 py-2 bg-indigo-600 text-white rounded-xl font-bold text-lg shadow-lg shadow-indigo-500/30">
                    {contestant.cumulativeScore} BALL
                </div>
            </motion.div>
        );
    };

    return (
        <div className="space-y-10">
            {/* Controls */}
            <div className="glass p-6 rounded-2xl flex flex-wrap gap-4 items-center justify-between shadow-sm">
                <div className="flex flex-wrap gap-4 flex-1">
                    <div className="relative min-w-[300px] flex-1">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                        <input
                            type="text"
                            placeholder="Ism yoki loyiha bo'yicha qidiruv..."
                            className={`w-full border rounded-xl py-2.5 pl-10 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all ${theme === 'dark' ? 'bg-slate-800/50 border-slate-700 text-white' : 'bg-white border-slate-200 text-slate-900'}`}
                            value={searchTerm}
                            onChange={e => setSearchTerm(e.target.value)}
                        />
                    </div>

                    <select
                        className={`border rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 min-w-[250px] ${theme === 'dark' ? 'bg-slate-800/50 border-slate-700 text-white' : 'bg-white border-slate-200 text-slate-900'}`}
                        value={selectedCategory}
                        onChange={e => setSelectedCategory(e.target.value)}
                    >
                        <option value="">Barcha nominatsiyalar</option>
                        {categories.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                </div>

                <button
                    onClick={exportToExcel}
                    className="px-6 py-2.5 bg-emerald-600 text-white rounded-xl text-sm font-bold flex items-center gap-2 hover:bg-emerald-500 transition-all shadow-lg shadow-emerald-500/20"
                >
                    <Download className="w-4 h-4" /> Excelga saqlash
                </button>
            </div>

            {results.length > 0 ? (
                <>
                    {/* Podium */}
                    {!searchTerm && !selectedCategory && (
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-end">
                            {/* 2nd Place */}
                            {topThree[1] && <PodiumCard contestant={topThree[1]} rank={2} delay={0.2} />}

                            {/* 1st Place */}
                            {topThree[0] && (
                                <div className="md:-mt-10">
                                    <PodiumCard contestant={topThree[0]} rank={1} delay={0.1} />
                                </div>
                            )}

                            {/* 3rd Place */}
                            {topThree[2] && <PodiumCard contestant={topThree[2]} rank={3} delay={0.3} />}
                        </div>
                    )}

                    {/* Table */}
                    <div className="glass rounded-3xl shadow-sm overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse min-w-[900px]">
                                <thead>
                                    <tr className={`${theme === 'dark' ? 'bg-slate-800/50' : 'bg-slate-100'} text-[10px] uppercase tracking-widest font-bold`}>
                                        <th className="px-6 py-5">Rank</th>
                                        <th className="px-6 py-5">Ishtirokchi</th>
                                        <th className="px-6 py-5">Nominatsiya</th>
                                        {jurorNames.map(name => (
                                            <th key={name} className="px-6 py-5 text-center bg-indigo-500/5">{name}</th>
                                        ))}
                                        <th className="px-6 py-5 text-right font-black text-indigo-500">Jami Ball</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-500/10">
                                    {results.map((c, i) => (
                                        <tr key={c.id} className={`group hover:bg-indigo-600/5 transition-colors`}>
                                            <td className="px-6 py-4">
                                                <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-xs ${i < 3 ? 'bg-indigo-600 text-white' : theme === 'dark' ? 'bg-slate-800 text-slate-400' : 'bg-slate-100 text-slate-600'
                                                    }`}>
                                                    {i + 1}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex flex-col">
                                                    <span className={`font-bold uppercase text-sm ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>{c.name}</span>
                                                    <span className="text-[10px] opacity-50 truncate max-w-[200px]">{c.region}</span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-xs font-medium opacity-70">
                                                {c.category}
                                            </td>
                                            {jurorNames.map(name => (
                                                <td key={name} className="px-6 py-4 text-center">
                                                    <span className={`inline-block px-2 py-1 rounded-md text-xs font-bold ${c.juries[name] ? 'bg-indigo-500/10 text-indigo-400' : 'opacity-20'}`}>
                                                        {c.juries[name] || '-'}
                                                    </span>
                                                </td>
                                            ))}
                                            <td className="px-6 py-4 text-right">
                                                <span className="inline-block px-4 py-1.5 bg-indigo-600 text-white rounded-lg font-black shadow-md">
                                                    {c.cumulativeScore}
                                                </span>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </>
            ) : (
                <div className={`text-center py-32 rounded-3xl border border-dashed ${theme === 'dark' ? 'bg-slate-800/20 border-slate-700 text-slate-500' : 'bg-slate-100 border-slate-200 text-slate-400'}`}>
                    <Trophy className="w-16 h-16 mx-auto mb-4 opacity-20" />
                    <h3 className="text-xl font-bold mb-2">Natijalar hozircha mavjud emas</h3>
                    <p>Hakamlar hay'ati baholari yuklanmoqda yoki hali kiritilmagan.</p>
                </div>
            )}
        </div>
    );
};

export default ResultsView;
