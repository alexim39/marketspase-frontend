// event.service.ts
import { Injectable } from '@angular/core';
import { Subject } from 'rxjs';

@Injectable({
  providedIn: 'root' 
})
export class SwitchUserRoleService {
  // Define the type of data the "radio station" will broadcast
  private switchTrigger = new Subject<string>(); 

  // Observable for components to subscribe to
  getSwitchRequest$ = this.switchTrigger.asObservable();

  // Method to push data to listeners
  sendSwitchRequest(role: string) {
    this.switchTrigger.next(role);
  }
}
