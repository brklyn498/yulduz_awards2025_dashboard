import React, { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Award, Trophy, Medal, Download, Filter, Search, X, Users, Info } from 'lucide-react';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';
import { AnimatePresence } from 'framer-motion';

const ResultsView = ({ contestants, jurorNames, theme, categories }) => {
    const [selectedCategory, setSelectedCategory] = useState('');
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedContestant, setSelectedContestant] = useState(null);

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

        // Apply advanced tie-breaking: Total -> 5s -> 4s -> A-Z
        return filtered.sort((a, b) => {
            if (b.cumulativeScore !== a.cumulativeScore) return b.cumulativeScore - a.cumulativeScore;
            if (b.scoreDetails.count5 !== a.scoreDetails.count5) return b.scoreDetails.count5 - a.scoreDetails.count5;
            if (b.scoreDetails.count4 !== a.scoreDetails.count4) return b.scoreDetails.count4 - a.scoreDetails.count4;
            return a.name.localeCompare(b.name);
        });
    }, [contestants, selectedCategory, searchTerm]);

    const topThree = results.slice(0, 3);

    const tieGroups = useMemo(() => {
        const counts = {};
        results.forEach(r => {
            counts[r.cumulativeScore] = (counts[r.cumulativeScore] || 0) + 1;
        });
        return counts;
    }, [results]);

    const getBadgeStyle = (score) => {
        if (tieGroups[score] <= 1) return null;
        if (score >= 18) return 'bg-orange-500/10 text-orange-500 border-orange-500/20';
        if (score >= 15) return 'bg-amber-500/10 text-amber-500 border-amber-500/20';
        if (score >= 12) return 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20';
        if (score >= 10) return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20';
        return 'bg-slate-500/10 text-slate-400 border-slate-500/20';
    };

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
                onClick={() => setSelectedContestant(contestant)}
                className={`glass p-8 rounded-3xl border-2 ${colors[rank]} flex flex-col items-center text-center relative overflow-hidden group hover:scale-105 transition-all cursor-pointer`}
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

                {getBadgeStyle(contestant.cumulativeScore) && (
                    <div className={`mt-3 flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black tracking-widest uppercase border ${getBadgeStyle(contestant.cumulativeScore)}`}>
                        Bir xil ball
                    </div>
                )}

                <div className="mt-4 flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider opacity-0 group-hover:opacity-60 transition-opacity text-indigo-500">
                    <Info className="w-3 h-3" /> Batafsil ballar
                </div>
            </motion.div>
        );
    };

    const ScoreModal = ({ contestant, onClose }) => {
        if (!contestant) return null;

        return (
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-slate-950/80 backdrop-blur-sm"
                onClick={onClose}
            >
                <motion.div
                    initial={{ scale: 0.9, opacity: 0, y: 20 }}
                    animate={{ scale: 1, opacity: 1, y: 0 }}
                    exit={{ scale: 0.9, opacity: 0, y: 20 }}
                    className={`relative w-full max-w-lg rounded-3xl overflow-hidden border shadow-2xl ${theme === 'dark' ? 'bg-slate-900 border-slate-700' : 'bg-white border-slate-200'}`}
                    onClick={(e) => e.stopPropagation()}
                >
                    {/* Header */}
                    <div className={`p-6 border-b flex items-center justify-between ${theme === 'dark' ? 'border-slate-800 bg-slate-800/50' : 'border-slate-100 bg-slate-50/80'}`}>
                        <div>
                            <h2 className={`text-xl font-black uppercase tracking-tight truncate max-w-[300px] ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>
                                {contestant.name}
                            </h2>
                            <p className="text-xs opacity-50 font-medium uppercase tracking-wider">{contestant.category}</p>
                        </div>
                        <button
                            onClick={onClose}
                            className={`p-2 rounded-xl transition-colors ${theme === 'dark' ? 'hover:bg-slate-700 text-slate-400' : 'hover:bg-slate-200 text-slate-500'}`}
                        >
                            <X className="w-6 h-6" />
                        </button>
                    </div>

                    {/* Content */}
                    <div className="p-6 space-y-4 max-h-[60vh] overflow-y-auto custom-scrollbar">
                        {/* Distribution Summary */}
                        {contestant.scoreDetails && (
                            <div className={`p-4 rounded-2xl flex items-center justify-around text-center border shadow-sm ${theme === 'dark' ? 'bg-slate-800/50 border-slate-700/50' : 'bg-slate-50 border-slate-100'}`}>
                                <div>
                                    <div className="text-2xl font-black text-indigo-500">{contestant.scoreDetails.count5}</div>
                                    <div className="text-[10px] uppercase font-bold opacity-50">5 Ball</div>
                                </div>
                                <div className="w-px h-8 bg-slate-500/20" />
                                <div>
                                    <div className="text-2xl font-black text-indigo-400">{contestant.scoreDetails.count4}</div>
                                    <div className="text-[10px] uppercase font-bold opacity-50">4 Ball</div>
                                </div>
                                <div className="w-px h-8 bg-slate-500/20" />
                                <div>
                                    <div className="text-2xl font-black text-slate-400">{Object.values(contestant.juries).filter(s => s < 4 && s > 0).length}</div>
                                    <div className="text-[10px] uppercase font-bold opacity-50">Boshqa</div>
                                </div>
                            </div>
                        )}

                        <div className="grid grid-cols-1 gap-3">
                            {jurorNames.map((name, index) => (
                                <div
                                    key={name}
                                    className={`flex items-center justify-between p-4 rounded-2xl border transition-all ${theme === 'dark' ? 'bg-slate-800/40 border-slate-700/50' : 'bg-slate-50 border-slate-200/50'}`}
                                >
                                    <div className="flex items-center gap-3">
                                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold ${theme === 'dark' ? 'bg-indigo-500/10 text-indigo-400' : 'bg-indigo-600 text-white'}`}>
                                            {index + 1}
                                        </div>
                                        <span className={`font-bold text-sm ${theme === 'dark' ? 'text-slate-200' : 'text-slate-700'}`}>
                                            {name.replace(/_/g, ' ')}
                                        </span>
                                    </div>
                                    <div className={`text-lg font-black ${theme === 'dark' ? 'text-white' : 'text-indigo-600'}`}>
                                        {contestant.juries[name] || 0}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Footer */}
                    <div className={`p-6 border-t flex items-center justify-between ${theme === 'dark' ? 'border-slate-800 bg-slate-800/20' : 'border-slate-100 bg-slate-50/50'}`}>
                        <span className="text-sm font-bold opacity-60 uppercase tracking-widest">Jami To'plangan Ball</span>
                        <div className="px-6 py-2.5 bg-indigo-600 text-white rounded-2xl font-black text-xl shadow-lg shadow-indigo-500/30">
                            {contestant.cumulativeScore}
                        </div>
                    </div>
                </motion.div>
            </motion.div>
        );
    };

    return (
        <div className="space-y-10">
            {/* Controls */}
            <div className="glass p-5 rounded-3xl flex flex-col md:flex-row gap-4 items-stretch md:items-center justify-between shadow-sm">
                <div className="flex flex-col sm:flex-row gap-4 flex-1">
                    <div className="relative flex-1">
                        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                        <input
                            type="text"
                            placeholder="Ism yoki loyiha bo'yicha qidiruv..."
                            className={`w-full border rounded-2xl py-3 pl-11 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all ${theme === 'dark' ? 'bg-slate-800/50 border-slate-700 text-white' : 'bg-white border-slate-200 text-slate-900'}`}
                            value={searchTerm}
                            onChange={e => setSearchTerm(e.target.value)}
                        />
                    </div>

                    <div className="relative min-w-[200px]">
                        <Filter className="absolute left-3.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-500" />
                        <select
                            className={`w-full appearance-none border rounded-2xl pl-10 pr-10 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all ${theme === 'dark' ? 'bg-slate-800/50 border-slate-700 text-white' : 'bg-white border-slate-200 text-slate-900'}`}
                            value={selectedCategory}
                            onChange={e => setSelectedCategory(e.target.value)}
                        >
                            <option value="">Barcha nominatsiyalar</option>
                            {categories.map(c => <option key={c} value={c}>{c}</option>)}
                        </select>
                        <div className="absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none opacity-50">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                        </div>
                    </div>
                </div>

                <button
                    onClick={exportToExcel}
                    className="px-6 py-3 bg-emerald-600 text-white rounded-2xl text-sm font-bold flex items-center justify-center gap-2 hover:bg-emerald-500 active:scale-95 transition-all shadow-lg shadow-emerald-500/20 whitespace-nowrap"
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
                                        <th className="px-6 py-5 w-20">Rank</th>
                                        <th className="px-6 py-5">Ishtirokchi</th>
                                        <th className="px-6 py-5">Nominatsiya</th>
                                        <th className="px-6 py-5 text-center">Hakamlar</th>
                                        <th className="px-6 py-5 text-right font-black text-indigo-500">Jami Ball</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-500/10">
                                    {results.map((c, i) => (
                                        <tr
                                            key={c.id}
                                            onClick={() => setSelectedContestant(c)}
                                            className={`group hover:bg-indigo-600/5 transition-colors cursor-pointer`}
                                        >
                                            <td className="px-6 py-4">
                                                <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-xs ${i < 3 ? 'bg-indigo-600 text-white' : theme === 'dark' ? 'bg-slate-800 text-slate-400' : 'bg-slate-100 text-slate-600'
                                                    }`}>
                                                    {i + 1}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex flex-col">
                                                    <div className="flex items-center gap-2">
                                                        <span className={`font-bold uppercase text-sm ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>{c.name}</span>
                                                        {getBadgeStyle(c.cumulativeScore) && (
                                                            <div className={`flex items-center gap-1 px-1.5 py-0.5 rounded text-[8px] font-black uppercase tracking-tighter border ${getBadgeStyle(c.cumulativeScore)}`}>
                                                                Bir xil ball
                                                            </div>
                                                        )}
                                                    </div>
                                                    <span className="text-[10px] opacity-50 truncate max-w-[200px]">{c.region}</span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-xs font-medium opacity-70">
                                                {c.category}
                                            </td>
                                            <td className="px-6 py-4 text-center">
                                                <div className="flex flex-col items-center gap-1">
                                                    <div className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold ${Object.keys(c.juries).filter(j => c.juries[j] > 0).length === jurorNames.length ? 'bg-emerald-500/10 text-emerald-400' : 'bg-amber-500/10 text-amber-400'}`}>
                                                        <Users className="w-3 h-3" />
                                                        {Object.keys(c.juries).filter(j => c.juries[j] > 0).length} / {jurorNames.length}
                                                    </div>
                                                </div>
                                            </td>
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

            <AnimatePresence>
                {selectedContestant && (
                    <ScoreModal
                        contestant={selectedContestant}
                        onClose={() => setSelectedContestant(null)}
                    />
                )}
            </AnimatePresence>
        </div>
    );
};

export default ResultsView;
