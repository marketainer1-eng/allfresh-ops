import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import AppSidebar from "@/components/app/Sidebar";
import AppHeader from "@/components/app/Header";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  const user = session.user as {
    name?: string | null;
    email?: string | null;
    role?: string;
    workspaceId?: string;
    workspaceName?: string;
  };

  return (
    <div className="flex h-screen overflow-hidden bg-gray-50">
      <AppSidebar user={user} />
      <div className="flex-1 flex flex-col overflow-hidden">
        <AppHeader user={user} />
        <main className="flex-1 overflow-y-auto p-6 scrollbar-thin">
          {children}
        </main>
      </div>
    </div>
  );
}
