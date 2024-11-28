/* eslint-disable unicorn/prevent-abbreviations */
type Vector = [number, number, number];

/**
 * Test for collision between two links (a,b)
 * note: assuming B is a DrawTool line and can have longitude <-180 or >180
 */
export const lineCrossing = (a0: L.LatLng, a1: L.LatLng, b0: L.LatLng, b1: L.LatLng): boolean => {

    // zero length line tests
    if (a0.equals(a1)) return false;
    if (b0.equals(b1)) return false;

    // lines have a common point
    if (a0.equals(b0) || a0.equals(b1)) return false;
    if (a1.equals(b0) || a1.equals(b1)) return false;

    // check for 'horizontal' overlap in longitude (if not crossing antimeridian)
    const minA = Math.min(a0.lng, a1.lng);
    const maxA = Math.max(a0.lng, a1.lng);
    const b0Lng = ((b0.lng + 180) % 360 + 360) % 360 - 180; // wrap B because B can be out-of-bounds
    const b1Lng = ((b1.lng + 180) % 360 + 360) % 360 - 180;
    const minB = Math.min(b0Lng, b1Lng);
    const maxB = Math.max(b0Lng, b1Lng);
    if (maxA - minA < 180 && maxB - minB < 180) {
        if (minA > maxB) return false;
        if (maxA < minB) return false;
    }

    // convert to 3d
    const ca0 = toCartesian(a0);
    const ca1 = toCartesian(a1);
    const cb0 = toCartesian(b0);
    const cb1 = toCartesian(b1);

    // plane normales
    const da = cross(ca0, ca1);
    const db = cross(cb0, cb1);
    const da0 = cross(da, ca0);
    const da1 = cross(da, ca1);
    const db0 = cross(db, cb0);
    const db1 = cross(db, cb1);

    // the intersection line <=> collision point
    const p = cross(da, db);


    // rare special case when both lines are on the same geocircle
    const len2 = p[0] * p[0] + p[1] * p[1] + p[2] * p[2];
    if (len2 < 1e-30) /* === 0 */ {
        const s1 = dot(cb0, da0);
        const d1 = dot(cb0, da1);
        if ((s1 < 0 && d1 > 0) || (s1 > 0 && d1 < 0)) return true;
        const s2 = dot(cb1, da0);
        const d2 = dot(cb1, da1);
        if ((s2 < 0 && d2 > 0) || (s2 > 0 && d2 < 0)) return true;
        const s3 = dot(ca0, db0);
        const d3 = dot(ca0, db1);
        if ((s3 < 0 && d3 > 0) || (s3 > 0 && d3 < 0)) return true;
        return false;
    }

    // normalize
    const len = 1 / Math.sqrt(len2);
    p[0] *= len;
    p[1] *= len;
    p[2] *= len;

    // angels to positions
    const s = dot(p, da0);
    const d = dot(p, da1);
    const l = dot(p, db0);
    const f = dot(p, db1);

    if (s > 0 && d < 0 && l > 0 && f < 0) {
        return true;
    }

    if (s < 0 && d > 0 && l < 0 && f > 0) {
        // p inverted
        return true;
    }

    return false;
}


export const isPortalInField = (p: L.LatLng, field: [L.LatLng, L.LatLng, L.LatLng]): boolean => {

    if (p.equals(field[0]) || p.equals(field[1]) || p.equals(field[2])) return false;


    const ct1 = toCartesian(field[0]);
    const ct2 = toCartesian(field[1]);
    const ct3 = toCartesian(field[2]);
    const cp = toCartesian(p);

    const np1 = cross(ct1, ct2);
    const np2 = cross(ct2, ct3);
    const np3 = cross(ct3, ct1);

    const direction = dot(np1, ct3);

    const d1 = dot(np1, cp) * direction;
    const d2 = dot(np2, cp) * direction;
    const d3 = dot(np3, cp) * direction;

    return (d1 > 0 && d2 > 0 && d3 > 0);
}

/**
 * Calculate on which side of the line (ab) point (x) is
 * @returns >0 right; <0 left
 */
export const whichSide = (a: L.LatLng, b: L.LatLng, x: L.LatLng): number => {
    const ac = toCartesian(a);
    const bc = toCartesian(b);
    const xc = toCartesian(x);

    const np = cross(bc, ac);
    return dot(np, xc);
}


// ////////////////////////////////////////////////////////
// TODO: this stuff should move to S2-math
const d2r = Math.PI / 180;

const toCartesian = (p: L.LatLng): Vector => {

    const lat = p.lat * d2r;
    const lng = p.lng * d2r;
    const o = Math.cos(lat);
    return [o * Math.cos(lng), o * Math.sin(lng), Math.sin(lat)];
}

const cross = (t: Vector, n: Vector): Vector => {
    return [t[1] * n[2] - t[2] * n[1], t[2] * n[0] - t[0] * n[2], t[0] * n[1] - t[1] * n[0]];
}

const dot = (t: Vector, n: Vector): number => {
    return t[0] * n[0] + t[1] * n[1] + t[2] * n[2];
}
// ////////////////////////////////////////////////////////
