import { Component } from '@angular/core';
import { QuickOrderService } from '../../core/services/quick-order.service';

@Component({
  selector: 'app-quick-order',
  templateUrl: './quick-order.component.html',
  styleUrls: ['./quick-order.component.css']
})
export class QuickOrderComponent {
  tableData: { sku: string; quantity: number }[] = [];

  constructor(private quickOrderService: QuickOrderService) {}

  onFileUpload(event: any): void {
    const file = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e: any) => {
        const csvData = e.target.result;
        this.parseCsvData(csvData);
      };
      reader.readAsText(file);
    }
  }

  parseCsvData(csvData: string): void {
    const rows = csvData.split('\n');
    this.tableData = rows.slice(1).map(row => {
      const [sku, quantity] = row.split(',');
      return { sku: sku.trim(), quantity: +quantity.trim() };
    });
  }

  downloadCsv(): void {
    const csvContent = 'SKU,Quantity\n' + this.tableData.map(row => `${row.sku},${row.quantity}`).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'QuickOrder_Export.csv';
    a.click();
    window.URL.revokeObjectURL(url);
  }
}