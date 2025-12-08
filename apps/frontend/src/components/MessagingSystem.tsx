import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Send, Loader2 } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { 
  getConversation, 
  getDoctorConversations, 
  getPatientConversations,
  createMessage,
  markMessageAsRead,
  type Message as APIMessage,
  type Conversation as APIConversation
} from "@/lib/api";
import { useToast } from "@/hooks/use-toast";

interface Message {
  id: string;
  sender: string;
  content: string;
  timestamp: Date;
  isMe: boolean;
  subject?: string;
}

interface Conversation {
  id: string;
  name: string;
  lastMessage: string;
  unread: number;
}

interface MessagingSystemProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  userType: "patient" | "doctor";
  selectedConversationId?: string;
  userId?: string; // Optional: if provided, use this instead of user?.id from AuthContext
}

export const MessagingSystem = ({
  open,
  onOpenChange,
  userType,
  selectedConversationId,
  userId
}: MessagingSystemProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  // Use provided userId or fall back to user?.id from AuthContext
  const currentUserId = userId || user?.id;
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loadingConversations, setLoadingConversations] = useState(false);
  const [selectedConv, setSelectedConv] = useState<string | null>(selectedConversationId || null);
  const [selectedConversationData, setSelectedConversationData] = useState<APIConversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [newMessage, setNewMessage] = useState("");
  const [sending, setSending] = useState(false);

  // Load conversations when dialog opens
  useEffect(() => {
    if (open && currentUserId) {
      loadConversations();
    }
  }, [open, currentUserId, userType]);

  // Load messages when conversation is selected
  useEffect(() => {
    if (selectedConv && currentUserId) {
      loadMessages();
    }
  }, [selectedConv, currentUserId, userType]);

  const loadConversations = async () => {
    if (!currentUserId) return;
    
    setLoadingConversations(true);
    try {
      let apiConversations: APIConversation[];
      
      if (userType === "doctor") {
        apiConversations = await getDoctorConversations(currentUserId);
      } else {
        apiConversations = await getPatientConversations(currentUserId);
      }

      const formattedConversations: Conversation[] = apiConversations.map(conv => {
        const convId = userType === "doctor" ? conv.patientId : conv.doctorId;
        const convName = userType === "doctor" ? conv.patientName : conv.doctorName;
        return {
          id: convId || "",
          name: convName || "Unknown",
          lastMessage: "Click to view messages",
          unread: conv.unreadCount || 0,
        };
      });

      setConversations(formattedConversations);
      
      // Auto-select first conversation if none selected
      if (!selectedConv && formattedConversations.length > 0) {
        const firstConv = formattedConversations[0];
        setSelectedConv(firstConv.id);
        setSelectedConversationData(apiConversations[0]);
      } else if (selectedConv) {
        // Find the selected conversation data
        const found = apiConversations.find(c => {
          const convId = userType === "doctor" ? c.patientId : c.doctorId;
          return convId === selectedConv;
        });
        if (found) {
          setSelectedConversationData(found);
        }
      }
    } catch (error: any) {
      console.error("Failed to load conversations:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to load conversations",
        variant: "destructive",
      });
    } finally {
      setLoadingConversations(false);
    }
  };

  const loadMessages = async () => {
    if (!currentUserId || !selectedConv) return;

    setLoadingMessages(true);
    try {
      let apiMessages: APIMessage[];
      
      if (userType === "doctor") {
        apiMessages = await getConversation(currentUserId, selectedConv);
      } else {
        apiMessages = await getConversation(selectedConv, currentUserId);
      }

      // Get conversation name from conversations list
      const convName = conversations.find(c => c.id === selectedConv)?.name || "Unknown";
      
      const formattedMessages: Message[] = apiMessages.map(msg => ({
        id: msg.id,
        sender: msg.senderType === userType ? "Me" : convName,
        content: msg.content,
        timestamp: new Date(msg.createdAt),
        isMe: msg.senderType === userType,
        subject: msg.subject,
      }));

      setMessages(formattedMessages);

      // Mark unread messages as read
      const unreadMessages = apiMessages.filter(msg => !msg.isRead && msg.senderType !== userType);
      for (const msg of unreadMessages) {
        await markMessageAsRead(msg.id);
      }
    } catch (error: any) {
      console.error("Failed to load messages:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to load messages",
        variant: "destructive",
      });
    } finally {
      setLoadingMessages(false);
    }
  };

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !currentUserId || !selectedConv) return;
    
    setSending(true);
    try {
      // For doctor: currentUserId is doctorId, selectedConv is patientId
      // For patient: selectedConv is doctorId, currentUserId is patientId
      const doctorId = userType === "doctor" ? currentUserId : selectedConv;
      const patientId = userType === "patient" ? currentUserId : selectedConv;
      
      await createMessage(
        {
          content: newMessage,
          senderType: userType,
        },
        doctorId,
        patientId
      );

      setNewMessage("");
      // Reload messages to show the new one
      await loadMessages();
      // Reload conversations to update last message
      await loadConversations();
    } catch (error: any) {
      console.error("Failed to send message:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to send message",
        variant: "destructive",
      });
    } finally {
      setSending(false);
    }
  };

  const handleSelectConversation = async (convId: string) => {
    setSelectedConv(convId);
    // Reload conversations to get the full API data
    await loadConversations();
    // The loadConversations will set the selectedConversationData
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl h-[600px] p-0">
        <div className="grid grid-cols-3 h-full">
          {/* Conversations List */}
          <div className="border-r border-border">
            <DialogHeader className="p-4 border-b border-border">
              <DialogTitle>Messages</DialogTitle>
            </DialogHeader>
            <ScrollArea className="h-[calc(600px-4rem)]">
              {loadingConversations ? (
                <div className="flex items-center justify-center p-8">
                  <Loader2 className="h-6 w-6 animate-spin text-primary" />
                </div>
              ) : conversations.length === 0 ? (
                <div className="p-8 text-center text-muted-foreground">
                  <p>No conversations yet</p>
                </div>
              ) : (
                conversations.map((conv) => (
                  <button
                    key={conv.id}
                    onClick={() => handleSelectConversation(conv.id)}
                    className={`w-full p-4 text-left hover:bg-accent transition-colors border-b border-border ${
                      selectedConv === conv.id ? "bg-accent" : ""
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <Avatar>
                        <AvatarFallback>{conv.name.split(" ").map(n => n[0]).join("")}</AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <p className="font-semibold text-sm truncate">{conv.name}</p>
                          {conv.unread > 0 && (
                            <span className="bg-primary text-primary-foreground text-xs rounded-full px-2 py-0.5">
                              {conv.unread}
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground truncate">{conv.lastMessage}</p>
                      </div>
                    </div>
                  </button>
                ))
              )}
            </ScrollArea>
          </div>

          {/* Messages Area */}
          <div className="col-span-2 flex flex-col">
            <DialogHeader className="p-4 border-b border-border">
              <DialogTitle>
                {conversations.find(c => c.id === selectedConv)?.name || "Select a conversation"}
              </DialogTitle>
            </DialogHeader>
            
            <ScrollArea className="flex-1 p-4">
              {loadingMessages ? (
                <div className="flex items-center justify-center h-full">
                  <Loader2 className="h-6 w-6 animate-spin text-primary" />
                </div>
              ) : !selectedConv ? (
                <div className="flex items-center justify-center h-full text-muted-foreground">
                  <p>Select a conversation to view messages</p>
                </div>
              ) : messages.length === 0 ? (
                <div className="flex items-center justify-center h-full text-muted-foreground">
                  <p>No messages yet. Start the conversation!</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {messages.map((message) => (
                    <div
                      key={message.id}
                      className={`flex ${message.isMe ? "justify-end" : "justify-start"}`}
                    >
                      <div
                        className={`max-w-[70%] rounded-lg p-3 ${
                          message.isMe
                            ? "bg-primary text-primary-foreground"
                            : "bg-muted"
                        }`}
                      >
                        {message.subject && (
                          <p className={`text-xs font-semibold mb-1 ${
                            message.isMe ? "text-primary-foreground/80" : "text-muted-foreground"
                          }`}>
                            {message.subject}
                          </p>
                        )}
                        <p className="text-sm">{message.content}</p>
                        <p className={`text-xs mt-1 ${
                          message.isMe ? "text-primary-foreground/70" : "text-muted-foreground"
                        }`}>
                          {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </ScrollArea>

            {/* Message Input */}
            {selectedConv && (
              <div className="p-4 border-t border-border">
                <div className="flex gap-2">
                  <Input
                    placeholder="Type a message..."
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && !sending && handleSendMessage()}
                    disabled={sending}
                  />
                  <Button 
                    onClick={handleSendMessage} 
                    size="icon"
                    disabled={sending || !newMessage.trim()}
                  >
                    {sending ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Send className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
