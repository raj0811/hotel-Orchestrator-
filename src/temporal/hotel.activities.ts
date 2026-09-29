import { supplierA, supplierB } from '../utils/mockData';

export async function fetchSupplierA(city: string) {
    try {
        console.log(`[Supplier A] Fetching hotels for city: ${city}`);

        const hotels = supplierA.filter(
            hotel => hotel.city.toLowerCase() === city.toLowerCase(),
        );

        console.log(
            `[Supplier A] Successfully fetched ${hotels.length} hotels for city: ${city}`,
        );

        return hotels;
    } catch (error) {
        console.error(
            `[Supplier A] Failed to fetch hotels for city: ${city}`,
            error,
        );

        throw error;
    }
}

export async function fetchSupplierB(city: string) {
    try {
        console.log(`[Supplier B] Fetching hotels for city: ${city}`);

        const hotels = supplierB.filter(
            hotel => hotel.city.toLowerCase() === city.toLowerCase(),
        );

        console.log(
            `[Supplier B] Successfully fetched ${hotels.length} hotels for city: ${city}`,
        );

        return hotels;
    } catch (error) {
        console.error(
            `[Supplier B] Failed to fetch hotels for city: ${city}`,
            error,
        );

        throw error;
    }
}