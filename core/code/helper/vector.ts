export type XYZ = [number, number, number];
export type LatLng = { lat: number; lng: number };


export const LatLngToXYZ = (latLng: LatLng): XYZ => {
    const d2r = Math.PI / 180.0;

    const phi = latLng.lat * d2r;
    const theta = latLng.lng * d2r;

    const cosphi = Math.cos(phi);

    return [Math.cos(theta) * cosphi, Math.sin(theta) * cosphi, Math.sin(phi)];
}

export const XYZToLatLng = (xyz: XYZ): LatLng => {
    const r2d = 180.0 / Math.PI;

    const lat = Math.atan2(xyz[2], Math.sqrt(xyz[0] * xyz[0] + xyz[1] * xyz[1]));
    const lng = Math.atan2(xyz[1], xyz[0]);

    return { lat: lat * r2d, lng: lng * r2d };
}

export const XYZToLLatLng = (xyz: XYZ): L.LatLng => {
    const r2d = 180.0 / Math.PI;

    const lat = Math.atan2(xyz[2], Math.sqrt(xyz[0] * xyz[0] + xyz[1] * xyz[1]));
    const lng = Math.atan2(xyz[1], xyz[0]);

    return L.latLng(lat * r2d, lng * r2d);
}


export const cross = (a: XYZ, b: XYZ): XYZ => {
    return [
        a[1] * b[2] - a[2] * b[1],
        a[2] * b[0] - a[0] * b[2],
        a[0] * b[1] - a[1] * b[0],
    ];
}

export const dot = (a: XYZ, b: XYZ): number => {
    return a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
}

export const det = (a: XYZ, b: XYZ, c: XYZ): number => {
    return dot(cross(a, b), c);
}

export const minus = (a: XYZ, b: XYZ): XYZ => {
    return [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
}

export const move = (start: XYZ, direction: XYZ, distance: number): XYZ => {
    return [start[0] + direction[0] * distance, start[1] + direction[1] * distance, start[2] + direction[2] * distance];
}

export const equals = (a: XYZ, b: XYZ): boolean => {
    const margin = Math.max(
        Math.abs(a[0] - b[0]),
        Math.abs(a[1] - b[1]),
        Math.abs(a[2] - b[2])
    );

    return margin <= 1.0E-9;
}