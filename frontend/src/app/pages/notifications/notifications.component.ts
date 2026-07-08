import { Component, OnInit } from '@angular/core';
import { StockNotificationService } from '../../core/services/stock-notification.service';
import { StockNotificationItem } from '../../models';

@Component({
  selector: 'app-notifications',
  templateUrl: './notifications.component.html'
})
export class NotificationsComponent implements OnInit {
  loading = true;
  error = '';
  message = '';
  totalCount = 0;
  notifications: StockNotificationItem[] = [];
  deletingIds = new Set<number>();

  constructor(private stockNotificationService: StockNotificationService) {}

  ngOnInit(): void {
    this.stockNotificationService.fetchAllNotifications('demo@knack.com').subscribe({
      next: (res) => {
        this.loading = false;
        this.message = res.message;
        this.totalCount = res.totalCount;
        this.notifications = res.notifications ?? [];
      },
      error: () => {
        this.loading = false;
        this.error = 'Failed to fetch notifications.';
      }
    });
  }

  deleteNotification(n: StockNotificationItem): void {
    if (n.notificationStatus !== 'PENDING') return;

    this.deletingIds.add(n.id);
    this.stockNotificationService.deleteNotification(n.id, n.email).subscribe({
      next: (res) => {
        this.deletingIds.delete(n.id);
        if (!res.success) {
          this.error = res.message || 'Failed to delete notification.';
          return;
        }

        this.notifications = this.notifications.filter(item => item.id !== n.id);
        this.totalCount = Math.max(0, this.totalCount - 1);
        this.message = res.message || 'Notification deleted successfully.';
      },
      error: () => {
        this.deletingIds.delete(n.id);
        this.error = 'Failed to delete notification.';
      }
    });
  }
}
