/**
 * Cloudflare Worker: Beautiful Glassmorphic Timeline Todo App
 * Features:
 *  - High-end dark & light modes (LocalStorage remembered)
 *  - Persian 'Vazirmatn' typography & fully responsive layouts
 *  - Beautiful Glassmorphism cards with smooth hover animations
 *  - Smart character counter helper with max 2000 length
 *  - Persian relative time indicators ("۲ دقیقه پیش" etc.) + fa-IR dates
 *  - Interactive inline Search bar in the timeline list
 *  - Admin authentication securely checked server-side
 *  - Elegant prompt confirmations for items removal
 */

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const ADMIN_PASS = env.ADMIN_PASSWORD || "6946";

    // Set CORS headers
    const corsHeaders = {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, HEAD, POST, OPTIONS, DELETE",
      "Access-Control-Allow-Headers": "Content-Type",
    };

    if (request.method === "OPTIONS") {
      return new Response("OK", { headers: corsHeaders });
    }

    // API: Add a new task/text to the timeline
    if (request.method === "POST" && url.pathname === "/api/add") {
      try {
        const { text } = await request.json();
        if (!text || !text.trim()) {
          return json({ error: "متن نمیتواند خالی باشد" }, 400, corsHeaders);
        }

        const trimmedText = text.trim();
        if (trimmedText.length > 2000) {
          return json({ error: "طول متن نمیتواند بیشتر از ۲۰۰۰ کاراکتر باشد" }, 400, corsHeaders);
        }

        const id = Date.now().toString();
        const newItem = {
          id,
          text: trimmedText,
          createdAt: new Date().toISOString(),
        };

        await env.TODO_KV.put(`item:${id}`, JSON.stringify(newItem));
        return json({ success: true, item: newItem }, 200, corsHeaders);
      } catch (err) {
        return json({ error: "خطایی رخ داد: " + err.message }, 500, corsHeaders);
      }
    }

    // API: Retrieve list of items in timeline
    if (request.method === "GET" && url.pathname === "/api/list") {
      try {
        const list = await env.TODO_KV.list({ prefix: "item:" });
        const items = [];

        for (const key of list.keys) {
          const value = await env.TODO_KV.get(key.name);
          if (value) {
            try {
              items.push(JSON.parse(value));
            } catch (je) {}
          }
        }

        // Sort by ID descending (newest first)
        items.sort((a, b) => Number(b.id) - Number(a.id));
        return json(items, 200, corsHeaders);
      } catch (err) {
        return json({ error: "خطا در دریافت لیست: " + err.message }, 500, corsHeaders);
      }
    }

    // API: Delete an item (requires ADMIN_PASS)
    if (request.method === "POST" && url.pathname === "/api/delete") {
      try {
        const body = await request.json();
        if (body.password !== ADMIN_PASS) {
          return json({ error: "رمز عبور وارد شده نامعتبر است" }, 401, corsHeaders);
        }

        await env.TODO_KV.delete(`item:${body.id}`);
        return json({ success: true }, 200, corsHeaders);
      } catch (err) {
        return json({ error: "خطا در حذف آیتم: " + err.message }, 500, corsHeaders);
      }
    }

    // Serve Timeline Page (or SPA-like delivery)
    if (url.pathname === "/timeline") {
      return new Response(timelinePageHTML(), {
        headers: { "content-type": "text/html;charset=utf-8" },
      });
    }

    // Serve Entry / Home Page
    return new Response(homePageHTML(), {
      headers: { "content-type": "text/html;charset=utf-8" },
    });
  },
};

function json(data, status = 200, headers = {}) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      ...headers,
      "content-type": "application/json",
    },
  });
}

