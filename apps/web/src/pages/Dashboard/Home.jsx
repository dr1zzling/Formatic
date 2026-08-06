import Sidebar from "../../components/Sidebar";

export default function Home() {
  return (
    <div className="flex min-h-screen bg-slate-50">
      <Sidebar />
      <main className="flex-1" />
    </div>
  );
}
