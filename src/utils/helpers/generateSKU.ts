export const generateSKU = (productName: string): string => {
    const prefix = productName
        .substring(0, 3)
        .toUpperCase()
        .replace(/[^A-Z0-9]/g, "");

    const unique = Math.random().toString(36).substring(2, 7).toUpperCase();

    return `${prefix}-${unique}`;
};
