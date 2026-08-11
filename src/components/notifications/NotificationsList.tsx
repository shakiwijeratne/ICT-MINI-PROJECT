import { useEffect, useState } from 'react';
import {  
  CheckCircle,
  AlertTriangle,
  Info,
  XCircle,
} from 'lucide-react';

import { useAuth } from '../../contexts/useAuth';

import {
  getNotifications,
  markNotificationRead,
} from '../../services/dataService';

import {
  PageHeader,
  Card,
  EmptyState,
} from '../ui';

import type { AppNotification } from '../../types';

export function NotificationsList({
  title = 'Notifications',
  subtitle = 'View your latest notifications',
}: {
  title?: string;
  subtitle?: string;
}) {
  const { user } = useAuth();

  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [loading, setLoading] = useState(true);

  const loadNotifications = async () => {
    if (!user?.uid) {
      setNotifications([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);

      const data = await getNotifications(user.uid);

      setNotifications(
        data.sort(
          (a, b) =>
            new Date(b.createdAt).getTime() -
            new Date(a.createdAt).getTime()
        )
      );
    } catch (error) {
      console.error('Failed to load notifications:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadNotifications();
  }, [user?.uid]);

  const handleRead = async (notification: AppNotification) => {
    if (notification.read) return;

    try {
      await markNotificationRead(notification.id);

      setNotifications((prev) =>
        prev.map((item) =>
          item.id === notification.id
            ? { ...item, read: true }
            : item
        )
      );
    } catch (error) {
      console.error('Failed to mark notification as read:', error);
    }
  };

  const getIcon = (type: AppNotification['type']) => {
    switch (type) {
      case 'success':
        return <CheckCircle size={22} />;

      case 'warning':
        return <AlertTriangle size={22} />;

      case 'error':
        return <XCircle size={22} />;

      default:
        return <Info size={22} />;
    }
  };

  const getTypeClass = (type: AppNotification['type']) => {
    switch (type) {
      case 'success':
        return 'notification-success';

      case 'warning':
        return 'notification-warning';

      case 'error':
        return 'notification-error';

      default:
        return 'notification-info';
    }
  };

  return (
    <div className="page">
      <PageHeader
        title={title}
        subtitle={subtitle}
      />

      <Card>
        {loading ? (
          <div style={{ padding: '2rem', textAlign: 'center' }}>
            Loading notifications...
          </div>
        ) : notifications.length === 0 ? (
          <EmptyState message="You have no notifications." />
        ) : (
          <div className="notifications-list">
            {notifications.map((notification) => (
              <button
                key={notification.id}
                type="button"
                onClick={() => handleRead(notification)}
                className={`notification-item ${
                  notification.read
                    ? 'notification-read'
                    : 'notification-unread'
                }`}
              >
                <div
                  className={`notification-icon ${getTypeClass(
                    notification.type
                  )}`}
                >
                  {getIcon(notification.type)}
                </div>

                <div className="notification-content">
                  <div className="notification-header">
                    <strong>{notification.title}</strong>

                    {!notification.read && (
                      <span className="notification-dot" />
                    )}
                  </div>

                  <p>{notification.message}</p>

                  <small>
                    {new Date(
                      notification.createdAt
                    ).toLocaleString()}
                  </small>
                </div>
              </button>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}