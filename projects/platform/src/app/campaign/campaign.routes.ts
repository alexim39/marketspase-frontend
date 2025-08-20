import { Routes } from "@angular/router";
import { Index } from "./index";
import { CreateCampaignComponent } from "./create/create-campaign.component";

export const CampaignRoutes: Routes = [
    {
        /* path: '',
        redirectTo: 'partner',
        pathMatch: 'full' */
        path: '',
        component: Index,
        children: [
            {
                path: '',
                //component: DashboardMainContainer,
                children: [
                    { path: 'new', 
                        component: CreateCampaignComponent, 
                        title: "Create New Campaign",
                    },
                   /*  {   path: 'search',
                        component: SearchResultContainerComponent, 
                        title: "Partners Search - Partners result details"
                    }, */
                    /* { path: 'get-involved', 
                        component: GettingInvolvedComponent, 
                        title: "Project Summary - Get involved as a member"
                    }, */
        
                ]
            }, 
        ]
    },
]
