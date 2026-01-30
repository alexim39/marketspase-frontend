
import { Component, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatRadioModule } from '@angular/material/radio';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';

@Component({
  selector: 'app-export-dialog',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatDialogModule,
    MatButtonModule,
    MatRadioModule,
    MatFormFieldModule,
    MatSelectModule,
    MatCheckboxModule,
    MatIconModule,
    MatCardModule
  ],
  templateUrl: './export-dialog.component.html',
  styleUrls: ['./export-dialog.component.scss']
})
export class ExportDialogComponent {
  exportFormat = 'csv';
  includeFields = [
    { id: 'user', label: 'User Info', checked: true },
    { id: 'subject', label: 'Subject', checked: true },
    { id: 'message', label: 'Message', checked: true },
    { id: 'status', label: 'Status', checked: true },
    { id: 'priority', label: 'Priority', checked: true },
    { id: 'createdAt', label: 'Date Created', checked: true },
    { id: 'assignedTo', label: 'Assigned To', checked: false },
    { id: 'userEmail', label: 'User Email', checked: false },
    { id: 'userPhone', label: 'User Phone', checked: false },
    { id: 'tags', label: 'Tags', checked: false },
    { id: 'adminNotes', label: 'Admin Notes', checked: false }
  ];

  constructor(
    public dialogRef: MatDialogRef<ExportDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: {
      filters: any;
    }
  ) {}

  get formats() {
    return [
      { value: 'csv', label: 'CSV', icon: 'grid_on', description: 'Compatible with Excel, Google Sheets' },
      { value: 'excel', label: 'Excel', icon: 'table_chart', description: 'Microsoft Excel format (.xlsx)' },
      { value: 'json', label: 'JSON', icon: 'code', description: 'Structured data format' }
    ];
  }

  selectAll(checked: boolean): void {
    this.includeFields.forEach(field => field.checked = checked);
  }

  export(): void {
    const exportData = {
      format: this.exportFormat,
      fields: this.includeFields.filter(f => f.checked).map(f => f.id),
      filters: this.data.filters
    };
    this.dialogRef.close(exportData);
  }

  getSelectedCount(): number {
    return this.includeFields.filter(f => f.checked).length;
  }
}
