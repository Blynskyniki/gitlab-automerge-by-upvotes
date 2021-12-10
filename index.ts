import { setTimeout } from 'timers/promises';
import { GitlabRepository, IMergeRequestInfo } from './gitlab.repository';

const DEFAULT_TIMEOUT = Number.parseInt(process.env.DEFAULT_TIMEOUT || '10000', 10);
const MINIMUN_APROVALS_COUNT = Number.parseInt(process.env.MINIMUN_APROVALS_COUNT || '2', 10);

type  CheckRequestInfo =
  Pick<IMergeRequestInfo, 'iid' | 'title' | 'project_id'>
  & Record<'ApproveCount', number>
  & Record<'user_can_approve', boolean>


async function main(...args: unknown[]) {
  const gitlab = new GitlabRepository();
  while (true) {
    try {

      const mergeRequestData = await gitlab.getAllMergeRequests();
      const result: CheckRequestInfo[] = [];
      for (const mergeRequest of mergeRequestData.data) {
        const { title, iid, project_id } = mergeRequest;
        if (
          GitlabRepository.isAvailableToMerge(mergeRequest)
        ) {
          const approvals = await gitlab.getApprovalsFor(project_id, iid);
          const { approved, approved_by, user_can_approve } = approvals.data;
          result.push({
            title,
            iid,
            project_id,
            ApproveCount: approved_by.length,
            user_can_approve,
          });
          if (approved && approved_by.length >= MINIMUN_APROVALS_COUNT) {

            await gitlab.acceptMergeRequest(mergeRequest.project_id, mergeRequest.iid);

          }

        }


      }
      console.table(result);
      await setTimeout(DEFAULT_TIMEOUT);

    } catch (err) {
      console.error(err);
    }

  }

}

main().catch(e => {
  console.error(e);
  process.exit(1);
});
