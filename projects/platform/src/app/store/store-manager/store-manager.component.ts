import { Component, inject, signal, Input  } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialogModule, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog'; // Add MAT_DIALOG_DATA
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatSnackBar } from '@angular/material/snack-bar';
import { StoreService } from '../services/store.service';
import { Store } from '../models/store.model';
import { Router } from '@angular/router';
import {MatProgressBarModule} from '@angular/material/progress-bar';


@Component({
  selector: 'app-store-manager',
  standalone: true,
  imports: [
    CommonModule,
    MatDialogModule,
    MatButtonModule,
    MatCardModule,
    MatIconModule,
    MatMenuModule,
    MatProgressBarModule
  ],
  templateUrl: './store-manager.component.html',
  styleUrls: ['./store-manager.component.scss']
})
export class StoreManagerComponent {
  private storeService = inject(StoreService);
  private snackBar = inject(MatSnackBar);
  public dialogRef = inject(MatDialogRef<StoreManagerComponent>);
  private dialogData = inject(MAT_DIALOG_DATA); // Inject the dialog data
  private router = inject(Router);
  
  // Remove @Input() decorator since we're using dialog data instead
  stores: Store[] = [];
  storesSignal = signal<Store[]>([]);
  loading = signal<boolean>(false);
  
 ngOnInit() {
    // Use the dialog data passed from parent
    this.stores = this.dialogData?.stores.data || [];
    this.loadStores();
  }
  
  loadStores() {
    // Get stores from dialog data
    this.storesSignal.set(this.stores);
  }
  
  setAsDefault(store: Store) {
    this.loading.set(true);
    this.storeService.setDefaultStore(store!).subscribe({
        next: (updatedStore) => {
            console.log('returned messge ', updatedStore)
            this.snackBar.open(`${updatedStore.message}`, 'OK', { duration: 3000 });
            this.dialogRef.close(true);
            this.loading.set(false);
        },
        error: (error) => {
            this.snackBar.open('Failed to set default store', 'OK', { duration: 3000 });
            this.loading.set(false);
        }
    });
  }
  
  viewStore(store: Store) {
    this.storeService.setCurrentStore(store);
    this.dialogRef.close(true);
  }
  
  editStore(store: Store) {
    // Navigate to edit page
    this.dialogRef.close();
    // You'd implement navigation here
  }
  
  archiveStore(store: Store) {
    // Implement archive logic
  }
  
  createNewStore() {
    this.router.navigate(['/dashboard/stores/create']);
    this.dialogRef.close(true);
  }
}