import { ReactNode } from "react";
import DashboardSidebar from "./DashboardSidebar";
import { Link } from "react-router-dom";
import { LayoutDashboard, Mic, FileText, TrendingUp } from "lucide-react";

const DashboardLayout = ({ children }: { children: ReactNode }) => {
  return (
    <div className="flex min-h-screen bg-background">
      <DashboardSidebar />
      <main className="flex-1 p-6 md:p-10 overflow-auto">
        {children}
      </main>
      {/* Mobile bottom nav */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-sidebar border-t-[3px] border-foreground flex justify-around py-3 z-50">
        {[
          { icon: LayoutDashboard, path: "/dashboard" },
          { icon: Mic, path: "/record" },
          { icon: FileText, path: "/report" },
          { icon: TrendingUp, path: "/progress" },
        ].map((item) => (
          <Link key={item.path} to={item.path} className="p-2">
            <item.icon className="w-6 h-6" strokeWidth={2.5} />
          </Link>
        ))}
      </nav>
    </div>
  );
};

export default DashboardLayout;
