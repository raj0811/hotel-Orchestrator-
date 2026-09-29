import { NativeConnection, Worker } from '@temporalio/worker';
import * as activities from './hotel.activities';

async function run() {
    const address = process.env.TEMPORAL_ADDRESS || 'localhost:7233';

    let connection: NativeConnection | undefined;

    while (!connection) {
        try {
            console.log(`Connecting to Temporal at ${address}...`);

            connection = await NativeConnection.connect({
                address,
            });

            console.log('Connected to Temporal');
        } catch (error) {
            console.log(
                'Temporal is not ready yet. Retrying in 5 seconds...',
            );

            await new Promise(resolve => setTimeout(resolve, 5000));
        }
    }

    const worker = await Worker.create({
        connection,
        workflowsPath: require.resolve('./hotel.workflow'),
        activities,
        taskQueue: 'hotel-task-queue',
    });

    console.log('Temporal worker started');

    await worker.run();
}

run().catch(error => {
    console.error('Worker failed:', error);
    process.exit(1);
});