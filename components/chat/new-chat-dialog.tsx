
"use client";

import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { useAuth } from "@/lib/auth-context";
import { getUsers } from "@/lib/chat-service";
import type { ChatUser } from "@/types/chat";
import { Loader2Icon, SearchIcon } from "lucide-react";
import Image from "next/image";
import { useEffect, useState } from "react";
import { Input } from "../ui/input";
import { useChatState } from "./use-chat-state";

export function NewChatDialog() {
  const { isNewChatDialogOpen, closeNewChatDialog, createConversation } =
    useChatState();
  const [users, setUsers] = useState<ChatUser[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const { user: currentUser } = useAuth();

  useEffect(() => {
    if (isNewChatDialogOpen) {
      setLoading(true);
      getUsers()
        .then(setUsers)
        .finally(() => setLoading(false));
    } else {
      setSearch("");
    }
  }, [isNewChatDialogOpen]);

  const filteredUsers = users.filter(
    (user) =>
      user.id !== currentUser?.uid &&
      (user.name.toLowerCase().includes(search.toLowerCase()) ||
        user.username.toLowerCase().includes(search.toLowerCase()))
  );

  const handleUserClick = (user: ChatUser) => {
    createConversation(user.id);
  };

  return (
    <Dialog open={isNewChatDialogOpen} onOpenChange={closeNewChatDialog}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Start a new chat</DialogTitle>
          <DialogDescription>
            Choose a user to start a conversation with
          </DialogDescription>
        </DialogHeader>
        
        <div className="relative">
          <SearchIcon className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search users..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-8"
          />
        </div>

        <div className="mt-4 relative min-h-[200px]">
          {loading ? (
            <div className="absolute inset-0 flex items-center justify-center">
              <Loader2Icon className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : filteredUsers.length === 0 ? (
            <div className="text-center text-sm text-muted-foreground py-8">
              {search ? "No users found" : "No users available"}
            </div>
          ) : (
            <div className="divide-y divide-border">
              {filteredUsers.map((user) => (
                <button
                  key={user.id}
                  onClick={() => handleUserClick(user)}
                  className="flex items-center gap-3 w-full px-2 py-3 hover:bg-accent rounded-lg transition-colors"
                >
                  <Image
                    src={user.avatar}
                    alt={user.name}
                    width={40}
                    height={40}
                    className="rounded-full"
                  />
                  <div className="flex-1 text-left">
                    <div className="font-medium">{user.name}</div>
                    <div className="text-sm text-muted-foreground">
                      @{user.username}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
