import { Worker } from '@temporalio/worker';
import * as activities from './hotel.activities';

async function run() {
    const worker = await Worker.create({
        workflowsPath: require.resolve('./hotel.workflow'),
        activities,
        taskQueue: 'hotel-task-queue',
    });

    console.log('Temporal worker started');

    await worker.run();
}

run().catch(err => {
    console.error(err);
    process.exit(1);
});