import { Component, OnInit } from '@angular/core';
import { Toast, NotificationService } from '../../../core/services/notification.service';

@Component({
  selector: 'app-toast',
  templateUrl: './toast.component.html',
  styleUrls: ['./toast.component.css']
})
export class ToastComponent implements OnInit {
  toasts: Toast[] = [];

  constructor(private notificationService: NotificationService) {}

  ngOnInit(): void {
    this.notificationService.toasts$.subscribe(toasts => {
      this.toasts = toasts;
    });
  }

  removeToast(id: string): void {
    this.notificationService.remove(id);
  }

  getToastClass(type: string): string {
    return {
      success: 'toast-success',
      error: 'toast-error',
      info: 'toast-info',
      warning: 'toast-warning'
    }[type] || 'toast-info';
  }

  getIconClass(type: string): string {
    return {
      success: 'bi-check-circle-fill',
      error: 'bi-exclamation-circle-fill',
      info: 'bi-info-circle-fill',
      warning: 'bi-exclamation-triangle-fill'
    }[type] || 'bi-info-circle-fill';
  }
}
