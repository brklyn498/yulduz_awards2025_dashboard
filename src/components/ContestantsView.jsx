import React, { useState, useMemo } from 'react';
import { Search, Filter, X, ExternalLink, MapPin, Briefcase, Award, Terminal, Bookmark, BookmarkCheck, Download, LayoutGrid, List, ListFilter } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';
import { flaggedContestants, competitiveContestants, reserveContestants, FLAGGED_REASON, COMPETITIVE_LABEL, RESERVE_LABEL } from '../data/flaggedContestants';

const Modal = ({ contestant, onClose, theme, isSelected, onToggleSelect, score, onScoreChange }) => {
    if (!contestant) return null;

    const [translations, setTranslations] = useState(null);
    const [isTranslating, setIsTranslating] = useState(false);
    const [showTranslated, setShowTranslated] = useState(false);

    const translateContent = async () => {
        if (translations) {
            setShowTranslated(!showTranslated);
            return;
        }

        setIsTranslating(true);
        try {
            const contentToTranslate = {
                occupation: contestant.occupation,
                experience: contestant.experience,
                purpose: contestant.purpose,
                project_info: contestant.project_info,
                benefit: contestant.benefit,
                category: contestant.category,
                raw_region: contestant.raw_region
            };

            const response = await fetch("https://yulduz-awards-proxy.brklyn498.workers.dev", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    "model": "nvidia/nemotron-3-nano-30b-a3b:free",
                    "messages": [
                        {
                            "role": "system",
                            "content": "You are a professional translator. Translate the following JSON object values from Uzbek to Russian. Keep the keys identical. Return ONLY raw JSON. Do NOT use markdown code blocks, backticks, or any other formatting."
                        },
                        {
                            "role": "user",
                            "content": JSON.stringify(contentToTranslate)
                        }
                    ]
                })
            });

            const data = await response.json();
            let content = data.choices[0].message.content.trim();

            // Sanitize: Remove markdown code blocks if present
            if (content.startsWith('```')) {
                content = content.replace(/^```[a-z]*\n/i, '').replace(/\n```$/, '').trim();
            }

            const translatedJson = JSON.parse(content);
            setTranslations(translatedJson);
            setShowTranslated(true);
        } catch (error) {
            console.error("Translation error:", error);
            alert("Tarjima qilishda xatolik yuz berdi. Iltimos qaytadan urinib ko'ring.");
        } finally {
            setIsTranslating(false);
        }
    };

    const isFlagged = flaggedContestants.includes(contestant.name);
    const isReserve = reserveContestants.includes(contestant.name);
    const isCompetitive = competitiveContestants.includes(contestant.name);

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
            onClick={onClose}
        >
            <motion.div
                initial={{ scale: 0.9, opacity: 0, y: 20 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                exit={{ scale: 0.9, opacity: 0, y: 20 }}
                className={`glass w-full max-w-5xl max-h-[90vh] overflow-y-auto rounded-3xl p-8 shadow-2xl ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}
                onClick={e => e.stopPropagation()}
            >
                <div className="flex justify-between items-start mb-8">
                    <div className="flex items-center gap-6">
                        <div className={`w-20 h-20 rounded-2xl flex items-center justify-center text-3xl font-black shadow-inner ${theme === 'dark' ? 'bg-slate-800 text-indigo-400' : 'bg-slate-100 text-indigo-600'}`}>
                            {contestant.name.split(' ').map(n => n[0]).join('')}
                        </div>
                        <div>
                            <div className="flex items-center gap-3 mb-1">
                                <h3 className="text-3xl font-black uppercase tracking-tight">{contestant.name}</h3>
                                {isFlagged && <div className="px-2 py-0.5 bg-red-500/10 text-red-500 text-[10px] font-bold rounded-lg border border-red-500/20">{FLAGGED_REASON}</div>}
                                {isCompetitive && <div className="px-2 py-0.5 bg-indigo-500/10 text-indigo-500 text-[10px] font-bold rounded-lg border border-indigo-500/20">{COMPETITIVE_LABEL}</div>}
                                {isReserve && <div className="px-2 py-0.5 bg-amber-500/10 text-amber-500 text-[10px] font-bold rounded-lg border border-amber-500/20">{RESERVE_LABEL}</div>}
                            </div>
                            <div className="flex items-center gap-4 text-sm font-medium opacity-60">
                                <span className="flex items-center gap-1.5"><MapPin className="w-4 h-4" /> {contestant.region}</span>
                                <span className="flex items-center gap-1.5"><Briefcase className="w-4 h-4" /> {contestant.age} yosh</span>
                            </div>
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => onToggleSelect(contestant.id)}
                            className={`p-2.5 rounded-xl transition-all border ${isSelected ? 'bg-emerald-600 text-white border-emerald-500 shadow-lg shadow-emerald-500/20' : theme === 'dark' ? 'bg-slate-800 border-slate-700 text-slate-400 hover:border-indigo-500/50' : 'bg-white border-slate-200 text-slate-500 hover:border-indigo-500'}`}
                        >
                            {isSelected ? <BookmarkCheck className="w-6 h-6" /> : <Bookmark className="w-6 h-6" />}
                        </button>
                        <button onClick={onClose} className={`p-2.5 rounded-xl transition-colors ${theme === 'dark' ? 'hover:bg-slate-700/50' : 'hover:bg-slate-100'}`}>
                            <X className="w-6 h-6" />
                        </button>
                    </div>
                </div>

                {/* Subtle Translation Button */}
                <div className="flex justify-center mb-8">
                    <button
                        onClick={translateContent}
                        disabled={isTranslating}
                        className={`
                            group flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-bold transition-all active:scale-95
                            ${showTranslated
                                ? 'bg-purple-600 text-white shadow-md'
                                : 'bg-indigo-600/10 text-indigo-500 border border-indigo-500/20 hover:bg-indigo-600 hover:text-white'
                            }
                            disabled:opacity-50 disabled:cursor-not-allowed
                        `}
                    >
                        {isTranslating ? (
                            <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                        ) : (
                            <Award className="w-4 h-4" />
                        )}
                        <span>{showTranslated ? 'Asl matn (UZ)' : 'Перевод (RU)'}</span>
                    </button>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
                    <div className="space-y-8">
                        <section>
                            <h4 className="text-indigo-500 font-bold mb-3 flex items-center gap-2 text-sm uppercase tracking-widest">
                                <Briefcase className="w-4 h-4" /> Faoliyat va Tajriba
                            </h4>
                            <div className="space-y-4">
                                <div>
                                    <h5 className="text-[10px] uppercase font-bold text-slate-500 mb-1">Hozirgi faoliyati</h5>
                                    <p className={`${theme === 'dark' ? 'text-slate-300' : 'text-slate-700'} leading-relaxed text-sm`}>
                                        {showTranslated ? translations?.occupation : contestant.occupation}
                                    </p>
                                </div>
                                <div className={`p-4 rounded-2xl border ${theme === 'dark' ? 'bg-slate-800/30 border-slate-700' : 'bg-slate-50 border-slate-200'}`}>
                                    <h5 className="text-[10px] uppercase font-bold text-slate-500 mb-2">Manzil (Asl ma’lumot)</h5>
                                    <p className={`text-sm mb-4 ${theme === 'dark' ? 'text-slate-300' : 'text-slate-700'}`}>
                                        {showTranslated ? translations?.raw_region : contestant.raw_region}
                                    </p>

                                    <h5 className="text-[10px] uppercase font-bold text-slate-500 mb-2">AT Tajribasi</h5>
                                    <p className={`text-sm ${theme === 'dark' ? 'text-slate-300' : 'text-slate-700'} whitespace-pre-wrap`}>
                                        {showTranslated ? translations?.experience : contestant.experience}
                                    </p>
                                </div>
                            </div>
                        </section>

                        {(contestant.purpose || (showTranslated && translations?.purpose)) && (
                            <section>
                                <h4 className="text-purple-500 font-bold mb-3 flex items-center gap-2 text-sm uppercase tracking-widest">
                                    Ishtirok etishdan maqsad
                                </h4>
                                <div className={`p-5 rounded-2xl border ${theme === 'dark' ? 'bg-purple-500/5 border-purple-500/10 text-slate-300' : 'bg-purple-50 border-purple-100 text-slate-700'} text-sm leading-relaxed whitespace-pre-wrap italic`}>
                                    "{showTranslated ? translations?.purpose : contestant.purpose}"
                                </div>
                            </section>
                        )}

                        {contestant.files && (
                            <section>
                                <h4 className="text-emerald-500 font-bold mb-3 text-sm uppercase tracking-widest">Ilova qilingan fayllar</h4>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                    {contestant.files.split(',').map((link, i) => {
                                        const cleanLink = link.trim();
                                        if (!cleanLink) return null;
                                        return (
                                            <a
                                                key={i}
                                                href={cleanLink.startsWith('http') ? cleanLink : `https://${cleanLink}`}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className={`inline-flex items-center justify-between px-4 py-3 rounded-xl text-xs font-semibold transition-all border ${theme === 'dark' ? 'bg-slate-800 border-slate-700 hover:bg-slate-700 text-indigo-400' : 'bg-white border-slate-200 hover:border-indigo-500 text-indigo-600 shadow-sm'}`}
                                            >
                                                <span className="truncate max-w-[150px]">Material #{i + 1}</span>
                                                <ExternalLink className="w-3 h-3" />
                                            </a>
                                        );
                                    })}
                                </div>
                            </section>
                        )}
                    </div>

                    <div className="space-y-8">
                        <section>
                            <h4 className="text-indigo-500 font-bold mb-3 flex items-center gap-2 text-sm uppercase tracking-widest">
                                <Award className="w-4 h-4" /> Tanlangan Nominatsiya
                            </h4>
                            <div className="space-y-4">
                                <div className={`p-4 rounded-2xl border ${theme === 'dark' ? 'bg-slate-800/30 border-slate-700' : 'bg-slate-50 border-slate-200'}`}>
                                    <p className={`text-sm ${theme === 'dark' ? 'text-slate-300' : 'text-slate-700'}`}>
                                        {showTranslated ? translations?.category : contestant.category}
                                    </p>
                                </div>
                                {contestant.field && (
                                    <div>
                                        <h5 className="text-[10px] uppercase font-bold text-slate-500 mb-1">AT Yo‘nalishi</h5>
                                        <p className={`${theme === 'dark' ? 'text-slate-300' : 'text-slate-700'} leading-relaxed text-sm`}>{contestant.field}</p>
                                    </div>
                                )}
                            </div>
                        </section>

                        <section>
                            <h4 className="text-indigo-500 font-bold mb-4 text-sm uppercase tracking-widest">Loyiha tahlili</h4>
                            <div className="space-y-8">
                                <div>
                                    <h5 className="text-[10px] uppercase font-bold text-slate-500 mb-2">Taqdim etayotgan loyihasi</h5>
                                    <div className={`${theme === 'dark' ? 'text-slate-200' : 'text-slate-800'} leading-relaxed text-sm whitespace-pre-wrap p-4 rounded-2xl bg-indigo-500/5 border border-indigo-500/10`}>
                                        {showTranslated ? translations?.project_info : contestant.project_info}
                                    </div>
                                </div>
                                <div>
                                    <h5 className="text-[10px] uppercase font-bold text-slate-500 mb-2">Loyihaning yangiligi va ijtimoiy foydasi</h5>
                                    <div className={`${theme === 'dark' ? 'text-indigo-100' : 'text-indigo-900'} leading-relaxed text-sm whitespace-pre-wrap p-5 rounded-2xl bg-indigo-500/10 border border-indigo-500/20`}>
                                        {showTranslated ? translations?.benefit : contestant.benefit}
                                    </div>
                                </div>
                            </div>
                        </section>

                        <section className="pt-6 border-t border-slate-500/10">
                            <div className="flex flex-wrap items-center justify-between gap-6">
                                <div>
                                    <h5 className="text-[10px] uppercase font-bold text-slate-500 mb-3 tracking-widest">Loyiha Bahosi (1-5)</h5>
                                    <div className="flex gap-2">
                                        {[1, 2, 3, 4, 5].map((s) => (
                                            <button
                                                key={s}
                                                onClick={() => onScoreChange(contestant.name, s)}
                                                className={`w-10 h-10 rounded-xl flex items-center justify-center text-sm font-bold transition-all border ${score === s ? 'bg-indigo-600 text-white border-indigo-500 shadow-lg shadow-indigo-500/20' : theme === 'dark' ? 'bg-slate-800 border-slate-700 text-slate-400 hover:border-indigo-500/50' : 'bg-white border-slate-200 text-slate-500 hover:border-indigo-500'}`}
                                            >
                                                {s}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                                <div>
                                    <h5 className="text-[10px] uppercase font-bold text-slate-500 mb-3 tracking-widest">Bog'lanish ma'lumotlari</h5>
                                    <div className={`px-4 py-2 rounded-lg font-mono text-sm ${theme === 'dark' ? 'bg-slate-800 text-indigo-400' : 'bg-slate-100 text-indigo-600'}`}>
                                        {contestant.phone}
                                    </div>
                                </div>
                            </div>
                        </section>
                    </div>
                </div>
            </motion.div >
        </motion.div >
    );
};

const ContestantsView = ({ contestants, options, theme, selectedIds = [], onToggleSelect, isSelectionMode, scores = {}, onScoreChange }) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [experienceSearch, setExperienceSearch] = useState('');
    const [viewMode, setViewMode] = useState('card'); // 'card' or 'list'
    const [filters, setFilters] = useState({
        ageGroup: '',
        hasFiles: '',
        group: 'competitive'
    });
    const [selectedContestant, setSelectedContestant] = useState(null);

    const filteredData = useMemo(() => {
        return contestants.filter(c => {
            const name = (c.name || '').toLowerCase();
            const normName = (c.normalized_name || '').toLowerCase();
            const search = searchTerm.toLowerCase();

            const matchesSearch = !searchTerm || name.includes(search) || normName.includes(search) || (c.project_info || '').toLowerCase().includes(search);
            const matchesExperience = !experienceSearch || (c.experience || '').toLowerCase().includes(experienceSearch.toLowerCase());
            const matchesRegion = !filters.region || c.region === filters.region;
            const matchesCategory = !filters.category || c.category === filters.category;
            const matchesOccupation = !filters.occupation || c.occupation === filters.occupation;

            let matchesAge = true;
            if (filters.ageGroup) {
                const age = c.age;
                if (filters.ageGroup === 'under18') matchesAge = age < 18;
                else if (filters.ageGroup === '18-25') matchesAge = age >= 18 && age <= 25;
                else if (filters.ageGroup === '26-35') matchesAge = age >= 26 && age <= 35;
                else if (filters.ageGroup === '35plus') matchesAge = age > 35;
            }

            let matchesFiles = true;
            if (filters.hasFiles === 'yes') matchesFiles = c.files && c.files.trim() !== '';
            if (filters.hasFiles === 'no') matchesFiles = !c.files || c.files.trim() === '';

            const isFlagged = flaggedContestants.includes(c.name);
            const isCompetitive = competitiveContestants.includes(c.name);
            const isReserve = reserveContestants.includes(c.name);

            let matchesGroup = true;
            if (filters.group === 'competitive') matchesGroup = isCompetitive;
            else if (filters.group === 'reserve') matchesGroup = isReserve;
            else if (filters.group === 'flagged') matchesGroup = isFlagged;

            return matchesSearch && matchesExperience && matchesRegion && matchesCategory && matchesOccupation && matchesAge && matchesFiles && matchesGroup;
        });
    }, [contestants, searchTerm, experienceSearch, filters]);

    const exportToExcel = () => {
        const exportData = filteredData.map((c, i) => ({
            '#': i + 1,
            'Ism sharifi': c.name,
            'Yoshi': c.age || 'Nomaʼlum',
            'Hududi': c.region,
            'Aniq manzili': c.raw_region,
            'Faoliyati': c.occupation,
            'Nominatsiyasi': c.category,
            'Tajribasi': c.experience,
            'IT Yoʻnalishi': c.field,
            'Ishtirok etishdan maqsadi': c.purpose,
            'Loyihasi': c.project_info,
            'Yangiligi va foydasi': c.benefit,
            'Fayllar': c.files,
            'Telefon': c.phone,
            'Ball (Scoring)': scores[c.name] || 0
        }));

        const worksheet = XLSX.utils.json_to_sheet(exportData);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, 'Saralanganlar');

        // Auto-size columns (basic)
        const colWidths = Object.keys(exportData[0] || {}).map(k => ({ wch: Math.max(k.length + 5, 15) }));
        worksheet['!cols'] = colWidths;

        const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
        const data = new Blob([excelBuffer], { type: 'application/octet-stream' });
        saveAs(data, `Yulduz_Awards_Selected_${new Date().toISOString().split('T')[0]}.xlsx`);
    };

    const exportNamesOnly = () => {
        const namesList = filteredData.map((c, i) => `${i + 1}. ${c.name}`).join('\n');
        const blob = new Blob([namesList], { type: 'text/plain;charset=utf-8' });
        saveAs(blob, `Yulduz_Awards_Ismlar_${new Date().toISOString().split('T')[0]}.txt`);
    };

    return (
        <div className="space-y-8">
            {/* Filters Header */}
            <div className="glass p-6 rounded-2xl space-y-6 shadow-sm">
                <div className="flex justify-between items-center pb-4 border-b border-slate-500/10 gap-4">
                    <h3 className={`text-xl font-bold flex items-center gap-2 ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>
                        <ListFilter className="w-5 h-5 text-indigo-500" />
                        {isSelectionMode ? 'Saralangan roʻyxat' : 'Ishtirokchilar filtri'}
                    </h3>

                    <div className="flex items-center gap-4">
                        {/* View Toggle */}
                        <div className={`flex p-1 rounded-xl border ${theme === 'dark' ? 'bg-slate-800/50 border-slate-700' : 'bg-slate-100 border-slate-200'}`}>
                            <button
                                onClick={() => setViewMode('card')}
                                className={`p-1.5 rounded-lg transition-all ${viewMode === 'card' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-500 hover:text-slate-900'}`}
                                title="Card View"
                            >
                                <LayoutGrid className="w-4 h-4" />
                            </button>
                            <button
                                onClick={() => setViewMode('list')}
                                className={`p-1.5 rounded-lg transition-all ${viewMode === 'list' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-500 hover:text-slate-900'}`}
                                title="List View"
                            >
                                <List className="w-4 h-4" />
                            </button>
                        </div>

                        {isSelectionMode && filteredData.length > 0 && (
                            <div className="flex gap-2">
                                <button
                                    onClick={exportNamesOnly}
                                    className="px-6 py-2 bg-indigo-600 text-white rounded-xl text-sm font-bold flex items-center gap-2 hover:bg-indigo-500 transition-all shadow-lg shadow-indigo-500/20"
                                >
                                    <List className="w-4 h-4" /> Ismlarni saqlash
                                </button>
                                <button
                                    onClick={exportToExcel}
                                    className="px-6 py-2 bg-emerald-600 text-white rounded-xl text-sm font-bold flex items-center gap-2 hover:bg-emerald-500 transition-all shadow-lg shadow-emerald-500/20"
                                >
                                    <Download className="w-4 h-4" /> Excelga saqlash
                                </button>
                            </div>
                        )}
                    </div>
                </div>

                <div className="flex flex-wrap gap-2 pt-2">
                    <button
                        onClick={() => setFilters(prev => ({ ...prev, group: 'competitive' }))}
                        className={`px-6 py-2.5 rounded-xl text-sm font-bold transition-all border ${filters.group === 'competitive' ? 'bg-indigo-600 text-white border-indigo-500 shadow-lg shadow-indigo-500/20' : 'bg-slate-500/10 text-slate-500 border-transparent hover:bg-slate-500/20'}`}
                    >
                        {COMPETITIVE_LABEL} ({contestants.filter(c => competitiveContestants.includes(c.name)).length})
                    </button>
                    <button
                        onClick={() => setFilters(prev => ({ ...prev, group: 'reserve' }))}
                        className={`px-6 py-2.5 rounded-xl text-sm font-bold transition-all border ${filters.group === 'reserve' ? 'bg-amber-600 text-white border-amber-500 shadow-lg shadow-amber-500/20' : 'bg-slate-500/10 text-slate-500 border-transparent hover:bg-slate-500/20'}`}
                    >
                        {RESERVE_LABEL} ({contestants.filter(c => reserveContestants.includes(c.name)).length})
                    </button>
                    <button
                        onClick={() => setFilters(prev => ({ ...prev, group: 'flagged' }))}
                        className={`px-6 py-2.5 rounded-xl text-sm font-bold transition-all border ${filters.group === 'flagged' ? 'bg-red-600 text-white border-red-500 shadow-lg shadow-red-500/20' : 'bg-slate-500/10 text-slate-500 border-transparent hover:bg-slate-500/20'}`}
                    >
                        {FLAGGED_REASON} ({contestants.filter(c => flaggedContestants.includes(c.name)).length})
                    </button>
                    <button
                        onClick={() => setFilters(prev => ({ ...prev, group: '' }))}
                        className={`px-6 py-2.5 rounded-xl text-sm font-bold transition-all border ${filters.group === '' ? 'bg-slate-600 text-white border-slate-500 shadow-lg' : 'bg-slate-500/10 text-slate-500 border-transparent hover:bg-slate-500/20'}`}
                    >
                        Barchasi ({contestants.length})
                    </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                        <input
                            type="text"
                            placeholder="Ism yoki loyiha..."
                            className={`w-full border rounded-xl py-2.5 pl-10 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all ${theme === 'dark' ? 'bg-slate-800/50 border-slate-700 text-white' : 'bg-white border-slate-200 text-slate-900'}`}
                            value={searchTerm}
                            onChange={e => setSearchTerm(e.target.value)}
                        />
                    </div>

                    <div className="relative">
                        <Terminal className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                        <input
                            type="text"
                            placeholder="IT Tajribasi..."
                            className={`w-full border rounded-xl py-2.5 pl-10 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all ${theme === 'dark' ? 'bg-slate-800/50 border-slate-700 text-white' : 'bg-white border-slate-200 text-slate-900'}`}
                            value={experienceSearch}
                            onChange={e => setExperienceSearch(e.target.value)}
                        />
                    </div>

                    <select
                        className={`border rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 ${theme === 'dark' ? 'bg-slate-800/50 border-slate-700 text-white' : 'bg-white border-slate-200 text-slate-900'}`}
                        value={filters.region}
                        onChange={e => setFilters(prev => ({ ...prev, region: e.target.value }))}
                    >
                        <option value="">Hudud: Barchasi</option>
                        {options.regions.map(r => <option key={r} value={r}>{r}</option>)}
                    </select>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 border-t border-slate-500/10 pt-4">
                    <select
                        className={`border rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 ${theme === 'dark' ? 'bg-slate-800/50 border-slate-700 text-white' : 'bg-white border-slate-200 text-slate-900'}`}
                        value={filters.occupation}
                        onChange={e => setFilters(prev => ({ ...prev, occupation: e.target.value }))}
                    >
                        <option value="">Faoliyat: Barchasi</option>
                        {options.occupations.map(o => <option key={o} value={o}>{o}</option>)}
                    </select>

                    <select
                        className={`border rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 ${theme === 'dark' ? 'bg-slate-800/50 border-slate-700 text-white' : 'bg-white border-slate-200 text-slate-900'}`}
                        value={filters.ageGroup}
                        onChange={e => setFilters(prev => ({ ...prev, ageGroup: e.target.value }))}
                    >
                        <option value="">Yoshi: Barchasi</option>
                        <option value="under18">18 yoshgacha</option>
                        <option value="18-25">18-25 yosh</option>
                        <option value="26-35">26-35 yosh</option>
                        <option value="35plus">35 yoshdan yuqori</option>
                    </select>

                    <select
                        className={`border rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 ${theme === 'dark' ? 'bg-slate-800/50 border-slate-700 text-white' : 'bg-white border-slate-200 text-slate-900'}`}
                        value={filters.hasFiles}
                        onChange={e => setFilters(prev => ({ ...prev, hasFiles: e.target.value }))}
                    >
                        <option value="">Fayllar: Barchasi</option>
                        <option value="yes">Fayli borlar</option>
                        <option value="no">Fayli yo'qlar</option>
                    </select>
                </div>

                {!isSelectionMode && (
                    <div className="grid grid-cols-1 gap-4">
                        <select
                            className={`w-full border rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 ${theme === 'dark' ? 'bg-slate-800/50 border-slate-700 text-white' : 'bg-white border-slate-200 text-slate-900'}`}
                            value={filters.category}
                            onChange={e => setFilters(prev => ({ ...prev, category: e.target.value }))}
                        >
                            <option value="">Nominatsiya: Barchasi</option>
                            {options.categories.map(c => <option key={c} value={c}>{c}</option>)}
                        </select>
                    </div>
                )}

                <div className={`flex items-center justify-between text-sm pt-4 border-t ${theme === 'dark' ? 'border-slate-700/50' : 'border-slate-100'}`}>
                    <div className="flex gap-4">
                        <span className={theme === 'dark' ? 'text-slate-400' : 'text-slate-500'}>Jami: <b className="text-indigo-500">{contestants.length}</b></span>
                        <span className={theme === 'dark' ? 'text-slate-400' : 'text-slate-500'}>Topildi: <b className="text-emerald-500">{filteredData.length}</b></span>
                    </div>
                    {(searchTerm || experienceSearch || Object.values(filters).some(v => v)) && (
                        <button
                            onClick={() => { setSearchTerm(''); setExperienceSearch(''); setFilters({ region: '', category: '', occupation: '', ageGroup: '', hasFiles: '', group: 'competitive' }); }}
                            className="text-indigo-500 hover:text-indigo-600 font-medium flex items-center gap-1"
                        >
                            <X className="w-4 h-4" /> Filtrlarni tozalash
                        </button>
                    )}
                </div>
            </div>

            {viewMode === 'card' ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredData.map((c, i) => {
                        const isSelected = selectedIds.includes(c.id);
                        return (
                            <motion.div
                                key={c.id}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: i * 0.01 }}
                                className={`glass group p-6 rounded-2xl cursor-pointer hover:border-indigo-500/50 transition-all flex flex-col shadow-sm relative overflow-hidden ${isSelected ? 'border-emerald-500/50 bg-emerald-500/5' : ''} ${theme === 'dark' ? 'hover:bg-slate-800/20' : 'hover:bg-white shadow-indigo-100/50'}`}
                                onClick={() => setSelectedContestant(c)}
                            >
                                {isSelected && (
                                    <div className="absolute top-0 right-0 p-2 opacity-50">
                                        <BookmarkCheck className="w-5 h-5 text-emerald-500" />
                                    </div>
                                )}
                                {scores[c.name] > 0 && (
                                    <div className="absolute top-4 right-4 bg-indigo-600 text-white text-[10px] font-bold px-2 py-1 rounded-lg shadow-lg">
                                        ★ {scores[c.name]}
                                    </div>
                                )}
                                <div className="flex-1">
                                    <h3 className={`text-xl font-bold mb-2 group-hover:text-indigo-500 transition-colors uppercase tracking-tight ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>{c.name}</h3>
                                    <p className={`text-sm mb-4 line-clamp-3 ${theme === 'dark' ? 'text-slate-400' : 'text-slate-600'}`}>{c.project_info}</p>

                                    <div className="flex flex-wrap gap-2 mb-4">
                                        <span className={`px-2 py-1 rounded text-[10px] flex items-center gap-1 uppercase ${theme === 'dark' ? 'bg-slate-800 text-slate-300' : 'bg-slate-100 text-slate-600'}`}>
                                            <MapPin className="w-3 h-3" /> {c.region}
                                        </span>
                                        <span className={`px-2 py-1 rounded text-[10px] flex items-center gap-1 uppercase ${theme === 'dark' ? 'bg-slate-800 text-slate-300' : 'bg-slate-100 text-slate-600'}`}>
                                            {c.category?.match(/\(([^)]+)\)/)?.[1] || 'Nominatsiya'}
                                        </span>
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-2 mt-4">
                                    <button className={`py-2 px-3 bg-indigo-600/10 text-indigo-500 rounded-xl text-xs font-semibold group-hover:bg-indigo-600 group-hover:text-white transition-all flex items-center justify-center gap-2 border border-indigo-500/20`}>
                                        Tafsilotlar
                                    </button>
                                    <button
                                        onClick={(e) => { e.stopPropagation(); onToggleSelect(c.id); }}
                                        className={`py-2 px-3 rounded-xl text-xs font-semibold transition-all flex items-center justify-center gap-2 border ${isSelected ? 'bg-emerald-600 text-white border-emerald-500' : 'bg-slate-500/10 text-slate-500 hover:bg-slate-500 hover:text-white border-transparent'}`}
                                    >
                                        {isSelected ? <BookmarkCheck className="w-3 h-3" /> : <Bookmark className="w-3 h-3" />}
                                        {isSelected ? 'Tanlangan' : 'Tanlash'}
                                    </button>
                                </div>
                            </motion.div>
                        );
                    })}
                </div>
            ) : (
                <div className={`glass rounded-2xl overflow-hidden shadow-sm ${theme === 'dark' ? 'text-slate-300' : 'text-slate-700'}`}>
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className={`${theme === 'dark' ? 'bg-slate-800/50' : 'bg-slate-100'} text-[10px] uppercase tracking-widest font-bold`}>
                                    <th className="px-6 py-4">F.I.SH</th>
                                    <th className="px-6 py-4">Hudud</th>
                                    <th className="px-6 py-4">Nominatsiya</th>
                                    <th className="px-6 py-4">Sarlangan</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-500/10">
                                {filteredData.map(c => {
                                    const isSelected = selectedIds.includes(c.id);
                                    return (
                                        <tr
                                            key={c.id}
                                            className={`transition-colors group hover:bg-indigo-600/5 ${isSelected ? 'bg-emerald-500/5' : ''}`}
                                        >
                                            <td className="px-6 py-4">
                                                <button
                                                    onClick={() => setSelectedContestant(c)}
                                                    className={`font-bold text-sm uppercase text-left group-hover:text-indigo-500 transition-colors ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}
                                                >
                                                    {c.name}
                                                </button>
                                            </td>
                                            <td className="px-6 py-4 text-xs font-medium uppercase tracking-tight opacity-70">
                                                {c.region}
                                            </td>
                                            <td className="px-6 py-4 text-xs font-medium uppercase tracking-tight opacity-70">
                                                {c.category?.match(/\(([^)]+)\)/)?.[1] || c.category}
                                            </td>
                                            <td className="px-6 py-4">
                                                <button
                                                    onClick={() => onToggleSelect(c.id)}
                                                    className={`p-2 rounded-lg transition-all ${isSelected ? 'text-emerald-500 bg-emerald-500/10' : 'text-slate-400 hover:bg-slate-100 hover:text-slate-600'}`}
                                                >
                                                    {isSelected ? <BookmarkCheck className="w-5 h-5" /> : <Bookmark className="w-5 h-5" />}
                                                </button>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {filteredData.length === 0 && (
                <div className={`text-center py-20 rounded-3xl border border-dashed ${theme === 'dark' ? 'bg-slate-800/20 border-slate-700 text-slate-500' : 'bg-slate-100 border-slate-200 text-slate-400'}`}>
                    <p>{isSelectionMode ? "Siz hali birorta ishtirokchini tanlamadingiz." : "Hech qanday ishtirokchi topilmadi."}</p>
                </div>
            )}

            <AnimatePresence>
                {selectedContestant && (
                    <Modal
                        contestant={selectedContestant}
                        onClose={() => setSelectedContestant(null)}
                        theme={theme}
                        isSelected={selectedIds.includes(selectedContestant.id)}
                        onToggleSelect={onToggleSelect}
                        score={scores[selectedContestant.name] || 0}
                        onScoreChange={onScoreChange}
                    />
                )}
            </AnimatePresence>
        </div>
    );
};

export default ContestantsView;
