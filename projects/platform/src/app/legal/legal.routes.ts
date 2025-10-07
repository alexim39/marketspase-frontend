import { Routes } from "@angular/router";
import { LegalComponent } from "./legal.component";
import { TermsComponent } from "./terms/terms.component";
import { PrivacyComponent } from "./privacy/privacy.component";
import { CookiesComponent } from "./cookies/cookies.component";

export const legalRoutes: Routes = [
    { 
        path: '', 
        //component: IndexComponent, 

        children: [
            { path: '', 
                component: LegalComponent, 
                title: "MarketSpase Legal - Terms and conditions of website use",
                //redirectTo: 'terms',
                //pathMatch: 'prefix',
                children: [
                    { path: 'cookies', 
                        component: CookiesComponent, 
                        title: "Legal - Cookies terms of use"
                    },
                    { path: 'terms', 
                        component: TermsComponent, 
                        title: "Legal - Terms of use"
                    },
                    { path: 'privacy', 
                        component: PrivacyComponent, 
                        title: "Legal - Privacy terms of use"
                    },
                ]
            },
           

        ]
    },

]
