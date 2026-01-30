import { Routes } from "@angular/router";

export const UserRoutes: Routes = [
    {
        /* path: '',
        redirectTo: 'partner',
        pathMatch: 'full' */
        path: '',
        loadComponent: () => import('./all-users-list.component').then(c => c.AllUsersListComponent),
        title: 'User Management - Admin Dashboard'
    },
    {   path: 'marketers', 
        loadComponent: () => import('./marketers/marketer-users.component').then(c => c.MarketerUserMgtComponent),
        title: 'Marketers Details - Admin Dashboard'
    },
    {   path: 'promoters', 
        loadComponent: () => import('./promoters/promoter-users.component').then(c => c.PromoterUserMgtComponent),
        title: 'Promoters Details - Admin Dashboard'
    },
    {   path: 'contacts', 
        loadComponent: () => import('./../contact-mgt/contact-management.component').then(c => c.ContactManagementComponent),
        title: 'Contacts Management - Admin Dashboard'
    }, 
    {   path: ':id', 
        loadComponent: () => import('./user-details/user-details.component').then(c => c.UserDetailsComponent),
        title: 'User Details - Admin Dashboard'
    },
   
    
]
