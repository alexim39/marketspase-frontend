import { Routes } from "@angular/router";

export const ContactsRoutes: Routes = [
  {
    path: "",
    loadComponent: () =>
      import("./contacts-index/contacts-index.component").then(
        (c) => c.ContactsIndexComponent
      ),
    title: "Customer Contacts — CRM",
  },
  {
    path: ":id",
    loadComponent: () =>
      import("./contact-detail/contact-detail.component").then(
        (c) => c.ContactDetailComponent
      ),
    title: "Contact Details",
  },
];
