import { Routes } from "@angular/router";
import { AllUsersListComponent } from "./all-users-list.component";
import { UserDetailsComponent } from "./user-details/user-details.component";
import { MarketerUserMgtComponent } from "./marketers/marketer-users.component";
import { PromoterUserMgtComponent } from "./promoters/promoter-users.component";

export const UserRoutes: Routes = [
    {
        /* path: '',
        redirectTo: 'partner',
        pathMatch: 'full' */
        path: '',
        component: AllUsersListComponent,
        title: 'User Management - Admin Dashboard'
    },
    {   path: 'marketers', 
        component: MarketerUserMgtComponent,
        title: 'Marketers Details - Admin Dashboard'
    },
    {   path: 'promoters', 
        component: PromoterUserMgtComponent,
        title: 'Promoters Details - Admin Dashboard'
    },
    {   path: ':id', 
        component: UserDetailsComponent,
        title: 'User Details - Admin Dashboard'
    },
   
    
]
