export function getDOMElementById<T extends typeof Element>(id: string, type: T): InstanceType<T> {
    const el = document.getElementById(id);
    if (!el) {
        throw new Error(`Missing required element: #${id}`);
    }
    if (!(el instanceof type)) {
        throw new Error(`Expected #${id} to be a <${type.name}> element.`);
    }
    return el as InstanceType<T>;
}
