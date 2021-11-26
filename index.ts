import { setTimeout } from 'timers/promises';
import { GitlabRepository } from './gitlab.repository';

const DEFAULT_TIMEOUT = Number.parseInt(process.env.DEFAULT_TIMEOUT || '10000', 10);

async function main(...args:unknown[]) {
  const gitlab = new GitlabRepository();
  while (true) {
    try {

      const mergeRequestData = await gitlab.getAllMergeRequests();
      const mergeRequests = mergeRequestData.data;
      for (const mergeRequest of mergeRequests) {

        if (
          GitlabRepository.isAvailableToMerge(mergeRequest)
        ) {

          console.log('Готов к автомержу', GitlabRepository.toFlatMergeRequestInfo(mergeRequest));
          await gitlab.acceptMergeRequest(mergeRequest.project_id, mergeRequest.iid);
        } else {
          console.log('Кандидат на автомерж не прошел проверку', mergeRequest.iid, mergeRequest.title);
        }


      }
      console.log('Проверка окончена, уходим на следующий круг');
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
