"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import { DropdownMenu, DropdownMenuContent, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Bell, CheckCheck, Trash2, AlertCircle, DollarSign, Shield, Settings, XCircle, Clock } from "lucide-react"
import { useAppStore } from "@/lib/store"
import { formatDistanceToNow } from "date-fns"
import Link from "next/link"
import type { Notification } from "@/lib/types"

const getNotificationIcon = (type: Notification["type"]) => {
  switch (type) {
    case "payment":
      return <DollarSign className="h-4 w-4 text-green-600" />
    case "approval":
      return <Clock className="h-4 w-4 text-blue-600" />
    case "security":
      return <Shield className="h-4 w-4 text-red-600" />
    case "rejection":
      return <XCircle className="h-4 w-4 text-red-600" />
    case "system":
      return <Settings className="h-4 w-4 text-gray-600" />
    default:
      return <AlertCircle className="h-4 w-4 text-gray-600" />
  }
}

const getNotificationColor = (type: Notification["type"]) => {
  switch (type) {
    case "payment":
      return "bg-green-50 border-green-200 dark:bg-green-950 dark:border-green-800"
    case "approval":
      return "bg-blue-50 border-blue-200 dark:bg-blue-950 dark:border-blue-800"
    case "security":
      return "bg-red-50 border-red-200 dark:bg-red-950 dark:border-red-800"
    case "rejection":
      return "bg-red-50 border-red-200 dark:bg-red-950 dark:border-red-800"
    case "system":
      return "bg-gray-50 border-gray-200 dark:bg-gray-950 dark:border-gray-800"
    default:
      return "bg-gray-50 border-gray-200 dark:bg-gray-950 dark:border-gray-800"
  }
}

interface NotificationItemProps {
  notification: Notification
  onMarkAsRead: (id: string) => void
  onRemove: (id: string) => void
}

function NotificationItem({ notification, onMarkAsRead, onRemove }: NotificationItemProps) {
  const handleClick = () => {
    if (!notification.read) {
      onMarkAsRead(notification.id)
    }
  }

  const content = (
    <div
      className={`
        p-3 border rounded-lg cursor-pointer transition-all hover:shadow-sm
        ${notification.read ? "bg-background" : getNotificationColor(notification.type)}
        ${!notification.read ? "border-l-4" : ""}
      `}
      onClick={handleClick}
    >
      <div className="flex items-start gap-3">
        <div className="flex-shrink-0 mt-0.5">{getNotificationIcon(notification.type)}</div>
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1">
              <p className={`text-sm font-medium ${!notification.read ? "text-foreground" : "text-muted-foreground"}`}>
                {notification.title}
              </p>
              <p className="text-xs text-muted-foreground mt-1">{notification.message}</p>
              {notification.metadata && (
                <div className="flex items-center gap-2 mt-2 text-xs text-muted-foreground">
                  {notification.metadata.amount && (
                    <span>₦{Number(notification.metadata.amount).toLocaleString()}</span>
                  )}
                  {notification.metadata.employeeCount && <span>{notification.metadata.employeeCount} employees</span>}
                </div>
              )}
            </div>
            <div className="flex items-center gap-1">
              {!notification.read && <div className="w-2 h-2 bg-primary rounded-full" />}
              <Button
                variant="ghost"
                size="sm"
                className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                onClick={(e) => {
                  e.stopPropagation()
                  onRemove(notification.id)
                }}
              >
                <Trash2 className="h-3 w-3" />
              </Button>
            </div>
          </div>
          <p className="text-xs text-muted-foreground mt-2">
            {formatDistanceToNow(new Date(notification.timestamp), { addSuffix: true })}
          </p>
        </div>
      </div>
    </div>
  )

  if (notification.actionUrl) {
    return (
      <Link href={notification.actionUrl} className="block group">
        {content}
      </Link>
    )
  }

  return <div className="group">{content}</div>
}

export function NotificationCenter() {
  const { notifications, markNotificationAsRead, markAllNotificationsAsRead, removeNotification } = useAppStore()

  const [isOpen, setIsOpen] = useState(false)

  const unreadCount = notifications.filter((n) => !n.read).length
  const recentNotifications = notifications.slice(0, 10)

  return (
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm" className="relative">
          <Bell className="h-4 w-4" />
          {unreadCount > 0 && (
            <Badge
              variant="destructive"
              className="absolute -top-1 -right-1 h-5 w-5 p-0 text-xs flex items-center justify-center"
            >
              {unreadCount > 99 ? "99+" : unreadCount}
            </Badge>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80 p-0">
        <div className="p-4 pb-2">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold">Notifications</h3>
            <div className="flex items-center gap-2">
              {unreadCount > 0 && (
                <Button variant="ghost" size="sm" onClick={markAllNotificationsAsRead} className="h-6 text-xs">
                  <CheckCheck className="h-3 w-3 mr-1" />
                  Mark all read
                </Button>
              )}
            </div>
          </div>
          {unreadCount > 0 && (
            <p className="text-xs text-muted-foreground mt-1">
              You have {unreadCount} unread notification{unreadCount !== 1 ? "s" : ""}
            </p>
          )}
        </div>

        <Separator />

        <ScrollArea className="h-96">
          <div className="p-2">
            {recentNotifications.length > 0 ? (
              <div className="space-y-2">
                {recentNotifications.map((notification) => (
                  <NotificationItem
                    key={notification.id}
                    notification={notification}
                    onMarkAsRead={markNotificationAsRead}
                    onRemove={removeNotification}
                  />
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <Bell className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">No notifications</p>
                <p className="text-xs text-muted-foreground">You're all caught up!</p>
              </div>
            )}
          </div>
        </ScrollArea>

        {notifications.length > 10 && (
          <>
            <Separator />
            <div className="p-2">
              <Link href="/notifications">
                <Button variant="ghost" className="w-full text-sm">
                  View all notifications
                </Button>
              </Link>
            </div>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
