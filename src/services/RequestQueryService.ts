import { RequestRepository } from "../repositories/RequestRepository";
import { IRequest, parseHistoryApproval } from "../models";

export class RequestQueryService {
  private _requestRepo = new RequestRepository();

  getAllRequests(top = 100): Promise<IRequest[]> {
    return this._requestRepo.getAllRequests(top);
  }

  getMyRequests(currentUserId: number, top = 100): Promise<IRequest[]> {
    return this._requestRepo.getMyRequests(currentUserId, top);
  }

  getPendingRequests(currentUserId: number, top = 100): Promise<IRequest[]> {
    return this._requestRepo.getPendingRequests(currentUserId, top);
  }

  async getProcessedRequests(
    currentUserId: number,
    top = 500
  ): Promise<IRequest[]> {
    const requests = await this._requestRepo.getRequests({ top });

    return requests.filter(request => {
      const history = parseHistoryApproval(request.HistoryApproval);

      return history.some(
        item =>
          item.actorId === currentUserId &&
          item.action !== "Submitted"
      );
    });
  }
}