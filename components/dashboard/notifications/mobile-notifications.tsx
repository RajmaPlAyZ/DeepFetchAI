"use client";

import React, { useState, useEffect } from "react";
import { Badge } from "@/components/ui/badge";
import { Bullet } from "@/components/ui/bullet";
import { AnimatePresence, motion, PanInfo } from "motion/react";
import NotificationItem from "./notification-item";
import type { Notification } from "@/types/dashboard";
import { SheetClose, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { useIsV0 } from "@/lib/v0-context";
import { NotificationService } from "@/lib/notification-service";
import { useAuth } from "@/lib/auth-context";

interface MobileNotificationsProps {
  initialNotifications?: Notification[];
}

interface SwipeableWrapperProps {
  children: React.ReactNode;
  onDelete: () => void;
}

function SwipeableWrapper({ children, onDelete }: SwipeableWrapperProps) {
  const handleDragEnd = (event: Event, info: PanInfo) => {
    // Delete if swiped left more than 120px OR with sufficient velocity
    const shouldDelete =
      info.offset.x < -120 || (info.offset.x < -50 && info.velocity.x < -500);

    if (shouldDelete) {
      // Immediate deletion - let parent handle exit animation
      onDelete();
    }
  };

  return (
    <motion.div
      drag="x"
      dragConstraints={{ left: -200, right: 0 }}
      dragSnapToOrigin
      dragElastic={0.2}
      onDragEnd={handleDragEnd}
      whileDrag={{
        scale: 0.98,
        boxShadow: "0 5px 15px rgba(0,0,0,0.1)",
      }}
      className="relative cursor-grab active:cursor-grabbing"
      style={{ touchAction: "pan-y" }} // Allow vertical scrolling, horizontal dragging
    >
      {children}
    </motion.div>
  );
}

export default function MobileNotifications({
  initialNotifications = [],
}: MobileNotificationsProps) {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>(initialNotifications);
  const isV0 = useIsV0();

  useEffect(() => {
    if (user) {
      loadNotifications();
      
      // Poll for new notifications every 30 seconds
      const interval = setInterval(() => {
        loadNotifications();
      }, 30000);
      
      return () => clearInterval(interval);
    }
  }, [user]);

  const loadNotifications = async () => {
    if (!user) return;
    
    try {
      const userNotifications = await NotificationService.getUserNotifications(user.uid);
      // Convert Firebase notifications to dashboard notification format
      const formattedNotifications: Notification[] = userNotifications.map(notif => ({
        id: notif.id,
        title: notif.title,
        message: notif.message,
        timestamp: notif.timestamp,
        type: notif.type as "info" | "warning" | "success" | "error",
        read: notif.read,
        priority: "medium" as "low" | "medium" | "high"
      }));
      setNotifications(formattedNotifications);
    } catch (error) {
      console.error('Failed to load notifications:', error);
    }
  };

  const unreadCount = notifications.filter((n) => !n.read).length;

  const markAsRead = async (id: string) => {
    try {
      await NotificationService.markAsRead(id);
      setNotifications((prev) =>
        prev.map((notif) => (notif.id === id ? { ...notif, read: true } : notif))
      );
    } catch (error) {
      console.error('Failed to mark as read:', error);
    }
  };

  const deleteNotification = async (id: string) => {
    try {
      await NotificationService.deleteNotification(id);
      setNotifications((prev) => prev.filter((notif) => notif.id !== id));
    } catch (error) {
      console.error('Failed to delete notification:', error);
    }
  };

  return (
    <div className="h-full flex flex-col">
      {/* Accessibility Title */}
      <SheetHeader className="sr-only">
        <SheetTitle>Notifications</SheetTitle>
      </SheetHeader>

      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-border">
        <div className="flex items-center gap-2.5">
          {unreadCount > 0 ? <Badge>{unreadCount}</Badge> : <Bullet />}
          <h2 className="text-sm font-medium uppercase">Notifications</h2>
        </div>
        <SheetClose>
          <Badge
            variant="secondary"
            className="uppercase text-muted-foreground"
          >
            Close
          </Badge>
        </SheetClose>
      </div>

      {/* Notifications List */}
      <div className="flex-1 overflow-y-auto overflow-x-clip p-2 space-y-2 bg-muted">
        {notifications.length === 0 ? (
          <div className="flex items-center justify-center h-32">
            <p className="text-sm text-muted-foreground">No notifications</p>
          </div>
        ) : (
          <AnimatePresence mode={isV0 ? "wait" : "popLayout"}>
            {notifications.map((notification) => (
              <motion.div
                key={notification.id}
                layout
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8, x: -300 }}
                transition={{
                  layout: { duration: 0.3, ease: "easeOut" },
                  opacity: { duration: 0.2 },
                  scale: { duration: 0.2 },
                  x: { duration: 0.2 },
                }}
              >
                <SwipeableWrapper
                  onDelete={() => deleteNotification(notification.id)}
                >
                  <NotificationItem
                    notification={notification}
                    onMarkAsRead={markAsRead}
                    onDelete={deleteNotification}
                  />
                </SwipeableWrapper>
              </motion.div>
            ))}
          </AnimatePresence>
        )}
      </div>

      {/* Swipe Hint */}
      {notifications.length > 0 && (
        <div className="p-4 border-t border-border">
          <p className="text-xs text-muted-foreground text-center">
            Swipe left to delete notifications
          </p>
        </div>
      )}
    </div>
  );
}
