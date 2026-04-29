import { Link, useLocation } from "react-router-dom";
import { LayoutDashboard, Mic, FileText, TrendingUp, Settings } from "lucide-react";

const navItems = [
  { icon: LayoutDashboard, label: "Dashboard", path: "/dashboard" },
  { icon: Mic, label: "Record", path: "/record" },
  { icon: FileText, label: "Reports", path: "/report" },
  { icon: TrendingUp, label: "Progress", path: "/progress" },
  { icon: Settings, label: "Settings", path: "/settings" },
];

const DashboardSidebar = () => {
  const location = useLocation();

  return (
    <aside className="w-64 min-h-screen bg-sidebar border-r-[3px] border-foreground p-6 hidden md:block">
      <Link to="/" className="font-display text-xl font-black mb-10 block">Verbalyst</Link>
      <nav className="flex flex-col gap-2">
        {navItems.map((item) => {
          const active = location.pathname === item.path || location.pathname.startsWith(item.path + "/");
          return (
            <Link
              key={item.path}
              to={item.path}
              className={`flex items-center gap-3 px-4 py-3 rounded-lg font-semibold transition-all duration-100 brutal-border ${
                active
                  ? "bg-foreground text-background brutal-shadow-sm translate-x-0"
                  : "bg-transparent border-transparent hover:bg-sidebar-accent hover:border-foreground hover:brutal-shadow-sm hover:translate-x-1"
              }`}
            >
              <item.icon className="w-5 h-5" strokeWidth={2.5} />
              {item.label}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
};

export default DashboardSidebar;
