import moment from "moment";
import { HeaderObject } from "webpack-userscript";

const getBuildDate = () => {
    return moment().utc().format("YYYY-MM-DD-HHmmSS");
};

const getBuildNumber = () => {
    return moment().utc().format("YYYYMMDD.HmmSS");
};

export const environment = {
    BUILD_NAME: process.env.NODE_ENV === "production" ? "" : "-dev",
    BUILD_DATE: getBuildDate(),
};

export const generateHeader = (): HeaderObject => ({
    "id": "ingress-intel-total-conversion@McBen",
    "name": "IITC: Ingress intel map total conversion R",
    "run-at": "document-end",
    // "match": ["https://intel.ingress.com/*", "https://intel-x.ingress.com/*"],
    "match": "https://intel-x.ingress.com/*",
    "grant": "none",
    "version": `1.0.0.${getBuildNumber()}`,
    "description": `[${environment.BUILD_DATE}${environment.BUILD_NAME}] Total conversion for the ingress intel map - Refurbished.`,
    "downloadURL": `${process.env.downloadURL}`
});
