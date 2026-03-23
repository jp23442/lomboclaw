"use client";

import { Sidebar } from "@/components/Sidebar";
import { ChatArea } from "@/components/ChatArea";
import { LoginScreen } from "@/components/LoginScreen";
import { useOpenClaw } from "@/hooks/useOpenClaw";
import { useGatewayInfo } from "@/hooks/useGatewayInfo";
import { useAppStore } from "@/lib/store";
import { Attachment } from "@/components/ChatInput";

export default function Home() {
  const isLoggedIn = useAppStore((s) => s.auth.isLoggedIn);
  const { sendMessage: rawSend, abortRun, newChat, clientRef } = useOpenClaw();
  const sidebarOpen = useAppStore((s) => s.sidebarOpen);
  const gateway = useGatewayInfo(clientRef);

  if (!isLoggedIn) {
    return <LoginScreen />;
  }

  const sendMessage = (text: string, attachments?: Attachment[]) => {
    const mapped = attachments?.map((a) => ({
      type: a.type,
      mimeType: a.mimeType,
      content: a.content,
      name: a.name,
      size: a.size,
    }));
    rawSend(text, mapped);
  };

  return (
    <main className="flex h-dvh w-screen overflow-hidden bg-gradient-to-br from-[#0a0a0b] via-[#0d0d0f] to-[#0a0a0b] text-zinc-100">
      {/* Mobile: overlay sidebar. Desktop: inline sidebar */}
      {sidebarOpen && (
        <>
          {/* Mobile backdrop */}
          <div
            className="fixed inset-0 z-40 bg-black/50 md:hidden"
            onClick={() => useAppStore.getState().setSidebarOpen(false)}
          />
          <div className="fixed inset-y-0 left-0 z-50 md:relative md:z-auto">
            <Sidebar
              onNewChat={newChat}
              models={gateway.models}
              devices={gateway.devices}
              health={gateway.health}
              onRefresh={gateway.refresh}
            />
          </div>
        </>
      )}
      <ChatArea
        onSend={sendMessage}
        onAbort={abortRun}
        onNewChat={newChat}
        models={gateway.models}
        clientRef={clientRef}
      />
    </main>
  );
}
