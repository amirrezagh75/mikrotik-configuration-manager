export function replaceLastSectionOfIp(ip: string, newLastSection: number): string {
    const updatedIp = ip.split('.').slice(0, 3).concat(newLastSection.toString()).join('.');
    return updatedIp;
}