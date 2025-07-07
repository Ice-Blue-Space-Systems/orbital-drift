export const getCesiumDate = (iso: string) => new Date(iso);
export const getCesiumUTC = (iso: string) => new Date(iso).toUTCString();
export const getCesiumLocal = (iso: string) => new Date(iso).toLocaleString();