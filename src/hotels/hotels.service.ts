import { Injectable, BadRequestException } from '@nestjs/common';
import { supplierA, supplierB } from 'src/utils/mockData';
import { RedisService } from 'src/redis/redis.service';
import { getTemporalClient } from 'src/temporal/temporal.client';
import { hotelWorkflow } from 'src/temporal/hotel.workflow';

@Injectable()
export class HotelsService {

    constructor(
        private readonly redisService: RedisService,
    ) { }

    getSupplierHotels(
        supplier: 'A' | 'B',
        city: string,
    ) {
        try {

            if (!city) {
                throw new BadRequestException('city is required');
            }

            const hotels = supplier === 'A' ? supplierA : supplierB;

            return hotels.filter(
                hotel => hotel.city.toLowerCase() === city.toLowerCase(),
            );
        } catch (e) {
            throw new BadRequestException(e.message)
        }
    }

    async getHotels(
        city: string,
        minPrice?: number,
        maxPrice?: number,
    ) {
        try {


            if (!city) {
                throw new BadRequestException('city is required');
            }

            // Unique cache key
            const cacheKey =
                `hotels:${city}:${minPrice ?? 'none'}:${maxPrice ?? 'none'}`;

            // 1. Check Redis
            const cachedHotels = await this.redisService.get(cacheKey);

            if (cachedHotels) {
                console.log('Returning data from Redis');

                return cachedHotels;
            }

            console.log('Starting Temporal workflow...');

            // 2. Get Temporal client
            const client = await getTemporalClient();

            // 3. Start Temporal workflow
            const result = await client.workflow.execute(hotelWorkflow, {
                taskQueue: 'hotel-task-queue',

                workflowId: `hotel-${city}-${Date.now()}`,

                args: [city],
            });

            // 4. Apply price filter
            let hotels = result;

            if (minPrice !== undefined) {
                hotels = hotels.filter(
                    hotel => hotel.price >= minPrice,
                );
            }

            if (maxPrice !== undefined) {
                hotels = hotels.filter(
                    hotel => hotel.price <= maxPrice,
                );
            }

            // 5. Save result to Redis
            await this.redisService.set(
                cacheKey,
                hotels,
            );

            return hotels;
        } catch (e) {
            throw new BadRequestException(e.message)
        }
    }

    async checkSuppliersHealth() {
        try {

            const supplierAHealthy = supplierA.length > 0;
            const supplierBHealthy = supplierB.length > 0;

            const allHealthy = supplierAHealthy && supplierBHealthy;

            return {
                status: allHealthy ? 'ok' : 'degraded',
                suppliers: {
                    supplierA: supplierAHealthy ? 'healthy' : 'unhealthy',
                    supplierB: supplierBHealthy ? 'healthy' : 'unhealthy',
                },
            };
        } catch (e) {
            throw new BadRequestException(e.message)
        }
    }
}