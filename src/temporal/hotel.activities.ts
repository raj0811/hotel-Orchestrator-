import { supplierA, supplierB } from '../utils/mockData';

export async function fetchSupplierA(city: string) {
    return supplierA.filter(
        hotel => hotel.city.toLowerCase() === city.toLowerCase(),
    );
}

export async function fetchSupplierB(city: string) {
    return supplierB.filter(
        hotel => hotel.city.toLowerCase() === city.toLowerCase(),
    );
}