import { proxyActivities } from '@temporalio/workflow';

import type * as activities from './hotel.activities';

const { fetchSupplierA, fetchSupplierB } = proxyActivities<
    typeof activities
>({
    startToCloseTimeout: '10 seconds',
});

export async function hotelWorkflow(city: string) {

    // Call both suppliers in parallel
    const [hotelsA, hotelsB] = await Promise.all([
        fetchSupplierA(city),
        fetchSupplierB(city),
    ]);

    const hotelsMap = new Map();

    // Supplier A
    for (const hotel of hotelsA) {
        hotelsMap.set(hotel.name, {
            ...hotel,
            supplier: 'Supplier A',
        });
    }

    // Supplier B
    for (const hotel of hotelsB) {
        const existing = hotelsMap.get(hotel.name);

        if (!existing || hotel.price < existing.price) {
            hotelsMap.set(hotel.name, {
                ...hotel,
                supplier: 'Supplier B',
            });
        }
    }

    return Array.from(hotelsMap.values());
}