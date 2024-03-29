import path from "path";

export const ROOT_PATH = path.join(__dirname, "..");
export const SRC_PATH = path.join(ROOT_PATH, "./core/");
export const EXTERNAL_PATH = path.join(SRC_PATH, "external");
export const IMAGES_PATH = path.join(ROOT_PATH, "./assets/images"); // alias has to be set in webpack+ts-config+postcss.config
export const DIST_PATH = path.join(ROOT_PATH, "build");
