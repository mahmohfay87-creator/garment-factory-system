import { useMemo, useRef, useState } from "react";
import {
  CalendarClock,
  ClipboardList,
  Download,
  FileText,
  Factory,
  LayoutDashboard,
  LogOut,
  Menu,
  Package,
  RotateCcw,
  Scissors,
  Upload,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { toast, Toaster } from "sonner";
import type { AppData } from "@/lib/domain";
import { useStore } from "@/store/store";
import { OrderDetailSheet } from "@/components/OrderDetail";
import { DashboardPage } from "@/pages/Dashboard";
import { OrdersPage } from "@/pages/Orders";
import { ProductionPage } from "@/pages/Production";
import { MaterialsPage } from "@/pages/Materials";
import { DeliveriesPage } from "@/pages/Deliveries";
import { DailyReportPage } from "@/pages/DailyReport";
import { cn } from "@/lib/utils";
import { AuthGate } from "@/components/AuthGate";
import type { AuthSession } from "@/lib/supabase-auth";

type View = "dashboard" | "orders" | "production" | "materials" | "deliveries" | "report";

const NAV: { id: View; label: string; icon: React.ReactNode }[] = [
  { id: "dashboard", label: "لوحة المتابعة", icon: <LayoutDashboard /> },
  { id: "orders", label: "تسجيل الطلبيات", icon: <ClipboardList /> },
  { id: "production", label: "مراحل الإنتاج", icon: <Factory /> },
  { id: "materials", label: "الخامات والإكسسوارات", icon: <Package /> },
  { id: "deliveries", label: "مواعيد التسليم", icon: <CalendarClock /> },
  { id: "report", label: "التقرير اليومي", icon: <FileText /> },
];

function DataTools() {
  const { data, replaceAll, resetAll } = useStore();
  const fileRef = useRef<HTMLInputElement>(null);
  const [confirmReset, setConfirmReset] = useState(false);

  const backup = () => {
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `نسخة-احتياطية-مصنع-الملابس-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("تم تنزيل النسخة الاحتياطية");
  };

  const restore = (file: File) => {
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const parsed = JSON.parse(String(reader.result)) as AppData;
        if (!parsed || !Array.isArray(parsed.orders)) throw new Error("bad file");
        replaceAll(parsed);
        toast.success("تم استرجاع البيانات من النسخة الاحتياطية");
      } catch {
        toast.error("الملف غير صالح — تأكد أنه نسخة احتياطية من البرنامج");
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="flex flex-col gap-1 border-t border-sidebar-border pt-3">
      <button
        type="button"
        onClick={backup}
        className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-[13.5px] font-medium text-sidebar-foreground/85 outline-none transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground focus-visible:ring-2 focus-visible:ring-sidebar-ring"
      >
        <Download className="size-4 shrink-0" />
        نسخة احتياطية
      </button>
      <button
        type="button"
        onClick={() => fileRef.current?.click()}
        className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-[13.5px] font-medium text-sidebar-foreground/85 outline-none transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground focus-visible:ring-2 focus-visible:ring-sidebar-ring"
      >
        <Upload className="size-4 shrink-0" />
        استرجاع نسخة
      </button>
      <button
        type="button"
        onClick={() => setConfirmReset(true)}
        className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-[13.5px] font-medium text-sidebar-foreground/85 outline-none transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground focus-visible:ring-2 focus-visible:ring-sidebar-ring"
      >
        <RotateCcw className="size-4 shrink-0" />
        إعادة ضبط البيانات
      </button>
      <input
        ref={fileRef}
        type="file"
        accept="application/json"
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) restore(f);
          e.target.value = "";
        }}
      />

      <AlertDialog open={confirmReset} onOpenChange={setConfirmReset}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>إعادة ضبط كل البيانات؟</AlertDialogTitle>
            <AlertDialogDescription>
              ستُحذف كل التعديلات ويعود البرنامج للبيانات الافتتاحية الأصلية. ننصح بتنزيل نسخة
              احتياطية أولًا.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>تراجع</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => {
                resetAll();
                setConfirmReset(false);
                toast.success("تمت إعادة الضبط للبيانات الافتتاحية");
              }}
            >
              إعادة الضبط
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

function SidebarContent({ view, setView }: { view: View; setView: (v: View) => void }) {
  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center gap-3 px-4 pb-5 pt-5">
        <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-sidebar-primary text-sidebar-primary-foreground">
          <Scissors className="size-5" />
        </div>
        <div className="min-w-0">
          <div className="truncate text-[15px] font-extrabold leading-6">مصنع الملابس</div>
          <div className="text-[11.5px] leading-4 text-sidebar-foreground/70">
            الزي الأزهري | الجلباب الرجالي | البدلات
          </div>
        </div>
      </div>

      <nav className="flex flex-1 flex-col gap-1 px-3" aria-label="التنقل الرئيسي">
        {NAV.map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => setView(item.id)}
            aria-current={view === item.id ? "page" : undefined}
            className={cn(
              "flex items-center gap-2.5 rounded-lg px-3 py-2.5 text-[14px] font-semibold outline-none transition-colors focus-visible:ring-2 focus-visible:ring-sidebar-ring",
              view === item.id
                ? "bg-sidebar-primary text-sidebar-primary-foreground shadow-sm"
                : "text-sidebar-foreground/85 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
            )}
          >
            <span className="[&_svg]:size-[18px]">{item.icon}</span>
            {item.label}
          </button>
        ))}
      </nav>

      <div className="px-3 pb-4">
        <DataTools />
      </div>
    </div>
  );
}

function FactoryApp({ logout, session }: { logout: () => void; session: AuthSession }) {
  const [view, setView] = useState<View>("dashboard");
  const [menuOpen, setMenuOpen] = useState(false);
  const [detailOrderId, setDetailOrderId] = useState<string | null>(null);
  const { orders } = useStore();

  const detailOrder = useMemo(
    () => orders.find((o) => o.id === detailOrderId) ?? null,
    [orders, detailOrderId],
  );

  const openOrder = (id: string) => setDetailOrderId(id);

  const go = (v: View) => {
    setView(v);
    setMenuOpen(false);
  };

  return (
    <div className="min-h-100dvh lg:grid lg:grid-cols-[250px_1fr]">
      {/* الشريط الجانبي — يثبت على اليمين في واجهة RTL */}
      <aside className="sticky top-0 z-30 hidden h-100dvh bg-sidebar text-sidebar-foreground lg:block">
        <SidebarContent view={view} setView={setView} />
      </aside>

      {/* شريط علوي للموبايل */}
      <header className="sticky top-0 z-30 flex items-center gap-3 border-b border-border/60 bg-secondary/90 px-4 py-3 backdrop-blur-sm lg:hidden">
        <Button
          variant="outline"
          size="sm"
          className="h-10 w-10 p-0"
          onClick={() => setMenuOpen(true)}
          aria-label="فتح القائمة"
        >
          <Menu className="size-5" />
        </Button>
        <div className="flex items-center gap-2.5">
          <div className="flex size-8 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground">
            <Scissors className="size-4" />
          </div>
          <span className="text-[15px] font-extrabold">مصنع الملابس</span>
        </div>
      </header>

      <Sheet open={menuOpen} onOpenChange={setMenuOpen}>
        <SheetContent side="right" className="w-[280px] bg-sidebar p-0 text-sidebar-foreground">
          <SidebarContent view={view} setView={go} />
        </SheetContent>
      </Sheet>

      <main className="min-w-0 px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
        <div className="mx-auto max-w-[1400px]">
          <div className="mb-4 flex items-center justify-between gap-3 rounded-xl border bg-card px-3 py-2 text-xs text-muted-foreground"><span>تم تسجيل الدخول: {session.user.email}</span><Button variant="ghost" size="sm" onClick={logout}><LogOut className="ml-2 size-4"/>خروج</Button></div>
          {view === "dashboard" ? <DashboardPage onOpenOrder={openOrder} /> : null}
          {view === "orders" ? <OrdersPage onOpenOrder={openOrder} /> : null}
          {view === "production" ? <ProductionPage /> : null}
          {view === "materials" ? <MaterialsPage /> : null}
          {view === "deliveries" ? <DeliveriesPage onOpenOrder={openOrder} /> : null}
          {view === "report" ? <DailyReportPage /> : null}
        </div>
      </main>

      <OrderDetailSheet order={detailOrder} onOpenChange={(v) => !v && setDetailOrderId(null)} />
      <Toaster position="top-center" dir="rtl" richColors closeButton />
    </div>
  );
}


export default function App() {
  return <AuthGate>{(session, logout) => <FactoryApp session={session} logout={logout} />}</AuthGate>;
}
