import { Sidebar } from "@/components/navigation/Sidebar";

export default function DashboardLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <>
            <Sidebar />
            <main className="ml-64 min-h-screen gradient-bg">
                {children}
            </main>
        </>
    );
}
