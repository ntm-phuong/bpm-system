import { BaseRepository } from "./BaseRepository";
import { IAttachmentFile, IComment } from "../models/IComment";
import { LISTS } from "../constants/lists";


interface ICommentRawAttachment {
  FileName?: string;
  ServerRelativeUrl?: string;
}

interface ICommentRaw {
  Id: number;
  Title: string;
  RequestIDId: number;
  Content?: string;
  Created: string;
  CommentById?: number;
  CommentBy?: {
    Id?: number;
    Title?: string;
    EMail?: string;
    Name?: string;
  };
  AttachmentFiles?: ICommentRawAttachment[];
}

export interface ICreateCommentInput {
  requestId: number;
  content?: string;
  commentById: number;
}

export interface ICreateCommentWithAttachmentsInput extends ICreateCommentInput {
  files?: File[];
}


const COMMENT_SELECT = [
  "Id",
  "Title",
  "RequestIDId",
  "Content",
  "Created",
  "CommentById",
  "CommentBy/Id",
  "CommentBy/Title",
  "CommentBy/EMail",
  "AttachmentFiles",
] as const;

const COMMENT_EXPAND = ["CommentBy", "AttachmentFiles"] as const;

export class CommentRepository extends BaseRepository {
  async getCommentsByRequestId(requestId: number): Promise<IComment[]> {
    try {
      const items = (await this.sp.web.lists
        .getByTitle(LISTS.COMMENTS)
        .items.select(...COMMENT_SELECT)
        .expand(...COMMENT_EXPAND)
        .filter(`RequestIDId eq ${requestId}`)
        .orderBy("Created", false)()) as ICommentRaw[];

      return items.map((item) => this._mapComment(item));
    } catch (error) {
      return this.handleError(error, "getCommentsByRequestId");
    }
  }

  async createComment(input: ICreateCommentInput): Promise<number> {
    try {
      const result = await this.sp.web.lists.getByTitle(LISTS.COMMENTS).items.add({
        Title: `Comment-${input.requestId}-${Date.now()}`,
        RequestIDId: input.requestId,
        Content: input.content?.trim() ?? "",
        CommentById: input.commentById,
      });

      return result.Id as number;
    } catch (error) {
      return this.handleError(error, "createComment");
    }
  }

  async addAttachments(commentId: number, files: File[]): Promise<void> {
    try {
      if (!files.length) {
        return;
      }

      const item = this.sp.web.lists
        .getByTitle(LISTS.COMMENTS)
        .items.getById(commentId);

      for (const file of files) {
        await item.attachmentFiles.add(file.name, file);
      }
    } catch (error) {
      this.handleError(error, "addAttachments");
    }
  }

  async createCommentWithAttachments(
    input: ICreateCommentWithAttachmentsInput,
  ): Promise<void> {
    try {
      const commentId = await this.createComment(input);
      await this.addAttachments(commentId, input.files ?? []);
    } catch (error) {
      this.handleError(error, "createCommentWithAttachments");
    }
  }

  private _mapComment(raw: ICommentRaw): IComment {
    const attachments = Array.isArray(raw.AttachmentFiles)
      ? raw.AttachmentFiles
          .map(
            (file): IAttachmentFile => ({
              FileName: file.FileName ?? "",
              ServerRelativeUrl: file.ServerRelativeUrl ?? "",
            }),
          )
          .filter((file) => file.FileName && file.ServerRelativeUrl)
      : [];

    return {
      Id: raw.Id,
      Title: raw.Title,
      RequestIDId: raw.RequestIDId,
      Content: raw.Content ?? "",
      Created: raw.Created,
      CommentById: raw.CommentById,
      CommentBy: this.mapPerson(raw as unknown as Record<string, unknown>, "CommentBy"),
      AttachmentFiles: attachments,
    };
  }
}