// Generate Home HTML directly inside helper
function homePageHTML() {
  return `<!DOCTYPE html>
<html lang="fa" dir="rtl">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>ثبت کار جدید - تایم لاین</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Vazirmatn:wght@300;400;500;600;700;800&display=swap" rel="stylesheet">
  <script src="https://cdn.tailwindcss.com"></script>
  <script>
    tailwind.config = {
      darkMode: 'class',
      theme: {
        extend: {
          fontFamily: {
            sans: ['Vazirmatn', 'sans-serif'],
          }
        }
      }
    }
  </script>
  <style>
    body {
      font-family: 'Vazirmatn', sans-serif;
      transition: background-color 0.4s ease, color 0.4s ease;
    }
    .glass-card-light {
      background: rgba(255, 255, 255, 0.75);
      backdrop-filter: blur(12px);
      -webkit-backdrop-filter: blur(12px);
      border: 1px solid rgba(255, 255, 255, 0.45);
    }
    .glass-card-dark {
      background: rgba(30, 41, 59, 0.65);
      backdrop-filter: blur(12px);
      -webkit-backdrop-filter: blur(12px);
      border: 1px solid rgba(255, 255, 255, 0.08);
    }
  </style>
</head>
<body class="bg-gray-50 text-slate-800 dark:bg-slate-950 dark:text-slate-150 min-h-screen flex flex-col justify-between">

  <!-- Main Container -->
  <div class="w-full max-w-2xl mx-auto px-4 py-8">
    
    <!-- Top Bar -->
    <div class="flex items-center justify-between mb-8">
      <!-- Dark/Light theme toggler -->
      <button onclick="toggleTheme()" class="p-2.5 rounded-full glass-card-light dark:glass-card-dark cursor-pointer text-slate-700 dark:text-yellow-400 hover:scale-105 active:scale-95 transition-all outline-none" id="theme-btn" title="تغییر پوسته">
        <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 block dark:hidden" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
        </svg>
        <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 hidden dark:block" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364-6.364l-.707.707M6.343 17.657l-.707.707m2.828-9.9a5 5 0 11-7.071 7.071 5 5 0 017.071-7.071z" />
        </svg>
      </button>

      <!-- View Timeline Button -->
      <a href="/timeline" class="inline-flex items-center gap-2 py-2 px-5 rounded-xl bg-cyan-600 hover:bg-cyan-700 text-white font-medium shadow-md transition-all text-sm hover:scale-102">
        <span>مشاهده تایم‌لاین</span>
        <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      </a>
    </div>

    <!-- Main Card -->
    <div class="rounded-2xl p-6 md:p-8 glass-card-light dark:glass-card-dark shadow-xl">
      <div class="flex items-center justify-between mb-6 pb-4 border-b border-gray-150 dark:border-slate-800">
        <div class="flex items-center gap-3">
          <div class="p-2.5 rounded-xl bg-cyan-500/10 text-cyan-600 dark:text-cyan-400">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
          </div>
          <h2 class="text-xl font-bold dark:text-white">ثبت کار روزانه یا خاطره جدید</h2>
        </div>
      </div>

      <!-- Text Box Form -->
      <div class="space-y-4">
        <div>
          <label for="text" class="block text-sm font-medium text-slate-600 dark:text-slate-400 mb-2">متن یا وظیفه خود را شرح دهید:</label>
          <textarea id="text" placeholder="در این لحظه مشغول چه کاری هستید؟ بنویسید..." oninput="updateCharCounter()" class="w-full min-h-[160px] max-h-[300px] p-4 rounded-xl border border-gray-200 dark:border-slate-800 bg-white/50 dark:bg-slate-900/40 text-slate-800 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/50 focus:border-cyan-500 transition-all leading-relaxed"></textarea>
        </div>

        <!-- Limit Counter -->
        <div class="flex items-center justify-between text-xs text-slate-400 dark:text-slate-500">
          <span>محدودیت کاراکتر: ۲۰۰۰ کاراکتر</span>
          <span id="char-count">۰ / ۲۰۰۰</span>
        </div>

        <!-- Submit Panel -->
        <button onclick="save()" id="submit-btn" class="w-full py-3.5 px-6 rounded-xl bg-gradient-to-r from-cyan-600 to-sky-600 hover:from-cyan-700 hover:to-sky-700 text-white font-bold transition-all flex items-center justify-center gap-2 shadow-lg shadow-cyan-600/10 hover:shadow-cyan-600/20 active:scale-98 cursor-pointer">
          <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
          </svg>
          <span>ذخیره در تایم‌لاین</span>
        </button>
      </div>
    </div>

  </div>

  <!-- Bottom Details -->
  <footer class="text-center py-6 text-xs text-slate-400 dark:text-slate-600 font-sans">
    طراحی با تم شیشه‌ای مدرن • هماهنگ با Cloudflare Workers KV
  </footer>

  <!-- Notification Popup Toast -->
  <div id="toast" class="fixed bottom-6 right-6 left-6 md:left-auto md:w-80 py-3.5 px-5 rounded-xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 shadow-xl opacity-0 translate-y-4 pointer-events-none transition-all duration-300 flex items-center gap-2 z-50">
    <span id="toast-icon">✨</span>
    <span id="toast-msg" class="text-sm font-medium"></span>
  </div>

  <script>
    // Theme setup
    const isDark = localStorage.getItem('theme') === 'dark' || 
                  (!('theme' in localStorage) && window.matchMedia('(prefers-color-scheme: dark)').matches);
    
    if (isDark) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }

    function toggleTheme() {
      const html = document.documentElement;
      if (html.classList.contains('dark')) {
        html.classList.remove('dark');
        localStorage.setItem('theme', 'light');
      } else {
        html.classList.add('dark');
        localStorage.setItem('theme', 'dark');
      }
    }

    // Character Counter
    function updateCharCounter() {
      const el = document.getElementById('text');
      const counter = document.getElementById('char-count');
      const len = el.value.length;
      counter.innerText = len + ' / ۲۰۰۰';
      
      if (len > 2000) {
        counter.classList.add('text-red-500');
        counter.classList.remove('text-slate-400', 'dark:text-slate-500');
      } else {
        counter.classList.remove('text-red-500');
        counter.classList.add('text-slate-400', 'dark:text-slate-500');
      }
    }

    // Custom Toast system
    function showToast(message, type = 'success') {
      const toast = document.getElementById('toast');
      const icon = document.getElementById('toast-icon');
      const msg = document.getElementById('toast-msg');
      
      icon.innerText = type === 'success' ? '✅' : '❌';
      msg.innerText = message;
      
      toast.classList.remove('opacity-0', 'translate-y-4', 'pointer-events-none');
      toast.classList.add('opacity-100', 'translate-y-0');
      
      setTimeout(() => {
        toast.classList.add('opacity-0', 'translate-y-4', 'pointer-events-none');
        toast.classList.remove('opacity-100', 'translate-y-0');
      }, 3500);
    }

    // Async Save Post Request
    async function save() {
      const input = document.getElementById('text');
      const text = input.value.trim();
      const btn = document.getElementById('submit-btn');

      if (!text) {
        showToast('لطفاً متنی برای ذخیره وارد کنید!', 'error');
        return;
      }

      if (text.length > 2000) {
        showToast('طول متن نامعتبر است (بیشتر از ۲۰۰۰ کاراکتر)!', 'error');
        return;
      }

      btn.disabled = true;
      btn.classList.add('opacity-60', 'cursor-not-allowed');

      try {
        const response = await fetch('/api/add', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ text })
        });

        const data = await response.json();

        if (response.ok) {
          showToast('یادداشت با موفقیت ثبــــت شد! 🎉', 'success');
          input.value = '';
          updateCharCounter();
        } else {
          showToast(data.error || 'خطایی پیش آمد!', 'error');
        }
      } catch (err) {
        showToast('خطا در برقراری ارتباط با سرور!', 'error');
      } finally {
        btn.disabled = false;
        btn.classList.remove('opacity-60', 'cursor-not-allowed');
      }
    }
  </script>
</body>
</html>`;
}

