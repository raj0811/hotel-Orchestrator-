import { Controller, Get, Query } from '@nestjs/common';
import { HotelsService } from './hotels.service';

@Controller()
export class HotelsController {
    constructor(private readonly hotelsService: HotelsService) { }

    @Get('supplierA/hotels')
    getSupplierAHotels(@Query('city') city: string) {
        return this.hotelsService.getSupplierHotels('A', city);
    }

    @Get('supplierB/hotels')
    getSupplierBHotels(@Query('city') city: string) {
        return this.hotelsService.getSupplierHotels('B', city);
    }

    @Get('api/hotels')
    getHotels(
        @Query('city') city: string,
        @Query('minPrice') minPrice?: string,
        @Query('maxPrice') maxPrice?: string,
    ) {
        return this.hotelsService.getHotels(
            city,
            minPrice ? Number(minPrice) : undefined,
            maxPrice ? Number(maxPrice) : undefined,
        );
    }
}