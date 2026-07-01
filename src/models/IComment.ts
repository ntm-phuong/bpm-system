import { IPerson } from "./IPerson";
export interface IAttachmentFile {
  FileName: string;
  ServerRelativeUrl: string;
}
export interface IComment {
  Id: number;
  Title: string;
  RequestIDId: number;            // Lookup
  Content: string;
  CommentBy?: IPerson; 
  CommentById?: number;           // Person
  Created: string;  
  AttachmentFiles?: IAttachmentFile[];
}