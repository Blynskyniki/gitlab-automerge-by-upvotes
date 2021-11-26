import axios, { Axios, AxiosResponse } from 'axios';

const { CI_API_V4_URL = 'https://gitlab.kari.com/api/v4', GITLAB_TOKEN = 'secret' } = process.env;
const TARGET_BRANCH_COMMA_SEPARATED = (process.env.TARGET_BRANCH_COMMA_SEPARATED || 'developp').split(',');
const MINIMUN_UPVOTES_COUNT = Number.parseInt(process.env.MINIMUN_UPVOTES_COUNT || '2', 10);

interface IMergeRequestInfo {
  title: string;
  description: string;
  target_branch: string;
  source_branch: string;
  author: {
    name: string;
    username: string;
  },
  web_url: string;
  has_conflicts: boolean;
  upvotes: number;
  downvotes: number;
  iid: number;
  project_id: number;
  merge_status: string;
  blocking_discussions_resolved: boolean;
  draft: boolean;
  work_in_progress: boolean;
}

export class GitlabRepository {
  static MERGE_SUCCESS_STATUS = 'can_be_merged';

  static isAvailableToMerge(mergeRequest: IMergeRequestInfo) {

    return mergeRequest.merge_status === GitlabRepository.MERGE_SUCCESS_STATUS &&
      !mergeRequest.has_conflicts &&
      mergeRequest.blocking_discussions_resolved &&
      !mergeRequest.draft &&
      !mergeRequest.work_in_progress &&
      TARGET_BRANCH_COMMA_SEPARATED.includes(mergeRequest.target_branch) &&
      mergeRequest.upvotes >= MINIMUN_UPVOTES_COUNT && mergeRequest.downvotes === 0;
  }

  static toFlatMergeRequestInfo(mergeRequest: IMergeRequestInfo) {

    const {
      title,
      description,
      target_branch,
      source_branch,
      author: { name, username },
      has_conflicts,
      web_url,
      upvotes,
      downvotes,
      iid,
      project_id,
      merge_status,
      blocking_discussions_resolved,
      draft,
      work_in_progress,
    } = mergeRequest;
    return {
      title,
      description,
      target_branch,
      source_branch,
      name,
      username,
      web_url,
      has_conflicts,
      upvotes,
      downvotes,
      iid,
      project_id,
      merge_status,
      blocking_discussions_resolved,
      draft,
      work_in_progress,
    };
  }

  private instanse: Axios;

  constructor() {
    console.log('CI env ', {
      CI_API_V4_URL,
      GITLAB_TOKEN,
    }, 'TARGET_BRANCH_COMMA_SEPARATED', TARGET_BRANCH_COMMA_SEPARATED);

    this.instanse = axios.create({
      baseURL: CI_API_V4_URL,
      headers: {
        'PRIVATE-TOKEN': GITLAB_TOKEN,
      },
    });
  }

  public acceptMergeRequest(projectId: number, mergeRequestIId: number) {

    return this.instanse.put<unknown>(`/projects/${projectId}/merge_requests/${mergeRequestIId}/merge?merge_when_pipeline_succeeds=true&should_remove_source_branch=true`);
  }


  public getAllMergeRequests() {
    return this.instanse.get<unknown, AxiosResponse<IMergeRequestInfo[]>>('/merge_requests?state=opened&scope=all&target_branch=develop&order_by=updated_at');
  }
}
