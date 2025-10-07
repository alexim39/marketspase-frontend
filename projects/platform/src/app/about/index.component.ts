import { Component } from '@angular/core';
import { RouterModule } from '@angular/router';

@Component({
    selector: 'app-about-index',
    imports: [RouterModule],
    template: `
    <router-outlet/>
    `,
})
export class AboutIndexComponent {}