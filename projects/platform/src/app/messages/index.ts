// Adapter — re-exports collaboration UI from the messages module.
// This enables routes to reference a clean 'messages' import path
// without moving files. The actual migration can happen later.
export { CampaignCollaborationIndexComponent } from '../campaign/collaboration/index';
export { CampaignCollaborationComponent } from '../campaign/collaboration/collaboration.component';
export { CampaignCollaborationMobileComponent } from '../campaign/collaboration/mobile/campaign-collaboration-mobile.component';
