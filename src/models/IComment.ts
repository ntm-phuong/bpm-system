import { IPerson } from "./IPerson";

export interface IComment {
  Id: number;
  Title: string;
  RequestIDId: number;            // Lookup
  Content: string;
  CommentBy?: IPerson; 
  CommentById?: number;           // Person
  CreatedDate: string;            // ISO Date string
}