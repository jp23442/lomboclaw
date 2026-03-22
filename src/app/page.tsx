"use client";

import { Sidebar } from "@/components/Sidebar";
import { ChatArea } from "@/components/ChatArea";
import { useOpenClaw } from "@/hooks/useOpenClaw";
import { useGatewayInfo } from "@/hooks/useGatewayInfo";
import { useAppStore } from "@/lib/store";
import { Attachment } from "@/components/ChatInput";

export default function Home() {
  const { sendMessage: rawSend, abortRun, newChat, clientRef } = useOpenClaw();
  const sidebarOpen = useAppStore((s) => s.sidebarOpen);
  const gateway = useGatewayInfo(clientRef);

  const sendMessage = (text: string, attachments?: Attachment[]) => {
    const mapped = attachments?.map((a) => ({
      type: a.type,
      mimeType: a.mimeType,
      content: a.content,
    }));
    rawSend(text, mapped);
  };

  return (
    <main className="flex h-screen w-screen overflow-hidden bg-[#171717] text-zinc-100 safe-top safe-bottom">
      {sidebarOpen && (
        <Sidebar
          onNewChat={newChat}
          models={gateway.models}
          devices={gateway.devices}
          health={gateway.health}
          onRefresh={gateway.refresh}
        />
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
