import { useState } from "react";
import Sidebar from "../../components/Sidebar";
import { Search, Filter, Trash2, Bell, Settings } from "lucide-react";

const FILTER_TABS = ["Semua","1 Hari Tersedia","30 Hari Tersedia","Survey","Quiz","Ujian"];

const DEMO = [
  { id:1, title:"Survey Kepuasan Layanan Sekolah", category:"Survey", status:"public", responses:245, gradient:"linear-gradient(135deg,#dbeafe,#93c5fd)" },
  { id:2, title:"Quiz Pengetahuan Umum",           category:"Quiz",   status:"public", responses:1200, gradient:"linear-gradient(135deg,#ede9fe,#c4b5fd)" },
  { id:3, title:"Form Pendaftaran Seminar Nasional 2025", category:"Survey", status:"public", responses:312, gradient:"linear-gradient(135deg,#dcfce7,#86efac)" },
  { id:4, title:"Evaluasi Pembelajaran Siswa",     category:"Exam",   status:"public", responses:98, gradient:"linear-gradient(135deg,#fef9c3,#fde047)" },
  { id:5, title:"Pendataan Kegiatan Ekstrakurikuler", category:"Survey", status:"public", responses:156, gradient:"linear-gradient(135deg,#ffedd5,#fb923c)" },
];

function getUsername() {
  const token = localStorage.getItem("token");
  if (!token) return "User";
  try { const p = JSON.parse(atob(token.split(".")[1])); return p.username||p.name||"User"; }
  catch { return "User"; }
}

export default function Trash() {
  const [activeFilter, setActiveFilter] = useState("Semua");
  const [search, setSearch]             = useState("");
  const [items, setItems]               = useState(DEMO);
  const username = getUsername();

  const filtered = items.filter(f => f.title.toLowerCase().includes(search.toLowerCase()));

  const handleRestore = (id) => setItems(prev => prev.filter(f => f.id !== id));
  const handleDelete  = (id) => setItems(prev => prev.filter(f => f.id !== id));

  return (
    <div className="flex min-h-screen bg-slate-50">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-auto">
        {/* Header */}
        <header className="flex items-center justify-between px-8 pt-7 pb-2">
          <div>
            <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">Hi, {username}! 👋</h1>
            <p className="text-sm text-gray-500 mt-0.5">Forms yang telah dihapus tersimpan maks 30 hari sebelum dihapus permanen.</p>
          </div>
          <div className="flex items-center gap-2">
            <button className="w-9 h-9 rounded-full border border-gray-200 flex items-center justify-center text-gray-500 hover:bg-gray-100"><Bell size={18}/></button>
            <button className="w-9 h-9 rounded-full border border-gray-200 flex items-center justify-center text-gray-500 hover:bg-gray-100"><Settings size={18}/></button>
            <div className="w-9 h-9 rounded-full flex items-center justify-center text-white font-bold text-sm" style={{background:"linear-gradient(135deg,#005fb3,#009bf5)"}}>
              {username[0]?.toUpperCase()}
            </div>
          </div>
        </header>

        {/* Title */}
        <div className="px-8 mt-5 mb-4 flex items-center gap-2">
          <Trash2 size={22} className="text-red-500"/>
          <h2 className="font-bold text-xl text-gray-800">Trash</h2>
        </div>

        {/* Search + Filter */}
        <div className="px-8 mb-4 flex items-center gap-3">
          <div className="relative flex-1 max-w-md">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"/>
            <input type="text" placeholder="Search deleted forms..." value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm bg-white outline-none focus:ring-2 focus:ring-blue-300 transition"/>
          </div>
          <button className="flex items-center gap-1.5 px-3 py-2.5 border border-gray-200 rounded-xl text-sm text-gray-600 bg-white hover:bg-gray-50 transition">
            <Filter size={14}/> Filter
          </button>
        </div>

        {/* Filter tabs */}
        <div className="px-8 mb-5 flex items-center gap-2 flex-wrap">
          {FILTER_TABS.map(tab => (
            <button key={tab} onClick={() => setActiveFilter(tab)}
              className={`px-3 py-1.5 rounded-full text-xs font-medium transition ${activeFilter===tab ? "text-white" : "bg-white border border-gray-200 text-gray-600 hover:bg-gray-50"}`}
              style={activeFilter===tab ? {background:"linear-gradient(90deg,#005fb3,#009bf5)"} : {}}>
              {tab}
            </button>
          ))}
        </div>

        {/* List */}
        <div className="flex-1 px-8 pb-8 space-y-3 overflow-auto">
          {filtered.length === 0 ? (
            <div className="flex flex-col items-center py-20 text-center">
              <p className="text-5xl mb-3">🗑️</p>
              <p className="font-semibold text-gray-700">Trash kosong</p>
            </div>
          ) : filtered.map(form => (
            <TrashItem key={form.id} form={form} onRestore={() => handleRestore(form.id)} onDelete={() => handleDelete(form.id)} />
          ))}

          {filtered.length > 0 && (
            <p className="text-center text-xs text-gray-400 py-4">
              Forms di Trash akan dihapus permanen setelah 30 hari sejak penghapusan.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

function TrashItem({ form, onRestore, onDelete }) {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm flex items-center gap-4 p-4 hover:shadow-md transition">
      <div className="w-24 h-16 rounded-xl shrink-0 flex items-center justify-center" style={{background:form.gradient}}>
        <svg className="w-8 h-8 opacity-25" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
        </svg>
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-semibold text-gray-800 text-sm truncate">{form.title}</p>
        <div className="flex items-center gap-2 mt-1 text-xs text-gray-400 flex-wrap">
          <span className="bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-medium uppercase text-[10px]">{form.status}</span>
          <span>·</span><span>{form.category}</span>
          <span>·</span><span>{form.responses.toLocaleString()} responses</span>
        </div>
      </div>
      <div className="flex items-center gap-2 shrink-0">
        <button onClick={onRestore} className="px-3 py-1.5 rounded-lg border border-gray-200 text-xs font-medium text-gray-600 hover:bg-gray-50 transition">
          Restore
        </button>
        <button onClick={onDelete} className="px-3 py-1.5 rounded-lg bg-red-50 border border-red-100 text-xs font-medium text-red-500 hover:bg-red-100 transition">
          Delete Permanently
        </button>
      </div>
    </div>
  );
}