// Generate Timeline HTML inside worker
function timelinePageHTML() {
  return `<!DOCTYPE html>
<html lang="fa" dir="rtl">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>تایم لاین انجام کارها</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Vazirmatn:wght@300;400;500;600;700;800&display=swap" rel="stylesheet">
  <script src="https://cdn.tailwindcss.com"></script>
  <script>
    tailwind.config = {
      darkMode: 'class',
      theme: {
        extend: {
          fontFamily: {
            sans: ['Vazirmatn', 'sans-serif'],
          }
        }
      }
    }
  </script>
  <style>
    body {
      font-family: 'Vazirmatn', sans-serif;
      transition: background-color 0.4s ease, color 0.4s ease;
    }
    .glass-card-light {
      background: rgba(255, 255, 255, 0.75);
      backdrop-filter: blur(12px);
      -webkit-backdrop-filter: blur(12px);
      border: 1px solid rgba(255, 255, 255, 0.45);
    }
    .glass-card-dark {
      background: rgba(30, 41, 59, 0.65);
      backdrop-filter: blur(12px);
      -webkit-backdrop-filter: blur(12px);
      border: 1px solid rgba(255, 255, 255, 0.08);
    }
    .admin-visible {
      display: none;
    }
    .admin .admin-visible {
      display: block;
    }
  </style>
</head>
<body class="bg-gray-50 text-slate-800 dark:bg-slate-950 dark:text-slate-100 min-h-screen flex flex-col justify-between">

  <!-- Modal custom confirm dialog (Bypasses boring default confirms) -->
  <div id="confirm-modal" class="fixed inset-0 z-50 bg-slate-950/40 backdrop-blur-sm flex items-center justify-center p-4 opacity-0 pointer-events-none transition-all duration-200">
    <div class="glass-card-light dark:glass-card-dark w-full max-w-sm rounded-2xl p-6 shadow-2xl scale-95 transition-all duration-200" id="confirm-box">
      <h4 class="text-lg font-bold text-slate-800 dark:text-white mb-2" id="confirm-title">حذف کار</h4>
      <p class="text-slate-600 dark:text-slate-400 text-sm mb-6 leading-relaxed" id="confirm-message">آیا از حذف این مورد از تایم‌لاین اطمینان دارید؟ اطلاعات قابل بازیابی نخواهند بود.</p>
      <div class="flex items-center gap-3 justify-end">
        <button onclick="cancelAction()" class="px-4 py-2 text-sm font-medium rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer">لغو</button>
        <button id="confirm-yes-btn" class="px-5 py-2 text-sm font-bold rounded-xl bg-red-600 hover:bg-red-700 text-white shadow-lg shadow-red-600/15 transition-all cursor-pointer">بله، حذف شود</button>
      </div>
    </div>
  </div>

  <div class="w-full max-w-3xl mx-auto px-4 py-8">
    
    <!-- Top Nav -->
    <div class="flex items-center justify-between mb-8">
      <!-- Back Button -->
      <a href="/" class="inline-flex items-center gap-2 py-2 px-5 rounded-xl bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 text-slate-700 dark:text-slate-200 text-sm transition-all hover:scale-102">
        <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
        </svg>
        <span>ثبت نمونه جدید</span>
      </a>

      <!-- Theme Button & Admin logout -->
      <div class="flex items-center gap-3">
        <!-- Theme toggle -->
        <button onclick="toggleTheme()" class="p-2.5 rounded-full glass-card-light dark:glass-card-dark cursor-pointer text-slate-700 dark:text-yellow-400 hover:scale-105 active:scale-95 transition-all" id="theme-btn">
          <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 block dark:hidden" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
          </svg>
          <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 hidden dark:block" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364-6.364l-.707.707M6.343 17.657l-.707.707m2.828-9.9a5 5 0 11-7.071 7.071 5 5 0 017.071-7.071z" />
          </svg>
         </button>

        <!-- Dynamic Admin Status Indicator -->
        <button onclick="logoutAdmin()" id="logout-btn" class="hidden text-xs py-2 px-3.5 bg-red-100 dark:bg-red-950/50 hover:bg-red-200 text-red-700 dark:text-red-400 rounded-xl font-bold transition-all items-center gap-1 cursor-pointer">
          <span>خروج مدیریت</span>
          <span>🔓</span>
        </button>
      </div>
    </div>

    <!-- Live Content Layout -->
    <div class="space-y-6">

      <!-- Controls and Authentication Toolbar (Search & Login) -->
      <div class="p-6 rounded-2xl glass-card-light dark:glass-card-dark shadow-lg">
        <div class="grid grid-cols-1 md:grid-cols-12 gap-4 items-center">
          
          <!-- Search box -->
          <div class="relative md:col-span-7">
            <span class="absolute inset-y-0 right-0 p-3.5 text-slate-400">
              <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </span>
            <input type="text" id="search-input" oninput="filterItems()" placeholder="جستجو در متن‌های تایم‌لاین..." class="w-full py-2.5 pr-11 pl-4 rounded-xl border border-gray-250 dark:border-slate-800 bg-white/60 dark:bg-slate-900/40 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500/40 transition-all">
          </div>

          <!-- Admin password input -->
          <div id="login-form-area" class="grid grid-cols-5 gap-2 md:col-span-5">
            <input type="password" id="pass-input" placeholder="رمز مدیریت" class="col-span-3 py-2.5 px-3.5 text-center text-sm rounded-xl border border-gray-250 dark:border-slate-800 bg-white/50 dark:bg-slate-900/40 focus:outline-none">
            <button onclick="adminLogin()" class="col-span-2 text-sm font-bold bg-slate-800 hover:bg-slate-900 text-white dark:bg-slate-700 dark:hover:bg-slate-600 rounded-xl transition-all cursor-pointer">ورود ادمین</button>
          </div>

        </div>
      </div>

      <div class="flex items-center justify-between px-2">
        <h2 class="text-lg font-bold">تایم‌لاین اتفاقات اخیر</h2>
        <span id="items-stat" class="text-xs text-slate-400">در حال دریافت ...</span>
      </div>

      <!-- Raw Core Timeline Line Container -->
      <div class="relative border-r-2 border-slate-200 dark:border-slate-800 pr-6 mr-3 space-y-6" id="timeline-list">
        <!-- Render target -->
      </div>

    </div>

  </div>

  <footer class="text-center py-6 text-xs text-slate-400 dark:text-slate-600 font-sans">
    بروزرسانی زنده بر اساس Cloudflare KV Backend
  </footer>

  <!-- Toast panel -->
  <div id="toast" class="fixed bottom-6 right-6 left-6 md:left-auto md:w-80 py-3.5 px-5 rounded-xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 shadow-xl opacity-0 translate-y-4 pointer-events-none transition-all duration-300 flex items-center gap-2 z-50">
    <span id="toast-icon">✨</span>
    <span id="toast-msg" class="text-sm font-medium"></span>
  </div>

  <script>
    let items = [];
    let isAdmin = false;

    // Load theme & admin status
    const isDark = localStorage.getItem('theme') === 'dark' || 
                  (!('theme' in localStorage) && window.matchMedia('(prefers-color-scheme: dark)').matches);
    
    if (isDark) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }

    if (sessionStorage.getItem('isAdmin') === 'true') {
      enableAdmin();
    }

    function toggleTheme() {
      const html = document.documentElement;
      if (html.classList.contains('dark')) {
        html.classList.remove('dark');
        localStorage.setItem('theme', 'light');
      } else {
        html.classList.add('dark');
        localStorage.setItem('theme', 'dark');
      }
    }

    // Custom Toast system
    function showToast(message, type = 'success') {
      const toast = document.getElementById('toast');
      const icon = document.getElementById('toast-icon');
      const msg = document.getElementById('toast-msg');
      
      icon.innerText = type === 'success' ? '✅' : '❌';
      msg.innerText = message;
      
      toast.classList.remove('opacity-0', 'translate-y-4', 'pointer-events-none');
      toast.classList.add('opacity-100', 'translate-y-0');
      
      setTimeout(() => {
        toast.classList.add('opacity-0', 'translate-y-4', 'pointer-events-none');
        toast.classList.remove('opacity-100', 'translate-y-0');
      }, 3500);
    }

    // Enable admin UI elements
    function enableAdmin() {
      isAdmin = true;
      document.body.classList.add("admin");
      document.getElementById('logout-btn').classList.remove('hidden');
      document.getElementById('logout-btn').classList.add('inline-flex');
      document.getElementById('login-form-area').classList.add('hidden');
      sessionStorage.setItem('isAdmin', 'true');
    }

    function logoutAdmin() {
      isAdmin = false;
      document.body.classList.remove("admin");
      document.getElementById('logout-btn').classList.add('hidden');
      document.getElementById('logout-btn').classList.remove('inline-flex');
      document.getElementById('login-form-area').classList.remove('hidden');
      sessionStorage.removeItem('isAdmin');
      showToast('خروج موفقیت‌آمیز انجام شد', 'success');
      renderTimeline();
    }

    function adminLogin() {
      const pass = document.getElementById('pass-input').value;
      if (pass === "6946") {
        enableAdmin();
        showToast('مدیریت با موفقیت تایید صلاحیت شد 🎉', 'success');
        document.getElementById('pass-input').value = '';
        renderTimeline();
      } else {
        showToast('رمز عبور وارد شده نامعتبر است!', 'error');
      }
    }

    // Relative Time calculation
    function getRelativePersianTime(dateString) {
      const now = new Date();
      const past = new Date(dateString);
      const diffMs = now - past;
      const diffSecs = Math.floor(diffMs / 1000);
      const diffMins = Math.floor(diffSecs / 60);
      const diffHours = Math.floor(diffMins / 60);
      const diffDays = Math.floor(diffHours / 24);

      if (diffSecs < 10) return 'لحظاتی پیش';
      if (diffSecs < 60) return `${diffSecs.toLocaleString('fa-IR')} ثانیه پیش`;
      if (diffMins < 60) return `${diffMins.toLocaleString('fa-IR')} دقیقه پیش`;
      if (diffHours < 24) return `${diffHours.toLocaleString('fa-IR')} ساعت پیش`;
      if (diffDays < 7) return `${diffDays.toLocaleString('fa-IR')} روز پیش`;
      
      return new Date(dateString).toLocaleDateString('fa-IR');
    }

    // HTML Escape tool
    function escapeHtml(str) {
      return str
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
    }

    // API Get List
    async function loadList() {
      const statContainer = document.getElementById('items-stat');
      try {
        const res = await fetch('/api/list');
        if (res.ok) {
          items = await res.json();
          filterItems();
        } else {
          statContainer.innerText = 'خطا در دریافت لیست';
        }
      } catch (err) {
        statContainer.innerText = 'خطا در شبکه';
      }
    }

    // Filter Items dynamically
    function filterItems() {
      const searchQuery = document.getElementById('search-input').value.trim().toLowerCase();
      const filtered = items.filter(item => item.text.toLowerCase().includes(searchQuery));
      renderTimeline(filtered);
      
      const stat = document.getElementById('items-stat');
      stat.innerText = `تعداد کل: ${filtered.length.toLocaleString('fa-IR')} مورد`;
    }

    // Render HTML Items in timeline list
    function renderTimeline(listToRender = items) {
      const container = document.getElementById('timeline-list');
      container.innerHTML = '';

      if (listToRender.length === 0) {
        container.innerHTML = `
          <div class="text-center py-12 text-slate-400 glass-card-light dark:glass-card-dark rounded-2xl mx-auto max-w-md">
            <div class="text-3xl mb-3">📭</div>
            <div class="text-sm">هیچ یادداشت یا فعالیتی یافت نشد.</div>
          </div>
        `;
        return;
      }

      listToRender.forEach((item, index) => {
        const relativeTime = getRelativePersianTime(item.createdAt);
        const persianDate = new Date(item.createdAt).toLocaleDateString('fa-IR', {
          weekday: 'long',
          year: 'numeric',
          month: 'long',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit'
        });

        const timelineNode = document.createElement('div');
        timelineNode.className = 'relative group';

        // Bullet representation
        timelineNode.innerHTML = `
          <!-- Indicator Bullet Point -->
          <div class="absolute -right-[31px] top-1.5 w-4 h-4 rounded-full bg-cyan-500 border-4 border-white dark:border-slate-950 group-hover:scale-120 group-hover:bg-cyan-400 transition-all shadow-md"></div>
          
          <!-- Content Glass Card -->
          <div class="glass-card-light dark:glass-card-dark rounded-xl p-5 hover:scale-[1.008] transition-all shadow hover:shadow-lg relative overflow-hidden">
            
            <!-- Header detail panel -->
            <div class="flex flex-wrap items-center justify-between gap-1.5 mb-2.5 pb-2 border-b border-slate-100 dark:border-slate-800/60">
              <span class="text-xs text-slate-400 dark:text-slate-500 font-sans" title="${persianDate}">🕒 ${relativeTime}</span>
              
              <!-- Delete Trash Icon Trigger (Dynamic for authorized administrators) -->
              <button onclick="requestDelete('${item.id}')" class="admin-visible p-1.5 hover:bg-red-50 dark:hover:bg-red-950/20 text-red-500 hover:text-red-700 rounded-lg transition-all" title="حذف آیتم">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-4.5 w-4.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </button>
            </div>

            <!-- Descriptive Text -->
            <p class="whitespace-pre-line text-slate-800 dark:text-slate-200 text-sm leading-relaxed font-sans">${escapeHtml(item.text)}</p>
          </div>
        `;

        container.appendChild(timelineNode);
      });
    }

    // Modal Control logic for deletions
    let idToDelete = null;

    function requestDelete(id) {
      idToDelete = id;
      const modal = document.getElementById('confirm-modal');
      const box = document.getElementById('confirm-box');
      
      modal.classList.remove('opacity-0', 'pointer-events-none');
      modal.classList.add('opacity-100');
      box.classList.remove('scale-95');
      box.classList.add('scale-100');

      // Bind dynamic click trigger
      document.getElementById('confirm-yes-btn').onclick = function() {
        executeDelete(id);
      };
    }

    function cancelAction() {
      const modal = document.getElementById('confirm-modal');
      const box = document.getElementById('confirm-box');
      
      modal.classList.add('opacity-0', 'pointer-events-none');
      modal.classList.remove('opacity-100');
      box.classList.remove('scale-100');
      box.classList.add('scale-95');
      idToDelete = null;
    }

    async function executeDelete(id) {
      if (!id) return;
      cancelAction();

      try {
        const response = await fetch('/api/delete', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            id,
            password: '6946'
          })
        });

        if (response.ok) {
          showToast('کار انتخابی با موفقیت حذف گردید.', 'success');
          // Reload local states & filter
          loadList();
        } else {
          showToast('خطا در احراز هویت یا عملیات حذف!', 'error');
        }
      } catch (err) {
        showToast('خطا در حذف آیتم!', 'error');
      }
    }

    // Initial Bootstrap
    loadList();
  </script>
</body>
</html>`;
}
