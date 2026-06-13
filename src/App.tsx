/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Search, 
  Trash2, 
  Shield, 
  ShieldCheck, 
  Moon, 
  Sun, 
  Copy, 
  Download, 
  Sparkles, 
  PlusCircle, 
  Clock, 
  Check, 
  LogOut, 
  Code, 
  Terminal,
  HelpCircle,
  AlertCircle
} from 'lucide-react';
import { TimelineItem } from './types';
import { getLocalItems, addLocalItem, deleteLocalItem } from './databaseMock';
import { WORKER_JS, WRANGLER_TOML } from './cloudflareWorkerCode';

export default function App() {
  // Theme state settings (light vs dark)
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('theme');
      if (saved === 'light' || saved === 'dark') return saved;
      return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    }
    return 'dark';
  });

  // Main UI Tab control: 'create' | 'timeline' | 'worker-code'
  const [activeTab, setActiveTab] = useState<'create' | 'timeline' | 'worker-code'>('create');

  // Input text and timeline items
  const [textInput, setTextInput] = useState('');
  const [items, setItems] = useState<TimelineItem[]>([]);
  const [searchQuery, setSearchQuery] = useState('');

  // Admin login states
  const [adminPassword, setAdminPassword] = useState('');
  const [isAdmin, setIsAdmin] = useState(() => {
    if (typeof window !== 'undefined') {
      return sessionStorage.getItem('isAdmin') === 'true';
    }
    return false;
  });

  // Modal alert/confirmation controls
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [itemIdToDelete, setItemIdToDelete] = useState<string | null>(null);

  // General Toast notification triggers
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);

  // Active Code file selection in Cloudflare Worker tab
  const [activeCodeFile, setActiveCodeFile] = useState<'index.js' | 'wrangler.toml'>('index.js');
  const [copiedText, setCopiedText] = useState(false);

  // Synchronize CSS class with active theme state
  useEffect(() => {
    const root = window.document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
    localStorage.setItem('theme', theme);
  }, [theme]);

  // Load items from database on component mounts
  useEffect(() => {
    setItems(getLocalItems());
  }, []);

  // Helper trigger for custom feedback Toast
  const triggerToast = (message: string, type: 'success' | 'error' | 'info' = 'success') => {
    setToast({ message, type });
    setTimeout(() => {
      setToast(null);
    }, 3500);
  };

  // Switch dark/light themes
  const toggleTheme = () => {
    setTheme(prev => prev === 'light' ? 'dark' : 'light');
  };

  // Add new item to simulation timeline
  const handleSaveItem = () => {
    const trimmed = textInput.trim();
    if (!trimmed) {
      triggerToast('لطفاً ابتدا متنی برای ذخیره وارد کنید!', 'error');
      return;
    }
    if (trimmed.length > 2000) {
      triggerToast('متن بیش از حد مجاز طولانی است!', 'error');
      return;
    }

    const newItem = addLocalItem(trimmed);
    setItems(getLocalItems());
    setTextInput('');
    triggerToast('یادداشت جدید با موفقیت به تایم‌لاین آزمایشی افزوده شد! 🎉', 'success');
    
    // Auto redirect to see timeline
    setTimeout(() => {
      setActiveTab('timeline');
    }, 600);
  };

  // Handle Admin Authorization Checks
  const handleAdminLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (adminPassword === '6946') {
      setIsAdmin(true);
      sessionStorage.setItem('isAdmin', 'true');
      setAdminPassword('');
      triggerToast('صلاحیت مدیریت تایید شد! ابزارهای عزل فعال گردیدند.', 'success');
    } else {
      triggerToast('گذرواژه وارد شده نامعتبر است!', 'error');
    }
  };

  const handleAdminLogout = () => {
    setIsAdmin(false);
    sessionStorage.removeItem('isAdmin');
    triggerToast('از حالت مدیریت خارج شدید.', 'info');
  };

  // Initiate item deletion workflow
  const initiateDelete = (id: string) => {
    setItemIdToDelete(id);
    setShowConfirmModal(true);
  };

  const confirmDeleteAction = () => {
    if (itemIdToDelete) {
      deleteLocalItem(itemIdToDelete);
      setItems(getLocalItems());
      triggerToast('یادداشت انتخاب شده با موفقیت عزل گردید.', 'success');
    }
    setShowConfirmModal(false);
    setItemIdToDelete(null);
  };

  // Copy code utility
  const handleCopyCode = () => {
    const codeToCopy = activeCodeFile === 'index.js' ? WORKER_JS : WRANGLER_TOML;
    navigator.clipboard.writeText(codeToCopy);
    setCopiedText(true);
    triggerToast('کد با موفقیت در کلیپ‌بورد کپی شد 📋', 'success');
    setTimeout(() => setCopiedText(false), 2000);
  };

  // Filter list by simple query
  const filteredItems = items.filter(item => 
    item.text.toLowerCase().includes(searchQuery.trim().toLowerCase())
  );

  // Timeago helper in Persian
  const getRelativePersianTime = (dateString: string): string => {
    const now = new Date();
    const past = new Date(dateString);
    const diffMs = now.getTime() - past.getTime();
    const diffSecs = Math.floor(diffMs / 1000);
    const diffMins = Math.floor(diffSecs / 60);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMs < 0 || diffSecs < 10) return 'لحظاتی پیش';
    if (diffSecs < 60) return `${diffSecs.toLocaleString('fa-IR')} ثانیه پیش`;
    if (diffMins < 60) return `${diffMins.toLocaleString('fa-IR')} دقیقه پیش`;
    if (diffHours < 24) return `${diffHours.toLocaleString('fa-IR')} ساعت پیش`;
    if (diffDays < 7) return `${diffDays.toLocaleString('fa-IR')} روز پیش`;

    return new Date(dateString).toLocaleDateString('fa-IR');
  };

  const getFullPersianDate = (dateString: string): string => {
    return new Date(dateString).toLocaleDateString('fa-IR', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-100 flex flex-col justify-between font-sans transition-colors duration-300 antialiased" dir="rtl">
      
      {/* Background Gradient Orbs */}
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-indigo-400/10 dark:bg-indigo-500/5 rounded-full blur-[120px] pointer-events-none -z-10"></div>
      <div className="absolute bottom-20 left-0 w-[400px] h-[400px] bg-indigo-400/10 dark:bg-indigo-500/5 rounded-full blur-[100px] pointer-events-none -z-10"></div>

      {/* Primary Header Section */}
      <header className="sticky top-0 z-40 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md border-b border-slate-200/60 dark:border-slate-800/60 shadow-sm transition-colors duration-300">
        <div className="w-full max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
          
          {/* Logo & Branding */}
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-lg bg-indigo-600 flex items-center justify-center text-white shadow-md shadow-indigo-600/20">
              <Sparkles className="w-4.5 h-4.5" />
            </div>
            <div>
              <h1 className="text-sm md:text-base font-bold tracking-tight text-slate-900 dark:text-white">سامانه هوشمند تایم‌لاین ورکر</h1>
              <p className="hidden md:block text-[9px] text-slate-400 dark:text-slate-500 font-mono mt-0.5">Cloudflare Workers KV + Persian UI</p>
            </div>
          </div>

          {/* Navigation Tab Pills */}
          <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-950 p-1 rounded-lg border border-slate-200/60 dark:border-slate-800/80">
            <button
              onClick={() => setActiveTab('create')}
              className={`flex items-center gap-1 text-[11px] md:text-xs py-1.5 px-3 md:px-4 rounded-md font-medium transition-all ${
                activeTab === 'create'
                  ? 'bg-white dark:bg-slate-855 text-indigo-600 dark:text-indigo-400 shadow-sm font-semibold'
                  : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
            >
              <PlusCircle className="w-3.5 h-3.5" />
              <span>ثبت کار جدید</span>
            </button>
            <button
              onClick={() => setActiveTab('timeline')}
              className={`flex items-center gap-1 text-[11px] md:text-xs py-1.5 px-3 md:px-4 rounded-md font-medium transition-all ${
                activeTab === 'timeline'
                  ? 'bg-white dark:bg-slate-855 text-indigo-600 dark:text-indigo-400 shadow-sm font-semibold'
                  : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
            >
              <Clock className="w-3.5 h-3.5" />
              <span>تایم‌لاین</span>
            </button>
            <button
              onClick={() => setActiveTab('worker-code')}
              className={`flex items-center gap-1 text-[11px] md:text-xs py-1.5 px-3 md:px-4 rounded-md font-medium transition-all ${
                activeTab === 'worker-code'
                  ? 'bg-white dark:bg-slate-855 text-indigo-600 dark:text-indigo-400 shadow-sm font-semibold'
                  : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
            >
              <Code className="w-3.5 h-3.5" />
              <span>دریافت فایل Worker</span>
            </button>
          </div>

          {/* Utilities (Theme Switch) */}
          <button
            onClick={toggleTheme}
            className="p-2 rounded-lg border border-slate-200/60 dark:border-slate-800 bg-white/50 dark:bg-slate-900/50 hover:bg-slate-100 dark:hover:bg-slate-800 hover:scale-[1.03] active:scale-95 transition-all outline-none text-slate-700 dark:text-yellow-400"
            title={theme === 'dark' ? 'حالت روز' : 'حالت شب'}
          >
            {theme === 'dark' ? <Sun className="w-3.5 h-3.5" /> : <Moon className="w-3.5 h-3.5" />}
          </button>

        </div>
      </header>

      {/* Main Container Area */}
      <main className="w-full max-w-6xl mx-auto px-4 py-8 flex-grow">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-stretch">
          
          {/* Column 1: Notepad Sidebar (lg:col-span-4) */}
          <aside className={`lg:col-span-4 ${activeTab === 'create' ? 'block' : 'hidden lg:block'}`}>
            <div className="rounded-xl p-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800/80 shadow-sm relative flex flex-col justify-between h-full min-h-[480px]">
              {/* Top Indicator Accent */}
              <div className="absolute top-0 left-0 right-0 h-1 bg-indigo-600 rounded-t-xl"></div>
              
              <div>
                <h2 className="text-sm font-bold text-slate-900 dark:text-white mb-3 flex items-center gap-2">
                  <span className="text-indigo-600 dark:text-indigo-400">➕</span>
                  <span>یادداشت جدید</span>
                </h2>

                <textarea
                  value={textInput}
                  onChange={(e) => setTextInput(e.target.value)}
                  placeholder="متن خود را اینجا بنویسید..."
                  maxLength={2000}
                  className="w-full h-44 p-3 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/40 text-slate-850 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all leading-relaxed text-sm resize-none"
                ></textarea>

                {/* Character stats bar */}
                <div className="flex items-center justify-between text-[11px] text-slate-400 dark:text-slate-500 mt-1 mb-2 font-mono">
                  <span>حداکثر ۲۰۰۰ کاراکتر</span>
                  <span className={textInput.length > 1950 ? 'text-red-500 font-semibold' : ''}>
                    {textInput.length.toLocaleString('fa-IR')} / ۲,۰۰۰
                  </span>
                </div>
                
                {/* Dynamic character fill bar */}
                <div className="w-full bg-slate-100 dark:bg-slate-950 h-1 rounded-full overflow-hidden mb-4">
                  <div 
                    className={`h-full transition-all duration-300 ${textInput.length > 1900 ? 'bg-red-500' : 'bg-indigo-600'}`}
                    style={{ width: `${Math.min((textInput.length / 2000) * 100, 100)}%` }}
                  ></div>
                </div>

                {/* Preview section if text exists */}
                {textInput.trim() && (
                  <div className="bg-indigo-50/10 dark:bg-indigo-950/20 border border-indigo-500/10 rounded-lg p-3 mt-3 max-h-36 overflow-y-auto">
                    <div className="flex items-center gap-1.5 text-[11px] text-indigo-600 dark:text-indigo-400 mb-1 font-semibold">
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>پیش‌نمایش لحظه‌ای در تایم‌لاین:</span>
                    </div>
                    <p className="text-xs text-slate-600 dark:text-slate-350 whitespace-pre-wrap leading-relaxed">
                      {textInput}
                    </p>
                  </div>
                )}
              </div>

              <div>
                <button
                  onClick={handleSaveItem}
                  className="w-full py-2.5 px-4 rounded-lg bg-indigo-650 hover:bg-slate-850 text-white font-bold text-xs transition-all flex items-center justify-center gap-2 shadow-sm hover:shadow active:scale-[0.99] cursor-pointer"
                >
                  <span>ثبت در تایم‌لاین</span>
                </button>

                <div className="mt-5 pt-4 border-t border-slate-200/60 dark:border-slate-800/60">
                  <p className="text-[11px] text-slate-450 dark:text-slate-500 leading-normal">
                    نکته: تمامی موارد در فضای Cloudflare KV شما ذخیره میشوند و به صورت دائمی در دسترس خواهند بود.
                  </p>
                </div>
              </div>

            </div>
          </aside>

          {/* Column 2: Feed/Timeline or Worker Code Column (lg:col-span-8) */}
          <section className={`lg:col-span-8 ${activeTab !== 'create' ? 'block' : 'hidden lg:block'}`}>
            <AnimatePresence mode="wait">
              
              {/* TAB 1 or 2: TIMELINE VIEW */}
              {(activeTab === 'timeline' || activeTab === 'create') && (
                <motion.div
                  key="timeline-tab"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="space-y-4"
                >
                  
                  {/* Controls and Stats Filter Frame */}
                  <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
                    <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-center">
                      
                      {/* SEARCH TIMELINE */}
                      <div className="relative md:col-span-7">
                        <span className="absolute inset-y-0 right-0 flex items-center pr-3 pb-0.5 text-slate-400 pointer-events-none">
                          <Search className="w-4 h-4" />
                        </span>
                        <input
                          type="text"
                          placeholder="بین یادداشت‌های ثبت شده جستجو کنید..."
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                          className="w-full py-1.5 pr-9 pl-3 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/40 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all text-slate-800 dark:text-slate-100 placeholder-slate-450 dark:placeholder-slate-500"
                        />
                      </div>

                      {/* ADMIN PASSWORD LOGIN/LOGOUT STATE */}
                      <div className="md:col-span-5">
                        {isAdmin ? (
                          <div className="flex items-center justify-between bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-200/50 dark:border-indigo-800/40 rounded-lg px-3 py-1.5 text-indigo-650 dark:text-indigo-400">
                            <div className="flex items-center gap-1.5 text-[11px] md:text-xs font-semibold">
                              <ShieldCheck className="w-4 h-4" />
                              <span>پنل مدیریت فعال است ✔</span>
                            </div>
                            <button
                              onClick={handleAdminLogout}
                              className="flex items-center gap-1 py-1 px-2.5 bg-red-600 hover:bg-red-700 text-white rounded-md text-[10px] font-bold transition-all cursor-pointer"
                            >
                              <LogOut className="w-2.5 h-2.5" />
                              <span>خروج</span>
                            </button>
                          </div>
                        ) : (
                          <form onSubmit={handleAdminLogin} className="flex gap-1.5">
                            <input
                              type="password"
                              placeholder="رمز عبور ادمین (6946)"
                              value={adminPassword}
                              onChange={(e) => setAdminPassword(e.target.value)}
                              className="w-full py-1.5 px-3 text-center text-xs rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/40 focus:outline-none focus:ring-2 focus:ring-indigo-500/45 transition-all text-slate-800 dark:text-slate-100 placeholder-slate-455 dark:placeholder-slate-550 font-mono"
                            />
                            <button
                              type="submit"
                              className="py-1.5 px-3 bg-slate-800 hover:bg-slate-900 dark:bg-slate-800 dark:hover:bg-slate-750 text-white text-[10px] font-bold rounded-lg transition-all cursor-pointer whitespace-nowrap"
                            >
                              تایید رمز ادمین
                            </button>
                          </form>
                        )}
                      </div>

                    </div>
                  </div>

                  {/* Stat bar */}
                  <div className="flex items-center justify-between px-1 text-slate-500 dark:text-slate-400">
                    <h3 className="text-xs font-bold text-slate-800 dark:text-slate-200">تایم‌لاین اتفاقات اخیر</h3>
                    <span className="text-[11px] font-mono">
                      یافت شده: {filteredItems.length.toLocaleString('fa-IR')} مورد
                    </span>
                  </div>

                  {/* TIMELINE LIST */}
                  {filteredItems.length === 0 ? (
                    <div className="text-center py-12 px-5 rounded-xl border border-dashed border-slate-200 dark:border-slate-800 max-w-sm mx-auto bg-white/30 dark:bg-slate-900/10 mt-4">
                      <div className="w-12 h-12 rounded-full bg-slate-100/60 dark:bg-slate-900 flex items-center justify-center text-slate-400 dark:text-slate-600 mx-auto mb-3">
                        <Search className="w-5 h-5" />
                      </div>
                      <h4 className="text-xs font-bold text-slate-700 dark:text-slate-300 mb-0.5">نتیجه‌ای پیدا نشد</h4>
                      <p className="text-[11px] text-slate-450 dark:text-slate-550 leading-relaxed">
                        یادداشتی ثبت نشده است. یا رمز ادمین را تایید نمایید، یا فیلدها را تغییر دهید.
                      </p>
                    </div>
                  ) : (
                    <div className="relative border-r border-slate-200 dark:border-slate-800/80 pr-5 mr-2 space-y-4">
                      
                      {/* Vertical Progress Line */}
                      <div className="absolute top-0 bottom-0 -right-[1px] w-[1px] bg-gradient-to-b from-indigo-500 via-indigo-400/30 to-transparent"></div>

                      <AnimatePresence initial={false}>
                        {filteredItems.map((item, index) => (
                          <motion.div
                            key={item.id}
                            initial={{ opacity: 0, x: 10 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, scale: 0.98, x: 15 }}
                            transition={{ duration: 0.15 }}
                            className="relative group"
                          >
                            {/* Bullet Point */}
                            <div className="absolute -right-[24.5px] top-4.5 w-2.5 h-2.5 rounded-full bg-white dark:bg-slate-950 border-2 border-indigo-600 group-hover:bg-indigo-500 group-hover:scale-110 group-hover:border-indigo-500 transition-all duration-250 shadow-sm z-10"></div>
                            
                            {/* Compact card */}
                            <div className="bg-white dark:bg-slate-900 rounded-xl p-4 border border-slate-200 dark:border-slate-800/80 hover:border-slate-300 dark:hover:border-slate-705 hover:shadow-sm transition-all duration-200 relative overflow-hidden">
                              
                              <div className="absolute top-0 right-0 bottom-0 w-0.5 bg-indigo-500 opacity-0 group-hover:opacity-100 transition-opacity"></div>

                              {/* Item Header info */}
                              <div className="flex items-center justify-between mb-2 pb-2 border-b border-slate-100 dark:border-slate-800/70">
                                <div className="flex items-center gap-1.5 text-[11px] text-slate-400 dark:text-slate-500 font-mono">
                                  <Clock className="w-3.5 h-3.5 text-indigo-500" />
                                  <span className="font-semibold">{getRelativePersianTime(item.createdAt)}</span>
                                  <span className="text-slate-200 dark:text-slate-800">|</span>
                                  <span>{new Date(item.createdAt).toLocaleDateString('fa-IR')}</span>
                                </div>

                                <div className="flex items-center gap-1.5">
                                  {index === 0 && (
                                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-[#dcfce7] text-[#166534] tracking-wider uppercase">جدید</span>
                                  )}
                                  
                                  {/* Delete Control */}
                                  {isAdmin && (
                                    <button
                                      onClick={() => initiateDelete(item.id)}
                                      className="p-1 text-red-400 hover:text-red-550 hover:bg-red-500/10 rounded transition-all cursor-pointer"
                                      title="حذف این رویداد"
                                    >
                                      <Trash2 className="w-3.5 h-3.5" />
                                    </button>
                                  )}
                                </div>
                              </div>

                              {/* Text Body */}
                              <p className="whitespace-pre-line text-slate-800 dark:text-slate-100 text-xs md:text-sm leading-relaxed tracking-wide font-sans">
                                {item.text}
                              </p>

                            </div>
                          </motion.div>
                        ))}
                      </AnimatePresence>
                    </div>
                  )}

                  {/* Informative footer tip only for timeline */}
                  <div className="mt-4 p-3 rounded-lg border border-dashed border-indigo-505/20 bg-indigo-50/5 dark:bg-indigo-950/5 text-[11px] text-slate-500 dark:text-slate-400 flex gap-2 leading-relaxed items-start">
                    <HelpCircle className="w-4 h-4 text-indigo-500 flex-shrink-0 mt-0.5" />
                    <div>
                      <span className="font-bold text-slate-700 dark:text-slate-200">چگونه کار می‌کند؟</span>
                      <p className="mt-0.5">این تایم‌لاین شبیه‌ساز پایگاه داده پرسرعت <strong className="text-indigo-600 dark:text-indigo-400">Cloudflare Workers KV</strong> است. شما می‌توانید فایل کامل آماده و تنظیمات پروژه را مستقیماً از زبانه دریافت نمایید.</p>
                    </div>
                  </div>

                </motion.div>
              )}

              {/* TAB 3: WORKER EXPORTER */}
          {activeTab === 'worker-code' && (
            <motion.div
              key="worker-tab"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.25 }}
              className="max-w-4xl mx-auto"
            >
              
              {/* Introduction Banner */}
              <div className="glass-card-light dark:glass-card-dark rounded-2xl p-6 shadow-xl mb-6 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-24 h-24 bg-cyan-500/10 rounded-bl-full pointer-events-none"></div>
                
                <h2 className="text-lg md:text-xl font-bold mb-2 flex items-center gap-2 text-slate-800 dark:text-white">
                  <Terminal className="w-6 h-6 text-cyan-500" />
                  <span>آموزش استفاده و راه‌اندازی در Cloudflare Workers</span>
                </h2>
                
                <p className="text-xs md:text-sm text-slate-600 dark:text-slate-400 leading-relaxed mb-4">
                  همین برنامه‌ای که در این پنجره شبیه‌سازی کردید، با کدهایی که در زیر آماده شده است، بر روی زیرساخت جهانی Cloudflare مستقر می‌شود. شما با استفاده از این ورکر، سروری پرسرعت خواهید داشت که به صورت مستقیم صفحات HTML و پایگاه داده با حجم عظیم را پشتیبانی خواهد کرد.
                </p>

                {/* Integration Checklist steps */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
                  <div className="p-3.5 bg-gray-100/60 dark:bg-slate-900/50 rounded-xl border border-gray-200/50 dark:border-slate-800/80">
                    <span className="font-bold text-cyan-600 dark:text-cyan-400 block mb-1">۱. ایجاد Worker</span>
                    وارد پنل Cloudflare شده، به بخش Workers مراجعه کنید و یک ورکر بسازید. کد فــــایل <strong className="font-mono">index.js</strong> را داخل آن قرار دهید.
                  </div>
                  <div className="p-3.5 bg-gray-100/60 dark:bg-slate-900/50 rounded-xl border border-gray-200/50 dark:border-slate-800/80">
                    <span className="font-bold text-cyan-600 dark:text-cyan-400 block mb-1">۲. ایجاد و تنظیم KV Database</span>
                    یک دیکشنری به نام <strong className="font-mono">TODO_KV</strong> در بخش KV بسازید و نام بایندی کلید آن را عینا <strong className="font-mono">TODO_KV</strong> بگذارید.
                  </div>
                  <div className="p-3.5 bg-gray-100/60 dark:bg-slate-900/50 rounded-xl border border-gray-200/50 dark:border-slate-800/80">
                    <span className="font-bold text-cyan-600 dark:text-cyan-400 block mb-1">۳. ثبت متغیر رمز عبور</span>
                    در بخش Variables ادمین ورکر، یک سکرت به اسم <strong className="font-mono">ADMIN_PASSWORD</strong> بسازید و مقدار آن را رمز عبور دلخواه خود (مثلا <strong className="font-mono">6946</strong>) قرار دهید.
                  </div>
                </div>
              </div>

              {/* Troubleshooting Alert Box for ES Modules Upload Error */}
              <div className="glass-card-light dark:glass-card-dark border-l-4 border-amber-500 rounded-2xl p-5 mb-6 shadow-md bg-amber-500/5">
                <div className="flex gap-3">
                  <div className="p-2 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 h-fit">
                    <AlertCircle className="w-5 h-5" />
                  </div>
                  <div className="space-y-2">
                    <h3 className="text-sm font-bold text-slate-800 dark:text-white flex items-center gap-1.5">
                      <span>💡 راهنمای رفع خطای ES Modules هنگام دیپلوی (Version upload failed)</span>
                    </h3>
                    <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                      API جدید آپلود کلودفلر (Version Upload API) <strong>فقط از سینتکس مدرن ES Modules</strong> پشتیبانی می‌کند. اگر ابزار Wrangler به اشتباه فایل شما را با فرمت قدیمی Service Worker تشخیص دهد، با خطای مذکور مواجه می‌شوید. برای رفع سریع این مشکل از یکی از روش‌های زیر استفاده کنید:
                    </p>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5 mt-3 text-xs pt-1.5">
                      <div className="p-3 bg-white/70 dark:bg-slate-900/60 rounded-xl border border-amber-500/10">
                        <span className="font-semibold text-amber-700 dark:text-amber-400 block mb-1">روش اول: استفاده از فلگ modules--</span>
                        هنگام اجرای دستور دبپلوی با wrangler، فلگ ماژول را صراحتاً اضافه کنید:
                        <code className="block mt-2 p-1.5 bg-slate-950 text-emerald-400 rounded text-[11px] font-mono select-all text-left" dir="ltr">
                          npx wrangler deploy index.js --modules
                        </code>
                      </div>
                      <div className="p-3 bg-white/70 dark:bg-slate-900/60 rounded-xl border border-amber-500/10">
                        <span className="font-semibold text-amber-700 dark:text-amber-400 block mb-1">روش دوم: استفاده از پسوند mjs.</span>
                        نام فایل را به <strong className="font-mono text-cyan-600">index.mjs</strong> تغییر دهید و در فایل <strong className="font-mono">wrangler.toml</strong> بنویسید:
                        <code className="block mt-2 p-1.5 bg-slate-950 text-emerald-400 rounded text-[11px] font-mono text-left" dir="ltr">
                          main = "index.mjs"
                        </code>
                      </div>
                      <div className="p-3 bg-white/70 dark:bg-slate-900/60 rounded-xl border border-amber-500/10">
                        <span className="font-semibold text-amber-700 dark:text-amber-400 block mb-1">روش سوم: کنترل پنل کلودفلر</span>
                        اگر کد را مستقیماً در ویرایشگر آنلاین (Quick Edit) پنل کلودفلر وارد می‌کنید، دقت کنید که Worker خود را با قالب مدرن <strong>ES Modules</strong> ساخته باشید نه قالب سنتی.
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Code Files Display Editor Area */}
              <div className="rounded-2xl border border-gray-200 dark:border-slate-800 bg-slate-900 text-slate-100 overflow-hidden shadow-2xl">
                
                {/* Editor Topbar */}
                <div className="px-5 py-3.5 bg-slate-950/90 border-b border-slate-800 flex items-center justify-between">
                  
                  {/* Tab Selector inside editor */}
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => setActiveCodeFile('index.js')}
                      className={`text-xs px-3.5 py-1.5 rounded-lg font-mono font-medium transition-colors cursor-pointer ${
                        activeCodeFile === 'index.js'
                          ? 'bg-slate-800 text-white font-semibold border-b border-cyan-500'
                          : 'text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      📄 index.js (کد کامل)
                    </button>
                    <button
                      onClick={() => setActiveCodeFile('wrangler.toml')}
                      className={`text-xs px-3.5 py-1.5 rounded-lg font-mono font-medium transition-colors cursor-pointer ${
                        activeCodeFile === 'wrangler.toml'
                          ? 'bg-slate-800 text-white font-semibold border-b border-cyan-500'
                          : 'text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      ⚙ wrangler.toml (تنظیمات)
                    </button>
                  </div>

                  {/* Actions (Copy + Download directly) */}
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <button
                      onClick={handleCopyCode}
                      className="p-1.5 md:px-3 md:py-1.5 text-xs bg-slate-800 hover:bg-slate-700 rounded-lg text-slate-300 hover:text-white transition-colors flex items-center gap-1 cursor-pointer"
                      title="کپی کردن کد"
                    >
                      {copiedText ? <Check className="w-3.5 h-3.5 text-green-500" /> : <Copy className="w-3.5 h-3.5" />}
                      <span className="hidden md:inline">کپی کد</span>
                    </button>

                    {/* Direct Download Button (index.mjs) */}
                    <a
                      href="/index.mjs"
                      download="index.mjs"
                      className="p-1.5 md:px-3 md:py-1.5 text-xs bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-medium transition-colors flex items-center gap-1 cursor-pointer"
                      title="دانلود فایل به صورت ماژول (توصیه‌شده)"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span className="hidden md:inline">دانلود index.mjs (توصیه شده)</span>
                    </a>

                    {/* Direct Download Button (index.js) */}
                    <a
                      href="/index.js"
                      download="index.js"
                      className="p-1.5 md:px-3 md:py-1.5 text-xs bg-cyan-600 hover:bg-cyan-700 text-white rounded-lg font-medium transition-colors flex items-center gap-1 cursor-pointer"
                      title="دانلود فایل مستقیم"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span className="hidden md:inline">دانلود index.js</span>
                    </a>
                  </div>
                </div>

                {/* Code Window Output representation */}
                <div className="p-5 font-mono text-xs md:text-sm overflow-x-auto max-h-[500px] leading-relaxed select-all">
                  <pre className="text-left text-slate-200" dir="ltr">
                    {activeCodeFile === 'index.js' ? WORKER_JS : WRANGLER_TOML}
                  </pre>
                </div>

              </div>

            </motion.div>
          )}

        </AnimatePresence>
      </section>
    </div>
  </main>

      {/* Global custom confirm Dialog modal (Bypasses boring default confirms) */}
      <AnimatePresence>
        {showConfirmModal && (
          <div className="fixed inset-0 z-50 bg-slate-950/50 backdrop-blur-sm flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.15 }}
              className="glass-card-light dark:glass-card-dark w-full max-w-sm rounded-2xl p-6 shadow-2xl relative overflow-hidden"
            >
              <div className="absolute top-0 right-0 left-0 h-1 bg-red-500"></div>
              
              <div className="flex items-center gap-2.5 text-red-500 mb-3 font-semibold text-base">
                <AlertCircle className="w-5 h-5" />
                <span>حذف دائمی آیتم</span>
              </div>

              <p className="text-slate-600 dark:text-slate-350 text-xs md:text-sm mb-6 leading-relaxed font-sans">
                آیا از حذف این رویداد یا یادداشت از تایم‌لاین اطمینان کامل دارید؟ اطلاعات قابل بازگرداندن نخواهند بود.
              </p>

              <div className="flex items-center gap-3 justify-end font-sans">
                <button
                  onClick={() => setShowConfirmModal(false)}
                  className="px-4 py-2 text-xs md:text-sm font-medium rounded-xl text-slate-500 dark:text-slate-400 hover:bg-slate-150 dark:hover:bg-slate-800/80 transition-all cursor-pointer"
                >
                  انصراف و برگشت
                </button>
                <button
                  onClick={confirmDeleteAction}
                  className="px-5 py-2 text-xs md:text-sm font-bold rounded-xl bg-red-600 hover:bg-red-700 text-white shadow-lg shadow-red-600/10 cursor-pointer"
                >
                  بله، حذف شـود
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Dynamic Visual feedback Toast toast-alert bar */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="fixed bottom-6 right-6 left-6 md:left-auto md:w-96 py-3.5 px-5 rounded-xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 shadow-2xl text-xs md:text-sm flex items-center gap-2.5 z-40 border border-slate-800 dark:border-slate-100"
          >
            <span>{toast.type === 'success' ? '✅' : toast.type === 'error' ? '❌' : 'ℹ'}</span>
            <span className="font-medium flex-1">{toast.message}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* System Footer Info Details */}
      <footer className="border-t border-gray-200/50 dark:border-slate-900/100 py-6 text-center text-[11px] text-slate-400 dark:text-slate-600 font-sans mt-8 bg-white/40 dark:bg-slate-900/10 backdrop-blur-sm transition-all">
        تایم‌لاین اتفاقات روزانه • قدرت گرفته از Cloudflare Workers & KV DB
      </footer>

    </div>
  );
}
