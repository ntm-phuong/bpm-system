import { WebPartContext } from '@microsoft/sp-webpart-base';

export interface IBpmSystemProps {
  description: string;
  userDisplayName: string;
  context: WebPartContext;
}